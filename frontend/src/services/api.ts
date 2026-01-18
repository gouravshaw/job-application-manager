import axios from 'axios';
import { JobApplication, JobApplicationCreate, ApplicationStats } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const applicationApi = {
  // Get all applications with advanced filtering
  getAll: async (filters?: {
    status?: string;
    status_stage?: string;
    domain?: string;
    search?: string;
    work_type?: string;
    tags?: string;
    include_archived?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<JobApplication[]> => {
    const params: any = {};
    if (filters) {
      if (filters.status) params.status = filters.status;
      if (filters.status_stage) params.status_stage = filters.status_stage;
      if (filters.domain) params.domain = filters.domain;
      if (filters.search) params.search = filters.search;
      if (filters.work_type) params.work_type = filters.work_type;
      if (filters.tags) params.tags = filters.tags;
      if (filters.include_archived !== undefined) params.include_archived = filters.include_archived;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;
    }
    const response = await api.get('/applications/', { params });
    return response.data;
  },

  // Get single application
  getOne: async (id: number): Promise<JobApplication> => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  // Create application
  create: async (data: JobApplicationCreate): Promise<JobApplication> => {
    const response = await api.post('/applications/', data);
    return response.data;
  },

  // Update application
  update: async (id: number, data: Partial<JobApplicationCreate>): Promise<JobApplication> => {
    const response = await api.put(`/applications/${id}`, data);
    return response.data;
  },

  // Delete application
  delete: async (id: number): Promise<void> => {
    await api.delete(`/applications/${id}`);
  },

  // Upload document
  uploadDocument: async (id: number, docType: 'cv' | 'coverletter', file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/applications/${id}/upload/${docType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Download document
  downloadDocument: async (id: number, docType: 'cv' | 'coverletter', filename: string): Promise<void> => {
    const response = await api.get(`/applications/${id}/download/${docType}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Get statistics
  getStatistics: async (): Promise<ApplicationStats> => {
    const response = await api.get('/statistics/');
    return response.data;
  },

  // Export to Excel
  exportToExcel: async (): Promise<void> => {
    const response = await api.get('/export/excel', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `job_applications_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Get unique domains
  getDomains: async (): Promise<string[]> => {
    const response = await api.get('/domains/');
    return response.data;
  },

  // Get all tags
  getTags: async (): Promise<string[]> => {
    const response = await api.get('/tags/');
    return response.data;
  },

  // Archive/Unarchive
  archive: async (id: number): Promise<void> => {
    await api.put(`/applications/${id}/archive`);
  },

  unarchive: async (id: number): Promise<void> => {
    await api.put(`/applications/${id}/unarchive`);
  },

  // Bulk operations
  bulkDelete: async (ids: number[]): Promise<void> => {
    await api.post('/applications/bulk/delete', ids);
  },

  bulkArchive: async (ids: number[]): Promise<void> => {
    await api.post('/applications/bulk/archive', ids);
  },

  bulkUnarchive: async (ids: number[]): Promise<void> => {
    await api.post('/applications/bulk/unarchive', ids);
  },


  bulkUpdateStatus: async (ids: number[], status: string, stage?: string): Promise<void> => {
    const params = new URLSearchParams({ status });
    if (stage) {
      params.append('stage', stage);
    }
    await api.post(`/applications/bulk/update-status?${params.toString()}`, ids);
  },

  // Backup & Restore
  backup: () => {
    window.open(`${API_BASE_URL}/api/backup`, '_blank');
  },

  restore: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post('/api/restore', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

