/**
 * Pdf.gs
 * Generación del documento final: Datos → Plantilla → Documento → PDF.
 * El PDF se guarda en Drive (carpeta configurada o "Cotizaciones").
 */
'use strict';

/**
 * Genera el PDF de una cotización y lo registra en la hoja.
 * Conversión:
 *  1. Si CONFIG.pdf_api_key está definida → servicio con Chrome real
 *     (Api2Pdf): resultado 100% fiel al diseño del HTML.
 *  2. Si no (o si la API falla) → conversor nativo de Google.
 * En ambos casos guarda también el .html en Drive para poder imprimirlo
 * desde el navegador (Ctrl+P) con fidelidad total cuando se prefiera.
 * @param {string} codigo Código de la cotización, p.ej. COT-ECICEP-2026-001
 * @return {Object} { url, nombre, url_html, motor }
 */
function generarPdf(codigo) {
  var cot = getCotizacion_(codigo);
  if (!cot) throw new Error('No existe la cotización ' + codigo);

  var config = getConfig_();
  var html = renderizarHtml_(cot);
  var nombreArchivo = cot.codigo + '_' + slug_(cot.titulo_proyecto);
  var carpeta = resolverCarpetaSalida_();

  // ── HTML editable/imprimible (siempre se guarda) ──
  var blobHtml = Utilities.newBlob(html, 'text/html', nombreArchivo + '.html');
  var archivoHtml = carpeta.createFile(blobHtml);

  // ── PDF ──
  var blob, motor;
  if (config.pdf_api_key) {
    try {
      blob = pdfViaChromeApi_(html, nombreArchivo, config.pdf_api_key);
      motor = 'chrome-api';
    } catch (e) {
      log_('PDF_API_FALLO', cot.codigo, String(e.message || e));
    }
  }
  if (!blob) {
    blob = Utilities.newBlob(html, 'text/html', nombreArchivo + '.html')
      .getAs('application/pdf')
      .setName(nombreArchivo + '.pdf');
    motor = 'nativo';
  }

  var archivo = carpeta.createFile(blob);
  registrarPdf_(cot.codigo, archivo.getUrl());
  log_('PDF_GENERADO', cot.codigo, motor + ' · ' + archivo.getUrl());

  return {
    url: archivo.getUrl(),
    nombre: nombreArchivo + '.pdf',
    url_html: archivoHtml.getUrl(),
    motor: motor
  };
}

/**
 * Convierte HTML a PDF con motor Chrome real vía Api2Pdf.
 * El contenido del documento viaja a sus servidores para el renderizado.
 * @return {GoogleAppsScript.Base.Blob} Blob PDF listo para guardar.
 */
function pdfViaChromeApi_(html, nombreArchivo, apiKey) {
  var opciones = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: apiKey },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      html: html,
      fileName: nombreArchivo + '.pdf',
      inlinePdf: false,
      options: {
        format: 'A4',
        printBackground: true,
        marginTop: '0mm', marginBottom: '0mm',
        marginLeft: '0mm', marginRight: '0mm'
      }
    })
  };
  var resp = UrlFetchApp.fetch('https://v2.api2pdf.com/chrome/html', opciones);
  if (resp.getResponseCode() !== 200) {
    throw new Error('Api2Pdf respondió ' + resp.getResponseCode() + ': ' + resp.getContentText().slice(0, 140));
  }
  var datos = JSON.parse(resp.getContentText());
  if (!datos.FileUrl) throw new Error(datos.Message || 'Respuesta sin FileUrl');

  var pdf = UrlFetchApp.fetch(datos.FileUrl, { muteHttpExceptions: true });
  if (pdf.getResponseCode() !== 200) throw new Error('No se pudo descargar el PDF generado');
  return pdf.getBlob().setName(nombreArchivo + '.pdf');
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
    var detalle = r.nombre + '\n\nMotor: ' + (r.motor === 'chrome-api'
      ? 'Chrome real (fiel al diseño)'
      : 'nativo de Google') + '\nHTML en Drive: ' + r.url_html
      + '\n\n¿Abrir el documento ahora?';
    var abrir = ui.alert('✅ PDF generado', detalle, ui.ButtonSet.YES_NO);
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
