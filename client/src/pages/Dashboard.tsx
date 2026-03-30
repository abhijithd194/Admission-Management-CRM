import React from 'react';
import { trpc } from '../trpc';
import { Users, CheckCircle, Clock, AlertTriangle, FileText, DollarSign } from 'lucide-react';

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: quotaSummary, isLoading: quotaLoading } = trpc.dashboard.quotaSummary.useQuery();
  const { data: pendingDocs } = trpc.dashboard.pendingDocuments.useQuery();
  const { data: pendingFees } = trpc.dashboard.pendingFees.useQuery();

  if (statsLoading) {
    return <div className="empty-state"><p>Loading dashboard...</p></div>;
  }

  return (
    <div>
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Intake</div>
          <div className="stat-card-value">{stats?.totalIntake || 0}</div>
          <div className="stat-card-icon purple"><Users size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Confirmed</div>
          <div className="stat-card-value">{stats?.totalAdmitted || 0}</div>
          <div className="stat-card-icon green"><CheckCircle size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Locked (Pending)</div>
          <div className="stat-card-value">{stats?.totalLocked || 0}</div>
          <div className="stat-card-icon orange"><Clock size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Remaining Seats</div>
          <div className="stat-card-value">{stats?.remaining || 0}</div>
          <div className="stat-card-icon blue"><Users size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Pending Fees</div>
          <div className="stat-card-value">{stats?.pendingFees || 0}</div>
          <div className="stat-card-icon red"><DollarSign size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Pending Documents</div>
          <div className="stat-card-value">{stats?.pendingDocs || 0}</div>
          <div className="stat-card-icon orange"><FileText size={22} /></div>
        </div>
      </div>

      {/* Quota Summary */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h2 className="card-title">Quota-wise Seat Status</h2>
        </div>
        {quotaLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Type</th>
                  <th>Intake</th>
                  <th>Quota</th>
                  <th>Seats</th>
                  <th>Allocated</th>
                  <th>Confirmed</th>
                  <th>Remaining</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {quotaSummary?.map((prog: any) =>
                  prog.quotas.map((q: any, qi: number) => (
                    <tr key={`${prog.programId}-${q.quotaType}`}>
                      {qi === 0 && (
                        <>
                          <td rowSpan={prog.quotas.length} style={{ fontWeight: 600 }}>
                            {prog.programName}
                          </td>
                          <td rowSpan={prog.quotas.length}>
                            <span className="badge badge-info">{prog.courseType}</span>
                          </td>
                          <td rowSpan={prog.quotas.length} style={{ fontWeight: 700 }}>
                            {prog.totalIntake}
                          </td>
                        </>
                      )}
                      <td>
                        <span className="badge badge-neutral">{q.quotaType}</span>
                      </td>
                      <td>{q.totalSeats}</td>
                      <td>{q.allocated}</td>
                      <td>{q.confirmed}</td>
                      <td style={{ fontWeight: 600, color: q.remaining <= 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {q.remaining}
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${
                              q.totalSeats === 0 ? '' :
                              q.allocated / q.totalSeats > 0.9 ? 'red' :
                              q.allocated / q.totalSeats > 0.6 ? 'orange' : 'green'
                            }`}
                            style={{ width: `${q.totalSeats === 0 ? 0 : (q.allocated / q.totalSeats) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Pending Documents */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pending Documents</h2>
            <span className="badge badge-warning">{pendingDocs?.length || 0}</span>
          </div>
          {!pendingDocs?.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
              All documents verified ✓
            </p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Program</th>
                    <th>Pending</th>
                    <th>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {(pendingDocs as any[]).slice(0, 10).map((d: any) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 500 }}>{d.fullName}</td>
                      <td>{d.programName}</td>
                      <td><span className="badge badge-danger">{d.pendingCount}</span></td>
                      <td><span className="badge badge-success">{d.verifiedCount}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Fees */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pending Fees</h2>
            <span className="badge badge-danger">{pendingFees?.length || 0}</span>
          </div>
          {!pendingFees?.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
              All fees collected ✓
            </p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Program</th>
                    <th>Quota</th>
                    <th>Allocated</th>
                  </tr>
                </thead>
                <tbody>
                  {(pendingFees as any[]).slice(0, 10).map((f: any) => (
                    <tr key={f.allocationId}>
                      <td style={{ fontWeight: 500 }}>{f.fullName}</td>
                      <td>{f.programName}</td>
                      <td><span className="badge badge-neutral">{f.quotaType}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
                        {new Date(f.allocatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
