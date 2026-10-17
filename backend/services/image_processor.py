import os
import uuid
from pathlib import Path
from typing import List, Tuple, Dict
from PIL import Image, ImageOps
import pymupdf as fitz
from config import settings

def validate_and_save_upload(file_bytes: bytes, filename: str) -> Tuple[str, Path, str]:
    """
    Validates file extension, generates unique document ID, and saves original file.
    """
    ext = Path(filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise ValueError(f"File extension '{ext}' is not supported. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}")
    
    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise ValueError(f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.")
        
    doc_id = str(uuid.uuid4())
    doc_dir = settings.UPLOAD_DIR / doc_id
    doc_dir.mkdir(parents=True, exist_ok=True)
    
    saved_path = doc_dir / f"original{ext}"
    with open(saved_path, "wb") as f:
        f.write(file_bytes)
        
    mime_type = "application/pdf" if ext == ".pdf" else f"image/{ext.replace('.', '')}"
    if mime_type == "image/jpg":
        mime_type = "image/jpeg"
        
    return doc_id, saved_path, mime_type

def process_document_to_images(doc_id: str, file_path: Path, mime_type: str) -> Tuple[List[str], int, str]:
    """
    Processes the uploaded file into high-quality preview PNGs.
    Returns:
    - preview_relative_urls: list of web accessible relative URLs
    - page_count: total pages
    - raw_pdf_text: any native text found
    """
    doc_dir = file_path.parent
    preview_urls = []
    raw_pdf_text = ""
    
    if mime_type == "application/pdf":
        pdf_doc = fitz.open(file_path)
        page_count = len(pdf_doc)
        
        for idx in range(page_count):
            page = pdf_doc.load_page(idx)
            raw_pdf_text += page.get_text() + "\n"
            
            # Render page at 2x resolution (144 dpi) for clear text
            pix = page.get_pixmap(dpi=150)
            img_filename = f"page_{idx + 1}.png"
            img_path = doc_dir / img_filename
            pix.save(str(img_path))
            preview_urls.append(f"/uploads/{doc_id}/{img_filename}")
            
        pdf_doc.close()
    else:
        page_count = 1
        img = Image.open(file_path)
        img = ImageOps.exif_transpose(img) # Correct phone orientation
        
        # Save standard preview PNG
        preview_filename = "page_1.png"
        preview_path = doc_dir / preview_filename
        img.save(preview_path, "PNG")
        preview_urls.append(f"/uploads/{doc_id}/{preview_filename}")
        
    return preview_urls, page_count, raw_pdf_text.strip()
