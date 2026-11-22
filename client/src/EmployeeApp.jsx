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
  { id: 'Low', label: 'RENDAH', desc: 'Saran Santai' },
  { id: 'Normal', label: 'SEDANG', desc: 'Perlu Perhatian' },
  { id: 'Urgent', label: 'MENDESAK', desc: 'Prioritas Tinggi' }
];

export default function EmployeeApp({ navigateTo, currentView = 'employee' }) {
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
      colors: ['#0066FF', '#00d2ff', '#ffffff', '#001a40']
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
      } else {
        alert(data.error || 'Gagal mengirim saran.');
      }
    } catch {
      alert('Koneksi ke server gagal! Pastikan jaringan Anda terhubung.');
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
      {/* Dynamic Animated Background Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Animated Flowing Diagonal Stripes */}
        <div className="absolute inset-0 p5-stripes-animated opacity-60" />

        {/* Ambient Floating Glow Orbs */}
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-[#0066FF]/25 rounded-full blur-[90px]"
        />

        <motion.div
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 60, -40, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-[#00d2ff]/15 rounded-full blur-[100px]"
        />

        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, 40, -30, 0],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/3 w-[350px] h-[350px] bg-[#0055c4]/20 rounded-full blur-[80px]"
        />

        {/* Slanted Kinetic Graphic Beam */}
        <motion.div 
          animate={{
            x: ["-10%", "10%", "-10%"],
            opacity: [0.04, 0.08, 0.04]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 right-1/4 w-40 h-[150%] bg-gradient-to-b from-[#00d2ff] via-[#0066FF] to-transparent -rotate-12 transform origin-top pointer-events-none" 
        />
      </div>

      {/* TOP BAR: Header SUARAKAN */}
      <header className="h-16 border-b-4 border-[#0B0E14] bg-[#0066FF] px-3 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <motion.div 
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex items-center gap-2 sm:gap-4 overflow-hidden"
        >
          <div className="bg-[#0B0E14] text-[#00d2ff] px-2.5 sm:px-3.5 py-1 font-black text-xs sm:text-base uppercase tracking-wider -rotate-2 border-2 border-white shadow-[2px_2px_0px_#000] shrink-0">
            SUARAKAN
          </div>
          {/* Requirement 1: Clean solid white text, no outline / drop-shadow */}
          <div className="hidden sm:block font-bold text-xs md:text-sm tracking-widest uppercase font-mono text-white truncate">
            SISTEM USULAN & ASPIRASI RAHASIA KARYAWAN
          </div>
        </motion.div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Requirement 4: Sleek Integrated View Switcher HUD in Navbar */}
          {navigateTo && (
            <div className="flex items-center bg-[#0B0E14] border-2 border-white p-0.5 -rotate-2 shadow-[2px_2px_0px_#000]">
              <button
                type="button"
                onClick={() => navigateTo('employee')}
                className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${
                  currentView === 'employee'
                    ? 'bg-[#0066FF] text-white shadow-[1px_1px_0px_#000]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                KARYAWAN
              </button>
              <button
                type="button"
                onClick={() => navigateTo('hr')}
                className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${
                  currentView === 'hr'
                    ? 'bg-[#0066FF] text-white shadow-[1px_1px_0px_#000]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                HR CONSOLE
              </button>
            </div>
          )}

          {/* Discreet History Button */}
          <motion.button
            whileHover={{ scale: 1.04, rotate: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setIsDrawerOpen(true);
              setHasUnread(false);
            }}
            className="relative px-2.5 sm:px-3.5 py-1.5 bg-[#0B0E14] text-white hover:bg-white hover:text-[#0B0E14] transition-colors font-black text-[11px] sm:text-xs uppercase tracking-wider border-2 border-white shadow-[2px_2px_0px_#000] flex items-center gap-1.5 -rotate-2"
          >
            <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-sans">RIWAYAT</span>

            {/* Glowing Unread Dot */}
            {hasUnread && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[#0066FF] border-2 border-[#0B0E14] flex items-center justify-center text-[10px] font-black animate-ping">
                !
              </span>
            )}
          </motion.button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-3 sm:px-6 py-8 md:py-14 flex flex-col justify-center relative z-10 pb-20">
        <AnimatePresence mode="wait">
          {submittedTicket ? (
            /* SUCCESS CARD STATE */
            <motion.div
              key="success"
              initial={{ scale: 0.92, rotate: -2, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="bg-[#0B0E14] border-2 sm:border-4 border-[#E5E7EB] p-6 sm:p-10 shadow-[6px_6px_0px_#0066FF] relative text-center"
            >
              <div className="inline-block bg-[#0066FF] text-white px-3 sm:px-6 py-1 font-black text-[10px] sm:text-xs uppercase tracking-widest -rotate-2 border-2 border-black shadow-[2px_2px_0px_#fff] mb-4">
                SUARA ANDA TELAH TERSAMPAIKAN!
              </div>

              <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tighter italic text-white mb-2">
                ASPIRASI BERHASIL DIKIRIM!
              </h2>
              <p className="text-[#9CA3AF] text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
                Identitas Anda tetap 100% anonim dan aman. Simpan kode tiket rahasia berikut untuk melacak respon dari pihak manajemen:
              </p>

              {/* Secret Token Box */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-[#0066FF] text-white border-2 border-white px-5 sm:px-7 py-3.5 -rotate-2 shadow-[4px_4px_0px_#fff] mb-6 max-w-sm mx-auto"
              >
                <span className="font-mono text-xl sm:text-2xl font-black tracking-widest drop-shadow-[2px_2px_0px_#000]">
                  {submittedTicket.ticket_code}
                </span>
                <button
                  type="button"
                  onClick={() => copyCode(submittedTicket.ticket_code)}
                  className="bg-[#0B0E14] hover:bg-white hover:text-[#0B0E14] text-white px-3.5 py-1 text-xs font-black uppercase transition-colors border border-white flex items-center gap-1.5 w-full sm:w-auto justify-center cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-cyan-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'TERSALIN' : 'SALIN'}
                </button>
              </motion.div>

              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTicket(submittedTicket);
                    setIsDrawerOpen(true);
                    setSubmittedTicket(null);
                  }}
                  className="px-5 py-2.5 bg-white text-[#0B0E14] font-black text-xs uppercase tracking-wider border-2 border-[#0B0E14] hover:bg-zinc-200 transition-colors shadow-[2px_2px_0px_#0066FF] cursor-pointer"
                >
                  PANTAU STATUS TIKET
                </button>
                <button
                  type="button"
                  onClick={() => setSubmittedTicket(null)}
                  className="px-5 py-2.5 bg-[#0066FF] text-white font-black text-xs uppercase tracking-wider border-2 border-white hover:bg-blue-600 transition-colors shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  KIRIM ASPIRASI LAIN
                </button>
              </div>
            </motion.div>
          ) : (
            /* DYNAMIC FORM (Requirement 3: Deep Charcoal #0B0E14, border #E5E7EB 2px, p-6 sm:p-10) */
            <motion.div
              key="form"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="bg-[#0B0E14] border-2 border-[#E5E7EB] p-6 sm:p-10 shadow-[6px_6px_0px_#0066FF] relative"
            >
              {/* Badge: angle exactly -2deg */}
              <div className="inline-block bg-[#0066FF] text-white px-3 sm:px-4 py-1 font-black text-[10px] sm:text-xs tracking-wider uppercase -rotate-2 border-2 border-black shadow-[2px_2px_0px_#fff] mb-3">
                SUARAKAN // RUANG ASPIRASI BEBAS
              </div>

              <div className="mb-6 sm:mb-8 pt-1">
                <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tighter italic text-white">
                  SUARAKAN ASPIRASI ANDA
                </h1>
                <p className="text-[#9CA3AF] text-xs font-medium mt-1 leading-relaxed">
                  Sistem ini tidak merekam IP address maupun identitas Anda. Bebas bersuara demi kemajuan bersama.
                </p>
              </div>

              {/* Requirement 3: Spacing between sections widened to space-y-8 sm:space-y-9 */}
              <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-9">
                {/* 1. Kategori Grid */}
                <div>
                  {/* Requirement 1: Unified step header (badge + solid white text) */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-5 bg-[#0066FF] text-white text-[11px] font-black flex items-center justify-center font-mono -rotate-2 border border-white/30 shadow-[1px_1px_0px_#000]">
                      1
                    </span>
                    <label className="text-xs font-black uppercase tracking-wider text-white font-sans">
                      PILIH KATEGORI
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const active = category === cat.id;
                      return (
                        <motion.button
                          type="button"
                          key={cat.id}
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => setCategory(cat.id)}
                          /* Requirement 2: Active state border 2px solid #0066FF, bg rgba(0,102,255,0.18), text white */
                          className={`p-3 text-left border-2 transition-all relative overflow-hidden cursor-pointer ${
                            active
                              ? 'border-[#0066FF] bg-[#0066FF]/[0.18] text-white shadow-[2px_2px_0px_#0066FF]'
                              : 'bg-[#050b14] text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#0066FF]' : 'text-zinc-400'}`} />
                            <span className="font-black text-xs uppercase tracking-tight text-white">{cat.label}</span>
                          </div>
                          {/* Requirement 1: sub-text contrast increased to #9CA3AF */}
                          <div className={`text-[11px] mt-1 pl-6.5 truncate ${active ? 'text-zinc-200' : 'text-[#9CA3AF]'}`}>
                            {cat.sub}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Tingkat Urgensi */}
                <div>
                  {/* Requirement 1: Unified step header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-5 bg-[#0066FF] text-white text-[11px] font-black flex items-center justify-center font-mono -rotate-2 border border-white/30 shadow-[1px_1px_0px_#000]">
                      2
                    </span>
                    <label className="text-xs font-black uppercase tracking-wider text-white font-sans">
                      TINGKAT URGENSI
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {URGENCIES.map((u) => {
                      const active = urgency === u.id;
                      return (
                        <motion.button
                          type="button"
                          key={u.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setUrgency(u.id)}
                          /* Requirement 2: Active state border 2px solid #0066FF, bg rgba(0,102,255,0.18), text white */
                          className={`py-2.5 px-3 text-center border-2 transition-all cursor-pointer ${
                            active
                              ? 'border-[#0066FF] bg-[#0066FF]/[0.18] text-white shadow-[2px_2px_0px_#0066FF]'
                              : 'bg-[#050b14] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="font-black text-xs tracking-wider text-white">{u.label}</div>
                          {/* Requirement 1: Contrast #9CA3AF */}
                          <div className={`text-[10px] uppercase mt-0.5 ${active ? 'text-zinc-200' : 'text-[#9CA3AF]'}`}>
                            {u.desc}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Judul Saran */}
                <div>
                  {/* Requirement 1: Unified step header */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-5 h-5 bg-[#0066FF] text-white text-[11px] font-black flex items-center justify-center font-mono -rotate-2 border border-white/30 shadow-[1px_1px_0px_#000]">
                      3
                    </span>
                    <label className="text-xs font-black uppercase tracking-wider text-white font-sans">
                      TOPIK MASUKAN
                    </label>
                  </div>
                  {/* Requirement 1: placeholder contrast increased to #9CA3AF */}
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Usulan Penyesuaian Suhu AC di Ruang Kerja..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 px-3.5 bg-[#050b14] border-2 border-zinc-700 text-sm text-white placeholder:text-[#9CA3AF] outline-none focus:border-[#0066FF] focus:shadow-[3px_3px_0px_#0066FF] transition-all font-medium"
                  />
                </div>

                {/* 4. Isi Saran */}
                <div>
                  {/* Requirement 1: Unified step header */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-5 h-5 bg-[#0066FF] text-white text-[11px] font-black flex items-center justify-center font-mono -rotate-2 border border-white/30 shadow-[1px_1px_0px_#000]">
                      4
                    </span>
                    <label className="text-xs font-black uppercase tracking-wider text-white font-sans">
                      URAIAN DETAIL & USULAN SOLUSI
                    </label>
                  </div>
                  {/* Requirement 1: placeholder contrast increased to #9CA3AF */}
                  <textarea
                    required
                    rows={5}
                    placeholder="Jelaskan kondisi saat ini, dampak yang dirasakan, dan ide solusi yang disarankan..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-3.5 bg-[#050b14] border-2 border-zinc-700 text-sm text-white placeholder:text-[#9CA3AF] outline-none focus:border-[#0066FF] focus:shadow-[3px_3px_0px_#0066FF] transition-all font-medium resize-none leading-relaxed"
                  />
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-13 sm:h-14 bg-[#FFFFFF] hover:bg-zinc-100 disabled:opacity-50 text-[#0B0E14] font-black text-xs sm:text-base uppercase tracking-wider border-2 border-white shadow-[4px_4px_0px_#0066FF] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0066FF] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#0066FF] transition-all flex items-center justify-center gap-2 sm:gap-3 px-3 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-[#0066FF]" />
                    ) : (
                      <>
                        <span className="truncate">SUARAKAN SEKARANG (ANONIM)</span>
                        <Send className="w-4 h-4 sm:w-5 sm:h-5 text-[#0066FF] shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* DISCREET SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
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
              className="w-full sm:max-w-md bg-[#0B0E14] border-l-2 sm:border-l-4 border-[#0066FF] h-full flex flex-col shadow-2xl relative z-10"
            >
              {/* Drawer Top Header */}
              <div className="h-16 border-b-2 border-zinc-800 bg-[#050b14] px-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {selectedTicket && (
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="p-1.5 bg-[#0066FF] text-white hover:bg-white hover:text-[#0B0E14] transition-colors mr-1 border border-white cursor-pointer"
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
                  <span className="text-[10px] font-mono text-zinc-500 uppercase bg-[#050b14] px-2 py-0.5 border border-zinc-800">
                    ESC TO CLOSE
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setSelectedTicket(null);
                    }}
                    className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedTicket ? (
                  /* Detail Ticket View */
                  <div className="space-y-4">
                    <div className="bg-[#050b14] p-4 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-zinc-400">KODE TIKET</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm font-black text-white">{selectedTicket.ticket_code}</span>
                          <button
                            type="button"
                            onClick={() => copyCode(selectedTicket.ticket_code)}
                            className="p-1 text-zinc-400 hover:text-white"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-900 pt-2">
                        <span className="text-xs text-zinc-400">STATUS TINDAK LANJUT</span>
                        <span className={`px-2 py-0.5 text-xs font-black uppercase ${
                          selectedTicket.status === 'Resolved'
                            ? 'bg-emerald-400 text-black'
                            : selectedTicket.status === 'In Review'
                            ? 'bg-cyan-400 text-black'
                            : selectedTicket.status === 'Rejected'
                            ? 'bg-zinc-700 text-white'
                            : 'bg-[#0066FF] text-white'
                        }`}>
                          {selectedTicket.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-900 pt-2 text-xs">
                        <span className="text-zinc-400">KATEGORI</span>
                        <span className="font-bold text-zinc-200">{selectedTicket.category}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="bg-[#050b14] p-4 border border-zinc-800 space-y-2">
                      <div className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                        TOPIK ASPIRASI
                      </div>
                      <div className="text-sm font-bold text-white">{selectedTicket.title}</div>
                      <div className="text-xs text-[#9CA3AF] leading-relaxed pt-1 whitespace-pre-wrap">
                        {selectedTicket.content}
                      </div>
                    </div>

                    {/* Official Response */}
                    <div className="bg-[#050b14] p-4 border-2 border-[#0066FF] space-y-2 relative">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#00d2ff]">
                        <CornerDownRight className="w-4 h-4" />
                        <span>RESPON RESMI MANAJEMEN / HR</span>
                      </div>
                      {selectedTicket.hr_response ? (
                        <div>
                          <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                            {selectedTicket.hr_response}
                          </p>
                          {selectedTicket.hr_responded_at && (
                            <div className="text-[10px] text-zinc-500 font-mono mt-2">
                              Dijawab pada: {new Date(selectedTicket.hr_responded_at).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500 italic py-2">
                          Belum ada catatan atau tanggapan resmi dari tim manajemen.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* List of Stored Tickets & Search */
                  <div className="space-y-4">
                    {/* Manual Ticket Search Input */}
                    <div className="space-y-2">
                      <div className="text-xs font-black uppercase tracking-wider text-zinc-400">
                        CARI TIKET MANUAL
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Masukkan Kode Tiket (Contoh: ANON-X84J)..."
                          value={searchCode}
                          onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchTicket(searchCode)}
                          className="flex-1 h-9 px-3 bg-[#050b14] border border-zinc-800 text-xs text-white placeholder:text-zinc-600 font-mono outline-none focus:border-[#0066FF]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSearchTicket(searchCode)}
                          disabled={isSearching}
                          className="h-9 px-3 bg-[#0066FF] hover:bg-blue-600 text-white font-black text-xs uppercase flex items-center gap-1 cursor-pointer"
                        >
                          {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {searchError && (
                        <div className="text-[11px] font-bold text-rose-400 font-mono">
                          {searchError}
                        </div>
                      )}
                    </div>

                    {/* Stored Tickets List */}
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
                            className="p-3 bg-[#050b14] border-2 border-zinc-800 hover:border-[#0066FF] cursor-pointer flex items-center justify-between text-xs transition-colors"
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
                                : 'bg-[#0066FF] text-white'
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
              <div className="p-4 border-t-2 border-zinc-800 bg-[#050b14] flex items-center justify-between shrink-0">
                <span className="text-[10px] font-mono text-zinc-500">
                  LOKAL // ZERO IP
                </span>
                {myTickets.length > 0 && !selectedTicket && (
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="px-3 py-1 bg-rose-950 text-rose-400 hover:bg-rose-900 border border-rose-800 text-xs font-black uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
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
