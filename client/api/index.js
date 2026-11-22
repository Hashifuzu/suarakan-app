const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use((req, res, next) => {
  delete req.headers['x-forwarded-for'];
  delete req.headers['remote-addr'];
  delete req.headers['user-agent'];
  next();
});

app.use(cors({ origin: '*' }));
app.use(express.json());

function generateTicketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ANON-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const router = express.Router();

router.post('/suggestions', (req, res) => {
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

router.get('/suggestions/:ticketCode', (req, res) => {
  try {
    const { ticketCode } = req.params;
    const suggestion = db.getSuggestionByTicket(ticketCode);
    if (!suggestion) {
      return res.status(404).json({ error: 'Kode tiket tidak ditemukan.' });
    }
    res.json({ success: true, data: suggestion });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data tiket.' });
  }
});

router.get('/hr/suggestions', (req, res) => {
  try {
    const suggestions = db.getAllSuggestions();
    res.json({ success: true, data: suggestions });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil daftar saran.' });
  }
});

router.patch('/hr/suggestions/:ticketCode', (req, res) => {
  try {
    const { ticketCode } = req.params;
    const { status, hrResponse } = req.body;
    const existing = db.getSuggestionByTicket(ticketCode);
    if (!existing) {
      return res.status(404).json({ error: 'Tiket tidak ditemukan.' });
    }
    const updated = db.updateSuggestionStatus(ticketCode, status || existing.status, hrResponse);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating suggestion:', err);
    res.status(500).json({ error: 'Gagal memperbarui saran.' });
  }
});

router.delete('/hr/suggestions/:ticketCode', (req, res) => {
  try {
    const { ticketCode } = req.params;
    const existing = db.getSuggestionByTicket(ticketCode);
    if (!existing) {
      return res.status(404).json({ error: 'Tiket tidak ditemukan.' });
    }
    db.deleteSuggestion(ticketCode);
    res.json({ success: true, message: 'Saran berhasil dihapus.', ticketCode });
  } catch (err) {
    console.error('Error deleting suggestion:', err);
    res.status(500).json({ error: 'Gagal menghapus saran.' });
  }
});

router.get('/hr/stats', (req, res) => {
  try {
    res.json({ success: true, data: db.getStats() });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil statistik.' });
  }
});

app.use('/api', router);
app.use('/', router);

module.exports = app;
