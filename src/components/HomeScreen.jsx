export default function HomeScreen({ routes, onStartHealth }) {
  return (
    <main className="practice-home">
      <header className="practice-hero">
        <div className="practice-eyebrow">AMG Insurance Licensing</div>
        <h1>Practice Exam Center</h1>
        <p>Choose the Maryland producer track you are studying. Course access remains protected by your AMG access code.</p>
      </header>

      <div className="practice-tracks">
        <section className="practice-track" aria-labelledby="life-track-title">
          <div>
            <span className="track-label">Life Producer</span>
            <h2 id="life-track-title">Life course and Practice Test</h2>
            <p>Continue the 60-part course or start one Practice Test with questions that rotate between attempts.</p>
          </div>
          <div className="track-actions">
            <a className="track-primary" href={routes.lifeCourse}>Enter Life Course →</a>
            <a className="track-secondary" href={routes.lifeExams}>Open Life Practice Test</a>
            <a className="track-link" href={routes.lifeGuide} download>Download Life Study Guide</a>
          </div>
        </section>

        <section className="practice-track health-track" aria-labelledby="health-track-title">
          <div>
            <span className="track-label">Accident &amp; Health</span>
            <h2 id="health-track-title">Health course and mock exams</h2>
            <p>Study the 60 lessons, choose a timed mock exam, or use the untimed practice test for feedback as you go.</p>
          </div>
          <div className="track-actions">
            <a className="track-primary" href={routes.healthCourse}>Enter Health Course →</a>
            <a className="track-secondary" href={routes.healthExams}>Open Health mock exams</a>
            <button className="track-link" type="button" onClick={onStartHealth}>Start untimed Health practice</button>
            <a className="track-link" href={routes.healthGuide} download>Download Health Study Guide</a>
          </div>
        </section>
      </div>

      <p className="practice-footer">AMG · Maryland Insurance Producer Licensing Prep</p>
    </main>
  )
}
