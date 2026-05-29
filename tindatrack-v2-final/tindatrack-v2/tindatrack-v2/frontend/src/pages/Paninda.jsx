import React, { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { getPaninda, addPaninda, updatePaninda, deletePaninda, fmt, imgUrl } from '../api';
import { Modal, Field, Input, Select, SubmitBtn, Card, EmptyState, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { useRealtime } from '../useRealtime';

const CATEGORIES = ['Lahat', 'Matamis', 'Biskwit', 'Chichirya', 'Inumin', 'Panglaba', 'Condiments', 'Pang-alagaan', 'Iba Pa'];

const Paninda = forwardRef(function Paninda(_, ref) {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', price:'', stock:'', category:'Iba Pa', img:null, preview:'' });
  const [selected, setSelected] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [filterCat, setFilterCat] = useState('Lahat');
  const toast = useToast();

  const load = useCallback(() => getPaninda().then(setItems).catch(console.error), []);
  useEffect(() => { load(); }, [load]);
  useRealtime('paninda', load);
  useImperativeHandle(ref, () => ({ openAdd: () => openModal(null) }));

  const openModal = (item) => {
    setEditing(item);
    setForm({ name: item?.name||'', price: item?.price||'', stock: item?.stock||'', category: item?.category||'Iba Pa', img:null, preview: item?.img||'' });
    setModal(true);
  };

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, img: file, preview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.name || !form.price) { toast('Kumpletuhin ang pangalan at presyo!'); return; }
    try {
      if (editing) {
        await updatePaninda(editing.id, { name: form.name, price: form.price, stock: form.stock, category: form.category, imgFile: form.img, existingImg: editing.img });
        toast('Na-update ang paninda! ✅');
      } else {
        await addPaninda({ name: form.name, price: form.price, stock: form.stock, category: form.category, imgFile: form.img });
        toast('Na-dagdag ang paninda! ✅');
      }
      setModal(false); load();
    } catch(e) { toast('May error: ' + e.message); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const visible = filtered.map(i => i.id);
    if (selected.size === visible.length) setSelected(new Set());
    else setSelected(new Set(visible));
  };

  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Tatanggalin ang ${selected.size} paninda?`)) return;
    try {
      await Promise.all([...selected].map(id => deletePaninda(id)));
      toast(`${selected.size} paninda natanggal. 🗑️`);
      setSelected(new Set()); setSelectMode(false); load();
    } catch(e) { toast('May error: ' + e.message); }
  };

  const filtered = filterCat === 'Lahat' ? items : items.filter(i => (i.category || 'Iba Pa') === filterCat);

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <p style={{ fontSize:20, fontWeight:500 }}>Listahan ng Paninda</p>
        <div style={{ display:'flex', gap:8 }}>
          {selectMode ? (
            <>
              <button onClick={selectAll} style={{ background:'none', border:'none', color:'var(--green-mid)', fontSize:13, cursor:'pointer' }}>
                {selected.size === filtered.length ? 'Burahin lahat' : 'Piliin lahat'}
              </button>
              {selected.size > 0 && <button onClick={deleteSelected} style={{ background:'var(--red-light)', border:'none', color:'var(--red)', fontSize:13, cursor:'pointer', padding:'4px 10px', borderRadius:6 }}>
                <i className="ti ti-trash" /> ({selected.size})
              </button>}
              <button onClick={() => { setSelectMode(false); setSelected(new Set()); }} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer' }}>Kanselahin</button>
            </>
          ) : (
            <>
              <button onClick={() => setSelectMode(true)} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer' }}><i className="ti ti-select" /></button>
              <button onClick={() => openModal(null)} style={{ background:'none', border:'none', color:'var(--green-mid)', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}><i className="ti ti-plus" /> Dagdag</button>
            </>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:14, paddingBottom:4 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding:'6px 12px', borderRadius:999, border:`0.5px solid ${filterCat===cat ? 'var(--green-border)' : 'var(--border)'}`, background: filterCat===cat ? 'var(--green-light)' : '#fff', color: filterCat===cat ? 'var(--green)' : 'var(--muted)', fontSize:12, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState icon="shopping-bag" text="Wala pang paninda dito. Mag-dagdag na!" />}

      {filtered.map(item => (
        <div key={item.id} onClick={() => selectMode && toggleSelect(item.id)}
          style={{ display:'flex', alignItems:'center', gap:10, background: selected.has(item.id) ? 'var(--green-light)' : '#fff', border:`0.5px solid ${selected.has(item.id) ? 'var(--green-border)' : 'var(--border)'}`, borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:10, cursor: selectMode ? 'pointer' : 'default' }}>
          {selectMode && (
            <div style={{ width:22, height:22, borderRadius:'50%', border:`2px solid ${selected.has(item.id) ? 'var(--green)' : 'var(--border)'}`, background: selected.has(item.id) ? 'var(--green)' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {selected.has(item.id) && <i className="ti ti-check" style={{ fontSize:12, color:'#fff' }} />}
            </div>
          )}
          <div style={{ width:54, height:54, borderRadius:8, background:'var(--bg2)', border:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
            {item.img ? <img src={item.img} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
              : <i className="ti ti-package" style={{ fontSize:22, color:'var(--muted)' }} />}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:500 }}>{item.name}</div>
            <div style={{ fontSize:18, fontWeight:500, color:'var(--green-mid)' }}>{fmt(item.price)}</div>
            <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:2 }}>
              <span style={{ fontSize:13, color: item.stock <= 5 ? 'var(--red)' : 'var(--muted)' }}>{item.stock <= 5 ? '⚠️ ' : ''}Stock: {item.stock}</span>
              <Badge color="blue">{item.category || 'Iba Pa'}</Badge>
            </div>
          </div>
          {!selectMode && (
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => openModal(item)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18, padding:4 }}><i className="ti ti-edit" /></button>
              <button onClick={async () => { if (window.confirm('Tatanggalin?')) { await deletePaninda(item.id); toast('Natanggal.'); load(); } }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18, padding:4 }}><i className="ti ti-trash" /></button>
            </div>
          )}
        </div>
      ))}

      {modal && (
        <Modal title={editing ? 'I-edit ang Paninda' : 'Mag-dagdag ng Paninda'} onClose={() => setModal(false)}>
          <Field label="Pangalan ng paninda"><Input placeholder="hal. Surf Powder" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></Field>
          <Field label="Presyo (₱)"><Input type="number" placeholder="hal. 8" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} /></Field>
          <Field label="Bilang sa stock"><Input type="number" placeholder="hal. 20" value={form.stock} onChange={e => setForm(f=>({...f,stock:e.target.value}))} /></Field>
          <Field label="Kategorya">
            <Select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
              {CATEGORIES.filter(c => c !== 'Lahat').map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </Select>
          </Field>
          <Field label="Larawan">
            <div onClick={() => document.getElementById('img-upload').click()} style={{ border:'1.5px dashed var(--border)', borderRadius:8, padding:20, textAlign:'center', cursor:'pointer', color:'var(--muted)', fontSize:14 }}>
              <i className="ti ti-camera" style={{ fontSize:24, display:'block', marginBottom:6 }} />I-click para mag-upload ng larawan
            </div>
            <input id="img-upload" type="file" accept="image/*" style={{ display:'none' }} onChange={handleImg} />
            {form.preview && <img src={form.preview} alt="preview" style={{ width:80, height:80, objectFit:'cover', borderRadius:8, marginTop:8, display:'block' }} />}
          </Field>
          <SubmitBtn onClick={save}>I-save ang paninda</SubmitBtn>
        </Modal>
      )}
    </div>
  );
});

export default Paninda;
