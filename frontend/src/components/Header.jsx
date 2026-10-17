import React from 'react';
import { CreditCard, Settings as SettingsIcon, UploadCloud, ArrowLeft } from 'lucide-react';

export default function Header({ onOpenSettings, onNewUpload, hasDocument, loading }) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onNewUpload();
          }}
          className="flex items-center gap-3 text-left focus:outline-none group rounded-xl transition hover:opacity-95 cursor-pointer"
          title="Return to Home / Upload Screen"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 group-hover:shadow-blue-500/40 transition">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight group-hover:text-blue-400 transition">DriveLens</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                AI Vision & Q&A
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Driving Licence OCR, Auto-Population & Conversational Grounding
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {hasDocument && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNewUpload();
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-100 hover:text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 border border-blue-500 transition"
              title="Return to Upload Screen"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Upload Screen</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-xl transition"
            title="Settings & API Key"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
