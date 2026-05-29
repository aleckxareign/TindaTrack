import React, { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { api, fmt } from '../api';
import { Modal, Field, Input, Select, SubmitBtn, Card, EmptyState } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { useRealtime } from '../useRealtime';

const CATEGORIES = [
  'Candy',
  'Biscuit',
  'Chichirya',
  'Inumin',
  'Panglaba',
  'Condiments',
  'Hygiene',
  'Posporo & Iba pang Gamit sa Bahay',
  'Napkin & Feminine Care',
  'Iba pa',
];

const CATEGORY_ICONS = {
  'Candy': 'ti-candy',
  'Biscuit': 'ti-cookie',
  'Chichirya': 'ti-star',
  'Inumin': 'ti-bottle',
  'Panglaba': 'ti-shirt',
  'Condiments': 'ti-sauce',
  'Hygiene': 'ti-droplet',
  'Posporo & Iba pang Gamit sa Bahay': 'ti-flame',
  'Napkin & Feminine Care': 'ti-heart',
  'Iba pa': 'ti-package',
};

const Paninda = forwardRef(function Paninda(_, ref) {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', price:'', stock:'', category:'Iba pa', img:null, preview:'' });
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [filterCat, setFilterCat] = useState('Lahat');
  const toast = useToast();

  const load = useCallback(() => { api.get('/paninda').then(setItems); }, []);
  useEffect(() => { load(); }, [load]);
  useRealtime('paninda', load);
  useImperativeHandle(ref, () => ({ openAdd: () => openModal(null) }));

  const openModal = (item) => {
    setEditing(item);
    setForm({ name: item?.name||'', price: item?.price||'', stock: item?.stock||'', category: item?.category||'Iba pa', img:null, preview: item?.img||'' });
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
    fd.append('category', form.category);
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

  const toggleSelect = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleAll = () => {
    const visible = filteredItems.map(i => i.id);
    const allSelected = visible.every(id => selected.has(id));
    if (allSelected) { const n = new Set(selected); visible.forEach(id => n.delete(id)); setSelected(n); }
    else { const n = new Set(selected); visible.forEach(id => n.add(id)); setSelected(n); }
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Tatanggalin ang ${selected.size} paninda?`)) return;
    await api.post('/paninda/bulk-delete', { ids: [...selected] });
    toast(`${selected.size} paninda natanggal na. 🗑️`);
    setSelected(new Set()); setSelectMode(false); load();
  };

  const cancelSelect = () => { setSelectMode(false); setSelected(new Set()); };

  const usedCategories = ['Lahat', ...CATEGORIES.filter(c => items.some(i => i.category === c))];
  const filteredItems = filterCat === 'Lahat' ? items : items.filter(i => i.category === filterCat);

  // Group by category
  const grouped = {};
  filteredItems.forEach(item => {
    const cat = item.category || 'Iba pa';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const visibleCount = filteredItems.length;
  const selectedVisibleCount = filteredItems.filter(i => selected.has(i.id)).length;

  return (
    <div style={{ padding:16 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <p style={{ fontSize:20, fontWeight:500 }}>Listahan ng Paninda</p>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {!selectMode ? (
            <>
              <button onClick={() => setSelectMode(true)} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                <i className="ti ti-checkbox" /> Pumili
              </button>
              <button onClick={() => openModal(null)} style={{ background:'none', border:'none', color:'var(--green-mid)', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                <i className="ti ti-plus" /> Dagdag
              </button>
            </>
          ) : (
            <>
              <button onClick={toggleAll} style={{ background:'none', border:'none', color:'var(--blue)', fontSize:13, cursor:'pointer' }}>
                {selectedVisibleCount === visibleCount ? 'Alisin lahat' : 'Piliin lahat'}
              </button>
              <button onClick={cancelSelect} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer' }}>
                Kanselahin
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bulk delete bar */}
      {selectMode && selected.size > 0 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--red-light)', borderRadius:10, marginBottom:12, border:'0.5px solid var(--red-border)' }}>
          <span style={{ fontSize:14, color:'var(--red)', fontWeight:500 }}>{selected.size} napili</span>
          <button onClick={bulkDelete} style={{ padding:'8px 16px', background:'var(--red)', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <i className="ti ti-trash" /> I-delete
          </button>
        </div>
      )}

      {/* Category filter tabs */}
      {!selectMode && usedCategories.length > 1 && (
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:8, marginBottom:12, scrollbarWidth:'none' }}>
          {usedCategories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding:'6px 14px', borderRadius:999, border:`0.5px solid ${filterCat===cat ? 'var(--green-border)' : 'var(--border)'}`, background: filterCat===cat ? 'var(--green-light)' : '#fff', color: filterCat===cat ? 'var(--green)' : 'var(--muted)', fontSize:13, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {filteredItems.length === 0 && <EmptyState icon="shopping-bag" text="Wala pang paninda dito." />}

      {/* Grouped list */}
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} style={{ marginBottom:8 }}>
          {filterCat === 'Lahat' && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, marginTop:4 }}>
              <i className={`ti ${CATEGORY_ICONS[cat] || 'ti-package'}`} style={{ fontSize:14, color:'var(--muted)' }} />
              <span style={{ fontSize:13, fontWeight:500, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{cat}</span>
              <div style={{ flex:1, height:'0.5px', background:'var(--border)' }} />
            </div>
          )}
          {catItems.map(item => (
            <Card key={item.id} style={{ marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {selectMode && (
                  <div onClick={() => toggleSelect(item.id)} style={{ width:22, height:22, borderRadius:6, border:`2px solid ${selected.has(item.id) ? 'var(--green-mid)' : 'var(--border)'}`, background: selected.has(item.id) ? 'var(--green-mid)' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
                    {selected.has(item.id) && <i className="ti ti-check" style={{ fontSize:13, color:'#fff' }} />}
                  </div>
                )}

                {/* Image thumbnail - shows actual image or fallback icon */}
                <div style={{ width:48, height:48, borderRadius:8, background:'var(--bg2)', border:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                  {item.img
                    ? <img src={item.img} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                    : null}
                  <i className="ti ti-package" style={{ fontSize:20, color:'var(--muted)', display: item.img ? 'none' : 'block' }} />
                </div>

                <div style={{ flex:1, cursor: selectMode ? 'pointer' : 'default' }} onClick={selectMode ? () => toggleSelect(item.id) : undefined}>
                  <div style={{ fontSize:15, fontWeight:500 }}>{item.name}</div>
                  <div style={{ fontSize:16, fontWeight:500, color:'var(--green-mid)' }}>{fmt(item.price)}</div>
                  <div style={{ fontSize:12, color: item.stock <= 5 ? 'var(--red)' : 'var(--muted)' }}>
                    {item.stock <= 5 ? '⚠️ ' : ''}Stock: {item.stock}
                  </div>
                </div>

                {!selectMode && (
                  <div style={{ display:'flex', gap:2 }}>
                    <button onClick={() => openModal(item)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18, padding:4 }}>
                      <i className="ti ti-edit" />
                    </button>
                    <button onClick={() => del(item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18, padding:4 }}>
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
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
          <Field label="Category">
            <Select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Larawan">
            <div onClick={() => document.getElementById('img-upload').click()} style={{ border:'1.5px dashed var(--border)', borderRadius:8, padding:20, textAlign:'center', cursor:'pointer', color:'var(--muted)', fontSize:14 }}>
              <i className="ti ti-camera" style={{ fontSize:24, display:'block', marginBottom:6 }} />
              {form.preview ? 'Palitan ang larawan' : 'I-click para mag-upload ng larawan'}
            </div>
            <input id="img-upload" type="file" accept="image/*" style={{ display:'none' }} onChange={handleImg} />
            {form.preview && (
              <div style={{ marginTop:8, position:'relative', display:'inline-block' }}>
                <img src={form.preview} alt="preview" style={{ width:80, height:80, objectFit:'cover', borderRadius:8, display:'block' }} />
                <button onClick={() => setForm(f=>({...f,img:null,preview:''}))} style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'var(--red)', border:'none', color:'#fff', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className="ti ti-x" />
                </button>
              </div>
            )}
          </Field>
          <SubmitBtn onClick={save}>I-save ang paninda</SubmitBtn>
        </Modal>
      )}
    </div>
  );
});

export default Paninda;
