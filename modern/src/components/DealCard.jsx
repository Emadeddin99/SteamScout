export default function DealCard({ deal }) {
  return (
    <article className="deal-card">
      <div className="deal-header">
        <strong>{deal.title || 'Unknown'}</strong>
        <span>{deal.source?.toUpperCase() || 'ITAD'}</span>
      </div>
      <p>Steam AppID: {deal.steamAppID || 'N/A'}</p>
      <p>
        Price: <strong>${deal.salePrice?.toFixed(2) || '0.00'}</strong> / {deal.normalPrice?.toFixed(2) || '0.00'}
      </p>
      <p>Discount: {deal.discount || 0}%</p>
      <p>Store: {deal.store || 'Steam'}</p>
      <a href={deal.url || '#'} target="_blank" rel="noreferrer" className="button">
        View Deal
      </a>
    </article>
  )
}
