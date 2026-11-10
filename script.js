/* ===================================
   GLOBAL FACTORING — Sistema Alerta Registral
   Todos los datos viven en Supabase (base de datos compartida).
   Lo que cualquiera registra en la web lo ve todo el equipo.
==================================== */

const $ = (id) => document.getElementById(id);

const REGISTROS = {
  inmueble: 'Registro de Propiedad Inmueble',
  mueble: 'Registro de Bienes Muebles',
  vehicular: 'Registro de Propiedad Vehicular',
};
const MOVIMIENTOS = {
  venta: 'Compraventa / transferencia',
  embargo: 'Embargo',
  garantia: 'Hipoteca / garantía',
  anotacion: 'Anotación / aviso',
  cancelacion: 'Cancelación de carga',
  otro: 'Otro movimiento',
};
// Estados de un título en SUNARP. grupo: tramite (sigue en curso), atencion (requiere revisar), final (concluido)
const ESTADOS_TITULO = {
  presentado: { txt: 'Presentado', grupo: 'tramite' },
  en_calificacion: { txt: 'En calificación', grupo: 'tramite' },
  observado: { txt: 'Observado', grupo: 'atencion' },
  liquidado: { txt: 'Liquidado', grupo: 'atencion' },
  apelado: { txt: 'Apelado', grupo: 'atencion' },
  inscrito: { txt: 'Inscrito', grupo: 'final' },
  tachado: { txt: 'Tachado', grupo: 'final' },
  otro: { txt: 'Otro', grupo: 'tramite' },
};
const SIGUELO_URL = 'https://sigueloplus.sunarp.gob.pe/siguelo/';
const RIESGO_POR_MOV = { venta: 'alto', embargo: 'medio', garantia: 'medio', anotacion: 'bajo', cancelacion: 'bajo' };
const RIESGO_TXT = { alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };
const DOCUMENTOS = [
  ['contrato', 'Contrato marco'],
  ['firmado', 'Copia firmada'],
  ['pagare', 'Pagaré'],
  ['fichaRuc', 'Ficha RUC'],
  ['vigencia', 'Vigencia de poder'],
  ['copiaLiteral', 'Copia literal'],
  ['reporteTrib', 'Reporte tributario'],
];
const TITULOS = {
  resumen: 'Resumen',
  clientes: 'Clientes',
  partidas: 'Partidas vigiladas',
  alertas: 'Alertas registrales',
  cliente: 'Ficha del cliente',
};

// ---------- Conexión ----------
const configurado = typeof SUPABASE_URL === 'string' && SUPABASE_URL && SUPABASE_KEY;
const sb = configurado && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ---------- Estado ----------
let db = { clientes: [], avales: [], partidas: [], alertas: [], tituloEventos: [] };
let usuario = null;
let titulosDisponibles = false;
const ui = {
  vista: 'resumen',
  clienteId: '',
  historialPartida: 'todas',
  busqueda: '',
  producto: 'todos',
  sinPartidas: false,
  registro: 'todos',
  riesgo: 'todos',
};

async function cargarDatos() {
  const [c, a, p, al, te] = await Promise.all([
    sb.from('clientes').select('*').order('producto').order('creado_en'),
    sb.from('avales').select('*').order('creado_en'),
    sb.from('partidas').select('*').order('creado_en'),
    sb.from('alertas').select('*').order('fecha', { ascending: false }),
    sb.from('titulo_eventos').select('*').order('fecha', { ascending: false }).order('creado_en', { ascending: false }),
  ]);
  const err = c.error || a.error || p.error || al.error;
  if (err) throw err;
  db = {
    clientes: c.data.map((x) => ({
      id: x.id,
      producto: x.producto,
      nombre: x.nombre,
      ruc: x.ruc,
      partidaPJ: x.partida_pj,
      oficina: x.oficina,
      ubicacion: x.ubicacion,
      fechaContrato: x.fecha_contrato,
      nota: x.nota,
      documentos: x.documentos || {},
    })),
    avales: a.data.map((x) => ({
      id: x.id,
      clienteId: x.cliente_id,
      tipo: x.tipo,
      nombre: x.nombre,
      ruc: x.ruc,
      partidaPJ: x.partida_pj,
      nota: x.nota,
      clienteRelacionado: x.cliente_relacionado,
    })),
    partidas: p.data.map((x) => ({
      id: x.id,
      clienteId: x.cliente_id,
      titular: x.aval_id || 'cliente',
      registro: x.registro,
      partida: x.partida,
      ficha: x.ficha,
      oficina: x.oficina,
      zona: x.zona,
      fechaRegistro: x.fecha_registro,
      estado: x.estado,
      alertaRegistral: x.alerta_registral,
    })),
    alertas: al.data.map((x) => ({
      id: x.id,
      partidaId: x.partida_id,
      mov: x.mov,
      riesgo: x.riesgo,
      detalle: x.detalle,
      ts: new Date(x.fecha).getTime(),
      prueba: x.prueba,
      creadoPor: x.creado_por,
      numeroTitulo: x.numero_titulo || '',
      fechaPresentacion: x.fecha_presentacion || '',
    })),
    // Si aún no se ejecutó supabase/2_titulos.sql la tabla no existe: la web sigue funcionando sin títulos
    tituloEventos: te.error
      ? []
      : te.data.map((x) => ({ id: x.id, alertaId: x.alerta_id, estado: x.estado, fecha: x.fecha, nota: x.nota, creadoPor: x.creado_por, creadoEn: x.creado_en })),
  };
  titulosDisponibles = !te.error;
}

async function refrescar() {
  try {
    await cargarDatos();
    render();
  } catch (e) {
    toast('No se pudieron cargar los datos: ' + mensajeError(e));
  }
}

function mensajeError(e) {
  if (!e) return 'error desconocido';
  if (e.code === '23505') return 'ese registro ya existe.';
  if (e.code === '42501' || e.status === 401) return 'tu sesión expiró, vuelve a ingresar.';
  return e.message || String(e);
}

// ---------- Datos ----------
const clientes = () => db.clientes.map((c) => ({ ...c, avales: db.avales.filter((a) => a.clienteId === c.id) }));
const partidas = () => db.partidas;
const alertas = () => db.alertas;
const cliente = (id) => clientes().find((c) => c.id === id);
const partida = (id) => db.partidas.find((p) => p.id === id);
const partidasDe = (cid) => db.partidas.filter((p) => p.clienteId === cid);
const avalesDe = (c) => (c ? db.avales.filter((a) => a.clienteId === c.id) : []);
const esDelAval = (p) => p.titular && p.titular !== 'cliente';
const alertasDePartida = (pid) => db.alertas.filter((a) => a.partidaId === pid);
const alertasDe = (cid) => {
  const ids = partidasDe(cid).map((p) => p.id);
  return db.alertas.filter((a) => ids.includes(a.partidaId));
};
// ---------- Títulos ----------
const eventosTitulo = (aid) =>
  db.tituloEventos.filter((e) => e.alertaId === aid).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || String(b.creadoEn).localeCompare(String(a.creadoEn)));
const estadoTitulo = (a) => eventosTitulo(a.id)[0] || null;
const tieneTitulo = (a) => Boolean(a.numeroTitulo || eventosTitulo(a.id).length);
const tituloAbierto = (a) => {
  if (!tieneTitulo(a)) return false;
  const e = estadoTitulo(a);
  return !e || ESTADOS_TITULO[e.estado].grupo !== 'final';
};
function diasDesde(iso) {
  if (!iso) return null;
  return Math.floor((tsDe(hoyIso()) - tsDe(iso)) / 86400000);
}
function badgeTitulo(a) {
  const e = estadoTitulo(a);
  if (!e) return a.numeroTitulo ? '<span class="tbadge tramite">Sin revisar</span>' : '';
  const est = ESTADOS_TITULO[e.estado] || ESTADOS_TITULO.otro;
  return `<span class="tbadge ${est.grupo}">${est.txt}</span>`;
}
function revisionTxt(a) {
  const e = estadoTitulo(a);
  const ref = e ? e.fecha : a.fechaPresentacion;
  const d = diasDesde(ref);
  if (d == null) return '';
  const cuando = d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`;
  return `${e ? 'Revisado' : 'Presentado'} ${cuando}`;
}
function bloqueTitulo(a) {
  if (!titulosDisponibles) return '';
  const evs = eventosTitulo(a.id);
  if (!tieneTitulo(a)) {
    return `<div class="titulo-box vacio">
      <span class="muted small">Sin datos del título SUNARP.</span>
      <button class="btn btn-ghost btn-sm" data-accion="titulo" data-id="${esc(a.id)}">+ Datos del título</button>
    </div>`;
  }
  const d = diasDesde(estadoTitulo(a) ? estadoTitulo(a).fecha : a.fechaPresentacion);
  const atrasado = tituloAbierto(a) && d != null && d >= 3;
  return `<div class="titulo-box">
    <div class="titulo-top">
      <span class="titulo-label">Título</span>
      <strong class="mono">${esc(a.numeroTitulo || 'sin número')}</strong>
      ${badgeTitulo(a)}
      ${a.fechaPresentacion ? `<span class="muted small">Presentado ${fecha(a.fechaPresentacion)}</span>` : ''}
      <span class="titulo-acciones">
        <a class="btn btn-ghost btn-sm" href="${SIGUELO_URL}" target="_blank" rel="noopener" title="Consultar el estado en Síguelo de SUNARP">Síguelo ↗</a>
        <button class="btn btn-primary btn-sm" data-accion="titulo" data-id="${esc(a.id)}">Actualizar estado</button>
      </span>
    </div>
    ${atrasado ? `<p class="titulo-aviso">${revisionTxt(a)}: conviene volver a consultar en Síguelo.</p>` : ''}
    ${
      evs.length
        ? `<ul class="titulo-hist">${evs
            .map(
              (e) => `<li><span class="tbadge ${ESTADOS_TITULO[e.estado].grupo}">${ESTADOS_TITULO[e.estado].txt}</span>
                <span class="muted small">${fecha(e.fecha)}${quien(e.creadoPor).replace('registrado', 'revisado')}</span>
                ${e.nota ? `<span class="titulo-nota">${esc(e.nota)}</span>` : ''}
                <button class="icon-btn sm" data-accion="borrar-evento" data-id="${esc(e.id)}" title="Eliminar esta revisión" aria-label="Eliminar revisión">✕</button></li>`
            )
            .join('')}</ul>`
        : ''
    }
  </div>`;
}

function titular(p) {
  const c = cliente(p.clienteId);
  if (!esDelAval(p)) return { tipo: 'cliente', nombre: c ? c.nombre : '—' };
  const a = db.avales.find((x) => x.id === p.titular);
  return { tipo: 'aval', nombre: a ? a.nombre : 'Aval', aval: a };
}

// ---------- Utilidades ----------
function esc(t) {
  const d = document.createElement('div');
  d.textContent = t == null ? '' : String(t);
  return d.innerHTML;
}
function fecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}
function fechaHora(ts) {
  return new Date(ts).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function tsDe(fechaIso) {
  const [y, m, d] = String(fechaIso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}
const hoyIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const riesgoMax = (lista) => ['alto', 'medio', 'bajo'].find((r) => lista.some((a) => a.riesgo === r)) || '';
function coincide(...campos) {
  const q = ui.busqueda.trim().toLowerCase();
  return !q || campos.some((c) => String(c || '').toLowerCase().includes(q));
}
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3200);
}
const tagProducto = (p) => `<span class="tag ${p}">${p === 'confirming' ? 'Confirming' : 'Factoring'}</span>`;
const badgeRiesgo = (r) => `<span class="badge ${r}"><i class="dot ${r}"></i>${RIESGO_TXT[r]}</span>`;
const tagOrigen = (a) => (a.prueba ? ' <span class="tag prueba">Prueba</span>' : '');
const bell = (on) =>
  `<span class="bell ${on ? 'on' : ''}" title="${on ? 'Notificaciones activas en Alerta Registral' : 'Sin afiliar a Alerta Registral'}"><svg viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3h-3v1.16A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z"/></svg></span>`;
function titularHtml(p) {
  const t = titular(p);
  const etiqueta = t.tipo === 'aval' ? '<span class="tag aval">Aval</span>' : '<span class="tag empresa">Cliente</span>';
  return `${etiqueta} <span class="titular-nombre">${esc(t.nombre)}</span>`;
}
function estadoCliente(c) {
  const r = riesgoMax(alertasDe(c.id));
  if (r) return badgeRiesgo(r);
  if (partidasDe(c.id).length) return '<span class="badge ok">Vigilado</span>';
  return '<span class="badge pend">Sin partidas</span>';
}
const vacio = (texto, boton = '') => `<div class="empty"><p>${texto}</p>${boton}</div>`;
const quien = (email) => (email ? ` · registrado por ${esc(String(email).split('@')[0])}` : '');

// ---------- Navegación ----------
function irA(hash) {
  let vista = hash || 'resumen';
  if (vista.startsWith('cliente/')) {
    const id = decodeURIComponent(vista.slice(8));
    if (ui.vista !== 'cliente' || ui.clienteId !== id) ui.historialPartida = 'todas';
    ui.clienteId = id;
    vista = 'cliente';
  }
  if (!TITULOS[vista]) vista = 'resumen';
  ui.vista = vista;
  document.querySelectorAll('.vista').forEach((v) => (v.hidden = v.id !== `vista-${vista}`));
  const menuActivo = vista === 'cliente' ? 'clientes' : vista;
  document.querySelectorAll('.menu-item').forEach((a) => a.classList.toggle('active', a.dataset.vista === menuActivo));
  $('tituloVista').textContent = TITULOS[vista];
  document.body.dataset.vista = vista;
  document.body.classList.remove('menu-open');
  window.scrollTo(0, 0);
  render();
}
window.addEventListener('hashchange', () => irA(location.hash.slice(1)));

$('menuBtn').addEventListener('click', () => document.body.classList.toggle('menu-open'));
$('overlay').addEventListener('click', () => document.body.classList.remove('menu-open'));

$('busquedaGlobal').addEventListener('input', (e) => {
  ui.busqueda = e.target.value;
  if ((ui.vista === 'resumen' || ui.vista === 'cliente') && ui.busqueda) location.hash = 'clientes';
  else render();
});

function segmented(id, clave) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    ui[clave] = b.dataset.valor;
    $(id).querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
    render();
  });
}
segmented('filtroProducto', 'producto');
segmented('filtroRegistro', 'registro');
segmented('filtroRiesgo', 'riesgo');
$('soloSinPartidas').addEventListener('change', (e) => {
  ui.sinPartidas = e.target.checked;
  render();
});
document.querySelectorAll('[data-filtro-rapido]').forEach((a) =>
  a.addEventListener('click', () => {
    ui.sinPartidas = true;
    $('soloSinPartidas').checked = true;
  })
);
document.querySelectorAll('[data-riesgo-rapido]').forEach((a) =>
  a.addEventListener('click', () => {
    ui.riesgo = a.dataset.riesgoRapido;
    $('filtroRiesgo').querySelectorAll('button').forEach((x) => x.classList.toggle('active', x.dataset.valor === ui.riesgo));
  })
);

// ---------- Render general ----------
function render() {
  if (!usuario) return;
  const cs = clientes();
  const ps = partidas();
  const als = alertas();
  $('menuClientes').textContent = cs.length;
  $('menuPartidas').textContent = ps.length;
  $('menuAlertas').textContent = als.length;
  $('menuAlertas').hidden = !als.length;

  if (ui.vista === 'resumen') renderResumen(cs, ps, als);
  if (ui.vista === 'clientes') renderClientes(cs);
  if (ui.vista === 'partidas') renderPartidas(ps);
  if (ui.vista === 'alertas') renderAlertas(als);
  if (ui.vista === 'cliente') renderCliente(ui.clienteId);
}

// ---------- Resumen ----------
function renderResumen(cs, ps, als) {
  const fact = cs.filter((c) => c.producto === 'factoring');
  const conf = cs.filter((c) => c.producto === 'confirming');
  const conPartidas = (lista) => lista.filter((c) => partidasDe(c.id).length).length;

  $('kpiClientes').textContent = cs.length;
  $('kpiFact').textContent = fact.length;
  $('kpiConf').textContent = conf.length;
  $('kpiAvales').textContent = db.avales.length;
  $('kpiPartidas').textContent = ps.length;
  $('kpiActivas').textContent = ps.filter((p) => p.alertaRegistral).length;
  $('kpiDeAvales').textContent = ps.filter(esDelAval).length;
  $('kpiSinPartidas').textContent = cs.length - conPartidas(cs);
  $('kpiAlto').textContent = als.filter((a) => a.riesgo === 'alto').length;
  $('kpiAlertas').textContent = als.length;

  const ultimas = [...als].sort((a, b) => b.ts - a.ts).slice(0, 5);
  $('resumenAlertas').innerHTML = ultimas.length
    ? `<ul class="feed">${ultimas
        .map((a) => {
          const p = partida(a.partidaId);
          const c = p && cliente(p.clienteId);
          return `<li><a class="feed-item" href="#cliente/${esc(c && c.id)}">
            <i class="dot ${a.riesgo}"></i>
            <div><strong>${esc(MOVIMIENTOS[a.mov] || a.mov)}</strong>${tagOrigen(a)} · ${esc(c ? c.nombre : '—')}
              <span class="muted block">Partida ${esc(p ? p.partida : '—')}${p && esDelAval(p) ? ` · aval ${esc(titular(p).nombre)}` : ''} · ${fechaHora(a.ts)}</span></div>
            ${badgeRiesgo(a.riesgo)}
          </a></li>`;
        })
        .join('')}</ul>`
    : vacio('Sin alertas. Las partidas vigiladas no registran movimientos.');

  const barra = (titulo, total, con) => {
    const pct = total ? Math.round((con / total) * 100) : 0;
    return `<div class="cob">
      <div class="cob-top"><span>${titulo}</span><span><strong>${con}</strong> / ${total} con partidas</span></div>
      <div class="bar"><span style="width:${pct}%"></span></div>
    </div>`;
  };
  $('cobertura').innerHTML =
    barra('Factoring', fact.length, conPartidas(fact)) +
    barra('Confirming', conf.length, conPartidas(conf)) +
    `<div class="cob-pend">
      <span class="muted">Pendientes de consulta SUNARP</span>
      <div class="chips">${cs
        .filter((c) => !partidasDe(c.id).length)
        .map((c) => `<a class="chip" href="#cliente/${esc(c.id)}">${esc(c.nombre)}</a>`)
        .join('')}</div>
    </div>`;

  // Títulos en trámite: los que no están inscritos ni tachados, el más antiguo sin revisar primero
  const panelT = $('panelTitulos');
  panelT.hidden = !titulosDisponibles;
  if (titulosDisponibles) {
    const abiertos = als.filter(tituloAbierto).sort((a, b) => {
      const ra = estadoTitulo(a) ? estadoTitulo(a).fecha : a.fechaPresentacion || '';
      const rb = estadoTitulo(b) ? estadoTitulo(b).fecha : b.fechaPresentacion || '';
      return String(ra).localeCompare(String(rb));
    });
    const sinTitulo = als.filter((a) => !tieneTitulo(a) && ['venta', 'embargo', 'garantia'].includes(a.mov));
    $('cntTitulos').textContent = abiertos.length;
    $('listaTitulos').innerHTML =
      (abiertos.length
        ? `<table class="table"><thead><tr><th>Título</th><th>Estado</th><th>Última revisión</th><th>Movimiento</th><th>Partida</th><th>Cliente Global</th></tr></thead><tbody>${abiertos
            .map((a) => {
              const p = partida(a.partidaId);
              const c = p && cliente(p.clienteId);
              const e = estadoTitulo(a);
              const d = diasDesde(e ? e.fecha : a.fechaPresentacion);
              return `<tr data-ir="cliente/${esc(c && c.id)}" tabindex="0">
                <td class="mono nowrap"><strong>${esc(a.numeroTitulo || 'sin número')}</strong></td>
                <td>${badgeTitulo(a)}</td>
                <td class="nowrap ${d != null && d >= 3 ? 'txt-atencion' : ''}">${e ? fecha(e.fecha) : 'Nunca'}${d != null ? ` <span class="muted small">(${d <= 0 ? 'hoy' : d + ' d'})</span>` : ''}</td>
                <td>${esc(MOVIMIENTOS[a.mov] || a.mov)}${tagOrigen(a)}</td>
                <td class="mono nowrap">${esc(p ? p.partida : '—')}</td>
                <td>${esc(c ? c.nombre : '—')}</td>
              </tr>`;
            })
            .join('')}</tbody></table>`
        : vacio('No hay títulos en trámite.')) +
      (sinTitulo.length
        ? `<p class="muted small sin-titulo">${sinTitulo.length} alerta(s) de riesgo sin datos del título. Ábrelas desde la ficha del cliente para registrarlo.</p>`
        : '');
  }

  const recientes = [...ps].sort((a, b) => String(b.fechaRegistro).localeCompare(String(a.fechaRegistro))).slice(0, 5);
  $('tablaResumenPartidas').innerHTML = recientes.length
    ? tablaPartidasHtml(recientes)
    : `<tbody><tr><td>${vacio('Aún no hay partidas afiliadas.')}</td></tr></tbody>`;
}

// ---------- Clientes ----------
function renderClientes(cs) {
  $('cntTodos').textContent = cs.length;
  $('cntFact').textContent = cs.filter((c) => c.producto === 'factoring').length;
  $('cntConf').textContent = cs.filter((c) => c.producto === 'confirming').length;

  const lista = cs.filter(
    (c) =>
      (ui.producto === 'todos' || c.producto === ui.producto) &&
      (!ui.sinPartidas || !partidasDe(c.id).length) &&
      coincide(c.nombre, c.ruc, c.ubicacion, ...avalesDe(c).map((a) => a.nombre), ...partidasDe(c.id).map((p) => p.partida))
  );

  $('tablaClientes').innerHTML = `
    <thead><tr>
      <th>Cliente</th><th>RUC</th><th>Producto</th><th>Avales</th><th>Contrato</th><th>Expediente</th><th class="c">Partidas</th><th>Estado</th><th></th>
    </tr></thead>
    <tbody>${
      lista.length
        ? lista
            .map((c) => {
              const docs = c.documentos || {};
              const n = DOCUMENTOS.filter(([k]) => docs[k]).length;
              const ps = partidasDe(c.id);
              const npAval = ps.filter(esDelAval).length;
              const avs = avalesDe(c);
              return `<tr data-ir="cliente/${esc(c.id)}" tabindex="0">
                <td><strong class="nombre">${esc(c.nombre)}</strong><span class="muted block">${esc(c.ubicacion || '')}</span></td>
                <td class="mono">${esc(c.ruc)}</td>
                <td>${tagProducto(c.producto)}</td>
                <td class="avales-cell">${
                  avs.length
                    ? avs.map((a) => `<span class="aval-line"><i class="aval-ico ${a.tipo === 'juridica' ? 'pj' : 'pn'}" title="${a.tipo === 'juridica' ? 'Persona jurídica' : 'Persona natural'}"></i>${esc(a.nombre)}</span>`).join('')
                    : '<span class="muted">—</span>'
                }</td>
                <td>${fecha(c.fechaContrato)}</td>
                <td class="nowrap"><span class="progress"><span style="width:${(n / DOCUMENTOS.length) * 100}%"></span></span> <span class="muted">${n}/${DOCUMENTOS.length}</span></td>
                <td class="c"><strong>${ps.length}</strong>${npAval ? `<span class="muted block small nowrap">${npAval} de aval</span>` : ''}</td>
                <td>${estadoCliente(c)}</td>
                <td class="r chevron">›</td>
              </tr>`;
            })
            .join('')
        : `<tr><td colspan="9">${vacio('No hay clientes con esos filtros.')}</td></tr>`
    }</tbody>`;
}

// ---------- Partidas ----------
function tablaPartidasHtml(lista) {
  return `
    <thead><tr>
      <th>Of. Reg.</th><th>Registro jurídico</th><th>Fecha de registro</th><th>N.° partida</th><th>Titular</th><th>Cliente Global</th><th>Último movimiento</th><th class="c">Notif.</th>
    </tr></thead>
    <tbody>${lista
      .map((p) => {
        const c = cliente(p.clienteId);
        const ult = alertasDePartida(p.id).sort((a, b) => b.ts - a.ts)[0];
        return `<tr data-ir="cliente/${esc(p.clienteId)}" tabindex="0">
          <td><strong>${esc((p.oficina || '').toUpperCase())}</strong>${p.zona ? `<span class="muted block small nowrap">${esc(p.zona)}</span>` : ''}</td>
          <td>${esc(REGISTROS[p.registro] || p.registro)}</td>
          <td>${fecha(p.fechaRegistro)}</td>
          <td class="mono nowrap"><strong>${esc(p.partida)}</strong>${p.ficha ? ` <span class="muted">(${esc(p.ficha)})</span>` : ''}</td>
          <td class="titular-cell">${titularHtml(p)}</td>
          <td>${esc(c ? c.nombre : '—')}</td>
          <td>${ult ? `${badgeRiesgo(ult.riesgo)} <span class="small">${esc(MOVIMIENTOS[ult.mov] || ult.mov)}</span>` : '<span class="badge ok">Sin movimientos</span>'}</td>
          <td class="c">${bell(p.alertaRegistral)}</td>
        </tr>`;
      })
      .join('')}</tbody>`;
}

function renderPartidas(ps) {
  const lista = ps.filter((p) => {
    const c = cliente(p.clienteId);
    return (ui.registro === 'todos' || p.registro === ui.registro) && coincide(p.partida, p.ficha, p.oficina, c && c.nombre, c && c.ruc, titular(p).nombre);
  });
  $('tablaPartidas').innerHTML = lista.length
    ? tablaPartidasHtml(lista)
    : `<tbody><tr><td>${vacio('No hay partidas con esos filtros.')}</td></tr></tbody>`;
}

// ---------- Alertas ----------
function renderAlertas(als) {
  const lista = [...als]
    .sort((a, b) => b.ts - a.ts)
    .filter((a) => {
      const p = partida(a.partidaId);
      const c = p && cliente(p.clienteId);
      return (ui.riesgo === 'todos' || a.riesgo === ui.riesgo) && coincide(c && c.nombre, c && c.ruc, p && p.partida, p && titular(p).nombre, a.detalle);
    });

  $('tablaAlertas').innerHTML = lista.length
    ? `<thead><tr><th>Fecha</th><th>Riesgo</th><th>Cliente Global</th><th>Titular del bien</th><th>Partida</th><th>Movimiento</th>${titulosDisponibles ? '<th>Título</th>' : ''}<th>Detalle</th></tr></thead>
      <tbody>${lista
        .map((a) => {
          const p = partida(a.partidaId);
          const c = p && cliente(p.clienteId);
          return `<tr class="row-${a.riesgo}" data-ir="cliente/${esc(c && c.id)}" tabindex="0">
            <td class="nowrap">${fechaHora(a.ts)}</td>
            <td class="nowrap">${badgeRiesgo(a.riesgo)}${tagOrigen(a)}</td>
            <td>${esc(c ? c.nombre : '—')}</td>
            <td class="titular-cell">${p ? titularHtml(p) : '—'}</td>
            <td class="mono nowrap"><strong>${esc(p ? p.partida : '—')}</strong><span class="muted block small">${esc(p ? REGISTROS[p.registro] : '')}</span></td>
            <td><strong>${esc(MOVIMIENTOS[a.mov] || a.mov)}</strong></td>
            ${titulosDisponibles ? `<td class="nowrap">${tieneTitulo(a) ? `<span class="mono small">${esc(a.numeroTitulo || '—')}</span><span class="block">${badgeTitulo(a)}</span>` : '<span class="muted small">—</span>'}</td>` : ''}
            <td class="muted wrap">${esc(a.detalle || '—')}</td>
          </tr>`;
        })
        .join('')}</tbody>`
    : `<tbody><tr><td>${vacio(als.length ? 'No hay alertas con esos filtros.' : 'Sin alertas registradas. Cuando SUNARP notifique un movimiento, regístralo con “+ Registrar alerta”.')}</td></tr></tbody>`;
}

// ---------- Página del cliente ----------
function eventosCliente(cid) {
  const ev = [];
  partidasDe(cid).forEach((p) => {
    if (p.fechaRegistro) ev.push({ tipo: 'afiliacion', partidaId: p.id, ts: tsDe(p.fechaRegistro), activo: p.alertaRegistral });
  });
  alertasDe(cid).forEach((a) => ev.push({ tipo: 'alerta', ...a }));
  return ev.sort((a, b) => b.ts - a.ts || (a.tipo === 'alerta' ? -1 : 1));
}

function renderCliente(id) {
  const c = cliente(id);
  const cont = $('vista-cliente');
  if (!c) {
    cont.innerHTML = vacio('Cliente no encontrado.', '<a class="btn btn-ghost" href="#clientes">Volver a clientes</a>');
    return;
  }
  const ps = partidasDe(id);
  const als = alertasDe(id).sort((a, b) => b.ts - a.ts);
  const riesgo = riesgoMax(als);
  const docs = c.documentos || {};
  const nDocs = DOCUMENTOS.filter(([k]) => docs[k]).length;
  const avs = avalesDe(c);
  const ev = eventosCliente(id).filter((e) => ui.historialPartida === 'todas' || e.partidaId === ui.historialPartida);

  cont.innerHTML = `
    <a class="back" href="#clientes">← Clientes</a>

    <div class="panel cliente-hero ${riesgo ? 'hero-' + riesgo : ''}">
      <div class="hero-main">
        <div class="hero-tags">${tagProducto(c.producto)} ${estadoCliente(c)}</div>
        <h2>${esc(c.nombre)}</h2>
        <div class="hero-meta">
          <span><b>RUC</b> ${esc(c.ruc)}</span>
          ${c.partidaPJ ? `<span><b>Partida PJ</b> ${esc(c.partidaPJ)}${c.oficina ? ' · ' + esc(c.oficina) : ''}</span>` : ''}
          ${c.ubicacion ? `<span><b>Ubicación</b> ${esc(c.ubicacion)}</span>` : ''}
          <span><b>Contrato</b> ${fecha(c.fechaContrato)}</span>
        </div>
      </div>
      <div class="hero-actions">
        <button class="btn btn-ghost" data-accion="partida" data-id="${esc(id)}">+ Partida</button>
        <button class="btn btn-primary" data-accion="alerta-cliente" data-id="${esc(id)}" ${ps.length ? '' : 'disabled title="Primero agrega una partida"'}>+ Registrar alerta</button>
      </div>
    </div>

    <div class="kpis">
      <div class="kpi"><span class="kpi-label">Partidas vigiladas</span><strong>${ps.length}</strong><span class="kpi-sub">${ps.filter((p) => !esDelAval(p)).length} del cliente · ${ps.filter(esDelAval).length} de avales</span></div>
      <div class="kpi"><span class="kpi-label">Avales</span><strong>${avs.length}</strong><span class="kpi-sub">${avs.filter((a) => a.tipo === 'juridica').length} empresa(s) · ${avs.filter((a) => a.tipo !== 'juridica').length} persona(s)</span></div>
      <div class="kpi ${riesgo === 'alto' ? 'kpi-alto' : ''}"><span class="kpi-label">Alertas</span><strong>${als.length}</strong><span class="kpi-sub">${als.filter((a) => a.riesgo === 'alto').length} de riesgo alto</span></div>
      <div class="kpi"><span class="kpi-label">Expediente</span><strong>${nDocs}/${DOCUMENTOS.length}</strong><span class="kpi-sub">documentos en carpeta</span></div>
    </div>

    <div class="cliente-grid">
      <div class="col-main">
        <div class="panel">
          <div class="panel-head">
            <h2>Historial de movimientos</h2>
            ${
              ps.length
                ? `<select class="select-sm" id="filtroHistorial" aria-label="Filtrar por partida">
                    <option value="todas">Todas las partidas</option>
                    ${ps.map((p) => `<option value="${esc(p.id)}" ${ui.historialPartida === p.id ? 'selected' : ''}>${esc(p.partida)} · ${esc((REGISTROS[p.registro] || '').replace('Registro de ', ''))}</option>`).join('')}
                  </select>`
                : ''
            }
          </div>
          ${ev.length ? `<ol class="timeline">${ev.map(itemHistorial).join('')}</ol>` : vacio(ps.length ? 'Sin movimientos para esta partida.' : 'Aún no hay partidas vigiladas para este cliente.')}
        </div>

        <div class="panel">
          <div class="panel-head"><h2>Partidas vigiladas</h2></div>
          <div class="titulares">
            ${grupoPartidas({ tipo: 'cliente', titulo: c.nombre, sub: `Empresa cliente · RUC ${c.ruc}`, lista: ps.filter((p) => !esDelAval(p)), clienteId: id, titularId: 'cliente' })}
            ${avs
              .map((a) =>
                grupoPartidas({
                  tipo: 'aval',
                  titulo: a.nombre,
                  sub: [`Aval ${a.tipo === 'juridica' ? 'persona jurídica' : 'persona natural'}`, a.ruc ? `RUC ${a.ruc}` : ''].filter(Boolean).join(' · '),
                  lista: ps.filter((p) => p.titular === a.id),
                  clienteId: id,
                  titularId: a.id,
                })
              )
              .join('')}
          </div>
        </div>
      </div>

      <div class="col-side">
        <div class="panel">
          <div class="panel-head"><h2>Avales</h2><button class="btn btn-ghost btn-sm" data-accion="aval" data-id="${esc(id)}">+ Aval</button></div>
          ${
            avs.length
              ? `<ul class="aval-list">${avs
                  .map((a) => {
                    const otro = a.clienteRelacionado && cliente(a.clienteRelacionado);
                    const n = ps.filter((p) => p.titular === a.id).length;
                    return `<li>
                      <i class="aval-ico ${a.tipo === 'juridica' ? 'pj' : 'pn'}"></i>
                      <div>
                        <strong>${esc(a.nombre)}</strong>
                        <span class="muted block small">${a.tipo === 'juridica' ? 'Persona jurídica' : 'Persona natural'}${a.ruc ? ' · RUC ' + esc(a.ruc) : ''}${a.partidaPJ ? ' · Partida ' + esc(a.partidaPJ) : ''}</span>
                        ${a.nota ? `<span class="muted block small">${esc(a.nota)}</span>` : ''}
                        ${otro ? `<a class="link small" href="#cliente/${esc(otro.id)}">También es cliente de Global →</a>` : ''}
                      </div>
                      <span class="pill">${n} partida${n === 1 ? '' : 's'}</span>
                      <button class="icon-btn sm" data-accion="borrar-aval" data-id="${esc(a.id)}" title="Eliminar aval" aria-label="Eliminar aval">✕</button>
                    </li>`;
                  })
                  .join('')}</ul>`
              : '<p class="muted small">Sin avales registrados.</p>'
          }
          ${c.nota ? `<p class="note">${esc(c.nota)}</p>` : ''}
        </div>

        <div class="panel">
          <div class="panel-head"><h2>Expediente</h2><span class="muted small">Marca lo que ya está en la carpeta</span></div>
          <ul class="docs docs-edit">${DOCUMENTOS.map(
            ([k, t]) => `<li><label class="${docs[k] ? 'si' : 'no'}"><input type="checkbox" data-doc="${k}" ${docs[k] ? 'checked' : ''} /> ${t}</label></li>`
          ).join('')}</ul>
        </div>

        <button class="btn btn-ghost btn-danger-text" data-accion="borrar-cliente" data-id="${esc(id)}">Eliminar cliente</button>
      </div>
    </div>`;

  const f = $('filtroHistorial');
  if (f) f.addEventListener('change', (e) => { ui.historialPartida = e.target.value; renderCliente(id); });
  cont.querySelectorAll('[data-doc]').forEach((chk) =>
    chk.addEventListener('change', async () => {
      const nuevos = { ...docs, [chk.dataset.doc]: chk.checked };
      const { error } = await sb.from('clientes').update({ documentos: nuevos }).eq('id', id);
      if (error) return toast('No se guardó: ' + mensajeError(error));
      await refrescar();
      toast('Expediente actualizado');
    })
  );
}

function itemHistorial(e) {
  const p = partida(e.partidaId);
  if (!p) return '';
  const t = titular(p);
  const meta = `Partida <b>${esc(p.partida)}</b>${p.ficha ? ` (${esc(p.ficha)})` : ''} · ${esc(REGISTROS[p.registro] || '')} · ${esc(p.oficina || '')} · ${t.tipo === 'aval' ? 'Aval' : 'Cliente'}: ${esc(t.nombre)}`;
  if (e.tipo === 'afiliacion') {
    return `<li class="tl-item tl-info">
      <span class="tl-dot"></span>
      <div class="tl-body">
        <div class="tl-top"><strong>${e.activo ? 'Afiliada a Alerta Registral' : 'Partida registrada'}</strong><span class="tl-date">${fecha(p.fechaRegistro)}</span></div>
        <div class="tl-meta">${meta}</div>
        <p class="muted small">${e.activo ? 'Se activaron las notificaciones de SUNARP para esta partida.' : 'Pendiente de afiliar en Alerta Registral.'}</p>
      </div>
    </li>`;
  }
  return `<li class="tl-item tl-${e.riesgo}">
    <span class="tl-dot"></span>
    <div class="tl-body">
      <div class="tl-top"><strong>${esc(MOVIMIENTOS[e.mov] || e.mov)}</strong> ${badgeRiesgo(e.riesgo)}${tagOrigen(e)}<span class="tl-date">${fechaHora(e.ts)}</span></div>
      <div class="tl-meta">${meta}</div>
      ${e.detalle ? `<p>${esc(e.detalle)}</p>` : ''}
      ${bloqueTitulo(e)}
      <div class="tl-foot"><span class="muted small">${quien(e.creadoPor).replace(' · ', '')}</span>
        <button class="link small btn-link-danger" data-accion="borrar-alerta" data-id="${esc(e.id)}">Eliminar</button></div>
    </div>
  </li>`;
}

function grupoPartidas({ tipo, titulo, sub, lista, clienteId, titularId }) {
  return `<div class="titular-box ${tipo}">
    <div class="titular-head">
      <span class="tag ${tipo === 'aval' ? 'aval' : 'empresa'}">${tipo === 'aval' ? 'Aval' : 'Cliente'}</span>
      <div class="titular-info">
        <strong>${esc(titulo)}</strong>
        <span class="muted block small">${esc(sub)}</span>
      </div>
      <button class="btn btn-ghost btn-sm" data-accion="partida-titular" data-id="${esc(clienteId)}" data-titular="${esc(titularId)}">+ Partida</button>
    </div>
    ${
      lista.length
        ? `<ul class="plist">${lista
            .map((p) => {
              const ult = alertasDePartida(p.id).sort((a, b) => b.ts - a.ts)[0];
              return `<li>
                ${bell(p.alertaRegistral)}
                <div><strong class="mono">${esc(p.partida)}</strong>${p.ficha ? ` <span class="muted">(${esc(p.ficha)})</span>` : ''}
                  <span class="muted block small">${esc(REGISTROS[p.registro] || '')} · ${esc(p.oficina || '')} · afiliada ${fecha(p.fechaRegistro)}</span></div>
                ${ult ? badgeRiesgo(ult.riesgo) : '<span class="badge ok">Sin movimientos</span>'}
                <button class="btn btn-ghost btn-sm" data-accion="alerta" data-id="${esc(p.id)}">+ Alerta</button>
                <button class="icon-btn sm" data-accion="borrar-partida" data-id="${esc(p.id)}" title="Eliminar partida" aria-label="Eliminar partida">✕</button>
              </li>`;
            })
            .join('')}</ul>`
        : '<p class="muted small sin-partidas">Sin partidas en Alerta Registral.</p>'
    }
  </div>`;
}

// ---------- Modales ----------
function opcionesClientes(sel, soloConPartidas = false) {
  const cs = clientes().filter((c) => !soloConPartidas || partidasDe(c.id).length);
  sel.innerHTML =
    '<option value="">Selecciona un cliente…</option>' +
    ['factoring', 'confirming']
      .map((prod) => {
        const g = cs.filter((c) => c.producto === prod);
        return g.length
          ? `<optgroup label="${prod === 'factoring' ? 'Factoring' : 'Confirming'}">${g.map((c) => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>`).join('')}</optgroup>`
          : '';
      })
      .join('');
}
function opcionesPartidas(cid) {
  const ps = partidasDe(cid);
  $('alPartida').innerHTML = ps.length
    ? ps
        .map((p) => {
          const t = titular(p);
          return `<option value="${esc(p.id)}">${esc(p.partida)} · ${esc(REGISTROS[p.registro] || '')} · ${t.tipo === 'aval' ? 'Aval: ' : ''}${esc(t.nombre)}</option>`;
        })
        .join('')
    : `<option value="">${cid ? 'Este cliente no tiene partidas' : 'Selecciona un cliente primero'}</option>`;
}
function opcionesTitular(cid) {
  const c = cliente(cid);
  $('parTitular').innerHTML = c
    ? `<option value="cliente">Cliente · ${esc(c.nombre)}</option>` +
      avalesDe(c).map((a) => `<option value="${esc(a.id)}">Aval · ${esc(a.nombre)}</option>`).join('')
    : '<option value="">Selecciona un cliente primero</option>';
}
$('parCliente').addEventListener('change', (e) => opcionesTitular(e.target.value));
$('alCliente').addEventListener('change', (e) => opcionesPartidas(e.target.value));
$('alMov').addEventListener('change', (e) => {
  if (RIESGO_POR_MOV[e.target.value]) $('alRiesgo').value = RIESGO_POR_MOV[e.target.value];
});
$('avTipo').addEventListener('change', (e) => document.querySelector('.solo-pj').toggleAttribute('hidden', e.target.value !== 'juridica'));

function abrirModal(id, { cliente: cid, partida: pid, titular: tid } = {}) {
  const m = $(id);
  m.querySelector('form').reset();
  m.querySelectorAll('.form-msg').forEach((x) => (x.textContent = ''));
  if (!cid && ui.vista === 'cliente') cid = ui.clienteId;
  if (id === 'modalPartida') {
    opcionesClientes($('parCliente'));
    if (cid) $('parCliente').value = cid;
    opcionesTitular($('parCliente').value);
    if (tid) $('parTitular').value = tid;
    $('parFecha').value = hoyIso();
  }
  if (id === 'modalAlerta') {
    opcionesClientes($('alCliente'), true);
    if (pid) cid = partida(pid).clienteId;
    if (cid) $('alCliente').value = cid;
    opcionesPartidas($('alCliente').value);
    if (pid) $('alPartida').value = pid;
  }
  if (id === 'modalAlerta') $('alGrupoTitulo').hidden = !titulosDisponibles;
  if (id === 'modalAval') {
    opcionesClientes($('avCliente'));
    if (cid) $('avCliente').value = cid;
    document.querySelector('.solo-pj').hidden = true;
  }
  m.showModal();
}
function abrirModalTitulo(aid) {
  const a = db.alertas.find((x) => x.id === aid);
  if (!a) return;
  const p = partida(a.partidaId);
  const f = $('formTitulo');
  f.reset();
  f.dataset.alerta = aid;
  $('msgTitulo').textContent = '';
  $('tiContexto').textContent = `${MOVIMIENTOS[a.mov] || a.mov} · partida ${p ? p.partida : ''} · aviso del ${fechaHora(a.ts)}`;
  $('tiNumero').value = a.numeroTitulo || '';
  $('tiFechaPres').value = a.fechaPresentacion || '';
  $('tiFecha').value = hoyIso();
  $('modalTitulo').showModal();
  (a.numeroTitulo ? $('tiEstado') : $('tiNumero')).focus();
}

document.querySelectorAll('dialog').forEach((d) =>
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  })
);

// ---------- Escritura en la base de datos ----------
async function guardarEn(tabla, fila, msgEl, okTexto, modal) {
  const btn = msgEl.closest('form').querySelector('[type=submit]');
  btn.disabled = true;
  msgEl.textContent = '';
  const { error } = await sb.from(tabla).insert(fila);
  btn.disabled = false;
  if (error) {
    msgEl.textContent = 'No se guardó: ' + mensajeError(error);
    return false;
  }
  if (modal) $(modal).close();
  await refrescar();
  toast(okTexto);
  return true;
}

async function borrar(tabla, id, pregunta) {
  if (!confirm(pregunta)) return;
  const { error } = await sb.from(tabla).delete().eq('id', id);
  if (error) return toast('No se eliminó: ' + mensajeError(error));
  await refrescar();
  toast('Eliminado');
}

// ---------- Clics ----------
document.addEventListener('click', (e) => {
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) return abrirModal(abrir.dataset.abrir);

  const cerrar = e.target.closest('[data-cerrar]');
  if (cerrar) return cerrar.closest('dialog').close();

  const acc = e.target.closest('[data-accion]');
  if (acc) {
    e.preventDefault();
    e.stopPropagation();
    const id = acc.dataset.id;
    switch (acc.dataset.accion) {
      case 'partida': return abrirModal('modalPartida', { cliente: id });
      case 'partida-titular': return abrirModal('modalPartida', { cliente: id, titular: acc.dataset.titular });
      case 'alerta': return abrirModal('modalAlerta', { partida: id });
      case 'alerta-cliente': return abrirModal('modalAlerta', { cliente: id });
      case 'aval': return abrirModal('modalAval', { cliente: id });
      case 'titulo': return abrirModalTitulo(id);
      case 'borrar-evento': return borrar('titulo_eventos', id, '¿Eliminar esta revisión del título?');
      case 'borrar-alerta': return borrar('alertas', id, '¿Eliminar esta alerta? Se borrará para todo el equipo.');
      case 'borrar-partida': return borrar('partidas', id, '¿Eliminar esta partida y su historial? Se borrará para todo el equipo.');
      case 'borrar-aval': return borrar('avales', id, '¿Eliminar este aval y sus partidas? Se borrará para todo el equipo.');
      case 'borrar-cliente':
        return borrar('clientes', id, '¿Eliminar este cliente con sus avales, partidas y alertas? Se borrará para todo el equipo.').then(() => {
          if (!cliente(id)) location.hash = 'clientes';
        });
      default: return;
    }
  }

  const fila = e.target.closest('[data-ir]');
  if (fila && !e.target.closest('a, button, select, input')) location.hash = fila.dataset.ir;
});
document.addEventListener('keydown', (e) => {
  const fila = e.target.closest && e.target.closest('[data-ir]');
  if (fila && e.key === 'Enter') location.hash = fila.dataset.ir;
});

// ---------- Formularios ----------
$('formCliente').addEventListener('submit', async (e) => {
  e.preventDefault();
  const ruc = $('cliRuc').value.trim();
  if (!/^\d{11}$/.test(ruc)) return ($('msgCliente').textContent = 'El RUC debe tener 11 dígitos.');
  const id = crypto.randomUUID();
  const ok = await guardarEn(
    'clientes',
    {
      id,
      producto: $('cliProducto').value,
      nombre: $('cliNombre').value.trim().toUpperCase(),
      ruc,
      partida_pj: $('cliPartida').value.trim() || null,
      fecha_contrato: $('cliFecha').value || null,
    },
    $('msgCliente'),
    'Cliente agregado',
    'modalCliente'
  );
  if (ok) location.hash = `cliente/${id}`;
});

$('formAval').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pj = $('avTipo').value === 'juridica';
  await guardarEn(
    'avales',
    {
      cliente_id: $('avCliente').value,
      tipo: $('avTipo').value,
      nombre: $('avNombre').value.trim().toUpperCase(),
      ruc: pj ? $('avRuc').value.trim() || null : null,
      partida_pj: pj ? $('avPartida').value.trim() || null : null,
      nota: $('avNota').value.trim() || null,
    },
    $('msgAval'),
    'Aval agregado',
    'modalAval'
  );
});

$('formPartida').addEventListener('submit', async (e) => {
  e.preventDefault();
  const clienteId = $('parCliente').value;
  const numero = $('parNumero').value.trim();
  if (!clienteId || !numero) return;
  const tit = $('parTitular').value;
  await guardarEn(
    'partidas',
    {
      cliente_id: clienteId,
      aval_id: tit && tit !== 'cliente' ? tit : null,
      registro: $('parRegistro').value,
      partida: numero,
      ficha: $('parFicha').value.trim() || null,
      oficina: $('parOficina').value.trim(),
      fecha_registro: $('parFecha').value || null,
      alerta_registral: $('parAlerta').checked,
      estado: $('parAlerta').checked ? 'Activa' : 'Pendiente',
    },
    $('msgPartida'),
    `Partida ${numero} agregada`,
    'modalPartida'
  );
});

$('formAlerta').addEventListener('submit', async (e) => {
  e.preventDefault();
  const partidaId = $('alPartida').value;
  if (!partidaId || !$('alMov').value || !$('alRiesgo').value) return ($('msgAlerta').textContent = 'Completa cliente, partida, movimiento y riesgo.');
  const fila = {
    partida_id: partidaId,
    mov: $('alMov').value,
    riesgo: $('alRiesgo').value,
    detalle: $('alDetalle').value.trim() || null,
  };
  if (titulosDisponibles) {
    fila.numero_titulo = $('alTitulo').value.trim() || null;
    fila.fecha_presentacion = $('alTituloFecha').value || null;
  }
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  $('msgAlerta').textContent = '';
  const { data, error } = await sb.from('alertas').insert(fila).select('id').single();
  if (error) {
    btn.disabled = false;
    $('msgAlerta').textContent =
      error.code === '23505' ? 'Esta alerta ya está registrada hoy para esa partida. Revisa el historial del cliente.' : 'No se guardó: ' + mensajeError(error);
    return;
  }
  const estado = titulosDisponibles && $('alTituloEstado').value;
  if (estado) {
    const r = await sb.from('titulo_eventos').insert({ alerta_id: data.id, estado, fecha: hoyIso() });
    if (r.error) toast('La alerta se guardó, pero no el estado del título: ' + mensajeError(r.error));
  }
  btn.disabled = false;
  $('modalAlerta').close();
  await refrescar();
  toast('Alerta registrada para todo el equipo');
});

$('formTitulo').addEventListener('submit', async (e) => {
  e.preventDefault();
  const aid = e.target.dataset.alerta;
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  $('msgTitulo').textContent = '';
  const up = await sb
    .from('alertas')
    .update({ numero_titulo: $('tiNumero').value.trim() || null, fecha_presentacion: $('tiFechaPres').value || null })
    .eq('id', aid);
  let error = up.error;
  if (!error && $('tiEstado').value) {
    const r = await sb.from('titulo_eventos').insert({
      alerta_id: aid,
      estado: $('tiEstado').value,
      fecha: $('tiFecha').value || hoyIso(),
      nota: $('tiNota').value.trim() || null,
    });
    error = r.error;
  }
  btn.disabled = false;
  if (error) return ($('msgTitulo').textContent = 'No se guardó: ' + mensajeError(error));
  $('modalTitulo').close();
  await refrescar();
  toast('Título actualizado');
});

// ---------- Sesión ----------
function mostrarLogin(texto) {
  $('login').hidden = false;
  document.body.classList.add('sin-sesion');
  if (texto) $('loginInfo').textContent = texto;
}
async function entrar(session) {
  usuario = session.user;
  $('usuarioEmail').textContent = usuario.email;
  $('login').hidden = true;
  document.body.classList.remove('sin-sesion');
  await refrescar();
  irA(location.hash.slice(1) || 'resumen');
}

$('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('btnLogin').disabled = true;
  $('msgLogin').textContent = '';
  const { data, error } = await sb.auth.signInWithPassword({ email: $('loginEmail').value.trim(), password: $('loginPass').value });
  $('btnLogin').disabled = false;
  if (error) return ($('msgLogin').textContent = 'Correo o contraseña incorrectos.');
  $('loginPass').value = '';
  entrar(data.session);
});

$('btnSalir').addEventListener('click', async () => {
  await sb.auth.signOut();
  usuario = null;
  db = { clientes: [], avales: [], partidas: [], alertas: [] };
  mostrarLogin('Sesión cerrada.');
});

// Actualiza los datos al volver a la pestaña (por si otra persona registró algo)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && usuario) refrescar();
});
setInterval(() => usuario && !document.hidden && refrescar(), 60000);

// ---------- Inicio ----------
$('year').textContent = new Date().getFullYear();
(async () => {
  if (!sb) {
    mostrarLogin('Falta conectar la base de datos (config.js).');
    $('formLogin').querySelectorAll('input, button').forEach((x) => (x.disabled = true));
    return;
  }
  const { data } = await sb.auth.getSession();
  if (data.session) entrar(data.session);
  else mostrarLogin();
})();
