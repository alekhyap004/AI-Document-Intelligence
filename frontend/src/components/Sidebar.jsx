import { useRef } from 'react'

export default function Sidebar({
  conversations, activeConversationId,
  onNewChat, onSelectConversation,
  docs, onUpload, uploading
}) {
  const fileRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    onUpload(formData, file.name)
    e.target.value = ''
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
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #2f2f2f' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#ececec' }}>
          📄 Doc Intelligence
        </h2>
      </div>

      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={onNewChat}
          style={{
            width: '100%', padding: '10px',
            background: '#2f2f2f', border: '1px solid #444',
            borderRadius: '8px', color: '#ececec',
            cursor: 'pointer', fontSize: '13px', textAlign: 'left'
          }}
        >
          + New Chat
        </button>
        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          style={{
            width: '100%', padding: '10px',
            background: 'transparent', border: '1px dashed #444',
            borderRadius: '8px', color: uploading ? '#666' : '#999',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '13px', textAlign: 'left'
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

      {docs.length > 0 && (
        <div style={{ padding: '0 12px 8px' }}>
          <p style={{ fontSize: '11px', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Loaded docs
          </p>
          {docs.map(doc => (
            <div key={doc.id} style={{
              fontSize: '12px', color: '#999',
              padding: '4px 8px', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              📄 {doc.name}
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px', borderTop: '1px solid #2f2f2f', paddingTop: '8px' }}>
        <p style={{ fontSize: '11px', color: '#666', padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Conversations
        </p>
        {conversations.length === 0 && (
          <p style={{ fontSize: '12px', color: '#555', textAlign: 'center', marginTop: '12px' }}>
            No conversations yet
          </p>
        )}
        {conversations.map(convo => (
          <div
            key={convo.id}
            onClick={() => onSelectConversation(convo)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeConversationId === convo.id ? '#2f2f2f' : 'transparent',
              marginBottom: '2px',
              fontSize: '13px',
              color: activeConversationId === convo.id ? '#ececec' : '#999',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            💬 {convo.title}
          </div>
        ))}
      </div>
    </div>
  )
}