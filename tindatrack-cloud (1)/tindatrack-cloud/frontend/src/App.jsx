import React, { useState, useRef, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import Dashboard from './pages/Dashboard';
import Paninda from './pages/Paninda';
import Benta from './pages/Benta';
import Utang from './pages/Utang';

const NAV = [
  { key:'dashboard', icon:'home',         label:'Home' },
  { key:'paninda',   icon:'shopping-bag', label:'Paninda' },
  { key:'benta',     icon:'cash',         label:'Benta' },
  { key:'utang',     icon:'users',        label:'Utang' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const panindaRef = useRef();
  const bentaRef   = useRef();
  const utangRef   = useRef();

  const navigate = (targetPage, action) => {
    setPage(targetPage);
    setTimeout(() => {
      if (targetPage === 'paninda' && action === 'add') panindaRef.current?.openAdd();
      if (targetPage === 'benta'   && action === 'sale') bentaRef.current?.openSale();
      if (targetPage === 'utang'   && action === 'utang') utangRef.current?.openUtang();
    }, 50);
  };

  return (
    <ToastProvider>
      <div style={{ maxWidth:480, margin:'0 auto', background:'#fff', minHeight:'100vh', position:'relative' }}>
        <div style={{ paddingBottom:70 }}>
          {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {page === 'paninda'   && <Paninda ref={panindaRef} />}
          {page === 'benta'     && <Benta ref={bentaRef} />}
          {page === 'utang'     && <Utang ref={utangRef} />}
        </div>

        <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, display:'flex', borderTop:'0.5px solid var(--border)', background:'#fff', zIndex:10 }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => setPage(n.key)} style={{
              flex:1, padding:'12px 4px 10px', border:'none', background:'none', cursor:'pointer',
              color: page===n.key ? 'var(--green-mid)' : 'var(--muted)',
              fontSize:11, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              borderBottom: page===n.key ? '2px solid var(--green-mid)' : '2px solid transparent',
              transition:'color 0.15s'
            }}>
              <i className={`ti ti-${n.icon}`} style={{ fontSize:22 }} />
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    </ToastProvider>
  );
}
