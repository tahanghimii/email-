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
    if (!files || files.length === 0) return

    setIsLoading(true)
    const filePromises = Array.from(files).map(async (file) => {
      try {
        let parsedEmail
        if (file.name.toLowerCase().endsWith('.eml')) {
          parsedEmail = await parseEMLFile(file)
        } else if (file.name.toLowerCase().endsWith('.msg')) {
          parsedEmail = await parseMSGFile(file)
        }

        if (parsedEmail) {
          return {
            ...parsedEmail,
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: file.name,
            fileSize: file.size,
          }
        }
      } catch (error) {
        console.error('Error processing file', error)
        return null
      }
    })

    const results = await Promise.all(filePromises)
    const validEmails = results.filter(Boolean)
    setEmails((prev) => [...prev, ...validEmails])
    setIsLoading(false)
  }, [])

  const handleDownloadPDF = (attachment) => downloadPDF(attachment)

  const handlePrintMerged = async () => {
    setIsLoading(true)
    try {
      const allAttachments = emails.flatMap((email) =>
        email.attachments.map((att) => ({ ...att, sourceEmail: email.subject }))
      )

      if (allAttachments.length === 0) {
        alert('No PDF attachments found to print')
        return
      }

      const mergedPdfBytes = await mergePDFs(allAttachments)
      await printPDF(mergedPdfBytes)
    } catch (error) {
      alert('Error printing: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEmail = (emailId) => setEmails((prev) => prev.filter((e) => e.id !== emailId))
  const handleClearAll = () => setEmails([])
  const handleAddMoreFiles = () => document.getElementById('file-input')?.click()

  return (
    <div className="email-table-view">
      {isLoading && <LoadingOverlay />}

      <div className="app-layout">
        {/* Left Panel - Upload */}
        <section className="upload-section">
          <UploadSection onFileUpload={handleFileUpload} />
        </section>

        {/* Right Panel - Table */}
        <section className="email-table-container">
          <EmailTable
            emails={emails}
            onDownloadPDF={handleDownloadPDF}
            onPrintMerged={handlePrintMerged}
            onDeleteEmail={handleDeleteEmail}
            onClearAll={handleClearAll}
            onAddMoreFiles={handleAddMoreFiles}
          />
        </section>
      </div>

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
