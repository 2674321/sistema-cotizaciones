'use strict';

function formatoCLP(valor) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(valor);
}

function codigoVerificacion(folio, fechaISO) {
  const base = `${folio}|${fechaISO}`;
  let h = 5381;
  for (const c of base) {
    h = ((h * 33) ^ c.codePointAt(0)) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(7, '0');
}

module.exports = { formatoCLP, codigoVerificacion };
