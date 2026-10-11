// Personas de ejemplo del diseño. Son datos de MUESTRA: todavía no vienen de la cadena ni del indexer.
// Los montos van en rangos (regla de privacidad), no exactos.
export const PERSONAS = {
  alan: {
    id: 'alan', nombre: 'Alan Meneces', corto: 'Alan M.', foto: '/img/alan-meneces.jpg',
    nivel: '⭐ Muy cumplido', puntaje: 860, aTiempo: 95, atrasos: '0 días', personas: 8,
    devuelto: 'Bs 10,000–20,000', antiguedad: '7 meses', ciudad: 'Cochabamba, La Cancha', disputas: 0,
    historial: [
      { id: '#042', persona: 'José R.', monto: 'Bs 500–1,000', estado: 'Devuelto a tiempo' },
      { id: '#039', persona: 'Carmen T.', monto: 'Bs 100–500', estado: 'Devuelto a tiempo' },
    ],
  },
  jose: {
    id: 'jose', nombre: 'José Ramírez', corto: 'José R.', foto: '/img/jose-ramirez.jpg',
    nivel: '🤝 Cumplido', puntaje: 740, aTiempo: 92, atrasos: '1 leve (<48 h)', personas: 4,
    devuelto: 'Bs 1,000–5,000', antiguedad: '4 meses', ciudad: 'Quillacollo centro', disputas: 0,
    historial: [
      { id: '#031', persona: 'Alan M.', monto: 'Bs 500–1,000', estado: 'Devuelto con 1 día de atraso' },
      { id: '#027', persona: 'Lucía P.', monto: 'Bs 100–500', estado: 'Devuelto a tiempo' },
    ],
  },
  maria: {
    id: 'maria', nombre: 'María Quispe', corto: 'María Q.', foto: '/img/maria-quispe.jpg',
    nivel: '⭐ Muy cumplida', puntaje: 890, aTiempo: 98, atrasos: '0 días', personas: 12,
    devuelto: 'Bs 10,000–20,000', antiguedad: '9 meses', ciudad: 'Cochabamba, Feria 16 de Julio', disputas: 0,
    historial: [
      { id: '#055', persona: 'Pedro S.', monto: 'Bs 1,000–5,000', estado: 'Devuelto a tiempo' },
      { id: '#049', persona: 'Ana L.', monto: 'Bs 500–1,000', estado: 'Devuelto a tiempo' },
    ],
  },
  carlos: {
    id: 'carlos', nombre: 'Carlos V.', corto: 'Carlos V.', foto: '/img/carlos-v.jpg',
    nivel: '🌱 Nuevo', puntaje: 520, aTiempo: 100, atrasos: '0 días', personas: 1,
    devuelto: 'Bs 100–500', antiguedad: '1 mes', ciudad: 'Cochabamba', disputas: 0,
    historial: [{ id: '#012', persona: 'Rosa M.', monto: 'Bs 100–500', estado: 'Devuelto a tiempo' }],
  },
  brenda: {
    id: 'brenda', nombre: 'Brenda Calizaya', corto: 'Brenda C.', foto: '/img/brenda-c.jpg',
    nivel: '🏆 Palabra de oro', puntaje: 965, aTiempo: 99, atrasos: '0 días', personas: 27,
    devuelto: 'Bs 20,000+', antiguedad: '14 meses', ciudad: 'Cochabamba', disputas: 0,
    historial: [
      { id: '#088', persona: 'Mario T.', monto: 'Bs 1,000–5,000', estado: 'Devuelto a tiempo' },
      { id: '#081', persona: 'Sofía R.', monto: 'Bs 500–1,000', estado: 'Devuelto a tiempo' },
    ],
  },
};
