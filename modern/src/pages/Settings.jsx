import { useEffect, useState } from 'react'
import './Settings.css'

export default function Settings() {
  const [apiKeys, setApiKeys] = useState({ rawg: '', itad: '', steam: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    setApiKeys({
      rawg: import.meta.env.VITE_RAWG_API_KEY || '',
      itad: import.meta.env.VITE_ITAD_API_KEY || '',
      steam: import.meta.env.VITE_STEAM_API_KEY || '',
    })
  }, [])

  const save = () => {
    setMessage('Local .env values are read only during build. Deploy with env variables in Vercel.')
  }

  return (
    <section className="page settings-page">
      <h2>Settings</h2>
      <p>API keys are pulled from environment variables (Vercel/localhost).</p>
      <div className="settings-form">
        <label>
          RAWG_API_KEY
          <input value={apiKeys.rawg} readOnly />
        </label>
        <label>
          ITAD_API_KEY
          <input value={apiKeys.itad} readOnly />
        </label>
        <label>
          STEAM_API_KEY
          <input value={apiKeys.steam} readOnly />
        </label>
      </div>
      <button onClick={save}>Save Settings</button>
      {message && <div className="notice">{message}</div>}
    </section>
  )
}
