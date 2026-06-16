import { useState, useEffect, useRef } from 'react'

const BLUE = '#1F4E79'
const TOTAL = 90
const PASS_SCORE = 63

export default function ExamScreen({ exam, user, onFinish, onHome }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionIndex: letter }
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false) // true after answer locked in
  const [flagged, setFlagged] = useState(new Set())
  const [earlyFail, setEarlyFail] = useState(false)
  const feedbackRef = useRef(null)

  const questions = exam.questions
  const q = questions[current]

  useEffect(() => {
    const saved = answers[current]
    if (saved) {
      setSelected(saved)
      setRevealed(true)
    } else {
      setSelected(null)
      setRevealed(false)
    }
  }, [current])

  // Scroll feedback into view after reveal
  useEffect(() => {
    if (revealed && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [revealed])

  function checkEarlyFail(newAnswers) {
    const answered = Object.keys(newAnswers).length
    const correct = Object.entries(newAnswers).filter(
      ([i, a]) => a === questions[parseInt(i)].answer
    ).length
    return correct + (TOTAL - answered) < PASS_SCORE
  }

  function handleSelect(letter) {
    if (revealed) return // locked in
    setSelected(letter)
    const newAnswers = { ...answers, [current]: letter }
    setAnswers(newAnswers)
    setRevealed(true)

    if (checkEarlyFail(newAnswers)) {
      setEarlyFail(true)
    }
  }

  function handleNext() {
    if (current === TOTAL - 1 || earlyFail) {
      submitExam()
      return
    }
    setCurrent(current + 1)
  }

  function submitExam() {
    const results = questions.map((q, i) => ({
      question: q,
      userAnswer: answers[i] ?? null,
      correct: answers[i] === q.answer,
      skipped: answers[i] === undefined || answers[i] === null,
    }))
    onFinish({ results, earlyFail })
  }

  function toggleFlag() {
    const nf = new Set(flagged)
    nf.has(current) ? nf.delete(current) : nf.add(current)
    setFlagged(nf)
  }

  const answeredCount = Object.keys(answers).length
  const correctSoFar = Object.entries(answers).filter(
    ([i, a]) => a === questions[parseInt(i)].answer
  ).length
  const wrongSoFar = answeredCount - correctSoFar
  const isCorrect = revealed && selected === q.answer

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f4f8' }}>
      {/* Top bar */}
      <div style={{ background: BLUE, color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>AMG</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exam.title}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, flexWrap: 'wrap' }}>
          {user && <span style={{ opacity: 0.8 }}>{user.name}</span>}
          <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '4px 10px' }}>
            Q {current + 1}/{TOTAL}
          </span>
          <span style={{ background: 'rgba(76,175,80,0.25)', borderRadius: 6, padding: '4px 10px', color: '#A5D6A7' }}>
            ✓ {correctSoFar}
          </span>
          <span style={{ background: 'rgba(244,67,54,0.25)', borderRadius: 6, padding: '4px 10px', color: '#EF9A9A' }}>
            ✗ {wrongSoFar}
          </span>
          <button
            onClick={onHome}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 6, padding: '4px 12px', fontSize: 13, cursor: 'pointer' }}
          >
            Exit
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main question area */}
        <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>

          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#718096', marginBottom: 5 }}>
              <span>{answeredCount} answered</span>
              <span style={{ fontWeight: 600, color: answeredCount > 0 && (correctSoFar / answeredCount) >= 0.7 ? '#2e7d32' : '#c62828' }}>
                {answeredCount > 0 ? `${Math.round((correctSoFar / answeredCount) * 100)}% correct` : 'Not started'}
              </span>
            </div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', display: 'flex' }}>
                <div style={{ width: `${(correctSoFar / TOTAL) * 100}%`, background: '#4CAF50', transition: 'width 0.3s' }} />
                <div style={{ width: `${(wrongSoFar / TOTAL) * 100}%`, background: '#ef5350', transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>

          {/* Early fail warning */}
          {earlyFail && (
            <div style={{ background: '#FFEBEE', border: '1px solid #EF9A9A', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>⛔</span>
              <div>
                <div style={{ fontWeight: 700, color: '#B71C1C', fontSize: 14 }}>It's no longer possible to reach 70%</div>
                <div style={{ color: '#c62828', fontSize: 13 }}>Finish reviewing this answer, then see your full results.</div>
              </div>
            </div>
          )}

          {/* Question card */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '26px 30px', boxShadow: '0 2px 14px rgba(0,0,0,0.07)', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 22 }}>
              <span style={{ background: BLUE, color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                {current + 1}
              </span>
              <p style={{ fontSize: 17, fontWeight: 600, color: '#1a202c', lineHeight: 1.55, margin: 0 }}>
                {q.q}
              </p>
            </div>

            {/* Choices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.choices.map((choice) => {
                const letter = choice[0]
                const isCorrectChoice = letter === q.answer
                const isUserChoice = letter === selected

                let bg = '#fafafa'
                let border = '2px solid #e2e8f0'
                let color = '#2d3748'
                let fontWeight = 400
                let icon = null

                if (revealed) {
                  if (isCorrectChoice) {
                    bg = '#E8F5E9'; border = '2px solid #66BB6A'; color = '#1B5E20'; fontWeight = 700
                    icon = '✓'
                  } else if (isUserChoice) {
                    bg = '#FFEBEE'; border = '2px solid #EF5350'; color = '#B71C1C'; fontWeight = 700
                    icon = '✗'
                  }
                } else if (isUserChoice) {
                  bg = '#EBF3FB'; border = `2px solid ${BLUE}`; color = BLUE; fontWeight = 600
                }

                return (
                  <button
                    key={letter}
                    onClick={() => handleSelect(letter)}
                    disabled={revealed}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '13px 16px', borderRadius: 10, border, background: bg,
                      cursor: revealed ? 'default' : 'pointer',
                      textAlign: 'left', fontSize: 15, color, fontWeight,
                      transition: 'all 0.18s',
                    }}
                  >
                    <span style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: revealed ? (isCorrectChoice ? '#4CAF50' : isUserChoice ? '#ef5350' : '#e2e8f0') : (isUserChoice ? BLUE : '#e2e8f0'),
                      color: revealed ? (isCorrectChoice || isUserChoice ? '#fff' : '#718096') : (isUserChoice ? '#fff' : '#718096'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: icon ? 15 : 13,
                    }}>
                      {icon || letter}
                    </span>
                    <span style={{ flex: 1 }}>{choice.substring(3)}</span>
                    {revealed && isCorrectChoice && (
                      <span style={{ fontSize: 12, background: '#C8E6C9', color: '#1B5E20', borderRadius: 5, padding: '2px 8px', flexShrink: 0 }}>Correct</span>
                    )}
                    {revealed && isUserChoice && !isCorrectChoice && (
                      <span style={{ fontSize: 12, background: '#FFCDD2', color: '#B71C1C', borderRadius: 5, padding: '2px 8px', flexShrink: 0 }}>Your answer</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feedback / explanation — shown after answer */}
          {revealed && (
            <div ref={feedbackRef}>
              {/* Result banner */}
              <div style={{
                borderRadius: 10, padding: '14px 18px', marginBottom: 12,
                background: isCorrect ? '#E8F5E9' : '#FFEBEE',
                border: `2px solid ${isCorrect ? '#66BB6A' : '#EF5350'}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 26 }}>{isCorrect ? '✅' : '❌'}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: isCorrect ? '#1B5E20' : '#B71C1C' }}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </div>
                  {!isCorrect && (
                    <div style={{ fontSize: 13, color: '#c62828', marginTop: 2 }}>
                      The correct answer is <strong>{q.answer}) {q.choices.find(c => c[0] === q.answer)?.substring(3)}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Explanation */}
              <div style={{ background: '#EBF3FB', border: `1px solid #90CAF9`, borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: BLUE, fontSize: 13, marginBottom: 6 }}>📖 Explanation</div>
                <p style={{ color: '#2d3748', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  {q.explanation}
                </p>
              </div>

              {/* Next button */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
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
                  {flagged.has(current) ? '⚑ Flagged' : '⚐ Flag for review'}
                </button>
                <button
                  onClick={handleNext}
                  style={{
                    padding: '13px 32px', borderRadius: 10, border: 'none',
                    background: current === TOTAL - 1 || earlyFail ? '#2e7d32' : BLUE,
                    color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                    letterSpacing: 0.3,
                  }}
                >
                  {current === TOTAL - 1 || earlyFail ? 'See Results →' : 'Next Question →'}
                </button>
              </div>
            </div>
          )}

          {/* Prompt when no answer selected yet */}
          {!revealed && (
            <div style={{ textAlign: 'center', color: '#a0aec0', fontSize: 14, padding: '10px 0' }}>
              Select an answer to continue
            </div>
          )}
        </div>

        {/* Navigator sidebar */}
        <div style={{ width: 200, background: '#fff', borderLeft: '1px solid #e2e8f0', padding: '18px 14px', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Navigator</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
            {questions.map((_, i) => {
              const ans = answers[i]
              const isCurrent = i === current
              const isAnswered = ans != null
              const isRight = isAnswered && ans === questions[i].answer
              const isFlagged = flagged.has(i)

              let bg = '#fafafa'
              let border = '2px solid #e2e8f0'
              let color = '#a0aec0'

              if (isCurrent) { bg = BLUE; border = `2px solid ${BLUE}`; color = '#fff' }
              else if (isAnswered) {
                bg = isRight ? '#E8F5E9' : '#FFEBEE'
                border = `2px solid ${isRight ? '#66BB6A' : '#EF5350'}`
                color = isRight ? '#2e7d32' : '#c62828'
              }
              if (isFlagged && !isCurrent) border = '2px solid #F59E0B'

              return (
                <button
                  key={i}
                  onClick={() => { if (answers[i] != null || i <= current) { setCurrent(i) } }}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 6, fontSize: 11,
                    fontWeight: 700, border, background: bg, color,
                    cursor: (answers[i] != null || i <= current) ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: '#718096' }}>
            {[
              [BLUE, 'Current'],
              ['#4CAF50', 'Correct'],
              ['#ef5350', 'Wrong'],
              ['#F59E0B', 'Flagged'],
            ].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Live score card */}
          <div style={{ marginTop: 18, background: '#f0f4f8', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Score</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: answeredCount > 0 && (correctSoFar / answeredCount) >= 0.7 ? '#2e7d32' : '#c62828' }}>
              {answeredCount > 0 ? `${Math.round((correctSoFar / answeredCount) * 100)}%` : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{correctSoFar}/{answeredCount} correct</div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 1 }}>Need 63 to pass</div>
          </div>
        </div>
      </div>
    </div>
  )
}
