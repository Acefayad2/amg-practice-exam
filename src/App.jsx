import { useEffect, useMemo, useRef, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import RegisterScreen from './components/RegisterScreen'
import ExamScreen from './components/ExamScreen'
import ResultsScreen from './components/ResultsScreen'
import { healthQuestions } from './data/healthQuestions'
import { healthQuestionsForAttempt } from './healthQuestionRotation'
import { practiceRoutesFor, routeForLocation } from './practiceRoutes'

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
  const routes = useMemo(() => practiceRoutesFor(location.pathname), [])
  const initialRoute = useMemo(
    () => routeForLocation(location.pathname, location.hash),
    [],
  )
  const [screen, setScreen] = useState(initialRoute === 'health' ? 'register' : 'home')
  const [examResults, setExamResults] = useState(null)
  const [user, setUser] = useState(null)
  const [activeHealthExam, setActiveHealthExam] = useState(null)
  const healthAttempt = useRef(0)

  useEffect(() => {
    if (initialRoute === 'login-callback') {
      location.replace(routes.login + location.search + location.hash)
      return undefined
    }

    const handlePopState = () => {
      const route = routeForLocation(location.pathname, location.hash)
      setScreen(route === 'health' ? 'register' : 'home')
      setExamResults(null)
      setUser(null)
      setActiveHealthExam(null)
    }
    addEventListener('popstate', handlePopState)
    return () => removeEventListener('popstate', handlePopState)
  }, [initialRoute, routes.login])

  function selectHealthExam() {
    if (location.pathname !== routes.health) {
      history.pushState(null, '', routes.health)
    }
    setExamResults(null)
    setUser(null)
    setActiveHealthExam(null)
    setScreen('register')
  }

  function startExam(userInfo) {
    const questions = healthQuestionsForAttempt(healthQuestions, healthAttempt.current)
    healthAttempt.current += 1
    setActiveHealthExam({ ...healthExam, questions })
    setUser(userInfo)
    setScreen('exam')
  }

  function finishExam(results) {
    setExamResults(results)
    setScreen('results')

    const correct = results.results.filter(result => result.correct).length
    const total = results.results.length
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
    if (location.pathname !== routes.home) {
      history.pushState(null, '', routes.home)
    }
    setScreen('home')
    setExamResults(null)
    setUser(null)
    setActiveHealthExam(null)
  }

  function retry() {
    setExamResults(null)
    setActiveHealthExam(null)
    setScreen('register')
  }

  if (initialRoute === 'login-callback') {
    return <main className="route-message"><p>Opening AMG Learning…</p></main>
  }

  return (
    <div className="app-shell">
      {screen === 'home' && <HomeScreen routes={routes} onStartHealth={selectHealthExam} />}
      {screen === 'register' && (
        <RegisterScreen exam={healthExam} onStart={startExam} onBack={goHome} />
      )}
      {screen === 'exam' && (
        <ExamScreen exam={activeHealthExam} user={user} onFinish={finishExam} onHome={goHome} />
      )}
      {screen === 'results' && (
        <ResultsScreen
          exam={activeHealthExam}
          results={examResults}
          user={user}
          onRetry={retry}
          onHome={goHome}
        />
      )}
    </div>
  )
}
