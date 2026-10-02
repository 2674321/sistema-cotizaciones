/**
 * Plantilla.gs
 * Motor de renderizado v2: datos → HTML (misma plantilla y convenciones
 * que scripts/generar_preview.py).
 * Novedades v2: links clicables, QR de verificación con hash,
 * desglose justificado de la inversión, garantías, control de documento.
 */
'use strict';

/** Selecciona el archivo de plantilla según CONFIG (plantilla_version). */
function archivoPlantilla_(config) {
  var v = Number(config.plantilla_version) || 2;
  return v < 2 ? 'plantilla_cotizacion' : 'plantilla_cotizacion_v' + v;
}

/**
 * Renderiza el HTML completo de una cotización.
 * @param {Object} cot Cotización obtenida con getCotizacion_()
 * @return {string} HTML listo para convertir a PDF.
 */
function renderizarHtml_(cot) {
  var config = getConfig_();
  var plantillaCfg = getPlantilla_();
  var cliente = getCliente_(cot.id_cliente);

  var moneda = cot.moneda || config.moneda;
  var vigencia = Number(cot.vigencia_dias) || config.vigencia_dias_default;
  var mesesSoporte = Number(cot.servicio_tecnico_meses) || 0;

  var fechaEmision = cot.fecha instanceof Date ? cot.fecha : parseFecha_(cot.fecha);
  var fechaVencimiento = new Date(fechaEmision.getTime());
  fechaVencimiento.setDate(fechaVencimiento.getDate() + vigencia);

  var itemsRows = construirItemsRows_(cot.items || [], moneda);
  var sumaItems = 0;
  (cot.items || []).forEach(function (it) {
    sumaItems += Math.round(Number(it.cantidad || 1) * Number(it.precio_unitario || 0));
  });
  var total = Number(cot.total) || sumaItems;

  // ── Verificación: hash corto + QR ──
  var hashCorto = calcularHashCorto_(config.hash_sal, cot.codigo,
    String(cot.version || '1'), fechaCorta_(fechaEmision), total);
  var qrDataUri = config.qr_activo
    ? generarQrDataUri_(construirPayloadQr_(config, cot, fechaCorta_(fechaVencimiento), hashCorto))
    : '';

  var ctx = {
    meses: String(mesesSoporte),
    vigenciaDias: String(vigencia),
    fechaVencimiento: fechaCorta_(fechaVencimiento),
    repoModo: config.repo_modo,
    codigo: cot.codigo,
    version: String(cot.version || '1')
  };

  /** Valor de la cotización con fallback al texto por defecto de PLANTILLA. */
  function pd(valorCot, claveDefecto) {
    if (valorCot !== undefined && valorCot !== null && String(valorCot).trim() !== '') {
      return valorCot;
    }
    return plantillaCfg[claveDefecto] || '';
  }

  var clienteNombre = String(cliente.nombre_institucion || '').trim();
  var esBorrador = String(cot.estado || '').toLowerCase() === 'borrador';

  var tokens = {
    // Identidad
    PRESTADOR_NOMBRE: escaparHtml_(config.prestador_nombre),
    PRESTADOR_TITULO: escaparHtml_(config.prestador_titulo),
    TIPO_DOCUMENTO: escaparHtml_(config.tipo_documento),
    CONTACTO_ITEMS: construirContactoItems_(config),

    // Documento
    CODIGO: escaparHtml_(cot.codigo),
    VERSION: escaparHtml_(cot.version || '1'),
    FECHA_CORTA: fechaCorta_(fechaEmision),
    FECHA_LARGA: fechaLarga_(fechaEmision),
    FECHA_VENCIMIENTO: ctx.fechaVencimiento,
    MONEDA: escaparHtml_(moneda),
    PIE_DOCUMENTO_HTML: construirPieDocumento_(config, cot, hashCorto),
    HASH_CORTO: hashCorto,
    QR_DATA_URI: qrDataUri,

    // Portada compacta
    KICKER_PROYECTO: esBorrador
      ? 'Propuesta de desarrollo de software'
      : 'Desarrollo de software',
    TITULO_PROYECTO: escaparHtml_(cot.titulo_proyecto),
    CLIENTE_LINEA: clienteNombre
      ? escaparHtml_(clienteNombre)
      : '<span class="vacio">Por definir</span>',
    VIGENCIA_DIAS: String(vigencia),

    // Secciones
    CLIENTE_FILAS: construirClienteFilas_(cliente),
    ACEPTACION_NOMBRE: escaparHtml_(String(cliente.responsable || '').trim()) || '&nbsp;',
    ACEPTACION_CARGO: escaparHtml_(String(cliente.cargo || '').trim()) || '&nbsp;',
    ACEPTACION_INSTITUCION: escaparHtml_(clienteNombre) || '&nbsp;',
    ACEPTACION_FECHA: '&nbsp;',
    TITULO_RESUMEN: escaparHtml_(plantillaCfg.seccion_resumen_titulo),
    RESUMEN_HTML: mdAHtml_(pd(cot.resumen_ejecutivo_md)),
    TITULO_ALCANCE: escaparHtml_(plantillaCfg.seccion_alcance_titulo),
    ALCANCE_HTML: mdAHtml_(pd(cot.alcance_md)),
    TITULO_ENTREGABLES: escaparHtml_(plantillaCfg.seccion_entregables_titulo),
    ENTREGABLES_HTML: mdAHtml_(pd(cot.entregables_md), 'lista compacta'),
    TITULO_GIT: escaparHtml_(plantillaCfg.seccion_git_titulo),
    GIT_HTML: mdAHtml_(conMacros_(pd(cot.git_md, 'git_default_md'), ctx)),
    TITULO_SOPORTE: escaparHtml_(conMacros_(plantillaCfg.seccion_soporte_titulo, ctx)),
    SOPORTE_INTRO_HTML: mdAHtml_(conMacros_(plantillaCfg.soporte_intro_md, ctx)),
    SOPORTE_INCLUIDO_HTML: mdAHtml_(pd(cot.soporte_incluido_md, 'soporte_incluido_md'), 'lista compacta'),
    SOPORTE_NO_INCLUIDO_HTML: mdAHtml_(pd(cot.soporte_no_incluido_md, 'soporte_no_incluido_md'), 'lista compacta'),
    SOPORTE_NOTA_HTML: parrafoOvacio_(conMacros_(plantillaCfg.soporte_nota_md, ctx)),
    TITULO_INVERSION: escaparHtml_(plantillaCfg.seccion_inversion_titulo),
    ITEMS_ROWS: itemsRows,
    TOTAL_FORMATEADO: formatearDinero_(total),
    MESES_SOPORTE: String(mesesSoporte),
    NOTA_TOTAL_HTML: parrafoOvacio_(plantillaCfg.nota_total),
    TITULO_DESGLOSE: escaparHtml_(plantillaCfg.seccion_desglose_titulo || ''),
    DESGLOSE_HTML: construirDesgloseHtml_(cot.items || [], moneda),
    TITULO_GARANTIAS: escaparHtml_(plantillaCfg.seccion_garantias_titulo || ''),
    GARANTIAS_HTML: mdAHtml_(pd(cot.garantias_md, 'garantias_default_md')),
    TITULO_PAGO: escaparHtml_(plantillaCfg.seccion_pago_titulo),
    PAGO_HTML: mdAHtml_(pd(cot.condiciones_pago_md, 'condiciones_pago_default_md')),
    TITULO_VIGENCIA: escaparHtml_(plantillaCfg.seccion_vigencia_titulo),
    VIGENCIA_TEXTO_HTML: parrafoOvacio_(conMacros_(plantillaCfg.vigencia_texto, ctx)),
    VERIFICACION_TEXTO_HTML: parrafoOvacio_(conMacros_(plantillaCfg.verificacion_texto || '', ctx)),
    TITULO_EXCLUSIONES: escaparHtml_(plantillaCfg.seccion_exclusiones_titulo),
    EXCLUSIONES_HTML: mdAHtml_(pd(cot.exclusiones_md, 'exclusiones_default_md')),
    TITULO_ACEPTACION: escaparHtml_(plantillaCfg.seccion_aceptacion_titulo),
    ACEPTACION_CLAUSULA_HTML: parrafoOvacio_(plantillaCfg.aceptacion_clausula)
  };

  var plantilla = HtmlService.createHtmlOutputFromFile(archivoPlantilla_(config)).getContent();
  return aplicarTokens_(plantilla, tokens);
}

/* ═══════════════ Verificación de autenticidad (v2) ═══════════════ */

/** SHA-256(sal|código|versión|fecha|total) → 10 hex mayúsculas. */
function calcularHashCorto_(sal, codigo, version, fecha, total) {
  var base = sal + '|' + codigo + '|' + version + '|' + fecha + '|' + total;
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, base, Utilities.Charset.UTF_8);
  var hex = bytes.map(function (b) {
    var h = (b < 0 ? b + 256 : b).toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
  return hex.substring(0, 10).toUpperCase();
}

/** Payload del QR: URL de verificación si está configurada; texto si no. */
function construirPayloadQr_(config, cot, fechaVenc, hashCorto) {
  if (config.qr_base_url) {
    var sep = config.qr_base_url.indexOf('?') >= 0 ? '&' : '?';
    return config.qr_base_url + sep + 'c=' + encodeURIComponent(cot.codigo) + '&h=' + hashCorto;
  }
  return 'VERIFICACION DE COTIZACION\n'
    + 'Codigo: ' + cot.codigo + ' v' + (cot.version || '1') + '\n'
    + 'Emitida: ' + fechaCorta_(parseFecha_(String(cot.fecha))) + ' · Vence: ' + fechaVenc + '\n'
    + 'Cod. verificacion: ' + hashCorto;
}

/**
 * Genera un PNG del QR vía servicio externo (api.qrserver.com) y lo
 * devuelve como data URI. Si falla (sin red, cuota…), devuelve '' y el
 * documento se genera sin QR sin interrumpir el flujo.
 */
function generarQrDataUri_(payload) {
  try {
    var url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300'
      + '&color=0B3954&bgcolor=FFFFFF&data=' + encodeURIComponent(payload);
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) return '';
    var bytes = resp.getBlob().getBytes();
    return 'data:image/png;base64,' + Utilities.base64Encode(bytes);
  } catch (e) {
    log_('QR_ERROR', '', String(e.message || e));
    return '';
  }
}

/* ═══════════════ Bloques de contenido ═══════════════ */

/** Filas "clave | valor" de la sección Información del cliente. */
function construirClienteFilas_(cliente) {
  function v(valor) {
    var t = String(valor === null || valor === undefined ? '' : valor).trim();
    return t ? escaparHtml_(t) : '<span class="vacio">Por completar</span>';
  }
  var filas = [
    ['Cliente / Institución', v(cliente.nombre_institucion)],
    ['Responsable', v(cliente.responsable)],
    ['Cargo', v(cliente.cargo)],
    ['Correo', v(cliente.correo)],
    ['Teléfono', v(cliente.telefono)],
    ['Observaciones', v(cliente.observaciones)]
  ];
  return filas.map(function (f) {
    return '<tr><td class="k">' + f[0] + '</td><td class="v">' + f[1] + '</td></tr>';
  }).join('\n');
}

/** Franja de contacto del encabezado con links clicables. */
function construirContactoItems_(config) {
  function link(url, texto) {
    return '<a href="' + escaparHtml_(url) + '">' + escaparHtml_(texto || url) + '</a>';
  }
  var partes = [];
  if (config.prestador_email) {
    partes.push('<span class="etq">Correo</span>' + link('mailto:' + config.prestador_email, config.prestador_email));
  }
  if (config.prestador_telefono) {
    var tel = config.prestador_telefono.replace(/[^\d+]/g, '');
    partes.push('<span class="sep">|</span><span class="etq">Teléfono</span>' + link('tel:' + tel, config.prestador_telefono));
  }
  if (config.prestador_sitio_web) {
    partes.push('<span class="sep">|</span><span class="etq">Web</span>' + link(config.prestador_sitio_web));
  }
  if (config.prestador_github_url) {
    partes.push('<span class="sep">|</span><span class="etq">GitHub</span>' + link(config.prestador_github_url));
  }
  if (config.prestador_orcid_id) {
    partes.push('<span class="sep">|</span><span class="etq">ORCID</span>'
      + link('https://orcid.org/' + String(config.prestador_orcid_id).trim(), config.prestador_orcid_id));
  }
  if (config.prestador_git) {
    partes.push('<span class="sep">|</span><span class="etq">Git</span>' + link(config.prestador_git));
  }
  return partes.join('') || '&nbsp;';
}

/** Pie del documento con links + código de verificación. */
function construirPieDocumento_(config, cot, hashCorto) {
  var enlaces = [];
  if (config.prestador_email) {
    enlaces.push('<a href="mailto:' + escaparHtml_(config.prestador_email) + '">' + escaparHtml_(config.prestador_email) + '</a>');
  }
  if (config.prestador_github_url) {
    enlaces.push('<a href="' + escaparHtml_(config.prestador_github_url) + '">GitHub</a>');
  }
  if (config.prestador_orcid_id) {
    enlaces.push('<a href="https://orcid.org/' + escaparHtml_(String(config.prestador_orcid_id).trim()) + '">ORCID ' + escaparHtml_(config.prestador_orcid_id) + '</a>');
  }
  return 'Documento generado electrónicamente por ' + escaparHtml_(config.prestador_nombre)
    + ' · ' + enlaces.join(' · ')
    + ' · ' + escaparHtml_(cot.codigo) + ' · v' + escaparHtml_(String(cot.version || '1'))
    + ' · Verif. ' + hashCorto;
}

/** Filas de la tabla de ítems + fila TOTAL. Precio 0 → chip INCLUIDO. */
function construirItemsRows_(items, moneda) {
  var filas = [];
  var suma = 0;
  items.forEach(function (it, idx) {
    var cantidad = Number(it.cantidad || 1);
    var precio = Number(it.precio_unitario || 0);
    var totalItem = Math.round(cantidad * precio);
    suma += totalItem;

    var detalle = it.detalle
      ? '<div class="item-detalle">' + escaparHtml_(it.detalle) + '</div>'
      : '';
    var categoria = it.categoria
      ? '<span class="item-cat">' + escaparHtml_(it.categoria) + '</span><br>'
      : '';
    var unidad = (it.unidad && String(it.unidad).toLowerCase() !== 'incluido')
      ? ' ' + escaparHtml_(it.unidad)
      : '';
    var monto = precio > 0
      ? formatearDinero_(totalItem)
      : '<span class="chip-incluido">INCLUIDO</span>';

    filas.push(
      '<tr><td class="centro">' + (idx + 1) + '</td>'
      + '<td>' + categoria + '<b>' + escaparHtml_(it.descripcion) + '</b>' + detalle + '</td>'
      + '<td class="centro">' + cantidad + unidad + '</td>'
      + '<td class="num">' + monto + '</td></tr>'
    );
  });
  filas.push(
    '<tr><td colspan="3" style="text-align:right;background:#EAF1F6;"><b>TOTAL</b></td>'
    + '<td class="num" style="background:#EAF1F6;"><b>' + formatearDinero_(suma) + ' ' + escaparHtml_(moneda) + '</b></td></tr>'
  );
  return filas.join('\n');
}

/** Tarjetas de desglose con justificación por concepto (v2). */
function construirDesgloseHtml_(items, moneda) {
  return items.map(function (it, idx) {
    var precio = Number(it.precio_unitario || 0);
    var cantidad = Number(it.cantidad || 1);
    var monto = precio > 0
      ? '<span class="des-monto">' + formatearDinero_(Math.round(cantidad * precio)) + ' ' + escaparHtml_(moneda) + '</span>'
      : '<span class="des-monto" style="color:#0B5A63;">INCLUIDO</span>';
    var detalle = it.detalle
      ? '<div class="des-detalle">' + escaparHtml_(it.detalle) + '</div>'
      : '';
    var just = it.justificacion
      ? '<div class="des-just"><b>Justificación:</b> ' + negritaInline_(escaparHtml_(it.justificacion)) + '</div>'
      : '';
    return '<table class="desglose"><tr><td class="des-num"></td><td>'
      + '<div class="des-caja">' + monto
      + '<div class="des-titulo">' + (idx + 1) + '. ' + escaparHtml_(it.descripcion) + '</div>'
      + detalle + just + '</div></td></tr></table>';
  }).join('\n');
}
