"""
Data augmentation module for Pneumonia Detection pipeline.

Provides training-time augmentation using tf.keras.layers.
NO horizontal flip is applied — medical chest X-rays must maintain
anatomical orientation (heart on the left side).
"""

import tensorflow as tf


def get_augmentation_layer():
    """
    Build and return a Sequential augmentation layer for training images.

    Augmentations applied:
        - RandomRotation: ±5% of a full rotation (~±18°)
        - RandomZoom: ±10%
        - RandomTranslation: ±5% height and width
        - RandomContrast: ±10%

    No horizontal flip is used because chest X-rays should preserve
    left-right anatomical orientation.

    Returns:
        tf.keras.Sequential layer that can be called on image batches.
    """
    augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomRotation(
                factor=0.05,  # ±5% of 2π ≈ ±18°
                fill_mode="nearest",
                seed=42,
            ),
            tf.keras.layers.RandomZoom(
                height_factor=(-0.1, 0.1),  # ±10% zoom
                width_factor=(-0.1, 0.1),
                fill_mode="nearest",
                seed=42,
            ),
            tf.keras.layers.RandomTranslation(
                height_factor=0.05,  # ±5% vertical shift
                width_factor=0.05,  # ±5% horizontal shift
                fill_mode="nearest",
                seed=42,
            ),
            tf.keras.layers.RandomContrast(
                factor=0.1,  # ±10% contrast variation
                seed=42,
            ),
        ],
        name="data_augmentation",
    )
    return augmentation


def preview_augmentation(image, n_samples=5):
    """
    Generate multiple augmented versions of a single image for visual inspection.

    Args:
        image: A single preprocessed image tensor of shape (224, 224, 3).
        n_samples: Number of augmented versions to produce.

    Returns:
        List of augmented image tensors.
    """
    augmentation = get_augmentation_layer()
    # Add and remove batch dimension for each call
    batch = tf.expand_dims(image, axis=0)
    results = []
    for _ in range(n_samples):
        augmented = augmentation(batch, training=True)
        results.append(tf.squeeze(augmented, axis=0))
    return results


if __name__ == "__main__":
    print("Augmentation layer configuration:")
    aug = get_augmentation_layer()
    aug.build(input_shape=(None, 224, 224, 3))
    aug.summary()

    # Quick test with a random tensor
    dummy = tf.random.uniform((1, 224, 224, 3), minval=-1.0, maxval=1.0)
    augmented = aug(dummy, training=True)
    print(f"\nInput shape:  {dummy.shape}")
    print(f"Output shape: {augmented.shape}")
    print(f"Pixel range:  [{augmented.numpy().min():.4f}, {augmented.numpy().max():.4f}]")
    print("\nAugmentation layer is working correctly.")
