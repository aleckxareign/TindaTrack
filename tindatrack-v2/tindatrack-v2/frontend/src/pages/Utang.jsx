import React, { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { api, fmt } from '../api';
import { useRealtime } from '../useRealtime';
import { Modal, Field, Input, Select, SubmitBtn, StatCard, Card, EmptyState } from '../components/UI';
import { useToast } from '../context/ToastContext';

const Utang = forwardRef(function Utang(_, ref) {
  const [utangs, setUtangs] = useState([]);
  const [paninda, setPaninda] = useState([]);
  const [modal, setModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [form, setForm] = useState({ name:'', amount:'', note:'', selectedItems:[] });
  const [payAmount, setPayAmount] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const toast = useToast();

  const load = useCallback(() => api.get('/utang').then(setUtangs), []);
  useEffect(() => { load(); api.get('/paninda').then(setPaninda); }, []);
  useRealtime('utangs', load);
  useImperativeHandle(ref, () => ({ openUtang: () => openModal() }));

  const openModal = (name = '') => {
    setForm({ name, amount:'', note:'', selectedItems:[] });
    setModal(true);
  };

  // When paninda items are selected, auto-compute total price
  const toggleItem = (item) => {
    setForm(f => {
      const exists = f.selectedItems.find(i => i.id === item.id);
      const newItems = exists
        ? f.selectedItems.filter(i => i.id !== item.id)
        : [...f.selectedItems, { ...item, qty: 1 }];
      const autoAmount = newItems.reduce((sum, i) => sum + i.price * i.qty, 0);
      return { ...f, selectedItems: newItems, amount: autoAmount > 0 ? String(autoAmount) : f.amount };
    });
  };

  const updateItemQty = (id, delta) => {
    setForm(f => {
      const newItems = f.selectedItems.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
      const autoAmount = newItems.reduce((sum, i) => sum + i.price * i.qty, 0);
      return { ...f, selectedItems: newItems, amount: String(autoAmount) };
    });
  };

  const save = async () => {
    if (!form.name) { toast('Ilagay ang pangalan!'); return; }
    const hasItems = form.selectedItems.length > 0;
    const finalAmount = hasItems
      ? form.selectedItems.reduce((s, i) => s + i.price * i.qty, 0)
      : parseFloat(form.amount);
    if (!finalAmount || isNaN(finalAmount)) { toast('Ilagay ang halaga o pumili ng paninda!'); return; }
    const itemNames = form.selectedItems.map(i => `${i.name} x${i.qty}`);
    await api.post('/utang', { name: form.name, amount: finalAmount, note: form.note, items: itemNames });
    toast('Na-record ang utang! ✅');
    setModal(false); load();
  };

  const recordPayment = async () => {
    if (!payAmount || isNaN(payAmount) || parseFloat(payAmount) <= 0) { toast('Maglagay ng tamang halaga!'); return; }
    const res = await api.post(`/utang/${payModal.id}/pay`, { amount: parseFloat(payAmount) });
    const remaining = payModal.amount - payModal.paid - res.paid;
    toast(remaining <= 0 ? `Bayad na si ${payModal.name}! 🎉` : `Na-record ang bayad na ${fmt(res.paid)} ✅`);
    setPayModal(null); setPayAmount(''); load();
  };

  const deleteUtang = async (id) => {
    if (!window.confirm('Burahin ang utang na ito?')) return;
    await api.delete(`/utang/${id}`);
    toast('Natanggal ang utang.');
    load();
  };

  const toggleSelect = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleAll = () => {
    if (selected.size === utangs.length) setSelected(new Set());
    else setSelected(new Set(utangs.map(u => u.id)));
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Burahin ang ${selected.size} utang?`)) return;
    await api.post('/utang/bulk-delete', { ids: [...selected] });
    toast(`${selected.size} utang natanggal na. 🗑️`);
    setSelected(new Set()); setSelectMode(false); load();
  };

  const cancelSelect = () => { setSelectMode(false); setSelected(new Set()); };

  const totalUtang = utangs.reduce((a, u) => a + (u.amount - u.paid), 0);
  const autoTotal = form.selectedItems.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <p style={{ fontSize:20, fontWeight:500 }}>Listahan ng Utang</p>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {!selectMode ? (
            <>
              {utangs.length > 0 && (
                <button onClick={() => setSelectMode(true)} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                  <i className="ti ti-checkbox" /> Pumili
                </button>
              )}
              <button onClick={() => openModal()} style={{ background:'none', border:'none', color:'var(--green-mid)', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                <i className="ti ti-plus" /> Utang
              </button>
            </>
          ) : (
            <>
              <button onClick={toggleAll} style={{ background:'none', border:'none', color:'var(--blue)', fontSize:13, cursor:'pointer' }}>
                {selected.size === utangs.length ? 'Alisin lahat' : 'Piliin lahat'}
              </button>
              <button onClick={cancelSelect} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer' }}>Kanselahin</button>
            </>
          )}
        </div>
      </div>

      {selectMode && selected.size > 0 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--red-light)', borderRadius:10, marginBottom:12, border:'0.5px solid var(--red-border)' }}>
          <span style={{ fontSize:14, color:'var(--red)', fontWeight:500 }}>{selected.size} napili</span>
          <button onClick={bulkDelete} style={{ padding:'8px 16px', background:'var(--red)', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <i className="ti ti-trash" /> I-delete
          </button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <StatCard label="Kabuuang utang" value={fmt(totalUtang)} color="var(--amber)" />
        <StatCard label="Bilang ng may utang" value={utangs.length} />
      </div>

      {utangs.length === 0 && <EmptyState icon="check" text="Walang utang. Ayos! 🎉" />}

      {utangs.map(u => {
        const rem = u.amount - u.paid;
        const pct = Math.round((u.paid / u.amount) * 100);
        const initials = u.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
        const latest = u.history?.[0];
        const latestDate = latest ? new Date(latest.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric'}) : '';
        return (
          <Card key={u.id}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {selectMode && (
                <div onClick={() => toggleSelect(u.id)} style={{ width:22, height:22, borderRadius:6, border:`2px solid ${selected.has(u.id) ? 'var(--red)' : 'var(--border)'}`, background: selected.has(u.id) ? 'var(--red)' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
                  {selected.has(u.id) && <i className="ti ti-check" style={{ fontSize:13, color:'#fff' }} />}
                </div>
              )}
              <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--amber-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:500, fontSize:14, color:'var(--amber)', flexShrink:0 }}>
                {initials}
              </div>
              <div style={{ flex:1, cursor: selectMode ? 'pointer' : 'default' }} onClick={selectMode ? () => toggleSelect(u.id) : undefined}>
                <div style={{ fontSize:16, fontWeight:500 }}>{u.name}</div>
                <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>
                  Natitirang: <strong style={{ color:'var(--amber)' }}>{fmt(rem)}</strong>
                  {latest?.note ? ` · ${latest.note}` : ''}
                </div>
                {latestDate && <div style={{ fontSize:12, color:'var(--muted)' }}>Huling aktibidad: {latestDate}</div>}
                <div style={{ height:6, borderRadius:999, background:'var(--bg2)', marginTop:8, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:999, background:'var(--amber-mid)', width:`${pct}%` }} />
                </div>
              </div>
              {!selectMode && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, marginLeft:4 }}>
                  <button onClick={() => { setPayModal(u); setPayAmount(''); }} style={{ padding:'7px 14px', borderRadius:8, background:'var(--green-light)', border:'0.5px solid var(--green-border)', color:'var(--green)', fontSize:14, cursor:'pointer', fontWeight:500 }}>
                    Bayad
                  </button>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={() => openModal(u.name)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:16, padding:2 }} title="Dagdag utang">
                      <i className="ti ti-plus" />
                    </button>
                    <button onClick={() => deleteUtang(u.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:16, padding:2 }} title="Tanggalin">
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {/* Add Utang Modal */}
      {modal && (
        <Modal title="Mag-record ng Utang" onClose={() => setModal(false)}>
          <Field label="Pangalan ng may utang">
            <Input placeholder="hal. Aling Nena" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          </Field>

          {/* Paninda picker */}
          {paninda.length > 0 && (
            <Field label="Ano ang inutang? (opsyonal — piliin mula sa listahan)">
              <div style={{ maxHeight:180, overflowY:'auto', border:'0.5px solid var(--border)', borderRadius:8, padding:8, display:'flex', flexDirection:'column', gap:6 }}>
                {paninda.map(p => {
                  const sel = form.selectedItems.find(i => i.id === p.id);
                  return (
                    <div key={p.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:8, background: sel ? 'var(--green-light)' : 'transparent', cursor:'pointer' }} onClick={() => toggleItem(p)}>
                      <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${sel ? 'var(--green-mid)' : 'var(--border)'}`, background: sel ? 'var(--green-mid)' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {sel && <i className="ti ti-check" style={{ fontSize:11, color:'#fff' }} />}
                      </div>
                      <span style={{ flex:1, fontSize:14 }}>{p.name}</span>
                      <span style={{ fontSize:13, color:'var(--green-mid)', fontWeight:500 }}>{fmt(p.price)}</span>
                      {sel && (
                        <div style={{ display:'flex', alignItems:'center', gap:4 }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => updateItemQty(p.id, -1)} style={{ width:24, height:24, borderRadius:'50%', border:'0.5px solid var(--border)', background:'#fff', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                          <span style={{ fontSize:13, fontWeight:500, minWidth:16, textAlign:'center' }}>{sel.qty}</span>
                          <button onClick={() => updateItemQty(p.id, 1)} style={{ width:24, height:24, borderRadius:'50%', border:'0.5px solid var(--border)', background:'#fff', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Field>
          )}

          {/* Show auto-computed total OR manual input if no items */}
          {form.selectedItems.length > 0 ? (
            <div style={{ marginTop:12, padding:'10px 14px', background:'var(--green-light)', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:14, color:'var(--green)' }}>Kabuuan ng napili:</span>
              <span style={{ fontSize:18, fontWeight:500, color:'var(--green)' }}>{fmt(autoTotal)}</span>
            </div>
          ) : (
            <Field label="Halaga ng utang (₱) — kung hindi napili sa listahan">
              <Input type="number" placeholder="hal. 50" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
            </Field>
          )}

          <Field label="Dagdag na tala (opsyonal)">
            <Input placeholder="hal. para sa meryenda..." value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} />
          </Field>
          <SubmitBtn onClick={save}>I-save ang utang</SubmitBtn>
        </Modal>
      )}

      {/* Pay Modal */}
      {payModal && (
        <Modal title="Mag-bayad ng Utang" onClose={() => setPayModal(null)}>
          <div style={{ padding:12, background:'var(--amber-light)', borderRadius:8, color:'var(--amber)', marginBottom:12 }}>
            <strong>{payModal.name}</strong><br />
            Natitirang utang: <strong>{fmt(payModal.amount - payModal.paid)}</strong>
          </div>
          <Field label="Halaga ng bayad (₱)">
            <Input type="number" placeholder="hal. 50" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
          </Field>
          <button onClick={() => setPayAmount(String(payModal.amount - payModal.paid))} style={{ marginTop:8, background:'none', border:'none', color:'var(--amber)', fontSize:13, cursor:'pointer', padding:0 }}>
            Bayaran lahat ({fmt(payModal.amount - payModal.paid)})
          </button>
          <SubmitBtn onClick={recordPayment}>I-record ang bayad</SubmitBtn>
        </Modal>
      )}
    </div>
  );
});

export default Utang;
