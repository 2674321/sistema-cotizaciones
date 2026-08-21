/**
 * Numeracion.gs
 * Generación automática de códigos de cotización.
 * Patrón configurable en CONFIG: {PREFIJO}-{CLAVE}-{ANIO}-{SEQ}
 * Ejemplo: COT-ECICEP-2026-001
 */
'use strict';

/** Construye el código completo para una clave corta y secuencia dadas. */
function armarCodigo_(config, clave, anio, seq) {
  return config.patron_codigo
    .replace('{PREFIJO}', config.prefijo_codigo)
    .replace('{CLAVE}', clave)
    .replace('{ANIO}', String(anio))
    .replace('{SEQ}', padIzquierda_(seq, config.secuencia_digitos));
}

function padIzquierda_(n, ancho) {
  var s = String(n);
  while (s.length < ancho) s = '0' + s;
  return s;
}

/**
 * Calcula el siguiente código disponible para una clave corta.
 * Escanea los códigos existentes en COTIZACIONES y aumenta la secuencia.
 */
function siguienteCodigo_(clave) {
  var config = getConfig_();
  var anio = new Date().getFullYear();
  var patron = new RegExp('^'
    + escaparRegex_(config.prefijo_codigo)
    + '-' + escaparRegex_(clave)
    + '-' + anio
    + '-(\\d+)$');

  var maxSeq = 0;
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP.HOJAS.COTIZACIONES);
  if (hoja && hoja.getLastRow() > 1) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues().forEach(function (f) {
      var m = patron.exec(String(f[0]).trim());
      if (m) maxSeq = Math.max(maxSeq, Number(m[1]));
    });
  }
  return armarCodigo_(config, clave, anio, maxSeq + 1);
}

function escaparRegex_(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
