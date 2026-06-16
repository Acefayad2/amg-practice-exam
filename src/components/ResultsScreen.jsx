import { useState } from 'react'

const BLUE = '#1F4E79'
const PASS_SCORE = 63
const TOTAL = 90

const TOPIC_MAP = {
  // Health exam topics
  'MIA': ['unfair practices', 'Maryland Insurance Administration', 'MIA', 'license', 'producer', 'licensing', 'continuing education', 'change of name', 'business records', 'managing general agent'],
  'Policy Provisions': ['grace period', 'reinstatement', 'free look', 'entire contract', 'consideration', 'elimination period', 'deductible', 'incontestability', 'provision'],
  'Medical Expense': ['major medical', 'hospital', 'medical expense', 'coinsurance', 'stop-loss', 'deductible', 'HMO', 'health maintenance', 'dental', 'vision'],
  'Medicare & Medicaid': ['Medicare', 'Medicaid', 'hospice', 'home health', 'supplement', 'SELECT', 'COBRA', 'Part A', 'Part B'],
  'Disability Income': ['disability income', 'elimination period', 'own occupation', 'waiver of premium', 'nonoccupational'],
  'Long-Term Care': ['long-term care', 'LTC', 'custodial', 'ADL', 'activities of daily living', 'functional assessment'],
  'Unfair Trade Practices': ['twisting', 'rebating', 'defamation', 'coercion', 'misrepresentation', 'unfair trade'],
  'Life Insurance': ['life insurance', 'universal life', 'whole life', 'term', 'death benefit', 'cash value', 'beneficiary', 'annuity', 'nonforfeiture', 'replacement', 'buy-sell'],
  'General Insurance': ['stock', 'mutual', 'solvency', 'insurable interest', 'consideration', 'ERISA', 'group', 'HIPAA', 'subrogation'],
}

function classifyTopic(questionText) {
  const lower = questionText.toLowerCase()
  for (const [topic, keywords] of Object.entries(TOPIC_MAP)) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) return topic
  }
  return 'General Insurance'
}

export default function ResultsScreen({ exam, results, onRetry, onHome }) {
  const [activeTab, setActiveTab] = useState('summary') // 'summary' | 'review'
  const [filter, setFilter] = useState('wrong') // 'all' | 'wrong' | 'correct'

  const { results: items, earlyFail } = results
  const correct = items.filter(r => r.correct).length
  const wrong = items.filter(r => !r.correct && !r.skipped).length
  const skipped = items.filter(r => r.skipped).length
  const answered = items.filter(r => !r.skipped).length
  const pct = Math.round((correct / TOTAL) * 100)
  const passed = correct >= PASS_SCORE

  // Topic analysis
  const topicStats = {}
  items.forEach(r => {
    const topic = classifyTopic(r.question.q)
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 }
    topicStats[topic].total++
    if (r.correct) topicStats[topic].correct++
  })
  const weakTopics = Object.entries(topicStats)
    .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.7)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))

  const filteredItems = items.filter(r => {
    if (filter === 'wrong') return !r.correct
    if (filter === 'correct') return r.correct
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Top bar */}
      <div style={{ background: BLUE, color: '#fff', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>AMG</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onRetry}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 7, padding: '7px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            Retry Exam
          </button>
          <button
            onClick={onHome}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 7, padding: '7px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            ← All Exams
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>

        {/* Early fail banner */}
        {earlyFail && (
          <div style={{ background: '#FFEBEE', border: '1px solid #EF9A9A', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22 }}>⛔</span>
            <div>
              <div style={{ fontWeight: 700, color: '#B71C1C', marginBottom: 4 }}>Exam Stopped Early</div>
              <div style={{ color: '#c62828', fontSize: 14, lineHeight: 1.5 }}>
                It became mathematically impossible to reach 70% (63/90) with the remaining questions. Review your weak areas below and try again.
              </div>
            </div>
          </div>
        )}

        {/* Score card */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '32px 36px', marginBottom: 24,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: `3px solid ${passed ? '#2e7d32' : '#c62828'}`,
          display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#718096', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
              {exam.title}
            </div>
            <div style={{ fontSize: 56, fontWeight: 900, color: passed ? '#2e7d32' : '#c62828', lineHeight: 1, marginBottom: 6 }}>
              {pct}%
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: passed ? '#E8F5E9' : '#FFEBEE',
              color: passed ? '#2e7d32' : '#c62828',
              borderRadius: 20, padding: '6px 16px', fontWeight: 700, fontSize: 15,
            }}>
              {passed ? '✓ PASSED' : '✗ FAILED'} — {correct}/{TOTAL} correct
            </div>
            <div style={{ marginTop: 10, color: '#718096', fontSize: 14 }}>
              Passing score: 63/90 (70%)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, minWidth: 260 }}>
            {[
              { label: 'Correct', value: correct, color: '#2e7d32', bg: '#E8F5E9' },
              { label: 'Wrong', value: wrong, color: '#c62828', bg: '#FFEBEE' },
              { label: 'Skipped', value: skipped, color: '#E65100', bg: '#FFF3E0' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 10, padding: '14px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color, opacity: 0.8 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#fff', borderRadius: 10, padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {[['summary', '📊 Score Summary'], ['review', '📝 Review Questions']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1, padding: '11px 0', border: 'none', borderRadius: 8,
                background: activeTab === id ? BLUE : 'transparent',
                color: activeTab === id ? '#fff' : '#4a5568',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* What you need to work on */}
            {weakTopics.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h3 style={{ color: '#c62828', fontWeight: 800, fontSize: 17, marginBottom: 16 }}>
                  ⚠️ Areas to Focus On (Below 70%)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {weakTopics.map(([topic, stats]) => {
                    const topicPct = Math.round((stats.correct / stats.total) * 100)
                    return (
                      <div key={topic}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: '#1a202c', fontSize: 14 }}>{topic}</span>
                          <span style={{ fontSize: 13, color: topicPct < 50 ? '#c62828' : '#E65100', fontWeight: 700 }}>
                            {stats.correct}/{stats.total} ({topicPct}%)
                          </span>
                        </div>
                        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${topicPct}%`, background: topicPct < 50 ? '#ef5350' : '#FF9800', borderRadius: 4, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* All topics */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ color: BLUE, fontWeight: 800, fontSize: 17, marginBottom: 16 }}>📈 All Topic Areas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(topicStats)
                  .filter(([, s]) => s.total > 0)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([topic, stats]) => {
                    const topicPct = Math.round((stats.correct / stats.total) * 100)
                    const color = topicPct >= 70 ? '#2e7d32' : topicPct >= 50 ? '#E65100' : '#c62828'
                    return (
                      <div key={topic}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: '#1a202c', fontSize: 14 }}>{topic}</span>
                          <span style={{ fontSize: 13, color, fontWeight: 700 }}>
                            {stats.correct}/{stats.total} ({topicPct}%)
                          </span>
                        </div>
                        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${topicPct}%`, background: color, borderRadius: 4 }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Score needed */}
            {!passed && (
              <div style={{ background: '#EBF3FB', border: `2px solid ${BLUE}`, borderRadius: 14, padding: '20px 24px' }}>
                <h4 style={{ color: BLUE, fontWeight: 700, marginBottom: 8 }}>What You Need to Pass</h4>
                <p style={{ color: '#2d3748', fontSize: 14, lineHeight: 1.6 }}>
                  You scored <strong>{correct}/90 ({pct}%)</strong>. To pass, you need <strong>63/90 (70%)</strong> — that's <strong>{PASS_SCORE - correct} more correct answers</strong>.
                  Focus on the red and orange topic areas above, then retry the exam.
                </p>
              </div>
            )}

            {passed && (
              <div style={{ background: '#E8F5E9', border: '2px solid #2e7d32', borderRadius: 14, padding: '20px 24px' }}>
                <h4 style={{ color: '#2e7d32', fontWeight: 700, marginBottom: 8 }}>🎉 Congratulations!</h4>
                <p style={{ color: '#2d3748', fontSize: 14, lineHeight: 1.6 }}>
                  You passed with <strong>{correct}/90 ({pct}%)</strong> — above the 70% passing threshold. You're ready for the real Prometric exam!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[['wrong', `Wrong (${wrong + skipped})`], ['correct', `Correct (${correct})`], ['all', `All (${TOTAL})`]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: filter === val ? BLUE : '#fff',
                    color: filter === val ? '#fff' : '#4a5568',
                    border: filter === val ? `2px solid ${BLUE}` : '2px solid #e2e8f0',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredItems.map((r, i) => (
                <ReviewCard key={i} result={r} index={items.indexOf(r)} />
              ))}
              {filteredItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#718096', fontWeight: 600 }}>
                  {filter === 'wrong' ? '🎉 No wrong answers!' : 'No items to show.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewCard({ result, index }) {
  const [open, setOpen] = useState(false)
  const { question: q, userAnswer, correct, skipped } = result
  const correctChoice = q.choices.find(c => c[0] === q.answer)
  const userChoice = userAnswer ? q.choices.find(c => c[0] === userAnswer) : null

  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      border: `2px solid ${correct ? '#a5d6a7' : '#ef9a9a'}`,
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start' }}
      >
        <span style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: correct ? '#2e7d32' : '#c62828',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, marginTop: 1,
        }}>
          {correct ? '✓' : '✗'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#718096', fontWeight: 600, marginBottom: 3 }}>
            Question {index + 1}
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1a202c', lineHeight: 1.45, margin: 0 }}>
            {q.q}
          </p>
        </div>
        <span style={{ color: '#a0aec0', fontSize: 18, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #f0f4f8', padding: '16px 22px 20px' }}>
          {/* Answer choices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {q.choices.map((choice) => {
              const letter = choice[0]
              const isCorrect = letter === q.answer
              const isUserWrong = letter === userAnswer && !isCorrect
              return (
                <div key={letter} style={{
                  padding: '10px 14px', borderRadius: 8, fontSize: 14,
                  background: isCorrect ? '#E8F5E9' : isUserWrong ? '#FFEBEE' : '#fafafa',
                  border: `1px solid ${isCorrect ? '#a5d6a7' : isUserWrong ? '#ef9a9a' : '#e2e8f0'}`,
                  color: isCorrect ? '#2e7d32' : isUserWrong ? '#c62828' : '#4a5568',
                  fontWeight: isCorrect || isUserWrong ? 700 : 400,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {isCorrect && <span>✓</span>}
                  {isUserWrong && <span>✗</span>}
                  {choice}
                  {isCorrect && <span style={{ marginLeft: 'auto', fontSize: 12 }}>Correct Answer</span>}
                  {isUserWrong && <span style={{ marginLeft: 'auto', fontSize: 12 }}>Your Answer</span>}
                </div>
              )
            })}
          </div>

          {skipped && (
            <div style={{ background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#E65100', fontWeight: 600 }}>
              ⚠️ You did not answer this question.
            </div>
          )}

          {/* Explanation */}
          <div style={{ background: '#EBF3FB', border: `1px solid #90CAF9`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, color: BLUE, fontSize: 13, marginBottom: 6 }}>📖 Explanation</div>
            <p style={{ color: '#2d3748', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              {q.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
