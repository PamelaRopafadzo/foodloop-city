export default function RiskBadge({ tier }) {
  const map = {
    safe:     'badge-safe',
    watch:    'badge-watch',
    high:     'badge-high',
    critical: 'badge-critical'
  };
  return (
    <span className={map[tier] || 'badge-safe'}>
      {tier?.charAt(0).toUpperCase() + tier?.slice(1)}
    </span>
  );
}