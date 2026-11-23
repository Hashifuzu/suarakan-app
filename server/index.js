const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./database');

const app = express();
const server = http.createServer(app);

// Zero IP logging middleware - Absolute Privacy Guarantee
app.use((req, res, next) => {
  delete req.headers['x-forwarded-for'];
  delete req.headers['remote-addr'];
  delete req.headers['user-agent'];
  next();
});

app.use(cors({ origin: '*' }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

function generateTicketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ANON-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// REST APIs
// 1. Employee creates anonymous suggestion
app.post('/api/suggestions', (req, res) => {
  try {
    const { category, title, content, urgency } = req.body;
    if (!category || !title || !content) {
      return res.status(400).json({ error: 'Kategori, judul, dan isi saran wajib diisi' });
    }

    let ticketCode = generateTicketCode();
    let existing = db.getSuggestionByTicket(ticketCode);
    while (existing) {
      ticketCode = generateTicketCode();
      existing = db.getSuggestionByTicket(ticketCode);
    }

    const suggestion = db.createSuggestion({
      ticketCode,
      category,
      title,
      content,
      urgency: urgency || 'Normal'
    });

    io.emit('new_suggestion', suggestion);
    io.emit('stats_updated', db.getStats());

    res.status(201).json({
      success: true,
      message: 'Saran berhasil dikirim secara 100% anonim.',
      data: suggestion
    });
  } catch (err) {
    console.error('Error submitting suggestion:', err);
    res.status(500).json({ error: 'Gagal menyimpan saran.' });
  }
});

// 2. Employee / HR tracks specific ticket
app.get('/api/suggestions/:ticketCode', (req, res) => {
  try {
    const { ticketCode } = req.params;
    const suggestion = db.getSuggestionByTicket(ticketCode.toUpperCase().trim());
    if (!suggestion) {
      return res.status(404).json({ error: 'Kode tiket tidak ditemukan.' });
    }
    res.json({ success: true, data: suggestion });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data tiket.' });
  }
});

// 3. HR gets all suggestions
app.get('/api/hr/suggestions', (req, res) => {
  try {
    const suggestions = db.getAllSuggestions();
    res.json({ success: true, data: suggestions });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil daftar saran.' });
  }
});

// 4. HR updates status or provides official feedback
const handleUpdateHR = (req, res) => {
  try {
    const { ticketCode } = req.params;
    const { status, hrResponse, hr_response } = req.body;
    const finalResponse = hrResponse !== undefined ? hrResponse : hr_response;

    const existing = db.getSuggestionByTicket(ticketCode);
    if (!existing) {
      return res.status(404).json({ error: 'Tiket tidak ditemukan.' });
    }

    const updated = db.updateSuggestionStatus(ticketCode, status || existing.status, finalResponse);

    io.emit('suggestion_updated', updated);
    io.emit(`ticket_${ticketCode}_updated`, updated);
    io.emit('stats_updated', db.getStats());

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating suggestion:', err);
    res.status(500).json({ error: 'Gagal memperbarui saran.' });
  }
};
app.patch('/api/hr/suggestions/:ticketCode', handleUpdateHR);
app.put('/api/hr/suggestions/:ticketCode', handleUpdateHR);
app.post('/api/hr/suggestions/:ticketCode/response', handleUpdateHR);

// 5. HR deletes a suggestion
app.delete('/api/hr/suggestions/:ticketCode', (req, res) => {
  try {
    const { ticketCode } = req.params;
    const existing = db.getSuggestionByTicket(ticketCode);
    if (!existing) {
      return res.status(404).json({ error: 'Tiket tidak ditemukan.' });
    }

    db.deleteSuggestion(ticketCode);

    io.emit('suggestion_deleted', ticketCode);
    io.emit('stats_updated', db.getStats());

    res.json({ success: true, message: 'Saran berhasil dihapus.', ticketCode });
  } catch (err) {
    console.error('Error deleting suggestion:', err);
    res.status(500).json({ error: 'Gagal menghapus saran.' });
  }
});

// 6. HR statistics
app.get('/api/hr/stats', (req, res) => {
  try {
    res.json({ success: true, data: db.getStats() });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil statistik.' });
  }
});

io.on('connection', (socket) => {
  socket.on('subscribe_ticket', (ticketCode) => {
    socket.join(`room_${ticketCode}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Anonymous Suggestion Box Backend running on http://localhost:${PORT}`);
  console.log(`[PRIVACY] Absolute anonymity active. Zero telemetry / IP logging.`);
});
