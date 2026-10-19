import { useEffect, useMemo, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import RegisterScreen from './components/RegisterScreen'
import ExamScreen from './components/ExamScreen'
import ResultsScreen from './components/ResultsScreen'
import { healthQuestions } from './data/healthQuestions'
import { PRACTICE_ROUTES, routeForLocation } from './practiceRoutes'

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
  } catch (error) {
    // Reporting must never keep a learner from seeing their result.
    console.warn('Sheet submission failed:', error)
  }
}

const healthExam = {
  id: 'health',
  title: 'Accident & Health or Sickness Producer',
  subtitle: `${healthQuestions.length} Questions · Maryland · Prometric`,
  questions: healthQuestions,
}

export default function App() {
  const initialRoute = useMemo(
    () => routeForLocation(location.pathname, location.hash),
    [],
  )
  const [screen, setScreen] = useState(initialRoute === 'health' ? 'register' : 'home')
  const [examResults, setExamResults] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (initialRoute === 'login-callback') {
      location.replace(PRACTICE_ROUTES.login + location.search + location.hash)
      return undefined
    }

    const handlePopState = () => {
      const route = routeForLocation(location.pathname, location.hash)
      setScreen(route === 'health' ? 'register' : 'home')
      setExamResults(null)
      setUser(null)
    }
    addEventListener('popstate', handlePopState)
    return () => removeEventListener('popstate', handlePopState)
  }, [initialRoute])

  function selectHealthExam() {
    if (location.pathname !== PRACTICE_ROUTES.health) {
      history.pushState(null, '', PRACTICE_ROUTES.health)
    }
    setExamResults(null)
    setUser(null)
    setScreen('register')
  }

  function startExam(userInfo) {
    setUser(userInfo)
    setScreen('exam')
  }

  function finishExam(results) {
    setExamResults(results)
    setScreen('results')

    const correct = results.results.filter(result => result.correct).length
    const total = healthExam.questions.length
    submitToSheet({
      name: user.name,
      email: user.email,
      examType: healthExam.title,
      score: correct,
      total,
      percentage: Math.round((correct / total) * 100),
      passed: correct >= 63,
      wrong: results.results.filter(result => !result.correct && !result.skipped).length,
      skipped: results.results.filter(result => result.skipped).length,
      earlyFail: results.earlyFail || false,
      timestamp: new Date().toISOString(),
    })
  }

  function goHome() {
    if (location.pathname !== PRACTICE_ROUTES.home) {
      history.pushState(null, '', PRACTICE_ROUTES.home)
    }
    setScreen('home')
    setExamResults(null)
    setUser(null)
  }

  function retry() {
    setExamResults(null)
    setScreen('register')
  }

  if (initialRoute === 'login-callback') {
    return <main className="route-message"><p>Opening AMG Learning…</p></main>
  }

  return (
    <div className="app-shell">
      {screen === 'home' && <HomeScreen onStartHealth={selectHealthExam} />}
      {screen === 'register' && (
        <RegisterScreen exam={healthExam} onStart={startExam} onBack={goHome} />
      )}
      {screen === 'exam' && (
        <ExamScreen exam={healthExam} user={user} onFinish={finishExam} onHome={goHome} />
      )}
      {screen === 'results' && (
        <ResultsScreen
          exam={healthExam}
          results={examResults}
          user={user}
          onRetry={retry}
          onHome={goHome}
        />
      )}
    </div>
  )
}
