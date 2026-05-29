const express = require('express');
const router = express.Router();
const supabase = require('../db');

router.get('/', async (req, res) => {
  const { period } = req.query;
  let query = supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false });
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = `${today.slice(0, 7)}-01`;
  if (period === 'today') query = query.gte('created_at', `${today}T00:00:00`);
  else if (period === 'week') query = query.gte('created_at', weekAgo);
  else if (period === 'month') query = query.gte('created_at', monthStart);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(s => ({ ...s, items: s.sale_items })));
});

router.post('/', async (req, res) => {
  const { items, total, payment, utangName } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Walang items.' });
  const { data: sale, error: saleError } = await supabase.from('sales').insert({ total, payment }).select().single();
  if (saleError) return res.status(500).json({ error: saleError.message });
  const saleItems = items.map(item => ({ sale_id: sale.id, paninda_id: item.paninda_id || null, name: item.name, price: item.price, qty: item.qty, subtotal: item.subtotal }));
  await supabase.from('sale_items').insert(saleItems);
  for (const item of items) {
    if (item.paninda_id) await supabase.rpc('decrement_stock', { item_id: item.paninda_id, qty: item.qty });
  }
  if (payment === 'utang' && utangName) {
    const note = items.map(i => i.name).join(', ');
    const { data: existing } = await supabase.from('utangs').select('*').ilike('name', utangName).single();
    let utangId;
    if (existing) {
      await supabase.from('utangs').update({ amount: existing.amount + total }).eq('id', existing.id);
      utangId = existing.id;
    } else {
      const { data: newUtang } = await supabase.from('utangs').insert({ name: utangName, amount: total, paid: 0 }).select().single();
      utangId = newUtang.id;
    }
    await supabase.from('utang_history').insert({ utang_id: utangId, type: 'utang', amount: total, note });
  }
  res.json({ id: sale.id, success: true });
});

router.delete('/:id', async (req, res) => {
  await supabase.from('sale_items').delete().eq('sale_id', req.params.id);
  const { error } = await supabase.from('sales').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.post('/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'Walang pinili.' });
  await supabase.from('sale_items').delete().in('sale_id', ids);
  const { error } = await supabase.from('sales').delete().in('id', ids);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
