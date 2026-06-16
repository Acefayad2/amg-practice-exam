import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import ExamScreen from './components/ExamScreen'
import ResultsScreen from './components/ResultsScreen'
import { healthQuestions } from './data/healthQuestions'
import { lifeQuestions } from './data/lifeQuestions'

export default function App() {
  const [screen, setScreen] = useState('home') // 'home' | 'exam' | 'results'
  const [selectedExam, setSelectedExam] = useState(null)
  const [examResults, setExamResults] = useState(null)

  const exams = {
    health: {
      id: 'health',
      title: 'Accident & Health or Sickness Producer',
      subtitle: '90 Questions · Maryland · Prometric',
      questions: healthQuestions,
      color: '#1F4E79',
    },
    life: {
      id: 'life',
      title: 'Life Producer (Life & A&H Combo)',
      subtitle: '90 Questions · Maryland · Prometric',
      questions: lifeQuestions,
      color: '#1A5276',
    },
  }

  function startExam(examId) {
    setSelectedExam(exams[examId])
    setExamResults(null)
    setScreen('exam')
  }

  function finishExam(results) {
    setExamResults(results)
    setScreen('results')
  }

  function goHome() {
    setScreen('home')
    setSelectedExam(null)
    setExamResults(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {screen === 'home' && <HomeScreen exams={exams} onStart={startExam} />}
      {screen === 'exam' && (
        <ExamScreen exam={selectedExam} onFinish={finishExam} onHome={goHome} />
      )}
      {screen === 'results' && (
        <ResultsScreen
          exam={selectedExam}
          results={examResults}
          onRetry={() => startExam(selectedExam.id)}
          onHome={goHome}
        />
      )}
    </div>
  )
}
