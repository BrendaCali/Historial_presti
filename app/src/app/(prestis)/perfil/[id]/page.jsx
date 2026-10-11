import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EncabezadoDetalle } from '../../_componentes/Encabezado';
import NavInferior from '../../_componentes/NavInferior';
import Icono from '../../_componentes/Icono';
import { PERSONAS } from '../../_datos/personas';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `${PERSONAS[id]?.nombre ?? 'Perfil'} · Preste` };
}

export default async function Perfil({ params }) {
  const { id } = await params;
  const p = PERSONAS[id];
  if (!p) notFound();

  const desglose = [
    { factor: 'Puntualidad a tiempo', peso: '45%', valor: `${p.aTiempo}%`, barra: p.aTiempo },
    { factor: 'Gravedad de atrasos', peso: '25%', valor: p.atrasos, barra: p.atrasos.startsWith('0') ? 100 : 70 },
    { factor: 'Diversidad de personas', peso: '15%', valor: `${p.personas} personas`, barra: Math.min(100, p.personas * 8) },
    { factor: 'Montos devueltos', peso: '10%', valor: p.devuelto, barra: 70 },
    { factor: 'Antigüedad y constancia', peso: '5%', valor: p.antiguedad, barra: 60 },
  ];

  return (
    <>
      <EncabezadoDetalle titulo="Perfil" volverA="/tablon" />
      <main className="flex flex-col relative w-full pt-16 pb-20 md:pb-8">
        <div className="flex flex-col w-full mx-auto max-w-3xl px-margin pt-space-sm gap-space-md">
          <div className="rounded-xl bg-secondary-container/40 p-space-sm flex items-center gap-space-sm">
            <Icono nombre="info" tam={18} className="text-primary shrink-0" />
            <p className="font-body-sm text-body-sm text-on-surface">Datos de muestra del diseño: todavía no vienen de la cadena. Los montos se muestran en rangos.</p>
          </div>

          <section className="bg-surface-container rounded-xl p-space-md shadow-lg flex flex-col sm:flex-row sm:items-center gap-space-md">
            <img src={p.foto} alt={p.nombre} className="w-20 h-20 rounded-full object-cover bg-surface-container-high shrink-0" />
            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="font-headline-sm text-headline-sm text-on-surface">{p.nombre}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">{p.nivel}</span>
                <span className="font-metric-mono text-label-sm px-2 py-0.5 rounded-full bg-surface-container-highest text-secondary-fixed flex items-center gap-1">
                  <Icono nombre="badge" tam={12} className="text-tertiary" /> Carnet 1:1
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <Icono nombre="pin_drop" tam={14} className="text-primary" /> {p.ciudad}
              </span>
            </div>
            <div className="sm:ml-auto text-left sm:text-right">
              <span className="font-metric-mono text-label-sm uppercase text-on-surface-variant block">Puntaje</span>
              <span className="font-display-score-mobile text-display-score-mobile text-primary leading-none">{p.puntaje}</span>
              <span className="font-metric-mono text-label-sm text-secondary block">de 1000</span>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-space-sm text-center">
            {[['A tiempo', `${p.aTiempo}%`], ['Personas', p.personas], ['Disputas', p.disputas]].map(([t, v]) => (
              <div key={t} className="bg-surface-container rounded-xl py-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">{t}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">{v}</span>
              </div>
            ))}
          </section>

          <section className="bg-surface-container rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs">
              <Icono nombre="analytics" tam={18} className="text-primary" /> Desglose ponderado
            </h2>
            {desglose.map((d) => (
              <div key={d.factor} className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-lg text-label-lg text-on-surface">{d.factor} <span className="font-metric-mono text-label-sm text-secondary">({d.peso})</span></span>
                  <span className="font-metric-mono text-label-md text-primary text-right">{d.valor}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${d.barra}%` }} />
                </div>
              </div>
            ))}
          </section>

          <section className="bg-surface-container rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs">
              <Icono nombre="history" tam={18} className="text-primary" /> Historial de préstamos
            </h2>
            {p.historial.map((h) => (
              <div key={h.id} className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-label-lg text-label-lg text-on-surface block truncate">{h.id} · {h.persona}</span>
                  <span className="font-body-sm text-body-sm text-tertiary">{h.estado}</span>
                </div>
                <span className="font-metric-mono text-label-md text-primary shrink-0">{h.monto}</span>
              </div>
            ))}
          </section>

          <Link href="/tablon/interesados" className="h-12 rounded-xl bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2">
            <Icono nombre="compare_arrows" tam={20} /> Volver a comparar interesados
          </Link>
        </div>
      </main>
      <NavInferior />
    </>
  );
}
