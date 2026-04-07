import { useState, useEffect, FormEvent, useMemo } from 'react';
import {
  FaUserPlus, FaLinkedin, FaPlus, FaTimes, FaCheck, FaSearch,
  FaTrash, FaEdit, FaChevronDown, FaChevronUp, FaEnvelope,
  FaUsers, FaClock, FaPaperPlane, FaExternalLinkAlt, FaBell,
  FaExclamationTriangle, FaBuilding,
} from 'react-icons/fa';
import {
  LinkedInConnection, LinkedInConnectionCreate, LinkedInConnectionStats,
  CONNECTION_STATUS_OPTIONS, CONNECTION_CATEGORY_OPTIONS,
} from '../types';
import { connectionApi } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isOverdue = (dateStr?: string) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

const getCategoryColor = (cat?: string) => {
  const map: Record<string, string> = {
    Recruiter: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    'Hiring Manager': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
    Employee: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
    Other: 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  };
  return map[cat || ''] || map.Other;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'Accepted':
      return { dot: 'bg-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700', label: 'Accepted' };
    case 'Withdrawn':
      return { dot: 'bg-red-400', badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700', label: 'Withdrawn' };
    default:
      return { dot: 'bg-yellow-400', badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700', label: 'Pending' };
  }
};

// ─── Add / Edit Form Modal ────────────────────────────────────────────

interface FormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: LinkedInConnection;
}

const ConnectionForm = ({ onSuccess, onCancel, initialData }: FormProps) => {
  const todayStr = new Date().toISOString().slice(0, 16);
  const [form, setForm] = useState<LinkedInConnectionCreate>({
    contact_name: initialData?.contact_name || '',
    linkedin_profile_id: initialData?.linkedin_profile_id || '',
    company_name: initialData?.company_name || '',
    category: initialData?.category || '',
    connection_status: initialData?.connection_status || 'Pending',
    requested_on: initialData?.requested_on ? new Date(initialData.requested_on).toISOString().slice(0, 16) : todayStr,
    accepted_on: initialData?.accepted_on ? new Date(initialData.accepted_on).toISOString().slice(0, 16) : '',
    cold_message_sent: initialData?.cold_message_sent || false,
    follow_up_date: initialData?.follow_up_date ? new Date(initialData.follow_up_date).toISOString().slice(0, 10) : '',
    notes: initialData?.notes || '',
    stage: initialData?.stage || 'Requested',
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof LinkedInConnectionCreate, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: LinkedInConnectionCreate = {
        ...form,
        accepted_on: form.accepted_on || undefined,
        follow_up_date: form.follow_up_date || undefined,
      };
      if (initialData) {
        await connectionApi.update(initialData.id, payload);
      } else {
        await connectionApi.create(payload);
      }
      onSuccess();
    } catch (err) {
      console.error('Error saving connection:', err);
      alert('Failed to save connection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 transition-colors';
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-gray-100 dark:border-slate-700">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700/60 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <FaLinkedin className="text-white text-lg" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {initialData ? 'Edit Connection' : 'Add Connection Request'}
            </h2>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Contact Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} required placeholder="e.g. Jane Smith" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Company (optional)</label>
              <input type="text" value={form.company_name || ''} onChange={e => set('company_name', e.target.value)} placeholder="e.g. Google" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}><span className="flex items-center gap-1.5"><FaLinkedin className="text-blue-600" /> LinkedIn Profile URL</span></label>
            <input type="text" value={form.linkedin_profile_id || ''} onChange={e => set('linkedin_profile_id', e.target.value)} placeholder="https://linkedin.com/in/username" className={inputCls} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category || ''} onChange={e => set('category', e.target.value)} className={inputCls}>
                <option value="">Select category...</option>
                {CONNECTION_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Connection Status</label>
              <select value={form.connection_status || 'Pending'} onChange={e => set('connection_status', e.target.value)} className={inputCls}>
                {CONNECTION_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Requested On</label>
              <input type="datetime-local" value={form.requested_on || ''} onChange={e => set('requested_on', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Accepted On</label>
              <input type="datetime-local" value={form.accepted_on || ''} onChange={e => set('accepted_on', e.target.value)} className={inputCls} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Fill when they accept your request</p>
            </div>
          </div>
          <div>
            <label className={labelCls}><span className="flex items-center gap-1.5"><FaBell className="text-orange-400 text-xs" /> Follow-up Reminder (optional)</span></label>
            <input type="date" value={form.follow_up_date || ''} onChange={e => set('follow_up_date', e.target.value)} className={inputCls} />
          </div>
          <div>
            <button type="button" onClick={() => set('cold_message_sent', !form.cold_message_sent)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${form.cold_message_sent
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'
                }`}>
              <span className="flex items-center gap-2"><FaPaperPlane className={form.cold_message_sent ? 'text-blue-500' : 'text-gray-400'} /> Cold Message Sent?</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${form.cold_message_sent ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400'}`}>
                {form.cold_message_sent ? 'Yes ✓' : 'No'}
              </span>
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tip: This also syncs automatically when you link a cold message to this connection</p>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any notes about this connection..." className={inputCls} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
              <FaUserPlus /> {submitting ? 'Saving...' : initialData ? 'Update' : 'Add Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────

interface ConnectionRequestsProps {
  onNavigate: (tab: 'dashboard' | 'applications' | 'cold-messages' | 'connection-requests') => void;
}

export const ConnectionRequests = ({ onNavigate }: ConnectionRequestsProps) => {
  const [connections, setConnections] = useState<LinkedInConnection[]>([]); // stage = 'Requested'
  const [needToConnect, setNeedToConnect] = useState<LinkedInConnection[]>([]); // stage = 'Need to Connect'
  const [stats, setStats] = useState<LinkedInConnectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConn, setEditingConn] = useState<LinkedInConnection | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [ntcCollapsed, setNtcCollapsed] = useState(false); // Need to Connect section collapsed state

  // Derive unique companies from full loaded list for the filter dropdown
  const companies = useMemo(() => {
    const set = new Set<string>();
    connections.forEach(c => { if (c.company_name) set.add(c.company_name); });
    return Array.from(set).sort();
  }, [connections]);

  // Client-side company filter applied on top of server-filtered results
  const displayedConnections = useMemo(() => {
    if (!filterCompany) return connections;
    return connections.filter(c => c.company_name === filterCompany);
  }, [connections, filterCompany]);

  const loadData = async () => {
    try {
      const [requested, ntc, st] = await Promise.all([
        connectionApi.getAll({
          search: search || undefined,
          status: filterStatus || undefined,
          category: filterCategory || undefined,
          stage: 'Requested',
        }),
        connectionApi.getAll({ stage: 'Need to Connect' }),
        connectionApi.getStatistics(),
      ]);
      setConnections(requested);
      setNeedToConnect(ntc);
      setStats(st);
    } catch (err) {
      console.error('Error loading connections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [search, filterStatus, filterCategory]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this connection request?')) return;
    await connectionApi.delete(id);
    loadData();
  };

  const markAsSent = async (conn: LinkedInConnection) => {
    await connectionApi.update(conn.id, {
      stage: 'Requested',
      connection_status: 'Pending',
      requested_on: new Date().toISOString(),
    });
    loadData();
  };

  const quickToggleStatus = async (conn: LinkedInConnection) => {
    const next = conn.connection_status === 'Pending' ? 'Accepted' : 'Pending';
    await connectionApi.update(conn.id, { connection_status: next });
    loadData();
  };

  const quickToggleColdMessage = async (conn: LinkedInConnection) => {
    await connectionApi.update(conn.id, { cold_message_sent: !conn.cold_message_sent });
    loadData();
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingConn(undefined);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showForm && (
        <ConnectionForm
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditingConn(undefined); }}
          initialData={editingConn}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <FaLinkedin className="text-white text-xl" />
            </span>
            Connection Requests
          </h2>
          <p className="text-gray-500 dark:text-gray-400 ml-14">Track LinkedIn connections sent for cold outreach</p>
        </div>
        <button
          onClick={() => { setEditingConn(undefined); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
        >
          <FaPlus /> Add Connection
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Need to Connect */}
          <div className="relative overflow-hidden p-4 rounded-2xl border border-violet-100/50 dark:border-violet-800/30 bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-900/40 dark:to-purple-900/40 backdrop-blur-md group animate-slideUp cursor-pointer hover:scale-[1.02] transition-all"
            style={{ animationDelay: '0ms' }}>
            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 tracking-widest uppercase mb-1">Need to Connect</p>
            <p className="text-3xl font-extrabold text-violet-600 dark:text-violet-400">{stats.need_to_connect}</p>
            <div className="absolute right-3 bottom-3 p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
              <FaUserPlus className="text-white text-sm" />
            </div>
          </div>

          {/* Total */}
          <div className="relative overflow-hidden p-4 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/40 dark:to-indigo-900/40 backdrop-blur-md group animate-slideUp cursor-pointer hover:scale-[1.02] transition-all"
            style={{ animationDelay: '0ms' }} onClick={() => setFilterStatus('')}>
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase mb-1">Total</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.total}</p>
            <div className="absolute right-3 bottom-3 p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
              <FaUsers className="text-white text-sm" />
            </div>
          </div>

          {/* Pending */}
          <div className={`relative overflow-hidden p-4 rounded-2xl border border-yellow-100/50 dark:border-yellow-800/30 bg-gradient-to-br from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/40 dark:to-amber-900/40 backdrop-blur-md group animate-slideUp cursor-pointer hover:scale-[1.02] transition-all ${filterStatus === 'Pending' ? 'ring-2 ring-yellow-400' : ''}`}
            style={{ animationDelay: '60ms' }} onClick={() => setFilterStatus(filterStatus === 'Pending' ? '' : 'Pending')}>
            <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 tracking-widest uppercase mb-1">Pending</p>
            <p className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            <div className="absolute right-3 bottom-3 p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg group-hover:scale-110 transition-transform">
              <FaClock className="text-white text-sm" />
            </div>
          </div>

          {/* Accepted */}
          <div className={`relative overflow-hidden p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/40 dark:to-green-900/40 backdrop-blur-md group animate-slideUp cursor-pointer hover:scale-[1.02] transition-all ${filterStatus === 'Accepted' ? 'ring-2 ring-emerald-400' : ''}`}
            style={{ animationDelay: '120ms' }} onClick={() => setFilterStatus(filterStatus === 'Accepted' ? '' : 'Accepted')}>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase mb-1">Accepted</p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.accepted}</p>
            <div className="absolute right-3 bottom-3 p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg group-hover:scale-110 transition-transform">
              <FaCheck className="text-white text-sm" />
            </div>
          </div>

          {/* Cold Msg Sent */}
          <div className="relative overflow-hidden p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/40 dark:to-purple-900/40 backdrop-blur-md group animate-slideUp cursor-pointer hover:scale-[1.02] transition-all"
            style={{ animationDelay: '180ms' }} onClick={() => onNavigate('cold-messages')}>
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase mb-1">Msg Sent</p>
            <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.cold_message_sent}</p>
            <div className="absolute right-3 bottom-3 p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
              <FaPaperPlane className="text-white text-sm" />
            </div>
          </div>

          {/* ⚠️ Accepted, No Msg */}
          {stats.accepted_no_message > 0 ? (
            <div className="relative overflow-hidden p-4 rounded-2xl border border-orange-200 dark:border-orange-700/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/40 backdrop-blur-md group animate-slideUp cursor-pointer hover:scale-[1.02] transition-all ring-1 ring-orange-300 dark:ring-orange-600"
              style={{ animationDelay: '240ms' }} onClick={() => { setFilterStatus('Accepted'); }}>
              <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 tracking-widest uppercase mb-1 flex items-center gap-1">
                <FaExclamationTriangle className="text-[9px]" /> No Msg Yet
              </p>
              <p className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">{stats.accepted_no_message}</p>
              <div className="absolute right-3 bottom-3 p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg group-hover:scale-110 transition-transform animate-pulse">
                <FaExclamationTriangle className="text-white text-sm" />
              </div>
              <p className="text-[9px] text-orange-500 dark:text-orange-400 mt-1 font-medium">accepted, not messaged</p>
            </div>
          ) : (
            <div className="relative overflow-hidden p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/40 to-teal-50/40 dark:from-emerald-900/20 dark:to-teal-900/20 backdrop-blur-md group animate-slideUp"
              style={{ animationDelay: '240ms' }}>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase mb-1">All Messaged</p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">✓</p>
              <div className="absolute right-3 bottom-3 p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg group-hover:scale-110 transition-transform">
                <FaCheck className="text-white text-sm" />
              </div>
            </div>
          )}

          {/* Accept Rate */}
          <div className="relative overflow-hidden p-4 rounded-2xl border border-teal-100/50 dark:border-teal-800/30 bg-gradient-to-br from-teal-50/80 to-cyan-50/80 dark:from-teal-900/40 dark:to-cyan-900/40 backdrop-blur-md group animate-slideUp col-span-2 md:col-span-1"
            style={{ animationDelay: '300ms' }}>
            <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 tracking-widest uppercase mb-1">Accept Rate</p>
            <p className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">
              {stats.acceptance_rate}<span className="text-xl ml-0.5">%</span>
            </p>
            <div className="absolute right-3 bottom-3 p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg group-hover:scale-110 transition-transform">
              <FaLinkedin className="text-white text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl animate-slideUp" style={{ animationDelay: '360ms' }}>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, company, LinkedIn URL..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
            <option value="">All Statuses</option>
            {CONNECTION_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
            <option value="">All Categories</option>
            {CONNECTION_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {companies.length > 0 && (
            <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <option value="">All Companies</option>
              {companies.map(c => <option key={c} value={c}><FaBuilding className="inline" /> {c}</option>)}
            </select>
          )}
          {(search || filterStatus || filterCategory || filterCompany) && (
            <button
              onClick={() => { setSearch(''); setFilterStatus(''); setFilterCategory(''); setFilterCompany(''); }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 bg-white dark:bg-slate-700 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FaTimes className="text-xs" /> Clear
            </button>
          )}
        </div>
        {filterCompany && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1 flex items-center gap-1.5">
            <FaBuilding className="text-[10px]" /> Showing connections at <strong>{filterCompany}</strong>
          </p>
        )}
      </div>

      {/* ── Need to Connect Section ── */}
      {needToConnect.length > 0 && (
        <div className="animate-slideUp" style={{ animationDelay: '200ms' }}>
          <div
            className="flex items-center justify-between px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border border-violet-100 dark:border-violet-700/40 cursor-pointer select-none"
            onClick={() => setNtcCollapsed(c => !c)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                <FaUserPlus className="text-white text-sm" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Need to Connect</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Contacts saved from job applications — not yet reached out</p>
              </div>
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-800/60 text-violet-700 dark:text-violet-300">
                {needToConnect.length}
              </span>
            </div>
            {ntcCollapsed ? <FaChevronDown className="text-gray-400" /> : <FaChevronUp className="text-gray-400" />}
          </div>

          {!ntcCollapsed && (
            <div className="mt-3 space-y-3">
              {needToConnect.map(conn => (
                <div key={conn.id} className="glass-card rounded-2xl border border-violet-100/60 dark:border-violet-700/30 bg-gradient-to-br from-violet-50/60 to-white dark:from-violet-900/20 dark:to-slate-800/60 p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-600 transition-all">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {conn.contact_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 dark:text-white">{conn.contact_name}</span>
                      {conn.category && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryColor(conn.category)}`}>
                          {conn.category}
                        </span>
                      )}
                    </div>
                    {conn.company_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FaBuilding className="text-[10px]" /> {conn.company_name}
                      </p>
                    )}
                    {conn.linkedin_profile_id && (
                      <a href={conn.linkedin_profile_id} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                        onClick={e => e.stopPropagation()}>
                        <FaLinkedin className="text-[10px]" /> LinkedIn Profile <FaExternalLinkAlt className="text-[8px]" />
                      </a>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">Added {formatDate(conn.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => markAsSent(conn)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-violet-300/40 hover:scale-[1.02]"
                      title="Mark as request sent — moves to main Connection Requests list"
                    >
                      <FaPaperPlane className="text-[10px]" /> Mark as Sent
                    </button>
                    <button
                      onClick={() => { setEditingConn(conn); setShowForm(true); }}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Edit"
                    >
                      <FaEdit className="text-sm" />
                    </button>
                    <button
                      onClick={() => handleDelete(conn.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Connection Cards */}
      {displayedConnections.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl animate-slideUp">
          <div className="p-5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5">
            <FaUserPlus className="text-4xl text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No connection requests found</h3>
          <p className="text-gray-400 dark:text-gray-500 mb-6 max-w-sm mx-auto">
            {(search || filterStatus || filterCategory || filterCompany)
              ? 'Try adjusting your filters'
              : 'Start tracking your LinkedIn connections sent for cold outreach'}
          </p>
          {!(search || filterStatus || filterCategory || filterCompany) && (
            <button onClick={() => { setEditingConn(undefined); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:scale-[1.02] transition-all">
              <FaPlus /> Add First Connection
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 animate-slideUp" style={{ animationDelay: '420ms' }}>
          {displayedConnections.map(conn => {
            const statusCfg = getStatusConfig(conn.connection_status);
            const overdue = isOverdue(conn.follow_up_date) && conn.connection_status !== 'Accepted';
            const needsMessage = conn.connection_status === 'Accepted' && !conn.cold_message_sent;

            return (
              <div key={conn.id} className="glass-card rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg">
                {/* Attention stripe for accepted + no message */}
                {needsMessage && (
                  <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-amber-400 animate-pulse" />
                )}

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="mt-1.5 flex-shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full block ${statusCfg.dot}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{conn.contact_name}</h4>
                        {conn.company_name && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">@ {conn.company_name}</span>
                        )}
                        {conn.linkedin_profile_id && (
                          <a href={conn.linkedin_profile_id.startsWith('http') ? conn.linkedin_profile_id : `https://${conn.linkedin_profile_id}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={e => e.stopPropagation()}>
                            <FaLinkedin /> View Profile <FaExternalLinkAlt className="text-[9px]" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${statusCfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} /> {statusCfg.label}
                        </span>

                        {/* Category badge */}
                        {conn.category && (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getCategoryColor(conn.category)}`}>
                            {conn.category}
                          </span>
                        )}

                        {/* Cold message sent badge — clickable if linked to a message */}
                        {conn.cold_message_sent && (
                          <button
                            onClick={() => onNavigate('cold-messages')}
                            title="View in Cold Messages"
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-800/60 transition-colors cursor-pointer"
                          >
                            <FaEnvelope className="text-[10px]" />
                            {conn.cold_message_id ? 'Cold Msg Sent ↗' : 'Cold Msg Sent'}
                          </button>
                        )}

                        {/* ⚠️ Needs message badge */}
                        {needsMessage && (
                          <button
                            onClick={() => onNavigate('cold-messages')}
                            title="Go to Cold Messages to send a message"
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-800/60 transition-colors cursor-pointer animate-pulse"
                          >
                            <FaExclamationTriangle className="text-[10px]" /> Send a cold message! ↗
                          </button>
                        )}

                        {/* Follow-up badge */}
                        {conn.follow_up_date && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${overdue
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 animate-pulse'
                            : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700'
                            }`}>
                            <FaBell className="text-[10px]" />
                            {overdue ? 'Overdue: ' : 'Follow up: '}{formatDate(conn.follow_up_date)}
                          </span>
                        )}

                        {/* Dates */}
                        <span className="text-xs text-gray-400 dark:text-gray-500">Sent {formatDate(conn.requested_on)}</span>
                        {conn.accepted_on && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">• Accepted {formatDate(conn.accepted_on)}</span>
                        )}
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => quickToggleStatus(conn)}
                        title={conn.connection_status === 'Pending' ? 'Mark as Accepted' : 'Mark as Pending'}
                        className={`p-2 rounded-lg text-xs font-medium transition-colors ${conn.connection_status === 'Accepted'
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                          : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                          }`}>
                        <FaCheck />
                      </button>
                      <button onClick={() => quickToggleColdMessage(conn)}
                        title={conn.cold_message_sent ? 'Unmark cold message sent' : 'Mark cold message sent (manual)'}
                        className={`p-2 rounded-lg transition-colors ${conn.cold_message_sent
                          ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                          : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                          }`}>
                        <FaEnvelope />
                      </button>
                      <button onClick={() => { setEditingConn(conn); setShowForm(true); }}
                        title="Edit" className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(conn.id)}
                        title="Delete" className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <FaTrash />
                      </button>
                      {conn.notes && (
                        <button onClick={() => setExpandedId(expandedId === conn.id ? null : conn.id)}
                          title="Toggle notes" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                          {expandedId === conn.id ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {expandedId === conn.id && conn.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 ml-6">
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Notes</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{conn.notes}</p>
                    </div>
                  )}
                </div>

                {/* Accepted accent bar */}
                {conn.connection_status === 'Accepted' && !needsMessage && (
                  <div className="h-0.5 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
