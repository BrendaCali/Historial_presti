import Encabezado from '../../_componentes/Encabezado';
import NavInferior from '../../_componentes/NavInferior';
import Perfil from '../../_componentes/Perfil';

export const metadata = { title: 'Perfil · Preste' };

export default async function Page({ params }) {
  const { addr } = await params;
  return (
    <>
      <Encabezado titulo="Perfil" />
      <main className="flex flex-col relative w-full pt-16 pb-24 md:pb-8">
        <div className="flex flex-col w-full mx-auto max-w-3xl px-margin pt-space-sm gap-space-md">
          <Perfil addr={addr} />
        </div>
      </main>
      <NavInferior />
    </>
  );
}
