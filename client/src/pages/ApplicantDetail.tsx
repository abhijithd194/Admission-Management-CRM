import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../trpc';
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'badge-danger',
  Submitted: 'badge-warning',
  Verified: 'badge-success',
};

export function ApplicantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.applicants.getById.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  const updateDocMut = trpc.applicants.updateDocument.useMutation({
    onSuccess: () => utils.applicants.getById.invalidate(),
  });

  if (isLoading || !data) {
    return <div className="empty-state"><p>Loading applicant details...</p></div>;
  }

  const handleDocStatus = (docName: string, status: string) => {
    updateDocMut.mutate({
      applicantId: Number(id),
      documentName: docName,
      status: status as any,
    });
  };

  return (
    <div>
      <button
        className="btn btn-secondary"
        onClick={() => navigate('/applicants')}
        style={{ marginBottom: 'var(--space-6)' }}
      >
        <ArrowLeft size={16} /> Back to Applicants
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--text-heading)', marginBottom: 'var(--space-1)' }}>
              {data.fullName}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>{data.email} · {data.phone}</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span className="badge badge-info">{data.programCode}</span>
            <span className="badge badge-neutral">{data.quotaType}</span>
            <span className="badge badge-neutral">{data.category}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Details */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Personal Details</h3>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {[
              ['Date of Birth', data.dateOfBirth],
              ['Gender', data.gender],
              ['Category', data.category],
              ['Entry Type', data.entryType],
              ['Program', data.programName],
              ['Qualifying Exam', data.qualifyingExam],
              ['Marks / Rank', data.marksOrRank],
              ['Allotment No.', data.allotmentNumber || '—'],
              ['Address', data.address || '—'],
              ['Guardian', data.guardianName || '—'],
              ['Guardian Phone', data.guardianPhone || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>{label}</span>
                <span style={{ fontWeight: 500, fontSize: 'var(--fs-sm)' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Allocation Status */}
          {data.allocation && (
            <div style={{ marginTop: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Allocation Status
              </h4>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <span className={`badge ${(data.allocation as any).status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                  {(data.allocation as any).status}
                </span>
                <span className={`badge ${(data.allocation as any).feeStatus === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                  Fee: {(data.allocation as any).feeStatus}
                </span>
                {(data.allocation as any).admissionNumber && (
                  <span className="badge badge-info">
                    {(data.allocation as any).admissionNumber}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Document Checklist</h3>
          <div>
            {(data.documents as any[]).map((doc: any) => (
              <div key={doc.id} className="doc-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  {doc.status === 'Verified' ? (
                    <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                  ) : doc.status === 'Submitted' ? (
                    <Clock size={18} style={{ color: 'var(--warning)' }} />
                  ) : (
                    <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
                  )}
                  <span className="doc-name">{doc.documentName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className={`badge ${STATUS_COLORS[doc.status]}`}>{doc.status}</span>
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--fs-xs)' }}
                    value={doc.status}
                    onChange={(e) => handleDocStatus(doc.documentName, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Verified">Verified</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
