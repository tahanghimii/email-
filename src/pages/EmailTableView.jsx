import { useState, useCallback } from 'react'
import UploadSection from '../components/UploadSection'
import EmailTable from '../components/EmailTable'
import LoadingOverlay from '../components/LoadingOverlay'
import { parseEMLFile, parseMSGFile } from '../utils/emailParser'
import { downloadPDF, mergePDFs, printPDF } from '../utils/pdfHelpers'

const EmailTableView = () => {
  const [emails, setEmails] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    setIsLoading(true)
    
    // Process all files in parallel for better performance
    const filePromises = Array.from(files).map(async (file) => {
      try {
        let parsedEmail
        if (file.name.toLowerCase().endsWith('.eml')) {
          parsedEmail = await parseEMLFile(file)
        } else if (file.name.toLowerCase().endsWith('.msg')) {
          parsedEmail = await parseMSGFile(file)
        } else {
          console.warn(`Unsupported file type: ${file.name}`)
          return null
        }
        
        if (parsedEmail) {
          return {
            ...parsedEmail,
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: file.name,
            fileSize: file.size
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        return null
      }
    })

    try {
      const results = await Promise.all(filePromises)
      const validEmails = results.filter(email => email !== null)
      
      if (validEmails.length > 0) {
        setEmails(prev => [...prev, ...validEmails])
      }
    } catch (error) {
      console.error('Error processing files:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDownloadPDF = (attachment) => {
    downloadPDF(attachment)
  }

  const handlePrintMerged = async () => {
    setIsLoading(true)
    try {
      const allAttachments = emails.flatMap(email => 
        email.attachments.map(att => ({
          ...att,
          sourceEmail: email.subject
        }))
      )
      
      if (allAttachments.length === 0) {
        alert('No PDF attachments found to print')
        return
      }
      
      const mergedPdfBytes = await mergePDFs(allAttachments)
      await printPDF(mergedPdfBytes)
    } catch (error) {
      console.error('Error printing merged PDFs:', error)
      alert('Error creating merged PDF for printing: ' + error.message)
    } finally {
      // Always remove loading state, even if print was cancelled
      setIsLoading(false)
    }
  }

  const handleDeleteEmail = (emailId) => {
    setEmails(prev => prev.filter(email => email.id !== emailId))
  }

  const handleClearAll = () => {
    setEmails([])
  }

  const handleAddMoreFiles = () => {
    document.getElementById('file-input')?.click()
  }

  return (
    <div className="email-table-view">
      {isLoading && <LoadingOverlay />}
      
      {emails.length === 0 ? (
        <UploadSection onFileUpload={handleFileUpload} />
      ) : (
        <EmailTable
          emails={emails}
          onDownloadPDF={handleDownloadPDF}
          onPrintMerged={handlePrintMerged}
          onDeleteEmail={handleDeleteEmail}
          onClearAll={handleClearAll}
          onAddMoreFiles={handleAddMoreFiles}
        />
      )}
      
      <input
        id="file-input"
        type="file"
        multiple
        accept=".eml,.msg"
        onChange={(e) => handleFileUpload(e.target.files)}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default EmailTableView