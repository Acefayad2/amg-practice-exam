import { useState, useEffect } from 'react'

const BLUE = '#1F4E79'
const TOTAL = 90
const PASS_SCORE = 63

export default function ExamScreen({ exam, onFinish, onHome }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionIndex: 'A'|'B'|'C'|'D' }
  const [flagged, setFlagged] = useState(new Set())
  const [selected, setSelected] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [earlyFail, setEarlyFail] = useState(false)

  const questions = exam.questions
  const q = questions[current]

  // Load saved selection when navigating
  useEffect(() => {
    setSelected(answers[current] ?? null)
  }, [current])

  // Check if it's mathematically impossible to pass
  function checkEarlyFail(newAnswers) {
    const answered = Object.keys(newAnswers).length
    const correct = Object.entries(newAnswers).filter(
      ([i, a]) => a === questions[parseInt(i)].answer
    ).length
    const remaining = TOTAL - answered
    return correct + remaining < PASS_SCORE
  }

  function handleSelect(letter) {
    setSelected(letter)
  }

  function handleNext() {
    if (!selected) return
    const newAnswers = { ...answers, [current]: selected }
    setAnswers(newAnswers)

    if (current === TOTAL - 1) {
      // Last question — finish exam
      submitExam(newAnswers)
      return
    }

    if (checkEarlyFail(newAnswers)) {
      setEarlyFail(true)
      submitExam(newAnswers)
      return
    }

    setCurrent(current + 1)
  }

  function handlePrev() {
    if (current > 0) setCurrent(current - 1)
  }

  function handleJump(idx) {
    setCurrent(idx)
  }

  function toggleFlag() {
    const nf = new Set(flagged)
    nf.has(current) ? nf.delete(current) : nf.add(current)
    setFlagged(nf)
  }

  function handleSubmitClick() {
    const allAnswered = Object.keys(answers).length + (selected ? 1 : 0)
    const unanswered = TOTAL - allAnswered
    if (unanswered > 0) {
      setShowConfirm(true)
    } else {
      const finalAnswers = selected ? { ...answers, [current]: selected } : answers
      submitExam(finalAnswers)
    }
  }

  function submitExam(finalAnswers) {
    const fa = selected ? { ...finalAnswers, [current]: selected } : finalAnswers
    const results = questions.map((q, i) => ({
      question: q,
      userAnswer: fa[i] ?? null,
      correct: fa[i] === q.answer,
      skipped: fa[i] === undefined || fa[i] === null,
    }))
    onFinish({ results, earlyFail })
  }

  const answeredCount = Object.keys(answers).length + (selected && !answers[current] ? 1 : 0)
  const correctSoFar = Object.entries(answers).filter(([i, a]) => a === questions[parseInt(i)].answer).length
  const remaining = TOTAL - Object.keys(answers).length
  const pct = Math.round((correctSoFar / Math.max(Object.keys(answers).length, 1)) * 100)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f4f8' }}>
      {/* Top bar */}
      <div style={{ background: BLUE, color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>AMG</span>
          <span style={{ opacity: 0.7, fontSize: 13 }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>{exam.title}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
          <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '4px 10px' }}>
            Q {current + 1} of {TOTAL}
          </span>
          <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '4px 10px' }}>
            ✓ {correctSoFar} correct
          </span>
          <button
            onClick={onHome}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 6, padding: '4px 12px', fontSize: 13, cursor: 'pointer' }}
          >
            ✕ Exit
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Question Panel */}
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', maxWidth: 760 }}>
          {/* Progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#718096', marginBottom: 6 }}>
              <span>{answeredCount} of {TOTAL} answered</span>
              <span style={{ fontWeight: 600, color: pct >= 70 ? '#2e7d32' : '#c62828' }}>
                {Object.keys(answers).length > 0 ? `${pct}% correct so far` : 'Not started'}
              </span>
            </div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(answeredCount / TOTAL) * 100}%`, background: BLUE, borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Question */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 }}>
              <span style={{ background: BLUE, color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                {current + 1}
              </span>
              <p style={{ fontSize: 17, fontWeight: 600, color: '#1a202c', lineHeight: 1.55, margin: 0 }}>
                {q.q}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.choices.map((choice) => {
                const letter = choice[0]
                const isSelected = selected === letter
                return (
                  <button
                    key={letter}
                    onClick={() => handleSelect(letter)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 18px',
                      borderRadius: 10,
                      border: isSelected ? `2px solid ${BLUE}` : '2px solid #e2e8f0',
                      background: isSelected ? '#EBF3FB' : '#fafafa',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      fontSize: 15,
                      color: isSelected ? BLUE : '#2d3748',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: isSelected ? BLUE : '#e2e8f0',
                      color: isSelected ? '#fff' : '#718096',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13,
                    }}>
                      {letter}
                    </span>
                    <span>{choice.substring(3)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handlePrev}
                disabled={current === 0}
                style={{
                  padding: '11px 22px', borderRadius: 8, border: '2px solid #e2e8f0',
                  background: '#fff', color: '#4a5568', fontWeight: 600, fontSize: 14,
                  cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.4 : 1,
                }}
              >
                ← Previous
              </button>
              <button
                onClick={toggleFlag}
                style={{
                  padding: '11px 16px', borderRadius: 8,
                  border: `2px solid ${flagged.has(current) ? '#F59E0B' : '#e2e8f0'}`,
                  background: flagged.has(current) ? '#FFFBEB' : '#fff',
                  color: flagged.has(current) ? '#B45309' : '#4a5568',
                  fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}
              >
                {flagged.has(current) ? '⚑ Flagged' : '⚐ Flag'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {current === TOTAL - 1 ? (
                <button
                  onClick={handleSubmitClick}
                  style={{
                    padding: '11px 24px', borderRadius: 8, border: 'none',
                    background: '#2e7d32', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Submit Exam ✓
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!selected}
                  style={{
                    padding: '11px 24px', borderRadius: 8, border: 'none',
                    background: selected ? BLUE : '#a0aec0',
                    color: '#fff', fontWeight: 700, fontSize: 14,
                    cursor: selected ? 'pointer' : 'not-allowed',
                  }}
                >
                  Next →
                </button>
              )}
              {current < TOTAL - 1 && Object.keys(answers).length > current && (
                <button
                  onClick={handleSubmitClick}
                  style={{
                    padding: '11px 18px', borderRadius: 8,
                    border: '2px solid #e2e8f0', background: '#fff',
                    color: '#4a5568', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  End Exam
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question navigator sidebar */}
        <div style={{ width: 220, background: '#fff', borderLeft: '1px solid #e2e8f0', padding: '20px 16px', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#718096', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
            Navigator
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
            {questions.map((_, i) => {
              const ans = i === current ? selected : answers[i]
              const isCurrent = i === current
              const isAnswered = ans != null
              const isFlagged = flagged.has(i)
              return (
                <button
                  key={i}
                  onClick={() => handleJump(i)}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    border: isCurrent ? `2px solid ${BLUE}` : isFlagged ? '2px solid #F59E0B' : '2px solid #e2e8f0',
                    background: isCurrent ? BLUE : isAnswered ? '#EBF3FB' : '#fafafa',
                    color: isCurrent ? '#fff' : isAnswered ? BLUE : '#a0aec0',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#718096' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: BLUE }} />
              <span>Current</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#EBF3FB', border: `1px solid ${BLUE}` }} />
              <span>Answered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#fafafa', border: '1px solid #F59E0B' }} />
              <span>Flagged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm submit modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: BLUE }}>Submit Exam?</h3>
            <p style={{ color: '#4a5568', marginBottom: 20, lineHeight: 1.6 }}>
              You have <strong>{TOTAL - Object.keys(answers).length - (selected ? 1 : 0)}</strong> unanswered questions.
              Unanswered questions will be marked incorrect.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: '2px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Go Back
              </button>
              <button
                onClick={() => { setShowConfirm(false); submitExam(answers) }}
                style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: '#2e7d32', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
