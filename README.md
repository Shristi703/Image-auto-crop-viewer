# Content-Aware AI Smart Auto Crop & Aspect Ratio Viewer

> A professional full-stack MERN application with true on-device Computer Vision AI for intelligent, content-aware image cropping, subject preservation, and MongoDB Atlas GridFS storage.

---

## 🌟 True AI Smart Auto-Crop Architecture

Unlike simplistic center-croppers or mock AI badges, this application features a real **Multi-Pipeline Computer Vision Engine**:

1. **MediaPipe BlazeFace AI Face Detector**:
   - Detects human faces with high geometric precision.
   - Preserves complete facial features, foreheads, hair, chin, and natural headroom without decapitation.
   - Automatically selects optimal portrait framing (3:4 or 1:1) in Smart Auto mode.
2. **TensorFlow.js COCO-SSD Object & Animal Detector**:
   - Detects cats, dogs, birds, horses, people, cars, laptops, and 80 standard classes.
   - Intelligently calculates bounding boxes enclosing the entire animal body with natural breathing margins (ears, whiskers, paws, tail).
3. **Foreground Product Contour Analyzer**:
   - Analyzes standalone commercial product photography (headphones, shoes, watches, bottles, accessories).
   - Identifies product boundaries with balanced studio margins.
4. **UI Screenshot & Document Layout Analyzer**:
   - Evaluates high-frequency edge density and structural text rows.
   - Prevents cutting off navigation bars, buttons, or readable UI elements by maintaining full-frame aspect ratios in Smart Auto mode.
5. **Visual Contrast Saliency Fallback**:
   - Multi-scale gradient contrast density for panoramic landscapes and scenery with honest labeling (no fake AI claims).
6. **Smart Auto Default & Manual Ratios**:
   - **Smart Auto (Default)**: Automatically determines the best aspect ratio based on subject geometry.
   - **Manual Ratios**: 1:1 (Square), 4:3 (Standard), 16:9 (Widescreen), 3:2 (Classic Photo).
   - **Smart Padding / Contain Mode**: When a manual ratio would cut off subject boundaries, offers a clean contain-with-padding option to prevent any clipping.
7. **Zero Distortion Guarantee**:
   - Slices uniform pixels without stretching, squashing, or warping.
   - Rendered using HTML5 Canvas API and direct download.
8. **MongoDB Atlas GridFS Storage**:
   - Saves original uncropped images directly to MongoDB Atlas GridFS binary chunk collections (`images.files` and `images.chunks`).
   - Saved gallery allows loading any image back into the AI cropping viewer or deleting records.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/image_crop_viewer`) or free MongoDB Atlas URI.

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd Task-2

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Running Locally
Run both servers concurrently:
```bash
# Terminal 1: Backend (Express + MongoDB GridFS)
cd backend
npm run dev

# Terminal 2: Frontend (React 19 + Vite + TensorFlow.js)
cd frontend
npm run dev
```

Visit: **http://localhost:5173**

---

## 🧪 Quick Test Categories (Built-in Presets)

The application includes 5 one-click test category presets directly on the upload panel:

| Category | Test Sample | Expected AI Behavior |
| :--- | :--- | :--- |
| **🐱 Cat Portrait** | Ginger cat sitting upright with lots of background | Detects Cat (78% confidence), preserves pointed ears, face, and full body |
| **👤 Human Portrait** | Headshot portrait | BlazeFace detects face (100% confidence), frames head/hair with 3:4 portrait ratio |
| **🏞️ Scenic Landscape** | Alpine lake & mountains | Visual saliency balances horizon, frames wide 16:9 scenery |
| **💻 UI Screenshot** | SaaS dashboard screenshot | Identifies UI layout, preserves 100% of readable interface without cutting controls |
| **🎧 Product Shot** | Studio wireless headphones | Identifies product bounds (73% confidence), frames full product with balanced studio margins |

---

## 🌐 Deployment & Zero-Cost Architecture

- **Frontend (Vercel)**:
  - Deployed as a static SPA with rewrite configuration in `frontend/vercel.json`.
  - Computer vision models run **100% client-side** using WebGL acceleration via TensorFlow.js and BlazeFace.
  - **API / Hosting Costs**: **$0.00** (Free, zero external API keys or recurring vision subscription fees).
- **Backend (Render)**:
  - Express.js server defined in `backend/render.yaml`.
  - Connects to MongoDB Atlas GridFS via `MONGODB_URI`.
- **Database (MongoDB Atlas)**:
  - Uses free M0 cluster with GridFS bucket `images`.

---

## 📄 License
ISC
