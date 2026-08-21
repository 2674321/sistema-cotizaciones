/**
 * Pdf.gs
 * Generación del documento final: Datos → Plantilla → Documento → PDF.
 * El PDF se guarda en Drive (carpeta configurada o "Cotizaciones").
 */
'use strict';

/**
 * Genera el PDF de una cotización y lo registra en la hoja.
 * @param {string} codigo Código de la cotización, p.ej. COT-ECICEP-2026-001
 * @return {Object} { url, nombre }
 */
function generarPdf(codigo) {
  var cot = getCotizacion_(codigo);
  if (!cot) throw new Error('No existe la cotización ' + codigo);

  var html = renderizarHtml_(cot);
  var nombreArchivo = cot.codigo + '_' + slug_(cot.titulo_proyecto);

  var blob = Utilities.newBlob(html, 'text/html', nombreArchivo + '.html')
    .getAs('application/pdf')
    .setName(nombreArchivo + '.pdf');

  var carpeta = resolverCarpetaSalida_();
  var archivo = carpeta.createFile(blob);
  registrarPdf_(cot.codigo, archivo.getUrl());
  log_('PDF_GENERADO', cot.codigo, archivo.getUrl());

  return { url: archivo.getUrl(), nombre: nombreArchivo + '.pdf' };
}

/** Carpeta de salida según CONFIG (id) o subcarpeta "Cotizaciones" en raíz. */
function resolverCarpetaSalida_() {
  var config = getConfig_();
  if (config.carpeta_salida_id) {
    try {
      return DriveApp.getFolderById(config.carpeta_salida_id);
    } catch (e) {
      // ID inválido → usar carpeta por defecto
    }
  }
  var raiz = DriveApp.getRootFolder();
  var nombre = 'Cotizaciones';
  var it = raiz.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : raiz.createFolder(nombre);
}

/** Acción de menú: genera el PDF de la cotización seleccionada o pedida. */
function menuGenerarPdf() {
  var ui = SpreadsheetApp.getUi();
  var codigo = detectarCodigoSeleccionado_();
  if (!codigo) {
    var resp = ui.prompt(
      'Generar PDF',
      'Escribe el código de la cotización (ej: COT-ECICEP-2026-001):',
      ui.ButtonSet.OK_CANCEL
    );
    if (resp.getSelectedButton() !== ui.Button.OK) return;
    codigo = resp.getResponseText().trim();
  }
  try {
    var r = generarPdf(codigo);
    var abrir = ui.alert(
      '✅ PDF generado',
      r.nombre + '\n\n¿Abrir el documento ahora?',
      ui.ButtonSet.YES_NO
    );
    if (abrir === ui.Button.YES) {
      HtmlService.createHtmlOutput(
        '<script>window.top.location.href = "' + r.url + '";</script>'
      ).setWidth(60).setHeight(60);
    }
  } catch (e) {
    ui.alert('⚠️ Error al generar el PDF', String(e.message || e), ui.ButtonSet.OK);
  }
}

/**
 * Si la hoja activa es COTIZACIONES y hay una fila con código seleccionado,
 * devuelve ese código. Si no, cadena vacía.
 */
function detectarCodigoSeleccionado_() {
  var hss = SpreadsheetApp.getActiveSpreadsheet();
  if (hss.getSheetName() !== APP.HOJAS.COTIZACIONES) return '';
  var fila = hss.getActiveRange().getRow();
  if (fila < 2) return '';
  var valor = hss.getSheetByName(APP.HOJAS.COTIZACIONES).getRange(fila, 1).getValue();
  return /^COT-/.test(String(valor).trim()) ? String(valor).trim() : '';
}

/** Acción de menú: previsualiza el HTML de la cotización en un diálogo. */
function menuPrevisualizar() {
  var ui = SpreadsheetApp.getUi();
  var codigo = detectarCodigoSeleccionado_();
  if (!codigo) {
    var resp = ui.prompt('Previsualizar', 'Código de la cotización:', ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() !== ui.Button.OK) return;
    codigo = resp.getResponseText().trim();
  }
  try {
    var html = renderizarHtml_(getCotizacion_(codigo));
    html = html.replace(/<style>/, '<style>body{transform:scale(.72);transform-origin:top left;width:139%;}');
    var salida = HtmlService.createHtmlOutput(html)
      .setWidth(900)
      .setHeight(650);
    ui.showModalDialog(salida, 'Vista previa · ' + codigo);
  } catch (e) {
    ui.alert('⚠️ Error', String(e.message || e), ui.ButtonSet.OK);
  }
}
