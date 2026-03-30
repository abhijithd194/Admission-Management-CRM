import React, { useState } from 'react';
import { trpc } from '../trpc';
import { Save } from 'lucide-react';

export function Quotas() {
  const { data: programs = [] } = trpc.masters.listPrograms.useQuery();
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);

  const programId = selectedProgramId || (programs as any[])[0]?.id;

  const { data: quotaData, isLoading } = trpc.quotas.getByProgram.useQuery(
    { programId: programId! },
    { enabled: !!programId }
  );

  const utils = trpc.useUtils();
  const upsertMut = trpc.quotas.upsert.useMutation({
    onSuccess: () => {
      utils.quotas.getByProgram.invalidate();
      setError('');
    },
    onError: (err) => setError(err.message),
  });

  const [kcet, setKcet] = useState(0);
  const [comedk, setComedk] = useState(0);
  const [mgmt, setMgmt] = useState(0);
  const [superNum, setSuperNum] = useState(0);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (quotaData?.quotas) {
      const q = quotaData.quotas;
      setKcet((q.find((x: any) => x.quotaType === 'KCET') as any)?.seats || 0);
      setComedk((q.find((x: any) => x.quotaType === 'COMEDK') as any)?.seats || 0);
      setMgmt((q.find((x: any) => x.quotaType === 'Management') as any)?.seats || 0);
      setSuperNum(q[0]?.supernumerarySeats || 0);
    }
  }, [quotaData]);

  const totalQuota = kcet + comedk + mgmt;
  const totalIntake = quotaData?.program?.totalIntake || 0;
  const isValid = totalQuota === totalIntake;

  const handleSave = () => {
    if (!programId) return;
    if (!isValid) {
      setError(`Total quota (${totalQuota}) must equal intake (${totalIntake})`);
      return;
    }
    upsertMut.mutate({
      programId,
      quotas: [
        { quotaType: 'KCET', seats: kcet },
        { quotaType: 'COMEDK', seats: comedk },
        { quotaType: 'Management', seats: mgmt },
      ],
      supernumerarySeats: superNum,
    });
  };

  return (
    <div>
      {/* Program Selector */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Program</label>
          <select
            className="form-select"
            value={programId || ''}
            onChange={(e) => setSelectedProgramId(Number(e.target.value))}
          >
            {(programs as any[]).map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code}) — {p.courseType} — Intake: {p.totalIntake}
              </option>
            ))}
          </select>
        </div>
      </div>

      {programId && !isLoading && quotaData && (
        <>
          {/* Seat Counter Cards */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card-label">Total Intake</div>
              <div className="stat-card-value">{totalIntake}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Total Quota Assigned</div>
              <div className="stat-card-value" style={{ color: isValid ? 'var(--success)' : 'var(--danger)' }}>
                {totalQuota}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Difference</div>
              <div className="stat-card-value" style={{ color: totalIntake - totalQuota === 0 ? 'var(--success)' : 'var(--danger)' }}>
                {totalIntake - totalQuota}
              </div>
            </div>
          </div>

          {/* Quota Editor */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Configure Quotas</h2>
              <button className="btn btn-primary" onClick={handleSave} disabled={upsertMut.isPending}>
                <Save size={16} /> Save Quotas
              </button>
            </div>

            {error && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--fs-sm)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {/* KCET */}
              <div className="quota-card">
                <div className="quota-header">
                  <span className="quota-label">KCET Quota</span>
                  <span className="quota-count">
                    Allocated: <strong>{quotaData.quotas.find((q: any) => q.quotaType === 'KCET')?.allocated || 0}</strong>
                    {' / '}Remaining: <strong>{(quotaData.quotas.find((q: any) => q.quotaType === 'KCET')?.remaining ?? kcet)}</strong>
                  </span>
                </div>
                <input type="number" className="form-input" value={kcet} onChange={(e) => setKcet(Number(e.target.value))} min={0} />
                <div className="progress-bar" style={{ marginTop: 'var(--space-2)' }}>
                  <div className="progress-fill green" style={{ width: `${kcet === 0 ? 0 : ((quotaData.quotas.find((q: any) => q.quotaType === 'KCET')?.allocated || 0) / kcet) * 100}%` }} />
                </div>
              </div>

              {/* COMEDK */}
              <div className="quota-card">
                <div className="quota-header">
                  <span className="quota-label">COMEDK Quota</span>
                  <span className="quota-count">
                    Allocated: <strong>{quotaData.quotas.find((q: any) => q.quotaType === 'COMEDK')?.allocated || 0}</strong>
                    {' / '}Remaining: <strong>{(quotaData.quotas.find((q: any) => q.quotaType === 'COMEDK')?.remaining ?? comedk)}</strong>
                  </span>
                </div>
                <input type="number" className="form-input" value={comedk} onChange={(e) => setComedk(Number(e.target.value))} min={0} />
                <div className="progress-bar" style={{ marginTop: 'var(--space-2)' }}>
                  <div className="progress-fill" style={{ width: `${comedk === 0 ? 0 : ((quotaData.quotas.find((q: any) => q.quotaType === 'COMEDK')?.allocated || 0) / comedk) * 100}%` }} />
                </div>
              </div>

              {/* Management */}
              <div className="quota-card">
                <div className="quota-header">
                  <span className="quota-label">Management Quota</span>
                  <span className="quota-count">
                    Allocated: <strong>{quotaData.quotas.find((q: any) => q.quotaType === 'Management')?.allocated || 0}</strong>
                    {' / '}Remaining: <strong>{(quotaData.quotas.find((q: any) => q.quotaType === 'Management')?.remaining ?? mgmt)}</strong>
                  </span>
                </div>
                <input type="number" className="form-input" value={mgmt} onChange={(e) => setMgmt(Number(e.target.value))} min={0} />
                <div className="progress-bar" style={{ marginTop: 'var(--space-2)' }}>
                  <div className="progress-fill orange" style={{ width: `${mgmt === 0 ? 0 : ((quotaData.quotas.find((q: any) => q.quotaType === 'Management')?.allocated || 0) / mgmt) * 100}%` }} />
                </div>
              </div>

              {/* Supernumerary */}
              <div className="quota-card">
                <div className="quota-header">
                  <span className="quota-label">Supernumerary Seats (Optional)</span>
                  <span className="quota-count" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    Extra seats beyond quota
                  </span>
                </div>
                <input type="number" className="form-input" value={superNum} onChange={(e) => setSuperNum(Number(e.target.value))} min={0} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
