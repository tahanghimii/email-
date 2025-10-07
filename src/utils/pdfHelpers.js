// Load pdf-lib from CDN
const loadPDFLib = () => {
  return new Promise((resolve, reject) => {
    if (window.PDFLib) {
      resolve(window.PDFLib)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js'
    script.onload = () => {
      if (window.PDFLib) {
        resolve(window.PDFLib)
      } else {
        reject(new Error('PDFLib failed to load'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load PDFLib script'))
    document.head.appendChild(script)
  })
}

// Download individual PDF
export const downloadPDF = (attachment) => {
  try {
    if (attachment.encoding === 'base64' && attachment.data) {
      // Convert base64 to blob
      const binaryString = atob(attachment.data)
      const bytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } else {
      throw new Error('Unsupported attachment encoding')
    }
  } catch (error) {
    console.error('Error downloading PDF:', error)
    alert('Failed to download PDF. The file may be corrupted or in an unsupported format.')
  }
}

// Merge multiple PDFs into one
export const mergePDFs = async (attachments) => {
  try {
    const PDFLib = await loadPDFLib()
    const mergedPdf = await PDFLib.PDFDocument.create()

    for (const attachment of attachments) {
      if (attachment.type === 'pdf' && attachment.data) {
        try {
          // Convert base64 to Uint8Array
          const binaryString = atob(attachment.data)
          const bytes = new Uint8Array(binaryString.length)
          
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          
          // Load the PDF document
          const pdfDoc = await PDFLib.PDFDocument.load(bytes)
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
          
          // Add each page to the merged document
          pages.forEach(page => mergedPdf.addPage(page))
        } catch (error) {
          console.warn(`Failed to merge PDF: ${attachment.name}`, error)
          // Continue with other PDFs even if one fails
        }
      }
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save()
    return mergedPdfBytes
  } catch (error) {
    console.error('Error merging PDFs:', error)
    throw new Error('Failed to merge PDFs: ' + error.message)
  }
}

// Print PDF with reliable cancellation handling
export const printPDF = async (pdfBytes) => {
  return new Promise((resolve) => {
    try {
      // Create blob from PDF bytes
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      // Create iframe for printing
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      
      let printCompleted = false
      
      const cleanup = () => {
        if (printCompleted) return
        printCompleted = true
        
        // Remove iframe from DOM
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
        
        // Revoke object URL
        URL.revokeObjectURL(url)
        
        // Always resolve the promise to stop loading
        resolve()
      }
      
      iframe.onload = () => {
        try {
          // Wait for PDF to load
          setTimeout(() => {
            // Trigger print
            iframe.contentWindow?.print()
            
            // Method 1: Use afterprint event (works when print is completed)
            iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true })
            
            // Method 2: Fallback timeout - always cleanup after 5 seconds
            // This ensures loading stops even if afterprint doesn't fire (like when cancelled)
            setTimeout(cleanup, 5000)
          }, 1000)
        } catch (error) {
          console.error('Error in print process:', error)
          cleanup() // Cleanup on error
        }
      }
      
      iframe.onerror = () => {
        console.error('Iframe failed to load')
        cleanup() // Cleanup on error
      }
      
      document.body.appendChild(iframe)
      
      // Ultimate safety net - cleanup after 10 seconds no matter what
      setTimeout(cleanup, 10000)
      
    } catch (error) {
      console.error('Error setting up print:', error)
      resolve() // Always resolve to prevent infinite loading
    }
  })
}