import React, { useState } from 'react';
import { Mail, Upload, Trash2, Download } from 'lucide-react';

const EmailTableHeader = ({ emails, onFileUpload, onReset, onMergeAll, loading }) => {
  const [dragActive, setDragActive] = useState(false);

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onFileUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await onFileUpload(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <Mail className="w-12 h-12 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Email PDF Extractor</h1>
            <p className="text-gray-600 mt-1">Upload .eml or .msg files to extract and merge PDF attachments</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {emails.length > 0 && (
            <button
              onClick={onMergeAll}
              disabled={loading}
              className="flex items-center gap-3 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-400 transition duration-200"
            >
              <Download className="w-5 h-5" />
              Merge All PDFs
            </button>
          )}
          <button
            onClick={() => document.getElementById('file-upload').click()}
            disabled={loading}
            className="flex items-center gap-3 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 transition duration-200"
          >
            <Upload className="w-5 h-5" />
            Add Files
          </button>
          {emails.length > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-3 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition duration-200"
            >
              <Trash2 className="w-5 h-5" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`mt-6 border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50 shadow-inner' 
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-25'
        } ${loading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".eml,.msg"
          multiple
          onChange={handleFileInput}
          disabled={loading}
        />
        <div className="pointer-events-none">
          <Upload className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
          <p className="text-xl font-semibold text-gray-700 mb-2">
            {dragActive ? 'Drop files here' : 'Click or drag files to upload'}
          </p>
          <p className="text-gray-500">Supported formats: .eml, .msg</p>
        </div>
      </div>
    </div>
  );
};

export default EmailTableHeader;