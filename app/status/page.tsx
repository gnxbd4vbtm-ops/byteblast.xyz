import { statusServices } from '@/lib/site';

export const metadata = {
  title: 'Status',
  description: 'ByteBlast service status page with uptime and maintenance notices.',
};

const serviceStateClass: Record<string, string> = {
  Operational: 'ok',
  'Degraded Performance': 'warn',
  'Partial Outage': 'alert',
  'Major Outage': 'danger',
  Maintenance: 'maintenance',
};

export default function StatusPage() {
  return (
    <div className="container section narrow-page">
      <p className="eyebrow">Status</p>
      <h1>Service overview</h1>

      <div className="status-top card">
        <div>
          <p className="eyebrow">Overall status</p>
          <h2>Operational</h2>
        </div>
        <div className="status-indicator ok">Operational</div>
      </div>

      <div className="status-table">
        {statusServices.map((service) => (
          <div key={service.name} className="card status-card">
            <div className="status-line">
              <h3>{service.name}</h3>
              <span className={`status-badge ${serviceStateClass[service.state] || 'ok'}`}>{service.state}</span>
            </div>
            <p>{service.detail}</p>
            <small>Uptime: not configured in monitoring backend</small>
          </div>
        ))}
      </div>

      <div className="content-grid two-col">
        <section className="card info-card">
          <h2>Recent incidents</h2>
          <p>No active incidents reported. Monitoring is not yet configured for live incident tracking.</p>
        </section>
        <section className="card info-card">
          <h2>Maintenance notices</h2>
          <p>No scheduled maintenance currently announced.</p>
        </section>
      </div>

      <p className="status-last-check">Last checked: {new Date().toISOString()}</p>
    </div>
  );
}
