import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '../trpc';
import { Modal } from '../components/Modal';
import { Plus, Search, Eye } from 'lucide-react';
import { applicantSchema } from '../../../shared/schemas';
import { useNavigate } from 'react-router-dom';
import type { z } from 'zod';

type ApplicantForm = z.infer<typeof applicantSchema>;

export function Applicants() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const utils = trpc.useUtils();
  const { data: programs = [] } = trpc.masters.listPrograms.useQuery();

  const { data: applicants = [], isLoading } = trpc.applicants.list.useQuery(
    { search: search || undefined },
    { enabled: !!search }
  );

  const createMut = trpc.applicants.create.useMutation({
    onSuccess: () => {
      utils.applicants.list.invalidate();
      setModal(false);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicantForm>({
    resolver: zodResolver(applicantSchema.omit({ id: true })),
    defaultValues: {
      gender: 'Male',
      category: 'GM',
      entryType: 'Regular',
      quotaType: 'KCET',
    },
  });

  const openCreate = () => {
    reset({
      fullName: '',
      dateOfBirth: '',
      gender: 'Male',
      email: '',
      phone: '',
      category: 'GM',
      programId: (programs as any[])[0]?.id || 0,
      entryType: 'Regular',
      quotaType: 'KCET',
      qualifyingExam: '',
      marksOrRank: '',
      allotmentNumber: '',
      address: '',
      guardianName: '',
      guardianPhone: '',
    });
    setModal(true);
  };

  const onSubmit = (data: ApplicantForm) => {
    createMut.mutate({
      ...data,
      programId: Number(data.programId),
    });
  };

  return (
    <div>
      {/* Search & Actions */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            className="search-input"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> New Applicant
        </button>
      </div>

      {/* Applicant List */}
      <div className="card">
        {isLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Program</th>
                  <th>Category</th>
                  <th>Quota</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(applicants as any[]).map((a: any) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.fullName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.email}</td>
                    <td>{a.phone}</td>
                    <td>
                      <span className="badge badge-info">{a.programCode}</span>
                    </td>
                    <td><span className="badge badge-neutral">{a.category}</span></td>
                    <td><span className="badge badge-neutral">{a.quotaType}</span></td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/applicants/${a.id}`)}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {(applicants as any[]).length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No applicants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        title="New Applicant"
        isOpen={modal}
        onClose={() => setModal(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit(onSubmit)} disabled={createMut.isPending}>
              {createMut.isPending ? 'Creating...' : 'Create Applicant'}
            </button>
          </>
        }
      >
        {createMut.isError && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--fs-sm)' }}>
            {createMut.error.message}
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input {...register('fullName')} className="form-input" placeholder="Full name" />
            {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth *</label>
            <input {...register('dateOfBirth')} type="date" className="form-input" />
            {errors.dateOfBirth && <p className="form-error">{errors.dateOfBirth.message}</p>}
          </div>
        </div>
        <div className="form-row-3">
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select {...register('gender')} className="form-select">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input {...register('email')} className="form-input" placeholder="Email" />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input {...register('phone')} className="form-input" placeholder="Phone" />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>
        </div>
        <div className="form-row-3">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select {...register('category')} className="form-select">
              <option value="GM">GM</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="OBC">OBC</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Entry Type</label>
            <select {...register('entryType')} className="form-select">
              <option value="Regular">Regular</option>
              <option value="Lateral">Lateral</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quota Type</label>
            <select {...register('quotaType')} className="form-select">
              <option value="KCET">KCET</option>
              <option value="COMEDK">COMEDK</option>
              <option value="Management">Management</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Program *</label>
          <select {...register('programId', { valueAsNumber: true })} className="form-select">
            {(programs as any[]).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Qualifying Exam *</label>
            <input {...register('qualifyingExam')} className="form-input" placeholder="e.g., KCET 2026" />
            {errors.qualifyingExam && <p className="form-error">{errors.qualifyingExam.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Marks / Rank *</label>
            <input {...register('marksOrRank')} className="form-input" placeholder="e.g., Rank 1500" />
            {errors.marksOrRank && <p className="form-error">{errors.marksOrRank.message}</p>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Allotment Number</label>
          <input {...register('allotmentNumber')} className="form-input" placeholder="Government allotment number (if applicable)" />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <input {...register('address')} className="form-input" placeholder="Address" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Guardian Name</label>
            <input {...register('guardianName')} className="form-input" placeholder="Guardian name" />
          </div>
          <div className="form-group">
            <label className="form-label">Guardian Phone</label>
            <input {...register('guardianPhone')} className="form-input" placeholder="Guardian phone" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
