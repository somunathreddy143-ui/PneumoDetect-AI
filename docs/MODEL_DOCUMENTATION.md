# Machine Learning & Grad-CAM Model Documentation

## 1. Model Architecture
- **Backbone**: MobileNetV2 pretrained on ImageNet (1.4 million images, 1,000 categories).
- **Modifications**:
  - Top classification layers removed.
  - Inverted bottleneck feature extractor capped at layer `Conv_1` (1280 feature channels, 7×7 spatial grid).
  - Global Average Pooling 2D layer added (reducing $7 \times 7 \times 1280$ to 1280 vector).
  - Dropout layer ($p=0.3$) for regularization.
  - Final binary Dense layer with Sigmoid activation ($y \in [0, 1]$).
- **Total Parameters**: ~2,260,000.

---

## 2. Training Strategy (Two-Phase Transfer Learning)
1. **Phase 1 (Feature Extraction)**:
   - Base MobileNetV2 layers are frozen.
   - Only the classification head is trained for 10 epochs using Adam ($\text{lr} = 0.001$).
2. **Phase 2 (Fine-Tuning)**:
   - The top 30 layers of MobileNetV2 are unfrozen.
   - Model is trained with a reduced learning rate ($\text{lr} = 0.0001$) for 10 epochs with Early Stopping.

---

## 3. Explainability Formulation (Grad-CAM)
Grad-CAM calculates the gradient of the predicted class score $y^c$ with respect to the feature map activations $A^k$ of the final convolutional layer:

$$\alpha_k^c = \frac{1}{Z} \sum_i \sum_j \frac{\partial y^c}{\partial A_{i,j}^k}$$

$$L_{\text{Grad-CAM}}^c = \text{ReLU}\left(\sum_k \alpha_k^c A^k\right)$$

- **Rectification**: The ReLU operator removes negative gradients, ensuring the heatmap exclusively highlights features that **positively support** the classified decision.
- **Colormap**: Applied using the OpenCV `COLORMAP_JET` spectrum (warm red/yellow denotes maximal activation; cool blue denotes baseline aeration).
- **Overlay**: Blended via:
  $$\text{Overlay} = 0.6 \cdot \text{Radiograph} + 0.4 \cdot \text{Heatmap}$$

---

## 4. Evaluation Benchmark Results (Test Dataset)
- **Accuracy**: 92.5%
- **Sensitivity / Recall**: 96.9%
- **Precision**: 91.4%
- **Specificity**: 85.0%
- **F1-Score**: 94.1%
- **ROC-AUC**: 0.969

