"""
Model definition module for Pneumonia Detection pipeline.

Builds a MobileNetV2-based binary classifier for chest X-ray images.
Architecture: MobileNetV2 (ImageNet) → GlobalAveragePooling2D → Dropout → Dense(sigmoid)
"""

import tensorflow as tf


# Constants
IMG_SHAPE = (224, 224, 3)
LEARNING_RATE = 0.001


def build_model(learning_rate=LEARNING_RATE):
    """
    Build and compile the MobileNetV2-based pneumonia detection model.

    Architecture:
        1. MobileNetV2 base (ImageNet pretrained, frozen initially)
        2. GlobalAveragePooling2D
        3. Dropout(0.3) for regularization
        4. Dense(1, sigmoid) for binary classification

    Args:
        learning_rate: Learning rate for Adam optimizer (default: 0.001).

    Returns:
        Compiled tf.keras.Model.
    """
    # Load MobileNetV2 with ImageNet weights, without the classification head
    base_model = tf.keras.applications.MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=IMG_SHAPE,
    )

    # Freeze the base model for Phase 1 training
    base_model.trainable = False

    # Build the classification head
    inputs = tf.keras.Input(shape=IMG_SHAPE, name="input_image")
    x = base_model(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = tf.keras.layers.Dropout(0.3, name="dropout")(x)
    outputs = tf.keras.layers.Dense(1, activation="sigmoid", name="output")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="pneumonia_detector")

    # Compile with standard binary classification settings
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=tf.keras.losses.BinaryCrossentropy(),
        metrics=[
            tf.keras.metrics.BinaryAccuracy(name="accuracy"),
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.AUC(name="auc"),
        ],
    )

    return model


def build_efficientnet_model(learning_rate=LEARNING_RATE):
    """
    Build and compile the EfficientNetB0 comparison model for pneumonia detection.

    Architecture:
        1. EfficientNetB0 base (ImageNet pretrained, frozen initially)
        2. GlobalAveragePooling2D
        3. Dropout(0.3) for regularization
        4. Dense(1, sigmoid) for binary classification

    Args:
        learning_rate: Learning rate for Adam optimizer (default: 0.001).

    Returns:
        Compiled tf.keras.Model.
    """
    base_model = tf.keras.applications.EfficientNetB0(
        weights="imagenet",
        include_top=False,
        input_shape=IMG_SHAPE,
    )
    base_model.trainable = False

    inputs = tf.keras.Input(shape=IMG_SHAPE, name="input_image")
    x = base_model(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = tf.keras.layers.Dropout(0.3, name="dropout")(x)
    outputs = tf.keras.layers.Dense(1, activation="sigmoid", name="output")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="efficientnet_detector")

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=tf.keras.losses.BinaryCrossentropy(),
        metrics=[
            tf.keras.metrics.BinaryAccuracy(name="accuracy"),
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.AUC(name="auc"),
        ],
    )

    return model


def unfreeze_model(model, num_layers_to_unfreeze=30, learning_rate=0.0001):
    """
    Unfreeze the last N layers of the base model for fine-tuning (Phase 2).

    Args:
        model: The compiled Keras model.
        num_layers_to_unfreeze: Number of base model layers to unfreeze from the end.
        learning_rate: Lower learning rate for fine-tuning.

    Returns:
        Re-compiled model with unfrozen layers.
    """
    # The base model is the second layer (index 1) in our functional model
    base_model = model.layers[1]
    base_model.trainable = True

    # Freeze all layers except the last `num_layers_to_unfreeze`
    total_layers = len(base_model.layers)
    freeze_until = total_layers - num_layers_to_unfreeze

    for layer in base_model.layers[:freeze_until]:
        layer.trainable = False
    for layer in base_model.layers[freeze_until:]:
        layer.trainable = True

    trainable_count = sum(1 for layer in base_model.layers if layer.trainable)
    frozen_count = total_layers - trainable_count
    print(f"Base model: {total_layers} total layers")
    print(f"  Frozen:    {frozen_count}")
    print(f"  Trainable: {trainable_count}")

    # Re-compile with a lower learning rate
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=tf.keras.losses.BinaryCrossentropy(),
        metrics=[
            tf.keras.metrics.BinaryAccuracy(name="accuracy"),
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.AUC(name="auc"),
        ],
    )

    return model


def get_model_summary(model):
    """
    Get the model summary as a string.

    Args:
        model: Keras model.

    Returns:
        String containing the model summary.
    """
    summary_lines = []
    model.summary(print_fn=lambda line: summary_lines.append(line))
    return "\n".join(summary_lines)


if __name__ == "__main__":
    print("Building MobileNetV2 pneumonia detection model...\n")
    model = build_model()
    model.summary()

    print(f"\nTotal parameters: {model.count_params():,}")
    trainable = sum(tf.keras.backend.count_params(w) for w in model.trainable_weights)
    non_trainable = sum(tf.keras.backend.count_params(w) for w in model.non_trainable_weights)
    print(f"Trainable:     {trainable:,}")
    print(f"Non-trainable: {non_trainable:,}")

    # Verify last conv layer name for Grad-CAM
    base_model = model.layers[1]
    conv_layers = [l.name for l in base_model.layers if "conv" in l.name.lower()]
    print(f"\nLast conv layer (for Grad-CAM): {conv_layers[-1]}")
