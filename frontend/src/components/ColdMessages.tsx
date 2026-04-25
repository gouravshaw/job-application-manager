import React, { useState, useEffect, FormEvent } from 'react';

import {
  FaEnvelope, FaLinkedin, FaPlus, FaTimes, FaReply, FaChartPie,
  FaPaperPlane, FaTrash, FaEdit, FaSearch,
  FaUserPlus, FaLink, FaEye, FaBuilding, FaClock,
} from 'react-icons/fa';
import {
  ColdMessage, ColdMessageCreate, ColdMessageStats, COLD_VIA_OPTIONS,
  COLD_CATEGORY_OPTIONS, LinkedInConnection,
} from '../types';
import { coldMessageApi, connectionApi } from '../services/api';

// ─── Add / Edit Form Modal ──────────────────────────────────────────

interface ColdMessageFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: ColdMessage;
  connections: LinkedInConnection[];
}

const ColdMessageForm = ({ onSuccess, onCancel, initialData, connections }: ColdMessageFormProps) => {
  const [formData, setFormData] = useState<ColdMessageCreate>({
    contact_name: initialData?.contact_name || '',
    company_name: initialData?.company_name || '',
    contact_email: initialData?.contact_email || '',
    contact_linkedin: initialData?.contact_linkedin || '',
    via: initialData?.via || '',
    category: initialData?.category || '',
    subject: initialData?.subject || '',
    message_body: initialData?.message_body || '',
    sent_date: initialData?.sent_date ? new Date(initialData.sent_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    got_reply: initialData?.got_reply || false,
    notes: initialData?.notes || '',
    connection_id: initialData?.connection_id ?? undefined,
  });
  const [submitting, setSubmitting] = useState(false);

  // When a connection is selected, pre-fill name/company/category if empty
  const handleConnectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const connId = e.target.value ? Number(e.target.value) : undefined;
    setFormData(prev => {
      const conn = connections.find(c => c.id === connId);
      return {
        ...prev,
        connection_id: connId,
        contact_name: prev.contact_name || conn?.contact_name || prev.contact_name,
        company_name: prev.company_name || conn?.company_name || prev.company_name,
        category: prev.category || conn?.category || prev.category,
        contact_linkedin: prev.contact_linkedin || conn?.linkedin_profile_id || prev.contact_linkedin,
      };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (initialData) {
        await coldMessageApi.update(initialData.id, payload);
      } else {
        await coldMessageApi.create(payload);
      }
      onSuccess();
    } catch (err) {
      console.error('Error saving cold message:', err);
      alert('Failed to save cold message');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {initialData ? 'Edit Cold Message' : 'Add Cold Message'}
          </h2>
          <button onClick={onCancel} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* ── Link to Connection (optional) ── */}
          {connections.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                <FaLink className="text-sm" /> Link to a Connection Request (optional)
              </label>
              <select
                value={formData.connection_id ?? ''}
                onChange={handleConnectionChange}
                className={inputCls}
              >
                <option value="">— None (standalone message) —</option>
                {connections.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.contact_name}{c.company_name ? ` @ ${c.company_name}` : ''} [{c.connection_status}]
                  </option>
                ))}
              </select>
              {formData.connection_id && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 flex items-center gap-1">
                  <FaUserPlus className="text-[10px]" />
                  Saving will automatically mark that connection as "Cold Message Sent"
                </p>
              )}
            </div>
          )}

          {/* Contact Name + Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Contact Name <span className="text-red-500">*</span></label>
              <input type="text" name="contact_name" value={formData.contact_name} onChange={handleChange} required
                className={inputCls} placeholder="e.g., John Doe" />
            </div>
            <div>
              <label className={labelCls}>Company (optional)</label>
              <input type="text" name="company_name" value={formData.company_name || ''} onChange={handleChange}
                className={inputCls} placeholder="e.g., Google" />
            </div>
          </div>

          {/* Email + LinkedIn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" name="contact_email" value={formData.contact_email || ''} onChange={handleChange}
                className={inputCls} placeholder="contact@company.com" />
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1"><FaLinkedin className="text-blue-600" /> LinkedIn Profile</span></label>
              <input type="url" name="contact_linkedin" value={formData.contact_linkedin || ''} onChange={handleChange}
                className={inputCls} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>

          {/* Via + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Via <span className="text-red-500">*</span></label>
              <select name="via" value={formData.via} onChange={handleChange} required className={inputCls}>
                <option value="">Select...</option>
                {COLD_VIA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select name="category" value={formData.category || ''} onChange={handleChange} className={inputCls}>
                <option value="">Select...</option>
                {COLD_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Got Reply */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date Sent</label>
              <input type="datetime-local" name="sent_date" value={formData.sent_date || ''} onChange={handleChange}
                className={inputCls} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auto-filled with current date &amp; time</p>
            </div>
            <div className="flex items-end pb-1">
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, got_reply: !prev.got_reply }))}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${formData.got_reply
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                  : 'bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-green-300'
                  }`}>
                <span className="flex items-center gap-2">
                  <FaReply className={formData.got_reply ? 'text-green-500' : 'text-gray-400'} />
                  Got a reply?
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${formData.got_reply
                  ? 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400'
                  }`}>{formData.got_reply ? 'Yes' : 'No'}</span>
              </button>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className={labelCls}>Subject (optional)</label>
            <input type="text" name="subject" value={formData.subject || ''} onChange={handleChange}
              className={inputCls} placeholder="e.g., Interested in SWE role at Google" />
          </div>

          {/* Message Body */}
          <div>
            <label className={labelCls}>Message Body</label>
            <textarea name="message_body" value={formData.message_body || ''} onChange={handleChange} rows={5}
              className={`${inputCls} font-mono text-sm`} placeholder="Paste the message you sent..." />
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2}
              className={inputCls} placeholder="Any personal notes..." />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel}
              className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium disabled:opacity-50 transition-all flex items-center gap-2">
              <FaPaperPlane /> {submitting ? 'Saving...' : (initialData ? 'Update' : 'Add Cold Message')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ─── Main Cold Messages Dashboard ────────────────────────────────────

export const ColdMessages = () => {
  const [messages, setMessages] = useState<ColdMessage[]>([]);
  const [stats, setStats] = useState<ColdMessageStats | null>(null);
  const [connections, setConnections] = useState<LinkedInConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMsg, setEditingMsg] = useState<ColdMessage | undefined>(undefined);
  const [selectedMsg, setSelectedMsg] = useState<ColdMessage | null>(null);
  const [search, setSearch] = useState('');
  const [filterVia, setFilterVia] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Lookup map: connection_id → connection name display
  const connMap = Object.fromEntries(connections.map(c => [c.id, c]));

  const loadData = async () => {
    try {
      const [msgs, st, conns] = await Promise.all([
        coldMessageApi.getAll({
          search: search || undefined,
          via: filterVia || undefined,
          category: filterCategory || undefined,
        }),
        coldMessageApi.getStatistics(),
        connectionApi.getAll(),
      ]);
      setMessages(msgs);
      setStats(st);
      setConnections(conns);
    } catch (err) {
      console.error('Error loading cold messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [search, filterVia, filterCategory]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this cold message?')) return;
    await coldMessageApi.delete(id);
    loadData();
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingMsg(undefined);
    loadData();
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getViaIcon = (via: string) => {
    if (via === 'Email') return <FaEnvelope className="text-indigo-500" />;
    if (via === 'LinkedIn Message') return <FaLinkedin className="text-blue-600" />;
    return <FaPaperPlane className="text-gray-500" />;
  };

  const getViaBadgeColor = (via: string) => {
    if (via === 'Email') return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300';
    if (via === 'LinkedIn Message') return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
  };

  const getCategoryBadgeColor = (cat?: string) => {
    const colors: { [k: string]: string } = {
      'Employee': 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
      'Hiring Manager': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
      'Recruiter': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      'Other': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    };
    return colors[cat || ''] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Form Modal */}
      {showForm && (
        <ColdMessageForm
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditingMsg(undefined); }}
          initialData={editingMsg}
          connections={connections}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Cold Messages</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your cold outreach and follow-ups</p>
        </div>
        <button onClick={() => { setEditingMsg(undefined); setShowForm(true); }}
          className="flex items-center gap-2 btn-primary transition-all">
          <FaPlus /> Add Cold Message
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Sent */}
          <div className="relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl border border-indigo-100/50 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/40 dark:to-purple-900/40 backdrop-blur-md group animate-slideUp"
            style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1 tracking-wide uppercase opacity-80">Total Sent</p>
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                <FaPaperPlane className="text-white text-xl" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          </div>

          {/* By Via — Email */}
          <div className="relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl border border-blue-100/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/40 dark:to-indigo-900/40 backdrop-blur-md group animate-slideUp"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1 tracking-wide uppercase opacity-80">Via Email</p>
                <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">{stats.by_via['Email'] || 0}</p>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <FaEnvelope className="text-white text-xl" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          </div>

          {/* By Via — LinkedIn */}
          <div className="relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl border border-cyan-100/50 dark:border-cyan-800/30 bg-gradient-to-br from-cyan-50/80 to-blue-50/80 dark:from-cyan-900/40 dark:to-blue-900/40 backdrop-blur-md group animate-slideUp"
            style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mb-1 tracking-wide uppercase opacity-80">Via LinkedIn</p>
                <p className="text-4xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-2">{stats.by_via['LinkedIn Message'] || 0}</p>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                <FaLinkedin className="text-white text-xl" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
          </div>

          {/* Reply Rate */}
          <div className="relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl border border-emerald-100/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/40 dark:to-green-900/40 backdrop-blur-md group animate-slideUp"
            style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1 tracking-wide uppercase opacity-80">Reply Rate</p>
                <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                  {stats.reply_rate}<span className="text-2xl ml-1">%</span>
                </p>
              </div>
              <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                <FaReply className="text-white text-xl" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {stats && Object.keys(stats.by_category).length > 0 && (
        <div className="glass-card p-6 rounded-2xl animate-slideUp" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md">
              <FaChartPie className="text-lg text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Messages by Category</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.by_category).map(([cat, count]) => (
              <div key={cat}
                className={`p-5 rounded-xl ${getCategoryBadgeColor(cat)} cursor-pointer hover:scale-105 transition-transform shadow-sm hover:shadow-md`}
                onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-80">{cat}</p>
                <p className="text-3xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="glass-card p-4 rounded-2xl animate-slideUp" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, company, subject..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400" />
          </div>
          <select value={filterVia} onChange={e => setFilterVia(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
            <option value="">All Channels</option>
            {COLD_VIA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
            <option value="">All Categories</option>
            {COLD_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <FaEnvelope className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No cold messages yet</h3>
          <p className="text-gray-400 dark:text-gray-500 mb-6">Start tracking your outreach by adding your first cold message</p>
          <button onClick={() => { setEditingMsg(undefined); setShowForm(true); }}
            className="inline-flex items-center gap-2 btn-primary">
            <FaPlus /> Add Cold Message
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-slideUp" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
          {messages.map(msg => {
            return (
              <div 
                key={msg.id} 
                onClick={() => setSelectedMsg(msg)}
                className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl p-5 flex flex-col cursor-pointer h-full border-l-4"
                style={{ borderLeftColor: msg.got_reply ? '#22c55e' : (msg.via === 'Email' ? '#6366f1' : '#3b82f6') }}
              >
                <div className="flex-1 flex flex-col">
                  {/* Header: Name and Company */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{msg.contact_name}</h3>
                    {msg.company_name && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
                        <FaBuilding className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">{msg.company_name}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${getViaBadgeColor(msg.via)}`}>
                        {getViaIcon(msg.via)} {msg.via}
                      </span>
                      {msg.got_reply && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold shadow-sm">
                          <FaReply className="text-[10px]" /> Replied
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date and Subject */}
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 px-2.5 py-1.5 rounded-lg w-fit">
                      <FaClock className="text-xs flex-shrink-0 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium">Sent: {formatDate(msg.sent_date)}</span>
                    </div>

                    {msg.subject && (
                      <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mt-2">
                        <span className="font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider block mb-0.5">Subject</span>
                        {msg.subject}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100/50 dark:border-gray-700/50 mt-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelectedMsg(msg)}
                    className="flex-1 flex items-center justify-center gap-1.5 btn-secondary text-sm" title="View details">
                    <FaEye className="text-blue-500" /> View
                  </button>
                  <button onClick={() => { setEditingMsg(msg); setShowForm(true); }}
                    className="flex items-center justify-center gap-1.5 btn-secondary text-sm px-3" title="Edit">
                    <FaEdit className="text-indigo-500" />
                  </button>
                  <button onClick={() => handleDelete(msg.id)}
                    className="flex items-center justify-center gap-1.5 btn-secondary text-sm px-3 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800" title="Delete">
                    <FaTrash className="text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedMsg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMsg(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6 flex justify-between items-start z-10">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedMsg.contact_name}</h2>
                <div className="flex items-center gap-3 mb-1">
                  {selectedMsg.company_name && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FaBuilding />
                      <span className="font-medium">{selectedMsg.company_name}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedMsg(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status and Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium ${getViaBadgeColor(selectedMsg.via)}`}>
                  {getViaIcon(selectedMsg.via)} {selectedMsg.via}
                </span>
                {selectedMsg.category && (
                  <span className={`px-3 py-1.5 rounded-full font-medium ${getCategoryBadgeColor(selectedMsg.category)}`}>
                    {selectedMsg.category}
                  </span>
                )}
                {selectedMsg.got_reply && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold border border-green-200 dark:border-green-800">
                    <FaReply /> Replied
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-slate-600">
                  <FaClock /> Sent: {formatDate(selectedMsg.sent_date)}
                </span>
              </div>

              {/* Linked Connection */}
              {selectedMsg.connection_id && connMap[selectedMsg.connection_id] && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Linked Connection</h3>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                      <FaUserPlus />
                      <span className="font-medium">{connMap[selectedMsg.connection_id].contact_name}</span>
                    </div>
                    {connMap[selectedMsg.connection_id].linkedin_profile_id && (
                      <a href={connMap[selectedMsg.connection_id].linkedin_profile_id} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline">
                        <FaLinkedin /> View Profile
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {(selectedMsg.contact_email || selectedMsg.contact_linkedin) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Contact Info</h3>
                  <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {selectedMsg.contact_email && (
                      <div className="flex items-center gap-2">
                        <FaEnvelope className="text-gray-400" />
                        <a href={`mailto:${selectedMsg.contact_email}`} className="text-blue-600 hover:underline text-sm">{selectedMsg.contact_email}</a>
                      </div>
                    )}
                    {selectedMsg.contact_linkedin && (
                      <div className="flex items-center gap-2">
                        <FaLinkedin className="text-gray-400" />
                        <a href={selectedMsg.contact_linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">LinkedIn Profile</a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message Details */}
              {selectedMsg.subject && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Subject</h3>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-200 font-medium">
                    {selectedMsg.subject}
                  </div>
                </div>
              )}

              {selectedMsg.message_body && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Message Body</h3>
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-lg p-4 max-h-80 overflow-y-auto">
                    {selectedMsg.message_body}
                  </pre>
                </div>
              )}

              {/* Notes */}
              {selectedMsg.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Notes</h3>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-lg">
                    <p className="text-sm text-yellow-900 dark:text-yellow-200 whitespace-pre-wrap">{selectedMsg.notes}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-slate-700 p-4 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800 rounded-b-xl">
              <button onClick={() => { setSelectedMsg(null); setEditingMsg(selectedMsg); setShowForm(true); }}
                className="px-4 py-2 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium">
                <FaEdit /> Edit
              </button>
              <button onClick={() => setSelectedMsg(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
