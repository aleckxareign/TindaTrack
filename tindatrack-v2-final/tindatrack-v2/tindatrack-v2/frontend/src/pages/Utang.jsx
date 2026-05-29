import React, { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { getUtangs, addUtang, payUtang, getPaninda, fmt } from '../api';
import { supabase } from '../supabase';
import { useRealtime } from '../useRealtime';
import { Modal, Field, Input, Select, SubmitBtn, StatCard, Card, Badge, EmptyState } from '../components/UI';
import { useToast } from '../context/ToastContext';

const Utang = forwardRef(function Utang(_, ref) {
  const [utangs, setUtangs] = useState([]);
  const [paninda, setPaninda] = useState([]);
  const [modal, setModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [form, setForm] = useState({ name:'', note:'', useCustomAmount:false, customAmount:'', items:[{ paninda_id:'', qty:1 }] });
  const [payAmount, setPayAmount] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const toast = useToast();

  const load = useCallback(() => getUtangs().then(setUtangs).catch(console.error), []);
  useEffect(() => { load(); getPaninda().then(setPaninda).catch(console.error); }, [load]);
  useRealtime('utangs', load);
  useImperativeHandle(ref, () => ({ openUtang: () => openModal() }));

  const openModal = (name = '') => {
    setForm({ name, note:'', useCustomAmount:false, customAmount:'', items:[{ paninda_id:'', qty:1 }] });
    setModal(true);
  };

  const updateItem = (i, key, val) => setForm(f => ({ ...f, items: f.items.map((r, idx) => idx===i ? {...r,[key]:val} : r) }));

  const computedTotal = form.items.reduce((sum, row) => {
    const p = paninda.find(x => x.id == row.paninda_id);
    return sum + (p ? p.price * row.qty : 0);
  }, 0);

  const finalAmount = form.useCustomAmount ? parseFloat(form.customAmount || 0) : computedTotal;

  const save = async () => {
    if (!form.name.trim()) { toast('Ilagay ang pangalan!'); return; }
    if (finalAmount <= 0) { toast('Mag-lagay ng paninda o halaga!'); return; }
    const selectedItems = form.items.filter(r => r.paninda_id).map(r => {
      const p = paninda.find(x => x.id == r.paninda_id);
      return `${p.name} x${r.qty}`;
    });
    const note = selectedItems.length ? selectedItems.join(', ') : (form.note || '');
    try {
      await addUtang({ name: form.name.trim(), amount: finalAmount, note });
      toast('Na-record ang utang! ✅');
      setModal(false); load();
    } catch(e) { toast('May error: ' + e.message); }
  };

  const recordPayment = async () => {
    if (!payAmount || isNaN(payAmount) || parseFloat(payAmount) <= 0) { toast('Maglagay ng tamang halaga!'); return; }
    try {
      const paid = await payUtang(payModal, payAmount);
      const remaining = payModal.amount - payModal.paid - paid;
      toast(remaining <= 0 ? `Bayad na si ${payModal.name}! 🎉` : `Na-record ang bayad na ${fmt(paid)} ✅`);
      setPayModal(null); setPayAmount(''); load();
    } catch(e) { toast('May error: ' + e.message); }
  };

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => { if (selected.size === utangs.length) setSelected(new Set()); else setSelected(new Set(utangs.map(u => u.id))); };

  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Tatanggalin ang ${selected.size} utang?`)) return;
    try {
      await Promise.all([...selected].map(id => supabase.from('utangs').delete().eq('id', id)));
      toast(`${selected.size} utang natanggal. 🗑️`);
      setSelected(new Set()); setSelectMode(false); load();
    } catch(e) { toast('May error: ' + e.message); }
  };

  const totalUtang = utangs.reduce((a, u) => a + (u.amount - u.paid), 0);

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <p style={{ fontSize:20, fontWeight:500 }}>Listahan ng Utang</p>
        <div style={{ display:'flex', gap:8 }}>
          {selectMode ? (
            <>
              <button onClick={selectAll} style={{ background:'none', border:'none', color:'var(--green-mid)', fontSize:13, cursor:'pointer' }}>{selected.size === utangs.length ? 'Alisin lahat' : 'Piliin lahat'}</button>
              {selected.size > 0 && <button onClick={deleteSelected} style={{ background:'var(--red-light)', border:'none', color:'var(--red)', fontSize:13, cursor:'pointer', padding:'4px 10px', borderRadius:6 }}><i className="ti ti-trash" /> ({selected.size})</button>}
              <button onClick={() => { setSelectMode(false); setSelected(new Set()); }} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer' }}>Kanselahin</button>
            </>
          ) : (
            <>
              <button onClick={() => setSelectMode(true)} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:14, cursor:'pointer' }}><i className="ti ti-select" /></button>
              <button onClick={() => openModal()} style={{ background:'none', border:'none', color:'var(--green-mid)', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}><i className="ti ti-plus" /> Utang</button>
            </>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <StatCard label="Kabuuang utang" value={fmt(totalUtang)} color="var(--amber)" />
        <StatCard label="Bilang ng may utang" value={utangs.length} />
      </div>

      {utangs.length === 0 && <EmptyState icon="check" text="Walang utang. Ayos! 🎉" />}

      {utangs.map(u => {
        const rem = u.amount - u.paid;
        const pct = Math.round((u.paid / u.amount) * 100);
        const initials = u.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
        const latest = u.history?.[u.history.length - 1];
        const latestDate = latest ? new Date(latest.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric'}) : '';
        return (
          <div key={u.id} onClick={() => selectMode && toggleSelect(u.id)}
            style={{ background: selected.has(u.id) ? 'var(--green-light)' : '#fff', border:`0.5px solid ${selected.has(u.id) ? 'var(--green-border)' : 'var(--border)'}`, borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:10, cursor: selectMode ? 'pointer' : 'default' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {selectMode && (
                <div style={{ width:22, height:22, borderRadius:'50%', border:`2px solid ${selected.has(u.id) ? 'var(--green)' : 'var(--border)'}`, background: selected.has(u.id) ? 'var(--green)' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {selected.has(u.id) && <i className="ti ti-check" style={{ fontSize:12, color:'#fff' }} />}
                </div>
              )}
              <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--amber-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:500, fontSize:14, color:'var(--amber)', flexShrink:0 }}>{initials}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:500 }}>{u.name}</div>
                <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>
                  Natitirang: <strong style={{ color:'var(--amber)' }}>{fmt(rem)}</strong>
                  {latest?.note ? ` · ${latest.note}` : ''}
                </div>
                {latestDate && <div style={{ fontSize:12, color:'var(--muted)' }}>Huling aktibidad: {latestDate}</div>}
                <div style={{ height:6, borderRadius:999, background:'var(--bg2)', marginTop:8, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:999, background:'var(--amber-mid)', width:`${pct}%`, transition:'width 0.3s' }} />
                </div>
              </div>
              {!selectMode && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, marginLeft:8 }}>
                  <button onClick={() => { setPayModal(u); setPayAmount(''); }} style={{ padding:'8px 16px', borderRadius:8, background:'var(--green-light)', border:'0.5px solid var(--green-border)', color:'var(--green)', fontSize:14, cursor:'pointer', fontWeight:500 }}>Bayad</button>
                  <button onClick={() => openModal(u.name)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18, padding:4 }}><i className="ti ti-plus" /></button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {modal && (
        <Modal title="Mag-record ng Utang" onClose={() => setModal(false)}>
          <Field label="Pangalan ng may utang">
            <Input placeholder="hal. Aling Nena" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          </Field>

          <div style={{ marginTop:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={{ fontSize:14, color:'var(--muted)' }}>Mga inutang na paninda</label>
              <label style={{ fontSize:13, color:'var(--muted)', display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                <input type="checkbox" checked={form.useCustomAmount} onChange={e => setForm(f=>({...f,useCustomAmount:e.target.checked}))} />
                Manual na halaga
              </label>
            </div>

            {!form.useCustomAmount ? (
              <>
                {form.items.map((row, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <Select value={row.paninda_id} onChange={e => updateItem(i,'paninda_id',e.target.value)} style={{ flex:1 }}>
                      <option value="">Piliin ang paninda...</option>
                      {paninda.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>)}
                    </Select>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <button onClick={() => updateItem(i,'qty',Math.max(1,row.qty-1))} style={{ width:30, height:30, borderRadius:'50%', border:'0.5px solid var(--border)', background:'var(--bg2)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                      <span style={{ fontSize:15, fontWeight:500, minWidth:18, textAlign:'center' }}>{row.qty}</span>
                      <button onClick={() => updateItem(i,'qty',row.qty+1)} style={{ width:30, height:30, borderRadius:'50%', border:'0.5px solid var(--border)', background:'var(--bg2)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                      {form.items.length > 1 && <button onClick={() => setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:15 }}><i className="ti ti-x"/></button>}
                    </div>
                  </div>
                ))}
                <button onClick={() => setForm(f=>({...f,items:[...f.items,{paninda_id:'',qty:1}]}))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--green-mid)', fontSize:13, padding:'4px 0', display:'flex', alignItems:'center', gap:4 }}>
                  <i className="ti ti-plus" /> Dagdag pa
                </button>
                {computedTotal > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, padding:'8px 12px', background:'var(--amber-light)', borderRadius:8 }}>
                    <span style={{ fontSize:14, color:'var(--amber)' }}>Kabuuan:</span>
                    <strong style={{ color:'var(--amber)' }}>{fmt(computedTotal)}</strong>
                  </div>
                )}
              </>
            ) : (
              <Field label="Halaga ng utang (₱)">
                <Input type="number" placeholder="hal. 50" value={form.customAmount} onChange={e => setForm(f=>({...f,customAmount:e.target.value}))} />
              </Field>
            )}
          </div>

          <Field label="Note (opsyonal)">
            <Input placeholder="hal. Bigas, Gatas..." value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} />
          </Field>
          <SubmitBtn onClick={save}>I-save ang utang</SubmitBtn>
        </Modal>
      )}

      {payModal && (
        <Modal title="Mag-bayad ng Utang" onClose={() => setPayModal(null)}>
          <div style={{ padding:12, background:'var(--amber-light)', borderRadius:8, color:'var(--amber)', marginBottom:12 }}>
            <strong>{payModal.name}</strong><br />Natitirang utang: <strong>{fmt(payModal.amount - payModal.paid)}</strong>
          </div>
          <Field label="Halaga ng bayad (₱)">
            <Input type="number" placeholder="hal. 50" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
          </Field>
          <SubmitBtn onClick={recordPayment}>I-record ang bayad</SubmitBtn>
        </Modal>
      )}
    </div>
  );
});

export default Utang;
