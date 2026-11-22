import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Inbox, CheckCircle2, Clock, AlertTriangle, 
  Search, RefreshCw, Send, Check, XCircle, ChevronDown,
  Filter, MessageSquare, Shield, Tag, ArrowUpRight,
  Flame, Zap, Trash2
} from 'lucide-react';
import { socket, API_BASE_URL } from './socket';

export default function HRDashboard() {
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState({ total: 0, submitted: 0, inReview: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Response Form State
  const [responseStatus, setResponseStatus] = useState('In Review');
  const [responseText, setResponseText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updateNotice, setUpdateNotice] = useState(false);

  const fetchData = async () => {
    try {
      const [sugRes, statRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hr/suggestions`),
        fetch(`${API_BASE_URL}/hr/stats`)
      ]);
      const sugData = await sugRes.json();
      const statData = await statRes.json();

      if (sugData.success) {
        setSuggestions(sugData.data);
        if (sugData.data.length > 0 && !selectedTicket) {
          selectTicket(sugData.data[0]);
        }
      }
      if (statData.success) {
        setStats(statData.data);
      }
    } catch (err) {
      console.error('Failed to load HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleNew = (newSuggestion) => {
      setSuggestions(prev => [newSuggestion, ...prev]);
    };

    const handleUpdate = (updated) => {
      setSuggestions(prev => prev.map(s => s.ticket_code === updated.ticket_code ? updated : s));
      setSelectedTicket(prev => prev && prev.ticket_code === updated.ticket_code ? updated : prev);
    };

    const handleDelete = (deletedTicketCode) => {
      setSuggestions(prev => prev.filter(s => s.ticket_code !== deletedTicketCode));
      setSelectedTicket(prev => prev && prev.ticket_code === deletedTicketCode ? null : prev);
    };

    const handleStats = (newStats) => {
      setStats(newStats);
    };

    socket.on('new_suggestion', handleNew);
    socket.on('suggestion_updated', handleUpdate);
    socket.on('suggestion_deleted', handleDelete);
    socket.on('stats_updated', handleStats);

    return () => {
      socket.off('new_suggestion', handleNew);
      socket.off('suggestion_updated', handleUpdate);
      socket.off('suggestion_deleted', handleDelete);
      socket.off('stats_updated', handleStats);
    };
  }, []);

  const selectTicket = (item) => {
    setSelectedTicket(item);
    setResponseStatus(item.status || 'In Review');
    setResponseText(item.hr_response || '');
    setUpdateNotice(false);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/hr/suggestions/${selectedTicket.ticket_code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: responseStatus,
          hrResponse: responseText.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(data.data);
        setUpdateNotice(true);
        setTimeout(() => setUpdateNotice(false), 2000);
      }
    } catch {
      alert('Gagal memperbarui status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSuggestion = async () => {
    if (!selectedTicket) return;
    const confirmDelete = window.confirm(`HAPUS PERMANEN saran "${selectedTicket.ticket_code} - ${selectedTicket.title}"? Tindakan ini tidak bisa dibatalkan.`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/hr/suggestions/${selectedTicket.ticket_code}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(null);
      } else {
        alert(data.error || 'Gagal menghapus saran');
      }
    } catch {
      alert('Koneksi ke server gagal');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSuggestions = suggestions.filter(item => {
    const matchCategory = filterCategory === 'ALL' || item.category === filterCategory;
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchSearch = searchQuery === '' || 
      item.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchStatus && matchSearch;
  });

  return (
    <div className="h-screen w-screen bg-[#060c16] text-white flex flex-col font-sans overflow-hidden select-none p5-dots">
      {/* Top Navbar */}
      <header className="h-14 border-b-4 border-black bg-[#0072ff] px-6 flex items-center justify-between shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="bg-black text-[#00d2ff] px-2.5 py-0.5 text-xs font-black uppercase -rotate-2 border border-white">
            HR CONSOLE
          </div>
          <span className="font-black text-lg text-black uppercase italic drop-shadow-[1px_1px_0px_#fff]">
            EVALUATION RADAR // RELOAD
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, rotate: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="h-8 px-3.5 bg-black text-white hover:bg-white hover:text-black font-black text-xs uppercase tracking-wider border-2 border-white flex items-center gap-2 transition-colors shadow-[2px_2px_0px_#000]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>SYNC DATABASE</span>
        </motion.button>
      </header>

      {/* 3-Column Persona 3 Cobalt Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLUMN 1: Slanted Filters Sidebar */}
        <aside className="w-64 border-r-2 border-zinc-800 bg-[#08101e] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">
            {/* Status Filter */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#0072ff] mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#0072ff]"></span> FILTER STATUS
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'ALL', label: 'SEMUA SARAN', count: stats.total },
                  { id: 'Submitted', label: 'BELUM DITINJAU', count: stats.submitted },
                  { id: 'In Review', label: 'SEDANG DITINJAU', count: stats.inReview },
                  { id: 'Resolved', label: 'SELESAI / EKSEKUSI', count: stats.resolved },
                  { id: 'Rejected', label: 'DITUTUP / BATAL', count: stats.rejected }
                ].map((s) => (
                  <motion.button
                    key={s.id}
                    whileHover={{ x: 4 }}
                    onClick={() => setFilterStatus(s.id)}
                    className={`w-full py-2 px-3 border transition-all flex items-center justify-between ${
                      filterStatus === s.id
                        ? 'bg-[#0072ff] text-white border-white font-black shadow-[3px_3px_0px_#fff]'
                        : 'bg-black text-zinc-400 border-zinc-800 hover:border-cyan-500'
                    }`}
                  >
                    <span className="text-[11px] font-bold">{s.label}</span>
                    <span className="font-mono text-xs font-black px-1.5 bg-black/40 text-white border border-white/20">
                      {s.count}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#0072ff] mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#0072ff]"></span> KATEGORI BIDANG
              </div>
              <div className="space-y-1 text-xs">
                {[
                  { id: 'ALL', label: 'SEMUA KATEGORI' },
                  { id: 'Fasilitas & Ruang Kerja', label: 'FASILITAS' },
                  { id: 'Budaya Kerja & Suasana', label: 'BUDAYA KERJA' },
                  { id: 'Manajemen & Kebijakan', label: 'KEBIJAKAN' },
                  { id: 'Lainnya & Inovasi', label: 'INOVASI & IDE' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFilterCategory(c.id)}
                    className={`w-full py-1.5 px-3 text-left font-black text-xs transition-colors border ${
                      filterCategory === c.id
                        ? 'bg-white text-black border-black shadow-[2px_2px_0px_#0072ff]'
                        : 'bg-transparent text-zinc-500 border-transparent hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-zinc-600 border-t border-zinc-800 pt-3">
            SQLITE SECURE RUNTIME // ZERO IP
          </div>
        </aside>

        {/* COLUMN 2: Suggestions List */}
        <section className="w-80 md:w-96 border-r-2 border-zinc-800 bg-[#0e1726] flex flex-col shrink-0">
          {/* Search Box */}
          <div className="p-3 border-b-2 border-zinc-800 bg-black">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="CARI KATA KUNCI / TOKEN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-zinc-950 border border-zinc-700 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#0072ff] font-medium"
              />
            </div>
          </div>

          {/* List of cards */}
          <div className="flex-1 overflow-y-auto divide-y-2 divide-zinc-900">
            {filteredSuggestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-600 font-bold">
                TIDAK ADA DATA YANG COCOK.
              </div>
            ) : (
              filteredSuggestions.map((item) => {
                const isSelected = selectedTicket && selectedTicket.ticket_code === item.ticket_code;
                return (
                  <motion.div
                    key={item.ticket_code}
                    whileHover={{ x: 4 }}
                    onClick={() => selectTicket(item)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#0072ff] text-white border-l-4 border-l-white'
                        : 'hover:bg-zinc-900/60 border-l-4 border-l-transparent text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-mono text-xs font-black ${isSelected ? 'text-black bg-white px-1.5 py-0.2' : 'text-[#0072ff]'}`}>
                        {item.ticket_code}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase ${
                        item.status === 'Resolved'
                          ? 'bg-emerald-400 text-black'
                          : item.status === 'In Review'
                          ? 'bg-cyan-300 text-black'
                          : item.status === 'Rejected'
                          ? 'bg-zinc-800 text-white'
                          : isSelected ? 'bg-black text-white' : 'bg-[#0072ff] text-white'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h4 className="font-black text-sm uppercase tracking-tight line-clamp-1 mb-1">
                      {item.title}
                    </h4>

                    <p className={`line-clamp-2 text-xs leading-relaxed mb-2 ${isSelected ? 'text-white/90' : 'text-zinc-400'}`}>
                      {item.content}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono opacity-70">
                      <span className="truncate max-w-[140px]">{item.category}</span>
                      <span>{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>

        {/* COLUMN 3: Detail & Action Panel */}
        <main className="flex-1 bg-black overflow-y-auto p-6 md:p-8 flex flex-col justify-between relative">
          {selectedTicket ? (
            <motion.div 
              key={selectedTicket.ticket_code}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl w-full space-y-6"
            >
              {/* Card Header */}
              <div className="border-b-4 border-zinc-800 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-white bg-[#0072ff] px-3 py-1 border border-white">
                      {selectedTicket.ticket_code}
                    </span>
                    <span className="text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-800 font-black uppercase text-zinc-300">
                      {selectedTicket.category}
                    </span>
                    <span className={`text-xs px-2.5 py-1 font-black uppercase ${
                      selectedTicket.urgency === 'Urgent'
                        ? 'bg-cyan-500 text-black'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      URGENSI: {selectedTicket.urgency === 'Urgent' ? 'MENDESAK' : selectedTicket.urgency === 'Low' ? 'RENDAH' : 'SEDANG'}
                    </span>
                  </div>

                  {/* Top Action: Delete Button */}
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-mono text-zinc-500">
                      {new Date(selectedTicket.created_at).toLocaleString('id-ID')}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isDeleting}
                      onClick={handleDeleteSuggestion}
                      className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 text-xs font-black uppercase flex items-center gap-1.5 transition-colors"
                      title="Hapus saran ini dari database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeleting ? 'MENGHAPUS...' : 'HAPUS SARAN'}</span>
                    </motion.button>
                  </div>
                </div>

                <h2 className="text-2xl font-black uppercase tracking-tight italic text-white mt-3">
                  {selectedTicket.title}
                </h2>
              </div>

              {/* Uraian Masukan */}
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#0072ff] block mb-2">
                  ISI SARAN KARYAWAN:
                </span>
                <div className="p-5 bg-zinc-950 border-2 border-zinc-800 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedTicket.content}
                </div>
              </div>

              {/* Form Balasan & Tindak Lanjut */}
              <form onSubmit={handleUpdateStatus} className="pt-4 border-t-2 border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#0072ff]" /> TINDAK LANJUT RESMI HR
                  </span>
                  {updateNotice && (
                    <span className="text-xs font-mono text-cyan-400 flex items-center gap-1 font-bold">
                      <Check className="w-4 h-4" /> RESPON TERSIMPAN!
                    </span>
                  )}
                </div>

                {/* Status Toggle Grid */}
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    UPDATE STATUS PENANGANAN
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'Submitted', label: 'BARU MASUK' },
                      { id: 'In Review', label: 'SEDANG DITINJAU' },
                      { id: 'Resolved', label: 'SELESAI / DITERAPKAN' },
                      { id: 'Rejected', label: 'DITOLAK / ARSIP' }
                    ].map((s) => (
                      <motion.button
                        type="button"
                        key={s.id}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setResponseStatus(s.id)}
                        className={`h-9 text-xs font-black uppercase border-2 transition-all ${
                          responseStatus === s.id
                            ? 'bg-[#0072ff] text-white border-white shadow-[3px_3px_0px_#fff]'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-cyan-500'
                        }`}
                      >
                        {s.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Balasan Teks */}
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    BALASAN RESMI KARYAWAN (DILIHAT LEWAT TIKET)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tuliskan respon resmi, langkah evaluasi, atau estimasi penyelesaian..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="w-full p-3.5 bg-zinc-950 border-2 border-zinc-700 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#0072ff] font-medium resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <motion.button
                    type="submit"
                    disabled={isUpdating}
                    whileHover={{ scale: 1.03, rotate: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="h-12 px-6 bg-[#0072ff] hover:bg-blue-600 text-white font-black text-sm uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_#fff] flex items-center gap-2 transition-colors"
                  >
                    {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>KIRIM TANGGAPAN RESMI</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          ) : (
            <div className="text-center text-zinc-600 my-auto font-black text-sm uppercase">
              PILIH TIKET DI SEBELAH KIRI UNTUK MEMULAI REVIEW.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
