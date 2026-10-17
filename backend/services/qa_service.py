import os
import json
import base64
import re
import urllib.request
from pathlib import Path
from typing import List, Dict, Any, Tuple
from config import settings
from models.schemas import LicenceData, ChatHistoryItem, ChatResponse

QA_SYSTEM_PROMPT = """You are an AI Document Verification Assistant specialized in answering user queries about the uploaded Driving Licence.

CRITICAL INSTRUCTIONS:
1. Grounding & Anti-Hallucination: Answer the question ONLY using information that is explicitly stated on the uploaded licence document and extracted data.
2. Unanswerable Information: If the requested information is NOT present on the document (for example: phone number, email address, vehicle registration plate, insurance company, marital status, income, educational qualification), state clearly:
"The uploaded document does not contain this information."
Do NOT invent or infer facts.
3. Citations: Identify which field(s) or section(s) on the card support your answer (e.g., 'Valid Till', 'Class of Vehicle', 'Address', 'DOI', 'Issuing Authority').
4. Tone: Helpful, professional, and concise.

Return your response in pure JSON format:
{
  "reply": "Your grounded response text.",
  "citations": ["Field or section name"],
  "grounded": true,
  "unanswerable": false
}
"""

def answer_document_query(
    question: str,
    licence: LicenceData,
    image_path: Path = None,
    history: List[ChatHistoryItem] = None,
    api_key: str = None
) -> ChatResponse:
    key = api_key or settings.GEMINI_API_KEY
    
    if key and image_path and image_path.exists():
        try:
            return _call_gemini_qa(question, licence, image_path, history or [], key)
        except Exception as e:
            print(f"[QA Service] Gemini error, falling back to local grounded matcher: {e}")
            return _local_grounded_qa(question, licence)
    else:
        return _local_grounded_qa(question, licence)

def _call_gemini_qa(
    question: str,
    licence: LicenceData,
    image_path: Path,
    history: List[ChatHistoryItem],
    key: str
) -> ChatResponse:
    with open(image_path, "rb") as f:
        img_bytes = f.read()
    img_b64 = base64.b64encode(img_bytes).decode("utf-8")
    
    # Format current licence facts
    facts_summary = f"""
Current Extracted Licence Facts:
- Full Name: {licence.full_name}
- Licence Number: {licence.dl_number}
- Date of Birth: {licence.dob}
- Date of Issue: {licence.date_of_issue}
- Date of Expiry / Valid Till: {licence.date_of_expiry}
- Address: {licence.address}
- Authorized Vehicles: {', '.join(licence.vehicle_classes)}
- Issuing Authority: {licence.issuing_authority}
- Father/Spouse Name: {licence.father_or_spouse_name}
- Blood Group: {licence.blood_group}
- State: {licence.state}
- Restrictions/Notes: {licence.restrictions}
"""

    history_context = ""
    if history:
        history_context = "\nConversation History:\n" + "\n".join(
            [f"{item.role.capitalize()}: {item.content}" for item in history[-4:]]
        )

    user_prompt = f"""{facts_summary}
{history_context}

User Question: "{question}"

Answer the question strictly according to the driving licence. Return JSON.
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={key}"
    payload = {
        "contents": [{
            "parts": [
                {"text": QA_SYSTEM_PROMPT + "\n\n" + user_prompt},
                {
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": img_b64
                    }
                }
            ]
        }],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))

    content = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\n?", "", content)
        content = re.sub(r"\n?```$", "", content)
        
    data = json.loads(content)
    return ChatResponse(
        reply=data.get("reply", "No response generated."),
        citations=data.get("citations", []),
        grounded=data.get("grounded", True),
        unanswerable=data.get("unanswerable", False)
    )

def _local_grounded_qa(question: str, licence: LicenceData) -> ChatResponse:
    q = question.lower().strip()
    
    # 1. Expiry date
    if any(k in q for k in ["expiry", "valid till", "expire", "validity"]):
        return ChatResponse(
            reply=f"The licence expiry date (Valid Till) is {licence.date_of_expiry}.",
            citations=["Valid Till", "date_of_expiry"],
            grounded=True,
            unanswerable=False
        )
        
    # 2. Authorized vehicles / classes
    if any(k in q for k in ["vehicle", "authorized to drive", "authorised to drive", "can drive", "class of vehicle"]):
        classes = ", ".join(licence.vehicle_classes) if licence.vehicle_classes else "None recorded"
        details_list = [f"{v.category} ({v.description})" for v in licence.vehicle_details]
        details_text = f" ({'; '.join(details_list)})" if details_list else ""
        return ChatResponse(
            reply=f"This person is authorised to drive: {classes}{details_text}.",
            citations=["Authorisation to Drive", "vehicle_classes"],
            grounded=True,
            unanswerable=False
        )
        
    # 3. Licence number
    if any(k in q for k in ["licence number", "license number", "dl number", "dl no"]):
        return ChatResponse(
            reply=f"The driving licence number is {licence.dl_number}.",
            citations=["DL No", "dl_number"],
            grounded=True,
            unanswerable=False
        )
        
    # 4. Name / Who is this
    if any(k in q for k in ["name", "who is", "holder"]):
        return ChatResponse(
            reply=f"The licence holder's full name is {licence.full_name}.",
            citations=["Name", "full_name"],
            grounded=True,
            unanswerable=False
        )
        
    # 5. Date of Birth / Age
    if any(k in q for k in ["dob", "birth", "born", "age"]):
        return ChatResponse(
            reply=f"The date of birth recorded is {licence.dob}.",
            citations=["DOB", "date_of_birth"],
            grounded=True,
            unanswerable=False
        )
        
    # 6. Date of Issue
    if any(k in q for k in ["issue", "issued on", "doi"]):
        return ChatResponse(
            reply=f"The licence was issued on (DOI) {licence.date_of_issue}.",
            citations=["DOI", "date_of_issue"],
            grounded=True,
            unanswerable=False
        )
        
    # 7. Address
    if any(k in q for k in ["address", "residence", "live", "location"]):
        return ChatResponse(
            reply=f"The registered address is: {licence.address}.",
            citations=["Address", "address"],
            grounded=True,
            unanswerable=False
        )
        
    # 8. Issuing authority / RTO
    if any(k in q for k in ["issuing authority", "authority", "rto", "transport department"]):
        return ChatResponse(
            reply=f"The issuing authority is {licence.issuing_authority}.",
            citations=["Signature of Issuing Authority", "issuing_authority"],
            grounded=True,
            unanswerable=False
        )
        
    # 9. Blood group
    if any(k in q for k in ["blood", "bg"]):
        bg = licence.blood_group or "Not specified"
        return ChatResponse(
            reply=f"The blood group indicated is {bg}.",
            citations=["Blood Group", "blood_group"],
            grounded=True,
            unanswerable=False
        )
        
    # 10. Father / Spouse
    if any(k in q for k in ["father", "husband", "spouse", "parent", "s/d/w"]):
        f_name = licence.father_or_spouse_name or "Not listed"
        return ChatResponse(
            reply=f"The father/guardian/spouse name listed is {f_name}.",
            citations=["S/D/W of", "father_or_spouse_name"],
            grounded=True,
            unanswerable=False
        )

    # 11. Known unavailable fields (anti-hallucination guard)
    if any(k in q for k in ["phone", "mobile", "contact", "email", "salary", "income", "car model", "registration number", "plate number", "insurance"]):
        return ChatResponse(
            reply="The uploaded document does not contain this information.",
            citations=[],
            grounded=True,
            unanswerable=True
        )

    return ChatResponse(
        reply="The uploaded document does not contain information to answer this question. Please ask regarding details present on the licence (name, licence number, dates, authorized vehicle classes, address, issuing authority, blood group).",
        citations=[],
        grounded=True,
        unanswerable=True
    )
