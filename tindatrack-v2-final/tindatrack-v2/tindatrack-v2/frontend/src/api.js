import { supabase } from './supabase'

// Compress image before upload (max 800px, ~150KB)
const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 800
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.75)
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
})



// PANINDA
export const getPaninda = async () => {
  const { data, error } = await supabase.from('paninda').select('*').order('name')
  if (error) throw error
  return data
}

export const addPaninda = async ({ name, price, stock, category, imgFile }) => {
  let img = ''
  if (imgFile) {
    const compressed = await compressImage(imgFile)
    const filename = `${Date.now()}-${compressed.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.jpg`
    const { error: uploadError } = await supabase.storage.from('paninda-images').upload(filename, compressed)
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('paninda-images').getPublicUrl(filename)
      img = urlData.publicUrl
    }
  }
  const { data, error } = await supabase.from('paninda').insert({ name, price: parseFloat(price), stock: parseInt(stock) || 0, img, category: category || 'Iba Pa' }).select().single()
  if (error) throw error
  return data
}

export const updatePaninda = async (id, { name, price, stock, category, imgFile, existingImg }) => {
  let img = existingImg || ''
  if (imgFile) {
    const compressed = await compressImage(imgFile)
    const filename = `${Date.now()}-${compressed.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.jpg`
    const { error: uploadError } = await supabase.storage.from('paninda-images').upload(filename, compressed)
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('paninda-images').getPublicUrl(filename)
      img = urlData.publicUrl
    }
  }
  const { data, error } = await supabase.from('paninda').update({ name, price: parseFloat(price), stock: parseInt(stock) || 0, img, category: category || 'Iba Pa' }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deletePaninda = async (id) => {
  const { error } = await supabase.from('paninda').delete().eq('id', id)
  if (error) throw error
}

// SALES
export const getSales = async (period) => {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = `${today.slice(0, 7)}-01`

  let query = supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false })
  if (period === 'today') query = query.gte('created_at', `${today}T00:00:00`)
  else if (period === 'week') query = query.gte('created_at', weekAgo)
  else if (period === 'month') query = query.gte('created_at', monthStart)

  const { data, error } = await query
  if (error) throw error
  return data.map(s => ({ ...s, items: s.sale_items }))
}

export const addSale = async ({ items, total, payment, utangName }) => {
  const { data: sale, error: saleError } = await supabase.from('sales').insert({ total, payment }).select().single()
  if (saleError) throw saleError

  await supabase.from('sale_items').insert(items.map(item => ({
    sale_id: sale.id, paninda_id: item.paninda_id || null,
    name: item.name, price: item.price, qty: item.qty, subtotal: item.subtotal
  })))

  for (const item of items) {
    if (item.paninda_id) {
      const { data: p } = await supabase.from('paninda').select('stock').eq('id', item.paninda_id).single()
      if (p) await supabase.from('paninda').update({ stock: Math.max(0, p.stock - item.qty) }).eq('id', item.paninda_id)
    }
  }

  if (payment === 'utang' && utangName) {
    const note = items.map(i => i.name).join(', ')
    const { data: existing } = await supabase.from('utangs').select('*').ilike('name', utangName).maybeSingle()
    let utangId
    if (existing) {
      await supabase.from('utangs').update({ amount: existing.amount + total }).eq('id', existing.id)
      utangId = existing.id
    } else {
      const { data: newU } = await supabase.from('utangs').insert({ name: utangName, amount: total, paid: 0 }).select().single()
      utangId = newU.id
    }
    await supabase.from('utang_history').insert({ utang_id: utangId, type: 'utang', amount: total, note })
  }

  return sale
}

// UTANG
export const getUtangs = async () => {
  const { data, error } = await supabase.from('utangs').select('*, utang_history(*)').order('created_at', { ascending: false })
  if (error) throw error
  return data.filter(u => u.amount > u.paid).map(u => ({ ...u, history: u.utang_history }))
}

export const addUtang = async ({ name, amount, note }) => {
  const { data: existing } = await supabase.from('utangs').select('*').ilike('name', name).maybeSingle()
  let utangId
  if (existing) {
    await supabase.from('utangs').update({ amount: existing.amount + parseFloat(amount) }).eq('id', existing.id)
    utangId = existing.id
  } else {
    const { data: newU } = await supabase.from('utangs').insert({ name, amount: parseFloat(amount), paid: 0 }).select().single()
    utangId = newU.id
  }
  await supabase.from('utang_history').insert({ utang_id: utangId, type: 'utang', amount: parseFloat(amount), note: note || '' })
}

export const payUtang = async (utang, amount) => {
  const pay = Math.min(parseFloat(amount), utang.amount - utang.paid)
  await supabase.from('utangs').update({ paid: utang.paid + pay }).eq('id', utang.id)
  await supabase.from('utang_history').insert({ utang_id: utang.id, type: 'bayad', amount: pay, note: '' })
  return pay
}

// DASHBOARD
export const getDashboard = async () => {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = `${today.slice(0, 7)}-01`

  const [{ data: todaySales }, { data: monthSales }, { data: utangs }, { data: paninda }, { data: topItems }, { data: dueUtangs }] = await Promise.all([
    supabase.from('sales').select('total').gte('created_at', `${today}T00:00:00`),
    supabase.from('sales').select('total').gte('created_at', monthStart),
    supabase.from('utangs').select('amount, paid'),
    supabase.from('paninda').select('id'),
    supabase.from('sale_items').select('name, qty').gte('created_at', monthStart),
    supabase.from('utangs').select('name, amount, paid')
  ])

  const todayEarnings = (todaySales || []).reduce((s, r) => s + Number(r.total), 0)
  const monthEarnings = (monthSales || []).reduce((s, r) => s + Number(r.total), 0)
  const totalUtang = (utangs || []).reduce((s, r) => s + Math.max(0, Number(r.amount) - Number(r.paid)), 0)
  const panindaCount = (paninda || []).length

  const qtyMap = {}
  for (const item of (topItems || [])) qtyMap[item.name] = (qtyMap[item.name] || 0) + item.qty
  const topSellers = Object.entries(qtyMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, total_qty]) => ({ name, total_qty }))
  const due = (dueUtangs || []).filter(u => u.amount > u.paid).map(u => ({ name: u.name, remaining: u.amount - u.paid })).sort((a, b) => b.remaining - a.remaining).slice(0, 3)

  return { todayEarnings, monthEarnings, totalUtang, panindaCount, topSellers, dueUtangs: due }
}

export const fmt = (n) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const imgUrl = (img) => img || null
