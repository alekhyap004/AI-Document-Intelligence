import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

export default function ChatWindow({ doc }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractSchema, setExtractSchema] = useState('')
  const [showExtract, setShowExtract] = useState(false)
  const bottomRef = useRef(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset chat when document changes
  useEffect(() => {
    setMessages([])
  }, [doc?.id])

  const sendMessage = async () => {
    if (!input.trim() || !doc || loading) return
    const question = input.trim()
    setInput('')

    // Add user message immediately
    const newMessages = [...messages, { role: 'user', content: question }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await axios.post('/api/chat', {
        doc_id: doc.id,
        question,
        history: messages // send full history for memory
      })
      setMessages([...newMessages, { role: 'assistant', content: res.data.answer }])
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Error getting response.' }])
    }
    setLoading(false)
  }

  const handleSummarize = async () => {
    if (!doc || summarizing) return
    setSummarizing(true)
    setMessages(prev => [...prev, { role: 'user', content: '📋 Summarize this document' }])
    try {
      const res = await axios.post('/api/summarize', { doc_id: doc.id })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.summary }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error summarizing.' }])
    }
    setSummarizing(false)
  }

  const handleExtract = async () => {
    if (!doc || !extractSchema.trim() || extracting) return
    setExtracting(true)
    setShowExtract(false)
    setMessages(prev => [...prev, { role: 'user', content: `🔍 Extract: ${extractSchema}` }])
    try {
      const res = await axios.post('/api/extract', { doc_id: doc.id, schema: extractSchema })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.result }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error extracting.' }])
    }
    setExtractSchema('')
    setExtracting(false)
  }

  if (!doc) return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#666', fontSize: '14px'
    }}>
      Upload a PDF to get started
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* Top bar */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #2f2f2f',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>📄 {doc.name}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSummarize} disabled={summarizing} style={btnStyle('#2f2f2f')}>
            {summarizing ? 'Summarizing...' : '📋 Summarize'}
          </button>
          <button onClick={() => setShowExtract(!showExtract)} style={btnStyle('#2f2f2f')}>
            🔍 Extract
          </button>
        </div>
      </div>

      {/* Extract input bar */}
      {showExtract && (
        <div style={{ padding: '10px 20px', background: '#1a1a1a', display: 'flex', gap: '8px' }}>
          <input
            value={extractSchema}
            onChange={e => setExtractSchema(e.target.value)}
            placeholder="What do you want to extract? e.g. all dates and recommendations"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleExtract} style={btnStyle('#10a37f')}>
            Extract
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: '40px' }}>
            Ask anything about <strong style={{ color: '#999' }}>{doc.name}</strong>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '16px'
          }}>
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? '#2f2f2f' : '#1a1a1a',
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#ececec',
              border: msg.role === 'assistant' ? '1px solid #2f2f2f' : 'none'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <div style={{
              padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
              background: '#1a1a1a', border: '1px solid #2f2f2f',
              fontSize: '14px', color: '#666'
            }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #2f2f2f', display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask a question about this document..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={sendMessage} disabled={loading} style={btnStyle('#10a37f')}>
          Send
        </button>
      </div>
    </div>
  )
}

const btnStyle = (bg) => ({
  padding: '8px 14px',
  background: bg,
  border: 'none',
  borderRadius: '8px',
  color: '#ececec',
  cursor: 'pointer',
  fontSize: '13px'
})

const inputStyle = {
  padding: '10px 14px',
  background: '#2f2f2f',
  border: '1px solid #444',
  borderRadius: '8px',
  color: '#ececec',
  fontSize: '14px',
  outline: 'none'
}