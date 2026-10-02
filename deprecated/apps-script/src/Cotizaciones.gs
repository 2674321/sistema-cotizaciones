/**
 * Cotizaciones.gs
 * Registro, creación y consulta de cotizaciones (hojas COTIZACIONES e ITEMS).
 */
'use strict';

/** Datos que necesita el formulario de nueva cotización (puente cliente↔servidor). */
function datosParaFormulario() {
  var config = getConfig_();
  return {
    clientes: listarClientesParaFormulario(),
    monedaDefault: config.moneda,
    vigenciaDefault: config.vigencia_dias_default
  };
}

/** Convierte una fila de COTIZACIONES en objeto usando el esquema. */
function filaACotizacion_(fila) {
  var obj = {};
  ESQUEMA.COTIZACIONES.forEach(function (c, j) { obj[c] = fila[j]; });
  return obj;
}

/** Obtiene una cotización (encabezado + ítems) por código. */
function getCotizacion_(codigo) {
  var hss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = hss.getSheetByName(APP.HOJAS.COTIZACIONES);
  if (!hoja || hoja.getLastRow() < 2) return null;

  var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, ESQUEMA.COTIZACIONES.length).getValues();
  var encontrada = null;
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i][0]).trim() === String(codigo).trim()) {
      encontrada = filaACotizacion_(filas[i]);
      break;
    }
  }
  if (!encontrada) return null;
  encontrada.items = getItemsDeCotizacion_(codigo);
  return encontrada;
}

/** Ítems asociados a un código de cotización, ordenados. */
function getItemsDeCotizacion_(codigo) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP.HOJAS.ITEMS);
  var items = [];
  if (!hoja || hoja.getLastRow() < 2) return items;
  var encabezados = ESQUEMA.ITEMS;
  var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, encabezados.length).getValues();
  filas.forEach(function (f) {
    if (String(f[0]).trim() === String(codigo).trim()) {
      var obj = {};
      encabezados.forEach(function (c, j) { obj[c] = f[j]; });
      items.push(obj);
    }
  });
  return items.sort(function (a, b) { return Number(a.orden) - Number(b.orden); });
}

/**
 * Crea una cotización nueva desde el formulario del sistema.
 * datos: { clienteId | clienteNuevo, tituloProyecto, claveCorta, valor,
 *          moneda, mesesSoporte, vigenciaDias, condicionesPagoMd, observaciones }
 * Devuelve el código asignado.
 */
function crearCotizacionDesdeFormulario(datos) {
  crearEstructura();

  var titulo = String(datos.tituloProyecto || '').trim();
  if (!titulo) throw new Error('El título del proyecto es obligatorio.');
  var valor = Number(datos.valor);
  if (!valor || valor <= 0) throw new Error('El valor de la cotización debe ser mayor que cero.');

  var config = getConfig_();
  var clave = String(datos.claveCorta || '').trim().toUpperCase()
    || claveCortaDeTitulo_(titulo);
  var codigo = siguienteCodigo_(clave);

  var idCliente = datos.clienteId
    ? String(datos.clienteId)
    : buscarOCrearCliente_(datos.clienteNuevo);

  var hoy = new Date();
  var fila = [
    codigo,
    fechaCorta_(hoy),
    '1',
    idCliente,
    titulo,
    clave,
    'borrador',
    datos.moneda || config.moneda,
    valor,
    Number(datos.mesesSoporte) || 0,
    '', // resumen_ejecutivo_md (se completa en la hoja)
    '', // alcance_md
    '', // entregables_md
    '', // git_md
    '', // soporte_incluido_md
    '', // soporte_no_incluido_md
    datos.condicionesPagoMd || '',
    Number(datos.vigenciaDias) || config.vigencia_dias_default,
    '', // exclusiones_md
    datos.observaciones || '',
    '', // pdf_url
    ''  // fecha_generacion_pdf
  ];

  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP.HOJAS.COTIZACIONES);
  hoja.appendRow(fila);

  // Ítem principal por el valor total
  if (!datos.sinItemDefault) {
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP.HOJAS.ITEMS).appendRow([
      codigo, 1, 'Servicio profesional', titulo,
      datos.detalleItem || '',
      1, 'servicio', valor
    ]);
  }

  log_('COTIZACION_NUEVA', codigo, titulo + ' · ' + formatearDinero_(valor));
  return codigo;
}

/** Cambia el estado de una cotización (borrador|enviada|aceptada|rechazada|vencida). */
function cambiarEstado(codigo, nuevoEstado) {
  if (APP.ESTADOS.indexOf(nuevoEstado) === -1) {
    throw new Error('Estado no válido: ' + nuevoEstado);
  }
  var colEstado = ESQUEMA.COTIZACIONES.indexOf('estado') + 1;
  var fila = buscarFilaPorCodigo_(codigo);
  if (!fila) throw new Error('No se encontró la cotización ' + codigo);
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP.HOJAS.COTIZACIONES);
  hoja.getRange(fila, colEstado).setValue(nuevoEstado);
  log_('CAMBIO_ESTADO', codigo, '→ ' + nuevoEstado);
}

/** Número de fila (en la hoja) donde está el código; 0 si no existe. */
function buscarFilaPorCodigo_(codigo) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP.HOJAS.COTIZACIONES);
  if (!hoja || hoja.getLastRow() < 2) return 0;
  var codigos = hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < codigos.length; i++) {
    if (String(codigos[i][0]).trim() === String(codigo).trim()) return i + 2;
  }
  return 0;
}

/** Registra la URL y fecha del PDF generado. */
function registrarPdf_(codigo, url) {
  var colUrl = ESQUEMA.COTIZACIONES.indexOf('pdf_url') + 1;
  var colFecha = ESQUEMA.COTIZACIONES.indexOf('fecha_generacion_pdf') + 1;
  var fila = buscarFilaPorCodigo_(codigo);
  if (!fila) return;
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP.HOJAS.COTIZACIONES);
  hoja.getRange(fila, colUrl).setValue(url);
  hoja.getRange(fila, colFecha).setValue(new Date());
}
