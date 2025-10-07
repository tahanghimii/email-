import React, { useState } from 'react';
import { Paperclip, ChevronDown, ChevronUp, Download, Image, FileText, File } from 'lucide-react';

const AttachmentList = ({ attachments }) => {
  const [expanded, setExpanded] = useState(true);

  const getAttachmentIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const handleDownload = (attachment) => {
    console.log('Downloading:', attachment.name);
    
    try {
      // Decode base64 data
      let binaryData;
      
      if (attachment.encoding === 'base64') {
        const base64Data = attachment.data.replace(/\s/g, '');
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        binaryData = bytes;
      } else {
        // For non-base64, convert string to bytes
        const encoder = new TextEncoder();
        binaryData = encoder.encode(attachment.data);
      }
      
      // Create blob
      const blob = new Blob([binaryData], { type: attachment.contentType || 'application/octet-stream' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Download successful!');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download attachment: ' + error.message);
    }
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <Paperclip className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">
            Attachments ({attachments.length})
          </h3>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
      </div>
      
      {expanded && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-indigo-600">
                    {getAttachmentIcon(attachment.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{attachment.name}</p>
                    <p className="text-sm text-gray-500">{attachment.size}</p>
                  </div>
                </div>
                <Download 
                  className="w-5 h-5 text-gray-400 hover:text-indigo-600 cursor-pointer transition" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(attachment);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentList;