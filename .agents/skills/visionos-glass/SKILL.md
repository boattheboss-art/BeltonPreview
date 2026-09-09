---
name: visionos-glass
description: Optical aerospace frosted glass and smooth shadow ring styling. Transparent multi-layered glassmorphism with backdrop blur, specular top-edge rim lighting, zero double borders, and extreme clarity.
---

# VisionOS Aero-Glass Engineering

Rules for high-end luxury glassmorphism without muddy opaqueness:

## 1. Glass Tokens
- **Background**: `rgba(255, 255, 255, 0.03)` to `rgba(15, 23, 42, 0.40)` (never solid black or dark grey).
- **Backdrop Filter**: `backdrop-filter: blur(40px) saturate(190%)` with `-webkit-backdrop-filter`.
- **Specular Rim**: `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.16), 0 20px 40px -15px rgba(0, 0, 0, 0.5)`.
- **Borders**: 1px subtle white perimeter `border: 1px solid rgba(255, 255, 255, 0.08)`.
- **Legibility**: Ensure white text (`#ffffff` and `#cbd5e1`) remains 100% sharp and readable over dynamic 3D background elements.
