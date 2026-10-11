import Encabezado from '../_componentes/Encabezado';
import NavInferior from '../_componentes/NavInferior';
import Permiso from './Permiso';

export const metadata = { title: 'Permiso · Preste' };

export default function Page() {
  return (
    <>
      <Encabezado titulo="Permiso del agente" />
      <main className="flex flex-col relative w-full pt-16 pb-24 md:pb-8">
        <div className="flex flex-col w-full mx-auto max-w-3xl px-margin pt-space-sm gap-space-md">
          <Permiso />
        </div>
      </main>
      <NavInferior />
    </>
  );
}
