const express = require('express');
const router = express.Router();
const supabase = require('../db');

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('utangs')
    .select('*, utang_history(*)')
    .filter('amount', 'gt', supabase.rpc)
    .order('created_at', { ascending: false });

  // Manual filter: amount > paid
  const { data: all, error: err2 } = await supabase.from('utangs')
    .select('*, utang_history(*)').order('created_at', { ascending: false });
  if (err2) return res.status(500).json({ error: err2.message });

  const filtered = all.filter(u => u.amount > u.paid).map(u => ({
    ...u,
    history: u.utang_history
  }));
  res.json(filtered);
});

router.post('/', async (req, res) => {
  const { name, amount, note } = req.body;
  if (!name || !amount) return res.status(400).json({ error: 'Pangalan at halaga ang kailangan.' });

  const { data: existing } = await supabase.from('utangs').select('*').ilike('name', name).single();
  let utangId;
  if (existing) {
    await supabase.from('utangs').update({ amount: existing.amount + parseFloat(amount) }).eq('id', existing.id);
    utangId = existing.id;
  } else {
    const { data: newU } = await supabase.from('utangs').insert({ name, amount: parseFloat(amount), paid: 0 }).select().single();
    utangId = newU.id;
  }
  await supabase.from('utang_history').insert({ utang_id: utangId, type: 'utang', amount: parseFloat(amount), note: note || '' });

  const { data } = await supabase.from('utangs').select('*').eq('id', utangId).single();
  res.json(data);
});

router.post('/:id/pay', async (req, res) => {
  const { amount } = req.body;
  const { data: utang } = await supabase.from('utangs').select('*').eq('id', req.params.id).single();
  if (!utang) return res.status(404).json({ error: 'Hindi mahanap.' });

  const pay = Math.min(parseFloat(amount), utang.amount - utang.paid);
  await supabase.from('utangs').update({ paid: utang.paid + pay }).eq('id', utang.id);
  await supabase.from('utang_history').insert({ utang_id: utang.id, type: 'bayad', amount: pay, note: '' });
  res.json({ success: true, paid: pay });
});

module.exports = router;
