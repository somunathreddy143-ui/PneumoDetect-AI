"""
Training script for the Pneumonia Detection pipeline.

Two-phase training strategy:
    Phase 1: Train classification head with frozen MobileNetV2 base (10 epochs).
    Phase 2: Fine-tune last 30 layers of the base with lower learning rate (10 epochs).

Usage:
    python ml/train.py
    python ml/train.py --dataset path/to/chest_xray --epochs1 10 --epochs2 10
"""

import os
import sys
import json
import argparse
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for saving plots
import matplotlib.pyplot as plt
import tensorflow as tf

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ml.preprocessing import create_datasets
from ml.augmentation import get_augmentation_layer
from ml.model import build_model, unfreeze_model


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Train MobileNetV2 pneumonia detection model"
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default="ml/dataset/chest_xray",
        help="Path to the chest_xray dataset root (default: ml/dataset/chest_xray)",
    )
    parser.add_argument(
        "--epochs1",
        type=int,
        default=10,
        help="Number of epochs for Phase 1 (frozen base) (default: 10)",
    )
    parser.add_argument(
        "--epochs2",
        type=int,
        default=10,
        help="Number of epochs for Phase 2 (fine-tuning) (default: 10)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Batch size (default: 32)",
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=5,
        help="Early stopping patience (default: 5)",
    )
    return parser.parse_args()


def check_dataset(dataset_path):
    """
    Verify the dataset directory exists and has the expected structure.

    Args:
        dataset_path: Path to the dataset root.

    Returns:
        True if valid, False otherwise.
    """
    dataset_path = Path(dataset_path)
    if not dataset_path.exists():
        print("=" * 60)
        print("ERROR: Dataset not found!")
        print(f"  Expected path: {dataset_path.resolve()}")
        print("=" * 60)
        print()
        print("To download the Chest X-Ray dataset:")
        print()
        print("  Option 1 — Kaggle CLI:")
        print("    pip install kaggle")
        print("    kaggle datasets download -d paultimothymooney/chest-xray-pneumonia")
        print(f"    # Extract to: {dataset_path.resolve()}")
        print()
        print("  Option 2 — Manual download:")
        print("    1. Visit: https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia")
        print("    2. Download and extract the zip file")
        print(f"    3. Place 'chest_xray' folder at: {dataset_path.resolve()}")
        print()
        print("  Expected directory structure:")
        print(f"    {dataset_path}/")
        print("      ├── train/")
        print("      │   ├── NORMAL/")
        print("      │   └── PNEUMONIA/")
        print("      ├── val/")
        print("      │   ├── NORMAL/")
        print("      │   └── PNEUMONIA/")
        print("      └── test/")
        print("          ├── NORMAL/")
        print("          └── PNEUMONIA/")
        return False

    # Check for required subdirectories
    required = ["train/NORMAL", "train/PNEUMONIA", "val/NORMAL", "val/PNEUMONIA",
                 "test/NORMAL", "test/PNEUMONIA"]
    missing = [d for d in required if not (dataset_path / d).exists()]
    if missing:
        print("ERROR: Dataset structure is incomplete. Missing directories:")
        for d in missing:
            print(f"  - {dataset_path / d}")
        return False

    return True


def save_training_plots(history_phase1, history_phase2, save_dir):
    """
    Save accuracy and loss plots for both training phases.

    Args:
        history_phase1: Keras History object from Phase 1.
        history_phase2: Keras History object from Phase 2.
        save_dir: Directory to save plots.
    """
    save_dir = Path(save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    # Combine histories
    def combine(h1, h2, key):
        vals = h1.history.get(key, []) + h2.history.get(key, [])
        return vals

    epochs_p1 = len(history_phase1.history.get("loss", []))
    epochs_p2 = len(history_phase2.history.get("loss", []))
    total_epochs = epochs_p1 + epochs_p2

    # ---- Accuracy plot ----
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    train_acc = combine(history_phase1, history_phase2, "accuracy")
    val_acc = combine(history_phase1, history_phase2, "val_accuracy")
    epochs_range = range(1, len(train_acc) + 1)

    ax.plot(epochs_range, train_acc, label="Training Accuracy", linewidth=2)
    ax.plot(epochs_range, val_acc, label="Validation Accuracy", linewidth=2)
    ax.axvline(x=epochs_p1, color="gray", linestyle="--", alpha=0.7, label="Fine-tuning starts")
    ax.set_xlabel("Epoch", fontsize=12)
    ax.set_ylabel("Accuracy", fontsize=12)
    ax.set_title("Training & Validation Accuracy", fontsize=14, fontweight="bold")
    ax.legend(fontsize=11)
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(save_dir / "training_accuracy.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {save_dir / 'training_accuracy.png'}")

    # ---- Loss plot ----
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    train_loss = combine(history_phase1, history_phase2, "loss")
    val_loss = combine(history_phase1, history_phase2, "val_loss")
    epochs_range = range(1, len(train_loss) + 1)

    ax.plot(epochs_range, train_loss, label="Training Loss", linewidth=2)
    ax.plot(epochs_range, val_loss, label="Validation Loss", linewidth=2)
    ax.axvline(x=epochs_p1, color="gray", linestyle="--", alpha=0.7, label="Fine-tuning starts")
    ax.set_xlabel("Epoch", fontsize=12)
    ax.set_ylabel("Loss", fontsize=12)
    ax.set_title("Training & Validation Loss", fontsize=14, fontweight="bold")
    ax.legend(fontsize=11)
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(save_dir / "training_loss.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {save_dir / 'training_loss.png'}")

    # ---- Save combined history as JSON ----
    combined_history = {}
    for key in history_phase1.history:
        combined_history[key] = [float(v) for v in combine(history_phase1, history_phase2, key)]
    combined_history["phase1_epochs"] = epochs_p1
    combined_history["phase2_epochs"] = epochs_p2

    history_path = save_dir / "training_history.json"
    with open(history_path, "w") as f:
        json.dump(combined_history, f, indent=2)
    print(f"  Saved: {history_path}")


def train():
    """Run the complete two-phase training pipeline."""
    args = parse_args()

    # Resolve dataset path relative to project root
    dataset_path = Path(args.dataset)
    if not dataset_path.is_absolute():
        dataset_path = PROJECT_ROOT / dataset_path

    # Verify dataset exists
    if not check_dataset(dataset_path):
        sys.exit(1)

    # Setup output directories
    model_dir = PROJECT_ROOT / "ml" / "saved_models"
    model_dir.mkdir(parents=True, exist_ok=True)
    graphs_dir = PROJECT_ROOT / "results" / "graphs"
    graphs_dir.mkdir(parents=True, exist_ok=True)

    model_save_path = model_dir / "best_model.keras"

    print("=" * 60)
    print("  PNEUMONIA DETECTION — MODEL TRAINING")
    print("=" * 60)
    print(f"  Dataset:    {dataset_path}")
    print(f"  Batch size: {args.batch_size}")
    print(f"  Phase 1:    {args.epochs1} epochs (frozen base)")
    print(f"  Phase 2:    {args.epochs2} epochs (fine-tuning)")
    print(f"  Patience:   {args.patience}")
    print(f"  Save path:  {model_save_path}")
    print("=" * 60)

    # Build augmentation layer
    augmentation = get_augmentation_layer()

    # Create datasets
    print("\n--- Loading datasets ---")
    train_ds, val_ds, test_ds = create_datasets(
        str(dataset_path), batch_size=args.batch_size, augment_fn=augmentation
    )

    # Build model
    print("\n--- Building model ---")
    model = build_model(learning_rate=0.001)
    model.summary()

    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=args.patience,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(model_save_path),
            monitor="val_loss",
            save_best_only=True,
            verbose=1,
        ),
    ]

    # ======== Phase 1: Train with frozen base ========
    print("\n" + "=" * 60)
    print("  PHASE 1: Training classification head (frozen base)")
    print("=" * 60)

    history_phase1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs1,
        callbacks=callbacks,
        verbose=1,
    )

    # ======== Phase 2: Fine-tune last 30 layers ========
    print("\n" + "=" * 60)
    print("  PHASE 2: Fine-tuning last 30 layers")
    print("=" * 60)

    model = unfreeze_model(model, num_layers_to_unfreeze=30, learning_rate=0.0001)

    # Reset early stopping for phase 2
    callbacks_phase2 = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=args.patience,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(model_save_path),
            monitor="val_loss",
            save_best_only=True,
            verbose=1,
        ),
    ]

    history_phase2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs2,
        callbacks=callbacks_phase2,
        verbose=1,
    )

    # Save training plots and history
    print("\n--- Saving training plots ---")
    save_training_plots(history_phase1, history_phase2, graphs_dir)

    # Final evaluation on test set
    print("\n--- Quick evaluation on test set ---")
    test_results = model.evaluate(test_ds, verbose=1)
    metric_names = model.metrics_names

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE — SUMMARY")
    print("=" * 60)
    for name, value in zip(metric_names, test_results):
        print(f"  Test {name:>12s}: {value:.4f}")
    print(f"\n  Model saved to: {model_save_path}")
    print(f"  Plots saved to: {graphs_dir}")
    print("=" * 60)


if __name__ == "__main__":
    train()
