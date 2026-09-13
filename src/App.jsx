import { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    const callback = /(?:access_token|confirmation_token|recovery_token|invite_token|email_change_token)=/.test(location.hash);
    location.replace(callback ? '/login/' + location.search + location.hash : '/course/');
  }, []);
  return <main style={{padding:32,fontFamily:'system-ui,sans-serif'}}><p>Opening AMG Learning…</p><a href="/course/">Continue to your course</a></main>;
}
