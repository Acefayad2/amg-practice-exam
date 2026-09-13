import { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    location.replace('/course/');
  }, []);
  return <main style={{padding:32,fontFamily:'system-ui,sans-serif'}}><p>Opening AMG Learning…</p><a href="/course/">Continue to your course</a></main>;
}
