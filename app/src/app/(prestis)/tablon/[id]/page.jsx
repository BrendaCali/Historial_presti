import Encabezado from '../../_componentes/Encabezado';
import NavInferior from '../../_componentes/NavInferior';
import Detalle from './Detalle';

export const metadata = { title: 'Publicación · Preste' };

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <>
      <Encabezado titulo="Publicación" />
      <main className="flex flex-col relative w-full pt-16 pb-24 md:pb-8">
        <div className="flex flex-col w-full mx-auto max-w-3xl px-margin pt-space-sm gap-space-md">
          <Detalle id={id} />
        </div>
      </main>
      <NavInferior />
    </>
  );
}
