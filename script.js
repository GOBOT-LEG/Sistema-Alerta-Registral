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
  venta: 'Venta o transferencia',
  embargo: 'Embargo',
  garantia: 'Hipoteca / garantía',
  anotacion: 'Anotación / aviso',
  cancelacion: 'Cancelación de carga',
  otro: 'Otro',
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
const TITULOS = { resumen: 'Resumen', clientes: 'Clientes', partidas: 'Partidas vigiladas', alertas: 'Alertas registrales' };

// ---------- Estado ----------
let extra = { clientes: [], partidas: [], alertas: [] };
const ui = { vista: 'resumen', busqueda: '', producto: 'todos', sinPartidas: false, registro: 'todos', riesgo: 'todos' };

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

const base = () => (typeof CARTERA !== 'undefined' ? CARTERA : []);
function clientes() {
  return [...base().map((c) => ({ ...c, base: true })), ...extra.clientes];
}
function partidas() {
  const lista = [];
  base().forEach((c) => (c.partidas || []).forEach((p, i) => lista.push({ ...p, id: `${c.id}-p${i}`, clienteId: c.id, base: true })));
  return [...lista, ...extra.partidas];
}
const cliente = (id) => clientes().find((c) => c.id === id);
const partida = (id) => partidas().find((p) => p.id === id);
const partidasDe = (cid) => partidas().filter((p) => p.clienteId === cid);
const avalesDe = (c) => (c && Array.isArray(c.avales) ? c.avales.filter((a) => a && typeof a === 'object') : []);
const esDelAval = (p) => p.titular && p.titular !== 'cliente';
function titular(p) {
  const c = cliente(p.clienteId);
  if (!esDelAval(p)) return { tipo: 'cliente', nombre: c ? c.nombre : '—' };
  const a = avalesDe(c).find((x) => x.id === p.titular);
  return { tipo: 'aval', nombre: a ? a.nombre : 'Aval', aval: a };
}
function titularHtml(p, corto = false) {
  const t = titular(p);
  const etiqueta = t.tipo === 'aval' ? '<span class="tag aval">Aval</span>' : '<span class="tag empresa">Cliente</span>';
  return corto ? etiqueta : `${etiqueta} <span class="titular-nombre">${esc(t.nombre)}</span>`;
}
const alertasDe = (cid) => {
  const ids = partidasDe(cid).map((p) => p.id);
  return extra.alertas.filter((a) => ids.includes(a.partidaId));
};

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
function riesgoMax(lista) {
  return ['alto', 'medio', 'bajo'].find((r) => lista.some((a) => a.riesgo === r)) || '';
}
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
const bell = (on) =>
  `<span class="bell ${on ? 'on' : ''}" title="${on ? 'Notificaciones activas en Alerta Registral' : 'Sin afiliar a Alerta Registral'}"><svg viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3h-3v1.16A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z"/></svg></span>`;

function estadoCliente(c) {
  const r = riesgoMax(alertasDe(c.id));
  if (r) return badgeRiesgo(r);
  if (partidasDe(c.id).length) return '<span class="badge ok">Vigilado</span>';
  return '<span class="badge pend">Sin partidas</span>';
}
function vacio(texto, boton = '') {
  return `<div class="empty"><p>${texto}</p>${boton}</div>`;
}

// ---------- Navegación ----------
function irA(vista) {
  if (!TITULOS[vista]) vista = 'resumen';
  ui.vista = vista;
  document.querySelectorAll('.vista').forEach((v) => (v.hidden = v.id !== `vista-${vista}`));
  document.querySelectorAll('.menu-item').forEach((a) => a.classList.toggle('active', a.dataset.vista === vista));
  $('tituloVista').textContent = TITULOS[vista];
  document.body.classList.remove('menu-open');
  render();
}
window.addEventListener('hashchange', () => irA(location.hash.slice(1)));

$('menuBtn').addEventListener('click', () => document.body.classList.toggle('menu-open'));
$('overlay').addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  cerrarDrawer();
});

$('busquedaGlobal').addEventListener('input', (e) => {
  ui.busqueda = e.target.value;
  if (ui.vista === 'resumen' && ui.busqueda) location.hash = 'clientes';
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

function setSegmented(id, clave, valor) {
  ui[clave] = valor;
  $(id).querySelectorAll('button').forEach((x) => x.classList.toggle('active', x.dataset.valor === valor));
}
document.querySelectorAll('[data-filtro-rapido]').forEach((a) =>
  a.addEventListener('click', () => {
    ui.sinPartidas = true;
    $('soloSinPartidas').checked = true;
  })
);
document.querySelectorAll('[data-riesgo-rapido]').forEach((a) =>
  a.addEventListener('click', () => setSegmented('filtroRiesgo', 'riesgo', a.dataset.riesgoRapido))
);

// ---------- Render general ----------
function render() {
  const cs = clientes();
  const ps = partidas();
  $('menuClientes').textContent = cs.length;
  $('menuPartidas').textContent = ps.length;
  $('menuAlertas').textContent = extra.alertas.length;
  $('menuAlertas').hidden = !extra.alertas.length;

  if (ui.vista === 'resumen') renderResumen(cs, ps);
  if (ui.vista === 'clientes') renderClientes(cs);
  if (ui.vista === 'partidas') renderPartidas(ps);
  if (ui.vista === 'alertas') renderAlertas();
  if ($('drawer').classList.contains('open')) abrirDrawer($('drawer').dataset.abierto);
}

// ---------- Resumen ----------
function renderResumen(cs, ps) {
  const fact = cs.filter((c) => c.producto === 'factoring');
  const conf = cs.filter((c) => c.producto === 'confirming');
  const conPartidas = (lista) => lista.filter((c) => partidasDe(c.id).length).length;

  $('kpiClientes').textContent = cs.length;
  $('kpiFact').textContent = fact.length;
  $('kpiConf').textContent = conf.length;
  $('kpiPartidas').textContent = ps.length;
  $('kpiActivas').textContent = ps.filter((p) => p.alertaRegistral).length;
  $('kpiDeAvales').textContent = ps.filter(esDelAval).length;
  $('kpiAvales').textContent = cs.reduce((n, c) => n + avalesDe(c).length, 0);
  $('kpiSinPartidas').textContent = cs.length - conPartidas(cs);
  $('kpiAlto').textContent = extra.alertas.filter((a) => a.riesgo === 'alto').length;
  $('kpiAlertas').textContent = extra.alertas.length;

  const ultimas = [...extra.alertas].sort((a, b) => b.ts - a.ts).slice(0, 5);
  $('resumenAlertas').innerHTML = ultimas.length
    ? `<ul class="feed">${ultimas
        .map((a) => {
          const p = partida(a.partidaId);
          const c = p && cliente(p.clienteId);
          return `<li class="feed-item" data-cliente="${esc(c && c.id)}">
            <i class="dot ${a.riesgo}"></i>
            <div><strong>${esc(MOVIMIENTOS[a.mov])}</strong> · ${esc(c ? c.nombre : '—')}
              <span class="muted block">Partida ${esc(p ? p.partida : '—')}${p && esDelAval(p) ? ` · aval ${esc(titular(p).nombre)}` : ''} · ${fechaHora(a.ts)}</span></div>
            ${badgeRiesgo(a.riesgo)}
          </li>`;
        })
        .join('')}</ul>`
    : vacio('Sin alertas. Las partidas vigiladas no registran movimientos.', '<button class="btn btn-ghost btn-sm" data-accion="simulacion">Cargar simulación</button>');

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
        .map((c) => `<button class="chip" data-cliente="${esc(c.id)}">${esc(c.nombre)}</button>`)
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
              const np = ps.length;
              const npAval = ps.filter(esDelAval).length;
              const avs = avalesDe(c);
              return `<tr data-cliente="${esc(c.id)}">
                <td><strong class="nombre">${esc(c.nombre)}</strong><span class="muted block">${esc(c.ubicacion || '')}</span></td>
                <td class="mono">${esc(c.ruc)}</td>
                <td>${tagProducto(c.producto)}${c.demo ? ' <span class="tag demo">Simulación</span>' : ''}</td>
                <td class="avales-cell">${
                  avs.length
                    ? avs.map((a) => `<span class="aval-line"><i class="aval-ico ${a.tipo === 'juridica' ? 'pj' : 'pn'}" title="${a.tipo === 'juridica' ? 'Persona jurídica' : 'Persona natural'}"></i>${esc(a.nombre)}</span>`).join('')
                    : '<span class="muted">—</span>'
                }</td>
                <td>${fecha(c.fechaContrato)}</td>
                <td>${c.documentos ? `<span class="progress" title="${n} de ${DOCUMENTOS.length} documentos"><span style="width:${(n / DOCUMENTOS.length) * 100}%"></span></span> <span class="muted">${n}/${DOCUMENTOS.length}</span>` : '<span class="muted">—</span>'}</td>
                <td class="c"><strong>${np}</strong>${npAval ? `<span class="muted block small nowrap">${npAval} de aval</span>` : ''}</td>
                <td>${estadoCliente(c)}</td>
                <td class="r nowrap">
                  <button class="btn btn-ghost btn-sm" data-accion="partida" data-id="${esc(c.id)}">+ Partida</button>
                  <button class="btn btn-ghost btn-sm" data-cliente="${esc(c.id)}">Ver</button>
                </td>
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
      <th>Of. Reg.</th><th>Registro jurídico</th><th>Fecha de registro</th><th>N.° partida</th><th>Titular</th><th>Cliente Global</th><th>Estado</th><th class="c">Notif.</th><th></th>
    </tr></thead>
    <tbody>${lista
      .map((p) => {
        const c = cliente(p.clienteId);
        const n = extra.alertas.filter((a) => a.partidaId === p.id).length;
        return `<tr>
          <td><strong>${esc((p.oficina || '').toUpperCase())}</strong>${p.zona ? `<span class="muted block small nowrap">${esc(p.zona)}</span>` : ''}</td>
          <td>${esc(REGISTROS[p.registro] || p.registro)}</td>
          <td>${fecha(p.fechaRegistro)}</td>
          <td class="mono"><strong>${esc(p.partida)}</strong>${p.ficha ? ` <span class="muted">(${esc(p.ficha)})</span>` : ''}</td>
          <td class="titular-cell">${titularHtml(p)}</td>
          <td><a href="#" class="link" data-cliente="${esc(c && c.id)}">${esc(c ? c.nombre : '—')}</a></td>
          <td><span class="badge ${p.estado === 'Activa' || p.alertaRegistral ? 'ok' : 'pend'}">${esc(p.estado || (p.alertaRegistral ? 'Activa' : 'Pendiente'))}</span></td>
          <td class="c">${bell(p.alertaRegistral)}${n ? `<span class="bell-count">${n}</span>` : ''}</td>
          <td class="r nowrap">
            <button class="btn btn-ghost btn-sm" data-accion="alerta" data-id="${esc(p.id)}">+ Alerta</button>
            ${p.base ? '' : `<button class="icon-btn sm" data-accion="borrar-partida" data-id="${esc(p.id)}" aria-label="Quitar partida">✕</button>`}
          </td>
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
    : `<tbody><tr><td>${vacio('No hay partidas con esos filtros.', '<button class="btn btn-primary btn-sm" data-abrir="modalPartida">+ Agregar partida</button>')}</td></tr></tbody>`;
}

// ---------- Alertas ----------
function renderAlertas() {
  const lista = [...extra.alertas]
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
          return `<tr class="row-${a.riesgo}">
            <td class="nowrap">${fechaHora(a.ts)}</td>
            <td>${badgeRiesgo(a.riesgo)}${a.demo ? ' <span class="tag demo">Simulación</span>' : ''}</td>
            <td><a href="#" class="link" data-cliente="${esc(c && c.id)}">${esc(c ? c.nombre : '—')}</a></td>
            <td class="titular-cell">${p ? titularHtml(p) : '—'}</td>
            <td class="mono nowrap"><strong>${esc(p ? p.partida : '—')}</strong><span class="muted block small">${esc(p ? REGISTROS[p.registro] : '')}</span></td>
            <td><strong>${esc(MOVIMIENTOS[a.mov] || a.mov)}</strong></td>
            <td class="muted wrap">${esc(a.detalle || '—')}</td>
            <td class="r"><button class="icon-btn sm" data-accion="borrar-alerta" data-id="${esc(a.id)}" aria-label="Eliminar alerta">✕</button></td>
          </tr>`;
        })
        .join('')}</tbody>`
    : `<tbody><tr><td>${vacio(
        extra.alertas.length ? 'No hay alertas con esos filtros.' : 'Sin alertas registradas. Cuando SUNARP notifique un movimiento, regístralo aquí.',
        '<button class="btn btn-primary btn-sm" data-abrir="modalAlerta">+ Registrar alerta</button>'
      )}</td></tr></tbody>`;
}

// ---------- Panel de detalle ----------
function abrirDrawer(id) {
  const c = cliente(id);
  if (!c) return;
  const d = $('drawer');
  d.dataset.abierto = id;
  $('dProducto').className = `tag ${c.producto}`;
  $('dProducto').textContent = c.producto === 'confirming' ? 'Confirming' : 'Factoring';
  $('dNombre').textContent = c.nombre;
  $('dRuc').textContent = `RUC ${c.ruc}`;

  const ps = partidasDe(id);
  const als = alertasDe(id).sort((a, b) => b.ts - a.ts);
  const docs = c.documentos || {};

  $('drawerBody').innerHTML = `
    <div class="drawer-actions">
      <button class="btn btn-primary btn-sm" data-accion="partida" data-id="${esc(id)}">+ Partida</button>
      <button class="btn btn-ghost btn-sm" data-accion="alerta-cliente" data-id="${esc(id)}" ${ps.length ? '' : 'disabled'}>+ Alerta</button>
      ${c.base ? '' : `<button class="btn btn-ghost btn-sm btn-danger-text" data-accion="borrar-cliente" data-id="${esc(id)}">Eliminar</button>`}
    </div>
    <dl class="kv">
      <div><dt>Estado</dt><dd>${estadoCliente(c)}</dd></div>
      <div><dt>Fecha de contrato</dt><dd>${fecha(c.fechaContrato)}</dd></div>
      <div><dt>Partida PJ</dt><dd class="mono">${esc(c.partidaPJ || '—')}${c.oficina ? ` · ${esc(c.oficina)}` : ''}</dd></div>
      <div><dt>Ubicación</dt><dd>${esc(c.ubicacion || '—')}</dd></div>
    </dl>
    ${c.nota ? `<p class="note">${esc(c.nota)}</p>` : ''}

    <h4>Partidas vigiladas <span class="muted">(${ps.length})</span></h4>
    ${grupoPartidas({
      tipo: 'cliente',
      titulo: c.nombre,
      sub: `Empresa cliente · RUC ${c.ruc}`,
      lista: ps.filter((p) => !esDelAval(p)),
      clienteId: id,
      titularId: 'cliente',
    })}
    ${avalesDe(c)
      .map((a) => {
        const otro = a.clienteId && cliente(a.clienteId);
        return grupoPartidas({
          tipo: 'aval',
          titulo: a.nombre,
          sub: [
            `Aval ${a.tipo === 'juridica' ? 'persona jurídica' : 'persona natural'}`,
            a.ruc ? `RUC ${a.ruc}` : '',
            a.partidaPJ ? `Partida PJ ${a.partidaPJ}` : '',
          ].filter(Boolean).join(' · '),
          nota: a.nota || (otro ? `También es cliente de Global (${otro.producto}).` : ''),
          otroCliente: otro ? otro.id : '',
          lista: ps.filter((p) => p.titular === a.id),
          clienteId: id,
          titularId: a.id,
        });
      })
      .join('')}
    ${avalesDe(c).length ? '' : '<p class="muted small">Este cliente no tiene avales registrados.</p>'}

    <h4>Alertas <span class="muted">(${als.length})</span></h4>
    ${
      als.length
        ? `<ul class="feed">${als
            .map((a) => {
              const p = partida(a.partidaId);
              return `<li class="feed-item"><i class="dot ${a.riesgo}"></i><div><strong>${esc(MOVIMIENTOS[a.mov])}</strong> · Partida ${esc(p ? p.partida : '')}${p && esDelAval(p) ? ` (aval ${esc(titular(p).nombre)})` : ''}
                <span class="muted block">${fechaHora(a.ts)}${a.detalle ? ' · ' + esc(a.detalle) : ''}</span></div>${badgeRiesgo(a.riesgo)}</li>`;
            })
            .join('')}</ul>`
        : '<p class="muted small">Sin movimientos registrados.</p>'
    }

    ${
      c.documentos
        ? `<h4>Expediente</h4><ul class="docs">${DOCUMENTOS.map(([k, t]) => `<li class="${docs[k] ? 'si' : 'no'}">${docs[k] ? '✓' : '—'} ${t}</li>`).join('')}</ul>`
        : ''
    }`;

  d.classList.add('open');
  d.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drawer-open');
}
function grupoPartidas({ tipo, titulo, sub, nota, otroCliente, lista, clienteId, titularId }) {
  return `<div class="titular-box ${tipo}">
    <div class="titular-head">
      <span class="tag ${tipo === 'aval' ? 'aval' : 'empresa'}">${tipo === 'aval' ? 'Aval' : 'Cliente'}</span>
      <div class="titular-info">
        <strong>${esc(titulo)}</strong>
        <span class="muted block small">${esc(sub)}</span>
        ${nota ? `<span class="muted block small">${esc(nota)}${otroCliente ? ` <a href="#" class="link" data-cliente="${esc(otroCliente)}">Ver ficha</a>` : ''}</span>` : ''}
      </div>
      <button class="btn btn-ghost btn-sm" data-accion="partida-titular" data-id="${esc(clienteId)}" data-titular="${esc(titularId)}">+ Partida</button>
    </div>
    ${
      lista.length
        ? `<ul class="plist">${lista
            .map(
              (p) => `<li>
                ${bell(p.alertaRegistral)}
                <div><strong class="mono">${esc(p.partida)}</strong>${p.ficha ? ` <span class="muted">(${esc(p.ficha)})</span>` : ''}
                  <span class="muted block">${esc(REGISTROS[p.registro] || '')} · ${esc(p.oficina || '')} · ${fecha(p.fechaRegistro)}</span></div>
                <button class="btn btn-ghost btn-sm" data-accion="alerta" data-id="${esc(p.id)}">+ Alerta</button>
              </li>`
            )
            .join('')}</ul>`
        : '<p class="muted small sin-partidas">Sin partidas en Alerta Registral.</p>'
    }
  </div>`;
}

function cerrarDrawer() {
  $('drawer').classList.remove('open');
  $('drawer').setAttribute('aria-hidden', 'true');
  document.body.classList.remove('drawer-open');
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

function abrirModal(id, { cliente: cid, partida: pid, titular: tid } = {}) {
  const m = $(id);
  m.querySelector('form').reset();
  m.querySelectorAll('.form-msg').forEach((x) => (x.textContent = ''));
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
$('alCliente').addEventListener('change', (e) => opcionesPartidas(e.target.value));
$('alMov').addEventListener('change', (e) => {
  if (RIESGO_POR_MOV[e.target.value]) $('alRiesgo').value = RIESGO_POR_MOV[e.target.value];
});
document.querySelectorAll('dialog').forEach((d) =>
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  })
);

// ---------- Clics ----------
document.addEventListener('click', (e) => {
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) return abrirModal(abrir.dataset.abrir, { cliente: $('drawer').classList.contains('open') ? $('drawer').dataset.abierto : '' });

  const cerrar = e.target.closest('[data-cerrar]');
  if (cerrar) {
    const dlg = cerrar.closest('dialog');
    return dlg ? dlg.close() : cerrarDrawer();
  }

  const acc = e.target.closest('[data-accion]');
  if (acc) {
    e.preventDefault();
    const id = acc.dataset.id;
    switch (acc.dataset.accion) {
      case 'partida': return abrirModal('modalPartida', { cliente: id });
      case 'partida-titular': return abrirModal('modalPartida', { cliente: id, titular: acc.dataset.titular });
      case 'alerta': return abrirModal('modalAlerta', { partida: id });
      case 'alerta-cliente': return abrirModal('modalAlerta', { cliente: id });
      case 'simulacion': return cargarSimulacion();
      case 'borrar-alerta':
        if (!confirm('¿Eliminar esta alerta?')) return;
        extra.alertas = extra.alertas.filter((a) => a.id !== id);
        break;
      case 'borrar-partida':
        if (!confirm('¿Quitar esta partida y sus alertas?')) return;
        extra.alertas = extra.alertas.filter((a) => a.partidaId !== id);
        extra.partidas = extra.partidas.filter((p) => p.id !== id);
        break;
      case 'borrar-cliente': {
        if (!confirm('¿Eliminar este cliente, sus partidas y alertas?')) return;
        const ids = extra.partidas.filter((p) => p.clienteId === id).map((p) => p.id);
        extra.alertas = extra.alertas.filter((a) => !ids.includes(a.partidaId));
        extra.partidas = extra.partidas.filter((p) => p.clienteId !== id);
        extra.clientes = extra.clientes.filter((c) => c.id !== id);
        cerrarDrawer();
        break;
      }
      default: return;
    }
    guardar();
    render();
    return;
  }

  const fila = e.target.closest('[data-cliente]');
  if (fila && fila.dataset.cliente) {
    e.preventDefault();
    abrirDrawer(fila.dataset.cliente);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarDrawer();
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
  });
  guardar();
  $('modalCliente').close();
  render();
  abrirDrawer(id);
  toast('Cliente agregado');
});

$('formPartida').addEventListener('submit', (e) => {
  e.preventDefault();
  const clienteId = $('parCliente').value;
  const numero = $('parNumero').value.trim();
  if (!clienteId || !numero) return;
  if (partidasDe(clienteId).some((p) => p.partida === numero)) return ($('msgPartida').textContent = 'Esa partida ya está registrada para este cliente.');
  const oficina = $('parOficina').value.trim();
  extra.partidas.push({
    id: uid(),
    clienteId,
    titular: $('parTitular').value || 'cliente',
    registro: $('parRegistro').value,
    partida: numero,
    ficha: $('parFicha').value.trim(),
    oficina,
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

// ---------- Simulación (empresa ficticia, marcada) ----------
function cargarSimulacion() {
  if (!extra.clientes.some((c) => c.demo)) {
    const h = (n) => Date.now() - n * 3600 * 1000;
    extra.clientes.push({
      id: 'demo',
      demo: true,
      producto: 'factoring',
      nombre: 'EMPRESA DEMO S.A.C. (FICTICIA)',
      ruc: '20000000001',
      ubicacion: 'Simulación',
      fechaContrato: new Date().toISOString().slice(0, 10),
      avales: [{ id: 'demo-a1', tipo: 'natural', nombre: 'AVAL DE EJEMPLO (FICTICIO)' }],
    });
    extra.partidas.push(
      { id: 'demo-p1', clienteId: 'demo', titular: 'demo-a1', demo: true, registro: 'inmueble', partida: '00000001', oficina: 'Lima', zona: 'Zona Registral IX - Sede Lima', fechaRegistro: new Date().toISOString().slice(0, 10), estado: 'Activa', alertaRegistral: true },
      { id: 'demo-p2', clienteId: 'demo', titular: 'cliente', demo: true, registro: 'vehicular', partida: '00000002', ficha: 'XXX-001', oficina: 'Lima', zona: 'Zona Registral IX - Sede Lima', fechaRegistro: new Date().toISOString().slice(0, 10), estado: 'Activa', alertaRegistral: true }
    );
    extra.alertas.push(
      { id: uid(), demo: true, partidaId: 'demo-p1', mov: 'venta', riesgo: 'alto', detalle: 'Presentación de compraventa a favor de un tercero.', ts: h(3) },
      { id: uid(), demo: true, partidaId: 'demo-p2', mov: 'garantia', riesgo: 'medio', detalle: 'Solicitud de inscripción de garantía mobiliaria.', ts: h(30) },
      { id: uid(), demo: true, partidaId: 'demo-p1', mov: 'anotacion', riesgo: 'bajo', detalle: 'Solicitud de publicidad registral.', ts: h(96) }
    );
    guardar();
  }
  location.hash = 'alertas';
  render();
  toast('Simulación cargada (empresa ficticia)');
}
$('btnSimulacion').addEventListener('click', cargarSimulacion);
$('btnReiniciar').addEventListener('click', () => {
  if (!confirm('Se borrará lo agregado en este navegador (la cartera base se mantiene). ¿Continuar?')) return;
  extra = { clientes: [], partidas: [], alertas: [] };
  guardar();
  cerrarDrawer();
  render();
  toast('Datos reiniciados');
});

// ---------- Inicio ----------
$('year').textContent = new Date().getFullYear();
cargar();
irA(location.hash.slice(1) || 'resumen');
