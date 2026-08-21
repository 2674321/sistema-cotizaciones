# Guía de instalación — Google Apps Script

## Opción A · Montaje manual (recomendada para empezar)

### 1. Crear la hoja contenedora
1. En [sheets.new](https://sheets.new) crea una hoja de cálculo, p. ej. **«Sistema de Cotizaciones»**.
2. Menú **Extensiones → Apps Script**.

### 2. Crear los archivos

En el editor de Apps Script, crea **un archivo por cada elemento** (respetando el tipo y el nombre exacto):

| Tipo | Nombre en Apps Script | Archivo del repo |
|---|---|---|
| Secuencia de comandos | `Config` | `src/Config.gs` |
| Secuencia de comandos | `Utils` | `src/Utils.gs` |
| Secuencia de comandos | `Hojas` | `src/Hojas.gs` |
| Secuencia de comandos | `Semillas` | `src/Semillas.gs` |
| Secuencia de comandos | `Numeracion` | `src/Numeracion.gs` |
| Secuencia de comandos | `Clientes` | `src/Clientes.gs` |
| Secuencia de comandos | `Cotizaciones` | `src/Cotizaciones.gs` |
| Secuencia de comandos | `Plantilla` | `src/Plantilla.gs` |
| Secuencia de comandos | `Pdf` | `src/Pdf.gs` |
| Secuencia de comandos | `Menu` | `src/Menu.gs` |
| HTML | `plantilla_cotizacion` | `html/plantilla_cotizacion.html` |
| HTML | `formulario_nueva_cotizacion` | `html/formulario_nueva_cotizacion.html` |

> Los nombres de los archivos HTML deben coincidir exactamente: el código los busca con `HtmlService.createHtmlOutputFromFile('plantilla_cotizacion')`.

### 3. Manifiesto (opcional pero recomendado)
En **Project Settings ⚙ → General settings**, marca *Show "appsscript.json" manifest file in editor* y reemplaza su contenido por el de `appsscript.json` del repositorio.

### 4. Autorizar y arrancar
1. Guarda todo (`Ctrl+S`) y recarga la hoja de cálculo.
2. Aparecerá el menú **🧾 Cotizaciones** (si no aparece, ejecuta `onOpen` desde el editor una vez y autoriza los permisos).
3. Ejecuta en orden:
   - **Crear / reparar estructura** → crea las 6 hojas.
   - **Cargar cotización ECICEP (inicial)** → carga cliente + cotización `COT-ECICEP-2026-001`.
4. Selecciona la fila de la cotización en la hoja `COTIZACIONES` y usa **Generar PDF…**
5. El PDF queda en Drive, carpeta **Cotizaciones**, y su URL se registra en la columna `pdf_url`.

## Opción B · clasp (línea de comandos)

Si usas [clasp](https://github.com/google/clasp):

```bash
clasp login
clasp create --type sheets --title "Sistema de Cotizaciones"   # desde una copia aparte del repo
```

Luego ajusta `.clasp.json` (cópialo desde `.clasp.json.example`) para que apunte a tu script:

```json
{
  "scriptId": "<TU_SCRIPT_ID>",
  "rootDir": ".",
  "filePushOrder": []
}
```

Con `rootDir: "."`, clasp espera los archivos `.gs` y `.html` junto al manifiesto; puedes copiarlos:

```bash
cp src/*.gs html/*.html appsscript.json /ruta/del/proyecto-clasp/
clasp push
```

> `.clasp.json` real está excluido del repositorio (contiene identificadores privados).

## Configuración inicial recomendada

Hoja `CONFIG`:

| clave | valor sugerido |
|---|---|
| `prestador_telefono` | tu teléfono (aparece en el encabezado) |
| `carpeta_salida_id` | ID de carpeta de Drive destino de los PDF (opcional) |
| `repo_modo` | `privado` · `compartido` · `publico` |
| `vigencia_dias_default` | 15 |

## Solución de problemas

| Síntoma | Causa probable |
|---|---|
| El menú no aparece | `onOpen` no autorizado; ejecútalo desde el editor |
| «No existe la cotización …» | El código de la fila no coincide o hay espacios extra |
| PDF sin estilos completos | Verifica que la plantilla HTML se llame `plantilla_cotizacion` |
| Fechas raras en la hoja | La columna `fecha` debe tener formato texto (`@`); lo fija *Crear estructura* |
