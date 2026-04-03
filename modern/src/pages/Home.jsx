import './Home.css'

export default function Home() {
  return (
    <section className="page home-page">
      <h2>Welcome to SteamScout 2.0</h2>
      <p>This is a freshly rebuilt multi-page UI with lazy loading and modern UX.</p>
      <p>Use the navigation above to browse deals, run price calc, and adjust settings.</p>
      <div className="cards">
        <div className="feature-card">
          <h3>Deals List</h3>
          <p>Lazy infinite scroll, real ITAD deals, high performance.</p>
        </div>
        <div className="feature-card">
          <h3>Floating Calculator</h3>
          <p>Click a button to open a draggable calculator UI in a mini viewport.</p>
        </div>
        <div className="feature-card">
          <h3>API driven</h3>
          <p>Uses ITAD_API_KEY, RAWG_API_KEY, and STEAM_API_KEY only.</p>
        </div>
      </div>
    </section>
  )
}
