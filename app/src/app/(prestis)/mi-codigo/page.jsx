import Encabezado from '../_componentes/Encabezado';
import NavInferior from '../_componentes/NavInferior';
import CodigoDobleFirma from './CodigoDobleFirma';

export const metadata = { title: 'Mi Código · Preste' };

export default function MiCodigo() {
  return (
    <>
      <Encabezado titulo="Mi Código" />
      <main className="flex flex-col relative w-full pt-16 pb-20 md:pb-8">
        <div className="flex flex-col w-full mx-auto max-w-xl px-margin pb-space-xl">
          <CodigoDobleFirma />
        </div>
      </main>
      <NavInferior />
    </>
  );
}
