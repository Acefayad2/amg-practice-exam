export default function HomeScreen({ routes, onStartHealth }) {
  return (
    <main className="practice-home">
      <header className="practice-hero">
        <div className="practice-eyebrow">AMG Insurance Licensing</div>
        <h1>Practice Exam Center</h1>
        <p>Choose the Maryland producer track you are studying. Life course access remains protected by your AMG access code.</p>
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
            <h2 id="health-track-title">Maryland Accident &amp; Health practice exam</h2>
            <p>Work through 90 questions with immediate explanations, scoring and a complete results review.</p>
          </div>
          <dl className="track-facts">
            <div><dt>Questions</dt><dd>90</dd></div>
            <div><dt>Passing score</dt><dd>70%</dd></div>
            <div><dt>Minimum</dt><dd>63 correct</dd></div>
            <div><dt>Format</dt><dd>Untimed</dd></div>
          </dl>
          <div className="track-note"><strong>Smart Stop:</strong> If passing becomes mathematically impossible, the exam stops and opens your results.</div>
          <div className="track-actions">
            <button className="track-primary" type="button" onClick={onStartHealth}>Start Health Practice Exam →</button>
            <a className="track-secondary" href={routes.healthGuide} download>Download Health Study Guide</a>
          </div>
        </section>
      </div>

      <p className="practice-footer">AMG · Maryland Insurance Producer Licensing Prep</p>
    </main>
  )
}
