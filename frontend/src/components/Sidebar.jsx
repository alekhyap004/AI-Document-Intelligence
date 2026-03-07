import { useRef } from 'react'
import axios from 'axios'

export default function Sidebar({ docs, activeDockId, onDocSelect, onUpload, uploading }) {
  const fileRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    onUpload(formData, file.name)
  }

  return (
    <div style={{
      width: '260px',
      background: '#171717',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #2f2f2f',
      flexShrink: 0
    }}>
      {/* App title */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #2f2f2f' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#ececec' }}>
          📄 Doc Intelligence
        </h2>
      </div>

      {/* Upload button */}
      <div style={{ padding: '12px' }}>
        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '10px',
            background: uploading ? '#2f2f2f' : '#2f2f2f',
            border: '1px dashed #444',
            borderRadius: '8px',
            color: uploading ? '#666' : '#ececec',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '13px'
          }}
        >
          {uploading ? '⏳ Processing...' : '+ Upload PDF'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Document list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {docs.length === 0 && (
          <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '20px' }}>
            No documents yet
          </p>
        )}
        {docs.map(doc => (
          <div
            key={doc.id}
            onClick={() => onDocSelect(doc)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeDockId === doc.id ? '#2f2f2f' : 'transparent',
              marginBottom: '4px',
              fontSize: '13px',
              color: activeDockId === doc.id ? '#ececec' : '#999',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            📄 {doc.name}
          </div>
        ))}
      </div>
    </div>
  )
}