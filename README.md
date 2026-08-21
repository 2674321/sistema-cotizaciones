# Sistema Personal de Generación de Cotizaciones

Sistema profesional y reutilizable para crear **cotizaciones de servicios tecnológicos** en formato PDF, listo para enviar a clientes.

**Flujo oficial (desde 2026-08):** datos en JSON → plantilla HTML → **PDF con WeasyPrint** (fidelidad total al diseño, hash de verificación + QR, sin servicios de pago ni terceros).

> El montaje sobre Google Sheets + Apps Script quedó **deprecado**: ver [`deprecated/apps-script/`](deprecated/apps-script/).

---

## Objetivo

Reemplazar los informes técnicos improvisados (tipo Word) por un flujo profesional:

```
datos/*.json → scripts/generar_preview.py → HTML + PDF (WeasyPrint)
```

Pensado para cotizar durante años: desarrollo de software, automatizaciones, sistemas sobre Google Sheets, páginas web, soporte técnico y servicios personalizados.

## Características

- **Plantilla visual v2** (`html/plantilla_cotizacion_v2.html`):
  - Correo, teléfono, GitHub y ORCID como **links clicables**.
  - **QR de verificación** + **código hash** (`SHA-256` truncado con sal secreta) ligado a código + versión + fecha + monto: comprueba autenticidad y detecta alteraciones.
  - **Desglose justificado de la inversión**: cada ítem explica su precio; ítems $0 marcados como INCLUIDO.
  - Sección de **garantías y compromisos** (confidencialidad, respaldo Git/GitHub, sin cargos ocultos…).
  - **Aceptación prellenada** con los datos del cliente cuando están completos (sin campos rellenables encima).
- **Numeración automática configurable**: `COT-ECICEP-2026-001` (patrón editable).
- **Identidad centralizada**: todo cambia en `datos/config.json`.
- **Textos por defecto reutilizables** (soporte, garantías, exclusiones, Git, pago) sobrescribibles por cotización.
- **Formato simple de textos**: `# subtítulo`, `- lista`, `> nota`, `**negrita**`.
- **Campos AcroForm editables** solo donde faltan datos (cliente incompleto o espacios de pago).
- **Separación estricta público/privado**: lo real nunca sale de tu equipo.

## Estructura del repositorio

```
├── html/
│   ├── plantilla_cotizacion_v2.html   # Plantilla v2 oficial ({{TOKENS}})
│   └── plantilla_cotizacion.html      # Plantilla v1 clásica (respaldo)
├── datos/                             # Datos versionables (seguros de publicar)
│   ├── config.json                    #   Identidad del prestador y opciones
│   ├── demo.json                      #   Cotización de PRUEBA (100% ficticia)
│   └── plantilla.json                 #   Textos por defecto de presentación
├── datos/privado/                     # ⚠ NO versionado: clientes y cotizaciones REALES + secreto.json (sal del hash)
├── scripts/
│   └── generar_preview.py             # Generador oficial: JSON → HTML + PDF (WeasyPrint) + campos editables
├── preview/                           # ÚNICA carpeta de salida; el .gitignore solo publica los archivos *DEMO*
├── docs/
│   └── ARQUITECTURA.md                # Modelo de datos y decisiones de diseño
└── deprecated/apps-script/            # ⚠ Flujo Google Sheets + Apps Script (deprecado)
```

## Uso

```bash
pip install weasyprint qrcode pymupdf    # dependencias locales

python3 scripts/generar_preview.py       # cotizaciones REALES (requiere datos/privado/)
python3 scripts/generar_preview.py --demo        # cotización de PRUEBA
python3 scripts/generar_preview.py COT-ECICEP-2026-001
```

Salida: `preview/<código>.html` y `preview/<código>.pdf`. El `.gitignore` publica **solo** los archivos `*DEMO*`; los documentos reales quedan como archivos locales.

### Configuración mínima inicial

1. `datos/config.json` — tu nombre, correo, GitHub, vigencia, patrón de códigos.
2. `datos/privado/secreto.json` — `{"hash_sal": "una-frase-larga-y-secreta"}` (firma los códigos de verificación; no la compartas; cambiarla invalida hashes anteriores).
3. `datos/privado/clientes.json` y `datos/privado/cotizaciones.json` — mismos esquemas que los ejemplos de `datos/demo.json`.

### Verificación de un documento

Cada PDF lleva `Verif. XXXXXXXXXX` y un QR. Para comprobar: recalcula `SHA-256(sal|código|versión|fecha|total)` y compara los primeros 10 hex. Coincide = legítimo y sin alteraciones.

## Mantenimiento

- La plantilla vive en `html/plantilla_cotizacion_v2.html`; se elige con `documento.plantilla_version` en `config.json`.
- Si agregas claves a `config.json`/`plantilla.json`, actualiza también los valores por defecto embebidos en `scripts/generar_preview.py`.
- Los documentos demo usan una sal pública distinta para no ejercitar tu sal real.
