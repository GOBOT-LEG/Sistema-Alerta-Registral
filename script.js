/* ===================================
   GLOBAL FACTORING — Sistema Alerta Registral
   - Cartera base: clientes.js (CARTERA), compartida por el equipo.
   - Lo que se agrega desde la página se guarda en este navegador.
==================================== */

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'gf_alerta_registral_v3';

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

// ---------- Estado ----------
let extra = { clientes: [], partidas: [], alertas: [] };
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

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function guardar() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(extra)); } catch { /* sin almacenamiento */ }
}
function cargar() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (d) extra = { clientes: d.clientes || [], partidas: d.partidas || [], alertas: d.alertas || [] };
  } catch { /* empezar vacío */ }
}

// ---------- Datos ----------
const base = () => (typeof CARTERA !== 'undefined' ? CARTERA : []);
function clientes() {
  return [...base().map((c) => ({ ...c, base: true })), ...extra.clientes];
}
function partidas() {
  const lista = [];
  base().forEach((c) => (c.partidas || []).forEach((p, i) => lista.push({ ...p, id: `${c.id}-p${i}`, clienteId: c.id, base: true })));
  return [...lista, ...extra.partidas];
}
function tsDe(fechaIso, hora) {
  const [y, m, d] = String(fechaIso).split('-').map(Number);
  const [hh, mm] = String(hora || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0).getTime();
}
// Alertas: las de clientes.js (movimientos de cada partida) + las registradas en este navegador
function alertas() {
  const lista = [];
  partidas()
    .filter((p) => p.base)
    .forEach((p) =>
      (p.movimientos || []).forEach((m, i) =>
        lista.push({ ...m, id: `${p.id}-m${i}`, partidaId: p.id, ts: tsDe(m.fecha, m.hora), base: true })
      )
    );
  return [...lista, ...extra.alertas];
}

const cliente = (id) => clientes().find((c) => c.id === id);
const partida = (id) => partidas().find((p) => p.id === id);
const partidasDe = (cid) => partidas().filter((p) => p.clienteId === cid);
const avalesDe = (c) => (c && Array.isArray(c.avales) ? c.avales.filter((a) => a && typeof a === 'object') : []);
const esDelAval = (p) => p.titular && p.titular !== 'cliente';
const alertasDePartida = (pid) => alertas().filter((a) => a.partidaId === pid);
const alertasDe = (cid) => {
  const ids = partidasDe(cid).map((p) => p.id);
  return alertas().filter((a) => ids.includes(a.partidaId));
};
function titular(p) {
  const c = cliente(p.clienteId);
  if (!esDelAval(p)) return { tipo: 'cliente', nombre: c ? c.nombre : '—' };
  const a = avalesDe(c).find((x) => x.id === p.titular);
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
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}
function fechaHora(ts) {
  return new Date(ts).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
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
  t._t = setTimeout(() => t.classList.remove('show'), 2600);
}
const tagProducto = (p) => `<span class="tag ${p}">${p === 'confirming' ? 'Confirming' : 'Factoring'}</span>`;
const badgeRiesgo = (r) => `<span class="badge ${r}"><i class="dot ${r}"></i>${RIESGO_TXT[r]}</span>`;
const tagOrigen = (a) => (a.prueba ? ' <span class="tag prueba">Prueba</span>' : a.demo ? ' <span class="tag demo">Simulación</span>' : '');
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
const linkCliente = (c) => (c ? `<a href="#cliente/${esc(c.id)}" class="link">${esc(c.nombre)}</a>` : '—');

// ---------- Navegación ----------
function irA(hash) {
  let vista = hash || 'resumen';
  if (vista.startsWith('cliente/')) {
    const id = decodeURIComponent(vista.slice(8));
    if (ui.vista !== 'cliente' || ui.clienteId !== id) ui.historialPartida = 'todas';
    ui.clienteId = id;
    vista = cliente(id) ? 'cliente' : 'clientes';
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
  $('kpiAvales').textContent = cs.reduce((n, c) => n + avalesDe(c).length, 0);
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
                <td>${tagProducto(c.producto)}${c.demo ? ' <span class="tag demo">Simulación</span>' : ''}</td>
                <td class="avales-cell">${
                  avs.length
                    ? avs.map((a) => `<span class="aval-line"><i class="aval-ico ${a.tipo === 'juridica' ? 'pj' : 'pn'}" title="${a.tipo === 'juridica' ? 'Persona jurídica' : 'Persona natural'}"></i>${esc(a.nombre)}</span>`).join('')
                    : '<span class="muted">—</span>'
                }</td>
                <td>${fecha(c.fechaContrato)}</td>
                <td class="nowrap">${c.documentos ? `<span class="progress"><span style="width:${(n / DOCUMENTOS.length) * 100}%"></span></span> <span class="muted">${n}/${DOCUMENTOS.length}</span>` : '<span class="muted">—</span>'}</td>
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
    ? `<thead><tr><th>Fecha</th><th>Riesgo</th><th>Cliente Global</th><th>Titular del bien</th><th>Partida</th><th>Movimiento</th><th>Detalle</th><th></th></tr></thead>
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
            <td class="muted wrap">${esc(a.detalle || '—')}</td>
            <td class="r">${a.base ? '' : `<button class="icon-btn sm" data-accion="borrar-alerta" data-id="${esc(a.id)}" aria-label="Eliminar alerta">✕</button>`}</td>
          </tr>`;
        })
        .join('')}</tbody>`
    : `<tbody><tr><td>${vacio(als.length ? 'No hay alertas con esos filtros.' : 'Sin alertas registradas. Cuando SUNARP notifique un movimiento, regístralo con “+ Registrar alerta”.')}</td></tr></tbody>`;
}

// ---------- Página del cliente ----------
function eventosCliente(cid) {
  const ev = [];
  partidasDe(cid).forEach((p) => {
    if (p.fechaRegistro) {
      ev.push({ tipo: 'afiliacion', partidaId: p.id, ts: tsDe(p.fechaRegistro), activo: p.alertaRegistral });
    }
  });
  alertasDe(cid).forEach((a) => ev.push({ tipo: 'alerta', ...a }));
  return ev.sort((a, b) => b.ts - a.ts);
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
  const alto = als.find((a) => a.riesgo === 'alto');

  const ev = eventosCliente(id).filter((e) => ui.historialPartida === 'todas' || e.partidaId === ui.historialPartida);

  cont.innerHTML = `
    <a class="back" href="#clientes">← Clientes</a>

    <div class="panel cliente-hero ${riesgo ? 'hero-' + riesgo : ''}">
      <div class="hero-main">
        <div class="hero-tags">${tagProducto(c.producto)} ${estadoCliente(c)}${c.demo ? ' <span class="tag demo">Simulación</span>' : ''}</div>
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
        ${c.base ? '' : `<button class="btn btn-ghost btn-danger-text" data-accion="borrar-cliente" data-id="${esc(id)}">Eliminar</button>`}
      </div>
    </div>

    ${
      alto
        ? (() => {
            const p = partida(alto.partidaId);
            return `<div class="banner alto">
              <strong>Riesgo alto:</strong> ${esc(MOVIMIENTOS[alto.mov])} el ${fechaHora(alto.ts)} sobre la partida ${esc(p.partida)}
              (${esc(REGISTROS[p.registro])}, ${esc(p.oficina)}) — titular ${esc(titular(p).tipo === 'aval' ? 'aval ' : '')}${esc(titular(p).nombre)}.${alto.prueba ? ' <span class="tag prueba">Prueba</span>' : ''}
            </div>`;
          })()
        : ''
    }

    <div class="kpis">
      <div class="kpi"><span class="kpi-label">Partidas vigiladas</span><strong>${ps.length}</strong><span class="kpi-sub">${ps.filter((p) => !esDelAval(p)).length} del cliente · ${ps.filter(esDelAval).length} de avales</span></div>
      <div class="kpi"><span class="kpi-label">Avales</span><strong>${avs.length}</strong><span class="kpi-sub">${avs.filter((a) => a.tipo === 'juridica').length} empresa(s) · ${avs.filter((a) => a.tipo !== 'juridica').length} persona(s)</span></div>
      <div class="kpi ${riesgo === 'alto' ? 'kpi-alto' : ''}"><span class="kpi-label">Alertas</span><strong>${als.length}</strong><span class="kpi-sub">${als.filter((a) => a.riesgo === 'alto').length} de riesgo alto</span></div>
      <div class="kpi"><span class="kpi-label">Expediente</span><strong>${c.documentos ? `${nDocs}/${DOCUMENTOS.length}` : '—'}</strong><span class="kpi-sub">documentos en carpeta</span></div>
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
                    ${ps.map((p) => `<option value="${esc(p.id)}" ${ui.historialPartida === p.id ? 'selected' : ''}>${esc(p.partida)} · ${esc(REGISTROS[p.registro].replace('Registro de ', ''))}</option>`).join('')}
                  </select>`
                : ''
            }
          </div>
          ${
            ev.length
              ? `<ol class="timeline">${ev.map(itemHistorial).join('')}</ol>`
              : vacio(ps.length ? 'Sin movimientos para esta partida.' : 'Aún no hay partidas vigiladas para este cliente.')
          }
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
          <div class="panel-head"><h2>Avales</h2></div>
          ${
            avs.length
              ? `<ul class="aval-list">${avs
                  .map((a) => {
                    const otro = a.clienteId && cliente(a.clienteId);
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
                    </li>`;
                  })
                  .join('')}</ul>`
              : '<p class="muted small">Sin avales registrados.</p>'
          }
          ${c.nota ? `<p class="note">${esc(c.nota)}</p>` : ''}
        </div>

        ${
          c.documentos
            ? `<div class="panel">
                <div class="panel-head"><h2>Expediente</h2><span class="muted small">${nDocs}/${DOCUMENTOS.length}</span></div>
                <ul class="docs">${DOCUMENTOS.map(([k, t]) => `<li class="${docs[k] ? 'si' : 'no'}">${docs[k] ? '✓' : '—'} ${t}</li>`).join('')}</ul>
              </div>`
            : ''
        }
      </div>
    </div>`;

  const f = $('filtroHistorial');
  if (f) f.addEventListener('change', (e) => { ui.historialPartida = e.target.value; renderCliente(id); });
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
      ${e.base ? '' : `<button class="link small btn-link-danger" data-accion="borrar-alerta" data-id="${esc(e.id)}">Eliminar</button>`}
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
    $('parFecha').value = new Date().toISOString().slice(0, 10);
  }
  if (id === 'modalAlerta') {
    opcionesClientes($('alCliente'), true);
    if (pid) cid = partida(pid).clienteId;
    if (cid) $('alCliente').value = cid;
    opcionesPartidas($('alCliente').value);
    if (pid) $('alPartida').value = pid;
  }
  m.showModal();
}
document.querySelectorAll('dialog').forEach((d) =>
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  })
);

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
      case 'borrar-alerta':
        if (!confirm('¿Eliminar esta alerta?')) return;
        extra.alertas = extra.alertas.filter((a) => a.id !== id);
        break;
      case 'borrar-cliente': {
        if (!confirm('¿Eliminar este cliente, sus partidas y alertas?')) return;
        const ids = extra.partidas.filter((p) => p.clienteId === id).map((p) => p.id);
        extra.alertas = extra.alertas.filter((a) => !ids.includes(a.partidaId));
        extra.partidas = extra.partidas.filter((p) => p.clienteId !== id);
        extra.clientes = extra.clientes.filter((c) => c.id !== id);
        guardar();
        location.hash = 'clientes';
        return;
      }
      default: return;
    }
    guardar();
    render();
    return;
  }

  // Filas clicables: llevan a la página del cliente
  const fila = e.target.closest('[data-ir]');
  if (fila && !e.target.closest('a, button, select, input')) location.hash = fila.dataset.ir;
});
document.addEventListener('keydown', (e) => {
  const fila = e.target.closest && e.target.closest('[data-ir]');
  if (fila && e.key === 'Enter') location.hash = fila.dataset.ir;
});

// ---------- Formularios ----------
$('formCliente').addEventListener('submit', (e) => {
  e.preventDefault();
  const ruc = $('cliRuc').value.trim();
  if (!/^\d{11}$/.test(ruc)) return ($('msgCliente').textContent = 'El RUC debe tener 11 dígitos.');
  if (clientes().some((c) => c.ruc === ruc)) return ($('msgCliente').textContent = 'Ya existe un cliente con ese RUC.');
  const id = uid();
  extra.clientes.push({
    id,
    producto: $('cliProducto').value,
    nombre: $('cliNombre').value.trim().toUpperCase(),
    ruc,
    partidaPJ: $('cliPartida').value.trim(),
    fechaContrato: $('cliFecha').value,
    avales: [],
  });
  guardar();
  $('modalCliente').close();
  location.hash = `cliente/${id}`;
  toast('Cliente agregado');
});

$('formPartida').addEventListener('submit', (e) => {
  e.preventDefault();
  const clienteId = $('parCliente').value;
  const numero = $('parNumero').value.trim();
  if (!clienteId || !numero) return;
  if (partidasDe(clienteId).some((p) => p.partida === numero)) return ($('msgPartida').textContent = 'Esa partida ya está registrada para este cliente.');
  extra.partidas.push({
    id: uid(),
    clienteId,
    titular: $('parTitular').value || 'cliente',
    registro: $('parRegistro').value,
    partida: numero,
    ficha: $('parFicha').value.trim(),
    oficina: $('parOficina').value.trim(),
    zona: '',
    fechaRegistro: $('parFecha').value,
    alertaRegistral: $('parAlerta').checked,
    estado: $('parAlerta').checked ? 'Activa' : 'Pendiente',
  });
  guardar();
  $('modalPartida').close();
  render();
  toast(`Partida ${numero} agregada`);
});

$('formAlerta').addEventListener('submit', (e) => {
  e.preventDefault();
  const partidaId = $('alPartida').value;
  if (!partidaId || !$('alMov').value || !$('alRiesgo').value) return ($('msgAlerta').textContent = 'Completa cliente, partida, movimiento y riesgo.');
  extra.alertas.push({
    id: uid(),
    partidaId,
    mov: $('alMov').value,
    riesgo: $('alRiesgo').value,
    detalle: $('alDetalle').value.trim(),
    ts: Date.now(),
  });
  guardar();
  $('modalAlerta').close();
  render();
  toast('Alerta registrada');
});

$('btnReiniciar').addEventListener('click', () => {
  if (!confirm('Se borrará lo agregado en este navegador (la cartera base se mantiene). ¿Continuar?')) return;
  extra = { clientes: [], partidas: [], alertas: [] };
  guardar();
  render();
  toast('Datos reiniciados');
});

// ---------- Inicio ----------
$('year').textContent = new Date().getFullYear();
cargar();
irA(location.hash.slice(1) || 'resumen');
