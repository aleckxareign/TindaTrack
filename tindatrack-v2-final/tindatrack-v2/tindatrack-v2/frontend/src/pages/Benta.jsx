import React, { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { getSales, addSale, getPaninda, fmt } from '../api';
import { supabase } from '../supabase';
import { useRealtime } from '../useRealtime';
import { Modal, Field, Select, SubmitBtn, StatCard, Card, Badge, EmptyState } from '../components/UI';
import { useToast } from '../context/ToastContext';

const Benta = forwardRef(function Benta(_, ref) {
  const [sales, setSales] = useState([]);
  const [paninda, setPaninda] = useState([]);
  const [modal, setModal] = useState(false);
  const [period, setPeriod] = useState('today');
  const [saleRows, setSaleRows] = useState([{ paninda_id:'', qty:1 }]);
  const [payment, setPayment] = useState('cash');
  const [utangName, setUtangName] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const toast = useToast();

  const load = useCallback(() => getSales(period).then(setSales).catch(console.error), [period]);
  useEffect(() => { getPaninda().then(setPaninda).catch(console.error); }, []);
  useEffect(() => { load(); }, [load]);
  useRealtime('sales', load);
  useImperativeHandle(ref, () => ({ openSale: () => openModal() }));

  const openModal = () => { setSaleRows([{ paninda_id:'', qty:1 }]); setPayment('cash'); setUtangName(''); setModal(true); };
  const updateRow = (i, key, val) => setSaleRows(rows => rows.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  const total = saleRows.reduce((sum, row) => { const item = paninda.find(p => p.id == row.paninda_id); return sum + (item ? item.price * row.qty : 0); }, 0);

  const record = async () => {
    const items = saleRows.filter(r => r.paninda_id).map(r => {
      const p = paninda.find(x => x.id == r.paninda_id);
      return { paninda_id: p.id, name: p.name, price: p.price, qty: r.qty, subtotal: p.price * r.qty };
    });
    if (!items.length) { toast('Pumili ng paninda!'); return; }
    if (payment === 'utang' && !utangName.trim()) { toast('Ilagay ang pangalan ng may utang!'); return; }
    try {
      await addSale({ items, total, payment, utangName: utangName.trim() });
      toast(`Na-record! ${fmt(total)} ${payment === 'utang' ? '(Utang)' : ''} ✅`);
      setModal(false); load();
    } catch(e) { toast('May error: ' + e.message); }
  };

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => { if (selected.size === sales.length) setSelected(new Set()); else setSelected(new Set(sales.map(s => s.id))); };

  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Tatanggalin ang ${selected.size} benta?`)) return;
    try {
      await Promise.all([...selected].map(id => supabase.from('sales').delete().eq('id', id)));
      toast(`${selected.size} benta natanggal. 🗑️`);
      setSelected(new Set()); setSelectMode(false); load();
    } catch(e) { toast('May error: ' + e.message); }
  };

  const tabs = [{ key:'today', label:'Ngayon' }, { key:'week', label:'Linggong ito' }, { key:'month', label:'Buwang ito' }];
  const todayTotal = sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).reduce((a,b)=>a+Number(b.total),0);
  const monthTotal = sales.reduce((a,b)=>a+Number(b.total),0);

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <p style={{ fontSize:20, fontWeight:500 }}>Talaan ng Benta</p>
        <div style={{ display:'flex', gap:8 }}>
          {selectMode ? (
            <>
              <button onClick={selectAll} style={{ background:'none', border:'none', color:'var(--green-mid)', fontSize:13, cursor:'pointer' }}>{selected.size === sales.length ? 'Alisin lahat' : 'Piliin lahat'}</button>
              {selected.size > 0 && <button onClick={deleteSelected} style={{ background:'var(--red-light)', border:'none', color:'var(--red)', fontSize:13, cursor:'pointer', padding:'4px 10px', borderRadius:6 }}><i className="ti ti-trash" /> ({selected.size})</button>}
              <button onClick={() => { setSelectMode(false); setSelected(new Set()); }} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer' }}>Kanselahin</button>
            </>
          ) : (
            <>
              <button onClick={() => setSelectMode(true)} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:14, cursor:'pointer' }}><i className="ti ti-select" /></button>
              <button onClick={openModal} style={{ background:'none', border:'none', color:'var(--green-mid)', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}><i className="ti ti-plus" /> Benta</button>
            </>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <StatCard label="Ngayon" value={fmt(todayTotal)} color="var(--green-mid)" />
        <StatCard label="Ngayong buwan" value={fmt(monthTotal)} color="var(--green-mid)" />
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setPeriod(t.key)} style={{ padding:'8px 16px', borderRadius:999, border:`0.5px solid ${period===t.key ? 'var(--green-border)' : 'var(--border)'}`, background: period===t.key ? 'var(--green-light)' : '#fff', color: period===t.key ? 'var(--green)' : 'var(--muted)', fontSize:14, cursor:'pointer' }}>{t.label}</button>
        ))}
      </div>

      {sales.length === 0 && <EmptyState icon="receipt" text="Wala pang benta sa panahong ito." />}

      {sales.map(sale => {
        const d = new Date(sale.created_at);
        return (
          <div key={sale.id} onClick={() => selectMode && toggleSelect(sale.id)}
            style={{ background: selected.has(sale.id) ? 'var(--green-light)' : '#fff', border:`0.5px solid ${selected.has(sale.id) ? 'var(--green-border)' : 'var(--border)'}`, borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:10, cursor: selectMode ? 'pointer' : 'default' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {selectMode && (
                <div style={{ width:22, height:22, borderRadius:'50%', border:`2px solid ${selected.has(sale.id) ? 'var(--green)' : 'var(--border)'}`, background: selected.has(sale.id) ? 'var(--green)' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {selected.has(sale.id) && <i className="ti ti-check" style={{ fontSize:12, color:'#fff' }} />}
                </div>
              )}
              <div style={{ flex:1, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:500 }}>{fmt(sale.total)}</div>
                  <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>{sale.items?.map(i=>`${i.name} x${i.qty}`).join(', ')}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{d.toLocaleDateString('en-PH',{month:'short',day:'numeric'})} {d.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <Badge color={sale.payment === 'utang' ? 'red' : 'green'}>{sale.payment === 'utang' ? 'Utang' : sale.payment === 'gcash' ? 'GCash' : 'Cash'}</Badge>
              </div>
            </div>
          </div>
        );
      })}

      {modal && (
        <Modal title="Mag-record ng Benta" onClose={() => setModal(false)}>
          {saleRows.map((row, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <Select value={row.paninda_id} onChange={e => updateRow(i, 'paninda_id', e.target.value)} style={{ flex:1 }}>
                <option value="">Piliin ang paninda...</option>
                {paninda.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>)}
              </Select>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <button onClick={() => updateRow(i,'qty',Math.max(1,row.qty-1))} style={{ width:34, height:34, borderRadius:'50%', border:'0.5px solid var(--border)', background:'var(--bg2)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                <span style={{ fontSize:16, fontWeight:500, minWidth:20, textAlign:'center' }}>{row.qty}</span>
                <button onClick={() => updateRow(i,'qty',row.qty+1)} style={{ width:34, height:34, borderRadius:'50%', border:'0.5px solid var(--border)', background:'var(--bg2)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                {saleRows.length > 1 && <button onClick={() => setSaleRows(r=>r.filter((_,idx)=>idx!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:16 }}><i className="ti ti-x"/></button>}
              </div>
            </div>
          ))}
          <button onClick={() => setSaleRows(r=>[...r,{paninda_id:'',qty:1}])} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--green-mid)', fontSize:14, padding:'8px 0', display:'flex', alignItems:'center', gap:4 }}><i className="ti ti-plus" /> Dagdag pa</button>
          <hr style={{ border:'none', borderTop:'0.5px solid var(--border)', margin:'12px 0' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:15, color:'var(--muted)' }}>Kabuuan:</span>
            <span style={{ fontSize:22, fontWeight:500, color:'var(--green-mid)' }}>{fmt(total)}</span>
          </div>
          <Field label="Paraan ng bayad">
            <Select value={payment} onChange={e => setPayment(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="utang">Utang</option>
              <option value="gcash">GCash</option>
            </Select>
          </Field>
          {payment === 'utang' && (
            <Field label="Pangalan ng may utang">
              <input placeholder="hal. Aling Nena" value={utangName} onChange={e => setUtangName(e.target.value)} style={{ width:'100%', padding:12, borderRadius:8, border:'0.5px solid var(--border)', fontSize:16, boxSizing:'border-box' }} />
            </Field>
          )}
          <SubmitBtn onClick={record}>I-record ang benta</SubmitBtn>
        </Modal>
      )}
    </div>
  );
});

export default Benta;
