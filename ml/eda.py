"""
Exploratory Data Analysis (EDA) for Chest X-Ray Pneumonia Dataset.

This script analyzes the dataset structure, class distribution,
image properties, and generates visualization charts.
"""

from __future__ import annotations

import argparse
from collections import defaultdict
import os
from pathlib import Path
import sys

# Configure headless matplotlib backend before loading GUI submodules
os.environ.setdefault("MPLBACKEND", "Agg")

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import seaborn as sns

matplotlib.use('Agg')

# Set clean scientific plotting style
sns.set_theme(style="whitegrid", palette="muted")

# Default Project paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATASET_DIR = Path(__file__).resolve().parent / "dataset" / "chest_xray"
DEFAULT_RESULTS_DIR = PROJECT_ROOT / "results" / "graphs"


def generate_sample_dataset_structure(target_dir: Path) -> None:
    """Generate demonstration radiographs if Kaggle dataset is not yet downloaded."""
    print(f"\n[NOTE] Creating demonstration dataset structure in: {target_dir}")
    for split in ["train", "val", "test"]:
        for cls in ["NORMAL", "PNEUMONIA"]:
            d = target_dir / split / cls
            d.mkdir(parents=True, exist_ok=True)
            count = 10 if split == "train" else 4
            for i in range(count):
                img = Image.new("L", (224, 224), color=25)
                draw = ImageDraw.Draw(img)
                # Ribcage and heart contours
                draw.ellipse([30, 40, 95, 180], fill=65)
                draw.ellipse([129, 40, 194, 180], fill=65)
                draw.ellipse([90, 90, 145, 170], fill=140)
                draw.rectangle([105, 20, 119, 210], fill=120)
                if cls == "PNEUMONIA":
                    # Focal opacity infiltrates
                    draw.ellipse([45 + (i % 10), 110, 85, 160], fill=175)
                    draw.ellipse([135, 120 + (i % 10), 175, 165], fill=150)
                img = img.filter(ImageFilter.GaussianBlur(radius=3))
                img.convert("RGB").save(d / f"{cls.lower()}_{i+1:03d}.png")


def resolve_dataset_directory(provided_path: Path | None) -> Path:
    """Resolve dataset directory, checking common locations or falling back safely."""
    candidates = []
    if provided_path:
        candidates.append(Path(provided_path))

    candidates.extend([
        DEFAULT_DATASET_DIR,
        Path(__file__).resolve().parent / "dataset",
        PROJECT_ROOT / "ml" / "dataset" / "chest_xray",
        PROJECT_ROOT / "dataset" / "chest_xray",
    ])

    for c in candidates:
        if c.exists() and any(c.glob("train/*")):
            return c

    # If default exists or needs creation
    if not DEFAULT_DATASET_DIR.exists():
        generate_sample_dataset_structure(DEFAULT_DATASET_DIR)
    return DEFAULT_DATASET_DIR


def get_dataset_stats(dataset_dir: Path) -> dict:
    """
    Count images per class per split and gather image dimension statistics.
    
    Args:
        dataset_dir: Path to dataset root (containing train/val/test folders).
    
    Returns:
        Dictionary with dataset statistics.
    """
    stats = {
        "splits": {},
        "total_images": 0,
        "class_totals": defaultdict(int),
        "dimensions": [],
        "corrupted": [],
    }

    splits = ["train", "val", "test"]

    for split in splits:
        split_dir = dataset_dir / split
        if not split_dir.exists():
            continue

        split_stats = {}
        classes = sorted([d.name for d in split_dir.iterdir() if d.is_dir()])

        for cls in classes:
            cls_dir = split_dir / cls
            images = []
            corrupted = []

            for img_file in cls_dir.iterdir():
                if img_file.suffix.lower() in [".jpg", ".jpeg", ".png", ".bmp"]:
                    try:
                        with Image.open(img_file) as img:
                            img.verify()
                        with Image.open(img_file) as img:
                            w, h = img.size
                            stats["dimensions"].append({
                                "width": w,
                                "height": h,
                                "split": split,
                                "class": cls,
                                "file": str(img_file),
                            })
                        images.append(str(img_file))
                    except Exception as e:
                        corrupted.append({"file": str(img_file), "error": str(e)})
                        stats["corrupted"].append({"file": str(img_file), "error": str(e)})

            count = len(images)
            split_stats[cls] = count
            stats["class_totals"][cls] += count
            stats["total_images"] += count

            if corrupted:
                print(f"  [WARNING] {len(corrupted)} corrupted images in {split}/{cls}")

        stats["splits"][split] = split_stats

    return stats


def print_dataset_report(stats: dict) -> None:
    """Print a formatted dataset report to console."""
    print("\n" + "=" * 60)
    print("DATASET ANALYSIS REPORT")
    print("=" * 60)

    print(f"\nTotal images: {stats['total_images']}")
    print(f"Classes: {list(stats['class_totals'].keys())}")
    print(f"Corrupted/unreadable images: {len(stats['corrupted'])}")

    print("\n--- Images per Split ---")
    for split, classes in stats["splits"].items():
        total = sum(classes.values())
        print(f"\n  {split.upper()} (total: {total}):")
        for cls, count in classes.items():
            pct = (count / total * 100) if total > 0 else 0
            print(f"    {cls}: {count} ({pct:.1f}%)")

    print("\n--- Class Totals ---")
    for cls, count in stats["class_totals"].items():
        pct = (count / stats["total_images"] * 100) if stats["total_images"] > 0 else 0
        print(f"  {cls}: {count} ({pct:.1f}%)")

    if stats["dimensions"]:
        widths = [d["width"] for d in stats["dimensions"]]
        heights = [d["height"] for d in stats["dimensions"]]
        print("\n--- Image Dimensions ---")
        print(f"  Width  - Min: {min(widths)}, Max: {max(widths)}, Mean: {np.mean(widths):.0f}")
        print(f"  Height - Min: {min(heights)}, Max: {max(heights)}, Mean: {np.mean(heights):.0f}")

    if stats["class_totals"]:
        counts = [c for c in stats["class_totals"].values() if c > 0]
        if len(counts) >= 2:
            ratio = max(counts) / min(counts) if min(counts) > 0 else float("inf")
            print(f"\n--- Class Imbalance ---")
            print(f"  Majority/Minority ratio: {ratio:.2f}:1")
            if ratio > 2:
                print("  [NOTE] Significant class imbalance detected. Consider augmentation or class weights.")
            else:
                print("  Classes are reasonably balanced.")

    if stats["corrupted"]:
        print(f"\n--- Corrupted Images ({len(stats['corrupted'])}) ---")
        for item in stats["corrupted"][:10]:
            print(f"  {item['file']}: {item['error']}")
        if len(stats["corrupted"]) > 10:
            print(f"  ... and {len(stats['corrupted']) - 10} more")

    print("\n" + "=" * 60)


def generate_class_distribution_chart(stats: dict, save_path: Path) -> None:
    """Generate and save class distribution bar and pie charts."""
    save_path.parent.mkdir(parents=True, exist_ok=True)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    splits = list(stats["splits"].keys())
    classes = sorted(stats["class_totals"].keys())
    x = np.arange(len(splits))
    width = 0.35

    for i, cls in enumerate(classes):
        counts = [stats["splits"][s].get(cls, 0) for s in splits]
        color = "#10B981" if cls == "NORMAL" else "#EF4444"
        axes[0].bar(x + i * width, counts, width, label=cls, color=color, alpha=0.85)

    axes[0].set_xlabel("Dataset Split", fontsize=12, fontweight="bold")
    axes[0].set_ylabel("Number of Radiographs", fontsize=12, fontweight="bold")
    axes[0].set_title("Class Distribution per Split", fontsize=14, fontweight="bold")
    axes[0].set_xticks(x + width / 2)
    axes[0].set_xticklabels([s.upper() for s in splits])
    axes[0].legend()
    axes[0].grid(axis="y", alpha=0.3)

    for container in axes[0].containers:
        axes[0].bar_label(container, fontsize=9)

    labels = list(stats["class_totals"].keys())
    sizes = list(stats["class_totals"].values())
    total_val = sum(sizes)

    if total_val > 0 and len(labels) > 0:
        colors = ["#10B981" if l == "NORMAL" else "#EF4444" for l in labels]
        explode = [0.05] * len(labels)
        axes[1].pie(
            sizes,
            explode=explode,
            labels=labels,
            colors=colors,
            autopct="%1.1f%%",
            shadow=True,
            startangle=90,
            textprops={"fontsize": 12},
        )
        axes[1].set_title("Overall Class Distribution", fontsize=14, fontweight="bold")
    else:
        axes[1].text(0.5, 0.5, "No class data available", ha="center", va="center")

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Class distribution chart saved: {save_path}")


def generate_sample_images_grid(dataset_dir: Path, save_path: Path) -> None:
    """Generate a grid of sample radiographs from each class."""
    save_path.parent.mkdir(parents=True, exist_ok=True)

    fig, axes = plt.subplots(2, 5, figsize=(15, 6))
    classes = ["NORMAL", "PNEUMONIA"]

    for row, cls in enumerate(classes):
        cls_dir = dataset_dir / "train" / cls
        if not cls_dir.exists():
            continue

        image_files = sorted([
            f for f in cls_dir.iterdir()
            if f.suffix.lower() in [".jpg", ".jpeg", ".png"]
        ])[:5]

        for col, img_file in enumerate(image_files):
            try:
                img = Image.open(img_file).convert("RGB")
                axes[row][col].imshow(img, cmap="gray")
                axes[row][col].set_title(
                    f"{cls}",
                    fontsize=10,
                    fontweight="bold",
                    color="#10B981" if cls == "NORMAL" else "#EF4444",
                )
                axes[row][col].axis("off")
            except Exception:
                axes[row][col].text(0.5, 0.5, "Error", ha="center", va="center")
                axes[row][col].axis("off")

    plt.suptitle("Sample Chest X-Ray Images (Train Split)", fontsize=16, fontweight="bold")
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Sample images grid saved: {save_path}")


def generate_dimension_histogram(stats: dict, save_path: Path) -> None:
    """Generate histogram of image dimensions."""
    if not stats["dimensions"]:
        print("No dimension data to plot.")
        return

    save_path.parent.mkdir(parents=True, exist_ok=True)

    widths = [d["width"] for d in stats["dimensions"]]
    heights = [d["height"] for d in stats["dimensions"]]

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))

    axes[0].hist(widths, bins=20, color="#2563EB", alpha=0.75, edgecolor="black")
    axes[0].set_title("Width Distribution", fontsize=12, fontweight="bold")
    axes[0].set_xlabel("Width (pixels)")
    axes[0].set_ylabel("Radiograph Count")
    axes[0].axvline(np.mean(widths), color="red", linestyle="--", label=f"Mean: {np.mean(widths):.0f}px")
    axes[0].legend()

    axes[1].hist(heights, bins=20, color="#7C3AED", alpha=0.75, edgecolor="black")
    axes[1].set_title("Height Distribution", fontsize=12, fontweight="bold")
    axes[1].set_xlabel("Height (pixels)")
    axes[1].set_ylabel("Radiograph Count")
    axes[1].axvline(np.mean(heights), color="red", linestyle="--", label=f"Mean: {np.mean(heights):.0f}px")
    axes[1].legend()

    plt.suptitle("Radiograph Dimension & Resolution Analysis", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Dimension histogram saved: {save_path}")


def main():
    """Run the complete Exploratory Data Analysis (EDA) pipeline."""
    parser = argparse.ArgumentParser(description="Exploratory Data Analysis for Chest X-Ray Pneumonia Dataset")
    parser.add_argument("--dataset", type=str, default=None, help="Path to chest_xray dataset root")
    parser.add_argument("--output", type=str, default=None, help="Directory to save generated charts")
    args = parser.parse_args()

    print("=" * 60)
    print("EXPLORATORY DATA ANALYSIS (EDA)")
    print("Explainable AI Chest X-Ray Pneumonia Dataset")
    print("=" * 60)

    dataset_path = resolve_dataset_directory(Path(args.dataset) if args.dataset else None)
    output_path = Path(args.output) if args.output else DEFAULT_RESULTS_DIR
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"Using dataset directory: {dataset_path}")
    print(f"Charts output directory: {output_path}")

    # Gather statistics
    print("\nAnalyzing radiograph files and directory structure...")
    stats = get_dataset_stats(dataset_path)

    # Print summary report to console
    print_dataset_report(stats)

    # Generate charts
    generate_class_distribution_chart(stats, output_path / "class_distribution.png")
    generate_sample_images_grid(dataset_path, output_path / "sample_images.png")
    generate_dimension_histogram(stats, output_path / "dimension_histogram.png")

    print("\nEDA complete! All visualization charts saved successfully.")


if __name__ == "__main__":
    main()
