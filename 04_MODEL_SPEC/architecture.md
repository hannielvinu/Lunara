# LUNARA: Model Architecture Specification

## 1. Network Components

### 1.1 Shallow Feature Extraction
$$\mathbf{F}_0 = \text{PReLU}\left(\text{Conv}_{3\times 3}(\mathbf{I}_{LR})\right)$$
Maps single-channel panchromatic planetary observation to 64 feature dimensions.

### 1.2 High-Frequency Gradient Guidance Branch
$$\mathbf{G}_{xy} = |\nabla_x \mathbf{I}_{LR}| + |\nabla_y \mathbf{I}_{LR}|$$
$$\mathbf{F}_{grad} = \text{Conv}_{3\times 3}\left(\text{PReLU}\left(\text{Conv}_{3\times 3}(\mathbf{G}_{xy})\right)\right)$$
Infuses explicit edge orientation cues into the feature representation to stabilize crater rims and ridge scarps.

### 1.3 Deep Physics-Attention Residual Blocks
Each of the 8 blocks incorporates:
1. Conv $3\times 3 \rightarrow$ PReLU $\rightarrow$ Conv $3\times 3$.
2. **Spatial-Channel Attention**:
   - Channel Attention: Squeeze-and-Excitation via AdaptiveAvgPool + AdaptiveMaxPool MLP.
   - Spatial Attention: Inter-spatial feature convolution ($\text{kernel}=7\times 7$).
3. Stochastic Dropout ($p=0.10$) for Monte Carlo epistemic uncertainty quantification.

### 1.4 Sub-Pixel Upsampling (PixelShuffle 4x)
Progressive $2\times \rightarrow 2\times$ pixel shuffle blocks expanding spatial resolution with sub-pixel convolution.

### 1.5 Base Residual Prior
$$\mathbf{I}_{SR} = \text{Tail}(\mathbf{F}_{up}) + \text{Bicubic}(\mathbf{I}_{LR})$$
Guarantees global photometric stability by learning only high-frequency planetary residuals.
