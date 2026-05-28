import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { api, fmt } from '../api';
import { useRealtime } from '../useRealtime';
import { Modal, Field, Input, SubmitBtn, StatCard, Card, EmptyState } from '../components/UI';
import { useToast } from '../context/ToastContext';

const Utang = forwardRef(function Utang(_, ref) {
  const [utangs, setUtangs] = useState([]);
  const [modal, setModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [form, setForm] = useState({ name:'', amount:'', note:'' });
  const [payAmount, setPayAmount] = useState('');
  const toast = useToast();

  const load = () => api.get('/utang').then(setUtangs);
  useEffect(() => { load(); }, []);
  useRealtime('utangs', load);
  useImperativeHandle(ref, () => ({ openUtang: () => openModal() }));

  const openModal = (name = '') => {
    setForm({ name, amount:'', note:'' });
    setModal(true);
  };

  const save = async () => {
    if (!form.name || !form.amount) { toast('Kumpletuhin ang pangalan at halaga!'); return; }
    await api.post('/utang', form);
    toast('Na-record ang utang! ✅');
    setModal(false);
    load();
  };

  const recordPayment = async () => {
    if (!payAmount || isNaN(payAmount) || parseFloat(payAmount) <= 0) { toast('Maglagay ng tamang halaga!'); return; }
    const res = await api.post(`/utang/${payModal.id}/pay`, { amount: parseFloat(payAmount) });
    const remaining = payModal.amount - payModal.paid - res.paid;
    toast(remaining <= 0 ? `Bayad na si ${payModal.name}! 🎉` : `Na-record ang bayad na ${fmt(res.paid)} ✅`);
    setPayModal(null);
    setPayAmount('');
    load();
  };

  const totalUtang = utangs.reduce((a, u) => a + (u.amount - u.paid), 0);

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <p style={{ fontSize:20, fontWeight:500 }}>Listahan ng Utang</p>
        <button onClick={() => openModal()} style={{ background:'none', border:'none', color:'var(--green-mid)', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
          <i className="ti ti-plus" /> Utang
        </button>
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
        const latest = u.history?.[0];
        const latestDate = latest ? new Date(latest.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric'}) : '';
        return (
          <Card key={u.id}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--amber-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:500, fontSize:14, color:'var(--amber)', flexShrink:0 }}>
                {initials}
              </div>
              <div style={{ flex:1 }}>
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
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, marginLeft:8 }}>
                <button onClick={() => { setPayModal(u); setPayAmount(''); }} style={{ padding:'8px 16px', borderRadius:8, background:'var(--green-light)', border:'0.5px solid var(--green-border)', color:'var(--green)', fontSize:14, cursor:'pointer', fontWeight:500 }}>
                  Bayad
                </button>
                <button onClick={() => openModal(u.name)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18, padding:4 }}>
                  <i className="ti ti-plus" />
                </button>
              </div>
            </div>
          </Card>
        );
      })}

      {modal && (
        <Modal title="Mag-record ng Utang" onClose={() => setModal(false)}>
          <Field label="Pangalan ng may utang">
            <Input placeholder="hal. Aling Nena" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          </Field>
          <Field label="Halaga ng utang (₱)">
            <Input type="number" placeholder="hal. 50" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
          </Field>
          <Field label="Para saan (opsyonal)">
            <Input placeholder="hal. Bigas, Kutsinta..." value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} />
          </Field>
          <SubmitBtn onClick={save}>I-save ang utang</SubmitBtn>
        </Modal>
      )}

      {payModal && (
        <Modal title="Mag-bayad ng Utang" onClose={() => setPayModal(null)}>
          <div style={{ padding:12, background:'var(--amber-light)', borderRadius:8, color:'var(--amber)', marginBottom:12 }}>
            <strong>{payModal.name}</strong><br />
            Natitirang utang: <strong>{fmt(payModal.amount - payModal.paid)}</strong>
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
