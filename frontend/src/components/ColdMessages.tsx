import { useState, useEffect, FormEvent } from 'react';
import { FaEnvelope, FaLinkedin, FaPlus, FaTimes, FaReply, FaChartPie, FaPaperPlane, FaChevronDown, FaChevronUp, FaTrash, FaEdit, FaSearch } from 'react-icons/fa';
import { ColdMessage, ColdMessageCreate, ColdMessageStats, COLD_VIA_OPTIONS, COLD_CATEGORY_OPTIONS } from '../types';
import { coldMessageApi } from '../services/api';

// ─── Add / Edit Form Modal ──────────────────────────────────────────

interface ColdMessageFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: ColdMessage;
}

const ColdMessageForm = ({ onSuccess, onCancel, initialData }: ColdMessageFormProps) => {
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
  });
  const [submitting, setSubmitting] = useState(false);

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
          {/* Contact Name + Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input type="text" name="contact_name" value={formData.contact_name} onChange={handleChange} required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                placeholder="e.g., John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company (optional)</label>
              <input type="text" name="company_name" value={formData.company_name || ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                placeholder="e.g., Google" />
            </div>
          </div>

          {/* Email + LinkedIn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" name="contact_email" value={formData.contact_email || ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                placeholder="contact@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <span className="flex items-center gap-1"><FaLinkedin className="text-blue-600" /> LinkedIn Profile</span>
              </label>
              <input type="url" name="contact_linkedin" value={formData.contact_linkedin || ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                placeholder="https://linkedin.com/in/..." />
            </div>
          </div>

          {/* Via + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Via <span className="text-red-500">*</span>
              </label>
              <select name="via" value={formData.via} onChange={handleChange} required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="">Select...</option>
                {COLD_VIA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select name="category" value={formData.category || ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="">Select...</option>
                {COLD_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Got Reply */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Sent</label>
              <input type="datetime-local" name="sent_date" value={formData.sent_date || ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auto-filled with current date & time</p>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject (optional)</label>
            <input type="text" name="subject" value={formData.subject || ''} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
              placeholder="e.g., Interested in SWE role at Google" />
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message Body</label>
            <textarea name="message_body" value={formData.message_body || ''} onChange={handleChange} rows={5}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-sm"
              placeholder="Paste the message you sent..." />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
              placeholder="Any personal notes..." />
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMsg, setEditingMsg] = useState<ColdMessage | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterVia, setFilterVia] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const loadData = async () => {
    try {
      const [msgs, st] = await Promise.all([
        coldMessageApi.getAll({
          search: search || undefined,
          via: filterVia || undefined,
          category: filterCategory || undefined,
        }),
        coldMessageApi.getStatistics(),
      ]);
      setMessages(msgs);
      setStats(st);
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
        <div className="space-y-3 animate-slideUp" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
          {messages.map(msg => (
            <div key={msg.id} className="glass-card rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{msg.contact_name}</h4>
                      {msg.company_name && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">@ {msg.company_name}</span>
                      )}
                      {msg.got_reply && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold">
                          <FaReply className="text-[10px]" /> Replied
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${getViaBadgeColor(msg.via)}`}>
                        {getViaIcon(msg.via)} {msg.via}
                      </span>
                      {msg.category && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getCategoryBadgeColor(msg.category)}`}>
                          {msg.category}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                        {formatDate(msg.sent_date)}
                      </span>
                    </div>

                    {msg.subject && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <strong>Subject:</strong> {msg.subject}
                      </p>
                    )}
                    {msg.contact_email && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">{msg.contact_email}</p>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { setEditingMsg(msg); setShowForm(true); }}
                      className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      title="Edit">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(msg.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete">
                      <FaTrash />
                    </button>
                    {msg.message_body && (
                      <button onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        title="Toggle message body">
                        {expandedId === msg.id ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable message body */}
                {expandedId === msg.id && msg.message_body && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Message</p>
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      {msg.message_body}
                    </pre>
                    {msg.notes && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{msg.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
