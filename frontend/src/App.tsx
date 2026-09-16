import { useEffect, useState } from 'react';
import type { Job, JobStatus } from './api';
import { getJobs, createJob, deleteJob, updateJobStatus } from './api';

const NEXT_STATUS: Record<JobStatus, JobStatus[]> = {
  pending: ['running'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: '#facc15',
  running: '#3b82f6',
  completed: '#22c55e',
  failed: '#ef4444',
};

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getJobs();
      setJobs(data);
    } catch {
      setError('Failed to load jobs. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setBusy = (id: string, busy: boolean) => {
    setBusyIds(prev => {
      const next = new Set(prev);
      busy ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !type.trim()) return;
    setError('');
    try {
      await createJob(title, type);
      setTitle('');
      setType('');
      await load();
    } catch {
      setError('Failed to create job.');
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(id, true);
    setError('');
    try {
      await deleteJob(id);
      await load();
    } catch {
      setError('Failed to delete job.');
    } finally {
      setBusy(id, false);
    }
  };

  const handleStatusChange = async (id: string, status: JobStatus) => {
    setBusy(id, true);
    setError('');
    try {
      await updateJobStatus(id, status);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update status.');
    } finally {
      setBusy(id, false);
    }
  };

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);

  const counts: Record<JobStatus, number> = {
    pending: jobs.filter(j => j.status === 'pending').length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif', color: '#1e293b' }}>
      <h1 style={{ marginBottom: 30}}>Job Queue Dashboard</h1>
      <p style={{ color: '#64748b', marginTop: 10, marginBottom: 24 }}>Create, track, and manage background jobs.</p>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 6, marginBottom: 16, border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {(Object.keys(counts) as JobStatus[]).map(s => (
          <div key={s} style={{
            flex: '1 1 120px', background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '10px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: STATUS_COLORS[s] }}>{counts[s]}</div>
            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{s}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Job title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ flex: '2 1 180px', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <input
          placeholder="Job type"
          value={type}
          onChange={e => setType(e.target.value)}
          style={{ flex: '1 1 140px', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <button type="submit" style={{
          padding: '8px 16px', background: '#3b82f6', color: '#fff',
          border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
        }}>
          + Create Job
        </button>
      </form>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 14, color: '#475569' }}>Filter:</label>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as JobStatus | 'all')}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading jobs...</p>
      ) : filteredJobs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px', color: '#94a3b8',
          border: '1px dashed #e2e8f0', borderRadius: 8,
        }}>
          {jobs.length === 0 ? 'No jobs yet — create one above.' : 'No jobs match this filter.'}
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '8px 6px' }}>Title</th>
              <th style={{ padding: '8px 6px' }}>Type</th>
              <th style={{ padding: '8px 6px' }}>Status</th>
              <th style={{ padding: '8px 6px' }}>Created</th>
              <th style={{ padding: '8px 6px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map(job => (
              <tr key={job.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 6px' }}>{job.title}</td>
                <td style={{ padding: '8px 6px' }}>{job.type}</td>
                <td style={{ padding: '8px 6px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    color: '#fff', background: STATUS_COLORS[job.status],
                  }}>
                    {job.status}
                  </span>
                </td>
                <td style={{ padding: '8px 6px', color: '#64748b' }}>
                  {new Date(job.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '8px 6px' }}>
                  {NEXT_STATUS[job.status].map(next => (
                    <button
                      key={next}
                      disabled={busyIds.has(job.id)}
                      onClick={() => handleStatusChange(job.id, next)}
                      style={{
                        marginRight: 6, padding: '4px 10px', fontSize: 12,
                        border: '1px solid #cbd5e1', borderRadius: 5,
                        background: busyIds.has(job.id) ? '#f1f5f9' : '#fff',
                        cursor: busyIds.has(job.id) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Mark {next}
                    </button>
                  ))}
                  <button
                    disabled={busyIds.has(job.id)}
                    onClick={() => handleDelete(job.id)}
                    style={{
                      padding: '4px 10px', fontSize: 12, border: '1px solid #fca5a5',
                      color: '#dc2626', borderRadius: 5,
                      background: busyIds.has(job.id) ? '#fef2f2' : '#fff',
                      cursor: busyIds.has(job.id) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;