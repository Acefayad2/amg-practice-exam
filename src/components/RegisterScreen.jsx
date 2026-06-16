import { useState } from 'react'

const BLUE = '#1F4E79'

export default function RegisterScreen({ exam, onStart, onBack }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Please enter your name.'
    if (!email.trim()) e.email = 'Please enter your email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email address.'
    return e
  }

  function handleStart(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onStart({ name: name.trim(), email: email.trim().toLowerCase() })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '40px 44px', width: '100%', maxWidth: 460, boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: `2px solid #EBF3FB` }}>
        {/* Back */}
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#718096', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to exams
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: BLUE, textTransform: 'uppercase', marginBottom: 6 }}>AMG Practice Exam</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a202c', marginBottom: 6, lineHeight: 1.3 }}>{exam.title}</h2>
          <p style={{ color: '#718096', fontSize: 14 }}>Enter your info so your score gets recorded — then you'll go straight into the exam.</p>
        </div>

        <form onSubmit={handleStart} noValidate>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#2d3748', marginBottom: 6 }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: null })) }}
              placeholder="e.g. John Doe"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 9, fontSize: 15,
                border: `2px solid ${errors.name ? '#ef5350' : '#e2e8f0'}`,
                outline: 'none', fontFamily: 'inherit', color: '#1a202c',
                boxSizing: 'border-box',
              }}
            />
            {errors.name && <div style={{ color: '#c62828', fontSize: 13, marginTop: 5, fontWeight: 500 }}>{errors.name}</div>}
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#2d3748', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: null })) }}
              placeholder="e.g. danielle@example.com"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 9, fontSize: 15,
                border: `2px solid ${errors.email ? '#ef5350' : '#e2e8f0'}`,
                outline: 'none', fontFamily: 'inherit', color: '#1a202c',
                boxSizing: 'border-box',
              }}
            />
            {errors.email && <div style={{ color: '#c62828', fontSize: 13, marginTop: 5, fontWeight: 500 }}>{errors.email}</div>}
          </div>

          <div style={{ background: '#EBF3FB', borderRadius: 9, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#2d3748' }}>
            <strong style={{ color: BLUE }}>📊 Score tracking:</strong> Your name, email, score, and pass/fail result will be recorded so your instructor can see your progress.
          </div>

          <button
            type="submit"
            style={{
              width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
              background: BLUE, color: '#fff', fontWeight: 700, fontSize: 16,
              cursor: 'pointer', letterSpacing: 0.3,
            }}
          >
            Begin Exam →
          </button>
        </form>
      </div>
    </div>
  )
}
