import React, { useState } from 'react';
import { Printer, Search, Mail, FileText, Upload } from 'lucide-react';
import EmailHeader from '../component/EmailHeader';
import EmailBody from '../component/EmailBody';
import AttachmentList from '../component/AttachmentList';
import SearchBar from '../component/SearchBar';

const EmailViewPage = ({ emails, onReset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPDFs = emails.reduce((sum, email) => sum + email.attachments.length, 0);

  const handlePrintPDFs = async () => {
    if (totalPDFs === 0) {
      alert('No PDF attachments found to merge');
      return;
    }

    setProcessing(true);

    try {
      // Dynamically import pdf-lib
      const { PDFDocument } = await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm');

      const mergedPdf = await PDFDocument.create();
      let successCount = 0;

      for (const email of emails) {
        for (const attachment of email.attachments) {
          try {
            // Decode base64 data
            const base64Data = attachment.data.replace(/[\r\n\s]/g, '');
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);

            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            // Load the PDF
            const pdf = await PDFDocument.load(bytes);

            // Copy all pages from this PDF
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

            // Add each page to the merged document
            copiedPages.forEach(page => {
              mergedPdf.addPage(page);
            });

            successCount++;
            console.log(`Successfully added ${attachment.name}`);
          } catch (err) {
            console.error(`Error processing ${attachment.name}:`, err);
          }
        }
      }

      if (successCount === 0) {
        alert('Failed to merge any PDFs. Please check if the PDF files are valid.');
        setProcessing(false);
        return;
      }

      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();

      // Create blob and download
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged_pdfs_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Successfully merged ${successCount} PDF(s) into one file!`);
    } catch (err) {
      console.error('Error merging PDFs:', err);
      alert('Error merging PDFs: ' + err.message);
    }

    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Email Analysis</h2>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <span className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                  <Mail className="w-4 h-4" />
                  {emails.length} email{emails.length > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                  <FileText className="w-4 h-4" />
                  {totalPDFs} PDF attachment{totalPDFs !== 1 ? 's' : ''}
                </span>
                {searchTerm && (
                  <span className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-full">
                    <Search className="w-4 h-4" />
                    Filtered: {filteredEmails.length} match{filteredEmails.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePrintPDFs}
                disabled={totalPDFs === 0 || processing}
                className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
              >
                <Printer className="w-5 h-5" />
                <span className="font-semibold">
                  {processing ? 'Merging PDFs...' : `Merge ${totalPDFs} PDF${totalPDFs !== 1 ? 's' : ''}`}
                </span>
              </button>
              <button
                onClick={onReset}
                className="flex items-center gap-3 bg-white text-gray-700 border-2 border-gray-300 px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-md"
              >
                <Upload className="w-5 h-5" />
                <span className="font-semibold">Add More Files</span>
              </button>
            </div>
          </div>

          <SearchBar onSearch={setSearchTerm} />
        </div>

        {/* Email Cards */}
        {filteredEmails.length > 0 ? (
          <div className="space-y-6">
            {filteredEmails.map((email, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Email Number Badge */}
                <div className="bg-indigo-600 text-white px-4 py-2 text-sm font-semibold">
                  Email {index + 1} of {filteredEmails.length}
                  {email.fileName && <span className="ml-2 opacity-75">({email.fileName})</span>}
                  {email.attachments.length > 0 && (
                    <span className="ml-2 bg-white text-indigo-600 px-2 py-1 rounded-full text-xs">
                      {email.attachments.length} PDF{email.attachments.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  <EmailHeader email={email} />
                  <EmailBody email={email} />
                  <AttachmentList attachments={email.attachments} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No emails match your search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailViewPage; 