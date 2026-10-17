import React, { useState } from 'react';
import Header from './components/Header';
import UploadDropzone from './components/UploadDropzone';
import DocumentViewer from './components/DocumentViewer';
import LicenceForm from './components/LicenceForm';
import DocumentChat from './components/DocumentChat';
import SettingsModal from './components/SettingsModal';
import { uploadDocument, loadSample } from './services/api';
import { FileText, MessageSquareText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [docMetadata, setDocMetadata] = useState(null);
  const [selectedLicenceIndex, setSelectedLicenceIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'chat'
  const [highlightedField, setHighlightedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFileUpload = async (file) => {
    setLoading(true);
    setLoadingStage('Uploading document & extracting with Multimodal Vision AI...');
    try {
      const data = await uploadDocument(file);
      setDocMetadata(data);
      setSelectedLicenceIndex(0);
      showToast('success', `Document processed! Extracted ${data.licences?.length || 1} licence profile(s).`);
    } catch (err) {
      showToast('error', err.message || 'Failed to process document');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleSampleSelect = async (sampleId, format = 'png') => {
    setLoading(true);
    setLoadingStage(`Loading sample ${sampleId} & running AI extraction...`);
    try {
      const data = await loadSample(sampleId, format);
      setDocMetadata(data);
      setSelectedLicenceIndex(0);
      showToast('success', `Loaded ${data.file_name} successfully!`);
    } catch (err) {
      showToast('error', err.message || 'Failed to load sample');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleNewUpload = (e) => {
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }
    setDocMetadata(null);
    setSelectedLicenceIndex(0);
    setHighlightedField(null);
    setLoading(false);
    setLoadingStage('');
  };

  const currentLicence =
    docMetadata?.licences?.[selectedLicenceIndex] ||
    docMetadata?.licences?.[0] ||
    null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewUpload={handleNewUpload}
        hasDocument={!!docMetadata}
        onQuickSample={handleSampleSelect}
        loading={loading}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border ${
              toast.type === 'success'
                ? 'bg-emerald-500/90 text-white border-emerald-400'
                : 'bg-rose-500/90 text-white border-rose-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col">
        {!docMetadata ? (
          <UploadDropzone
            onFileUpload={handleFileUpload}
            onSampleSelect={handleSampleSelect}
            loading={loading}
            loadingStage={loadingStage}
          />
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            {/* Split Screen Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[640px]">
              {/* Left Column: Interactive Document Viewer (5 cols) */}
              <div className="lg:col-span-5 h-[620px] lg:h-auto flex flex-col">
                <DocumentViewer
                  docMetadata={docMetadata}
                  selectedLicenceIndex={selectedLicenceIndex}
                  onSelectLicence={setSelectedLicenceIndex}
                  highlightedField={highlightedField}
                  onHoverBox={setHighlightedField}
                  onNewUpload={handleNewUpload}
                />
              </div>

              {/* Right Column: Tabbed Form & Chat Assistant (7 cols) */}
              <div className="lg:col-span-7 flex flex-col h-[700px] lg:h-auto">
                {/* Tab Switcher */}
                <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 mb-3 self-start">
                  <button
                    onClick={() => setActiveTab('form')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'form'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Auto-Populated Form</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'chat'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <MessageSquareText className="w-4 h-4" />
                    <span>Ask the Document (AI Chat)</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-h-0">
                  {activeTab === 'form' ? (
                    <LicenceForm
                      licenceData={currentLicence}
                      documentId={docMetadata.document_id}
                      licenceIndex={selectedLicenceIndex}
                      onHoverField={setHighlightedField}
                      highlightedField={highlightedField}
                      onFormUpdated={(updated) => {
                        const newLicences = [...docMetadata.licences];
                        newLicences[selectedLicenceIndex] = updated;
                        setDocMetadata({ ...docMetadata, licences: newLicences });
                      }}
                    />
                  ) : (
                    <DocumentChat
                      documentId={docMetadata.document_id}
                      currentFormData={currentLicence}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigUpdated={() => showToast('success', 'AI Configuration refreshed.')}
      />
    </div>
  );
}
