# LUNARA: Training & Optimization Specification

## 1. Loss Functions

The LUNARA model is optimized using a composite multi-term objective tailored for lunar surface geometries:

$$\mathcal{L}_{\text{total}} = \mathcal{L}_1 + \lambda_{grad}\mathcal{L}_{grad} + \lambda_{ssim}\mathcal{L}_{ssim}$$

1. **L1 Reconstruction Loss**:
   $$\mathcal{L}_1 = \frac{1}{HW}\sum_{x,y} |\mathbf{I}_{SR}(x,y) - \mathbf{I}_{HR}(x,y)|$$
2. **Sobel Gradient Loss**:
   $$\mathcal{L}_{grad} = \frac{1}{HW}\sum_{x,y} \|\nabla \mathbf{I}_{SR}(x,y) - \nabla \mathbf{I}_{HR}(x,y)\|_1$$
   Penalizes diffuse or over-smoothed crater rims.
3. **Structural Similarity Loss**:
   $$\mathcal{L}_{ssim} = 1 - \text{SSIM}(\mathbf{I}_{SR}, \mathbf{I}_{HR})$$

---

## 2. Hyperparameters & Training Environment

| Parameter | Value |
| :--- | :--- |
| **Framework** | PyTorch 2.13.0 |
| **Optimizer** | Adam ($\beta_1 = 0.9, \beta_2 = 0.999, \epsilon = 10^{-8}$) |
| **Learning Rate** | $2 \times 10^{-4}$ with cosine annealing scheduler |
| **Batch Size** | 16 patches ($64\times 64$ LR $\rightarrow 256\times 256$ HR) |
| **Data Augmentation** | Random horizontal flip, vertical flip, $90^\circ$ rotation |
| **Uncertainty Passes** | $N=2$ (Inference default) / $N=5$ (Extended analysis) |
