import { useState } from 'react'

const BLUE = '#0B2E24'

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
    <div style={{ minHeight: '100vh', background: '#efede6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="register-card" style={{ background: '#efede6', borderRadius: 32, padding: '40px 44px', width: '100%', maxWidth: 460, boxShadow: '18px 18px 40px #d4cebd, -18px -18px 40px #ffffff', border: 'none' }}>
        {/* Back */}
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#5c6761', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to exams
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.4, color: '#7a5e0f', textTransform: 'uppercase', marginBottom: 8 }}>AMG Practice Exam</div>
          <h2 style={{ fontSize: 26, fontWeight: 600, color: '#0b2e24', marginBottom: 8, lineHeight: 1.2 }}>{exam.title}</h2>
          <p style={{ color: '#5c6761', fontSize: 14 }}>{exam.practiceOnly ? 'Enter your details to begin the life practice drill. This review edition is untimed and gives immediate feedback.' : 'Enter your details to begin. Your result is shown when you finish.'}</p>
        </div>

        <form onSubmit={handleStart} noValidate>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#26342e', marginBottom: 6 }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: null })) }}
              placeholder="e.g. John Doe"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 16, fontSize: 16, background: '#efede6', boxShadow: 'inset 6px 6px 12px #d4cebd, inset -6px -6px 12px #ffffff',
                border: `2px solid ${errors.name ? '#ef5350' : 'transparent'}`,
                outline: 'none', fontFamily: 'inherit', color: '#0b2e24',
                boxSizing: 'border-box',
              }}
            />
            {errors.name && <div style={{ color: '#c62828', fontSize: 13, marginTop: 5, fontWeight: 500 }}>{errors.name}</div>}
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#26342e', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: null })) }}
              placeholder="e.g. danielle@example.com"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 16, fontSize: 16, background: '#efede6', boxShadow: 'inset 6px 6px 12px #d4cebd, inset -6px -6px 12px #ffffff',
                border: `2px solid ${errors.email ? '#ef5350' : 'transparent'}`,
                outline: 'none', fontFamily: 'inherit', color: '#0b2e24',
                boxSizing: 'border-box',
              }}
            />
            {errors.email && <div style={{ color: '#c62828', fontSize: 13, marginTop: 5, fontWeight: 500 }}>{errors.email}</div>}
          </div>

          <div style={{ background: '#efede6', boxShadow: 'inset 3px 3px 7px #d4cebd, inset -3px -3px 7px #ffffff', borderRadius: 16, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#26342e' }}>
            <strong style={{ color: BLUE }}>📊 Score tracking:</strong> {exam.practiceOnly ? 'Your score is shown when you finish. Instructor reporting depends on the configured connection; this screen does not confirm that a score was saved.' : 'Your result is shown when you finish. If instructor reporting is configured, your name, email and result may be submitted, but this screen does not confirm that it was saved. Current practice progress resets if you reload.'}
          </div>

          <button
            type="submit"
            style={{
              width: '100%', padding: '14px 0', borderRadius: 18, border: 'none',
              background: 'linear-gradient(145deg, #17573f, #0b2e24)', color: '#f4e7c3', boxShadow: '6px 6px 14px rgba(11,46,36,0.28), -6px -6px 14px #ffffff', fontWeight: 700, fontSize: 16,
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
