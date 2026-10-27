# Image Auto Crop & Aspect Ratio Viewer

> A professional full-stack MERN application built for developer interview assignment. Enables visitors to upload images from desktop or mobile devices, preview instantaneous distortion-free center cropping across multiple aspect ratios (1:1, 4:3, 16:9, 3:2), save originals securely to **MongoDB Atlas GridFS**, and generate high-fidelity cropped image downloads via the **HTML5 Canvas API**.

---

## 🌟 Key Features

1. **Instant Client-Side Preview**: Visitors select any JPG, PNG, or WebP image up to 5 MB and see an immediate preview before saving to the database.
2. **Automated Metadata Extraction**: Instantly calculates and displays:
   - Image resolution (`width × height px`)
   - Original aspect ratio (GCD-reduced fraction, e.g., `16:9`, `4:3`, `1:1`, `3:2`, and decimal value)
   - File size (`KB` / `MB`) and MIME format
   - Dynamic target cropped dimensions and frame area retention percentage.
3. **Zero-Distortion Aspect Ratio Cropping**:
   - Supported standard aspect ratios: **1:1** (Square), **4:3** (Standard), **16:9** (Widescreen), and **3:2** (Classic Photo).
   - Powered by CSS `object-fit: cover` and `object-position: center`.
   - **Guaranteed**: Never stretches, squashes, or distorts images regardless of source dimensions.
4. **Cover vs. Contain Comparison**: Toggle between **Cover (Cropped)** and **Contain (Full Frame)** to inspect crop borders versus the original uncropped frame.
5. **Rule of Thirds Alignment Overlay**: Toggleable 3×3 photographic composition grid and center crosshair.
6. **MongoDB Atlas GridFS Storage**:
   - Uploads original images to MongoDB GridFS using Express multipart streams.
   - Preserves original files unchanged in binary chunks (`images.files` and `images.chunks`).
7. **Dynamic Saved Images Gallery**:
   - Fetches metadata directly from `GET /api/images`.
   - Streams image files directly from MongoDB GridFS using `GET /api/images/:id/file`.
   - Click "Crop & View" on any saved image to load it into the active cropping canvas.
   - Delete action allows managing stored gallery items.
8. **Client-Side Canvas Crop Download**:
   - The "Download Cropped Image" button uses the HTML5 Canvas API to calculate the exact center-crop slice matching the selected ratio.
   - Exports high-resolution JPEG/PNG/WebP downloads without distortion.
9. **Built-in Seed Script**:
   - Includes sample images across all 4 standard aspect ratios (1:1, 4:3, 16:9, 3:2) auto-seeded into MongoDB GridFS so interviewers have immediate test data.
10. **Dual-Layer Validation**: Strict 5 MB file size limit and MIME validation (`image/jpeg`, `image/png`, `image/webp`) enforced on both frontend and backend.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Fast single-page application |
| **Styling** | Vanilla CSS3 (Custom Design System) | Glassmorphic light theme, responsive grid/flexbox |
| **Icons** | Lucide React | Modern, clean UI iconography |
| **Backend** | Node.js + Express.js | REST API, streaming, and CORS middleware |
| **Database** | MongoDB Atlas with GridFS | Binary chunk storage for images > 16MB capable |
| **Metadata** | Mongoose + image-size | Server-side metadata validation and schema tracking |
| **Client Export** | HTML5 Canvas API | High-resolution center crop generation & download |

---

## 📁 Repository Structure

```text
Task-2/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MongoDB connection & GridFS bucket initialization
│   │   ├── controllers/
│   │   │   └── imageController.js  # Upload, list, stream from GridFS, delete
│   │   ├── middleware/
│   │   │   └── upload.js           # Multer memory storage & 5MB validation
│   │   ├── models/
│   │   │   └── ImageMeta.js        # Mongoose schema for image metadata
│   │   ├── routes/
│   │   │   └── imageRoutes.js      # REST API endpoints
│   │   ├── scripts/
│   │   │   ├── generateSamplePng.js# Zero-dependency programmatic PNG generator
│   │   │   └── seed.js             # Seeds sample images into GridFS
│   │   └── server.js               # Express application entrypoint
│   ├── .env.example                # Backend environment template
│   ├── package.json
│   └── render.yaml                 # Render cloud deployment blueprint
├── frontend/
│   ├── public/
│   │   └── favicon.svg             # Custom SVG favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActionButtons.jsx   # Save to DB & Canvas Download buttons
│   │   │   ├── CropViewer.jsx      # Aspect ratio controls & crop preview
│   │   │   ├── Header.jsx          # Top navigation & status indicators
│   │   │   ├── ImageDetails.jsx    # Metadata and dimension metrics
│   │   │   ├── ImageUploader.jsx   # Drag-and-drop upload zone
│   │   │   ├── SavedGallery.jsx    # MongoDB GridFS gallery cards
│   │   │   └── Toast.jsx           # Floating notification alerts
│   │   ├── utils/
│   │   │   ├── api.js              # Fetch client using VITE_API_URL
│   │   │   ├── canvasCrop.js       # HTML5 Canvas center-crop exporter
│   │   │   └── formatters.js       # GCD aspect ratio & byte formatters
│   │   ├── App.jsx                 # Main application state orchestrator
│   │   ├── index.css               # Clean, premium responsive light theme
│   │   └── main.jsx
│   ├── .env.example                # Frontend environment template
│   ├── package.json
│   ├── vercel.json                 # Vercel SPA rewrite configuration
│   └── vite.config.js              # Vite server & API proxy configuration
├── package.json                    # Root scripts
└── README.md                       # Complete documentation
```

---

## 🚀 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v22)
- [MongoDB](https://www.mongodb.com/) (Local service or free MongoDB Atlas URI)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/image-auto-crop-viewer.git
cd image-auto-crop-viewer
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env` (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/image_crop_viewer
CLIENT_ORIGIN=http://localhost:5173,http://localhost:3000,*
```

Start the backend:
```bash
npm run dev
# Or run with seed:
npm start
```
*The server will start on `http://localhost:5000` and automatically seed 4 sample images of distinct ratios into MongoDB GridFS if the database is empty.*

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

Start Vite dev server:
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## ☁️ Cloud Deployment Guide

Follow these steps to deploy the application online and generate a public link to share with your interviewer.

### Step 1: MongoDB Atlas (Cloud Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Create a free **M0 Shared Cluster** (e.g. AWS / us-east-1).
3. Under **Security > Database Access**:
   - Create a database user (e.g., `appuser` with password `SecurePass123!`).
4. Under **Security > Network Access**:
   - Click **Add IP Address** > Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so Render can connect.
5. Under **Deployments > Database > Connect**:
   - Select **Drivers (Node.js)**.
   - Copy your connection string:
     `mongodb+srv://appuser:SecurePass123!@cluster0.xxxx.mongodb.net/image_crop_viewer?retryWrites=true&w=majority`

---

### Step 2: Render Deployment (Express Backend)
1. Go to [Render](https://render.com/) and sign in with GitHub.
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Name**: `image-crop-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string from Step 1>`
   - `CLIENT_ORIGIN`: `*` (or your Vercel URL once created)
6. Click **Deploy Web Service**.
7. Note down your public backend URL: `https://image-crop-backend.onrender.com`.

---

### Step 3: Vercel Deployment (React Frontend)
1. Go to [Vercel](https://vercel.com/) and sign in with GitHub.
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
5. Under **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://image-crop-backend.onrender.com` (Your Render backend URL without trailing slash)
6. Click **Deploy**.
7. Vercel will build and assign a production URL: `https://image-crop-viewer.vercel.app`.

---

## 📡 REST API Reference

### 1. Health Check
`GET /api/health`
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "message": "Image Auto Crop & Aspect Ratio Viewer Backend API is running.",
  "timestamp": "2026-10-27T13:29:00.850Z"
}
```

### 2. Upload Image to GridFS
`POST /api/images`
- **Content-Type**: `multipart/form-data`
- **Body**: `image` (binary file, JPG/PNG/WebP, max 5MB)
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Image uploaded and stored in GridFS successfully.",
  "data": {
    "id": "6ae0a70b91dbf809b39de28f",
    "filename": "1793107723459-cinematic.png",
    "originalName": "cinematic.png",
    "mimeType": "image/png",
    "size": 169130,
    "width": 1280,
    "height": 720,
    "aspectRatio": "16:9",
    "aspectRatioDecimal": 1.78,
    "fileUrl": "/api/images/6ae0a70b91dbf809b39de28f/file"
  }
}
```

### 3. List Stored Images
`GET /api/images`
- **Response**: `200 OK`
```json
{
  "success": true,
  "count": 4,
  "data": [ ... ]
}
```

### 4. Stream Image File from GridFS
`GET /api/images/:id/file`
- **Response**: `200 OK` (Binary image stream)
- **Headers**:
  - `Content-Type: image/png` (or image/jpeg, image/webp)
  - `Content-Length: <bytes>`
  - `Cache-Control: public, max-age=86400`

### 5. Delete Image
`DELETE /api/images/:id`
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Image deleted successfully from database and GridFS storage."
}
```

---

## 🧪 Testing Checklist for Interviewer

1. **Upload an Image**:
   - Drag and drop or browse any JPG, PNG, or WebP from laptop or mobile.
   - Verify file is previewed immediately without uploading to DB yet.
   - Verify dimensions, file size, format, and original ratio are detected.
2. **Aspect Ratio Switching**:
   - Select **1:1**, **4:3**, **16:9**, and **3:2**.
   - Notice the preview smoothly adapts to the aspect ratio box.
   - Confirm the image never squashes or stretches (centered `object-fit: cover`).
3. **Cover vs. Contain Comparison**:
   - Switch to **Contain (Full)** to see the whole image letterboxed.
   - Switch back to **Cover (Cropped)** to view the clean crop.
4. **Save to Database**:
   - Click **Save to Database**.
   - Watch the button show saving spinner and then "Saved in MongoDB GridFS".
   - Notice the image immediately appears in the **MongoDB Saved Images Gallery**.
5. **Saved Gallery Preview**:
   - Click "Crop & View" on any card in the gallery.
   - The selected image streams directly from MongoDB GridFS and is loaded into the cropping viewer.
6. **Download Cropped Image**:
   - Click **Download Cropped (<ratio>)**.
   - Inspect the downloaded file: it will be physically cropped to the exact target ratio slice using Canvas API.
7. **Mobile Responsiveness**:
   - Resize window to mobile viewport or test on mobile device.
   - Upload, preview, controls, and gallery adapt seamlessly.

---

## 📄 License
MIT License. Built for developer interview evaluation.
