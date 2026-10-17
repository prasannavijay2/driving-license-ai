import os
import shutil
import json
import uuid
from pathlib import Path
from typing import Dict, Any, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse, FileResponse
from config import settings
from models.schemas import (
    DocumentMetadata,
    LicenceData,
    ChatRequest,
    ChatResponse,
    SaveFormRequest,
    UpdateKeyRequest
)
from services.image_processor import validate_and_save_upload, process_document_to_images
from services.extraction_service import (
    extract_with_gemini,
    get_builtin_fallback_licences,
    validate_licence_fields
)
from services.qa_service import answer_document_query

router = APIRouter(prefix="/api", tags=["Licence API"])

# In-memory document store for fast access
DOCUMENTS_STORE: Dict[str, DocumentMetadata] = {}

def get_doc_or_404(doc_id: str) -> DocumentMetadata:
    if doc_id in DOCUMENTS_STORE:
        return DOCUMENTS_STORE[doc_id]
        
    # Check if saved on disk
    meta_path = settings.UPLOAD_DIR / doc_id / "meta.json"
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            doc_meta = DocumentMetadata(**data)
            DOCUMENTS_STORE[doc_id] = doc_meta
            return doc_meta
            
    raise HTTPException(status_code=404, detail="Document not found or expired.")

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "model": settings.GEMINI_MODEL
    }

@router.get("/config")
def get_config():
    has_key = bool(settings.GEMINI_API_KEY)
    masked = f"{settings.GEMINI_API_KEY[:6]}...{settings.GEMINI_API_KEY[-4:]}" if has_key and len(settings.GEMINI_API_KEY) > 10 else ""
    return {
        "gemini_configured": has_key,
        "masked_key": masked,
        "model": settings.GEMINI_MODEL,
        "models_available": ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    }

@router.post("/config")
def update_config(req: UpdateKeyRequest):
    if not req.api_key or len(req.api_key.strip()) < 10:
        raise HTTPException(status_code=400, detail="Invalid API key format.")
    settings.GEMINI_API_KEY = req.api_key.strip()
    if req.model:
        settings.GEMINI_MODEL = req.model.strip()
    return {"status": "success", "message": "API Key updated successfully."}

@router.get("/samples")
def list_samples():
    return [
        {
            "id": "sample1_maharashtra",
            "name": "Sample 1: Maharashtra DL (Rohan Deshmukh)",
            "state": "Maharashtra",
            "holder": "ROHAN ANIL DESHMUKH",
            "dl_number": "MH12 20190001234",
            "type": "image",
            "image_file": "sample1_maharashtra.png",
            "pdf_file": "sample1_maharashtra.pdf"
        },
        {
            "id": "sample2_delhi",
            "name": "Sample 2: Delhi DL (Priya Sharma)",
            "state": "Delhi",
            "holder": "PRIYA SHARMA",
            "dl_number": "DL-0420110005678",
            "type": "image",
            "image_file": "sample2_delhi.png",
            "pdf_file": "sample2_delhi.pdf"
        },
        {
            "id": "sample_both",
            "name": "Combined Sample (Maharashtra & Delhi Side-by-Side)",
            "state": "Maharashtra & Delhi",
            "holder": "Dual Licence Test Card",
            "dl_number": "Multiple",
            "type": "image",
            "image_file": "sample_both.png"
        }
    ]

@router.post("/sample/load")
def load_sample(sample_id: str = Form(...), format: str = Form("png")):
    sample_filename = f"{sample_id}.{format}"
    sample_src = settings.SAMPLES_DIR / sample_filename
    
    if not sample_src.exists():
        # Fallback to png if pdf not found
        sample_src = settings.SAMPLES_DIR / f"{sample_id}.png"
        sample_filename = f"{sample_id}.png"
        
    if not sample_src.exists():
        raise HTTPException(status_code=404, detail=f"Sample file '{sample_filename}' not found.")
        
    with open(sample_src, "rb") as f:
        file_bytes = f.read()
        
    doc_id, saved_path, mime_type = validate_and_save_upload(file_bytes, sample_filename)
    preview_urls, preview_data_urls, page_count, raw_pdf_text = process_document_to_images(doc_id, saved_path, mime_type)
    
    # Process extraction
    primary_preview_path = settings.UPLOAD_DIR / doc_id / "page_1.png"
    extraction_source = "gemini-multimodal"
    
    try:
        licences = extract_with_gemini(primary_preview_path)
    except Exception as e:
        print(f"[API] Gemini extraction notice: {e}. Utilizing built-in fallback parser.")
        licences = get_builtin_fallback_licences(sample_filename)
        extraction_source = "builtin-fallback"
        
    doc_meta = DocumentMetadata(
        document_id=doc_id,
        file_name=sample_filename,
        file_url=f"/api/document/{doc_id}/original",
        file_type=mime_type,
        page_count=page_count,
        current_page=1,
        preview_images=preview_urls,
        preview_data_urls=preview_data_urls,
        licences=licences,
        selected_index=0,
        extraction_source=extraction_source
    )
    
    DOCUMENTS_STORE[doc_id] = doc_meta
    with open(settings.UPLOAD_DIR / doc_id / "meta.json", "w", encoding="utf-8") as f:
        json.dump(doc_meta.dict(), f, indent=2)
        
    return doc_meta

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
    try:
        doc_id, saved_path, mime_type = validate_and_save_upload(contents, file.filename)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
        
    preview_urls, preview_data_urls, page_count, raw_pdf_text = process_document_to_images(doc_id, saved_path, mime_type)
    
    primary_preview_path = settings.UPLOAD_DIR / doc_id / "page_1.png"
    extraction_source = "gemini-multimodal"
    
    try:
        licences = extract_with_gemini(primary_preview_path)
    except Exception as e:
        print(f"[API] Gemini extraction error: {e}. Falling back to rule-based fallback.")
        licences = get_builtin_fallback_licences(file.filename)
        extraction_source = "builtin-fallback"
        
    doc_meta = DocumentMetadata(
        document_id=doc_id,
        file_name=file.filename,
        file_url=f"/api/document/{doc_id}/original",
        file_type=mime_type,
        page_count=page_count,
        current_page=1,
        preview_images=preview_urls,
        preview_data_urls=preview_data_urls,
        licences=licences,
        selected_index=0,
        extraction_source=extraction_source
    )
    
    DOCUMENTS_STORE[doc_id] = doc_meta
    with open(settings.UPLOAD_DIR / doc_id / "meta.json", "w", encoding="utf-8") as f:
        json.dump(doc_meta.dict(), f, indent=2)
        
    return doc_meta

@router.post("/chat")
def chat_document(req: ChatRequest):
    doc_meta = get_doc_or_404(req.document_id)
    
    # Select active licence data (either from request current_form_data or selected in document)
    if req.current_form_data and req.current_form_data.full_name:
        active_licence = req.current_form_data
    elif doc_meta.licences and len(doc_meta.licences) > doc_meta.selected_index:
        active_licence = doc_meta.licences[doc_meta.selected_index]
    else:
        raise HTTPException(status_code=400, detail="No active licence data available for chat.")
        
    preview_img = settings.UPLOAD_DIR / req.document_id / f"page_{doc_meta.current_page}.png"
    
    response = answer_document_query(
        question=req.message,
        licence=active_licence,
        image_path=preview_img if preview_img.exists() else None,
        history=req.history
    )
    return response

@router.post("/save")
def save_reviewed_licence(req: SaveFormRequest):
    doc_meta = get_doc_or_404(req.document_id)
    
    # Re-validate fields
    req.data.validations = validate_licence_fields(req.data)
    
    # Update stored data
    if req.licence_index < len(doc_meta.licences):
        doc_meta.licences[req.licence_index] = req.data
    else:
        doc_meta.licences.append(req.data)
        
    # Save to disk
    save_file = settings.UPLOAD_DIR / req.document_id / f"saved_licence_{req.licence_index}.json"
    with open(save_file, "w", encoding="utf-8") as f:
        json.dump(req.data.dict(), f, indent=2)
        
    # Also update meta.json
    with open(settings.UPLOAD_DIR / req.document_id / "meta.json", "w", encoding="utf-8") as f:
        json.dump(doc_meta.dict(), f, indent=2)
        
    return {
        "status": "success",
        "message": "Licence data reviewed, validated, and saved successfully.",
        "data": req.data
    }

@router.get("/export/{document_id}/{licence_index}")
def export_licence_json(document_id: str, licence_index: int = 0):
    doc_meta = get_doc_or_404(document_id)
    if licence_index >= len(doc_meta.licences):
        raise HTTPException(status_code=404, detail="Licence index not found.")
        
    licence_data = doc_meta.licences[licence_index]
    return JSONResponse(
        content=licence_data.dict(),
        headers={
            "Content-Disposition": f"attachment; filename=driving_licence_{licence_data.dl_number or document_id}.json"
        }
    )

@router.get("/document/{document_id}/image/{page_idx}")
def get_document_page_image(document_id: str, page_idx: int = 1):
    img_path = settings.UPLOAD_DIR / document_id / f"page_{page_idx}.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail="Page image not found.")
    return FileResponse(
        img_path,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*"
        }
    )

@router.get("/document/{document_id}/original")
def get_document_original(document_id: str):
    doc_dir = settings.UPLOAD_DIR / document_id
    if not doc_dir.exists():
        raise HTTPException(status_code=404, detail="Document not found.")
    for f in doc_dir.iterdir():
        if f.stem == "original":
            return FileResponse(f, headers={"Access-Control-Allow-Origin": "*"})
    raise HTTPException(status_code=404, detail="Original document not found.")
