#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador local de cotizaciones (preview HTML + PDF).
Espejo funcional del motor de Google Apps Script: mismos datos,
misma plantilla (html/plantilla_cotizacion.html), mismas convenciones.

Uso:
    python3 scripts/generar_preview.py                 # genera todas las cotizaciones
    python3 scripts/generar_preview.py COT-ECICEP-2026-001
    python3 scripts/generar_preview.py --no-pdf        # solo HTML
"""
import base64
import hashlib
import io
import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DIR_DATOS = RAIZ / "datos"
DIR_PRIVADO = DIR_DATOS / "privado"      # datos reales (gitignored)
DIR_PLANTILLA = RAIZ / "html"
DIR_SALIDA = RAIZ / "preview"            # TODA la salida; solo *DEMO* se publica

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


# ─────────────────────────── utilidades ───────────────────────────

def cargar_json(nombre):
    """Carga datos/privado/<nombre> si existe (datos reales); si no, datos/<nombre>."""
    ruta = DIR_PRIVADO / nombre
    if not ruta.exists():
        ruta = DIR_DATOS / nombre
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def cargar_config():
    """CONFIG + overlay de secretos desde datos/privado/secreto.json (hash_sal, etc.)."""
    config = cargar_json("config.json")
    secreto = DIR_PRIVADO / "secreto.json"
    if secreto.exists():
        with open(secreto, encoding="utf-8") as f:
            config.setdefault("verificacion", {}).update(json.load(f))
    return config


def escapar(texto):
    return (str(texto).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def negrita_inline(texto_escapado):
    """Convierte **texto** en <strong> (aplicar SIEMPRE después de escapar)."""
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", texto_escapado)


def formatear_dinero(valor, moneda="CLP"):
    return f"${valor:,.0f}".replace(",", ".")


def parse_fecha(s):
    return datetime.strptime(s, "%d-%m-%Y")


def fecha_corta(d):
    return d.strftime("%d-%m-%Y")


def fecha_larga(d):
    return f"{d.day} de {MESES[d.month - 1]} de {d.year}"


def slug(texto):
    t = texto.strip().lower()
    t = re.sub(r"[áàä]", "a", t)
    t = re.sub(r"[éèë]", "e", t)
    t = re.sub(r"[íìï]", "i", t)
    t = re.sub(r"[óòö]", "o", t)
    t = re.sub(r"[úùü]", "u", t)
    t = re.sub(r"ñ", "n", t)
    t = re.sub(r"[^a-z0-9]+", "_", t).strip("_")
    return t.capitalize() if t else ""


# ───────────────── markdown ligero → HTML (convención compartida) ─────────────────
#   "# Texto"   → subtítulo
#   "- Texto"   → ítem de lista (los consecutivos se agrupan)
#   "> Texto"   → bloque de nota destacada
#   texto libre → párrafo ;  **negrita** → <strong>

def md_a_html(md, lista_clase="lista"):
    if not md or not str(md).strip():
        return ""
    html, lista_abierta = [], False
    for linea in str(md).split("\n"):
        ln = linea.rstrip()
        if ln.startswith("# "):
            if lista_abierta:
                html.append("</ul>")
                lista_abierta = False
            html.append(f'<h3 class="sub">{negrita_inline(escapar(ln[2:]))}</h3>')
        elif ln.startswith("- "):
            if not lista_abierta:
                html.append(f'<ul class="{lista_clase}">')
                lista_abierta = True
            html.append(f"<li>{negrita_inline(escapar(ln[2:]))}</li>")
        elif ln.startswith("> "):
            if lista_abierta:
                html.append("</ul>")
                lista_abierta = False
            html.append(f'<div class="nota"><p>{negrita_inline(escapar(ln[2:]))}</p></div>')
        elif not ln.strip():
            if lista_abierta:
                html.append("</ul>")
                lista_abierta = False
        else:
            if lista_abierta:
                html.append("</ul>")
                lista_abierta = False
            html.append(f"<p>{negrita_inline(escapar(ln))}</p>")
    if lista_abierta:
        html.append("</ul>")
    return "\n".join(html)


def parrafo_o_vacio(md):
    """Texto simple a párrafo único (sin listas)."""
    if not md or not str(md).strip():
        return ""
    return f"<p>{negrita_inline(escapar(str(md).strip()))}</p>"


def aplicar_tokens(platilla_html, tokens):
    def _sust(m):
        return str(tokens.get(m.group(1), ""))
    return re.sub(r"\{\{(\w+)\}\}", _sust, platilla_html)


# ─────────────────────────── construcción ───────────────────────────

def construir_cliente_filas(cliente):
    def v(valor):
        valor = (valor or "").strip()
        return escapar(valor) if valor else '<span class="vacio">Por completar</span>'
    filas = [
        ("Cliente / Institución", v(cliente.get("nombre_institucion"))),
        ("Responsable", v(cliente.get("responsable"))),
        ("Cargo", v(cliente.get("cargo"))),
        ("Correo", v(cliente.get("correo"))),
        ("Teléfono", v(cliente.get("telefono"))),
        ("Observaciones", v(cliente.get("observaciones"))),
    ]
    return "\n".join(f'<tr><td class="k">{k}</td><td class="v">{val}</td></tr>' for k, val in filas)


def construir_contacto_items(prestador):
    """Franja de contacto con links clicables (mailto, tel, https)."""
    def link(url, texto=None):
        return f'<a href="{escapar(url)}">{escapar(texto or url)}</a>'
    partes = []
    if prestador.get("email"):
        partes.append(f'<span class="etq">Correo</span>{link("mailto:" + prestador["email"], prestador["email"])}')
    if prestador.get("telefono"):
        tel_limpio = re.sub(r"[^\d+]", "", prestador["telefono"])
        partes.append(f'<span class="sep">|</span><span class="etq">Teléfono</span>{link("tel:" + tel_limpio, prestador["telefono"])}')
    if prestador.get("sitio_web"):
        partes.append(f'<span class="sep">|</span><span class="etq">Web</span>{link(prestador["sitio_web"])}')
    if prestador.get("github_url"):
        partes.append(f'<span class="sep">|</span><span class="etq">GitHub</span>{link(prestador["github_url"])}')
    if prestador.get("orcid_id"):
        partes.append(f'<span class="sep">|</span><span class="etq">ORCID</span>{link("https://orcid.org/" + prestador["orcid_id"].strip(), prestador["orcid_id"])}')
    if prestador.get("git"):
        partes.append(f'<span class="sep">|</span><span class="etq">Git</span>{link(prestador["git"])}')
    return "".join(partes) or "&nbsp;"


def construir_pie_documento(config, cot, hash_corto):
    """Pie con links clicables + código de verificación."""
    p = config["prestador"]
    trozos = [f"Documento generado electrónicamente por {escapar(p['nombre'])}"]
    enlaces = []
    if p.get("email"):
        enlaces.append(f'<a href="mailto:{escapar(p["email"])}">{escapar(p["email"])}</a>')
    if p.get("github_url"):
        enlaces.append(f'<a href="{escapar(p["github_url"])}">GitHub</a>')
    if p.get("orcid_id"):
        enlaces.append(f'<a href="https://orcid.org/{escapar(p["orcid_id"].strip())}">ORCID {escapar(p["orcid_id"])}</a>')
    if enlaces:
        trozos.append(" · ".join(enlaces))
    trozos.append(f"{escapar(cot['codigo'])} · v{escapar(str(cot.get('version', '1')))} · Verif. {hash_corto}")
    return " — ".join(trozos[:1]) + (" · " + " · ".join(trozos[1:]) if len(trozos) > 1 else "")


def calcular_hash(sal, codigo, version, fecha, total):
    """Hash corto de verificación: SHA-256(sal|código|versión|fecha|total) → 10 hex."""
    base = f"{sal}|{codigo}|{version}|{fecha}|{total}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()[:10].upper()


def construir_qr_data_uri(payload):
    """Genera el QR de verificación como data URI PNG. Devuelve '' si no hay librería."""
    try:
        import qrcode
        qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M,
                           box_size=6, border=1)
        qr.add_data(payload)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0B3954", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return ""


def construir_payload_qr(verificacion_cfg, cot, fecha_venc, hash_corto):
    base = (verificacion_cfg or {}).get("qr_base_url") or ""
    if base:
        sep = "&" if "?" in base else "?"
        return f"{base}{sep}c={cot['codigo']}&h={hash_corto}"
    return (f"VERIFICACION DE COTIZACION\n"
            f"Codigo: {cot['codigo']} v{cot.get('version', '1')}\n"
            f"Emitida: {cot['fecha']} · Vence: {fecha_corta(fecha_venc)}\n"
            f"Cod. verificacion: {hash_corto}")


def construir_desglose_html(items, moneda):
    """Tarjetas de desglose con justificación por concepto."""
    cajas = []
    for i, it in enumerate(sorted(items, key=lambda x: x.get("orden", 0)), start=1):
        precio = it.get("precio_unitario", 0)
        cantidad = it.get("cantidad", 1)
        monto = (f'<span class="des-monto">{formatear_dinero(round(cantidad * precio))} {escapar(moneda)}</span>'
                 if precio else '<span class="des-monto" style="color:#0B5A63;">INCLUIDO</span>')
        detalle = f'<div class="des-detalle">{escapar(it["detalle"])}</div>' if it.get("detalle") else ""
        just = (f'<div class="des-just"><b>Justificación:</b> {negrita_inline(escapar(it["justificacion"]))}</div>'
                if it.get("justificacion") else "")
        cajas.append(
            f'<table class="desglose"><tr><td class="des-num"></td><td>'
            f'<div class="des-caja">'
            f'{monto}'
            f'<div class="des-titulo">{i}. {escapar(it["descripcion"])}</div>'
            f'{detalle}{just}'
            f'</div></td></tr></table>'
        )
    return "\n".join(cajas)


def construir_items_rows(items, moneda):
    filas = []
    suma = 0
    for i, it in enumerate(sorted(items, key=lambda x: x.get("orden", 0)), start=1):
        cantidad = it.get("cantidad", 1)
        precio = it.get("precio_unitario", 0)
        total_item = round(cantidad * precio)
        suma += total_item
        detalle = f'<div class="item-detalle">{escapar(it["detalle"])}</div>' if it.get("detalle") else ""
        categoria = f'<span class="item-cat">{escapar(it["categoria"])}</span><br>' if it.get("categoria") else ""
        unidad = f' {escapar(it["unidad"])}' if it.get("unidad") and it.get("unidad") != "incluido" else ""
        monto = (formatear_dinero(total_item) if precio
                 else '<span class="chip-incluido">INCLUIDO</span>')
        filas.append(
            f'<tr><td class="centro">{i}</td>'
            f'<td>{categoria}<b>{escapar(it["descripcion"])}</b>{detalle}</td>'
            f'<td class="centro">{cantidad}{unidad}</td>'
            f'<td class="num">{monto}</td></tr>'
        )
    filas.append(
        f'<tr><td colspan="3" style="text-align:right;background:#EAF1F6;"><b>TOTAL</b></td>'
        f'<td class="num" style="background:#EAF1F6;"><b>{formatear_dinero(suma)} {escapar(moneda)}</b></td></tr>'
    )
    return "\n".join(filas), suma


def renderizar_cotizacion(cot, config, plantilla_cfg, clientes):
    prestador = config["prestador"]
    doc_cfg = config["documento"]

    cliente = next((c for c in clientes if c.get("id_cliente") == cot.get("id_cliente")), {})
    moneda = cot.get("moneda") or doc_cfg["moneda"]
    vigencia = int(cot.get("vigencia_dias") or doc_cfg["vigencia_dias_default"])
    meses_soporte = int(cot.get("servicio_tecnico_meses") or 0)

    fecha_emision = parse_fecha(cot["fecha"])
    fecha_venc = fecha_emision + timedelta(days=vigencia)

    items_rows, suma_items = construir_items_rows(cot.get("items", []), moneda)
    total = cot.get("total") or suma_items

    def pd(clave, defecto=""):
        """Valor de cotización con fallback a plantilla por defecto."""
        val = cot.get(clave)
        return val if val not in (None, "") else plantilla_cfg.get(defecto or clave, "")

    def con_macros(texto):
        return (str(texto)
                .replace("{MESES}", str(meses_soporte))
                .replace("{VIGENCIA_DIAS}", str(vigencia))
                .replace("{FECHA_VENCIMIENTO}", fecha_corta(fecha_venc))
                .replace("{REPO_MODO}", config.get("git", {}).get("modo", "privado"))
                .replace("{CODIGO}", cot["codigo"])
                .replace("{VERSION}", str(cot.get("version", "1"))))

    cliente_nombre = (cliente.get("nombre_institucion") or "").strip()

    cliente_nombre = (cliente.get("nombre_institucion") or "").strip()

    # ── Verificación (v2): hash + QR ──
    verificacion_cfg = config.get("verificacion", {})
    hash_corto = calcular_hash(verificacion_cfg.get("hash_sal", ""), cot["codigo"],
                               str(cot.get("version", "1")), cot["fecha"], total)
    fecha_venc_str = fecha_corta(fecha_venc)
    qr_data_uri = ""
    if verificacion_cfg.get("qr_activo", True):
        payload = construir_payload_qr(verificacion_cfg, cot, fecha_venc, hash_corto)
        qr_data_uri = construir_qr_data_uri(payload)

    tokens = {
        # identidad
        "PRESTADOR_NOMBRE": escapar(prestador["nombre"]),
        "PRESTADOR_TITULO": escapar(prestador["titulo"]),
        "TIPO_DOCUMENTO": escapar(doc_cfg["tipo"]),
        "CONTACTO_ITEMS": construir_contacto_items(prestador),
        # documento
        "CODIGO": escapar(cot["codigo"]),
        "VERSION": escapar(cot.get("version", "1")),
        "FECHA_CORTA": fecha_corta(fecha_emision),
        "FECHA_LARGA": fecha_larga(fecha_emision),
        "FECHA_VENCIMIENTO": fecha_venc_str,
        "MONEDA": escapar(moneda),
        "PIE_DOCUMENTO_HTML": construir_pie_documento(config, cot, hash_corto),
        "HASH_CORTO": hash_corto,
        "QR_DATA_URI": qr_data_uri,
        # portada
        "KICKER_PROYECTO": escapar(cot.get("estado", "").upper() == "BORRADOR"
                                   and "Propuesta de desarrollo de software"
                                   or "Desarrollo de software"),
        "TITULO_PROYECTO": escapar(cot["titulo_proyecto"]),
        "CLIENTE_LINEA": escapar(cliente_nombre) if cliente_nombre else '<span class="vacio">Por definir</span>',
        "VIGENCIA_DIAS": str(vigencia),
        # cliente
        "CLIENTE_FILAS": construir_cliente_filas(cliente),
        "ACEPTACION_NOMBRE": escapar((cliente.get("responsable") or "").strip()) or "&nbsp;",
        "ACEPTACION_CARGO": escapar((cliente.get("cargo") or "").strip()) or "&nbsp;",
        "ACEPTACION_INSTITUCION": escapar(cliente_nombre) or "&nbsp;",
        "ACEPTACION_FECHA": "&nbsp;",
        # contenidos
        "TITULO_RESUMEN": escapar(plantilla_cfg["seccion_resumen_titulo"]),
        "RESUMEN_HTML": md_a_html(pd("resumen_ejecutivo_md")),
        "TITULO_ALCANCE": escapar(plantilla_cfg["seccion_alcance_titulo"]),
        "ALCANCE_HTML": md_a_html(pd("alcance_md")),
        "TITULO_ENTREGABLES": escapar(plantilla_cfg["seccion_entregables_titulo"]),
        "ENTREGABLES_HTML": md_a_html(pd("entregables_md"), lista_clase="lista compacta"),
        "TITULO_GIT": escapar(plantilla_cfg["seccion_git_titulo"]),
        "GIT_HTML": md_a_html(con_macros(pd("git_md", "git_default_md"))),
        "TITULO_SOPORTE": escapar(con_macros(plantilla_cfg["seccion_soporte_titulo"])),
        "SOPORTE_INTRO_HTML": md_a_html(con_macros(pd("soporte_intro_md"))),
        "SOPORTE_INCLUIDO_HTML": md_a_html(pd("soporte_incluido_md"), lista_clase="lista compacta"),
        "SOPORTE_NO_INCLUIDO_HTML": md_a_html(pd("soporte_no_incluido_md"), lista_clase="lista compacta"),
        "SOPORTE_NOTA_HTML": parrafo_o_vacio(con_macros(pd("soporte_nota_md"))),
        "TITULO_INVERSION": escapar(plantilla_cfg["seccion_inversion_titulo"]),
        "ITEMS_ROWS": items_rows,
        "TOTAL_FORMATEADO": formatear_dinero(total),
        "MESES_SOPORTE": str(meses_soporte),
        "NOTA_TOTAL_HTML": parrafo_o_vacio(pd("nota_total")),
        "TITULO_DESGLOSE": escapar(plantilla_cfg.get("seccion_desglose_titulo", "")),
        "DESGLOSE_HTML": construir_desglose_html(cot.get("items", []), moneda),
        "TITULO_GARANTIAS": escapar(plantilla_cfg.get("seccion_garantias_titulo", "")),
        "GARANTIAS_HTML": md_a_html(pd("garantias_md", "garantias_default_md")),
        "TITULO_PAGO": escapar(plantilla_cfg["seccion_pago_titulo"]),
        "PAGO_HTML": md_a_html(pd("condiciones_pago_md", "condiciones_pago_default_md")),
        "TITULO_VIGENCIA": escapar(plantilla_cfg["seccion_vigencia_titulo"]),
        "VIGENCIA_TEXTO_HTML": parrafo_o_vacio(con_macros(plantilla_cfg["vigencia_texto"])),
        "VERIFICACION_TEXTO_HTML": parrafo_o_vacio(con_macros(plantilla_cfg.get("verificacion_texto", ""))),
        "TITULO_EXCLUSIONES": escapar(plantilla_cfg["seccion_exclusiones_titulo"]),
        "EXCLUSIONES_HTML": md_a_html(pd("exclusiones_md", "exclusiones_default_md")),
        "TITULO_ACEPTACION": escapar(plantilla_cfg["seccion_aceptacion_titulo"]),
        "ACEPTACION_CLAUSULA_HTML": parrafo_o_vacio(plantilla_cfg["aceptacion_clausula"]),
    }

    version_tpl = int(doc_cfg.get("plantilla_version", 1) or 1)
    nombre_plantilla = "plantilla_cotizacion.html" if version_tpl < 2 else f"plantilla_cotizacion_v{version_tpl}.html"
    plantilla = (DIR_PLANTILLA / nombre_plantilla).read_text(encoding="utf-8")
    return aplicar_tokens(plantilla, tokens)


# ─────────────────── campos editables (AcroForm) sobre el PDF ───────────────────
# Detecta zonas por texto ancla y superpone campos de formulario reales:
#   · "Por completar" / "Por definir" → datos del cliente
#   · Tabla de aceptación (Nombre/Cargo/Institución/Fecha) en la última página
#   · Líneas de firma
#   · Espacios "_____" de condiciones de pago

CAMPOS_CLIENTE = [
    "cliente_institucion", "cliente_responsable", "cliente_cargo",
    "cliente_correo", "cliente_telefono", "cliente_observaciones",
]


def agregar_campos_editables(ruta_pdf, secciones=("cliente", "aceptacion", "firma", "pago")):
    """Superpone campos AcroForm sobre las zonas ancla. Las secciones con
    datos ya impresos (cliente conocido) se omiten vía el parámetro."""
    import pymupdf

    doc = pymupdf.open(ruta_pdf)
    total = 0

    def nuevo_campo(pagina, rect, nombre, multilinea=False, fontsize=9):
        nonlocal total
        if rect.width < 20 or rect.height < 8:
            return
        w = pymupdf.Widget()
        w.field_name = nombre
        w.field_type = pymupdf.PDF_WIDGET_TYPE_TEXT
        w.rect = rect
        w.text_color = (0.10, 0.22, 0.33)
        w.fill_color = (0.965, 0.985, 0.99)
        w.border_color = (0.45, 0.72, 0.76)
        w.border_width = 0.8
        w.text_fontsize = fontsize
        if multilinea:
            w.field_flags = 4096  # multilínea
        pagina.add_widget(w)
        total += 1

    # ── Datos del cliente: placeholders "Por completar" / "Por definir" ──
    if "cliente" in secciones:
        idx_cliente = 0
        for pagina in doc:
            for r in pagina.search_for("Por completar"):
                if idx_cliente < len(CAMPOS_CLIENTE):
                    multilinea = CAMPOS_CLIENTE[idx_cliente].endswith("observaciones")
                    nuevo_campo(pagina, r + (-2, -3, 2, 3),
                                CAMPOS_CLIENTE[idx_cliente], multilinea=multilinea)
                    idx_cliente += 1
            for r in pagina.search_for("Por definir"):
                nuevo_campo(pagina, r + (-2, -3, 2, 3), "cliente_institucion")

    # ── Última página: aceptación y firmas ──
    ultima = doc[-1]
    derecha = ultima.rect.width - 42  # borde derecho útil del contenido

    # Alineación: la columna de valores de la tabla de aceptación parte
    # siempre en el mismo x (columna "k" = 26% del ancho de contenido).
    # Se mide con el borde izquierdo real de las etiquetas para que los
    # cuatro campos queden perfectamente alineados entre sí.
    if "aceptacion" in secciones:
        etiquetas_aceptacion = [("Nombre", "aceptacion_nombre"),
                                ("Cargo", "aceptacion_cargo"),
                                ("Institución", "aceptacion_institucion"),
                                ("Fecha", "aceptacion_fecha")]
        rects_etiquetas = []
        for etiqueta, _ in etiquetas_aceptacion:
            encontrados = ultima.search_for(etiqueta)
            if encontrados:
                rects_etiquetas.append(sorted(encontrados, key=lambda x: x.y0)[0])
        if rects_etiquetas:
            x_tabla = min(r.x0 for r in rects_etiquetas) - 9.1   # padding izq. celda (3.2mm)
            ancho_contenido = ultima.rect.width - 2 * 39.685     # márgenes @page 14mm
            x_valor = x_tabla + 0.26 * ancho_contenido + 3       # inicio columna valor
            for (etiqueta, nombre), r in zip(etiquetas_aceptacion, rects_etiquetas):
                nuevo_campo(ultima,
                            pymupdf.Rect(x_valor, r.y0 - 4, derecha, r.y1 + 4),
                            nombre)

    # Firma: un solo campo amplio sobre cada línea (espacio para firmar/escribir)
    if "firma" in secciones:
        encontrados = ultima.search_for("Firma del cliente")
        if encontrados:
            r = encontrados[0]
            nuevo_campo(ultima,
                        pymupdf.Rect(r.x0 - 3, r.y0 - 46, r.x0 + 225, r.y0 - 6),
                        "firma_cliente")

    # ── Espacios de subrayado en forma de pago ──
    n_pago = 0
    for pagina in doc:
        for x0, y0, x1, y1, palabra, *_ in pagina.get_text("words"):
            if len(palabra) >= 6 and set(palabra) == {"_"}:
                n_pago += 1
                nuevo_campo(pagina, pymupdf.Rect(x0, y0 - 2, x1, y1 + 2),
                            f"pago_campo_{n_pago}", fontsize=8)

    if total:
        temporal = str(ruta_pdf) + ".tmp"
        doc.save(temporal, garbage=3, deflate=True)
        doc.close()
        Path(temporal).replace(ruta_pdf)
    else:
        doc.close()
    return total


# ─────────────────────────────── main ───────────────────────────────

def generar(codigo_objetivo=None, con_pdf=True, con_campos=True, demo=False):
    """Genera los documentos en preview/ (carpeta única de salida).
    · REALES: datos desde datos/privado/ (gitignored). El .gitignore solo
      publica los archivos *DEMO*; los demás quedan locales.
      Si el cliente ya tiene nombre/cargo/institución, esos datos se IMPRIMEN
      y no se agregan campos rellenables sobre ellos.
    · PRUEBA (--demo): datos/demo.json (100% ficticia).
    """
    config = cargar_config()
    plantilla_cfg = cargar_json("plantilla.json")

    if demo:
        datos_demo = cargar_json("demo.json")
        clientes = [datos_demo["cliente"]]
        cotizaciones = [datos_demo["cotizacion"]]
        # El documento demo es público: nunca ejercita la sal real.
        config.setdefault("verificacion", {})["hash_sal"] = \
            config.get("verificacion", {}).get("hash_sal_demo") or "DEMO-SAL-PUBLICA"
    else:
        clientes = cargar_json("clientes.json")
        cotizaciones = cargar_json("cotizaciones.json")

    dir_salida = DIR_SALIDA
    dir_salida.mkdir(parents=True, exist_ok=True)
    generados = []

    for cot in cotizaciones:
        if codigo_objetivo and cot["codigo"] != codigo_objetivo:
            continue
        cliente = next((c for c in clientes
                        if c.get("id_cliente") == cot.get("id_cliente")), {})
        html = renderizar_cotizacion(cot, config, plantilla_cfg, clientes)
        salida_html = dir_salida / f"{cot['codigo']}.html"
        salida_html.write_text(html, encoding="utf-8")
        resultado = {"codigo": cot["codigo"], "html": str(salida_html)}

        if con_pdf:
            from weasyprint import HTML
            salida_pdf = dir_salida / f"{cot['codigo']}_{slug(cot['titulo_proyecto'])}.pdf"
            HTML(string=html, base_url=str(RAIZ)).write_pdf(str(salida_pdf))
            if con_campos:
                # Con cliente completo (nombre+cargo+institución) los datos van
                # impresos: solo quedan campos para los espacios de pago "__".
                cliente_completo = all(str(cliente.get(k) or "").strip()
                                       for k in ("nombre_institucion", "responsable", "cargo"))
                secciones = ("pago",) if cliente_completo else \
                            ("cliente", "aceptacion", "firma", "pago")
                n_campos = agregar_campos_editables(salida_pdf, secciones)
                resultado["campos"] = n_campos
            resultado["pdf"] = str(salida_pdf)

        generados.append(resultado)
        resumen = resultado.get("pdf", resultado["html"])
        if "campos" in resultado:
            resumen += f"  [{resultado['campos']} campos editables]"
        etiqueta = "PRUEBA" if demo else ""
        print(f"✔ {resultado['codigo']}{(' [' + etiqueta + ']') if etiqueta else ''}: {resumen}")

    if codigo_objetivo and not generados:
        print(f"No se encontró la cotización {codigo_objetivo}")
        sys.exit(1)
    return generados


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    con_pdf = "--no-pdf" not in sys.argv
    con_campos = "--sin-campos" not in sys.argv
    es_demo = "--demo" in sys.argv
    generar(args[0] if args else None, con_pdf, con_campos, es_demo)
