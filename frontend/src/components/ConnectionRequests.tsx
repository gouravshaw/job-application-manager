import { useState, useEffect, FormEvent, useMemo } from 'react';
import {
  FaUserPlus, FaLinkedin, FaPlus, FaTimes, FaSearch,
  FaTrash, FaEdit, FaChevronDown, FaChevronUp, FaEnvelope,
  FaUsers, FaClock, FaCheckCircle, FaPaperPlane, FaExternalLinkAlt, FaBell,
  FaBuilding, FaCheck, FaTimesCircle,
} from 'react-icons/fa';
import {
  LinkedInConnection, LinkedInConnectionCreate, LinkedInConnectionStats,
  CONNECTION_STATUS_OPTIONS, CONNECTION_CATEGORY_OPTIONS,
} from '../types';
import { connectionApi } from '../services/api';

// ─── Helpers ───────────────────────────────────────────────────────────────

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
    Recruiter: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    'Hiring Manager': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    Employee: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    Other: 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300',
  };
  return map[cat || ''] || map.Other;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'Accepted': return {
      dot: 'bg-emerald-500',
      badge: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/40 dark:to-green-800/40 text-emerald-700 dark:text-emerald-300',
      icon: <FaCheckCircle className="text-emerald-500" />,
    };
    case 'Withdrawn': return {
      dot: 'bg-red-400',
      badge: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/40 text-red-700 dark:text-red-300',
      icon: <FaTimesCircle className="text-red-400" />,
    };
    default: return {
      dot: 'bg-yellow-400',
      badge: 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/40 dark:to-amber-800/40 text-yellow-700 dark:text-yellow-300',
      icon: <FaClock className="text-yellow-500" />,
    };
  }
};

// ─── Add / Edit Form Modal ────────────────────────────────────────────────

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

// ─── Connection Card ──────────────────────────────────────────────────────

interface ConnectionCardProps {
  conn: LinkedInConnection;
  onEdit: () => void;
  onDelete: () => void;
  onMarkSent?: () => void;
  isNTC?: boolean;
}

const ConnectionCard = ({ conn, onEdit, onDelete, onMarkSent, isNTC }: ConnectionCardProps) => {
  const statusCfg = getStatusConfig(conn.connection_status);
  const initials = conn.contact_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const overdue = isOverdue(conn.follow_up_date);

  return (
    <div className={`relative group flex flex-col bg-white dark:bg-slate-800/60 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:scale-[1.01] overflow-hidden ${
      isNTC
        ? 'border-violet-200/60 dark:border-violet-700/40 hover:border-violet-400/60 dark:hover:border-violet-500/60'
        : 'border-slate-200/60 dark:border-slate-700/40 hover:border-blue-400/60 dark:hover:border-blue-500/60'
    }`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
        isNTC ? 'bg-gradient-to-b from-violet-500 to-purple-600' :
        conn.connection_status === 'Accepted' ? 'bg-gradient-to-b from-emerald-400 to-green-500' :
        conn.connection_status === 'Withdrawn' ? 'bg-gradient-to-b from-red-400 to-rose-500' :
        'bg-gradient-to-b from-blue-400 to-indigo-500'
      }`} />

      <div className="flex flex-col h-full p-5 pl-6">
        {/* Header: Avatar + Name + LinkedIn */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md ${
            isNTC ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">{conn.contact_name}</h3>
              {conn.linkedin_profile_id && (
                <a
                  href={conn.linkedin_profile_id.startsWith('http') ? conn.linkedin_profile_id : `https://${conn.linkedin_profile_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={e => e.stopPropagation()}
                  title="View LinkedIn Profile"
                >
                  <FaLinkedin className="text-sm" />
                </a>
              )}
            </div>
            {conn.company_name && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <FaBuilding className="text-[10px] flex-shrink-0" />
                <span className="truncate">{conn.company_name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {!isNTC && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${statusCfg.badge}`}>
              {statusCfg.icon}
              {conn.connection_status}
            </span>
          )}
          {conn.category && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${getCategoryColor(conn.category)}`}>
              {conn.category}
            </span>
          )}
          {conn.cold_message_sent && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <FaEnvelope className="text-[10px]" /> Messaged
            </span>
          )}
        </div>

        {/* Dates */}
        <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1 mb-3 flex-1">
          {!isNTC && conn.requested_on && (
            <p className="flex items-center gap-1.5">
              <FaPaperPlane className="text-[10px]" />
              Sent: {formatDate(conn.requested_on)}
            </p>
          )}
          {isNTC && (
            <p className="flex items-center gap-1.5">
              <FaClock className="text-[10px]" />
              Added: {formatDate(conn.created_at)}
            </p>
          )}
          {conn.accepted_on && (
            <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <FaCheck className="text-[10px]" />
              Accepted: {formatDate(conn.accepted_on)}
            </p>
          )}
          {conn.follow_up_date && (
            <p className={`flex items-center gap-1.5 ${overdue ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-orange-500 dark:text-orange-400'}`}>
              <FaBell className="text-[10px]" />
              Follow-up: {formatDate(conn.follow_up_date)} {overdue && '(Overdue)'}
            </p>
          )}
          {conn.notes && (
            <p className="text-gray-400 dark:text-gray-500 line-clamp-2 mt-1 italic">"{conn.notes}"</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-700/50">
          {isNTC && onMarkSent && (
            <button
              onClick={onMarkSent}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
            >
              <FaPaperPlane className="text-[10px]" /> Mark as Sent
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-2 rounded-xl text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            title="Edit"
          >
            <FaEdit className="text-sm" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title="Delete"
          >
            <FaTrash className="text-sm" />
          </button>
          {conn.linkedin_profile_id && (
            <a
              href={conn.linkedin_profile_id.startsWith('http') ? conn.linkedin_profile_id : `https://${conn.linkedin_profile_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              title="Open LinkedIn"
              onClick={e => e.stopPropagation()}
            >
              <FaExternalLinkAlt className="text-sm" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────

interface ConnectionRequestsProps {
  onNavigate: (tab: 'dashboard' | 'applications' | 'cold-messages' | 'connection-requests') => void;
}

export const ConnectionRequests = ({ onNavigate }: ConnectionRequestsProps) => {
  const [connections, setConnections] = useState<LinkedInConnection[]>([]);
  const [needToConnect, setNeedToConnect] = useState<LinkedInConnection[]>([]);
  const [stats, setStats] = useState<LinkedInConnectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConn, setEditingConn] = useState<LinkedInConnection | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [ntcCollapsed, setNtcCollapsed] = useState(false);
  // active stat card filter (for visual highlight)
  const [activeFilter, setActiveFilter] = useState<string>('all');

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

  const handleMarkSent = async (conn: LinkedInConnection) => {
    await connectionApi.update(conn.id, { stage: 'Requested', connection_status: 'Pending' });
    loadData();
  };

  // Stat card click → filter connections
  const handleStatClick = (status: string) => {
    setActiveFilter(status);
    if (status === 'all') {
      setFilterStatus('');
    } else if (status === 'ntc') {
      setFilterStatus('');
      setNtcCollapsed(false);
      setTimeout(() => document.getElementById('ntc-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } else {
      setFilterStatus(status);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterCategory('');
    setActiveFilter('all');
  };

  const hasFilters = search || filterStatus || filterCategory;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Connection Requests</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {connections.length} active · {needToConnect.length} need to connect
          </p>
        </div>
        <button
          onClick={() => { setEditingConn(undefined); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
        >
          <FaPlus /> Add Connection
        </button>
      </div>

      {/* ── Stat Cards (act as filters) ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

          {/* Need to Connect */}
          <div
            className={`relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer group border ${
              activeFilter === 'ntc'
                ? 'border-violet-400 dark:border-violet-500 ring-2 ring-violet-400/40 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-800/60 dark:to-purple-800/60'
                : 'border-violet-100/50 dark:border-violet-800/30 bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-900/40 dark:to-purple-900/40'
            }`}
            onClick={() => handleStatClick('ntc')}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-1 tracking-widest uppercase opacity-80">Need to Connect</p>
                <p className="text-4xl font-extrabold text-violet-600 dark:text-violet-400 mt-2">{stats.need_to_connect}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-300">
                <FaUserPlus className="text-white text-lg" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all"></div>
          </div>

          {/* Total */}
          <div
            className={`relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer group border ${
              activeFilter === 'all'
                ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/40 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-800/60 dark:to-indigo-800/60'
                : 'border-blue-100/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/40 dark:to-indigo-900/40'
            }`}
            onClick={() => handleStatClick('all')}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 tracking-widest uppercase opacity-80">Total</p>
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <FaUsers className="text-white text-lg" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          </div>

          {/* Pending */}
          <div
            className={`relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer group border ${
              activeFilter === 'Pending'
                ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/40 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-800/60 dark:to-yellow-800/60'
                : 'border-amber-100/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-900/40 dark:to-yellow-900/40'
            }`}
            onClick={() => handleStatClick('Pending')}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1 tracking-widest uppercase opacity-80">Pending</p>
                <p className="text-4xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">{stats.pending}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                <FaClock className="text-white text-lg" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          </div>

          {/* Accepted */}
          <div
            className={`relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer group border ${
              activeFilter === 'Accepted'
                ? 'border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-400/40 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-800/60 dark:to-green-800/60'
                : 'border-emerald-100/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/40 dark:to-green-900/40'
            }`}
            onClick={() => handleStatClick('Accepted')}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 tracking-widest uppercase opacity-80">Accepted</p>
                <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{stats.accepted}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                <FaCheckCircle className="text-white text-lg" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          </div>

          {/* Msg Sent */}
          <div
            className={`relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer group border border-sky-100/50 dark:border-sky-800/30 bg-gradient-to-br from-sky-50/80 to-blue-50/80 dark:from-sky-900/40 dark:to-blue-900/40`}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-sky-600 dark:text-sky-400 mb-1 tracking-widest uppercase opacity-80">Msg Sent</p>
                <p className="text-4xl font-extrabold text-sky-600 dark:text-sky-400 mt-2">{stats.cold_message_sent}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg shadow-sky-500/30 group-hover:scale-110 transition-transform duration-300">
                <FaPaperPlane className="text-white text-lg" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all"></div>
          </div>

          {/* Accept Rate */}
          <div className="relative overflow-hidden p-6 rounded-2xl border border-teal-100/50 dark:border-teal-800/30 bg-gradient-to-br from-teal-50/80 to-cyan-50/80 dark:from-teal-900/40 dark:to-cyan-900/40 group">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-1 tracking-widest uppercase opacity-80">Accept Rate</p>
                <p className="text-4xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
                  {stats.acceptance_rate}<span className="text-2xl ml-1">%</span>
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300">
                <FaLinkedin className="text-white text-lg" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-teal-500/10 rounded-full blur-2xl transition-all"></div>
          </div>

        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[220px] relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by name, company, LinkedIn…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-600 transition-all"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setActiveFilter(e.target.value || 'all'); }}
            className="px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Statuses</option>
            {CONNECTION_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Categories</option>
            {CONNECTION_CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
            >
              <FaTimes className="text-xs" /> Clear
            </button>
          )}
        </div>

        {/* Active filter indicator */}
        {(filterStatus || filterCategory) && (
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
            Filtering by: {[filterStatus, filterCategory].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* ── Need to Connect Section ── */}
      {needToConnect.length > 0 && (
        <div id="ntc-section" className="space-y-4 animate-slideUp">
          {/* Section header */}
          <div
            className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 cursor-pointer select-none shadow-lg shadow-violet-500/20"
            onClick={() => setNtcCollapsed(c => !c)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <FaUserPlus className="text-white text-sm" />
              </div>
              <div>
                <h3 className="font-bold text-white">Need to Connect</h3>
                <p className="text-xs text-violet-200">Contacts from job applications — not yet reached out</p>
              </div>
              <span className="ml-3 bg-white/25 text-white text-xs font-bold px-2.5 py-1 rounded-full">{needToConnect.length}</span>
            </div>
            <div className="text-white/80 hover:text-white transition-colors">
              {ntcCollapsed ? <FaChevronDown /> : <FaChevronUp />}
            </div>
          </div>

          {/* NTC Cards Grid */}
          {!ntcCollapsed && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {needToConnect.map(conn => (
                <ConnectionCard
                  key={conn.id}
                  conn={conn}
                  isNTC
                  onEdit={() => { setEditingConn(conn); setShowForm(true); }}
                  onDelete={() => handleDelete(conn.id)}
                  onMarkSent={() => handleMarkSent(conn)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Active Connections Grid ── */}
      <div className="space-y-4">
        {/* Section header */}
        {needToConnect.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <FaUsers className="text-white text-sm" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Active Connections</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Requests sent · tracking outreach progress</p>
            </div>
            <span className="ml-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full">{connections.length}</span>
          </div>
        )}

        {connections.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <FaUsers className="text-2xl text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {hasFilters ? 'No connections match your filters' : 'No connection requests yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              {hasFilters ? 'Try adjusting your search or filter criteria.' : 'Start tracking your LinkedIn outreach by adding a connection request.'}
            </p>
            {hasFilters ? (
              <button onClick={clearFilters} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors text-sm">
                Clear Filters
              </button>
            ) : (
              <button onClick={() => { setEditingConn(undefined); setShowForm(true); }} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium transition-all shadow-md text-sm flex items-center gap-2 mx-auto">
                <FaPlus className="text-xs" /> Add Your First Connection
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {connections.map(conn => (
              <ConnectionCard
                key={conn.id}
                conn={conn}
                onEdit={() => { setEditingConn(conn); setShowForm(true); }}
                onDelete={() => handleDelete(conn.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <ConnectionForm
          initialData={editingConn}
          onSuccess={() => { setShowForm(false); setEditingConn(undefined); loadData(); }}
          onCancel={() => { setShowForm(false); setEditingConn(undefined); }}
        />
      )}
    </div>
  );
};
