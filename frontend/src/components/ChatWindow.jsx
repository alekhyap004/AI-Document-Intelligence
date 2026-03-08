import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function ChatWindow({ conversation, docs, onConversationUpdate }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractSchema, setExtractSchema] = useState('')
  const [showExtract, setShowExtract] = useState(false)
  const bottomRef = useRef(null)

  const messages = conversation?.messages || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !conversation || loading) return
    if (docs.length === 0) {
      alert('Please upload at least one PDF first.')
      return
    }
    const question = input.trim()
    setInput('')
    setLoading(true)

    const optimisticMessages = [...messages, { role: 'user', content: question }]
    onConversationUpdate({ ...conversation, messages: optimisticMessages })

    try {
      const res = await axios.post(`${API_BASE}/api/conversations/${conversation.id}/chat`, {
        doc_ids: docs.map(d => d.id),
        question
      })

      const updatedMessages = [
        ...optimisticMessages,
        { role: 'assistant', content: res.data.answer }
      ]

      const updatedConvo = {
        ...conversation,
        title: question.slice(0, 50),
        messages: updatedMessages
      }
      onConversationUpdate(updatedConvo)
    } catch (err) {
      const errorMessages = [
        ...optimisticMessages,
        { role: 'assistant', content: 'Error getting response.' }
      ]
      onConversationUpdate({ ...conversation, messages: errorMessages })
    }
    setLoading(false)
  }

  const handleSummarize = async () => {
    if (docs.length === 0 || summarizing) return
    setSummarizing(true)
    const optimisticMessages = [...messages, { role: 'user', content: '📋 Summarize all documents' }]
    onConversationUpdate({ ...conversation, messages: optimisticMessages })
    try {
      const summaries = await Promise.all(
        docs.map(doc => axios.post(`${API_BASE}/api/summarize`, { doc_id: doc.id })
          .then(res => `${doc.name}:\n${res.data.summary}`)
        )
      )
      onConversationUpdate({
        ...conversation,
        messages: [...optimisticMessages, { role: 'assistant', content: summaries.join('\n\n') }]
      })
    } catch (err) {
      onConversationUpdate({
        ...conversation,
        messages: [...optimisticMessages, { role: 'assistant', content: 'Error summarizing.' }]
      })
    }
    setSummarizing(false)
  }

  const handleExtract = async () => {
    if (docs.length === 0 || !extractSchema.trim() || extracting) return
    setExtracting(true)
    setShowExtract(false)
    const optimisticMessages = [...messages, { role: 'user', content: `🔍 Extract: ${extractSchema}` }]
    onConversationUpdate({ ...conversation, messages: optimisticMessages })
    try {
      const results = await Promise.all(
        docs.map(doc => axios.post(`${API_BASE}/api/extract`, { doc_id: doc.id, schema: extractSchema })
          .then(res => `${doc.name}:\n${res.data.result}`)
        )
      )
      onConversationUpdate({
        ...conversation,
        messages: [...optimisticMessages, { role: 'assistant', content: results.join('\n\n') }]
      })
    } catch (err) {
      onConversationUpdate({
        ...conversation,
        messages: [...optimisticMessages, { role: 'assistant', content: 'Error extracting.' }]
      })
    }
    setExtractSchema('')
    setExtracting(false)
  }

  if (!conversation) return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#666', fontSize: '14px', gap: '12px'
    }}>
      <p>Click <strong style={{ color: '#999' }}>+ New Chat</strong> to start</p>
      <p style={{ fontSize: '12px' }}>Then upload a PDF to chat with it</p>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #2f2f2f',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '14px', color: '#999' }}>
          {docs.length > 0
            ? `${docs.length} doc${docs.length > 1 ? 's' : ''} loaded`
            : 'No docs loaded — upload a PDF'}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSummarize} disabled={summarizing || docs.length === 0} style={btnStyle('#2f2f2f')}>
            {summarizing ? 'Summarizing...' : '📋 Summarize'}
          </button>
          <button onClick={() => setShowExtract(!showExtract)} disabled={docs.length === 0} style={btnStyle('#2f2f2f')}>
            🔍 Extract
          </button>
        </div>
      </div>

      {showExtract && (
        <div style={{ padding: '10px 20px', background: '#1a1a1a', display: 'flex', gap: '8px' }}>
          <input
            value={extractSchema}
            onChange={e => setExtractSchema(e.target.value)}
            placeholder="What do you want to extract? e.g. all dates and recommendations"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleExtract} disabled={extracting} style={btnStyle('#10a37f')}>
            {extracting ? 'Extracting...' : 'Extract'}
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: '40px' }}>
            {docs.length > 0
              ? `Ask anything about your ${docs.length} document${docs.length > 1 ? 's' : ''}`
              : 'Upload a PDF to get started'}
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
              lineHeight: '1.6',
              color: '#ececec',
              border: msg.role === 'assistant' ? '1px solid #2f2f2f' : 'none',
              whiteSpace: 'pre-wrap'
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

      <div style={{ padding: '16px 20px', borderTop: '1px solid #2f2f2f', display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask anything about your documents..."
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