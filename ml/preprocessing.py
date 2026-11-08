"""
Preprocessing module for Pneumonia Detection pipeline.

Handles image loading, resizing, normalization, and tf.data.Dataset creation
for train/val/test splits. Uses MobileNetV2 preprocessing.
"""

import os
import numpy as np
import tensorflow as tf
from pathlib import Path


# Constants
IMG_SIZE = (224, 224)
IMG_SHAPE = (224, 224, 3)
BATCH_SIZE = 32
CLASS_NAMES = ["NORMAL", "PNEUMONIA"]
CLASS_MAP = {"NORMAL": 0, "PNEUMONIA": 1}
AUTOTUNE = tf.data.AUTOTUNE


def load_and_preprocess_image(image_path, label):
    """
    Load a single image from disk, resize, convert to RGB, and apply
    MobileNetV2 preprocessing.

    Args:
        image_path: tf.string tensor with the file path.
        label: Integer label (0=NORMAL, 1=PNEUMONIA).

    Returns:
        Tuple of (preprocessed_image, label).
    """
    # Read raw file bytes
    raw = tf.io.read_file(image_path)
    # Decode image (handles JPEG, PNG, BMP, GIF)
    image = tf.image.decode_image(raw, channels=3, expand_animations=False)
    # Ensure static shape for downstream layers
    image.set_shape([None, None, 3])
    # Resize to target dimensions
    image = tf.image.resize(image, IMG_SIZE)
    # Cast to float32 before MobileNetV2 preprocessing
    image = tf.cast(image, tf.float32)
    # Apply MobileNetV2 preprocessing (scales pixels to [-1, 1])
    image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
    return image, label


def collect_file_paths_and_labels(split_dir):
    """
    Walk a split directory (e.g., train/) and collect all image file paths
    with their corresponding labels.

    Args:
        split_dir: Path to the split directory containing class subfolders.

    Returns:
        Tuple of (file_paths list, labels list).
    """
    file_paths = []
    labels = []
    split_dir = Path(split_dir)

    for class_name in CLASS_NAMES:
        class_dir = split_dir / class_name
        if not class_dir.exists():
            print(f"  [WARNING] Class directory not found: {class_dir}")
            continue

        # Supported image extensions
        extensions = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tiff"}
        for file_path in sorted(class_dir.iterdir()):
            if file_path.suffix.lower() in extensions and file_path.is_file():
                file_paths.append(str(file_path))
                labels.append(CLASS_MAP[class_name])

    return file_paths, labels


def create_dataset(split_dir, batch_size=BATCH_SIZE, shuffle=False, augment_fn=None):
    """
    Create a tf.data.Dataset pipeline from a split directory.

    Args:
        split_dir: Path to the split directory (train/val/test).
        batch_size: Number of images per batch.
        shuffle: Whether to shuffle the dataset.
        augment_fn: Optional augmentation function/layer to apply (training only).

    Returns:
        tf.data.Dataset yielding (image_batch, label_batch).
    """
    file_paths, labels = collect_file_paths_and_labels(split_dir)

    if len(file_paths) == 0:
        raise ValueError(f"No images found in {split_dir}. Check directory structure.")

    print(f"  Found {len(file_paths)} images in {split_dir}")
    for class_name in CLASS_NAMES:
        count = sum(1 for l in labels if l == CLASS_MAP[class_name])
        print(f"    {class_name}: {count}")

    # Create dataset from file paths and labels
    dataset = tf.data.Dataset.from_tensor_slices((file_paths, labels))

    if shuffle:
        dataset = dataset.shuffle(buffer_size=len(file_paths), seed=42)

    # Load and preprocess images (parallel mapping)
    dataset = dataset.map(load_and_preprocess_image, num_parallel_calls=AUTOTUNE)

    # Batch
    dataset = dataset.batch(batch_size)

    # Apply augmentation after batching (if provided)
    if augment_fn is not None:
        dataset = dataset.map(
            lambda x, y: (augment_fn(x, training=True), y),
            num_parallel_calls=AUTOTUNE,
        )

    # Prefetch for performance
    dataset = dataset.prefetch(AUTOTUNE)

    return dataset


def create_datasets(dataset_root, batch_size=BATCH_SIZE, augment_fn=None):
    """
    Create train, validation, and test datasets from the standard directory layout.

    Expected structure:
        dataset_root/
            train/
                NORMAL/
                PNEUMONIA/
            val/
                NORMAL/
                PNEUMONIA/
            test/
                NORMAL/
                PNEUMONIA/

    Args:
        dataset_root: Root path of the chest_xray dataset.
        batch_size: Batch size for all splits.
        augment_fn: Augmentation layer/function applied to the training set only.

    Returns:
        Tuple of (train_ds, val_ds, test_ds).
    """
    dataset_root = Path(dataset_root)

    print("Loading training set...")
    train_ds = create_dataset(
        dataset_root / "train", batch_size=batch_size, shuffle=True, augment_fn=augment_fn
    )

    print("Loading validation set...")
    val_ds = create_dataset(
        dataset_root / "val", batch_size=batch_size, shuffle=False
    )

    print("Loading test set...")
    test_ds = create_dataset(
        dataset_root / "test", batch_size=batch_size, shuffle=False
    )

    return train_ds, val_ds, test_ds


def preprocess_single_image(image_path):
    """
    Preprocess a single image for inference. Used by the backend API.

    Args:
        image_path: String path to the image file.

    Returns:
        Preprocessed image as a numpy array with batch dimension: shape (1, 224, 224, 3).
    """
    image_path = str(image_path)
    raw = tf.io.read_file(image_path)
    image = tf.image.decode_image(raw, channels=3, expand_animations=False)
    image.set_shape([None, None, 3])
    image = tf.image.resize(image, IMG_SIZE)
    image = tf.cast(image, tf.float32)
    image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
    # Add batch dimension
    image = tf.expand_dims(image, axis=0)
    return image.numpy()


def preprocess_uploaded_image(image_array):
    """
    Preprocess an image that is already loaded as a numpy array (e.g., from an upload).

    Args:
        image_array: Numpy array of the image (H, W, C) in uint8 or float.

    Returns:
        Preprocessed image as a numpy array with batch dimension: shape (1, 224, 224, 3).
    """
    image = tf.convert_to_tensor(image_array)
    # Ensure 3 channels
    if len(image.shape) == 2:
        image = tf.expand_dims(image, axis=-1)
    if image.shape[-1] == 1:
        image = tf.image.grayscale_to_rgb(image)
    elif image.shape[-1] == 4:
        image = image[:, :, :3]

    image = tf.image.resize(image, IMG_SIZE)
    image = tf.cast(image, tf.float32)
    image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
    image = tf.expand_dims(image, axis=0)
    return image.numpy()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test preprocessing pipeline")
    parser.add_argument(
        "--dataset",
        type=str,
        default="ml/dataset/chest_xray",
        help="Path to the chest_xray dataset root",
    )
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        print(f"Dataset not found at: {dataset_path.resolve()}")
        print("Please download the Chest X-Ray dataset and place it at the expected path.")
    else:
        print(f"Dataset root: {dataset_path.resolve()}")
        train_ds, val_ds, test_ds = create_datasets(str(dataset_path))

        # Quick sanity check
        for images, labels in train_ds.take(1):
            print(f"\nBatch shape: {images.shape}")
            print(f"Label shape: {labels.shape}")
            print(f"Pixel range: [{images.numpy().min():.2f}, {images.numpy().max():.2f}]")
            print(f"Labels in batch: {labels.numpy()}")
