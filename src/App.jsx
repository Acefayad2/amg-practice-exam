import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import RegisterScreen from './components/RegisterScreen'
import ExamScreen from './components/ExamScreen'
import ResultsScreen from './components/ResultsScreen'
import { healthQuestions } from './data/healthQuestions'
import { lifeQuestions } from './data/lifeQuestions'

// Paste your deployed Google Apps Script Web App URL here after setup:
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''

export async function submitToSheet(payload) {
  if (!APPS_SCRIPT_URL) return
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    // Silently fail — don't block the user from seeing results
    console.warn('Sheet submission failed:', e)
  }
}

export default function App() {
  const [screen, setScreen] = useState('home') // 'home' | 'register' | 'exam' | 'results'
  const [selectedExam, setSelectedExam] = useState(null)
  const [examResults, setExamResults] = useState(null)
  const [user, setUser] = useState(null)

  const exams = {
    health: {
      id: 'health',
      title: 'Accident & Health or Sickness Producer',
      subtitle: '90 Questions · Maryland · Prometric',
      questions: healthQuestions,
    },
    life: {
      id: 'life',
      title: 'Life Producer',
      subtitle: '90 Questions · Maryland · Prometric',
      questions: lifeQuestions,
    },
  }

  function selectExam(examId) {
    setSelectedExam(exams[examId])
    setExamResults(null)
    setScreen('register')
  }

  function startExam(userInfo) {
    setUser(userInfo)
    setScreen('exam')
  }

  function finishExam(results) {
    setExamResults(results)
    setScreen('results')

    // Submit to Google Sheet
    const correct = results.results.filter(r => r.correct).length
    const total = selectedExam.questions.length
    submitToSheet({
      name: user.name,
      email: user.email,
      examType: selectedExam.title,
      score: correct,
      total,
      percentage: Math.round((correct / total) * 100),
      passed: correct >= 63,
      wrong: results.results.filter(r => !r.correct && !r.skipped).length,
      skipped: results.results.filter(r => r.skipped).length,
      earlyFail: results.earlyFail || false,
      timestamp: new Date().toISOString(),
    })
  }

  function goHome() {
    setScreen('home')
    setSelectedExam(null)
    setExamResults(null)
    setUser(null)
  }

  function retry() {
    setExamResults(null)
    setScreen('register')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {screen === 'home' && <HomeScreen exams={exams} onStart={selectExam} />}
      {screen === 'register' && (
        <RegisterScreen exam={selectedExam} onStart={startExam} onBack={goHome} />
      )}
      {screen === 'exam' && (
        <ExamScreen exam={selectedExam} user={user} onFinish={finishExam} onHome={goHome} />
      )}
      {screen === 'results' && (
        <ResultsScreen
          exam={selectedExam}
          results={examResults}
          user={user}
          onRetry={retry}
          onHome={goHome}
        />
      )}
    </div>
  )
}
