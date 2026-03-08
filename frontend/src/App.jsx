import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'

export default function App() {
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)

  // Load all conversations when app starts
  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await axios.get('/api/conversations')
      setConversations(res.data)
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    }
  }

  const handleNewChat = async () => {
    try {
      const res = await axios.post('/api/conversations')
      const newConvo = res.data
      setConversations(prev => [newConvo, ...prev])
      setActiveConversation({ ...newConvo, messages: [] })
      setDocs([])
    } catch (err) {
      alert('Failed to create conversation.')
    }
  }

  const handleSelectConversation = async (convo) => {
    try {
      const res = await axios.get(`/api/conversations/${convo.id}`)
      setActiveConversation(res.data)
      // Restore real doc names from database
      setDocs(res.data.docs || [])
    } catch (err) {
      console.error('Failed to load conversation:', err)
    }
  }

  const handleUpload = async (formData, fileName) => {
    setUploading(true)
    try {
      const res = await axios.post('/api/upload', formData)
      const newDoc = { id: res.data.doc_id, name: fileName }
      setDocs(prev => [...prev, newDoc])
    } catch (err) {
      alert('Upload failed. Make sure the backend is running.')
    }
    setUploading(false)
  }

  const handleConversationUpdate = (updatedConvo) => {
    setActiveConversation(updatedConvo)
    setConversations(prev =>
      prev.map(c => c.id === updatedConvo.id ? updatedConvo : c)
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        docs={docs}
        onUpload={handleUpload}
        uploading={uploading}
      />
      <ChatWindow
        conversation={activeConversation}
        docs={docs}
        onConversationUpdate={handleConversationUpdate}
      />
    </div>
  )
}