/**
 * Utils.gs
 * Utilidades compartidas: escape HTML, markdown ligero, fechas, dinero,
 * slugs, sustitución de tokens. Espejo exacto de scripts/generar_preview.py.
 */
'use strict';

/** Escapa texto para HTML. */
function escaparHtml_(t) {
  return String(t === null || t === undefined ? '' : t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Aplica **negritas** (usar SIEMPRE después de escapar). */
function negritaInline_(t) {
  return t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Markdown ligero → HTML (convención compartida con el generador local):
 *   "# Texto"  → subtítulo h3.sub
 *   "- Texto"  → ítem de lista (los consecutivos se agrupan)
 *   "> Texto"  → bloque de nota destacada
 *   texto      → párrafo ; **negrita** → <strong>
 */
function mdAHtml_(md, claseLista) {
  if (!md || !String(md).trim()) return '';
  claseLista = claseLista || 'lista';
  var lineas = String(md).split('\n');
  var html = [];
  var listaAbierta = false;
  var ln, i;

  function cerrarLista() {
    if (listaAbierta) { html.push('</ul>'); listaAbierta = false; }
  }

  for (i = 0; i < lineas.length; i++) {
    ln = lineas[i].replace(/\s+$/, '');
    if (ln.indexOf('# ') === 0) {
      cerrarLista();
      html.push('<h3 class="sub">' + negritaInline_(escaparHtml_(ln.substring(2))) + '</h3>');
    } else if (ln.indexOf('- ') === 0) {
      if (!listaAbierta) { html.push('<ul class="' + claseLista + '">'); listaAbierta = true; }
      html.push('<li>' + negritaInline_(escaparHtml_(ln.substring(2))) + '</li>');
    } else if (ln.indexOf('> ') === 0) {
      cerrarLista();
      html.push('<div class="nota"><p>' + negritaInline_(escaparHtml_(ln.substring(2))) + '</p></div>');
    } else if (!ln.trim()) {
      cerrarLista();
    } else {
      cerrarLista();
      html.push('<p>' + negritaInline_(escaparHtml_(ln)) + '</p>');
    }
  }
  cerrarLista();
  return html.join('\n');
}

/** Texto simple → párrafo único. */
function parrafoOvacio_(md) {
  if (!md || !String(md).trim()) return '';
  return '<p>' + negritaInline_(escaparHtml_(String(md).trim())) + '</p>';
}

/** Formatea dinero en formato chileno: 120000 → "$120.000". */
function formatearDinero_(valor) {
  var n = Math.round(Number(valor) || 0);
  return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Slug simple: "Sistema ECICEP Unificado" → "Sistema_ecicep_unificado". */
function slug_(texto) {
  var t = String(texto || '').trim().toLowerCase();
  t = t.replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
       .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n');
  t = t.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

/** Clave corta para códigos: "Sistema ECICEP Unificado" → "ECICEP". */
function claveCortaDeTitulo_(titulo) {
  var palabras = String(titulo || '').trim().split(/\s+/);
  var candidatas = palabras.filter(function (p) {
    return p.length >= 4 && /^[A-Za-zÁÉÍÓÚÑáéíóúñ0-9]+$/.test(p) && !/^(del|los|las|para|sistema|unificado)$/i.test(p);
  });
  var base = candidatas.length ? candidatas[0] : (palabras[0] || 'PROY');
  return slug_(base).toUpperCase().substring(0, 12);
}

/** Fecha Date → "dd-MM-yyyy". */
function fechaCorta_(d) {
  return Utilities.formatDate(d, APP.TZ, 'dd-MM-yyyy');
}

/** Fecha Date → "21 de agosto de 2026". */
function fechaLarga_(d) {
  var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return d.getDate() + ' de ' + meses[d.getMonth()] + ' de ' + d.getFullYear();
}

/** "dd-MM-yyyy" → Date. */
function parseFecha_(s) {
  var p = String(s).split('-');
  return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
}

/** Sustituye macros {MESES} {VIGENCIA_DIAS} {FECHA_VENCIMIENTO} {REPO_MODO} {CODIGO} {VERSION}. */
function conMacros_(texto, ctx) {
  return String(texto || '')
    .replace(/\{MESES\}/g, ctx.meses)
    .replace(/\{VIGENCIA_DIAS\}/g, ctx.vigenciaDias)
    .replace(/\{FECHA_VENCIMIENTO\}/g, ctx.fechaVencimiento)
    .replace(/\{REPO_MODO\}/g, ctx.repoModo)
    .replace(/\{CODIGO\}/g, ctx.codigo)
    .replace(/\{VERSION\}/g, ctx.version);
}

/** Reemplaza {{TOKENS}} en la plantilla HTML. Los desconocidos se vacían. */
function aplicarTokens_(html, tokens) {
  return html.replace(/\{\{(\w+)\}\}/g, function (m, clave) {
    return tokens.hasOwnProperty(clave) ? String(tokens[clave]) : '';
  });
}

/** Registro de eventos en hoja LOG. */
function log_(accion, codigo, detalle) {
  try {
    var hss = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = hss.getSheetByName(APP.HOJAS.LOG);
    if (!hoja) return;
    hoja.appendRow([
      new Date(), accion, codigo || '', detalle || '',
      Session.getActiveUser().getEmail()
    ]);
  } catch (e) { /* el LOG nunca debe interrumpir el flujo principal */ }
}
