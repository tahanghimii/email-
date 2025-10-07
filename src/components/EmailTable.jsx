import EmailTableHeader from './EmailTableHeader'
import EmailTableRow from './EmailTableRow'

const EmailTable = ({ 
  emails, 
  onDownloadPDF, 
  onPrintMerged, 
  onDeleteEmail, 
  onClearAll, 
  onAddMoreFiles 
}) => {
  const totalAttachments = emails.reduce((sum, email) => sum + email.attachments.length, 0)
  const totalPDFs = emails.reduce((sum, email) => 
    sum + email.attachments.filter(att => att.type === 'pdf').length, 0
  )

  return (
    <div className="email-table-container">
      <EmailTableHeader
        emailCount={emails.length}
        attachmentCount={totalAttachments}
        pdfCount={totalPDFs}
        onPrintMerged={onPrintMerged}
        onAddMoreFiles={onAddMoreFiles}
        onClearAll={onClearAll}
      />
      
      <div className="table-wrapper">
        <table className="email-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Subject</th>
              <th>Content</th>
              <th>Date</th>
              <th>Attachments</th>
              <th>File</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => (
              <EmailTableRow
                key={email.id}
                email={email}
                onDownloadPDF={onDownloadPDF}
                onDeleteEmail={onDeleteEmail}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {emails.length === 0 && (
        <div className="empty-state">
          <p>No email files uploaded yet</p>
        </div>
      )}
    </div>
  )
}

export default EmailTable