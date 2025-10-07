import { useRef } from 'react'
import { Download, Trash2, FileText } from 'lucide-react'

const EmailTableRow = ({ email, onDownloadPDF, onDeleteEmail }) => {
  const fromRef = useRef(null)
  const toRef = useRef(null)
  const contentRef = useRef(null)

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const truncateText = (text, maxLength = 25) => {
    if (!text) return 'N/A'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    const kb = bytes / 1024
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`
  }

  const getContentPreview = (body) => {
    if (!body) return 'No content'
    // Remove extra whitespace and create a clean preview
    const cleanBody = body.replace(/\s+/g, ' ').trim()
    return cleanBody.length > 100 ? cleanBody.substring(0, 100) + '...' : cleanBody
  }

  return (
    <tr className="email-table-row">
      <td className="from-cell">
        <div 
          ref={fromRef}
          className="scrollable-content"
          title={email.from}
        >
          {email.from || 'N/A'}
        </div>
      </td>
      <td className="to-cell">
        <div 
          ref={toRef}
          className="scrollable-content"
          title={email.to}
        >
          {email.to || 'N/A'}
        </div>
      </td>
      <td className="subject-cell" title={email.subject}>
        {truncateText(email.subject, 40)}
      </td>
      <td className="content-cell">
        <div 
          ref={contentRef}
          className="scrollable-content content-scrollable"
          title={email.body}
        >
          {getContentPreview(email.body)}
        </div>
      </td>
      <td className="date-cell">
        {formatDate(email.date)}
      </td>
      <td className="attachments-cell">
        {email.attachments.length > 0 ? (
          <div className="attachments-list">
            {email.attachments.map((attachment, index) => (
              <button
                key={index}
                className="attachment-btn"
                onClick={() => onDownloadPDF(attachment)}
                title={`Download ${attachment.name} (${attachment.size})`}
              >
                <FileText size={14} />
                <span>{truncateText(attachment.name, 15)}</span>
                <Download size={12} />
              </button>
            ))}
          </div>
        ) : (
          <span className="no-attachments">No attachments</span>
        )}
      </td>
      <td className="file-info-cell">
        <div className="file-info">
          <span className="file-name" title={email.fileName}>
            {truncateText(email.fileName, 15)}
          </span>
          <span className="file-size">
            {formatFileSize(email.fileSize)}
          </span>
        </div>
      </td>
      <td className="actions-cell">
        <button
          className="btn-icon btn-danger"
          onClick={() => onDeleteEmail(email.id)}
          title="Delete email"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  )
}

export default EmailTableRow