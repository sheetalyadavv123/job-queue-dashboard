import axios from 'axios';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: string;
}

const api = axios.create({ baseURL: 'http://localhost:3001' });

export const getJobs = () => api.get<Job[]>('/jobs').then(r => r.data);
export const createJob = (title: string, type: string) =>
  api.post<Job>('/jobs', { title, type }).then(r => r.data);
export const deleteJob = (id: string) => api.delete(`/jobs/${id}`);
export const updateJobStatus = (id: string, status: JobStatus) =>
  api.patch<Job>(`/jobs/${id}/status`, { status }).then(r => r.data);

export default api;