import { useState } from 'react'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'

export default function App() {
  const [docs, setDocs] = useState([])
  const [activeDoc, setActiveDoc] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (formData, fileName) => {
    setUploading(true)
    try {
      const res = await axios.post('/api/upload', formData)
      const newDoc = { id: res.data.doc_id, name: fileName }
      setDocs(prev => [...prev, newDoc])
      setActiveDoc(newDoc)
    } catch (err) {
      alert('Upload failed. Make sure the backend is running.')
    }
    setUploading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        docs={docs}
        activeDockId={activeDoc?.id}
        onDocSelect={setActiveDoc}
        onUpload={handleUpload}
        uploading={uploading}
      />
      <ChatWindow doc={activeDoc} />
    </div>
  )
}