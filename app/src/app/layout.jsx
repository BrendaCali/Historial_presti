import './globals.css';
import AvalProvider from './AvalProvider';

export const metadata = {
  title: 'Preste',
  description: 'Tu palabra ahora tiene historial. Préstamos entre personas y pagos con asistente, sobre Aval en Monad.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AvalProvider>{children}</AvalProvider>
      </body>
    </html>
  );
}
