/* ===================================
   GLOBAL FACTORING — Cartera de clientes (demo)
   Fuente: Anexo A de cada Contrato Marco en
   "Global Factoring - Documentos\CONTRATOS FACTORING / CONTRATOS CONFIRMING".

   Solo datos de la EMPRESA cliente (razón social, RUC, partida de persona
   jurídica). No se incluyen DNI, teléfonos, correos ni domicilios de personas.

   Para agregar un cliente: copia un bloque { ... } y cambia sus datos.
   Para agregar sus bienes (partidas SUNARP), llena la lista "bienes":
     { tipo: 'predio' | 'vehiculo' | 'maquinaria',
       partida: 'Partida 12345678' o 'Placa ABC-123',
       oficina: 'Lima',
       desc: 'Local comercial en ...',
       alertaRegistral: true   // true = ya está inscrita en Alerta Registral SUNARP
     }
==================================== */

const CARTERA = [
  // ---------------- FACTORING ----------------
  {
    id: 'f01',
    producto: 'factoring',
    nombre: 'GEOINNOVA LABORATORIO Y CONSTRUCCION E.I.R.L.',
    ruc: '20605008756',
    partidaPJ: '11318030',
    oficina: 'Huaraz',
    ubicacion: 'Independencia, Huaraz – Áncash',
    fechaContrato: '2026-09-15',
    avales: ['1 aval persona natural'],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: true, reporteTrib: false },
    bienes: [],
  },
  {
    id: 'f02',
    producto: 'factoring',
    nombre: 'TECNOLOGIA INDUSTRIAL Y METALMECANICA PRO S.A.C.',
    ruc: '20612120537',
    partidaPJ: '70766093',
    oficina: 'Callao',
    ubicacion: 'Callao – Lima',
    fechaContrato: '2026-09-16',
    avales: ['1 aval persona natural'],
    documentos: { contrato: true, firmado: true, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: false, reporteTrib: false },
    bienes: [],
  },
  {
    id: 'f03',
    producto: 'factoring',
    nombre: 'GESTION TYRE E.I.R.L.',
    ruc: '20601882273',
    partidaPJ: '13814784',
    oficina: 'Lima',
    ubicacion: 'Los Olivos – Lima',
    fechaContrato: '2026-09-22',
    avales: ['2 avales persona natural'],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: true, reporteTrib: true },
    bienes: [],
  },
  {
    id: 'f04',
    producto: 'factoring',
    nombre: 'INVERSIONES Y SERVICIOS GENERALES JCP E.I.R.L.',
    ruc: '20614317044',
    partidaPJ: '11190849',
    oficina: 'Chimbote',
    ubicacion: 'Chimbote, Santa – Áncash',
    fechaContrato: '2026-09-30',
    avales: ['1 aval persona natural'],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: false, copiaLiteral: true, reporteTrib: true },
    bienes: [],
  },
  {
    id: 'f05',
    producto: 'factoring',
    nombre: 'CANUT DE BON S.A.C.',
    ruc: '20600854446',
    partidaPJ: '13520780',
    oficina: 'Lima',
    ubicacion: 'San Isidro – Lima',
    fechaContrato: '2026-10-01',
    avales: ['1 aval persona natural (separación de patrimonios)'],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: true, reporteTrib: false },
    bienes: [],
  },

  // ---------------- CONFIRMING ----------------
  {
    id: 'c01',
    producto: 'confirming',
    nombre: 'SOLUCIONES INTEGRALES DE ALTA TECNOLOGIA S.A.C.',
    ruc: '20508195584',
    partidaPJ: '11622148',
    oficina: 'Lima',
    ubicacion: 'San Isidro – Lima',
    fechaContrato: '2026-09-24',
    avales: ['1 aval persona natural'],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: true, reporteTrib: true },
    bienes: [],
  },
  {
    id: 'c02',
    producto: 'confirming',
    nombre: 'P.A.Y. METAL TRADING S.A.C.',
    ruc: '20600025784',
    partidaPJ: '13354985',
    oficina: 'Lima',
    ubicacion: 'Miraflores – Lima',
    fechaContrato: '2026-10-12',
    avales: ['Aval: NUKLEO PERU S.A.C.'],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: false, reporteTrib: false },
    bienes: [],
  },
  {
    id: 'c03',
    producto: 'confirming',
    nombre: 'NUKLEO PERU S.A.C.',
    ruc: '20565937481',
    partidaPJ: '13322550',
    oficina: 'Lima',
    ubicacion: 'San Isidro – Lima',
    fechaContrato: '2026-10-12',
    avales: ['Aval: P.A.Y. METAL TRADING S.A.C.'],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: false, copiaLiteral: false, reporteTrib: false },
    bienes: [],
  },
  {
    id: 'c04',
    producto: 'confirming',
    nombre: 'CONSORCIO CUSCO',
    ruc: '20612606481',
    partidaPJ: '',
    oficina: '',
    ubicacion: 'San Isidro – Lima',
    fechaContrato: '2026-10-23',
    avales: [
      'Aval: TECNOEDIL S.A. CONSTRUCTORA – SUCURSAL PERÚ',
      'Aval: ROVELLA CARRANZA S.A. SUCURSAL PERÚ',
    ],
    nota: 'Consorcio sin partida propia: vigilar los bienes de las empresas consorciadas.',
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: true, reporteTrib: false },
    bienes: [],
  },
];
