# SignalScope — AI Image Forensic Analysis

SignalScope is a professional web application for detecting whether an image is
likely AI-generated or likely real. It presents detection results, evidence maps,
robustness analysis, and a structured forensic report.

> **Note**: SignalScope provides a _probabilistic assessment_ and should not be
> treated as definitive proof.

---

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| HTTP | Axios |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Install dependencies

```bash
cd signalscope
npm install
```

### Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Backend API base URL
VITE_API_BASE_URL=http://localhost:8000

# Use mock data during development (set to "false" for production)
VITE_USE_MOCK=true
```

### Run locally (development)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build for production

```bash
npm run build
```

Output is in `dist/`.

### Preview production build

```bash
npm run preview
```

---

## Connecting the Backend (Person 1 Integration)

1. Set `VITE_USE_MOCK=false` in your environment.
2. Set `VITE_API_BASE_URL` to the deployed backend URL.
3. The backend must expose:

```
POST /api/analyze
Content-Type: multipart/form-data
Body: { image: <file> }
```

Response (JSON):

```json
{
  "verdict": "LIKELY_AI_GENERATED",
  "confidence": 0.94,
  "evidence": {
    "imageUrl": "https://...",
    "explanation": "..."
  },
  "robustness": {
    "original": 0.94,
    "compressed": 0.91,
    "resized": 0.89,
    "screenshot": 0.87
  },
  "generalization": {
    "generatorName": "Generator X",
    "auc": 0.87,
    "description": "..."
  }
}
```

See `src/types/analysis.ts` for the full TypeScript interface.

---

## Project Structure

```
src/
├── components/       # Reusable UI components
├── constants/        # Config (MAX_FILE_SIZE, SUPPORTED_TYPES, API_URL)
├── hooks/            # useAnalysis — state machine hook
├── pages/            # HomePage (main app page)
├── services/         # analysisService.ts (prod) + mockAnalysisService.ts (dev)
├── types/            # TypeScript interfaces (API contract)
└── utils/            # File validation utilities
```

---

## Team Responsibilities

| Person | Area |
|---|---|
| Person 1 | Team lead, final integration, repo management |
| Person 2 | ML model (CNN/ViT), prediction function |
| Person 3 | Preprocessing, generalization evaluation, AUC |
| Person 4 | Grad-CAM, evidence map, explanations |
| Person 5 | Robustness transforms + confidence results |
| **Person 6** | **This frontend — UI, upload, results, deployment** |

---

## Deployment

Any static host (Vercel, Netlify, GitHub Pages, nginx):

1. Run `npm run build`
2. Serve the `dist/` folder
3. Set environment variables on your host (not in committed files)

---

## Responsible Use

SignalScope provides a probabilistic assessment only. Results should not be
used as definitive proof of whether an image is real or AI-generated.
