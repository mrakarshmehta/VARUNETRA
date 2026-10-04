"""
VARUNETRA - Urban Flood Nowcasting System (Drainage and Rainfall Coupling)
Problem Statement SIH26085 | Ministry of Earth Sciences (MoES)
"""

import os
import sys

# Ensure project root is in sys.path for simulation and ml packages
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

for path in [PROJECT_ROOT, BACKEND_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

__version__ = "1.0.0"
