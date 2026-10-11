import Encabezado from '../_componentes/Encabezado';
import NavInferior from '../_componentes/NavInferior';
import MisTratos from './MisTratos';

export const metadata = { title: 'Mis Tratos · Preste' };

export default function Page() {
  return (
    <>
      <Encabezado titulo="Mis Tratos" />
      <main className="flex flex-col relative w-full pt-16 pb-20 md:pb-8">
        <div className="flex flex-col w-full mx-auto max-w-3xl px-margin pt-space-sm gap-space-md">
          <MisTratos />
        </div>
      </main>
      <NavInferior />
    </>
  );
}
