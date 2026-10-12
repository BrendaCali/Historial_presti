import Encabezado from '../_componentes/Encabezado';
import NavInferior from '../_componentes/NavInferior';
import Mercado from './Mercado';

export const metadata = { title: 'Tablón · Preste' };

export default function Page() {
  return (
    <>
      <Encabezado titulo="Tablón" />
      <main className="flex flex-col relative w-full pt-16 pb-24 md:pb-8">
        <div className="flex flex-col w-full mx-auto max-w-5xl px-margin pt-space-sm gap-space-md">
          <Mercado />
        </div>
      </main>
      <NavInferior />
    </>
  );
}
