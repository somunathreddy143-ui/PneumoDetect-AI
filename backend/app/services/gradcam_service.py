"""Grad-CAM heatmap generation service (self-contained, no ml/ imports)."""

from __future__ import annotations

import base64
import io
import logging

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class GradCAMService:
    """Generate Grad-CAM heatmaps for a MobileNetV2-based binary classifier."""

    # The last convolutional layer in MobileNetV2
    LAST_CONV_LAYER = "Conv_1"

    # ------------------------------------------------------------------ core
    def generate(
        self,
        model,
        preprocessed_image: np.ndarray,
        original_image: np.ndarray,
        predicted_class: int,
    ) -> tuple[np.ndarray, np.ndarray]:
        """Compute Grad-CAM and produce a heatmap + overlay.

        Parameters
        ----------
        model : tf.keras.Model
            Loaded Keras model.
        preprocessed_image : np.ndarray
            Shape ``(1, 224, 224, 3)`` after ``preprocess_input``.
        original_image : np.ndarray
            Original RGB uint8 image (any resolution).
        predicted_class : int
            0 = NORMAL, 1 = PNEUMONIA.

        Returns
        -------
        heatmap_colored : np.ndarray
            JET-colormapped heatmap resized to original image dims (uint8 RGB).
        overlay : np.ndarray
            0.4-alpha blend of heatmap onto the original image (uint8 RGB).
        """
        import tensorflow as tf  # deferred import

        # Find the base model and last conv layer
        base_model = None
        last_conv_layer = None

        try:
            last_conv_layer = model.get_layer(self.LAST_CONV_LAYER)
            base_model = model
        except ValueError:
            for layer in model.layers:
                if hasattr(layer, "get_layer"):
                    try:
                        last_conv_layer = layer.get_layer(self.LAST_CONV_LAYER)
                        base_model = layer
                        break
                    except ValueError:
                        continue

        if last_conv_layer is None or base_model is None:
            raise ValueError(f"Could not locate layer {self.LAST_CONV_LAYER}")

        # Extract features from last conv layer
        feature_extractor = tf.keras.Model(
            inputs=base_model.input,
            outputs=last_conv_layer.output,
        )

        # Forward pass + gradient computation
        with tf.GradientTape() as tape:
            features = feature_extractor(preprocessed_image)
            # Replicate downstream head computation
            x = features
            for layer in model.layers[model.layers.index(base_model) + 1:]:
                x = layer(x)
            loss = x[:, 0]

        # Gradients of the output w.r.t. the last conv layer
        grads = tape.gradient(loss, features)

        # If the model predicts NORMAL (class 0), invert gradients to highlight normal evidence
        if predicted_class == 0:
            grads = -grads

        # Global-average-pool the gradients -> channel weights
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        # Weight the conv feature maps and collapse channels
        conv_outputs = features[0]
        heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap).numpy()

        # ReLU + normalise to [0, 1]
        heatmap = np.maximum(heatmap, 0)
        if heatmap.max() != 0:
            heatmap /= heatmap.max()

        # Resize heatmap to match original image
        h, w = original_image.shape[:2]
        heatmap_resized = cv2.resize(heatmap, (w, h))

        # Apply JET colormap (OpenCV uses BGR, so convert to RGB)
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        # Create overlay: blend heatmap onto original image
        overlay = cv2.addWeighted(
            original_image.astype(np.uint8), 0.6,
            heatmap_colored, 0.4,
            0,
        )

        return heatmap_colored, overlay

    # --------------------------------------------------------------- helpers
    @staticmethod
    def to_base64(image_array: np.ndarray) -> str:
        """Convert a uint8 RGB numpy array to a base64-encoded PNG string."""
        img = Image.fromarray(image_array.astype(np.uint8))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("utf-8")


# Global convenience instance
gradcam_service = GradCAMService()
