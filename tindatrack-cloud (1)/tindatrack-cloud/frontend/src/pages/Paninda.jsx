import React, { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { api, imgUrl, fmt } from '../api';
import { Modal, Field, Input, SubmitBtn, Card, EmptyState } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { useRealtime } from '../useRealtime';

const Paninda = forwardRef(function Paninda(_, ref) {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', price:'', stock:'', img:null, preview:'' });
  const toast = useToast();

  const load = useCallback(() => { api.get('/paninda').then(setItems); }, []);
  useEffect(() => { load(); }, [load]);
  useRealtime('paninda', load);
  useImperativeHandle(ref, () => ({ openAdd: () => openModal(null) }));

  const openModal = (item) => {
    setEditing(item);
    setForm({ name: item?.name||'', price: item?.price||'', stock: item?.stock||'', img:null, preview: item?.img||'' });
    setModal(true);
  };

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, img: file, preview: URL.createObjectURL(file) }));
  };

  const save = async () => {
    if (!form.name || !form.price) { toast('Kumpletuhin ang pangalan at presyo!'); return; }
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('price', form.price);
    fd.append('stock', form.stock || 0);
    if (form.img) fd.append('img', form.img);
    if (editing) {
      await api.putForm(`/paninda/${editing.id}`, fd);
      toast('Na-update ang paninda! ✅');
    } else {
      await api.postForm('/paninda', fd);
      toast('Na-dagdag ang paninda! ✅');
    }
    setModal(false);
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Tatanggalin ba ang paninda na ito?')) return;
    await api.delete(`/paninda/${id}`);
    toast('Natanggal na.');
    load();
  };

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <p style={{ fontSize:20, fontWeight:500 }}>Listahan ng Paninda</p>
        <button onClick={() => openModal(null)} style={{ background:'none', border:'none', color:'var(--green-mid)', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
          <i className="ti ti-plus" /> Dagdag
        </button>
      </div>

      {items.length === 0 && <EmptyState icon="shopping-bag" text="Wala pang paninda. Mag-dagdag na!" />}

      {items.map(item => (
        <Card key={item.id}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:54, height:54, borderRadius:8, background:'var(--bg2)', border:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
              {item.img ? <img src={imgUrl(item.img)} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <i className="ti ti-package" style={{ fontSize:22, color:'var(--muted)' }} />}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:500 }}>{item.name}</div>
              <div style={{ fontSize:18, fontWeight:500, color:'var(--green-mid)' }}>{fmt(item.price)}</div>
              <div style={{ fontSize:13, color: item.stock <= 5 ? 'var(--red)' : 'var(--muted)' }}>
                {item.stock <= 5 ? '⚠️ ' : ''}Stock: {item.stock}
              </div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => openModal(item)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18, padding:4 }}>
                <i className="ti ti-edit" />
              </button>
              <button onClick={() => del(item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18, padding:4 }}>
                <i className="ti ti-trash" />
              </button>
            </div>
          </div>
        </Card>
      ))}

      {modal && (
        <Modal title={editing ? 'I-edit ang Paninda' : 'Mag-dagdag ng Paninda'} onClose={() => setModal(false)}>
          <Field label="Pangalan ng paninda">
            <Input placeholder="hal. Surf Powder" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          </Field>
          <Field label="Presyo (₱)">
            <Input type="number" placeholder="hal. 8" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} />
          </Field>
          <Field label="Bilang sa stock">
            <Input type="number" placeholder="hal. 20" value={form.stock} onChange={e => setForm(f=>({...f,stock:e.target.value}))} />
          </Field>
          <Field label="Larawan">
            <div onClick={() => document.getElementById('img-upload').click()} style={{ border:'1.5px dashed var(--border)', borderRadius:8, padding:20, textAlign:'center', cursor:'pointer', color:'var(--muted)', fontSize:14 }}>
              <i className="ti ti-camera" style={{ fontSize:24, display:'block', marginBottom:6 }} />
              I-click para mag-upload ng larawan
            </div>
            <input id="img-upload" type="file" accept="image/*" style={{ display:'none' }} onChange={handleImg} />
            {form.preview && <img src={form.preview} alt="preview" style={{ width:80, height:80, objectFit:'cover', borderRadius:8, marginTop:8 }} />}
          </Field>
          <SubmitBtn onClick={save}>I-save ang paninda</SubmitBtn>
        </Modal>
      )}
    </div>
  );
});

export default Paninda;
