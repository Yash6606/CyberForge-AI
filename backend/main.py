from fastapi import FastAPI, HTTPException, Response, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.services.ai_service import AIService
from app.services.nids_service import NIDSService
from app.services.reporting import ReportingService
from app.services.live_capture import LiveCaptureService
from app.services.feedback_service import FeedbackService
from app.services.external_intel import ExternalIntelService
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import time
import os

app = FastAPI(title="CyberForge AI", description="Next-Gen Hardware-Accelerated Cybersecurity Platform")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = AIService()
nids_service = NIDSService()
reporting_service = ReportingService()
live_capture_service = LiveCaptureService()
feedback_service = FeedbackService()
external_intel = ExternalIntelService()

class MessageRequest(BaseModel):
    text: str
    model_type: Optional[str] = 'rf'
    privacy_mode: Optional[bool] = False

class IntrusionRequest(BaseModel):
    protocol_type: str
    service: str
    flag: str
    src_bytes: int
    dst_bytes: int
    num_failed_logins: int
    logged_in: int
    count: int
    srv_count: int
    hot: int
    wrong_fragment: int
    urgent: int

class FeedbackRequest(BaseModel):
    text: str
    initial_score: float
    user_label: str
    confidence: float

@app.get("/")
async def root():
    return {"status": "online", "message": "CyberForge AI Engine is running"}

@app.post("/analyze")
async def analyze(request: MessageRequest):
    start_time = time.time()
    result = ai_service.analyze_message(request.text, request.model_type)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    end_time = time.time()
    result["latency"] = f"{int((end_time - start_time) * 1000)}ms"
    return result

@app.post("/vision/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    result = ai_service.analyze_image_threat(contents)
    return result

@app.post("/script/analyze")
async def analyze_script(request: Dict):
    if "code" not in request:
        raise HTTPException(status_code=400, detail="Missing code field")
    return ai_service.scan_script(request["code"])

@app.post("/intrusion/analyze")
async def analyze_intrusion(request: IntrusionRequest):
    result = nids_service.analyze_traffic(request.dict())
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@app.get("/intrusion/dashboard-data")
async def get_intrusion_dashboard():
    return nids_service.get_dashboard_data()

# --- New Features Routes ---

@app.post("/report/generate")
async def generate_report(analysis_result: Dict):
    filename, path = reporting_service.generate_threat_report(analysis_result)
    return {"filename": filename, "download_url": f"/report/download/{filename}"}

@app.get("/report/download/{filename}")
async def download_report(filename: str):
    path = os.path.join(os.path.dirname(__file__), 'reports', filename)
    if os.path.exists(path):
        return FileResponse(path, media_type='application/pdf', filename=filename)
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/live/status")
async def get_live_status():
    return live_capture_service.get_live_data()

@app.post("/live/toggle")
async def toggle_capture(active: bool):
    if active:
        live_capture_service.start_capture()
    else:
        live_capture_service.stop_capture()
    return {"status": "success", "is_active": active}

@app.post("/feedback")
async def save_feedback(request: FeedbackRequest):
    return feedback_service.save_feedback(request.text, request.initial_score, request.user_label, request.confidence)

@app.get("/intel/map")
async def get_threat_map():
    # Simulate a few global threat sources for the map
    return [
        {"id": 1, "color": "red", "lat": 40.7128, "lon": -74.0060, "name": "New York (DoS Source)"},
        {"id": 2, "color": "yellow", "lat": 51.5074, "lon": -0.1278, "name": "London (Probe Node)"},
        {"id": 3, "color": "purple", "lat": 35.6762, "lon": 139.6503, "name": "Tokyo (R2L Target)"},
        {"id": 4, "color": "blue", "lat": -33.8688, "lon": 151.2093, "name": "Sydney (Relay)"}
    ]

# --- Existing Metrics ---

@app.get("/metrics")
async def get_metrics():
    m = ai_service.get_metrics()
    n_m = nids_service.get_dashboard_data()["metrics"]
    m["nids_accuracy"] = f"{n_m['accuracy']}%"
    m["feedback_stats"] = feedback_service.get_feedback_stats()
    return m

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
