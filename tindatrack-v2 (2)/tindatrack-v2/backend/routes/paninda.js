const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../db');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('paninda').select('*').order('category', { ascending: true }).order('name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', upload.single('img'), async (req, res) => {
  const { name, price, stock, category } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Pangalan at presyo ang kailangan.' });

  let img = '';
  if (req.file) {
    const filename = `${Date.now()}-${req.file.originalname}`;
    const { error: uploadError } = await supabase.storage
      .from('paninda-images')
      .upload(filename, req.file.buffer, { contentType: req.file.mimetype });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('paninda-images').getPublicUrl(filename);
      img = urlData.publicUrl;
    }
  }

  const { data, error } = await supabase.from('paninda')
    .insert({ name, price: parseFloat(price), stock: parseInt(stock) || 0, img, category: category || 'Iba pa' })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/:id', upload.single('img'), async (req, res) => {
  const { name, price, stock, category } = req.body;
  const { data: existing, error: fetchError } = await supabase.from('paninda').select('*').eq('id', req.params.id).single();
  if (fetchError || !existing) return res.status(404).json({ error: 'Hindi mahanap.' });

  let img = existing.img;
  if (req.file) {
    const filename = `${Date.now()}-${req.file.originalname}`;
    const { error: uploadError } = await supabase.storage
      .from('paninda-images')
      .upload(filename, req.file.buffer, { contentType: req.file.mimetype });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('paninda-images').getPublicUrl(filename);
      img = urlData.publicUrl;
    }
  }

  const { data, error } = await supabase.from('paninda')
    .update({ name, price: parseFloat(price), stock: parseInt(stock) || 0, img, category: category || existing.category || 'Iba pa' })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('paninda').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.post('/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'Walang pinili.' });
  const { error } = await supabase.from('paninda').delete().in('id', ids);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, deleted: ids.length });
});

module.exports = router;
