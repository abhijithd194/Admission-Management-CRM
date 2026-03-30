import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '../trpc';
import { Modal } from '../components/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {
  institutionSchema,
  campusSchema,
  departmentSchema,
  programSchema,
  academicYearSchema,
} from '../../../shared/schemas';
import type { z } from 'zod';

const TABS = ['Institutions', 'Campuses', 'Departments', 'Programs', 'Academic Years'] as const;
type Tab = (typeof TABS)[number];

export function Masters() {
  const [activeTab, setActiveTab] = useState<Tab>('Institutions');

  return (
    <div>
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Institutions' && <InstitutionSection />}
      {activeTab === 'Campuses' && <CampusSection />}
      {activeTab === 'Departments' && <DepartmentSection />}
      {activeTab === 'Programs' && <ProgramSection />}
      {activeTab === 'Academic Years' && <AcademicYearSection />}
    </div>
  );
}

// ─── Institution ───
function InstitutionSection() {
  const [modal, setModal] = useState<{ open: boolean; editing?: any }>({ open: false });
  const utils = trpc.useUtils();
  const { data = [], isLoading } = trpc.masters.listInstitutions.useQuery();
  const createMut = trpc.masters.createInstitution.useMutation({ onSuccess: () => { utils.masters.listInstitutions.invalidate(); setModal({ open: false }); } });
  const updateMut = trpc.masters.updateInstitution.useMutation({ onSuccess: () => { utils.masters.listInstitutions.invalidate(); setModal({ open: false }); } });
  const deleteMut = trpc.masters.deleteInstitution.useMutation({ onSuccess: () => utils.masters.listInstitutions.invalidate() });

  type Form = z.infer<typeof institutionSchema>;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(institutionSchema.omit({ id: true })) });

  const openCreate = () => { reset({ name: '', code: '' }); setModal({ open: true }); };
  const openEdit = (item: any) => { reset({ name: item.name, code: item.code }); setModal({ open: true, editing: item }); };

  const onSubmit = (data: Form) => {
    if (modal.editing) updateMut.mutate({ ...data, id: modal.editing.id });
    else createMut.mutate(data);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Institutions</h2>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> Add</button>
      </div>
      {isLoading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Code</th><th>Actions</th></tr></thead>
            <tbody>
              {(data as any[]).map((i: any) => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 500 }}>{i.name}</td>
                  <td><span className="badge badge-info">{i.code}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-icon" onClick={() => openEdit(i)}><Edit2 size={15} /></button>
                      <button className="btn-icon" onClick={() => { if (confirm('Delete?')) deleteMut.mutate({ id: i.id }); }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data as any[]).length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No institutions yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal title={modal.editing ? 'Edit Institution' : 'Add Institution'} isOpen={modal.open} onClose={() => setModal({ open: false })}
        footer={<><button className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit(onSubmit)}>Save</button></>}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input {...register('name')} className="form-input" placeholder="Institution name" />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Code</label>
          <input {...register('code')} className="form-input" placeholder="e.g., DEC" />
          {errors.code && <p className="form-error">{errors.code.message}</p>}
        </div>
      </Modal>
    </div>
  );
}

// ─── Campus ───
function CampusSection() {
  const [modal, setModal] = useState<{ open: boolean; editing?: any }>({ open: false });
  const utils = trpc.useUtils();
  const { data: institutions = [] } = trpc.masters.listInstitutions.useQuery();
  const { data = [], isLoading } = trpc.masters.listCampuses.useQuery();
  const createMut = trpc.masters.createCampus.useMutation({ onSuccess: () => { utils.masters.listCampuses.invalidate(); setModal({ open: false }); } });
  const updateMut = trpc.masters.updateCampus.useMutation({ onSuccess: () => { utils.masters.listCampuses.invalidate(); setModal({ open: false }); } });
  const deleteMut = trpc.masters.deleteCampus.useMutation({ onSuccess: () => utils.masters.listCampuses.invalidate() });

  type Form = z.infer<typeof campusSchema>;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(campusSchema.omit({ id: true })) });

  const openCreate = () => { reset({ name: '', institutionId: (institutions as any[])[0]?.id || 0 }); setModal({ open: true }); };
  const openEdit = (item: any) => { reset({ name: item.name, institutionId: item.institutionId }); setModal({ open: true, editing: item }); };

  const onSubmit = (data: Form) => {
    const payload = { ...data, institutionId: Number(data.institutionId) };
    if (modal.editing) updateMut.mutate({ ...payload, id: modal.editing.id });
    else createMut.mutate(payload);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Campuses</h2>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> Add</button>
      </div>
      {isLoading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Institution</th><th>Actions</th></tr></thead>
            <tbody>
              {(data as any[]).map((c: any) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.institutionName}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-icon" onClick={() => openEdit(c)}><Edit2 size={15} /></button>
                      <button className="btn-icon" onClick={() => { if (confirm('Delete?')) deleteMut.mutate({ id: c.id }); }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data as any[]).length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No campuses yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal title={modal.editing ? 'Edit Campus' : 'Add Campus'} isOpen={modal.open} onClose={() => setModal({ open: false })}
        footer={<><button className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit(onSubmit)}>Save</button></>}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input {...register('name')} className="form-input" placeholder="Campus name" />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Institution</label>
          <select {...register('institutionId', { valueAsNumber: true })} className="form-select">
            {(institutions as any[]).map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}

// ─── Department ───
function DepartmentSection() {
  const [modal, setModal] = useState<{ open: boolean; editing?: any }>({ open: false });
  const utils = trpc.useUtils();
  const { data: campuses = [] } = trpc.masters.listCampuses.useQuery();
  const { data = [], isLoading } = trpc.masters.listDepartments.useQuery();
  const createMut = trpc.masters.createDepartment.useMutation({ onSuccess: () => { utils.masters.listDepartments.invalidate(); setModal({ open: false }); } });
  const updateMut = trpc.masters.updateDepartment.useMutation({ onSuccess: () => { utils.masters.listDepartments.invalidate(); setModal({ open: false }); } });
  const deleteMut = trpc.masters.deleteDepartment.useMutation({ onSuccess: () => utils.masters.listDepartments.invalidate() });

  type Form = z.infer<typeof departmentSchema>;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(departmentSchema.omit({ id: true })) });

  const openCreate = () => { reset({ name: '', campusId: (campuses as any[])[0]?.id || 0 }); setModal({ open: true }); };
  const openEdit = (item: any) => { reset({ name: item.name, campusId: item.campusId }); setModal({ open: true, editing: item }); };

  const onSubmit = (data: Form) => {
    const payload = { ...data, campusId: Number(data.campusId) };
    if (modal.editing) updateMut.mutate({ ...payload, id: modal.editing.id });
    else createMut.mutate(payload);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Departments</h2>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> Add</button>
      </div>
      {isLoading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Campus</th><th>Actions</th></tr></thead>
            <tbody>
              {(data as any[]).map((d: any) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>{d.name}</td>
                  <td>{d.campusName}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-icon" onClick={() => openEdit(d)}><Edit2 size={15} /></button>
                      <button className="btn-icon" onClick={() => { if (confirm('Delete?')) deleteMut.mutate({ id: d.id }); }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data as any[]).length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No departments yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal title={modal.editing ? 'Edit Department' : 'Add Department'} isOpen={modal.open} onClose={() => setModal({ open: false })}
        footer={<><button className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit(onSubmit)}>Save</button></>}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input {...register('name')} className="form-input" placeholder="Department name" />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Campus</label>
          <select {...register('campusId', { valueAsNumber: true })} className="form-select">
            {(campuses as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}

// ─── Program ───
function ProgramSection() {
  const [modal, setModal] = useState<{ open: boolean; editing?: any }>({ open: false });
  const utils = trpc.useUtils();
  const { data: departments = [] } = trpc.masters.listDepartments.useQuery();
  const { data = [], isLoading } = trpc.masters.listPrograms.useQuery();
  const createMut = trpc.masters.createProgram.useMutation({ onSuccess: () => { utils.masters.listPrograms.invalidate(); setModal({ open: false }); } });
  const updateMut = trpc.masters.updateProgram.useMutation({ onSuccess: () => { utils.masters.listPrograms.invalidate(); setModal({ open: false }); } });
  const deleteMut = trpc.masters.deleteProgram.useMutation({ onSuccess: () => utils.masters.listPrograms.invalidate() });

  type Form = z.infer<typeof programSchema>;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(programSchema.omit({ id: true })),
    defaultValues: { courseType: 'UG', entryType: 'Regular' },
  });

  const openCreate = () => {
    reset({ name: '', code: '', departmentId: (departments as any[])[0]?.id || 0, courseType: 'UG', entryType: 'Regular', totalIntake: 60 });
    setModal({ open: true });
  };
  const openEdit = (item: any) => {
    reset({ name: item.name, code: item.code, departmentId: item.departmentId, courseType: item.courseType, entryType: item.entryType, totalIntake: item.totalIntake });
    setModal({ open: true, editing: item });
  };

  const onSubmit = (data: Form) => {
    const payload = { ...data, departmentId: Number(data.departmentId), totalIntake: Number(data.totalIntake) };
    if (modal.editing) updateMut.mutate({ ...payload, id: modal.editing.id });
    else createMut.mutate(payload);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Programs / Branches</h2>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> Add</button>
      </div>
      {isLoading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Code</th><th>Department</th><th>Type</th><th>Entry</th><th>Intake</th><th>Actions</th></tr></thead>
            <tbody>
              {(data as any[]).map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td><span className="badge badge-info">{p.code}</span></td>
                  <td>{p.departmentName}</td>
                  <td><span className="badge badge-neutral">{p.courseType}</span></td>
                  <td>{p.entryType}</td>
                  <td style={{ fontWeight: 700 }}>{p.totalIntake}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-icon" onClick={() => openEdit(p)}><Edit2 size={15} /></button>
                      <button className="btn-icon" onClick={() => { if (confirm('Delete?')) deleteMut.mutate({ id: p.id }); }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data as any[]).length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No programs yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal title={modal.editing ? 'Edit Program' : 'Add Program'} isOpen={modal.open} onClose={() => setModal({ open: false })}
        footer={<><button className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit(onSubmit)}>Save</button></>}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Program Name</label>
            <input {...register('name')} className="form-input" placeholder="e.g., Computer Science" />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Code</label>
            <input {...register('code')} className="form-input" placeholder="e.g., CSE" />
            {errors.code && <p className="form-error">{errors.code.message}</p>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <select {...register('departmentId', { valueAsNumber: true })} className="form-select">
            {(departments as any[]).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="form-row-3">
          <div className="form-group">
            <label className="form-label">Course Type</label>
            <select {...register('courseType')} className="form-select">
              <option value="UG">UG</option>
              <option value="PG">PG</option>
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
            <label className="form-label">Total Intake</label>
            <input {...register('totalIntake', { valueAsNumber: true })} type="number" className="form-input" />
            {errors.totalIntake && <p className="form-error">{errors.totalIntake.message}</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Academic Year ───
function AcademicYearSection() {
  const [modal, setModal] = useState<{ open: boolean; editing?: any }>({ open: false });
  const utils = trpc.useUtils();
  const { data = [], isLoading } = trpc.masters.listAcademicYears.useQuery();
  const createMut = trpc.masters.createAcademicYear.useMutation({ onSuccess: () => { utils.masters.listAcademicYears.invalidate(); setModal({ open: false }); } });
  const updateMut = trpc.masters.updateAcademicYear.useMutation({ onSuccess: () => { utils.masters.listAcademicYears.invalidate(); setModal({ open: false }); } });
  const deleteMut = trpc.masters.deleteAcademicYear.useMutation({ onSuccess: () => utils.masters.listAcademicYears.invalidate() });

  type Form = z.infer<typeof academicYearSchema>;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(academicYearSchema.omit({ id: true })) });

  const openCreate = () => { reset({ year: '', isCurrent: false }); setModal({ open: true }); };
  const openEdit = (item: any) => { reset({ year: item.year, isCurrent: !!item.isCurrent }); setModal({ open: true, editing: item }); };

  const onSubmit = (data: Form) => {
    if (modal.editing) updateMut.mutate({ ...data, id: modal.editing.id });
    else createMut.mutate(data);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Academic Years</h2>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> Add</button>
      </div>
      {isLoading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Year</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {(data as any[]).map((y: any) => (
                <tr key={y.id}>
                  <td style={{ fontWeight: 500 }}>{y.year}</td>
                  <td>{y.isCurrent ? <span className="badge badge-success">Current</span> : <span className="badge badge-neutral">Inactive</span>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-icon" onClick={() => openEdit(y)}><Edit2 size={15} /></button>
                      <button className="btn-icon" onClick={() => { if (confirm('Delete?')) deleteMut.mutate({ id: y.id }); }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data as any[]).length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No academic years yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal title={modal.editing ? 'Edit Academic Year' : 'Add Academic Year'} isOpen={modal.open} onClose={() => setModal({ open: false })}
        footer={<><button className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit(onSubmit)}>Save</button></>}>
        <div className="form-group">
          <label className="form-label">Year</label>
          <input {...register('year')} className="form-input" placeholder="e.g., 2026-27" />
          {errors.year && <p className="form-error">{errors.year.message}</p>}
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input {...register('isCurrent')} type="checkbox" id="isCurrent" />
          <label htmlFor="isCurrent" className="form-label" style={{ marginBottom: 0 }}>Set as Current Year</label>
        </div>
      </Modal>
    </div>
  );
}
