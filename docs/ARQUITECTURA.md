# Arquitectura del sistema

## Principios de diseño

1. **Separación estricta de conceptos** — A diferencia del informe histórico (que mezclaba diagnóstico, compras, gastos, mano de obra y entrega), cada concepto vive en su propia hoja y sección: cotización ≠ cliente ≠ ítems ≠ registro.
2. **Configuración centralizada** — Ningún dato personal está en el código. Todo cambia desde las hojas `CONFIG`/`PLANTILLA`.
3. **Plantilla versionada, una fuente de apariencia** — La plantilla activa se elige con `documento.plantilla_version` en `CONFIG`: v1 (`plantilla_cotizacion.html`, clásica) o v2 (`plantilla_cotizacion_v2.html`: links clicables, QR de verificación, desglose justificado y garantías). Dos motores independientes la alimentan:
   - **Apps Script** (`src/Plantilla.gs`) en producción.
   - **Python** (`scripts/generar_preview.py`) para previsualización local.
    Ambos implementan las mismas convenciones (tokens `{{X}}`, markdown ligero, formato de dinero y fechas) y están verificados como equivalentes.
4. **Texto plano editable por humanos** — Los contenidos largos se guardan como texto con marcas simples, no como HTML:

   | Marca | Resultado |
   |---|---|
   | `# Título` | Subtítulo de sección |
   | `- ítem` | Lista con viñetas |
   | `> texto` | Nota destacada |
   | `**texto**` | Negrita |

5. **Valores por defecto con override** — Cada cotización puede dejar vacío un campo (p. ej. `exclusiones_md`) y hereda el texto estándar de `PLANTILLA`. Cadena de resolución: `valor de la cotización → PLANTILLA → literal embebido`.

## Modelo de datos (6 hojas)

```
CONFIG ──────── clave | valor | descripcion      Identidad del prestador + opciones globales
CLIENTES ────── id_cliente | nombre_institucion | responsable | cargo | correo |
                telefono | direccion | observaciones | fecha_alta
COTIZACIONES ── codigo | fecha | version | id_cliente | titulo_proyecto | clave_corta |
                estado | moneda | total | servicio_tecnico_meses |
                resumen_ejecutivo_md | alcance_md | entregables_md | git_md |
                soporte_incluido_md | soporte_no_incluido_md | garantias_md |
                condiciones_pago_md |
                vigencia_dias | exclusiones_md | observaciones | pdf_url | fecha_generacion_pdf
ITEMS ───────── codigo_cotizacion | orden | categoria | descripcion | detalle |
                justificacion | cantidad | unidad | precio_unitario
PLANTILLA ───── clave | valor | descripcion      Textos/títulos por defecto
LOG ─────────── fecha_hora | accion | codigo | detalle | usuario
```

Relaciones: `COTIZACIONES.id_cliente → CLIENTES.id_cliente` · `ITEMS.codigo_cotizacion → COTIZACIONES.codigo`.

## Flujo de generación

```
onOpen ─► menú
           │
           ├─ Nueva cotización…  ─► formulario_nueva_cotizacion.html
           │        └► crearCotizacionDesdeFormulario()
           │              ├► siguienteCodigo_()          (Numeracion.gs)
           │              ├► buscarOCrearCliente_()      (Clientes.gs)
           │              └► appendRow + LOG
           │
           └─ Generar PDF…       ─► generarPdf()         (Pdf.gs)
                    ├► getCotizacion_(codigo)           (Cotizaciones.gs)
                    ├► renderizarHtml_(cot)             (Plantilla.gs)
                    │     ├► getConfig_() / getPlantilla_()
                    │     ├► getCliente_()
                    │     └► aplicarTokens_(plantilla, tokens)
                    ├► Utilities.newBlob(html).getAs(pdf)
                    ├► resolverCarpetaSalida_() → Drive
                    └► registrarPdf_() + LOG
```

## Numeración

Patrón configurable `{PREFIJO}-{CLAVE}-{ANIO}-{SEQ}`. El generador escanea los códigos existentes que coincidan con `prefijo+clave+año` y aumenta la secuencia máxima (`pad` según `secuencia_digitos`). Soporta varias claves conviviendo (ECICEP, WEB01, SOPORTE…) sin colisiones.

## Verificación de autenticidad (v2)

Cada documento lleva un código de verificación y un QR que lo hacen comprobable:

```
hash = SHA-256( hash_sal | código | versión | fecha | total )  → 10 hex mayúsculas
QR   = qr_base_url + "?c={código}&h={hash}"   (o texto plano si no hay URL)
```

- La sal (`hash_sal` en `CONFIG`) es secreta: sin ella no se puede fabricar un documento cuyo hash coincida, y cualquier cambio de monto/fecha invalida el código impreso. En el generador local se guarda en `datos/privado/secreto.json` (gitignored); el documento demo se genera con una sal pública distinta.
- En Python el QR se genera localmente (librería `qrcode`); en Apps Script vía `api.qrserver.com` con try/catch (si falla, el PDF sale sin QR).
- Los campos editables del PDF (AcroForm) se agregan solo en el generador local, anclados a los textos "Por completar" / tabla de aceptación / "Firma del cliente".

## Decisiones relevantes

- **HTML→PDF vía `Utilities.newBlob().getAs()`**: conserva tablas, colores y saltos de página sin depender de Google Docs; el CSS de la plantilla evita características arriesgadas (CSS variables, flexbox crítico) usando tablas donde importa la alineación.
- **Fechas como texto `dd-MM-yyyy`** en la hoja para evitar reinterpretaciones de locale.
- **Datos sensibles fuera del repo**: `.gitignore` excluye `*.docx`, `.clasp.json`, credenciales y carpetas de salida con documentos reales.
- **Doble motor verificado**: un harness Node simula GAS y compara su salida contra el generador Python (mismo conteo de listas/subtítulos/notas y contenido clave).

## Extensión futura

- Nuevo tipo de servicio → nueva fila en `COTIZACIONES` + textos propios; nada que programar.
- Logo → campo `logo_url` ya reservado en `CONFIG`; añadir `<img>` en la banda del encabezado.
- Múltiples monedas → columna `moneda` ya existe por cotización; formateo regional pendiente si se requiere.
