# Global FM - Packaging Guide

This guide explains how to create a distributable ZIP package of the Global FM application.

## What to Include

The ZIP package should contain:

### Required Directories
- `backend/` - Motoko backend canister code
- `frontend/` - React frontend application
- `assets/` - All textures, images, and static assets

### Required Files
- `dfx.json` - Internet Computer project configuration
- `README.md` - Main documentation
- `SETUP_INSTRUCTIONS.md` - Quick setup guide
- `PACKAGING_GUIDE.md` - This file

### Excluded Items
- `node_modules/` - Will be installed by user
- `dist/` - Build artifacts
- `.dfx/` - Local canister state
- `target/` - Motoko build cache
- `.git/` - Version control

## Creating the ZIP Package

### Method 1: Using Command Line (Recommended)

#### On macOS/Linux:

