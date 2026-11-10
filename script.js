/* ===================================
   GLOBAL FACTORING — Sistema Alerta Registral
   Lógica del sistema
   - La cartera base viene de clientes.js (CARTERA).
   - Lo que se agrega desde la página (clientes, bienes, alertas)
     se guarda en este navegador (localStorage).
==================================== */

// ---------- Menú móvil ----------
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');

menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

// ---------- Año dinámico ----------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Constantes ----------
const STORAGE_KEY = 'gf_alerta_registral_v2';
const $ = (id) => document.getElementById(id);

const RIESGO_POR_MOVIMIENTO = {
  venta: 'alto',        // El bien puede salir del patrimonio del cliente
  embargo: 'medio',     // Afectación judicial de otro acreedor
  garantia: 'medio',    // Nueva carga sobre el bien
  anotacion: 'bajo',    // Informativa, sin afectación directa
  cancelacion: 'bajo',  // Se levanta una carga
};

const MOVIMIENTOS = {
  venta: 'Venta o transferencia de propiedad',
  embargo: 'Embargo judicial',
  garantia: 'Hipoteca o constitución de garantía',
  anotacion: 'Anotación o aviso informativo',
  cancelacion: 'Cancelación de carga o gravamen',
  otro: 'Otro movimiento',
};

const RIESGO_ETIQUETA = {
  alto: 'Riesgo alto',
  medio: 'Riesgo medio',
  bajo: 'Riesgo bajo',
};

const TIPOS_BIEN = {
  predio: 'Predio',
  vehiculo: 'Vehículo',
  maquinaria: 'Maquinaria',
};

const DOCUMENTOS = [
  ['contrato', 'Contrato marco'],
  ['firmado', 'Copia firmada'],
  ['pagare', 'Pagaré'],
  ['fichaRuc', 'Ficha RUC'],
  ['vigencia', 'Vigencia de poder'],
  ['copiaLiteral', 'Copia literal'],
  ['reporteTrib', 'Reporte tributario'],
];

// ---------- Estado ----------
// Lo agregado por el usuario; la cartera base siempre se lee de CARTERA.
let extra = { clientes: [], bienes: [], alertas: [] };
let filtro = 'todos';
let busqueda = '';

const uid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);

function guardar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(extra));
  } catch {
    /* navegador sin almacenamiento: la demo sigue funcionando sin guardar */
  }
}

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (datos) {
      extra = {
        clientes: datos.clientes || [],
        bienes: datos.bienes || [],
        alertas: datos.alertas || [],
      };
    }
  } catch {
    /* datos dañados o sin acceso: empezar vacío */
  }
}

// ---------- Datos combinados ----------
function todosLosClientes() {
  const base = (typeof CARTERA !== 'undefined' ? CARTERA : []).map((c) => ({ ...c, base: true }));
  return [...base, ...extra.clientes];
}

function todosLosBienes() {
  const base = [];
  (typeof CARTERA !== 'undefined' ? CARTERA : []).forEach((c) => {
    (c.bienes || []).forEach((b, i) => base.push({ id: `${c.id}-b${i}`, clienteId: c.id, base: true, ...b }));
  });
  return [...base, ...extra.bienes];
}

const clientePorId = (id) => todosLosClientes().find((c) => c.id === id);
const bienPorId = (id) => todosLosBienes().find((b) => b.id === id);

// ---------- Utilidades ----------
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

function fechaLarga(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fechaHora(ts) {
  return new Date(ts).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function mostrarMsg(el, texto, ok) {
  el.textContent = texto;
  el.classList.toggle('ok', Boolean(ok));
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.textContent = '';
    el.classList.remove('ok');
  }, 4000);
}

function riesgoMaximo(alertas) {
  if (alertas.some((a) => a.riesgo === 'alto')) return 'alto';
  if (alertas.some((a) => a.riesgo === 'medio')) return 'medio';
  if (alertas.some((a) => a.riesgo === 'bajo')) return 'bajo';
  return '';
}

// ---------- Panel ----------
function renderPanel() {
  const clientes = todosLosClientes();
  const bienes = todosLosBienes();
  const alertas = extra.alertas;
  const nFact = clientes.filter((c) => c.producto === 'factoring').length;
  const nConf = clientes.filter((c) => c.producto === 'confirming').length;
  const sinPartidas = clientes.filter((c) => !bienes.some((b) => b.clienteId === c.id)).length;

  $('heroClientes').textContent = clientes.length;
  $('heroFactoring').textContent = nFact;
  $('heroConfirming').textContent = nConf;

  $('statClientes').textContent = clientes.length;
  $('statFactoring').textContent = nFact;
  $('statConfirming').textContent = nConf;
  $('statBienes').textContent = bienes.length;
  $('statInscritos').textContent = bienes.filter((b) => b.alertaRegistral).length;
  $('statPendientes').textContent = sinPartidas;
  $('statAlertas').textContent = alertas.length;
  $('statAlto').textContent = alertas.filter((a) => a.riesgo === 'alto').length;
  $('statMedio').textContent = alertas.filter((a) => a.riesgo === 'medio').length;
  $('statBajo').textContent = alertas.filter((a) => a.riesgo === 'bajo').length;

  $('tabTodos').textContent = clientes.length;
  $('tabFactoring').textContent = nFact;
  $('tabConfirming').textContent = nConf;
}

// ---------- Cartera ----------
function renderCartera() {
  const grid = $('carteraGrid');
  const bienes = todosLosBienes();
  const q = busqueda.trim().toLowerCase();

  const lista = todosLosClientes().filter((c) => {
    if (filtro !== 'todos' && c.producto !== filtro) return false;
    if (!q) return true;
    return c.nombre.toLowerCase().includes(q) || String(c.ruc || '').includes(q);
  });

  $('carteraVacia').hidden = lista.length > 0;

  grid.innerHTML = lista
    .map((c) => {
      const susBienes = bienes.filter((b) => b.clienteId === c.id);
      const susAlertas = extra.alertas.filter((a) => susBienes.some((b) => b.id === a.bienId));
      const riesgo = riesgoMaximo(susAlertas);
      const docs = c.documentos || {};
      const nDocs = DOCUMENTOS.filter(([k]) => docs[k]).length;

      let estado;
      if (riesgo) {
        estado = `<span class="estado estado-${riesgo}">${RIESGO_ETIQUETA[riesgo]} · ${susAlertas.length} alerta(s)</span>`;
      } else if (susBienes.length) {
        estado = `<span class="estado estado-ok">En vigilancia · sin movimientos</span>`;
      } else {
        estado = `<span class="estado estado-pend">Pendiente: cargar partidas SUNARP</span>`;
      }

      const bienesHtml = susBienes.length
        ? `<ul class="bienes">${susBienes
            .map(
              (b) => `<li>
                <span class="bien-tipo">${escapar(TIPOS_BIEN[b.tipo] || 'Bien')}</span>
                <span class="bien-partida">${escapar(b.partida)}</span>
                ${b.alertaRegistral ? '<span class="bien-ok" title="Inscrita en Alerta Registral SUNARP">Alerta Registral ✓</span>' : '<span class="bien-no">Sin Alerta Registral</span>'}
                ${b.base ? '' : `<button class="mini-x" data-rol="bien" data-id="${escapar(b.id)}" aria-label="Quitar bien">✕</button>`}
                ${b.desc ? `<span class="bien-desc">${escapar(b.desc)}</span>` : ''}
              </li>`
            )
            .join('')}</ul>`
        : `<p class="bienes-vacio">Aún no hay bienes registrados para este cliente.</p>`;

      return `
      <article class="cliente ${riesgo ? 'borde-' + riesgo : ''}">
        <div class="cliente-top">
          <span class="card-tag ${escapar(c.producto)}">${c.producto === 'confirming' ? 'Confirming' : 'Factoring'}</span>
          ${c.demo ? '<span class="card-tag demo">Simulación</span>' : ''}
          ${c.base ? '' : `<button class="mini-x" data-rol="cliente" data-id="${escapar(c.id)}" aria-label="Quitar cliente">✕</button>`}
        </div>
        <h3>${escapar(c.nombre)}</h3>
        <dl class="datos">
          <div><dt>RUC</dt><dd>${escapar(c.ruc || '—')}</dd></div>
          <div><dt>Partida PJ</dt><dd>${c.partidaPJ ? escapar(c.partidaPJ) + (c.oficina ? ' · ' + escapar(c.oficina) : '') : '—'}</dd></div>
          <div><dt>Contrato</dt><dd>${fechaLarga(c.fechaContrato)}</dd></div>
          <div><dt>Ubicación</dt><dd>${escapar(c.ubicacion || '—')}</dd></div>
        </dl>
        ${c.avales && c.avales.length ? `<p class="avales">${c.avales.map(escapar).join('<br />')}</p>` : ''}
        ${c.nota ? `<p class="nota">${escapar(c.nota)}</p>` : ''}
        ${
          c.documentos
            ? `<details class="docs">
                <summary>Expediente: ${nDocs}/${DOCUMENTOS.length} documentos</summary>
                <ul>${DOCUMENTOS.map(([k, t]) => `<li class="${docs[k] ? 'si' : 'no'}">${docs[k] ? '✓' : '—'} ${t}</li>`).join('')}</ul>
              </details>`
            : ''
        }
        <div class="vigilancia">
          <div class="vigilancia-head">
            <span>Bienes vigilados (${susBienes.length})</span>
            ${estado}
          </div>
          ${bienesHtml}
          <button type="button" class="btn btn-neutral btn-sm btn-block" data-agregar-bien="${escapar(c.id)}">+ Agregar partida</button>
        </div>
      </article>`;
    })
    .join('');
}

// ---------- Selects ----------
function llenarSelectClientes() {
  const clientes = todosLosClientes();
  [$('bienCliente'), $('alertaCliente')].forEach((sel) => {
    const previo = sel.value;
    sel.innerHTML = '<option value="">Selecciona un cliente…</option>';
    ['factoring', 'confirming'].forEach((prod) => {
      const grupo = document.createElement('optgroup');
      grupo.label = prod === 'factoring' ? 'Factoring' : 'Confirming';
      clientes
        .filter((c) => c.producto === prod)
        .forEach((c) => {
          const op = document.createElement('option');
          op.value = c.id;
          op.textContent = c.nombre;
          grupo.appendChild(op);
        });
      if (grupo.children.length) sel.appendChild(grupo);
    });
    if (clientes.some((c) => c.id === previo)) sel.value = previo;
  });
  llenarSelectBienes();
}

function llenarSelectBienes() {
  const sel = $('alertaBien');
  const clienteId = $('alertaCliente').value;
  const delCliente = todosLosBienes().filter((b) => b.clienteId === clienteId);

  sel.innerHTML = delCliente.length
    ? '<option value="">Selecciona un bien…</option>'
    : `<option value="">${clienteId ? 'Este cliente aún no tiene bienes' : 'Selecciona un bien…'}</option>`;
  delCliente.forEach((b) => {
    const op = document.createElement('option');
    op.value = b.id;
    op.textContent = `${TIPOS_BIEN[b.tipo] || 'Bien'} · ${b.partida}`;
    sel.appendChild(op);
  });
}

$('alertaCliente').addEventListener('change', llenarSelectBienes);

$('alertaMov').addEventListener('change', () => {
  const sugerido = RIESGO_POR_MOVIMIENTO[$('alertaMov').value];
  const hint = $('riesgoHint');
  if (sugerido) {
    $('alertaRiesgo').value = sugerido;
    hint.textContent = `Sugerencia aplicada: ${RIESGO_ETIQUETA[sugerido].toLowerCase()}. Puedes ajustarla.`;
  } else {
    hint.textContent = 'Define el nivel de riesgo manualmente.';
  }
});

// ---------- Alertas ----------
function renderAlertas() {
  const list = $('listaAlertas');
  const ordenadas = [...extra.alertas].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  $('alertaVacia').style.display = ordenadas.length ? 'none' : 'block';

  list.innerHTML = ordenadas
    .map((a) => {
      const bien = bienPorId(a.bienId);
      const cliente = bien ? clientePorId(bien.clienteId) : null;
      return `
      <li class="alert-item risk-${escapar(a.riesgo)}">
        <div class="alert-info">
          <div class="alert-top">
            <span class="risk-badge ${escapar(a.riesgo)}">${RIESGO_ETIQUETA[a.riesgo] || ''}</span>
            ${a.demo ? '<span class="card-tag demo">Simulación</span>' : ''}
            <span class="alert-date">${escapar(fechaHora(a.ts))}</span>
          </div>
          <span class="alert-cliente"><strong>${escapar(cliente ? cliente.nombre : 'Cliente eliminado')}</strong>
            <span class="alert-doc">${cliente && cliente.ruc ? 'RUC ' + escapar(cliente.ruc) : ''}</span>
          </span>
          <span class="alert-partida">${bien ? `${escapar(TIPOS_BIEN[bien.tipo] || 'Bien')} · ${escapar(bien.partida)}` : 'Bien eliminado'}</span>
          <span class="alert-mov">${escapar(MOVIMIENTOS[a.mov] || a.mov)}</span>
          ${a.detalle ? `<span class="alert-detail">${escapar(a.detalle)}</span>` : ''}
        </div>
        <button class="alert-delete" data-id="${escapar(a.id)}" aria-label="Eliminar alerta">✕</button>
      </li>`;
    })
    .join('');
}

function renderTodo() {
  renderPanel();
  renderCartera();
  llenarSelectClientes();
  renderAlertas();
}

// ---------- Filtros de cartera ----------
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    filtro = tab.dataset.filtro;
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
    });
    renderCartera();
  });
});

$('buscarCliente').addEventListener('input', (e) => {
  busqueda = e.target.value;
  renderCartera();
});

// ---------- Clics generales (eliminar / agregar partida) ----------
document.addEventListener('click', (e) => {
  const agregar = e.target.closest('[data-agregar-bien]');
  if (agregar) {
    $('bienCliente').value = agregar.dataset.agregarBien;
    $('registro').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => $('bienTipo').focus(), 500);
    return;
  }

  const btn = e.target.closest('.mini-x, .alert-delete');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.classList.contains('alert-delete')) {
    if (!confirm('¿Eliminar esta alerta registral?')) return;
    extra.alertas = extra.alertas.filter((a) => a.id !== id);
  } else if (btn.dataset.rol === 'bien') {
    const n = extra.alertas.filter((a) => a.bienId === id).length;
    if (!confirm(`¿Quitar este bien?${n ? `\nTambién se eliminarán ${n} alerta(s).` : ''}`)) return;
    extra.alertas = extra.alertas.filter((a) => a.bienId !== id);
    extra.bienes = extra.bienes.filter((b) => b.id !== id);
  } else if (btn.dataset.rol === 'cliente') {
    const c = clientePorId(id);
    if (!c || !confirm(`¿Quitar al cliente "${c.nombre}" y sus bienes y alertas?`)) return;
    const idsBienes = extra.bienes.filter((b) => b.clienteId === id).map((b) => b.id);
    extra.alertas = extra.alertas.filter((a) => !idsBienes.includes(a.bienId));
    extra.bienes = extra.bienes.filter((b) => b.clienteId !== id);
    extra.clientes = extra.clientes.filter((x) => x.id !== id);
  } else {
    return;
  }
  guardar();
  renderTodo();
});

// ---------- Formulario: cliente ----------
$('formCliente').addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = $('cliNombre').value.trim().toUpperCase();
  const ruc = $('cliDoc').value.trim();
  const producto = $('cliProducto').value;
  const msg = $('msgCliente');

  if (!nombre || !/^\d{11}$/.test(ruc)) {
    mostrarMsg(msg, 'El RUC debe tener 11 dígitos.', false);
    return;
  }
  if (todosLosClientes().some((c) => c.ruc === ruc)) {
    mostrarMsg(msg, 'Ya existe un cliente con ese RUC.', false);
    return;
  }

  extra.clientes.push({ id: uid(), producto, nombre, ruc });
  guardar();
  renderTodo();
  e.target.reset();
  mostrarMsg(msg, 'Cliente registrado. Ahora agrega sus bienes.', true);
});

// ---------- Formulario: bien ----------
$('formBien').addEventListener('submit', (e) => {
  e.preventDefault();
  const clienteId = $('bienCliente').value;
  const tipo = $('bienTipo').value;
  const partida = $('bienPartida').value.trim();
  const desc = $('bienDesc').value.trim();
  const alertaRegistral = $('bienInscrito').checked;
  const msg = $('msgBien');

  if (!clienteId || !tipo || !partida) return;
  if (todosLosBienes().some((b) => b.clienteId === clienteId && b.partida.toLowerCase() === partida.toLowerCase())) {
    mostrarMsg(msg, 'Esa partida ya está registrada para este cliente.', false);
    return;
  }

  extra.bienes.push({ id: uid(), clienteId, tipo, partida, desc, alertaRegistral });
  guardar();
  renderTodo();
  e.target.reset();
  mostrarMsg(msg, 'Bien registrado en la ficha del cliente.', true);
});

// ---------- Formulario: alerta ----------
$('formAlerta').addEventListener('submit', (e) => {
  e.preventDefault();
  const clienteId = $('alertaCliente').value;
  const bienId = $('alertaBien').value;
  const mov = $('alertaMov').value;
  const riesgo = $('alertaRiesgo').value;
  const detalle = $('alertaDetalle').value.trim();
  const msg = $('msgAlerta');

  if (!clienteId || !bienId || !mov || !riesgo) return;
  const bien = bienPorId(bienId);
  if (!bien || bien.clienteId !== clienteId) {
    mostrarMsg(msg, 'El bien debe pertenecer al cliente seleccionado.', false);
    return;
  }

  extra.alertas.push({ id: uid(), bienId, mov, riesgo, detalle, ts: Date.now() });
  guardar();
  renderTodo();
  e.target.reset();
  $('riesgoHint').textContent = 'Se sugiere automáticamente según el movimiento.';
  mostrarMsg(msg, 'Alerta registral creada.', true);
});

// ---------- Simulación (empresa ficticia, claramente marcada) ----------
$('btnSimulacion').addEventListener('click', () => {
  if (extra.clientes.some((c) => c.demo)) {
    $('alertas').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const ahora = Date.now();
  const hace = (h) => ahora - h * 3600 * 1000;
  const cid = 'demo-cliente';

  extra.clientes.push({
    id: cid,
    demo: true,
    producto: 'factoring',
    nombre: 'EMPRESA DEMO S.A.C. (FICTICIA)',
    ruc: '20000000001',
    ubicacion: 'Ejemplo para la presentación',
    avales: ['1 aval persona natural (ficticio)'],
  });
  extra.bienes.push(
    { id: 'demo-b1', clienteId: cid, demo: true, tipo: 'predio', partida: 'Partida 00000001', desc: 'Local comercial (ejemplo)', alertaRegistral: true },
    { id: 'demo-b2', clienteId: cid, demo: true, tipo: 'vehiculo', partida: 'Placa XXX-001', desc: 'Camión (ejemplo)', alertaRegistral: true }
  );
  extra.alertas.push(
    { id: uid(), demo: true, bienId: 'demo-b1', mov: 'venta', riesgo: 'alto', detalle: 'SUNARP avisó la presentación de una compraventa a favor de un tercero.', ts: hace(3) },
    { id: uid(), demo: true, bienId: 'demo-b2', mov: 'garantia', riesgo: 'medio', detalle: 'Se solicitó inscribir una garantía mobiliaria sobre el vehículo.', ts: hace(30) },
    { id: uid(), demo: true, bienId: 'demo-b1', mov: 'anotacion', riesgo: 'bajo', detalle: 'Anotación de una solicitud de publicidad registral.', ts: hace(96) }
  );
  guardar();
  renderTodo();
  $('alertas').scrollIntoView({ behavior: 'smooth' });
});

$('btnReiniciar').addEventListener('click', () => {
  if (!confirm('Se borrarán los clientes, bienes y alertas agregados en este navegador (la cartera base se mantiene). ¿Continuar?')) return;
  extra = { clientes: [], bienes: [], alertas: [] };
  guardar();
  renderTodo();
});

// ---------- Primera carga ----------
cargar();
renderTodo();
