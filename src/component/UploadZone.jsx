import React from 'react';
import { Upload, Cloud, FileText } from 'lucide-react';

const UploadZone = ({ dragActive, onDrag, onDrop, onChange, loading }) => {
  const handleClick = () => {
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.click();
  };

  const handleFileChange = (e) => onChange(e);

  return (
    <div
      className={`relative border-4 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
        dragActive 
          ? 'border-indigo-500 bg-indigo-75 shadow-lg scale-[1.02]' 
          : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'
      } ${loading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".eml,.msg"
        multiple
        onChange={handleFileChange}
        disabled={loading}
      />
      <div className="pointer-events-none">
        <div className="relative inline-block">
          {dragActive ? (
            <Cloud className="w-28 h-28 mx-auto mb-6 text-indigo-500 animate-pulse" />
          ) : (
            <Upload className="w-28 h-28 mx-auto mb-6 text-indigo-500 transition-transform duration-300" />
          )}
        </div>
        <p className="text-3xl font-bold text-gray-800 mb-4">
          {dragActive ? 'Drop your files here' : 'Upload Email Files'}
        </p>
        <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
          Drag & drop multiple .eml or .msg files or click to browse
        </p>
        
        <div className="flex justify-center items-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-500" />
            <span>.eml files</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span>.msg files</span>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-indigo-600">Tip:</span> You can upload multiple files at once. Only PDF attachments will be extracted and can be merged.
          </p>
        </div>
      </div>
      
      {dragActive && (
        <div className="absolute inset-0 rounded-3xl border-4 border-indigo-400 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default UploadZone; 