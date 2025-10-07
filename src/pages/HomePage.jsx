import React, { useState } from 'react';
import Header from '../component/Header';
import UploadZone from '../component/UploadZone';
import { parseEML, parseMSG } from '../utils/emailParser';

const HomePage = ({ onEmailsParsed }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [existingEmails, setExistingEmails] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    setError('');
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const processFiles = async (files) => {
    setLoading(true);
    setProgress({ current: 0, total: files.length });

    try {
      const newParsedEmails = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });

        const isDuplicate = existingEmails.some(email =>
          email.fileName === file.name && email.fileSize === file.size
        );

        if (isDuplicate) {
          console.log(`Skipping duplicate file: ${file.name}`);
          continue;
        }

        const ext = file.name.split('.').pop().toLowerCase();
        let parsed;

        if (ext === 'eml') {
          parsed = await parseEML(file);
        } else if (ext === 'msg') {
          parsed = await parseMSG(file);
        } else {
          console.warn(`Skipping unsupported file: ${file.name}`);
          continue;
        }

        parsed.attachments = parsed.attachments.filter(att => att.type === 'pdf');
        parsed.fileName = file.name;
        parsed.fileSize = file.size;
        parsed.uploadId = Date.now() + i;

        newParsedEmails.push(parsed);
      }

      if (newParsedEmails.length === 0) {
        if (files.length > 0) {
          setError('No new valid .eml or .msg files found (or all were duplicates)');
        }
        setLoading(false);
        return;
      }

      const allEmails = [...existingEmails, ...newParsedEmails];
      setExistingEmails(allEmails);
      onEmailsParsed(allEmails);

    } catch (error) {
      console.error('Error parsing emails:', error);
      setError('Error parsing emails: ' + error.message);
    }

    setLoading(false);
    setProgress({ current: 0, total: 0 });
  };

  const clearAllEmails = () => {
    setExistingEmails([]);
    onEmailsParsed([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 p-8">
      <div className="max-w-6xl mx-auto">
        <Header />

        {existingEmails.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Currently loaded: {existingEmails.length} email{existingEmails.length > 1 ? 's' : ''}
                </h3>
                <p className="text-gray-600 text-sm">
                  Total PDFs: {existingEmails.reduce((sum, email) => sum + email.attachments.length, 0)}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onEmailsParsed(existingEmails)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition duration-150"
                >
                  View Emails
                </button>
                <button
                  onClick={clearAllEmails}
                  className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition duration-150"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <UploadZone
          dragActive={dragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onChange={handleChange}
          loading={loading}
        />

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center min-w-80">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-700 text-lg font-semibold">Processing emails...</p>
              <p className="text-gray-500 text-sm mt-2">
                {progress.current} of {progress.total} files
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage; 