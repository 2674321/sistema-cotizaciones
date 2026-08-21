/**
 * Semillas.gs
 * Datos iniciales del sistema: configuración, textos de plantilla y la
 * primera cotización real (Sistema ECICEP Unificado).
 * Espejo de los archivos datos/*.json del repositorio.
 */
'use strict';

/** Valores semilla para la hoja CONFIG. */
function semillasConfig_() {
  return {
    prestador_nombre:        { valor: 'Patricio Varela C.', descripcion: 'Nombre del prestador (aparece en el encabezado y firmas).' },
    prestador_titulo:        { valor: 'Técnico en Programación Nivel Medio', descripcion: 'Perfil profesional.' },
    prestador_email:         { valor: 'patriciovarelacontreras@gmail.com', descripcion: 'Correo de contacto.' },
    prestador_telefono:      { valor: '', descripcion: 'Teléfono de contacto (opcional).' },
    prestador_sitio_web:     { valor: '', descripcion: 'Sitio web (opcional).' },
    prestador_git:           { valor: '', descripcion: 'URL de Git personal (opcional).' },
    prestador_github_url:    { valor: 'https://github.com/2674321', descripcion: 'URL del perfil GitHub (aparece como link clicable).' },
    prestador_orcid_id:      { valor: '', descripcion: 'ID ORCID sin URL, ej: 0000-0002-1825-0097. Vacío = no se muestra.' },
    logo_url:                { valor: '', descripcion: 'URL de logo (opcional, reservado para uso futuro).' },
    tipo_documento:          { valor: 'COTIZACIÓN DE SERVICIOS PROFESIONALES', descripcion: 'Título del tipo de documento.' },
    prefijo_codigo:          { valor: 'COT', descripcion: 'Prefijo de numeración de cotizaciones.' },
    patron_codigo:           { valor: '{PREFIJO}-{CLAVE}-{ANIO}-{SEQ}', descripcion: 'Patrón del código. Placeholders: PREFIJO, CLAVE, ANIO, SEQ.' },
    secuencia_digitos:       { valor: 3, descripcion: 'Cantidad de dígitos de la secuencia (001).' },
    moneda:                  { valor: 'CLP', descripcion: 'Moneda por defecto.' },
    vigencia_dias_default:   { valor: 15, descripcion: 'Vigencia por defecto de las cotizaciones (días).' },
    pie_documento:           { valor: 'Documento generado electrónicamente por Patricio Varela C. — {CODIGO} · v{VERSION}', descripcion: '(v1) Pie simple. En plantilla v2 el pie se construye con links + código de verificación.' },
    repo_modo:               { valor: 'privado', descripcion: 'Modo del repositorio Git: privado | compartido | publico.' },
    carpeta_salida_id:       { valor: '', descripcion: 'ID de carpeta de Drive donde se guardan los PDF. Vacío = subcarpeta "Cotizaciones" en la raíz.' },
    plantilla_version:       { valor: 2, descripcion: 'Versión de la plantilla HTML: 1 (clásica) o 2 (links + QR + desglose justificado).' },
    qr_activo:               { valor: true, descripcion: 'Generar QR de verificación en la sección Vigencia (true/false).' },
    qr_base_url:             { valor: '', descripcion: 'URL pública de verificación para el QR, ej: https://misitio.cl/verificar. Vacío = QR con texto.' },
    hash_sal:                { valor: 'CAMBIA-ESTA-SAL', descripcion: 'Sal secreta para el código de verificación. CÁMBIALA por una frase larga y única; no la compartas. Cambiarla invalida hashes anteriores.' }
  };
}

/** Textos por defecto de presentación para la hoja PLANTILLA. */
function semillasPlantilla_() {
  return {
    seccion_resumen_titulo:      { valor: 'Resumen ejecutivo', descripcion: 'Título sección 2.' },
    seccion_alcance_titulo:      { valor: 'Alcance del proyecto', descripcion: 'Título sección 3.' },
    seccion_entregables_titulo:  { valor: 'Entregables incluidos', descripcion: 'Título sección 4.' },
    seccion_git_titulo:          { valor: 'Control de versiones y respaldo', descripcion: 'Título sección 5.' },
    seccion_soporte_titulo:      { valor: 'Servicio técnico incluido — {MESES} meses', descripcion: 'Título sección 6. Admite {MESES}.' },
    seccion_inversion_titulo:    { valor: 'Inversión', descripcion: 'Título sección 7.' },
    seccion_desglose_titulo:     { valor: 'Desglose y justificación de la inversión', descripcion: '(v2) Título sección 8.' },
    seccion_garantias_titulo:    { valor: 'Garantías y compromisos', descripcion: '(v2) Título sección 9.' },
    seccion_pago_titulo:         { valor: 'Forma de pago', descripcion: 'Título sección 10.' },
    seccion_vigencia_titulo:     { valor: 'Vigencia y verificación del documento', descripcion: 'Título sección 11 (v2: incluye QR + código de verificación).' },
    seccion_exclusiones_titulo:  { valor: 'Exclusiones y consideraciones', descripcion: 'Título sección 12.' },
    seccion_aceptacion_titulo:   { valor: 'Aceptación de la cotización', descripcion: 'Título sección 13.' },

    git_default_md: {
      valor: 'El código fuente del proyecto será mantenido en un repositorio Git personal del desarrollador, lo que asegura:\n- Versionado del código fuente con historial de cambios.\n- Respaldo permanente del proyecto mediante control de versiones.\n- Gestión ordenada de futuras modificaciones.\n> Modo de repositorio: {REPO_MODO}. La eventual entrega de acceso al cliente deberá acordarse expresamente entre las partes.',
      descripcion: 'Texto Git por defecto. Admite {REPO_MODO}.'
    },
    soporte_intro_md: {
      valor: 'Durante {MESES} meses contados desde la entrega del sistema, se incluye el servicio técnico relacionado directamente con el sistema entregado:',
      descripcion: 'Introducción del servicio técnico. Admite {MESES}.'
    },
    soporte_incluido_md: {
      valor: '- Corrección de errores del sistema.\n- Asistencia ante fallos de funcionamiento.\n- Ajustes menores dentro del alcance original.\n- Orientación de uso del sistema.\n- Revisión de problemas derivados del funcionamiento normal.',
      descripcion: 'Lista "Incluido" del servicio técnico.'
    },
    soporte_no_incluido_md: {
      valor: '- Nuevas funcionalidades mayores o nuevos módulos.\n- Ampliaciones sustanciales del alcance.\n- Sistemas o proyectos diferentes.\n- Cambios radicales de arquitectura.\n- Integraciones externas no contempladas.',
      descripcion: 'Lista "No incluido automáticamente".'
    },
    soporte_nota_md: {
      valor: 'Las ampliaciones señaladas como no incluidas podrán evaluarse y cotizarse por separado.',
      descripcion: 'Nota al pie de la sección servicio técnico.'
    },
    condiciones_pago_default_md: {
      valor: 'Condiciones de pago por definir entre las partes:\n- Pago inicial (% o monto): ______________________________\n- Saldo / pago final: ______________________________\n- Medio de pago:  [  ] Transferencia bancaria    [  ] Otro: ______________________\n- Fecha de pago:  ________ / ________ / ____________',
      descripcion: 'Condiciones de pago por defecto (campos por completar).'
    },
    vigencia_texto: {
      valor: 'Esta cotización es válida por {VIGENCIA_DIAS} días corridos desde su fecha de emisión (hasta el {FECHA_VENCIMIENTO}).',
      descripcion: 'Texto de vigencia. Admite {VIGENCIA_DIAS} y {FECHA_VENCIMIENTO}.'
    },
    exclusiones_default_md: {
      valor: '- Esta cotización considera exclusivamente el alcance descrito en el presente documento.\n- Los cambios que impliquen nuevas funcionalidades, módulos adicionales, integraciones no contempladas o modificaciones sustanciales podrán requerir una nueva cotización.\n- La disponibilidad de servicios externos, cuentas, permisos o infraestructura de terceros no depende exclusivamente del desarrollador.',
      descripcion: 'Exclusiones por defecto.'
    },
    aceptacion_clausula: {
      valor: 'La aceptación de esta cotización implica conformidad con el alcance, los entregables y el valor indicados en este documento.',
      descripcion: 'Cláusula de aceptación.'
    },
    nota_total: {
      valor: 'El servicio técnico de seis meses está incluido en el valor del desarrollo: no tiene costo adicional.',
      descripcion: 'Nota bajo el bloque de inversión.'
    },
    garantias_default_md: {
      valor: '- Confidencialidad: la información entregada por el cliente se trata de manera reservada y se utiliza exclusivamente para los fines del proyecto.\n- Respaldo del trabajo: todo el desarrollo cuenta con control de versiones Git y guardado de seguridad, ajeno al sistema entregado.\n- Respaldo permanente en Git: el código fuente se mantiene versionado en un repositorio privado (GitHub) con historial completo de cambios; el cliente podrá solicitar una copia del repositorio al término del proyecto.\n- Corrección de errores: los errores derivados del desarrollo propio se corrigen sin costo dentro del período de servicio técnico.\n- Continuidad: el código fuente permanece versionado, lo que permite retomar o ampliar el sistema en el futuro.\n- Entrega verificada: el sistema se entrega probado y funcionando según el alcance descrito.\n- Transparencia: cualquier limitación detectada durante el desarrollo se comunica oportunamente.\n- Sin cargos ocultos: ningún trabajo fuera del alcance descrito se inicia ni se cobra sin una cotización previa aceptada por el cliente.',
      descripcion: '(v2) Garantías por defecto de la sección 9.'
    },
    verificacion_texto: {
      valor: 'Cada documento emitido lleva un código de verificación único ({HASH}) calculado a partir de su código, versión, fecha y monto. Puede comprobar la autenticidad escaneando el código QR o comparando el código impreso con el registrado en el historial del documento.',
      descripcion: '(v2) Texto de verificación. Admite {HASH}.'
    }
  };
}

/**
 * Carga la primera cotización real del sistema:
 * Cliente CL-001 + COT-ECICEP-2026-001 (Sistema ECICEP Unificado).
 * No duplica si el código ya existe.
 */
function cargarCotizacionECICEP() {
  crearEstructuraSinAlert_();
  var hoy = new Date();
  var hss = SpreadsheetApp.getActiveSpreadsheet();

  // ── Cliente (datos de la cliente: Camila Paz Aguilar) ──
  var clientes = hss.getSheetByName(APP.HOJAS.CLIENTES);
  var hayCliente = clientes.createTextFinder('CL-001').findNext();
  if (!hayCliente) {
    clientes.appendRow(['CL-001',
      'Camila Paz Aguilar',
      'Camila Paz Aguilar',
      'Enfermera',
      'camilapazaguilar.h90@gmail.com',
      '+56 9 4251 2556',
      '',
      'Proyecto particular para cliente; no constituye un proyecto institucional del CESFAM.',
      fechaCorta_(hoy)]);
  }

  // ── Cotización ──
  var codigo = 'COT-ECICEP-2026-001';
  var cotizaciones = hss.getSheetByName(APP.HOJAS.COTIZACIONES);
  if (cotizaciones.createTextFinder(codigo).findNext()) {
    SpreadsheetApp.getUi().alert('La cotización ' + codigo + ' ya existe; no se duplicó nada.');
    return;
  }

  var fila = [
    codigo,
    fechaCorta_(hoy),            // fecha dd-MM-yyyy (texto)
    '2',                          // versión (plantilla v2)
    'CL-001',
    'Sistema ECICEP Unificado',
    'ECICEP',
    'borrador',
    'CLP',
    120000,
    6,
    SEMILLA_ECICEP_.resumen,
    SEMILLA_ECICEP_.alcance,
    SEMILLA_ECICEP_.entregables,
    '',                           // git_md → usa texto por defecto
    '',                           // soporte_incluido_md → defecto
    '',                           // soporte_no_incluido_md → defecto
    '',                           // garantias_md → defecto (v2)
    SEMILLA_ECICEP_.condicionesPago,
    15,                           // vigencia días
    '',                           // exclusiones_md → defecto
    'Proyecto particular para cliente; no constituye un proyecto institucional del CESFAM.',
    '',                           // pdf_url
    ''                            // fecha_generacion_pdf
  ];
  cotizaciones.appendRow(fila);

  // ── Ítems asociados (desglose justificado, v2) ──
  var hojaItems = hss.getSheetByName(APP.HOJAS.ITEMS);
  SEMILLA_ECICEP_.items.forEach(function (it) {
    hojaItems.appendRow([codigo, it.orden, it.categoria, it.descripcion,
      it.detalle, it.justificacion, it.cantidad, it.unidad, it.precio]);
  });

  log_('CARGA_INICIAL', codigo, 'Cotización ECICEP cargada como primer caso real');
  SpreadsheetApp.getUi().alert('✅ Cotización ' + codigo + ' cargada con los datos de la cliente (Camila Paz Aguilar).');
}

/**
 * Carga una cotización DEMO 100% ficticia (COT-DEMO-2026-001) para
 * capturas de pantalla y pruebas. Cliente "Empresa de Ejemplo SpA".
 * No duplica si el código ya existe.
 */
function cargarCotizacionDemo() {
  crearEstructuraSinAlert_();
  var hss = SpreadsheetApp.getActiveSpreadsheet();

  var clientes = hss.getSheetByName(APP.HOJAS.CLIENTES);
  if (!clientes.createTextFinder(DEMO_.idCliente).findNext()) {
    clientes.appendRow([DEMO_.idCliente,
      'Empresa de Ejemplo SpA',
      'Juan Pérez Soto',
      'Gerente General',
      'contacto@ejemplo.cl',
      '+56 9 1234 5678',
      '',
      'DATOS FICTICIOS — cotización de demostración para capturas y pruebas.',
      fechaCorta_(new Date())]);
  }

  var codigo = DEMO_.codigo;
  var cotizaciones = hss.getSheetByName(APP.HOJAS.COTIZACIONES);
  if (cotizaciones.createTextFinder(codigo).findNext()) {
    SpreadsheetApp.getUi().alert('La cotización ' + codigo + ' ya existe; no se duplicó nada.');
    return;
  }

  var fila = [
    codigo, fechaCorta_(new Date()), '2', DEMO_.idCliente,
    'Tienda online con panel de administración', 'DEMO', 'borrador', 'CLP', 450000, 3,
    DEMO_.resumen, DEMO_.alcance, DEMO_.entregables,
    '', '', '', '',                 // git / soporte / garantías → defecto
    DEMO_.condicionesPago, 15, '',
    'Cotización de demostración con datos ficticios; no corresponde a un cliente real.',
    '', ''
  ];
  cotizaciones.appendRow(fila);

  var hojaItems = hss.getSheetByName(APP.HOJAS.ITEMS);
  DEMO_.items.forEach(function (it) {
    hojaItems.appendRow([codigo, it.orden, it.categoria, it.descripcion,
      it.detalle, it.justificacion, it.cantidad, it.unidad, it.precio]);
  });

  log_('CARGA_DEMO', codigo, 'Cotización demo ficticia cargada');
  SpreadsheetApp.getUi().alert('✅ Cotización demo ' + codigo + ' cargada (datos 100% ficticios).');
}

/** Datos de la cotización demo (ficticios). */
var DEMO_ = {
  codigo: 'COT-DEMO-2026-001',
  idCliente: 'CL-DEMO',
  condicionesPago: 'Condiciones de pago acordadas:\n- Pago inicial: 50% al aceptar la propuesta.\n- Saldo: 50% contra entrega del sistema en funcionamiento.\n- Medio de pago: transferencia bancaria.\n- Fecha de pago: según hitos indicados.',
  resumen: 'Se propone el desarrollo de una tienda online con panel de administración propio: catálogo de productos, carrito de compras y módulo de gestión de pedidos e inventario. El sistema se construye sobre tecnologías web estándar, con una base de datos centralizada que mantiene sincronizados la vitrina pública y el panel administrativo.\nEl objetivo es que el negocio pueda publicar su catálogo, recibir pedidos y administrar su inventario desde una sola plataforma, sin depender de planillas dispersas ni procesos manuales.',
  alcance: '# Vitrina online\nCatálogo de productos con imágenes, descripciones, precios y stock visible para el cliente final.\n# Carrito y checkout\nCarrito de compras con registro del pedido y notificación al comercio.\n# Panel de administración\nGestión de productos, precios, stock y estados de pedido desde una interfaz privada.\n# Base de datos centralizada\nModelo único de datos que sincroniza vitrina y administración en tiempo real.\n# Reportes básicos\nVentas por período, productos más vendidos y estado de pedidos.',
  entregables: '- Tienda online funcional en dominio del cliente.\n- Panel de administración con control de acceso.\n- Base de datos estructurada y documentada.\n- Manual breve de uso del panel.\n- Pruebas funcionales y puesta en marcha.',
  items: [
    { orden: 1, categoria: 'Desarrollo web', descripcion: 'Desarrollo de la tienda online y panel de administración',
      detalle: 'Vitrina, carrito, checkout y panel privado sobre base de datos centralizada.',
      justificacion: 'Concentra todo el trabajo técnico de construcción: análisis, diseño de la base de datos, programación de la vitrina y del panel, y pruebas integrales. Es el núcleo del proyecto.',
      cantidad: 1, unidad: 'servicio', precio: 280000 },
    { orden: 2, categoria: 'Infraestructura', descripcion: 'Instalación y puesta en producción',
      detalle: 'Configuración del hosting, dominio, certificado de seguridad y ambiente productivo.',
      justificacion: 'Garantiza que el sistema quede operativo, seguro y accesible al público, con configuración profesional del entorno de publicación.',
      cantidad: 1, unidad: 'servicio', precio: 120000 },
    { orden: 3, categoria: 'Capacitación', descripcion: 'Capacitación en el uso del panel',
      detalle: 'Sesión práctica de traspaso: productos, pedidos y reportes.',
      justificacion: 'Asegura la autonomía del equipo del cliente para operar el sistema desde el primer día, reduciendo consultas posteriores.',
      cantidad: 2, unidad: 'sesiones', precio: 25000 },
    { orden: 4, categoria: 'Soporte', descripcion: 'Servicio técnico y soporte — 3 meses',
      detalle: 'Corrección de errores, asistencia ante fallos y ajustes menores dentro del alcance original.',
      justificacion: 'Se incluye dentro de la propuesta como beneficio: asegura el correcto funcionamiento durante los primeros meses de operación real del sistema.',
      cantidad: 1, unidad: 'incluido', precio: 0 }
  ]
};

/** crearEstructura() sin diálogos (uso interno). */
function crearEstructuraSinAlert_() {
  crearEstructura();
}

var SEMILLA_ECICEP_ = {
  condicionesPago: 'Condiciones de pago acordadas:\n- Pago inicial: $0 (sin pago inicial).\n- Pago final: 100% del valor total — CLP $120.000.\n- Medio de pago: transferencia bancaria (Cuenta RUT).\n- Fecha de pago: al momento de la entrega del sistema.',

  resumen: 'Actualmente, la información de los tres sectores del CESFAM se registra en archivos independientes, con formatos y estructuras distintos entre sí. Esto obliga a revisar varias planillas por separado, duplica el trabajo de registro y dificulta responder con rapidez preguntas básicas: qué pacientes existen, en qué estado se encuentra cada uno, cuándo corresponde el próximo control y quién requiere seguimiento.\nSe propone el desarrollo del Sistema ECICEP Unificado: un sistema de gestión a medida, construido sobre Google Sheets e impulsado por Google Apps Script, que centraliza toda la información en una base única y ordenada. Los archivos de origen de cada sector se procesan de forma automatizada: los datos se normalizan, las fichas duplicadas se identifican y consolidan, y el resultado es una base centralizada confiable sobre la cual el personal puede buscar, registrar controles, programar próximas fechas y realizar seguimiento desde una interfaz sencilla, pensada para el uso diario.\nEl beneficio operativo es directo: una sola fuente de información actualizada, menos horas dedicadas a la consolidación manual, menores errores de registro y decisiones apoyadas en un dashboard con indicadores al día.',

  alcance: '# Integración de información\nConsolidación de la información proveniente de los tres sectores del CESFAM, integrando archivos con estructuras y formatos distintos en un único sistema.\n# Normalización de datos\nHomogeneización de los datos entre archivos: nombres, RUT, teléfonos, fechas, estados y campos equivalentes, aplicando reglas uniformes de escritura y formato.\n# Consolidación centralizada\nCreación de la base centralizada ECICEP, con identificación y resolución de registros duplicados (deduplicación) para obtener una ficha única por paciente.\n# Gestión y seguimiento\nHerramientas de búsqueda ágil, registro de controles, próximas fechas, estados y observaciones, orientadas al seguimiento ECICEP y a la gestión diaria de pacientes.\n# Automatización del procesamiento\nProcesamiento y actualización automatizados mediante Google Apps Script y Google Sheets, con optimización de los tiempos de procesamiento de archivos de origen.\n# Interfaz de gestión\nSistema diseñado para el uso cotidiano por parte del personal, con operaciones claras y sencillas que no requieren conocimientos técnicos.\n# Dashboard\nPanel de indicadores con el estado general del sistema y del seguimiento ECICEP.\n# Trazabilidad\nRegistro del origen de la información y de sus actualizaciones, permitiendo conocer de dónde proviene cada dato y cuándo fue incorporado.',

  entregables: '- Sistema ECICEP Unificado funcional, según el alcance descrito.\n- Estructura de Google Sheets del sistema.\n- Scripts de automatización (Google Apps Script).\n- Proceso de normalización y deduplicación de datos.\n- Sistema de consolidación de información.\n- Interfaz de gestión para el personal.\n- Dashboard de indicadores.\n- Documentación básica de uso y mantenimiento.\n- Configuración inicial del entorno.\n- Pruebas funcionales del sistema.\n- Puesta en funcionamiento.',

  items: [
    { orden: 1, categoria: 'Desarrollo de software', descripcion: 'Desarrollo del Sistema ECICEP Unificado',
      detalle: 'Desarrollo completo según alcance: integración, normalización, consolidación, gestión y seguimiento, automatización, interfaz de gestión, dashboard y trazabilidad.',
      justificacion: 'Corresponde al trabajo técnico especializado de construcción del sistema: análisis de los archivos de origen, diseño de la base centralizada, programación de las automatizaciones y de la interfaz, y pruebas integrales. Es el componente principal de la propuesta.',
      cantidad: 1, unidad: 'servicio', precio: 95000 },
    { orden: 2, categoria: 'Seguridad de la información', descripcion: 'Guardado de seguridad de los datos',
      detalle: 'Respaldo organizado de la información original y de las versiones de trabajo durante todo el proyecto.',
      justificacion: 'Garantiza que la información original y las versiones de trabajo permanezcan protegidas en un repositorio ajeno al sistema, evitando cualquier pérdida de datos durante el desarrollo.',
      cantidad: 1, unidad: 'servicio', precio: 25000 },
    { orden: 3, categoria: 'Soporte', descripcion: 'Servicio técnico y soporte — 6 meses',
      detalle: 'Corrección de errores, asistencia ante fallos, ajustes menores dentro del alcance original y orientación de uso.',
      justificacion: 'Se incluye dentro de la propuesta como beneficio: asegura el correcto funcionamiento del sistema durante sus primeros meses de uso real.',
      cantidad: 1, unidad: 'incluido', precio: 0 }
  ]
};
