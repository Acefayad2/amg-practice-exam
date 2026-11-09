import { useEffect, useMemo, useRef, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import RegisterScreen from './components/RegisterScreen'
import ExamScreen from './components/ExamScreen'
import ResultsScreen from './components/ResultsScreen'
import { healthQuestions } from './data/healthQuestions'
import { healthQuestionsForAttempt } from './healthQuestionRotation'
import { practiceRoutesFor, routeForLocation } from './practiceRoutes'

import { submitPracticeResult } from './practiceReporting'

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
  const reportPayload = useRef(null)
  const reportInFlight = useRef(false)
  const [reportStatus, setReportStatus] = useState('idle')
  const attemptId = useRef(null)

  useEffect(() => {
    if (initialRoute === 'login-callback') {
      location.replace(routes.login + location.search + location.hash)
      return undefined
    }

    const handlePopState = () => {
      if (reportStatus === 'saving' || (reportStatus === 'failed' && !confirm('This result has not been saved to AMG. Leave it without saving?'))) {
        history.pushState(null, '', routes.health)
        return
      }
      setReportStatus('idle')
      const route = routeForLocation(location.pathname, location.hash)
      setScreen(route === 'health' ? 'register' : 'home')
      setExamResults(null)
      setUser(null)
      setActiveHealthExam(null)
    }
    addEventListener('popstate', handlePopState)
    return () => removeEventListener('popstate', handlePopState)
  }, [initialRoute, routes.login, routes.health, reportStatus])

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
    attemptId.current = crypto.randomUUID()
    reportPayload.current = null
    setReportStatus('idle')
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
    reportPayload.current = {
      attemptId: attemptId.current,
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
    }
    saveResult()
  }

  async function saveResult() {
    if (!reportPayload.current || reportInFlight.current) return
    reportInFlight.current = true
    setReportStatus('saving')
    try {
      await submitPracticeResult(reportPayload.current)
      setReportStatus('saved')
    } catch {
      setReportStatus('failed')
    } finally {
      reportInFlight.current = false
    }
  }

  useEffect(() => {
    if (reportStatus !== 'saving' && reportStatus !== 'failed') return undefined
    const preventLoss = event => { event.preventDefault(); event.returnValue = '' }
    addEventListener('beforeunload', preventLoss)
    return () => removeEventListener('beforeunload', preventLoss)
  }, [reportStatus])

  function canLeaveResult() {
    if (reportStatus === 'saving') return false
    return reportStatus !== 'failed' || confirm('This result has not been saved to AMG. Leave it without saving?')
  }

  function goHome() {
    if (!canLeaveResult()) return
    setReportStatus('idle')
    if (location.pathname !== routes.home) {
      history.pushState(null, '', routes.home)
    }
    setScreen('home')
    setExamResults(null)
    setUser(null)
    setActiveHealthExam(null)
  }

  function retry() {
    if (!canLeaveResult()) return
    setReportStatus('idle')
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
          reportStatus={reportStatus}
          onSaveResult={saveResult}
          onRetry={retry}
          onHome={goHome}
        />
      )}
    </div>
  )
}
