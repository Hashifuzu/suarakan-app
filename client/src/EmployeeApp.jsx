import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Send, Search, Copy, Check, Lock, Building2, 
  HeartHandshake, Briefcase, HelpCircle, Inbox,
  ShieldCheck, X, Trash2, CornerDownRight, ArrowLeft,
  Flame, AlertTriangle, Sparkles, RefreshCw
} from 'lucide-react';
import { socket, API_BASE_URL } from './socket';

const CATEGORIES = [
  { id: 'Fasilitas & Ruang Kerja', label: 'FASILITAS', sub: 'Workspace / Tools', icon: Building2 },
  { id: 'Budaya Kerja & Suasana', label: 'BUDAYA KERJA', sub: 'Team / Atmosphere', icon: HeartHandshake },
  { id: 'Manajemen & Kebijakan', label: 'KEBIJAKAN', sub: 'Rules / Management', icon: Briefcase },
  { id: 'Lainnya & Inovasi', label: 'INOVASI & IDE', sub: 'Ideas / Misc', icon: HelpCircle }
];

const URGENCIES = [
  { id: 'Low', label: 'RENDAH', desc: 'Saran Santai', color: 'bg-zinc-800 text-zinc-300' },
  { id: 'Normal', label: 'SEDANG', desc: 'Perlu Perhatian', color: 'bg-cyan-500 text-black font-black' },
  { id: 'Urgent', label: 'MENDESAK', desc: 'Prioritas Tinggi', color: 'bg-[#0072ff] text-white font-black' }
];

export default function EmployeeApp() {
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [urgency, setUrgency] = useState('Normal');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Discreet Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [copied, setCopied] = useState(false);

  // Manual Token Search inside Drawer
  const [searchCode, setSearchCode] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Local storage history
  const [myTickets, setMyTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('anon_my_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveTicketToHistory = (item) => {
    setMyTickets((prev) => {
      const updated = [item, ...prev.filter((t) => t.ticket_code !== item.ticket_code)];
      localStorage.setItem('anon_my_tickets', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setSelectedTicket(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleUpdate = (updated) => {
      setMyTickets((prev) =>
        prev.map((t) => (t.ticket_code === updated.ticket_code ? updated : t))
      );
      if (selectedTicket && selectedTicket.ticket_code === updated.ticket_code) {
        setSelectedTicket(updated);
      } else {
        setHasUnread(true);
      }
    };

    socket.on('suggestion_updated', handleUpdate);
    return () => socket.off('suggestion_updated', handleUpdate);
  }, [selectedTicket]);

  const fireP3Confetti = () => {
    confetti({
      particleCount: 85,
      spread: 110,
      origin: { y: 0.6 },
      colors: ['#0072ff', '#00d2ff', '#ffffff', '#001a40']
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, content, urgency })
      });
      const data = await res.json();
      if (data.success) {
        saveTicketToHistory(data.data);
        setSubmittedTicket(data.data);
        fireP3Confetti();
        setTitle('');
        setContent('');
      }
    } catch {
      alert('Koneksi ke server gagal!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchTicket = async (code) => {
    const query = code.trim().toUpperCase();
    if (!query) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const res = await fetch(`${API_BASE_URL}/suggestions/${query}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(data.data);
        saveTicketToHistory(data.data);
        setSearchCode('');
      } else {
        setSearchError('KODE TIKET TIDAK DITEMUKAN');
      }
    } catch {
      setSearchError('Koneksi terputus.');
    } finally {
      setIsSearching(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const clearHistory = () => {
    if (confirm('Hapus seluruh riwayat tiket di perangkat ini?')) {
      localStorage.removeItem('anon_my_tickets');
      setMyTickets([]);
      setSelectedTicket(null);
      setHasUnread(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-white flex flex-col font-sans relative overflow-x-hidden p5-dots select-none">
      {/* Background Persona 3 Cool Blue Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0072ff]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-[#00d2ff]/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-32 h-[120%] bg-[#0072ff]/5 -rotate-12 transform origin-top pointer-events-none" />
      </div>

      {/* TOP BAR: Header SUARAKAN */}
      <header className="h-16 border-b-4 border-black bg-[#0072ff] px-3 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <motion.div 
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex items-center gap-2 sm:gap-3 overflow-hidden"
        >
          <div className="bg-black text-[#00d2ff] px-2.5 sm:px-3.5 py-1 font-black text-xs sm:text-base uppercase tracking-wider -rotate-2 border-2 border-white shadow-[2px_2px_0px_#000] shrink-0">
            SUARAKAN
          </div>
          <div className="hidden sm:block font-black text-xs md:text-sm tracking-tight uppercase italic text-black drop-shadow-[1px_1px_0px_#fff] truncate">
            SISTEM USULAN & ASPIRASI RAHASIA KARYAWAN
          </div>
        </motion.div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 bg-black text-[#00d2ff] px-2.5 py-1 text-xs font-mono -rotate-1 border border-white/40">
            <ShieldCheck className="w-4 h-4 text-[#0072ff]" />
            <span className="font-bold tracking-wider">ZERO-IP-TRACE</span>
          </div>

          {/* Discreet History Button */}
          <motion.button
            whileHover={{ scale: 1.05, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsDrawerOpen(true);
              setHasUnread(false);
            }}
            className="relative px-2.5 sm:px-3.5 py-1.5 bg-black text-white hover:bg-white hover:text-black transition-colors font-black text-[11px] sm:text-xs uppercase tracking-wider border-2 border-white shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
          >
            <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>RIWAYAT</span>

            {/* Glowing Unread Dot */}
            {hasUnread && (
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white text-[#0072ff] border-2 border-black flex items-center justify-center text-[10px] font-black animate-ping">
                !
              </span>
            )}
          </motion.button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-3 sm:px-6 py-6 md:py-12 flex flex-col justify-center relative z-10 pb-16">
        <AnimatePresence mode="wait">
          {submittedTicket ? (
            /* SUCCESS CARD STATE */
            <motion.div
              key="success"
              initial={{ scale: 0.9, rotate: -3, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="bg-black border-2 sm:border-4 border-white p-4 sm:p-8 p5-shadow relative text-center"
            >
              <div className="inline-block bg-[#0072ff] text-white px-3 sm:px-6 py-1 font-black text-[10px] sm:text-xs uppercase tracking-widest -rotate-2 border-2 border-black shadow-[2px_2px_0px_#fff] mb-4">
                SUARA ANDA TELAH TERSAMPAIKAN!
              </div>

              <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tighter italic text-white mb-2">
                ASPIRASI BERHASIL DIKIRIM!
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto mb-5 leading-relaxed">
                Identitas Anda tetap 100% anonim dan aman. Simpan kode tiket berikut untuk melacak respon manajemen:
              </p>

              {/* Secret Token Box */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-[#0072ff] text-white border-2 border-white px-4 sm:px-6 py-3 -rotate-1 shadow-[3px_3px_0px_#fff] mb-6 max-w-sm mx-auto"
              >
                <span className="font-mono text-xl sm:text-2xl font-black tracking-widest drop-shadow-[2px_2px_0px_#000]">
                  {submittedTicket.ticket_code}
                </span>
                <button
                  onClick={() => copyCode(submittedTicket.ticket_code)}
                  className="bg-black hover:bg-white hover:text-black text-white px-3 py-1 text-xs font-black uppercase transition-colors border border-white flex items-center gap-1.5 w-full sm:w-auto justify-center"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-cyan-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'TERSALIN' : 'SALIN'}
                </button>
              </motion.div>

              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedTicket(submittedTicket);
                    setIsDrawerOpen(true);
                    setSubmittedTicket(null);
                  }}
                  className="px-4 py-2.5 bg-white text-black font-black text-xs uppercase tracking-wider border-2 border-black hover:bg-zinc-200 transition-colors shadow-[2px_2px_0px_#0072ff]"
                >
                  PANTAU STATUS TIKET
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSubmittedTicket(null)}
                  className="px-4 py-2.5 bg-[#0072ff] text-white font-black text-xs uppercase tracking-wider border-2 border-white hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_#000]"
                >
                  KIRIM ASPIRASI LAIN
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* DYNAMIC FORM */
            <motion.div
              key="form"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="bg-black border-2 sm:border-4 border-white p-4 sm:p-8 p5-shadow relative"
            >
              <div className="inline-block bg-[#0072ff] text-white px-2.5 sm:px-4 py-1 font-black text-[10px] sm:text-xs tracking-wider uppercase -rotate-2 border-2 border-black shadow-[2px_2px_0px_#fff] mb-2">
                SUARAKAN // RUANG ASPIRASI BEBAS
              </div>

              <div className="mb-4 sm:mb-6 pt-1">
                <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tighter italic text-white">
                  SUARAKAN ASPIRASI ANDA
                </h1>
                <p className="text-zinc-400 text-xs font-medium mt-0.5">
                  Sistem ini tidak merekam IP address maupun identitas Anda. Bebas bersuara demi kemajuan bersama.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Kategori Grid */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#0072ff] mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#0072ff]"></span> 1. PILIH KATEGORI
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CATEGORIES.map((cat, idx) => {
                      const Icon = cat.icon;
                      const active = category === cat.id;
                      return (
                        <motion.button
                          type="button"
                          key={cat.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCategory(cat.id)}
                          className={`p-2.5 text-left border-2 transition-all relative overflow-hidden ${
                            active
                              ? 'bg-[#0072ff] text-white border-white shadow-[2px_2px_0px_#fff]'
                              : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-cyan-500'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${active ? 'text-black' : 'text-[#0072ff]'}`} />
                            <span className="font-black text-xs uppercase tracking-tight">{cat.label}</span>
                          </div>
                          <div className={`text-[10px] mt-0.5 truncate ${active ? 'text-white/90' : 'text-zinc-500'}`}>
                            {cat.sub}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Tingkat Urgensi */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#0072ff] mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#0072ff]"></span> 2. TINGKAT URGENSI
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {URGENCIES.map((u) => {
                      const active = urgency === u.id;
                      return (
                        <motion.button
                          type="button"
                          key={u.id}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setUrgency(u.id)}
                          className={`py-2 px-3 text-center border-2 transition-all ${
                            active
                              ? `${u.color} border-white shadow-[3px_3px_0px_#fff]`
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-500'
                          }`}
                        >
                          <div className="font-black text-xs tracking-wider">{u.label}</div>
                          <div className="text-[9px] opacity-80 uppercase">{u.desc}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Judul Saran */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-300 mb-1.5">
                    3. TOPIK MASUKAN
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Usulan Penyesuaian Suhu AC di Ruang Kerja..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 px-3.5 bg-zinc-950 border-2 border-zinc-700 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#0072ff] focus:shadow-[3px_3px_0px_#0072ff] transition-all font-medium"
                  />
                </div>

                {/* 4. Isi Saran */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-300 mb-1.5">
                    4. URAIAN DETAIL & USULAN SOLUSI
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Jelaskan kondisi saat ini, dampak yang dirasakan, dan ide solusi yang disarankan..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-3.5 bg-zinc-950 border-2 border-zinc-700 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#0072ff] focus:shadow-[3px_3px_0px_#0072ff] transition-all font-medium resize-none leading-relaxed"
                  />
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-12 sm:h-13 bg-[#0072ff] hover:bg-blue-600 disabled:opacity-50 text-white font-black text-xs sm:text-base uppercase tracking-wider border-2 border-white shadow-[3px_3px_0px_#fff] flex items-center justify-center gap-2 sm:gap-3 transition-colors px-2"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span className="truncate">SUARAKAN SEKARANG (ANONIM)</span>
                        <Send className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* DISCREET SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1" 
              onClick={() => {
                setIsDrawerOpen(false);
                setSelectedTicket(null);
              }} 
            />

            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 25 }}
              className="w-full sm:max-w-md bg-[#0a111e] border-l-2 sm:border-l-4 border-[#0072ff] h-full flex flex-col shadow-2xl relative z-10"
            >
              {/* Drawer Top Header */}
              <div className="h-16 border-b-2 border-zinc-800 bg-black px-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {selectedTicket && (
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="p-1.5 bg-[#0072ff] text-white hover:bg-white hover:text-black transition-colors mr-1 border border-white"
                      title="Kembali"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <span className="font-black text-sm tracking-tight text-white uppercase italic">
                    {selectedTicket ? 'DETAIL TIKET RAHASIA' : 'ARSIP TIKET DISKRET'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase bg-zinc-900 px-2 py-0.5 border border-zinc-800">
                    ESC TO CLOSE
                  </span>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setSelectedTicket(null);
                    }}
                    className="p-1 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedTicket ? (
                  /* Detail view inside drawer */
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-black border-2 border-white p5-shadow space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="font-mono text-base font-black text-[#0072ff]">
                          {selectedTicket.ticket_code}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-black uppercase ${
                          selectedTicket.status === 'Resolved'
                            ? 'bg-emerald-400 text-black'
                            : selectedTicket.status === 'In Review'
                            ? 'bg-cyan-400 text-black'
                            : selectedTicket.status === 'Rejected'
                            ? 'bg-zinc-700 text-white'
                            : 'bg-[#0072ff] text-white'
                        }`}>
                          {selectedTicket.status}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-zinc-400">
                        {selectedTicket.category} • {new Date(selectedTicket.created_at).toLocaleString('id-ID')}
                      </div>

                      <div className="text-sm font-black text-white italic">
                        {selectedTicket.title}
                      </div>
                    </div>

                    {/* Isi Masukan */}
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#0072ff] block mb-1">
                        ISI SARAN KAMU:
                      </span>
                      <div className="p-4 bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {selectedTicket.content}
                      </div>
                    </div>

                    {/* Respon Resmi HR */}
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 block mb-1 flex items-center gap-1">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        TANGGAPAN RESMI HR:
                      </span>

                      {selectedTicket.hr_response ? (
                        <div className="p-4 bg-[#0d1829] border-2 border-cyan-400/80 text-xs text-white space-y-2">
                          <p className="leading-relaxed whitespace-pre-wrap font-medium">
                            {selectedTicket.hr_response}
                          </p>
                          <div className="text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
                            Waktu Balas: {new Date(selectedTicket.hr_responded_at || selectedTicket.updated_at).toLocaleString('id-ID')}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-zinc-950 border border-dashed border-zinc-800 text-xs text-zinc-500 italic">
                          Saran ini sudah masuk ke antrean evaluasi tim HR.
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* Discrete Token List */
                  <div className="space-y-4">
                    {/* Quick Code Search */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSearchTicket(searchCode);
                      }}
                      className="relative"
                    >
                      <input
                        type="text"
                        placeholder="CARI TOKEN RAHASIA (MISAL: ANON-9X2A)..."
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                        className="w-full h-10 pl-3 pr-10 bg-black border-2 border-zinc-700 text-xs font-mono uppercase text-white placeholder:text-zinc-600 outline-none focus:border-[#0072ff]"
                      />
                      <button 
                        type="submit" 
                        disabled={isSearching}
                        className="absolute right-1 top-1 h-8 px-2 bg-[#0072ff] text-white flex items-center justify-center"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </form>

                    {searchError && (
                      <div className="text-xs font-mono text-[#0072ff] bg-blue-950/40 p-2 border border-blue-900">
                        {searchError}
                      </div>
                    )}

                    <div className="text-xs font-black uppercase tracking-wider text-zinc-400 pt-2">
                      TIKET DISKRET KAMU ({myTickets.length})
                    </div>

                    {myTickets.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800">
                        Belum ada tiket tersimpan di perangkat ini.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {myTickets.map((t) => (
                          <motion.div
                            key={t.ticket_code}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedTicket(t)}
                            className="p-3 bg-black border-2 border-zinc-800 hover:border-[#0072ff] cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <span className="font-mono text-xs font-black text-white">
                                {t.ticket_code}
                              </span>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                {new Date(t.created_at).toLocaleDateString('id-ID')}
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${
                              t.status === 'Resolved'
                                ? 'bg-emerald-400 text-black'
                                : t.status === 'In Review'
                                ? 'bg-cyan-400 text-black'
                                : t.status === 'Rejected'
                                ? 'bg-zinc-700 text-white'
                                : 'bg-[#0072ff] text-white'
                            }`}>
                              {t.status}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t-2 border-zinc-800 bg-black flex items-center justify-between shrink-0">
                <span className="text-[10px] font-mono text-zinc-500">
                  LOKAL // ZERO IP
                </span>
                {myTickets.length > 0 && !selectedTicket && (
                  <button
                    onClick={clearHistory}
                    className="px-3 py-1 bg-rose-950 text-rose-400 hover:bg-rose-900 border border-rose-800 text-xs font-black uppercase flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>HAPUS SEMUA</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
