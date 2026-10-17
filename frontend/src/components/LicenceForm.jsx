import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  User,
  Hash,
  Calendar,
  MapPin,
  Car,
  Building,
  Heart,
  FileCheck,
  Plus,
  Trash2
} from 'lucide-react';
import { saveLicence } from '../services/api';

export default function LicenceForm({
  licenceData,
  documentId,
  licenceIndex,
  onHoverField,
  highlightedField,
  onFormUpdated
}) {
  const [formData, setFormData] = useState({ ...licenceData });
  const [originalData, setOriginalData] = useState({ ...licenceData });
  const [editedFields, setEditedFields] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [copied, setCopied] = useState(false);
  const [newClassInput, setNewClassInput] = useState('');

  useEffect(() => {
    setFormData({ ...licenceData });
    setOriginalData({ ...licenceData });
    setEditedFields(new Set());
    setSaveStatus(null);
  }, [licenceData, licenceIndex]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setEditedFields((prev) => {
      const next = new Set(prev);
      if (value !== originalData[field]) {
        next.add(field);
      } else {
        next.delete(field);
      }
      return next;
    });
  };

  const handleAddVehicleClass = () => {
    const trimmed = newClassInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!formData.vehicle_classes.includes(trimmed)) {
      const updatedClasses = [...formData.vehicle_classes, trimmed];
      handleFieldChange('vehicle_classes', updatedClasses);
    }
    setNewClassInput('');
  };

  const handleRemoveVehicleClass = (cat) => {
    const updatedClasses = formData.vehicle_classes.filter((c) => c !== cat);
    handleFieldChange('vehicle_classes', updatedClasses);
  };

  const handleReset = () => {
    setFormData({ ...originalData });
    setEditedFields(new Set());
    setSaveStatus(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await saveLicence(documentId, licenceIndex, formData);
      setSaveStatus({ type: 'success', message: 'Licence data saved and verified!' });
      setOriginalData({ ...formData });
      setEditedFields(new Set());
      if (onFormUpdated) onFormUpdated(formData);
    } catch (err) {
      setSaveStatus({ type: 'error', message: err.message || 'Failed to save licence data.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driving_licence_${formData.dl_number || 'data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFieldEdited = (field) => editedFields.has(field);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl overflow-hidden">
      {/* Form Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Auto-Populated Form</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              AI Extracted
            </span>
            {editedFields.size > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {editedFields.size} field(s) edited
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Review & edit extracted details below before finalizing</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
            title="Copy JSON to Clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleExportJSON}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
            title="Download JSON Export"
          >
            <Download className="w-4 h-4" />
          </button>
          {editedFields.size > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
              title="Revert all changes to AI extracted values"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-600/30 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save & Verify'}</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div
          className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
            saveStatus.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Form Fields Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* Full Name & DL Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onMouseEnter={() => onHoverField('full_name')}
            onMouseLeave={() => onHoverField(null)}
            className={`transition rounded-xl p-2.5 border ${
              highlightedField === 'full_name'
                ? 'bg-yellow-400/10 border-yellow-400/50'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" /> Full Name
              </label>
              {isFieldEdited('full_name') && (
                <span className="text-[10px] text-amber-400">Edited</span>
              )}
            </div>
            <input
              type="text"
              value={formData.full_name || ''}
              onChange={(e) => handleFieldChange('full_name', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. ROHAN ANIL DESHMUKH"
            />
          </div>

          <div
            onMouseEnter={() => onHoverField('dl_number')}
            onMouseLeave={() => onHoverField(null)}
            className={`transition rounded-xl p-2.5 border ${
              highlightedField === 'dl_number'
                ? 'bg-yellow-400/10 border-yellow-400/50'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-400" /> Driving Licence No.
              </label>
              {isFieldEdited('dl_number') && (
                <span className="text-[10px] text-amber-400">Edited</span>
              )}
            </div>
            <input
              type="text"
              value={formData.dl_number || ''}
              onChange={(e) => handleFieldChange('dl_number', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. MH12 20190001234"
            />
          </div>
        </div>

        {/* Dates Row: DOB, Date of Issue, Date of Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* DOB */}
          <div
            onMouseEnter={() => onHoverField('dob')}
            onMouseLeave={() => onHoverField(null)}
            className={`transition rounded-xl p-2.5 border ${
              highlightedField === 'dob'
                ? 'bg-yellow-400/10 border-yellow-400/50'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Date of Birth
            </label>
            <input
              type="text"
              value={formData.dob || ''}
              onChange={(e) => handleFieldChange('dob', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              placeholder="DD-MM-YYYY"
            />
          </div>

          {/* Date of Issue */}
          <div
            onMouseEnter={() => onHoverField('date_of_issue')}
            onMouseLeave={() => onHoverField(null)}
            className={`transition rounded-xl p-2.5 border ${
              highlightedField === 'date_of_issue'
                ? 'bg-yellow-400/10 border-yellow-400/50'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Date of Issue (DOI)
            </label>
            <input
              type="text"
              value={formData.date_of_issue || ''}
              onChange={(e) => handleFieldChange('date_of_issue', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              placeholder="DD-MM-YYYY"
            />
          </div>

          {/* Date of Expiry */}
          <div
            onMouseEnter={() => onHoverField('date_of_expiry')}
            onMouseLeave={() => onHoverField(null)}
            className={`transition rounded-xl p-2.5 border ${
              highlightedField === 'date_of_expiry'
                ? 'bg-yellow-400/10 border-yellow-400/50'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Valid Till (Expiry)
            </label>
            <input
              type="text"
              value={formData.date_of_expiry || ''}
              onChange={(e) => handleFieldChange('date_of_expiry', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold font-mono focus:outline-none focus:border-blue-500"
              placeholder="DD-MM-YYYY"
            />
          </div>
        </div>

        {/* Address */}
        <div
          onMouseEnter={() => onHoverField('address')}
          onMouseLeave={() => onHoverField(null)}
          className={`transition rounded-xl p-2.5 border ${
            highlightedField === 'address'
              ? 'bg-yellow-400/10 border-yellow-400/50'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> Registered Address
            </label>
            {isFieldEdited('address') && (
              <span className="text-[10px] text-amber-400">Edited</span>
            )}
          </div>
          <textarea
            rows={2}
            value={formData.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
            placeholder="Full address with city, pincode, and state"
          />
        </div>

        {/* Authorized Vehicle Classes */}
        <div
          onMouseEnter={() => onHoverField('vehicle_classes')}
          onMouseLeave={() => onHoverField(null)}
          className={`transition rounded-xl p-3 border ${
            highlightedField === 'vehicle_classes'
              ? 'bg-yellow-400/10 border-yellow-400/50'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <Car className="w-3.5 h-3.5 text-blue-400" /> Authorized Vehicle / Licence Classes (COV)
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            {(formData.vehicle_classes || []).map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-bold"
              >
                <span>{cat}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveVehicleClass(cat)}
                  className="text-blue-400 hover:text-rose-400 transition"
                  title="Remove class"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add class input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newClassInput}
              onChange={(e) => setNewClassInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVehicleClass())}
              placeholder="Add vehicle class (e.g. LMV, MCWG, TRANS)..."
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 flex-1"
            />
            <button
              type="button"
              onClick={handleAddVehicleClass}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Issuing Authority & Father/Spouse */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Issuing Authority */}
          <div
            onMouseEnter={() => onHoverField('issuing_authority')}
            onMouseLeave={() => onHoverField(null)}
            className={`transition rounded-xl p-2.5 border ${
              highlightedField === 'issuing_authority'
                ? 'bg-yellow-400/10 border-yellow-400/50'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Building className="w-3.5 h-3.5 text-amber-400" /> Issuing Authority / RTO
            </label>
            <input
              type="text"
              value={formData.issuing_authority || ''}
              onChange={(e) => handleFieldChange('issuing_authority', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. RTO, Pune or Transport Department Delhi"
            />
          </div>

          {/* Father or Spouse */}
          <div
            onMouseEnter={() => onHoverField('father_or_spouse_name')}
            onMouseLeave={() => onHoverField(null)}
            className={`transition rounded-xl p-2.5 border ${
              highlightedField === 'father_or_spouse_name'
                ? 'bg-yellow-400/10 border-yellow-400/50'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> S/D/W of (Father / Spouse)
            </label>
            <input
              type="text"
              value={formData.father_or_spouse_name || ''}
              onChange={(e) => handleFieldChange('father_or_spouse_name', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. ANIL VASANT DESHMUKH"
            />
          </div>
        </div>

        {/* Extra Attributes: Blood Group, State, Restrictions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Blood Group */}
          <div
            onMouseEnter={() => onHoverField('blood_group')}
            onMouseLeave={() => onHoverField(null)}
            className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5"
          >
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" /> Blood Group
            </label>
            <input
              type="text"
              value={formData.blood_group || ''}
              onChange={(e) => handleFieldChange('blood_group', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-bold focus:outline-none focus:border-blue-500"
              placeholder="e.g. O+, A+"
            />
          </div>

          {/* State */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
              State / Jurisdiction
            </label>
            <input
              type="text"
              value={formData.state || ''}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. Maharashtra"
            />
          </div>

          {/* Restrictions */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
              Restrictions / Notes
            </label>
            <input
              type="text"
              value={formData.restrictions || ''}
              onChange={(e) => handleFieldChange('restrictions', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              placeholder="e.g. None, NT"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
