import Encabezado from '../_componentes/Encabezado';
import NavInferior from '../_componentes/NavInferior';
import MiCodigo from './MiCodigo';

export const metadata = { title: 'Mi código · Preste' };

export default function Page() {
  return (
    <>
      <Encabezado titulo="Mi código" />
      <main className="flex flex-col relative w-full pt-16 pb-24 md:pb-8">
        <div className="flex flex-col w-full mx-auto max-w-xl px-margin pt-space-sm gap-space-md">
          <MiCodigo />
        </div>
      </main>
      <NavInferior />
    </>
  );
}
