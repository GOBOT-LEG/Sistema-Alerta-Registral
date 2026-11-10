/* ===================================
   GLOBAL FACTORING — Cartera de clientes
   Fuente: Anexo A de cada Contrato Marco en
   "Global Factoring - Documentos\CONTRATOS FACTORING / CONTRATOS CONFIRMING".

   Datos de la empresa cliente (razón social, RUC, partida de persona jurídica)
   y de sus AVALES (nombre o razón social). No se incluyen DNI, teléfonos,
   correos, domicilios ni estado civil de personas.

   Cada aval tiene un id (ej. 'f41-a1' = primer aval del cliente f41).
   Una partida es del cliente (titular: 'cliente') o de un aval (titular: 'f41-a1').

   Para agregar una partida vigilada en Alerta Registral SUNARP, añade un
   bloque dentro de "partidas" del cliente:
     {
       titular: 'cliente' o el id del aval (ej. 'f41-a1'),
       registro: 'inmueble' | 'mueble' | 'vehicular',
       partida: '55257391',
       ficha: 'P15294031',            // código/ficha o placa (opcional)
       oficina: 'Piura',
       zona: 'Zona Registral I - Sede Piura',
       fechaRegistro: '2026-11-09',  // fecha de afiliación en Alerta Registral
       estado: 'Activa',
       alertaRegistral: true,
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
    ubicacion: 'Huaraz, Áncash',
    fechaContrato: '2026-09-15',
    avales: [{ id: 'f01-a1', tipo: 'natural', nombre: 'JIMY ALEX VARGAS RIMAC' }],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: true, reporteTrib: false },
    partidas: [],
  },
  {
    id: 'f02',
    producto: 'factoring',
    nombre: 'TECNOLOGIA INDUSTRIAL Y METALMECANICA PRO S.A.C.',
    ruc: '20612120537',
    partidaPJ: '70766093',
    oficina: 'Callao',
    ubicacion: 'Callao',
    fechaContrato: '2026-09-16',
    avales: [{ id: 'f02-a1', tipo: 'natural', nombre: 'JULIO CESAR CHAVEZ DAVILA' }],
    documentos: { contrato: true, firmado: true, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: false, reporteTrib: false },
    partidas: [],
  },
  {
    id: 'f03',
    producto: 'factoring',
    nombre: 'GESTION TYRE E.I.R.L.',
    ruc: '20601882273',
    partidaPJ: '13814784',
    oficina: 'Lima',
    ubicacion: 'Los Olivos, Lima',
    fechaContrato: '2026-09-22',
    avales: [
      { id: 'f03-a1', tipo: 'natural', nombre: 'ERIKA MARUJA DIAZ CARDENAS' },
      { id: 'f03-a2', tipo: 'natural', nombre: 'RUBEN NICOLAS ALIAGA' },
    ],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: true, reporteTrib: true },
    partidas: [],
  },
  {
    id: 'f04',
    producto: 'factoring',
    nombre: 'INVERSIONES Y SERVICIOS GENERALES JCP E.I.R.L.',
    ruc: '20614317044',
    partidaPJ: '11190849',
    oficina: 'Chimbote',
    ubicacion: 'Chimbote, Áncash',
    fechaContrato: '2026-09-30',
    avales: [{ id: 'f04-a1', tipo: 'natural', nombre: 'JANETH MARIBEL CRUZ PEÑA' }],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: false, copiaLiteral: true, reporteTrib: true },
    partidas: [],
  },
  {
    id: 'f05',
    producto: 'factoring',
    nombre: 'CANUT DE BON S.A.C.',
    ruc: '20600854446',
    partidaPJ: '13520780',
    oficina: 'Lima',
    ubicacion: 'San Isidro, Lima',
    fechaContrato: '2026-10-01',
    avales: [{ id: 'f05-a1', tipo: 'natural', nombre: 'SIMJAH DARÍO ROSENBERG CANUT DE BON', nota: 'Separación de patrimonios inscrita (Partida 14986897, Registro Personal de Lima)' }],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: true, reporteTrib: false },
    partidas: [],
  },
  {
    id: 'f41',
    producto: 'factoring',
    nombre: 'MULTISERVICIOS Y REPRESENTACIONES GENERALES SHAIEL E.I.R.L.',
    ruc: '20614108186',
    partidaPJ: '11311360',
    oficina: 'Piura',
    ubicacion: 'Castilla, Piura',
    fechaContrato: '2026-11-09',
    avales: [{ id: 'f41-a1', tipo: 'natural', nombre: 'ANA MARIA CARDOZA BRICEÑO' }],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: false, reporteTrib: false },
    partidas: [
      {
        titular: 'f41-a1',
        registro: 'inmueble',
        partida: '55257391',
        ficha: 'P15294031',
        oficina: 'Piura',
        zona: 'Zona Registral I - Sede Piura',
        fechaRegistro: '2026-11-09',
        estado: 'Activa',
        alertaRegistral: true,
      },
      {
        titular: 'f41-a1',
        registro: 'mueble',
        partida: '60579099',
        ficha: 'NB48876',
        oficina: 'Piura',
        zona: 'Zona Registral I - Sede Piura',
        fechaRegistro: '2026-11-09',
        estado: 'Activa',
        alertaRegistral: true,
      },
    ],
  },

  // ---------------- CONFIRMING ----------------
  {
    id: 'c01',
    producto: 'confirming',
    nombre: 'SOLUCIONES INTEGRALES DE ALTA TECNOLOGIA S.A.C.',
    ruc: '20508195584',
    partidaPJ: '11622148',
    oficina: 'Lima',
    ubicacion: 'San Isidro, Lima',
    fechaContrato: '2026-09-24',
    avales: [{ id: 'c01-a1', tipo: 'natural', nombre: 'DANIELA ARIANA TORRES CASTAÑEDA' }],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: true, reporteTrib: true },
    partidas: [],
  },
  {
    id: 'c02',
    producto: 'confirming',
    nombre: 'P.A.Y. METAL TRADING S.A.C.',
    ruc: '20600025784',
    partidaPJ: '13354985',
    oficina: 'Lima',
    ubicacion: 'Miraflores, Lima',
    fechaContrato: '2026-10-12',
    avales: [{ id: 'c02-a1', tipo: 'juridica', nombre: 'NUKLEO PERU S.A.C.', ruc: '20565937481', partidaPJ: '13322550', oficina: 'Lima', clienteId: 'c03' }],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: false, reporteTrib: false },
    partidas: [],
  },
  {
    id: 'c03',
    producto: 'confirming',
    nombre: 'NUKLEO PERU S.A.C.',
    ruc: '20565937481',
    partidaPJ: '13322550',
    oficina: 'Lima',
    ubicacion: 'San Isidro, Lima',
    fechaContrato: '2026-10-12',
    avales: [{ id: 'c03-a1', tipo: 'juridica', nombre: 'P.A.Y. METAL TRADING S.A.C.', ruc: '20600025784', partidaPJ: '13354985', oficina: 'Lima', clienteId: 'c02' }],
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: false, copiaLiteral: false, reporteTrib: false },
    partidas: [],
  },
  {
    id: 'c04',
    producto: 'confirming',
    nombre: 'CONSORCIO CUSCO',
    ruc: '20612606481',
    partidaPJ: '',
    oficina: '',
    ubicacion: 'San Isidro, Lima',
    fechaContrato: '2026-10-23',
    avales: [
      { id: 'c04-a1', tipo: 'juridica', nombre: 'TECNOEDIL S.A. CONSTRUCTORA – SUCURSAL PERÚ', ruc: '20610370170', partidaPJ: '15031002', oficina: 'Lima' },
      { id: 'c04-a2', tipo: 'juridica', nombre: 'ROVELLA CARRANZA S.A. SUCURSAL PERÚ', ruc: '20609697165', partidaPJ: '15020298', oficina: 'Lima' },
    ],
    nota: 'Consorcio sin partida propia: vigilar los bienes de las empresas consorciadas.',
    documentos: { contrato: true, firmado: false, pagare: true, fichaRuc: true, vigencia: true, copiaLiteral: true, reporteTrib: false },
    partidas: [],
  },
];
