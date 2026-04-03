import { NavLink, Outlet } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>SteamScout 2.0</h1>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Home
          </NavLink>
          <NavLink to="/deals" className={({ isActive }) => (isActive ? 'active' : '')}>
            Deals
          </NavLink>
          <NavLink to="/calc" className={({ isActive }) => (isActive ? 'active' : '')}>
            Calculator
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
            Settings
          </NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <small>Powered by RAWG, ITAD, Steam APIs</small>
      </footer>
    </div>
  )
}

export default App
