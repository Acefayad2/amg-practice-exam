const BLUE = '#1F4E79'
const LIGHT_BLUE = '#EBF3FB'

export default function HomeScreen({ exams, onStart }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: BLUE, textTransform: 'uppercase', marginBottom: 8 }}>
          AMG Insurance Licensing
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: BLUE, marginBottom: 12, lineHeight: 1.1 }}>
          Practice Exam Center
        </h1>
        <p style={{ color: '#4a5568', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
          Prometric-style practice exams for Maryland insurance producer licensing.
          You need <strong>70% (63/90)</strong> to pass.
        </p>
      </div>

      {/* Exam Cards */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
        {Object.values(exams).filter(exam => exam.id !== 'health').map((exam) => (
          <div
            key={exam.id}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '32px 36px',
              width: 340,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              border: `2px solid ${LIGHT_BLUE}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: BLUE }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: BLUE, letterSpacing: 2, textTransform: 'uppercase' }}>
                  {exam.id === 'health' ? 'Accident & Health' : 'Life Producer'}
                </span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a202c', lineHeight: 1.3, marginBottom: 8 }}>
                {exam.title}
              </h2>
              <p style={{ color: '#718096', fontSize: 14 }}>{exam.subtitle}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Questions', '90'],
                ['Passing Score', '70%'],
                ['Min. to Pass', '63 correct'],
                ['State', 'Maryland'],
              ].map(([label, value]) => (
                <div key={label} style={{ background: LIGHT_BLUE, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: '#4a5568', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: BLUE }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#7B5E00' }}>
              <strong>Smart Stop:</strong> If it becomes mathematically impossible to pass mid-exam, the test will stop and show your results.
            </div>

            <button
              onClick={() => onStart(exam.id)}
              style={{
                background: BLUE,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '14px 0',
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 0.5,
                transition: 'opacity 0.15s',
                cursor: 'pointer',
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              Start Exam →
            </button>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 40, color: '#a0aec0', fontSize: 13, textAlign: 'center' }}>
        AMG · Maryland Insurance Producer Licensing Prep
      </p>
    </div>
  )
}
