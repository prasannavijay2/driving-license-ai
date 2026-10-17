from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    ymin: float = Field(0.0, description="Top edge percentage (0-100)")
    xmin: float = Field(0.0, description="Left edge percentage (0-100)")
    ymax: float = Field(100.0, description="Bottom edge percentage (0-100)")
    xmax: float = Field(100.0, description="Right edge percentage (0-100)")
    label: Optional[str] = None

class VehicleClassDetail(BaseModel):
    category: str
    description: Optional[str] = ""
    doi: Optional[str] = ""
    valid_till: Optional[str] = ""

class FieldValidation(BaseModel):
    field_name: str
    is_valid: bool
    warning: Optional[str] = None

class LicenceData(BaseModel):
    full_name: str = ""
    dl_number: str = ""
    dob: str = ""
    date_of_issue: str = ""
    date_of_expiry: str = ""
    address: str = ""
    vehicle_classes: List[str] = Field(default_factory=list)
    vehicle_details: List[VehicleClassDetail] = Field(default_factory=list)
    issuing_authority: str = ""
    father_or_spouse_name: Optional[str] = ""
    blood_group: Optional[str] = ""
    state: Optional[str] = ""
    restrictions: Optional[str] = ""
    raw_text: Optional[str] = ""
    bounding_boxes: Dict[str, BoundingBox] = Field(default_factory=dict)
    confidence_scores: Dict[str, float] = Field(default_factory=dict)
    validations: List[FieldValidation] = Field(default_factory=list)

class DocumentMetadata(BaseModel):
    document_id: str
    file_name: str
    file_url: str
    file_type: str
    page_count: int = 1
    current_page: int = 1
    preview_images: List[str] = Field(default_factory=list)
    preview_data_urls: List[str] = Field(default_factory=list)
    licences: List[LicenceData] = Field(default_factory=list)
    selected_index: int = 0
    extraction_source: str = "gemini-multimodal"

class ChatHistoryItem(BaseModel):
    id: Optional[str] = None
    role: str
    content: str
    timestamp: Optional[str] = None
    citations: List[str] = Field(default_factory=list)
    grounded: bool = True

class ChatRequest(BaseModel):
    document_id: str
    message: str
    history: List[ChatHistoryItem] = Field(default_factory=list)
    current_form_data: Optional[LicenceData] = None

class ChatResponse(BaseModel):
    reply: str
    citations: List[str] = Field(default_factory=list)
    grounded: bool = True
    unanswerable: bool = False

class SaveFormRequest(BaseModel):
    document_id: str
    licence_index: int = 0
    data: LicenceData

class UpdateKeyRequest(BaseModel):
    api_key: str
    model: Optional[str] = "gemini-2.5-flash"
