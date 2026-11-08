"""
Grad-CAM (Gradient-weighted Class Activation Mapping) module for Pneumonia Detection.

Generates visual explanations for the model's predictions by highlighting
the regions of a chest X-ray that most influenced the classification.

Uses the last convolutional layer "Conv_1" of MobileNetV2.
"""

import numpy as np
import tensorflow as tf
import cv2
from pathlib import Path

# Add project root for imports
import sys
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ml.preprocessing import preprocess_single_image, IMG_SIZE, CLASS_NAMES


# Grad-CAM target layer
GRADCAM_LAYER_NAME = "Conv_1"
OVERLAY_ALPHA = 0.4


def find_last_conv_layer(model):
    """
    Programmatically find the last convolutional layer in the model.

    Searches the base model (MobileNetV2) for Conv2D layers and returns
    the name of the last one found.

    Args:
        model: Keras model.

    Returns:
        Name of the last convolutional layer.
    """
    # The base model is typically layer index 1 in our functional model
    base_model = model.layers[1]
    last_conv = None
    for layer in base_model.layers:
        if isinstance(layer, tf.keras.layers.Conv2D):
            last_conv = layer.name
    if last_conv is None:
        raise ValueError("No Conv2D layer found in the base model.")
    return last_conv


def _get_gradcam_model(model):
    """
    Build a model that outputs both the conv layer activations and the final prediction.

    Args:
        model: The full classification model.

    Returns:
        tf.keras.Model that outputs [conv_outputs, predictions].
    """
    base_model = model.layers[1]

    # Try the known layer name first, fall back to programmatic search
    try:
        conv_layer = base_model.get_layer(GRADCAM_LAYER_NAME)
    except ValueError:
        layer_name = find_last_conv_layer(model)
        conv_layer = base_model.get_layer(layer_name)
        print(f"  [INFO] Using layer '{layer_name}' for Grad-CAM (fallback)")

    # Build gradient model: input → [conv_output, prediction]
    grad_model = tf.keras.Model(
        inputs=model.input,
        outputs=[conv_layer.output, model.output],
    )
    return grad_model


def generate_gradcam(model, image, target_class=None):
    """
    Generate a Grad-CAM heatmap for the given image and model.

    Args:
        model: Trained Keras classification model.
        image: Preprocessed image array of shape (1, 224, 224, 3).
        target_class: Class index to explain (0=NORMAL, 1=PNEUMONIA).
                      If None, uses the model's predicted class.

    Returns:
        Tuple of:
            - heatmap: Colorized heatmap as uint8 array (224, 224, 3), JET colormap.
            - overlay: Original image with heatmap overlay, uint8 array (224, 224, 3).
    """
    # Ensure image has batch dimension
    if len(image.shape) == 3:
        image = np.expand_dims(image, axis=0)

    image_tensor = tf.cast(image, tf.float32)

    # Build gradient model
    grad_model = _get_gradcam_model(model)

    # Compute gradients using GradientTape
    with tf.GradientTape() as tape:
        tape.watch(image_tensor)
        conv_outputs, predictions = grad_model(image_tensor, training=False)

        # Determine target class
        if target_class is None:
            target_class = int(tf.round(predictions[0, 0]).numpy())

        # For binary sigmoid output:
        # class 1 (PNEUMONIA) → use prediction directly
        # class 0 (NORMAL) → use 1 - prediction
        if target_class == 1:
            loss = predictions[:, 0]
        else:
            loss = 1.0 - predictions[:, 0]

    # Compute gradients of the loss w.r.t. conv outputs
    grads = tape.gradient(loss, conv_outputs)

    # Global average pooling of gradients → channel importance weights
    weights = tf.reduce_mean(grads, axis=(1, 2))  # Shape: (1, num_channels)

    # Weighted combination of feature maps
    conv_outputs = conv_outputs[0]  # Remove batch dim: (H, W, C)
    weights = weights[0]  # Remove batch dim: (C,)

    # Weighted sum: Σ(weight_i × feature_map_i)
    cam = tf.reduce_sum(conv_outputs * weights, axis=-1)  # Shape: (H, W)

    # Apply ReLU — keep only features with positive influence
    cam = tf.nn.relu(cam)

    # Normalize to [0, 1]
    cam = cam.numpy()
    if cam.max() > 0:
        cam = cam / cam.max()

    # Resize heatmap to match input image size
    heatmap_resized = cv2.resize(cam, IMG_SIZE, interpolation=cv2.INTER_LINEAR)

    # Convert to uint8 [0, 255]
    heatmap_uint8 = np.uint8(255 * heatmap_resized)

    # Apply JET colormap
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    # Create overlay on the original image
    # Reverse the MobileNetV2 preprocessing to get displayable image
    original = image[0].copy()
    # MobileNetV2 preprocess_input scales to [-1, 1], reverse: (x + 1) * 127.5
    original = ((original + 1.0) * 127.5).astype(np.uint8)

    overlay = cv2.addWeighted(original, 1 - OVERLAY_ALPHA, heatmap_colored, OVERLAY_ALPHA, 0)

    return heatmap_colored, overlay


def generate_gradcam_from_path(model, image_path):
    """
    Generate Grad-CAM explanation for an image file.

    Args:
        model: Trained Keras classification model.
        image_path: Path to the input image file.

    Returns:
        Tuple of:
            - prediction: String label ("NORMAL" or "PNEUMONIA").
            - confidence: Float confidence score (0–1).
            - heatmap: Colorized heatmap, uint8 (224, 224, 3).
            - overlay: Overlay image, uint8 (224, 224, 3).
    """
    image_path = str(image_path)

    # Preprocess image
    preprocessed = preprocess_single_image(image_path)

    # Get prediction
    pred_prob = model.predict(preprocessed, verbose=0)[0, 0]
    pred_class = int(pred_prob >= 0.5)
    prediction = CLASS_NAMES[pred_class]
    confidence = float(pred_prob) if pred_class == 1 else float(1.0 - pred_prob)

    # Generate Grad-CAM
    heatmap, overlay = generate_gradcam(model, preprocessed, target_class=pred_class)

    return prediction, confidence, heatmap, overlay


def save_gradcam_comparison(original, heatmap, overlay, save_path):
    """
    Save a 3-panel comparison figure: Original | Heatmap | Overlay.

    Args:
        original: Original image as uint8 array (H, W, 3).
        heatmap: Colorized Grad-CAM heatmap as uint8 array (H, W, 3).
        overlay: Heatmap overlaid on original as uint8 array (H, W, 3).
        save_path: File path to save the comparison figure.
    """
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    save_path = Path(save_path)
    save_path.parent.mkdir(parents=True, exist_ok=True)

    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    titles = ["Original", "Grad-CAM Heatmap", "Overlay"]
    images = [original, heatmap, overlay]

    for ax, img, title in zip(axes, images, titles):
        ax.imshow(img)
        ax.set_title(title, fontsize=14, fontweight="bold")
        ax.axis("off")

    fig.suptitle("Grad-CAM Visualization", fontsize=16, fontweight="bold", y=1.02)
    fig.tight_layout()
    fig.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved Grad-CAM comparison: {save_path}")


def load_original_image(image_path):
    """
    Load an image from disk as a displayable RGB uint8 array, resized to 224×224.

    Args:
        image_path: Path to the image file.

    Returns:
        Numpy array of shape (224, 224, 3), dtype uint8.
    """
    raw = tf.io.read_file(str(image_path))
    image = tf.image.decode_image(raw, channels=3, expand_animations=False)
    image.set_shape([None, None, 3])
    image = tf.image.resize(image, IMG_SIZE)
    image = tf.cast(image, tf.uint8)
    return image.numpy()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate Grad-CAM visualizations")
    parser.add_argument(
        "--image",
        type=str,
        required=True,
        help="Path to a chest X-ray image",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="ml/saved_models/best_model.keras",
        help="Path to the saved model",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="results/gradcam/gradcam_output.png",
        help="Path to save the comparison figure",
    )
    args = parser.parse_args()

    # Resolve paths
    model_path = Path(args.model)
    if not model_path.is_absolute():
        model_path = PROJECT_ROOT / model_path

    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = PROJECT_ROOT / output_path

    if not model_path.exists():
        print(f"ERROR: Model not found: {model_path}")
        print("  Run 'python ml/train.py' first to train the model.")
        sys.exit(1)

    if not Path(args.image).exists():
        print(f"ERROR: Image not found: {args.image}")
        sys.exit(1)

    print("=" * 60)
    print("  GRAD-CAM VISUALIZATION")
    print("=" * 60)

    # Load model
    print("\nLoading model...")
    model = tf.keras.models.load_model(str(model_path))
    print("  Model loaded.")

    # Generate Grad-CAM
    print(f"\nProcessing: {args.image}")
    prediction, confidence, heatmap, overlay = generate_gradcam_from_path(model, args.image)

    print(f"  Prediction:  {prediction}")
    print(f"  Confidence:  {confidence:.4f}")

    # Load original for comparison panel
    original = load_original_image(args.image)

    # Save comparison figure
    save_gradcam_comparison(original, heatmap, overlay, output_path)

    print("\nDone!")
