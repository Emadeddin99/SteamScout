import { useCallback, useEffect, useMemo, useState } from 'react'
import DealCard from '../components/DealCard'
import './Deals.css'

const PAGE_SIZE = 20

export default function Deals() {
  const [deals, setDeals] = useState([])
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)

  const loadPage = useCallback(async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/deals?offset=${page * PAGE_SIZE}&limit=${PAGE_SIZE}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to fetch deals')

      const incoming = body.deals || []
      setDeals((prev) => [...prev, ...incoming])
      setHasMore(incoming.length === PAGE_SIZE)
      setPage((prev) => prev + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [page, isLoading, hasMore])

  const handleScroll = useCallback(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    if (scrollHeight - scrollTop < clientHeight + 220 && !isLoading && hasMore) {
      loadPage()
    }
  }, [isLoading, hasMore, loadPage])

  useEffect(() => {
    loadPage()
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const summary = useMemo(() => {
    if (!deals.length) return 'No deals loaded yet.'
    return `Showing ${deals.length} deals`}
 , [deals.length])

  return (
    <section className="page deals-page">
      <h2>Deals (lazy infinite scroll)</h2>
      <p>{summary}</p>

      {error && <div className="callout error">Error: {error}</div>}

      <div className="deal-grid">
        {deals.map((item) => (
          <DealCard key={`${item.title}-${item.steamAppID}-${item.url}`} deal={item} />
        ))}
      </div>

      {isLoading && <div className="loading">Loading more deals...</div>}
      {!hasMore && <div className="loading">All deals loaded.</div>}
    </section>
  )
}
