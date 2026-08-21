/**
 * Clientes.gs
 * Administración de clientes e instituciones (hoja CLIENTES).
 */
'use strict';

/** Obtiene un cliente por id como objeto { campo: valor }. */
function getCliente_(idCliente) {
  if (!idCliente) return {};
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP.HOJAS.CLIENTES);
  if (!hoja || hoja.getLastRow() < 2) return {};
  var encabezados = ESQUEMA.CLIENTES;
  var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, encabezados.length).getValues();
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i][0]).trim() === String(idCliente).trim()) {
      var obj = {};
      encabezados.forEach(function (c, j) { obj[c] = filas[i][j]; });
      return obj;
    }
  }
  return {};
}

/** Lista de clientes para formularios: [{id, nombre}]. */
function listarClientesParaFormulario() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP.HOJAS.CLIENTES);
  var lista = [];
  if (hoja && hoja.getLastRow() > 1) {
    var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, 2).getValues();
    filas.forEach(function (f) {
      if (f[0] !== '') lista.push({ id: f[0], nombre: f[1] || f[0] });
    });
  }
  return lista;
}

/**
 * Busca un cliente por nombre; si no existe lo crea con id secuencial.
 * Devuelve el id_cliente.
 */
function buscarOCrearCliente_(nombreInstitucion) {
  var nombre = String(nombreInstitucion || '').trim();
  if (!nombre) return '';

  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP.HOJAS.CLIENTES);
  if (!hoja) crearEstructura();

  if (hoja.getLastRow() > 1) {
    var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, 2).getValues();
    for (var i = 0; i < filas.length; i++) {
      if (String(filas[i][1]).trim().toLowerCase() === nombre.toLowerCase()) {
        return filas[i][0];
      }
    }
  }

  // Nuevo id secuencial: CL-001, CL-002...
  var maxNum = 0;
  if (hoja.getLastRow() > 1) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues().forEach(function (f) {
      var m = /^CL-(\d+)$/.exec(String(f[0]).trim());
      if (m) maxNum = Math.max(maxNum, Number(m[1]));
    });
  }
  var nuevoId = 'CL-' + ('00' + (maxNum + 1)).slice(-3);
  hoja.appendRow([nuevoId, nombre, '', '', '', '', '', '', fechaCorta_(new Date())]);
  log_('CLIENTE_NUEVO', nuevoId, nombre);
  return nuevoId;
}
