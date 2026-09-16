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
  pending: '#d97706',
  running: '#2563eb',
  completed: '#16a34a',
  failed: '#dc2626',
};

const STATUS_BG: Record<JobStatus, string> = {
  pending: '#fef3c7',
  running: '#dbeafe',
  completed: '#dcfce7',
  failed: '#fee2e2',
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

  useEffect(() => {
    load();
  }, []);

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
      setError(
        err?.response?.data?.message || 'Failed to update status.'
      );
    } finally {
      setBusy(id, false);
    }
  };

  const filteredJobs =
    filter === 'all'
      ? jobs
      : jobs.filter(j => j.status === filter);

  const counts: Record<JobStatus, number> = {
    pending: jobs.filter(j => j.status === 'pending').length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '40px 24px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 30 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: '#2563eb',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              J
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 750,
                  letterSpacing: '-0.5px',
                }}
              >
                Job Queue Dashboard
              </h1>

              <p
                style={{
                  margin: '5px 0 0',
                  color: '#64748b',
                  fontSize: 14,
                }}
              >
                Create, track, and manage background jobs.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: '#fff1f2',
              color: '#be123c',
              padding: '12px 16px',
              borderRadius: 10,
              marginBottom: 20,
              border: '1px solid #fecdd3',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
            marginBottom: 28,
          }}
        >
          {(Object.keys(counts) as JobStatus[]).map(status => (
            <div
              key={status}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'capitalize',
                  }}
                >
                  {status}
                </span>

                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: STATUS_COLORS[status],
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: 27,
                  fontWeight: 750,
                  color: '#0f172a',
                }}
              >
                {counts[status]}
              </div>
            </div>
          ))}
        </div>

        {/* Create Job */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              Create a new job
            </h2>

            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: '#64748b',
              }}
            >
              Add a job to the processing queue.
            </p>
          </div>

          <form
            onSubmit={handleCreate}
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <input
              placeholder="Job title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                flex: '2 1 220px',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                outline: 'none',
                fontSize: 14,
                color: '#0f172a',
                background: '#ffffff',
                boxSizing: 'border-box',
              }}
            />

            <input
              placeholder="Job type"
              value={type}
              onChange={e => setType(e.target.value)}
              style={{
                flex: '1 1 180px',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                outline: 'none',
                fontSize: 14,
                color: '#0f172a',
                background: '#ffffff',
                boxSizing: 'border-box',
              }}
            />

            <button
              type="submit"
              style={{
                padding: '10px 18px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 650,
                fontSize: 14,
                boxShadow: '0 1px 2px rgba(37, 99, 235, 0.25)',
              }}
            >
              + Create Job
            </button>
          </form>
        </div>

        {/* Jobs Section */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          }}
        >
          {/* Table Header */}
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                Jobs
              </h2>

              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 13,
                  color: '#64748b',
                }}
              >
                {filteredJobs.length} job
                {filteredJobs.length !== 1 ? 's' : ''} shown
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <label
                style={{
                  fontSize: 13,
                  color: '#64748b',
                  fontWeight: 500,
                }}
              >
                Filter
              </label>

              <select
                value={filter}
                onChange={e =>
                  setFilter(
                    e.target.value as JobStatus | 'all'
                  )
                }
                style={{
                  padding: '7px 10px',
                  borderRadius: 7,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <option value="all">All jobs</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div
              style={{
                padding: '50px 20px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: 14,
              }}
            >
              Loading jobs...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  marginBottom: 10,
                }}
              >
                📋
              </div>

              <div
                style={{
                  fontWeight: 650,
                  color: '#334155',
                  marginBottom: 5,
                }}
              >
                {jobs.length === 0
                  ? 'No jobs yet'
                  : 'No matching jobs'}
              </div>

              <div
                style={{
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                {jobs.length === 0
                  ? 'Create your first job using the form above.'
                  : 'Try selecting a different filter.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 14,
                  minWidth: 720,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      textAlign: 'left',
                    }}
                  >
                    <th
                      style={{
                        padding: '12px 20px',
                        color: '#64748b',
                        fontSize: 12,
                        fontWeight: 650,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                      }}
                    >
                      Title
                    </th>

                    <th
                      style={{
                        padding: '12px 10px',
                        color: '#64748b',
                        fontSize: 12,
                        fontWeight: 650,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                      }}
                    >
                      Type
                    </th>

                    <th
                      style={{
                        padding: '12px 10px',
                        color: '#64748b',
                        fontSize: 12,
                        fontWeight: 650,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                      }}
                    >
                      Status
                    </th>

                    <th
                      style={{
                        padding: '12px 10px',
                        color: '#64748b',
                        fontSize: 12,
                        fontWeight: 650,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                      }}
                    >
                      Created
                    </th>

                    <th
                      style={{
                        padding: '12px 20px 12px 10px',
                        color: '#64748b',
                        fontSize: 12,
                        fontWeight: 650,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredJobs.map(job => (
                    <tr
                      key={job.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <td
                        style={{
                          padding: '16px 20px',
                          fontWeight: 600,
                          color: '#1e293b',
                        }}
                      >
                        {job.title}
                      </td>

                      <td
                        style={{
                          padding: '16px 10px',
                          color: '#64748b',
                        }}
                      >
                        {job.type}
                      </td>

                      <td style={{ padding: '16px 10px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 9px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 650,
                            color: STATUS_COLORS[job.status],
                            background: STATUS_BG[job.status],
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background:
                                STATUS_COLORS[job.status],
                            }}
                          />
                          {job.status}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '16px 10px',
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          fontSize: 13,
                        }}
                      >
                        {new Date(
                          job.createdAt
                        ).toLocaleString()}
                      </td>

                      <td
                        style={{
                          padding: '16px 20px 16px 10px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {NEXT_STATUS[job.status].map(next => (
                          <button
                            key={next}
                            disabled={busyIds.has(job.id)}
                            onClick={() =>
                              handleStatusChange(
                                job.id,
                                next
                              )
                            }
                            style={{
                              marginRight: 6,
                              padding: '6px 9px',
                              fontSize: 12,
                              fontWeight: 550,
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              background: '#fff',
                              color: '#334155',
                              cursor: busyIds.has(job.id)
                                ? 'not-allowed'
                                : 'pointer',
                              opacity: busyIds.has(job.id)
                                ? 0.6
                                : 1,
                            }}
                          >
                            Mark {next}
                          </button>
                        ))}

                        <button
                          disabled={busyIds.has(job.id)}
                          onClick={() =>
                            handleDelete(job.id)
                          }
                          style={{
                            padding: '6px 9px',
                            fontSize: 12,
                            fontWeight: 550,
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            borderRadius: 6,
                            background: '#fff',
                            cursor: busyIds.has(job.id)
                              ? 'not-allowed'
                              : 'pointer',
                            opacity: busyIds.has(job.id)
                              ? 0.6
                              : 1,
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            color: '#94a3b8',
            fontSize: 12,
          }}
        >
          Job Queue Dashboard
        </div>
      </div>
    </div>
  );
}

export default App;

