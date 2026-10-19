import { useEffect } from 'react'
import { routeForLocation } from './practiceRoutes'

export default function App() {
  useEffect(() => {
    const route = routeForLocation(location.pathname, location.hash)
    if (route === 'login-callback') {
      location.replace('/login/' + location.search + location.hash)
      return
    }
    location.replace(route === 'health' ? '/course/health/' : '/course/')
  }, [])

  return <main className="route-message"><p>Opening AMG Learning…</p></main>
}
