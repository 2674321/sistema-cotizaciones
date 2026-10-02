/**
 * Menu.gs
 * Menú del sistema en la hoja de cálculo y acciones asociadas.
 */
'use strict';

/** Menú principal (se ejecuta al abrir la hoja). */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧾 Cotizaciones')
    .addItem('Crear / reparar estructura', 'menuCrearEstructura')
    .addItem('Cargar cotización ECICEP (inicial)', 'menuCargarECICEP')
    .addItem('Cargar cotización DEMO (ficticia)', 'menuCargarDemo')
    .addSeparator()
    .addItem('Nueva cotización…', 'menuNuevaCotizacion')
    .addItem('Vista previa…', 'menuPrevisualizar')
    .addItem('Generar PDF…', 'menuGenerarPdf')
    .addSeparator()
    .addItem('Ayuda', 'menuAyuda')
    .addToUi();
}

function menuCargarECICEP() {
  cargarCotizacionECICEP();
}

function menuCargarDemo() {
  cargarCotizacionDemo();
}

function menuNuevaCotizacion() {
  var html = HtmlService.createHtmlOutputFromFile('formulario_nueva_cotizacion')
    .setWidth(560)
    .setHeight(620);
  SpreadsheetApp.getUi().showModalDialog(html, 'Nueva cotización');
}

function menuAyuda() {
  var html = ''
    + '<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;padding:8px 12px;">'
    + '<h3 style="margin-top:0;color:#0B3954;">Sistema de Cotizaciones</h3>'
    + '<p><b>1.</b> «Crear / reparar estructura» crea las hojas del sistema.</p>'
    + '<p><b>2.</b> Edita tus datos en <b>CONFIG</b> (nombre, correo, vigencia, modo Git…).</p>'
    + '<p><b>3.</b> Registra clientes en <b>CLIENTES</b>.</p>'
    + '<p><b>4.</b> Crea cotizaciones con «Nueva cotización…» y completa los textos '
    + '(resumen, alcance, entregables) directamente en la hoja <b>COTIZACIONES</b>.</p>'
    + '<p><b>5.</b> Selecciona la fila de la cotización y usa «Generar PDF…». '
    + 'El documento queda guardado en Drive (carpeta <i>Cotizaciones</i>).</p>'
    + '<p style="color:#5B6B7C;">Formatos de texto: líneas con <code># </code> = subtítulo, '
    + '<code>- </code> = lista, <code>&gt; </code> = nota destacada, <code>**negrita**</code>.</p>'
    + '</div>';
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(520).setHeight(430),
    'Ayuda'
  );
}
