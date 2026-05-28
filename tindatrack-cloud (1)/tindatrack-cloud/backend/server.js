require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*'
}));
app.use(express.json());

app.use('/api/paninda', require('./routes/paninda'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/utang', require('./routes/utang'));


app.get('/api/test', async (req, res) => {
  const { data, error } = await supabase.from('paninda').select('*');
  res.json({ data, error, url: process.env.SUPABASE_URL ? 'url_set' : 'url_missing', key: process.env.SUPABASE_SERVICE_KEY ? 'key_set' : 'key_missing' });
});
app.get('/api/dashboard', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = `${today.slice(0, 7)}-01`;

  const { data: todaySales } = await supabase.from('sales').select('total').gte('created_at', `${today}T00:00:00`);
  const { data: monthSales } = await supabase.from('sales').select('total').gte('created_at', monthStart);
  const { data: utangs } = await supabase.from('utangs').select('amount, paid');
  const { data: paninda } = await supabase.from('paninda').select('id');
  const { data: topItems } = await supabase.from('sale_items').select('name, qty').gte('created_at', monthStart);
  const { data: dueUtangs } = await supabase.from('utangs').select('name, amount, paid').filter('amount', 'gt', 0);

  const todayEarnings = (todaySales || []).reduce((s, r) => s + r.total, 0);
  const monthEarnings = (monthSales || []).reduce((s, r) => s + r.total, 0);
  const totalUtang = (utangs || []).reduce((s, r) => s + Math.max(0, r.amount - r.paid), 0);
  const panindaCount = (paninda || []).length;

  const qtyMap = {};
  for (const item of (topItems || [])) {
    qtyMap[item.name] = (qtyMap[item.name] || 0) + item.qty;
  }
  const topSellers = Object.entries(qtyMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, total_qty]) => ({ name, total_qty }));

  const due = (dueUtangs || []).filter(u => u.amount > u.paid)
    .map(u => ({ name: u.name, remaining: u.amount - u.paid }))
    .sort((a, b) => b.remaining - a.remaining).slice(0, 3);

                                   res.json({ todayEarnings, monthEarnings, totalUtang, panindaCount, topSellers, dueUtangs: due });
});

app.listen(PORT, () => console.log(`TindaTrack backend running on port ${PORT}`));
