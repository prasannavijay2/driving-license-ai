import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, FileType, AlertCircle } from 'lucide-react';

export default function UploadDropzone({ onFileUpload, onSampleSelect, loading, loadingStage }) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMsg(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const validateAndProcess = (file) => {
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMsg(`Unsupported file type '${ext}'. Please upload PNG, JPG, WEBP, or PDF.`);
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds 15MB limit.');
      return;
    }
    onFileUpload(file);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Hero Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Multimodal Document AI
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Instant Driving Licence Intelligence
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Upload any driving licence image or PDF to automatically extract structured data, review & edit fields,
          and converse directly with your document using AI.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-blue-600/10 animate-pulse" />
          <div className="relative z-10 max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/20">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analyzing Driving Licence...</h3>
            <p className="text-sm text-slate-400 mb-6">
              {loadingStage || 'Processing document with Gemini multimodal vision & OCR pipeline...'}
            </p>

            <div className="space-y-2.5 text-left text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Document image normalized & validated</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400 animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>Extracting DL Number, Dates, Address & Vehicle Classes...</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-4 h-4 rounded-full border border-slate-700" />
                <span>Mapping visual bounding box coordinates</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition duration-200 group ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                : 'border-slate-700/80 bg-slate-900/60 hover:bg-slate-900/90 hover:border-blue-500/50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.pdf"
              onChange={handleChange}
              className="hidden"
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:border-blue-500/40 group-hover:bg-blue-600/10 transition">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">
              Drop your Driving Licence document here
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-4">
              or <span className="text-blue-400 font-semibold underline underline-offset-2">browse files</span> from your computer
            </p>
            <div className="inline-flex items-center gap-3 text-xs text-slate-500 bg-slate-800/60 px-4 py-1.5 rounded-full border border-slate-700/50">
              <span className="flex items-center gap-1"><FileType className="w-3.5 h-3.5" /> PNG, JPG, WEBP, PDF</span>
              <span>•</span>
              <span>Up to 15MB</span>
            </div>
          </div>

          {/* Quick-Test Sample Documents Section */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Or Test Instantly With Candidate Samples
                </h3>
              </div>
              <span className="text-xs text-slate-500">Zero upload required</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sample 1 */}
              <div
                onClick={() => onSampleSelect('sample1_maharashtra', 'png')}
                className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 cursor-pointer transition hover:-translate-y-0.5 group shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Sample 1
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">MH12 2019...</span>
                </div>
                <h4 className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition mb-1">
                  ROHAN ANIL DESHMUKH
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Maharashtra State DL • Classes: LMV, MCWG
                </p>
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs text-blue-400 font-medium">
                  <span>Load Sample Card</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Sample 2 */}
              <div
                onClick={() => onSampleSelect('sample2_delhi', 'png')}
                className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 cursor-pointer transition hover:-translate-y-0.5 group shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Sample 2
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">DL-04201...</span>
                </div>
                <h4 className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition mb-1">
                  PRIYA SHARMA
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Delhi Transport Dept • Classes: LMV, MCWG
                </p>
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs text-blue-400 font-medium">
                  <span>Load Sample Card</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Combined Sample */}
              <div
                onClick={() => onSampleSelect('sample_both', 'png')}
                className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 cursor-pointer transition hover:-translate-y-0.5 group shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Dual Licences
                  </span>
                  <span className="text-[11px] text-purple-400 font-mono">Side-by-Side</span>
                </div>
                <h4 className="font-bold text-slate-200 text-sm group-hover:text-purple-400 transition mb-1">
                  Composite Test Sheet
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Tests multi-card AI detection in single image
                </p>
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs text-purple-400 font-medium">
                  <span>Load Combined Sheet</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
