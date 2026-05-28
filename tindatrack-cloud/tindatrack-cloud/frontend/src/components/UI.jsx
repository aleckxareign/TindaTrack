import React from 'react';

export function Modal({ id, title, onClose, children }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:100, display:'flex', alignItems:'flex-end' }}>
      <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px 16px 40px', width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={{ fontSize:18, fontWeight:500 }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'var(--muted)', cursor:'pointer' }}>
            <i className="ti ti-x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ fontSize:14, color:'var(--muted)', display:'block', marginBottom:4 }}>{label}</label>
      {children}
    </div>
  );
}

export function Input({ ...props }) {
  return <input {...props} style={{ width:'100%', padding:'12px', borderRadius:'var(--radius-sm)', border:'0.5px solid var(--border)', fontSize:16, background:'#fff', color:'var(--text)', ...props.style }} />;
}

export function Select({ children, ...props }) {
  return <select {...props} style={{ width:'100%', padding:'12px', borderRadius:'var(--radius-sm)', border:'0.5px solid var(--border)', fontSize:16, background:'#fff', color:'var(--text)', ...props.style }}>{children}</select>;
}

export function SubmitBtn({ children, onClick, color = 'var(--green-mid)' }) {
  return (
    <button onClick={onClick} style={{ width:'100%', marginTop:20, padding:16, background:color, color:'#fff', border:'none', borderRadius:'var(--radius)', fontSize:16, fontWeight:500 }}>
      {children}
    </button>
  );
}

export function StatCard({ label, value, color = 'var(--text)' }) {
  return (
    <div style={{ background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:'14px 16px' }}>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:500, color }}>{value}</div>
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background:'#fff', border:'0.5px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:10, ...style }}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'green' }) {
  const map = {
    green: { bg: 'var(--green-light)', c: 'var(--green)' },
    amber: { bg: 'var(--amber-light)', c: 'var(--amber)' },
    red:   { bg: 'var(--red-light)',   c: 'var(--red)' },
    blue:  { bg: 'var(--blue-light)',  c: 'var(--blue)' },
  };
  const s = map[color] || map.green;
  return (
    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999, fontSize:12, fontWeight:500, background:s.bg, color:s.c }}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--muted)' }}>
      <i className={`ti ti-${icon}`} style={{ fontSize:48, display:'block', marginBottom:12 }} />
      <p style={{ fontSize:15 }}>{text}</p>
    </div>
  );
}

export function BigBtn({ icon, label, color = 'default', onClick }) {
  const map = {
    green: { bg:'var(--green-light)', border:'var(--green-border)', color:'var(--green)' },
    amber: { bg:'var(--amber-light)', border:'var(--amber-border)', color:'var(--amber)' },
    blue:  { bg:'var(--blue-light)',  border:'var(--blue-border)',  color:'var(--blue)' },
    default: { bg:'#fff', border:'var(--border)', color:'var(--text)' },
  };
  const s = map[color] || map.default;
  return (
    <button onClick={onClick} style={{ width:'100%', padding:16, borderRadius:'var(--radius)', border:`0.5px solid ${s.border}`, background:s.bg, cursor:'pointer', fontSize:16, fontWeight:500, color:s.color, display:'flex', alignItems:'center', gap:12 }}>
      <i className={`ti ti-${icon}`} style={{ fontSize:22 }} />
      {label}
    </button>
  );
}
