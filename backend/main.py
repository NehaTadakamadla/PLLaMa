from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, yaml, uuid

# ------------------------------------------------------
# ✅ Initialize FastAPI app
# ------------------------------------------------------
app = FastAPI(title="YOLO Model API", description="Object detection using YOLO", version="1.0")

# ✅ Allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------
# ✅ Load YOLO model
# ------------------------------------------------------
model_path = "src/yolo_model/weights/best.pt"
model = YOLO(model_path)

# ------------------------------------------------------
# ✅ Load English label names
# ------------------------------------------------------
yaml_path = "src/yolo_model/data/data_english.yaml"
with open(yaml_path, "r", encoding="utf-8") as f:
    yaml_data = yaml.safe_load(f)

english_names = yaml_data.get("names", {})

# ✅ Correct way to assign names
model.model.names = english_names

# ------------------------------------------------------
# ✅ Create directories safely
# ------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "src", "uploads")
RESULT_DIR = os.path.join(BASE_DIR, "src", "results")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

# ✅ Serve static files for browser access
app.mount("/results", StaticFiles(directory=RESULT_DIR), name="results")

# ------------------------------------------------------
# ✅ Prediction route
# ------------------------------------------------------
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Save uploaded image
    image_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run YOLO model inference
    results = model(image_path)

    # Prepare detection data
    detections = []
    result_filename = f"{uuid.uuid4().hex}_result.jpg"
    result_path = os.path.join(RESULT_DIR, result_filename)
    results[0].save(filename=result_path)

    for r in results:
        for box in r.boxes:
            class_id = int(box.cls)
            class_name = model.names[class_id]
            detections.append({
                "class": class_name,
                "confidence": round(float(box.conf) * 100, 2)
            })

    # ✅ Full URL for image (so React <img> can show it)
    annotated_url = f"http://127.0.0.1:8000/results/{result_filename}"

    # Return response
    return JSONResponse({
        "detections": detections,
        "annotated_image": annotated_url
    })
