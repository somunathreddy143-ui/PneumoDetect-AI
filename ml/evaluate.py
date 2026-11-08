"""
Evaluation script for the Pneumonia Detection pipeline.

Loads the best saved model, evaluates on the test set, and generates:
    - Confusion matrix image
    - ROC curve image
    - Classification report
    - JSON file with all metrics

Usage:
    python ml/evaluate.py
    python ml/evaluate.py --dataset path/to/chest_xray --model path/to/model.keras
"""

import os
import sys
import json
import argparse
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import tensorflow as tf
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix,
    classification_report,
)

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ml.preprocessing import create_dataset, CLASS_NAMES


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Evaluate pneumonia detection model")
    parser.add_argument(
        "--dataset",
        type=str,
        default="ml/dataset/chest_xray",
        help="Path to the chest_xray dataset root",
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
        default="results/evaluation",
        help="Directory to save evaluation results",
    )
    return parser.parse_args()


def get_predictions(model, test_ds):
    """
    Run the model on the test dataset and collect ground truth + predictions.

    Args:
        model: Loaded Keras model.
        test_ds: tf.data.Dataset for the test split.

    Returns:
        Tuple of (y_true, y_pred_proba, y_pred).
    """
    y_true = []
    y_pred_proba = []

    for images, labels in test_ds:
        predictions = model.predict(images, verbose=0)
        y_true.extend(labels.numpy().tolist())
        y_pred_proba.extend(predictions.flatten().tolist())

    y_true = np.array(y_true, dtype=int)
    y_pred_proba = np.array(y_pred_proba)
    y_pred = (y_pred_proba >= 0.5).astype(int)

    return y_true, y_pred_proba, y_pred


def compute_metrics(y_true, y_pred_proba, y_pred):
    """
    Compute all evaluation metrics.

    Args:
        y_true: Ground truth labels.
        y_pred_proba: Predicted probabilities.
        y_pred: Predicted binary labels.

    Returns:
        Dictionary of metrics.
    """
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)  # Sensitivity
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    f1 = f1_score(y_true, y_pred, zero_division=0)
    auc = roc_auc_score(y_true, y_pred_proba)

    report = classification_report(
        y_true, y_pred, target_names=CLASS_NAMES, digits=4
    )

    metrics = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "specificity": float(specificity),
        "f1_score": float(f1),
        "auc": float(auc),
        "confusion_matrix": cm.tolist(),  # [[TN, FP], [FN, TP]]
        "classification_report": report,
    }

    return metrics


def save_confusion_matrix(cm, save_path):
    """
    Generate and save a confusion matrix heatmap.

    Args:
        cm: 2x2 confusion matrix array.
        save_path: File path to save the image.
    """
    save_path = Path(save_path)
    save_path.parent.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=CLASS_NAMES,
        yticklabels=CLASS_NAMES,
        cbar=True,
        annot_kws={"size": 16, "fontweight": "bold"},
        linewidths=1,
        linecolor="white",
        ax=ax,
    )
    ax.set_xlabel("Predicted Label", fontsize=13, fontweight="bold")
    ax.set_ylabel("True Label", fontsize=13, fontweight="bold")
    ax.set_title("Confusion Matrix", fontsize=15, fontweight="bold")
    ax.tick_params(labelsize=12)

    fig.tight_layout()
    fig.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved confusion matrix: {save_path}")


def save_roc_curve(y_true, y_pred_proba, auc_score, save_path):
    """
    Generate and save the ROC curve plot.

    Args:
        y_true: Ground truth labels.
        y_pred_proba: Predicted probabilities.
        auc_score: Precomputed AUC score.
        save_path: File path to save the image.
    """
    save_path = Path(save_path)
    save_path.parent.mkdir(parents=True, exist_ok=True)

    fpr, tpr, _ = roc_curve(y_true, y_pred_proba)

    fig, ax = plt.subplots(figsize=(8, 6))
    ax.plot(fpr, tpr, color="#1f77b4", linewidth=2.5,
            label=f"ROC Curve (AUC = {auc_score:.4f})")
    ax.plot([0, 1], [0, 1], color="gray", linestyle="--", linewidth=1, alpha=0.7,
            label="Random Classifier")
    ax.fill_between(fpr, tpr, alpha=0.1, color="#1f77b4")
    ax.set_xlabel("False Positive Rate", fontsize=13)
    ax.set_ylabel("True Positive Rate (Recall)", fontsize=13)
    ax.set_title("Receiver Operating Characteristic (ROC) Curve", fontsize=14, fontweight="bold")
    ax.legend(loc="lower right", fontsize=12)
    ax.grid(True, alpha=0.3)
    ax.set_xlim([-0.01, 1.01])
    ax.set_ylim([-0.01, 1.01])

    fig.tight_layout()
    fig.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved ROC curve: {save_path}")


def save_metrics_json(metrics, save_path):
    """
    Save all metrics as a JSON file.

    Args:
        metrics: Dictionary of metrics.
        save_path: File path to save the JSON.
    """
    save_path = Path(save_path)
    save_path.parent.mkdir(parents=True, exist_ok=True)

    with open(save_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  Saved metrics JSON: {save_path}")


def evaluate():
    """Run the complete evaluation pipeline."""
    args = parse_args()

    # Resolve paths relative to project root
    dataset_path = Path(args.dataset)
    if not dataset_path.is_absolute():
        dataset_path = PROJECT_ROOT / dataset_path

    model_path = Path(args.model)
    if not model_path.is_absolute():
        model_path = PROJECT_ROOT / model_path

    output_dir = Path(args.output)
    if not output_dir.is_absolute():
        output_dir = PROJECT_ROOT / output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    # Validate paths
    test_dir = dataset_path / "test"
    if not test_dir.exists():
        print(f"ERROR: Test directory not found: {test_dir}")
        sys.exit(1)

    if not model_path.exists():
        print(f"ERROR: Model not found: {model_path}")
        print("  Run 'python ml/train.py' first to train the model.")
        sys.exit(1)

    print("=" * 60)
    print("  PNEUMONIA DETECTION — MODEL EVALUATION")
    print("=" * 60)
    print(f"  Model:   {model_path}")
    print(f"  Test:    {test_dir}")
    print(f"  Output:  {output_dir}")
    print("=" * 60)

    # Load model
    print("\n--- Loading model ---")
    model = tf.keras.models.load_model(str(model_path))
    print("  Model loaded successfully.")

    # Create test dataset
    print("\n--- Loading test dataset ---")
    test_ds = create_dataset(str(test_dir), batch_size=32, shuffle=False)

    # Get predictions
    print("\n--- Running predictions ---")
    y_true, y_pred_proba, y_pred = get_predictions(model, test_ds)
    print(f"  Total test samples: {len(y_true)}")
    print(f"  NORMAL:    {(y_true == 0).sum()}")
    print(f"  PNEUMONIA: {(y_true == 1).sum()}")

    # Compute metrics
    print("\n--- Computing metrics ---")
    metrics = compute_metrics(y_true, y_pred_proba, y_pred)

    # Save outputs
    print("\n--- Saving results ---")
    cm = np.array(metrics["confusion_matrix"])
    save_confusion_matrix(cm, output_dir / "confusion_matrix.png")
    save_roc_curve(y_true, y_pred_proba, metrics["auc"], output_dir / "roc_curve.png")
    save_metrics_json(metrics, output_dir / "metrics.json")

    # Print results
    print("\n" + "=" * 60)
    print("  EVALUATION RESULTS")
    print("=" * 60)
    print(f"  Accuracy:    {metrics['accuracy']:.4f}")
    print(f"  Precision:   {metrics['precision']:.4f}")
    print(f"  Recall:      {metrics['recall']:.4f}")
    print(f"  Specificity: {metrics['specificity']:.4f}")
    print(f"  F1 Score:    {metrics['f1_score']:.4f}")
    print(f"  AUC:         {metrics['auc']:.4f}")
    print()
    print("  Confusion Matrix:")
    print(f"    TN={cm[0][0]:>4d}  FP={cm[0][1]:>4d}")
    print(f"    FN={cm[1][0]:>4d}  TP={cm[1][1]:>4d}")
    print()
    print("  Classification Report:")
    print(metrics["classification_report"])
    print("=" * 60)

    return metrics


if __name__ == "__main__":
    evaluate()
