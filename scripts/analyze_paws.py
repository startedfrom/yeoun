import cv2
import numpy as np
from collections import Counter

img = cv2.imread('assets/reaction_paws_set.png', cv2.IMREAD_UNCHANGED)
if img is None:
    print("Failed to load image")
    exit(1)

print(f"Shape: {img.shape}")
