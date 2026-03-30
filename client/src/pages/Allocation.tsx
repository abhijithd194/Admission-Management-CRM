import React, { useState } from 'react';
import { trpc } from '../trpc';
import { Search, CheckCircle, AlertTriangle } from 'lucide-react';

export function Allocation() {
  const [tab, setTab] = useState<'government' | 'management'>('government');
  const [search, setSearch] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const utils = trpc.useUtils();
  const { data: applicants = [] } = trpc.applicants.list.useQuery(
    { search: search || undefined },
    { enabled: !!search }
  );
  const { data: allocations = [] } = trpc.allocation.list.useQuery();

  const allocateMut = trpc.allocation.allocate.useMutation({
    onSuccess: (data) => {
      setMessage({ type: 'success', text: `Seat allocated! ${data.remaining} seats remaining in this quota.` });
      setSelectedApplicant(null);
      utils.allocation.list.invalidate();
      utils.applicants.list.invalidate();
      utils.quotas.getByProgram.invalidate();
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err.message });
    },
  });

  const handleAllocate = () => {
    if (!selectedApplicant) return;
    allocateMut.mutate({
      applicantId: selectedApplicant.id,
      programId: selectedApplicant.programId,
      quotaType: selectedApplicant.quotaType,
      admissionMode: tab === 'government' ? 'Government' : 'Management',
      allotmentNumber: selectedApplicant.allotmentNumber || '',
    });
  };

  // Filter applicants without existing allocations
  const allocatedIds = new Set((allocations as any[]).filter((a: any) => a.status !== 'Cancelled').map((a: any) => a.applicantId));
  const availableApplicants = (applicants as any[]).filter(
    (a: any) =>
      !allocatedIds.has(a.id) &&
      (tab === 'government' ? a.quotaType !== 'Management' : a.quotaType === 'Management')
  );

  return (
    <div>
      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'government' ? 'active' : ''}`} onClick={() => { setTab('government'); setSelectedApplicant(null); setMessage(null); }}>
          Government Flow (KCET/COMEDK)
        </button>
        <button className={`tab ${tab === 'management' ? 'active' : ''}`} onClick={() => { setTab('management'); setSelectedApplicant(null); setMessage(null); }}>
          Management Flow
        </button>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          background: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
          fontSize: 'var(--fs-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Applicant Selection */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            Select Applicant
          </h3>
          <div className="search-input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
            <Search />
            <input
              className="search-input"
              placeholder="Search applicants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {availableApplicants.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', textAlign: 'center', padding: 'var(--space-4)' }}>
                No unallocated applicants found
              </p>
            ) : (
              availableApplicants.map((a: any) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedApplicant(a)}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selectedApplicant?.id === a.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                    borderLeft: selectedApplicant?.id === a.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: 'var(--fs-base)' }}>{a.fullName}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{a.programCode}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{a.quotaType}</span>
                    {a.allotmentNumber && <span style={{ color: 'var(--text-secondary)' }}>#{a.allotmentNumber}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Allocation Panel */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            Allocation Details
          </h3>
          {selectedApplicant ? (
            <div>
              <div style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                {[
                  ['Applicant', selectedApplicant.fullName],
                  ['Program', `${selectedApplicant.programName || selectedApplicant.programCode}`],
                  ['Quota', selectedApplicant.quotaType],
                  ['Category', selectedApplicant.category],
                  ['Mode', tab === 'government' ? 'Government' : 'Management'],
                  ['Allotment No.', selectedApplicant.allotmentNumber || 'N/A'],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{value}</span>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleAllocate}
                disabled={allocateMut.isPending}
              >
                {allocateMut.isPending ? 'Allocating...' : 'Allocate Seat'}
              </button>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-8)' }}>
              Select an applicant to allocate a seat
            </p>
          )}
        </div>
      </div>

      {/* Allocation History */}
      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 className="card-title">Allocation History</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Program</th>
                <th>Quota</th>
                <th>Mode</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Admission #</th>
              </tr>
            </thead>
            <tbody>
              {(allocations as any[]).map((al: any) => (
                <tr key={al.id}>
                  <td style={{ fontWeight: 500 }}>{al.applicantName}</td>
                  <td><span className="badge badge-info">{al.programCode}</span></td>
                  <td><span className="badge badge-neutral">{al.quotaType}</span></td>
                  <td>{al.admissionMode}</td>
                  <td>
                    <span className={`badge ${al.feeStatus === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                      {al.feeStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${al.status === 'Confirmed' ? 'badge-success' : al.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                      {al.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)' }}>
                    {al.admissionNumber || '—'}
                  </td>
                </tr>
              ))}
              {(allocations as any[]).length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No allocations yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
