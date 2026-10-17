import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Eye, EyeOff, Layers, ChevronLeft, ChevronRight, ExternalLink, ArrowLeft } from 'lucide-react';
import { resolveImageUrl } from '../services/api';

export default function DocumentViewer({
  docMetadata,
  selectedLicenceIndex,
  onSelectLicence,
  highlightedField,
  onHoverBox,
  onNewUpload
}) {
  const [zoom, setZoom] = useState(1);
  const [showBoxes, setShowBoxes] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef(null);

  if (!docMetadata) return null;

  const currentLicence = docMetadata.licences[selectedLicenceIndex] || docMetadata.licences[0] || {};
  const boundingBoxes = currentLicence.bounding_boxes || {};
  
  // Prefer direct base64 data URI (guaranteed to render everywhere), fallback to resolved URL
  const rawPreview =
    (docMetadata.preview_data_urls && docMetadata.preview_data_urls[currentPage - 1]) ||
    docMetadata.preview_images?.[currentPage - 1] ||
    docMetadata.preview_images?.[0] ||
    '';
  const previewImage = resolveImageUrl(rawPreview);
  const fileUrl = resolveImageUrl(docMetadata.file_url);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.6));
  const handleResetZoom = () => setZoom(1);

  // Friendly names for bounding box tooltips
  const fieldDisplayNames = {
    full_name: 'Full Name',
    dl_number: 'Licence No.',
    dob: 'Date of Birth',
    date_of_issue: 'Date of Issue',
    date_of_expiry: 'Valid Till / Expiry',
    address: 'Address',
    vehicle_classes: 'Authorized Vehicles',
    issuing_authority: 'Issuing Authority',
    father_or_spouse_name: 'Father/Spouse',
    blood_group: 'Blood Group'
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Multi-licence selector tabs if >1 licence */}
        {docMetadata.licences && docMetadata.licences.length > 1 ? (
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> Licences ({docMetadata.licences.length}):
            </span>
            {docMetadata.licences.map((lic, idx) => (
              <button
                key={idx}
                onClick={() => onSelectLicence(idx)}
                className={`px-3 py-1 rounded-lg font-medium transition text-xs ${
                  selectedLicenceIndex === idx
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Card {idx + 1}: {lic.full_name?.split(' ')[0] || `Licence ${idx + 1}`}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200 truncate max-w-[200px]" title={docMetadata.file_name}>
              {docMetadata.file_name}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
              {docMetadata.file_type.includes('pdf') ? 'PDF Document' : 'Image'}
            </span>
          </div>
        )}

        {/* PDF Page controls if multi-page */}
        {docMetadata.page_count > 1 && (
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-300 px-1 font-mono">
              Page {currentPage} of {docMetadata.page_count}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, docMetadata.page_count))}
              disabled={currentPage >= docMetadata.page_count}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* View Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          {onNewUpload && (
            <button
              type="button"
              onClick={onNewUpload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Return to upload screen to choose another document"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Upload</span>
            </button>
          )}

          {/* Toggle Grounding Overlays */}
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs transition ${
              showBoxes
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Visual Field Highlights"
          >
            {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">AI Grounding</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 px-1.5 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition border-l border-slate-700 ml-0.5"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition"
            title="Open Original Document in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Image Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-950/90 relative p-4 flex items-center justify-center min-h-[360px] sm:min-h-[480px]"
      >
        <div
          className="relative transition-transform duration-150 ease-out inline-block max-w-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <img
            src={previewImage}
            alt="Uploaded Driving Licence"
            onError={(e) => {
              if (docMetadata?.document_id && !e.target.src.startsWith('data:')) {
                const apiFallback = resolveImageUrl(`/api/document/${docMetadata.document_id}/image/${currentPage}`);
                if (e.target.src !== apiFallback) {
                  e.target.src = apiFallback;
                }
              }
            }}
            className="rounded-2xl shadow-2xl max-w-full max-h-[70vh] object-contain border border-slate-800 select-none pointer-events-none"
          />

          {/* AI Grounding Bounding Boxes Overlay */}
          {showBoxes &&
            Object.entries(boundingBoxes).map(([fieldName, box]) => {
              const isTargeted = highlightedField === fieldName;
              return (
                <div
                  key={fieldName}
                  onMouseEnter={() => onHoverBox(fieldName)}
                  onMouseLeave={() => onHoverBox(null)}
                  className={`absolute rounded-md cursor-pointer transition-all duration-200 pointer-events-auto ${
                    isTargeted
                      ? 'border-2 border-yellow-400 bg-yellow-400/25 shadow-lg shadow-yellow-400/40 z-30 scale-[1.02]'
                      : 'border border-blue-500/50 bg-blue-500/10 hover:border-blue-400 hover:bg-blue-400/20 z-10'
                  }`}
                  style={{
                    top: `${box.ymin}%`,
                    left: `${box.xmin}%`,
                    width: `${Math.max(box.xmax - box.xmin, 3)}%`,
                    height: `${Math.max(box.ymax - box.ymin, 3)}%`,
                  }}
                >
                  {isTargeted && (
                    <span className="absolute -top-6 left-0 bg-yellow-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap z-40">
                      {fieldDisplayNames[fieldName] || fieldName}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom Bar: Document Verification Indicator */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Extraction Engine: <strong className="text-slate-200">{docMetadata.extraction_source}</strong></span>
        </div>
        <span className="text-slate-500 hidden sm:inline">
          Hover over form fields to highlight matching document location
        </span>
      </div>
    </div>
  );
}
