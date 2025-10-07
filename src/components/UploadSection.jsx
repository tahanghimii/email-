import { useCallback, useState } from 'react'
import { Upload, FileText } from 'lucide-react'

const UploadSection = ({ onFileUpload }) => {
  const [isDragActive, setIsDragActive] = useState(false)

  const handleFiles = useCallback((files) => {
    const fileList = Array.from(files);
    
    if (fileList.length === 0) {
      alert('No files selected');
      return;
    }

    console.log('Files to process:', fileList.map(f => f.name));
    
    const validFiles = fileList.filter(file => {
      const isValid = file.name.toLowerCase().endsWith('.eml') || 
                     file.name.toLowerCase().endsWith('.msg');
      if (!isValid) {
        console.warn(`Skipping invalid file: ${file.name}`);
      }
      return isValid;
    });
    
    if (validFiles.length > 0) {
      console.log(`Processing ${validFiles.length} valid files`);
      onFileUpload(validFiles);
    } else {
      alert('Please upload only .eml or .msg files');
    }
  }, [onFileUpload])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    
    const files = e.dataTransfer.files
    console.log('Files dropped:', files.length);
    handleFiles(files)
  }, [handleFiles])

  const handleFileInput = useCallback((e) => {
    const files = e.target.files
    console.log('Files selected via input:', files.length);
    handleFiles(files)
    e.target.value = '' // Reset input
  }, [handleFiles])

  return (
    <div className="upload-section">
      <div 
        className={`upload-zone ${isDragActive ? 'upload-zone-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <Upload size={48} className="upload-icon" />
          <h2>Upload Email Files</h2>
          <p>Drag & drop your .eml or .msg files here, or click to browse</p>
          <p className="upload-hint">You can select multiple files at once</p>
          <div className="supported-formats">
            <FileText size={16} />
            <span>Supported formats: .eml, .msg</span>
          </div>
        </div>
        
        <input
          type="file"
          multiple
          accept=".eml,.msg"
          onChange={handleFileInput}
          className="file-input"
        />
      </div>
    </div>
  )
}

export default UploadSection