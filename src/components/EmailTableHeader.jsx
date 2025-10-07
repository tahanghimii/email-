import { Printer, Plus, Trash2 } from 'lucide-react'

const EmailTableHeader = ({ 
  emailCount, 
  attachmentCount, 
  pdfCount, 
  onPrintMerged, 
  onAddMoreFiles, 
  onClearAll 
}) => {
  return (
    <div className="email-table-header">
      <div className="header-content">
        <div className="header-title">
          <h1>PDF Fusion</h1>
          <p>Email PDF Extractor</p>
        </div>
        
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">{emailCount}</span>
            <span className="stat-label">Emails</span>
          </div>
          <div className="stat">
            <span className="stat-number">{attachmentCount}</span>
            <span className="stat-label">Attachments</span>
          </div>
          <div className="stat">
            <span className="stat-number">{pdfCount}</span>
            <span className="stat-label">PDFs</span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={onPrintMerged}
            disabled={pdfCount === 0}
          >
            <Printer size={16} />
            Print Merged PDFs
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={onAddMoreFiles}
          >
            <Plus size={16} />
            Add Files
          </button>
          
          <button 
            className="btn btn-danger"
            onClick={onClearAll}
          >
            <Trash2 size={16} />
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailTableHeader