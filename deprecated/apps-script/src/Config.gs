/**
 * Config.gs
 * Constantes globales y lectores de configuración (hojas CONFIG y PLANTILLA).
 */
'use strict';

var APP = {
  HOJAS: {
    CONFIG: 'CONFIG',
    CLIENTES: 'CLIENTES',
    COTIZACIONES: 'COTIZACIONES',
    ITEMS: 'ITEMS',
    PLANTILLA: 'PLANTILLA',
    LOG: 'LOG'
  },
  COLORES: {
    PRIMARIO: '#0B3954',
    ACENTO: '#087E8B',
    GRIS: '#5B6B7C'
  },
  ESTADOS: ['borrador', 'enviada', 'aceptada', 'rechazada', 'vencida'],
  TZ: Session.getScriptTimeZone() || 'America/Santiago'
};

/** Encabezados de cada hoja (orden fijo). */
var ESQUEMA = {
  CONFIG: ['clave', 'valor', 'descripcion'],
  CLIENTES: ['id_cliente', 'nombre_institucion', 'responsable', 'cargo', 'correo', 'telefono', 'direccion', 'observaciones', 'fecha_alta'],
  COTIZACIONES: [
    'codigo', 'fecha', 'version', 'id_cliente', 'titulo_proyecto', 'clave_corta',
    'estado', 'moneda', 'total', 'servicio_tecnico_meses',
    'resumen_ejecutivo_md', 'alcance_md', 'entregables_md', 'git_md',
    'soporte_incluido_md', 'soporte_no_incluido_md', 'garantias_md',
    'condiciones_pago_md',
    'vigencia_dias', 'exclusiones_md', 'observaciones', 'pdf_url', 'fecha_generacion_pdf'
  ],
  ITEMS: ['codigo_cotizacion', 'orden', 'categoria', 'descripcion', 'detalle', 'justificacion', 'cantidad', 'unidad', 'precio_unitario'],
  PLANTILLA: ['clave', 'valor', 'descripcion'],
  LOG: ['fecha_hora', 'accion', 'codigo', 'detalle', 'usuario']
};

/**
 * Lee la hoja CONFIG como objeto { clave: valor }.
 */
function getConfig_() {
  var valores = leerHojaClaveValor_(APP.HOJAS.CONFIG);
  return {
    prestador_nombre: valores.prestador_nombre || '',
    prestador_titulo: valores.prestador_titulo || '',
    prestador_email: valores.prestador_email || '',
    prestador_telefono: valores.prestador_telefono || '',
    prestador_sitio_web: valores.prestador_sitio_web || '',
    prestador_git: valores.prestador_git || '',
    prestador_github_url: valores.prestador_github_url || '',
    prestador_orcid_id: valores.prestador_orcid_id || '',
    logo_url: valores.logo_url || '',
    tipo_documento: valores.tipo_documento || 'COTIZACIÓN DE SERVICIOS PROFESIONALES',
    prefijo_codigo: valores.prefijo_codigo || 'COT',
    patron_codigo: valores.patron_codigo || '{PREFIJO}-{CLAVE}-{ANIO}-{SEQ}',
    secuencia_digitos: Number(valores.secuencia_digitos) || 3,
    moneda: valores.moneda || 'CLP',
    vigencia_dias_default: Number(valores.vigencia_dias_default) || 15,
    pie_documento: valores.pie_documento || 'Documento generado electrónicamente — {CODIGO} · v{VERSION}',
    repo_modo: valores.repo_modo || 'privado',
    carpeta_salida_id: valores.carpeta_salida_id || '',
    pdf_api_key: valores.pdf_api_key || '',
    plantilla_version: Number(valores.plantilla_version) || 2,
    qr_activo: String(valores.qr_activo || 'true').toLowerCase() !== 'false',
    qr_base_url: valores.qr_base_url || '',
    hash_sal: valores.hash_sal || 'CAMBIA-ESTA-SAL'
  };
}

/**
 * Lee la hoja PLANTILLA como objeto { clave: valor }.
 * Si un texto no existe en la hoja, usa el valor semilla por defecto.
 */
function getPlantilla_() {
  var hoja = leerHojaClaveValor_(APP.HOJAS.PLANTILLA);
  var defectos = semillasPlantilla_();
  Object.keys(defectos).forEach(function (k) {
    if (hoja[k] === undefined || hoja[k] === null || hoja[k] === '') {
      hoja[k] = defectos[k];
    }
  });
  return hoja;
}

/** Lee una hoja clave|valor (2 primeras columnas) a objeto plano. */
function leerHojaClaveValor_(nombreHoja) {
  var hss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = hss.getSheetByName(nombreHoja);
  var out = {};
  if (!hoja) return out;
  var datos = hoja.getDataRange().getValues();
  for (var i = 1; i < datos.length; i++) {
    if (datos[i][0] !== '') out[datos[i][0]] = datos[i][1];
  }
  return out;
}
