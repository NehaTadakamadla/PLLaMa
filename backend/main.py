from fastapi import FastAPI, UploadFile, File, Request
from ultralytics import YOLO
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import torch
import shutil, os, yaml, uuid

# ------------------------------------------------------
# ✅ Initialize FastAPI app
# ------------------------------------------------------
app = FastAPI(
    title="AgriBot API (YOLO + PLLaMA)",
    description="AI-powered detection & response system",
    version="2.0"
)

# ------------------------------------------------------
# ✅ Allow requests from frontend (React/Vite)
# ------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite frontend
        "http://localhost:3000",  # CRA/Next fallback
        "*"                       # temporary wildcard for ngrok testing
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------
# ✅ Load YOLO model for crop/disease detection
# ------------------------------------------------------
print("🧠 Loading YOLO model...")
model_path = "src/yolo_model/weights/best.pt"
model = YOLO(model_path)

yaml_path = "src/yolo_model/data/data_english.yaml"
with open(yaml_path, "r", encoding="utf-8") as f:
    yaml_data = yaml.safe_load(f)
english_names = yaml_data.get("names", {})

model.model.names = english_names
print("✅ YOLO model loaded successfully.")

# ------------------------------------------------------
# ✅ Setup directories for upload and result storage
# ------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "src", "uploads")
RESULT_DIR = os.path.join(BASE_DIR, "src", "results")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

app.mount("/results", StaticFiles(directory=RESULT_DIR), name="results")

# ------------------------------------------------------
# ✅ Load PLLaMA model (local inference)
# ------------------------------------------------------
print("🧩 Loading PLLaMA model... this may take a few minutes on first run.")

try:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"⚙️ Using device: {device}")

    # Change this to your fine-tuned or preferred model
    MODEL_NAME = "meta-llama/Llama-2-7b-chat-hf"

    pipe = pipeline(
        "text-generation",
        model=MODEL_NAME,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map="auto"
    )

    print("✅ PLLaMA model loaded successfully.")

except Exception as e:
    print("❌ Failed to load PLLaMA model:", e)
    pipe = None

# ------------------------------------------------------
# ✅ YOLO Prediction Route
# ------------------------------------------------------
@app.post("/predict")
async def predict(request: Request, file: UploadFile = File(...)):
    """Run YOLO on uploaded image and return detection results."""
    image_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    results = model(image_path)
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

    base_url = str(request.base_url).rstrip("/")
    annotated_url = f"{base_url}/results/{result_filename}"

    NGROK_URL = os.getenv("NGROK_URL", "").strip()
    if NGROK_URL:
        annotated_url = f"{NGROK_URL}/results/{result_filename}"

    return JSONResponse({
        "detections": detections,
        "annotated_image": annotated_url
    })

# ------------------------------------------------------
# ✅ PLLaMA Query Route — now runs locally, not forwarded
# ------------------------------------------------------
@app.post("/query")
async def query_pllama(request: Request):
    """Run PLLaMA model locally to generate responses."""
    try:
        if pipe is None:
            return JSONResponse(
                content={"error": "PLLaMA model not loaded. Check model path or GPU memory."},
                status_code=500
            )

        data = await request.json()
        user_query = data.get("user_query") or data.get("prompt") or ""
        if not user_query.strip():
            return JSONResponse({"error": "Missing 'user_query' or 'prompt' in request"}, status_code=400)

        print(f"\n🧠 Query received: {user_query[:200]}")

        # Generate model response
        result = pipe(
            user_query,
            max_new_tokens=300,
            temperature=0.7,
            do_sample=True,
            top_p=0.9
        )[0]["generated_text"]

        print(f"✅ Model output: {result[:300]}")
        return {"response": result.strip()}

    except Exception as e:
        print("❌ PLLaMA error:", e)
        return JSONResponse(
            content={"error": f"Failed to run PLLaMA model: {str(e)}"},
            status_code=500
        )

# ------------------------------------------------------
# ✅ Root health check
# ------------------------------------------------------
@app.get("/")
async def root():
    return {"status": "✅ YOLO + PLLaMA API running", "version": "2.0"}
