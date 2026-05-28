import React, { useEffect, useState, useCallback } from 'react';
import { api, fmt } from '../api';
import { useRealtime } from '../useRealtime';
import { StatCard, BigBtn, Card, Badge } from '../components/UI';

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);

  const load = useCallback(() => { api.get('/dashboard').then(setData); }, []);
  useEffect(() => { load(); }, [load]);
  useRealtime('sales', load);
  useRealtime('paninda', load);
  useRealtime('utangs', load);

  if (!data) return <div style={{ padding:32, textAlign:'center', color:'var(--muted)' }}>Naglo-load...</div>;

  return (
    <div style={{ padding:16 }}>
      <p style={{ fontSize:20, fontWeight:500, marginBottom:16 }}>Kumusta, TindaTrack! 🏪</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <StatCard label="Kita ngayong araw" value={fmt(data.todayEarnings)} color="var(--green-mid)" />
        <StatCard label="Kita ngayong buwan" value={fmt(data.monthEarnings)} color="var(--green-mid)" />
        <StatCard label="Kabuuang utang" value={fmt(data.totalUtang)} color="var(--amber)" />
        <StatCard label="Bilang ng paninda" value={data.panindaCount} />
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
        <BigBtn icon="plus" label="Mag-record ng benta" color="green" onClick={() => onNavigate('benta', 'sale')} />
        <BigBtn icon="user-plus" label="Mag-record ng utang" color="amber" onClick={() => onNavigate('utang', 'utang')} />
        <BigBtn icon="package" label="Mag-dagdag ng paninda" color="blue" onClick={() => onNavigate('paninda', 'add')} />
      </div>

      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:15, fontWeight:500, marginBottom:10 }}>🏆 Pinakamabentang paninda ngayong buwan</p>
        {data.topSellers.length ? data.topSellers.map(({ name, total_qty }, i) => (
          <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'0.5px solid var(--border)' }}>
            <span style={{ fontSize:14 }}>{['🥇','🥈','🥉'][i]} {name}</span>
            <Badge color="green">{total_qty} benta</Badge>
          </div>
        )) : <p style={{ color:'var(--muted)', fontSize:14 }}>Wala pang benta ngayong buwan.</p>}
      </div>

      <div>
        <p style={{ fontSize:15, fontWeight:500, marginBottom:10 }}>💸 Mga may utang</p>
        {data.dueUtangs.length ? data.dueUtangs.map(u => (
          <div key={u.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'0.5px solid var(--border)' }}>
            <span style={{ fontSize:14 }}>{u.name}</span>
            <Badge color="amber">{fmt(u.remaining)}</Badge>
          </div>
        )) : <p style={{ color:'var(--muted)', fontSize:14 }}>Walang utang. 🎉</p>}
      </div>
    </div>
  );
}
