import React, { useState, useEffect, useCallback } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Sprout, Droplets, Wheat, Pencil, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const CATS = [
  { key: 'visitas', label: 'Visitas', unit: '', Icon: Sprout, color: '#8FB35C', soft: 'rgba(143,179,92,0.14)' },
  { key: 'preco', label: 'Preço médio', unit: 'R$', Icon: Droplets, color: '#6C93A6', soft: 'rgba(108,147,166,0.14)' },
  { key: 'vendas', label: 'Vendas', unit: 'R$', Icon: Wheat, color: '#D9A441', soft: 'rgba(217,164,65,0.16)' },
];

const emptyCat = () => ({ monthly: Array(12).fill(0), metaMensal: 0 });
const emptyYear = () => ({ visitas: emptyCat(), preco: emptyCat(), vendas: emptyCat() });

function fmt(n, unit) {
  if (n === null || n === undefined || isNaN(n)) n = 0;
  const rounded = Math.round(n * 100) / 100;
  if (unit === 'R$') return 'R$ ' + rounded.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return rounded.toLocaleString('pt-BR');
}

export default function PainelMetas() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // category key being edited
  const [draft, setDraft] = useState(null);
  const [saveState, setSaveState] = useState('idle');

  const storageKey = `painel-metas:${year}`;

  const load = useCallback(async (y) => {
    setLoading(true);
    try {
      const res = await window.storage.get(`painel-metas:${y}`);
      setData(res ? JSON.parse(res.value) : emptyYear());
    } catch {
      setData(emptyYear());
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(year); }, [year, load]);

  const persist = async (next) => {
    setData(next);
    setSaveState('saving');
    try {
      await window.storage.set(storageKey, JSON.stringify(next));
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1200);
    } catch {
      setSaveState('idle');
    }
  };

  const openEdit = (key) => {
    setEditing(key);
    setDraft(JSON.parse(JSON.stringify(data[key])));
  };

  const saveEdit = () => {
    const next = { ...data, [editing]: draft };
    persist(next);
    setEditing(null);
    setDraft(null);
  };

  if (loading || !data) {
    return (
      <div style={{ background: '#20241B', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" color="#D9A441" size={28} />
      </div>
    );
  }

  return (
    <div style={{ background: '#20241B', minHeight: '100vh', fontFamily: "'IBM Plex Sans', sans-serif", color: '#EFE9DA', paddingBottom: 48 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .disp { font-family: 'Fraunces', serif; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        input[type=number] { -moz-appearance: textfield; }
        input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '32px 24px 20px', borderBottom: '1px solid rgba(239,233,218,0.1)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.12em', color: '#8FB35C', textTransform: 'uppercase', marginBottom: 6 }}>Painel comercial</div>
            <h1 className="disp" style={{ fontSize: 30, fontWeight: 600, margin: 0 }}>Safra de resultados</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2A3122', padding: '6px 10px', borderRadius: 10 }}>
            <button onClick={() => setYear(y => y - 1)} style={{ background: 'none', border: 'none', color: '#EFE9DA', cursor: 'pointer', display: 'flex' }}>
              <ChevronLeft size={18} />
            </button>
            <span className="mono" style={{ fontSize: 16, minWidth: 48, textAlign: 'center' }}>{year}</span>
            <button onClick={() => setYear(y => y + 1)} style={{ background: 'none', border: 'none', color: '#EFE9DA', cursor: 'pointer', display: 'flex' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 980, margin: '28px auto 0', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {CATS.map(cat => {
          const cd = data[cat.key];
          const metaAnual = cat.metaAnualOverride ?? cd.metaMensal * 12;
          const acumulado = cd.monthly.reduce((a, b) => a + (b || 0), 0);
          const pct = metaAnual > 0 ? Math.min(100, Math.round((acumulado / metaAnual) * 100)) : 0;
          const chartData = MESES.map((m, i) => ({ mes: m, valor: cd.monthly[i] || 0, meta: cd.metaMensal || 0 }));

          return (
            <div key={cat.key} style={{ background: '#282F21', borderRadius: 16, padding: '22px 22px 12px', border: '1px solid rgba(239,233,218,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: cat.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <cat.Icon size={18} color={cat.color} />
                  </div>
                  <div>
                    <div className="disp" style={{ fontSize: 19, fontWeight: 600 }}>{cat.label}</div>
                    <div style={{ fontSize: 12, color: '#A8A896' }}>Meta mensal: <span className="mono">{fmt(cd.metaMensal, cat.unit)}</span></div>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(cat.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${cat.color}55`, color: cat.color, borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}
                >
                  <Pencil size={13} /> Editar
                </button>
              </div>

              {/* Furrow progress row */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#A8A896', marginBottom: 6 }}>
                  <span>Acumulado no ano: <span className="mono" style={{ color: '#EFE9DA' }}>{fmt(acumulado, cat.unit)}</span></span>
                  <span>Meta anual: <span className="mono" style={{ color: '#EFE9DA' }}>{fmt(metaAnual, cat.unit)}</span></span>
                </div>
                <div style={{ height: 10, background: '#1D2217', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} style={{ flex: 1, borderRight: i < 11 ? '2px solid #282F21' : 'none', background: (i + 1) * (100 / 12) <= pct ? cat.color : 'transparent' }} />
                  ))}
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: cat.color }}>{pct}% da meta anual colhida</div>
              </div>

              {/* Chart */}
              <div style={{ height: 190, marginTop: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(239,233,218,0.06)" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill: '#A8A896', fontSize: 11 }} axisLine={{ stroke: 'rgba(239,233,218,0.15)' }} tickLine={false} />
                    <YAxis tick={{ fill: '#A8A896', fontSize: 11 }} axisLine={false} tickLine={false} width={46} />
                    <Tooltip
                      contentStyle={{ background: '#20241B', border: '1px solid rgba(239,233,218,0.15)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#EFE9DA' }}
                      formatter={(v, n) => [fmt(v, cat.unit), n === 'valor' ? cat.label : 'Meta']}
                    />
                    <Bar dataKey="valor" fill={cat.color} radius={[4, 4, 0, 0]} maxBarSize={26} />
                    <Line dataKey="meta" stroke="#EFE9DA" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ maxWidth: 980, margin: '18px auto 0', padding: '0 24px', fontSize: 12, color: '#6E7263', textAlign: 'right', height: 16 }}>
        {saveState === 'saving' && 'salvando...'}
        {saveState === 'saved' && 'salvo'}
      </div>

      {/* Edit modal */}
      {editing && draft && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: '#282F21', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="disp" style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
              Editar {CATS.find(c => c.key === editing).label} — {year}
            </div>
            <div style={{ fontSize: 12, color: '#A8A896', marginBottom: 16 }}>Informe a meta mensal e os valores realizados de cada mês.</div>

            <label style={{ fontSize: 12, color: '#A8A896' }}>Meta mensal</label>
            <input
              type="number"
              value={draft.metaMensal}
              onChange={e => setDraft({ ...draft, metaMensal: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', background: '#1D2217', border: '1px solid rgba(239,233,218,0.15)', borderRadius: 8, padding: '8px 10px', color: '#EFE9DA', marginTop: 4, marginBottom: 16, fontFamily: "'IBM Plex Mono', monospace" }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MESES.map((m, i) => (
                <div key={m}>
                  <label style={{ fontSize: 11, color: '#A8A896' }}>{m}</label>
                  <input
                    type="number"
                    value={draft.monthly[i]}
                    onChange={e => {
                      const monthly = [...draft.monthly];
                      monthly[i] = parseFloat(e.target.value) || 0;
                      setDraft({ ...draft, monthly });
                    }}
                    style={{ width: '100%', background: '#1D2217', border: '1px solid rgba(239,233,218,0.15)', borderRadius: 8, padding: '6px 8px', color: '#EFE9DA', fontFamily: "'IBM Plex Mono', monospace" }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditing(null); setDraft(null); }} style={{ background: 'transparent', border: '1px solid rgba(239,233,218,0.2)', color: '#EFE9DA', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={saveEdit} style={{ background: '#8FB35C', border: 'none', color: '#1D2217', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Check size={15} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
