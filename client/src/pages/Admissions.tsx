import React, { useState } from 'react';
import { trpc } from '../trpc';
import { CheckCircle, DollarSign, AlertTriangle } from 'lucide-react';

export function Admissions() {
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const utils = trpc.useUtils();
  const { data: admissions = [], isLoading } = trpc.admission.list.useQuery();

  const feeMut = trpc.admission.updateFee.useMutation({
    onSuccess: () => {
      utils.admission.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (err) => setMessage({ type: 'error', text: err.message }),
  });

  const confirmMut = trpc.admission.confirm.useMutation({
    onSuccess: (data) => {
      setMessage({ type: 'success', text: `Admission confirmed! Number: ${data.admissionNumber}` });
      utils.admission.list.invalidate();
      utils.allocation.list.invalidate();
      utils.dashboard.stats.invalidate();
      utils.dashboard.quotaSummary.invalidate();
    },
    onError: (err) => setMessage({ type: 'error', text: err.message }),
  });

  const handleFeeToggle = (allocationId: number, currentStatus: string) => {
    feeMut.mutate({
      allocationId,
      feeStatus: currentStatus === 'Pending' ? 'Paid' : 'Pending',
    });
  };

  const handleConfirm = (allocationId: number) => {
    confirmMut.mutate({ allocationId });
  };

  if (isLoading) {
    return <div className="empty-state"><p>Loading admissions...</p></div>;
  }

  const pending = (admissions as any[]).filter((a: any) => a.status === 'Locked');
  const confirmed = (admissions as any[]).filter((a: any) => a.status === 'Confirmed');

  return (
    <div>
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
          <button
            onClick={() => setMessage(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 'var(--fs-lg)' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Pending Confirmation */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h2 className="card-title">Pending Confirmation</h2>
          <span className="badge badge-warning">{pending.length}</span>
        </div>
        {pending.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
            No pending admissions
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Program</th>
                  <th>Quota</th>
                  <th>Mode</th>
                  <th>Fee Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((al: any) => (
                  <tr key={al.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{al.applicantName}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{al.applicantEmail}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{al.programCode}</span>
                    </td>
                    <td><span className="badge badge-neutral">{al.quotaType}</span></td>
                    <td>{al.admissionMode}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${al.feeStatus === 'Paid' ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => handleFeeToggle(al.id, al.feeStatus)}
                        disabled={feeMut.isPending}
                      >
                        <DollarSign size={14} />
                        {al.feeStatus}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleConfirm(al.id)}
                        disabled={al.feeStatus !== 'Paid' || confirmMut.isPending}
                        title={al.feeStatus !== 'Paid' ? 'Fee must be paid first' : 'Confirm admission'}
                      >
                        <CheckCircle size={14} /> Confirm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmed Admissions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Confirmed Admissions</h2>
          <span className="badge badge-success">{confirmed.length}</span>
        </div>
        {confirmed.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
            No confirmed admissions yet
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Admission Number</th>
                  <th>Applicant</th>
                  <th>Program</th>
                  <th>Quota</th>
                  <th>Mode</th>
                  <th>Confirmed At</th>
                </tr>
              </thead>
              <tbody>
                {confirmed.map((al: any) => (
                  <tr key={al.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)', fontSize: 'var(--fs-sm)' }}>
                        {al.admissionNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{al.applicantName}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{al.applicantEmail}</div>
                    </td>
                    <td><span className="badge badge-info">{al.programCode}</span></td>
                    <td><span className="badge badge-neutral">{al.quotaType}</span></td>
                    <td>{al.admissionMode}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                      {al.confirmedAt ? new Date(al.confirmedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
