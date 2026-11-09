// Same-origin only: a build-time URL must never route exam data to another team.
export async function submitPracticeResult(payload, fetchImpl = fetch) {
  const response = await fetchImpl('/api/practice-results', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error('AMG could not save this result.')
  const result = await response.json()
  if (result.ok !== true) throw new Error('AMG did not confirm this result was saved.')
  return result
}
