import { useState } from 'react'

const BLUE = '#1F4E79'
const LIGHT_BLUE = '#EBF3FB'
const CORRECT_PASSWORD = 'amg54321'

export default function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (input === CORRECT_PASSWORD) {
      onUnlock()
    } else {
      setError(true)
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f4f8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        border: `2px solid ${LIGHT_BLUE}`,
        animation: shake ? 'shake 0.4s ease' : 'none',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: BLUE, textTransform: 'uppercase', marginBottom: 10 }}>
            AMG Insurance Licensing
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: BLUE, marginBottom: 8 }}>
            Practice Exam Center
          </h1>
          <p style={{ color: '#718096', fontSize: 14 }}>
            Enter your access password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            placeholder="Password"
            autoFocus
            style={{
              border: `2px solid ${error ? '#E53E3E' : '#CBD5E0'}`,
              borderRadius: 10,
              padding: '14px 16px',
              fontSize: 16,
              outline: 'none',
              transition: 'border-color 0.15s',
              color: '#1a202c',
            }}
          />
          {error && (
            <div style={{ color: '#E53E3E', fontSize: 13, fontWeight: 600, textAlign: 'center', marginTop: -8 }}>
              Incorrect password. Please try again.
            </div>
          )}
          <button
            type="submit"
            style={{
              background: BLUE,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '14px 0',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            Enter →
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
