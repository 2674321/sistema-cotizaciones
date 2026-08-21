/**
 * Hojas.gs
 * Creación y reparación de la estructura de hojas del sistema.
 * Seguro de ejecutar varias veces: no sobrescribe datos existentes.
 */
'use strict';

/**
 * Crea las 6 hojas del sistema si no existen, define encabezados,
 * formatos básicos y carga los valores semilla de CONFIG y PLANTILLA
 * solo para claves que aún no existan.
 */
function crearEstructura() {
  var hss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(ESQUEMA).forEach(function (nombre) {
    var hoja = hss.getSheetByName(nombre);
    if (!hoja) {
      hoja = hss.insertSheet(nombre);
    }
    var encabezados = ESQUEMA[nombre];
    var rango = hoja.getRange(1, 1, 1, encabezados.length);
    rango.setValues([encabezados]);
    rango.setFontWeight('bold')
         .setBackground(APP.COLORES.PRIMARIO)
         .setFontColor('#FFFFFF')
         .setVerticalAlignment('middle');
    hoja.setFrozenRows(1);
    hoja.setRowHeight(1, 28);
  });

  // CONFIG y PLANTILLA: semillas solo si la clave no existe
  sembrarClaveValor_(APP.HOJAS.CONFIG, semillasConfig_());
  sembrarClaveValor_(APP.HOJAS.PLANTILLA, semillasPlantilla_());

  // Formatos específicos
  var cot = hss.getSheetByName(APP.HOJAS.COTIZACIONES);
  var colFecha = ESQUEMA.COTIZACIONES.indexOf('fecha') + 1;
  var colTotal = ESQUEMA.COTIZACIONES.indexOf('total') + 1;
  cot.getRange(2, colFecha, cot.getMaxRows() - 1, 1).setNumberFormat('@'); // fecha como texto dd-MM-yyyy
  cot.getRange(2, colTotal, cot.getMaxRows() - 1, 1).setNumberFormat('$#,##0');

  var items = hss.getSheetByName(APP.HOJAS.ITEMS);
  var colPrecio = ESQUEMA.ITEMS.indexOf('precio_unitario') + 1;
  items.getRange(2, colPrecio, items.getMaxRows() - 1, 1).setNumberFormat('$#,##0');

  // Anchos sugeridos
  anchosSugeridos_(APP.HOJAS.CONFIG, [180, 320, 420]);
  anchosSugeridos_(APP.HOJAS.PLANTILLA, [220, 520, 380]);
  anchosSugeridos_(APP.HOJAS.CLIENTES, [90, 220, 160, 130, 200, 120, 200, 260, 100]);
  anchosSugeridos_(APP.HOJAS.COTIZACIONES, [170, 90, 60, 90, 240, 90, 90, 70, 100, 80, 400, 400, 360, 360, 300, 300, 300, 80, 340, 240, 260, 120]);
  anchosSugeridos_(APP.HOJAS.ITEMS, [170, 50, 150, 280, 360, 70, 80, 110]);
  anchosSugeridos_(APP.HOJAS.LOG, [150, 140, 170, 420, 200]);

  log_('ESTRUCTURA', '', 'Estructura de hojas creada/verificada');
}

/** Acción de menú: crea/repara estructura e informa al usuario. */
function menuCrearEstructura() {
  crearEstructura();
  SpreadsheetApp.getUi().alert('✅ Estructura lista', 'Las hojas CONFIG, CLIENTES, COTIZACIONES, ITEMS, PLANTILLA y LOG están creadas y con sus encabezados.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Inserta pares clave|valor|descripcion si la clave no existe aún. */
function sembrarClaveValor_(nombreHoja, semillas) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombreHoja);
  if (!hoja) return;
  var existentes = {};
  var ultima = hoja.getLastRow();
  if (ultima > 1) {
    hoja.getRange(2, 1, ultima - 1, 1).getValues().forEach(function (f) {
      if (f[0] !== '') existentes[f[0]] = true;
    });
  }
  var filas = [];
  Object.keys(semillas).forEach(function (clave) {
    if (!existentes[clave]) {
      filas.push([clave, semillas[clave].valor, semillas[clave].descripcion || '']);
    }
  });
  if (filas.length) {
    hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, 3).setValues(filas);
  }
}

function anchosSugeridos_(nombreHoja, anchos) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombreHoja);
  if (!hoja) return;
  for (var i = 0; i < anchos.length; i++) {
    hoja.setColumnWidth(i + 1, anchos[i]);
  }
}
