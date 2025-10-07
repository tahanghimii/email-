import { Loader } from 'lucide-react'

const LoadingOverlay = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Loader size={32} className="loading-spinner" />
        <p>Processing files...</p>
      </div>
    </div>
  )
}

export default LoadingOverlay