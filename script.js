/* ===================================
   GLOBAL FACTORING — Sistema Alerta Registral
   Lógica del sistema (datos en localStorage)
==================================== */

// ---------- Menú móvil ----------
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');

menuBtn.addEventListener('click', () => {
  nav.classList.toggle('open');
});

// Cierra el menú al pulsar un enlace
document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

// ---------- Año dinámico ----------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Referencias y constantes ----------
const STORAGE_KEY = 'gf_alerta_registral_v1';

const $ = (id) => document.getElementById(id);

// Riesgo sugerido según el tipo de movimiento registral
const RIESGO_POR_MOVIMIENTO = {
  venta: 'alto',        // El bien puede salir del patrimonio del cliente
  embargo: 'medio',     // Afectación judicial, aún recuperable
  garantia: 'medio',    // Nueva carga sobre el bien
  anotacion: 'bajo',    // Informativa, sin afectación directa
  cancelacion: 'bajo',  // Se levanta una carga (noticia positiva)
};

// Etiquetas de riesgo para mostrar en pantalla
const RIESGO_ETIQUETA = {
  alto: { icono: '🔴', texto: 'Riesgo alto' },
  medio: { icono: '🟠', texto: 'Riesgo medio' },
  bajo: { icono: '🟢', texto: 'Riesgo bajo' },
};

// Tipos de bien con su ícono
const TIPOS_BIEN = {
  predio: { nombre: 'Predio', icono: '🏢' },
  vehiculo: { nombre: 'Vehículo', icono: '🚗' },
  maquinaria: { nombre: 'Maquinaria', icono: '⚙️' },
};

// ---------- Estado (datos guardados en el navegador) ----------
let clientes = [];
let bienes = [];
let alertas = [];

const uid = () =>
  Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);

function fechaAhora() {
  return new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function guardar() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ clientes, bienes, alertas })
  );
}

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (datos) {
      clientes = datos.clientes || [];
      bienes = datos.bienes || [];
      alertas = datos.alertas || [];
    } else {
      cargarDatosDeEjemplo();
    }
  } catch {
    cargarDatosDeEjemplo();
  }
}

// Datos de ejemplo para ver el sistema funcionando desde el primer día
function cargarDatosDeEjemplo() {
  const ahora = Date.now();
  const hace = (horas) => ahora - horas * 3600 * 1000;

  clientes = [
    { id: 'c1', nombre: 'Comercial Andina S.A.C.', doc: 'RUC 20512345678' },
    { id: 'c2', nombre: 'Transportes del Sur E.I.R.L.', doc: 'RUC 20698765432' },
  ];

  bienes = [
    { id: 'b1', clienteId: 'c1', tipo: 'predio', partida: 'Partida 11223344', desc: 'Local comercial – Av. Larco 123, Miraflores' },
    { id: 'b2', clienteId: 'c1', tipo: 'vehiculo', partida: 'Placa V3K-789', desc: 'Camión volquete 2020' },
    { id: 'b3', clienteId: 'c2', tipo: 'vehiculo', partida: 'Placa C8P-145', desc: 'Tracto remolcador 2019' },
    { id: 'b4', clienteId: 'c2', tipo: 'maquinaria', partida: 'Partida 55667788', desc: 'Excavadora Caterpillar 320' },
  ];

  alertas = [
    { id: uid(), bienId: 'b1', mov: 'Venta o transferencia de propiedad', riesgo: 'alto', detalle: 'Se inscribió una transferencia de propiedad a favor de un tercero.', ts: hace(2), fecha: '' },
    { id: uid(), bienId: 'b3', mov: 'Embargo judicial', riesgo: 'medio', detalle: 'Embargo de forma levantado por el Juzgado Civil.', ts: hace(24), fecha: '' },
    { id: uid(), bienId: 'b2', mov: 'Hipoteca o constitución de garantía', riesgo: 'medio', detalle: '', ts: hace(72), fecha: '' },
    { id: uid(), bienId: 'b4', mov: 'Anotación o aviso informativo', riesgo: 'bajo', detalle: 'Aviso sobre diligencia preliminar en trámite.', ts: hace(120), fecha: '' },
    { id: uid(), bienId: 'b1', mov: 'Cancelación de carga o gravamen', riesgo: 'bajo', detalle: 'Se canceló la hipoteca del crédito anterior.', ts: hace(192), fecha: '' },
  ];

  // Se genera la fecha legible de cada alerta de ejemplo
  alertas.forEach((a) => {
    a.fecha = new Date(a.ts).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  guardar();
}

// ---------- Utilidades ----------
// Evita inyectar HTML escribiendo texto seguro
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function clientePorId(id) {
  return clientes.find((c) => c.id === id);
}

function bienPorId(id) {
  return bienes.find((b) => b.id === id);
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

// ---------- Panel de control ----------
function renderPanel() {
  $('statClientes').textContent = clientes.length;
  $('statBienes').textContent = bienes.length;
  $('statAlertas').textContent = alertas.length;
  $('statAlto').textContent = alertas.filter((a) => a.riesgo === 'alto').length;
  $('statMedio').textContent = alertas.filter((a) => a.riesgo === 'medio').length;
  $('statBajo').textContent = alertas.filter((a) => a.riesgo === 'bajo').length;
}

// ---------- Clientes (lista compacta del paso 1) ----------
function renderClientes() {
  const cont = $('listaClientes');

  if (!clientes.length) {
    cont.innerHTML = '<span class="mini-vacio">Aún no hay clientes registrados.</span>';
    return;
  }

  cont.innerHTML = clientes
    .map(
      (c) => `
      <div class="mini-item">
        <div class="mini-info">
          <strong>${escapar(c.nombre)}</strong>
          <span class="mini-sub">${escapar(c.doc)}</span>
        </div>
        <button class="mini-x" data-rol="cliente" data-id="${c.id}" aria-label="Eliminar cliente">✕</button>
      </div>`
    )
    .join('');
}

// ---------- Bienes (lista compacta del paso 2) ----------
function renderBienes() {
  const cont = $('listaBienes');

  if (!bienes.length) {
    cont.innerHTML = '<span class="mini-vacio">Aún no hay bienes registrados.</span>';
    return;
  }

  cont.innerHTML = bienes
    .map((b) => {
      const tipo = TIPOS_BIEN[b.tipo] || { nombre: 'Bien', icono: '📦' };
      const cliente = clientePorId(b.clienteId);
      return `
      <div class="mini-item">
        <div class="mini-info">
          <strong>${tipo.icono} ${escapar(b.partida)}</strong>
          <span class="mini-sub">${escapar(tipo.nombre)} · ${escapar(cliente ? cliente.nombre : 'Sin cliente')}</span>
        </div>
        <button class="mini-x" data-rol="bien" data-id="${b.id}" aria-label="Eliminar bien">✕</button>
      </div>`;
    })
    .join('');
}

// ---------- Selects dependientes (cliente → bien) ----------
function llenarSelectClientes() {
  const selects = [$('bienCliente'), $('alertaCliente')];

  selects.forEach((sel) => {
    const previo = sel.value;
    sel.innerHTML = '<option value="">Selecciona un cliente…</option>';
    clientes.forEach((c) => {
      const op = document.createElement('option');
      op.value = c.id;
      op.textContent = c.nombre;
      sel.appendChild(op);
    });
    // Conserva la selección si el cliente sigue existiendo
    if (clientes.some((c) => c.id === previo)) sel.value = previo;
  });

  llenarSelectBienes();
}

function llenarSelectBienes() {
  const sel = $('alertaBien');
  const clienteId = $('alertaCliente').value;
  const delCliente = bienes.filter((b) => b.clienteId === clienteId);

  sel.innerHTML = '<option value="">Selecciona un bien…</option>';
  delCliente.forEach((b) => {
    const tipo = TIPOS_BIEN[b.tipo] || { nombre: 'Bien', icono: '📦' };
    const op = document.createElement('option');
    op.value = b.id;
    op.textContent = `${tipo.icono} ${b.partida}`;
    sel.appendChild(op);
  });
}

 $('alertaCliente').addEventListener('change', llenarSelectBienes);

// ---------- Sugerencia automática de riesgo ----------
 $('alertaMov').addEventListener('change', () => {
  const mov = $('alertaMov').value;
  const sugerido = RIESGO_POR_MOVIMIENTO[mov];
  const hint = $('riesgoHint');

  if (sugerido) {
    $('alertaRiesgo').value = sugerido;
    const et = RIESGO_ETIQUETA[sugerido];
    hint.textContent = `Sugerencia aplicada: ${et.icono} ${et.texto.toLowerCase()}. Puedes ajustarla si lo deseas.`;
  } else {
    hint.textContent = 'Define el nivel de riesgo manualmente.';
  }
});

// ---------- Alertas (lista principal) ----------
function renderAlertas() {
  const list = $('listaAlertas');
  const vacia = $('alertaVacia');

  list.innerHTML = '';
  vacia.style.display = alertas.length ? 'none' : 'block';

  // Ordena del movimiento más reciente al más antiguo
  const ordenadas = [...alertas].sort((a, b) => (b.ts || 0) - (a.ts || 0));

  ordenadas.forEach((a) => {
    const bien = bienPorId(a.bienId);
    const cliente = bien ? clientePorId(bien.clienteId) : null;
    const tipo = bien ? TIPOS_BIEN[bien.tipo] || { nombre: 'Bien', icono: '📦' } : null;
    const et = RIESGO_ETIQUETA[a.riesgo] || RIESGO_ETIQUETA.medio;

    const li = document.createElement('li');
    li.className = `alert-item risk-${a.riesgo || 'medio'}`;
    li.innerHTML = `
      <div class="alert-info">
        <div class="alert-top">
          <span class="risk-badge ${a.riesgo}">${et.icono} ${et.texto}</span>
          <span class="alert-date">🕒 ${escapar(a.fecha)}</span>
        </div>
        <span class="alert-cliente"><strong>${escapar(cliente ? cliente.nombre : 'Cliente eliminado')}</strong>
          <span class="alert-doc">${escapar(cliente ? cliente.doc : '')}</span>
        </span>
        <span class="alert-partida">
          ${bien ? `${tipo.icono} ${escapar(tipo.nombre)} · ${escapar(bien.partida)}` : 'Bien eliminado'}
        </span>
        <span class="alert-mov">📄 ${escapar(a.mov)}</span>
        ${a.detalle ? `<span class="alert-detail">💬 ${escapar(a.detalle)}</span>` : ''}
      </div>
      <button class="alert-delete" data-id="${a.id}" aria-label="Eliminar alerta">✕</button>
    `;
    list.appendChild(li);
  });
}

function renderTodo() {
  renderPanel();
  renderClientes();
  renderBienes();
  llenarSelectClientes();
  renderAlertas();
}

// ---------- Eliminar (listas compactas y alertas) ----------
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.mini-x, .alert-delete');
  if (!btn) return;

  // ---- Eliminar una alerta ----
  if (btn.classList.contains('alert-delete')) {
    const id = btn.dataset.id;
    if (!confirm('¿Eliminar esta alerta registral?')) return;
    alertas = alertas.filter((a) => a.id !== id);
    guardar();
    renderTodo();
    return;
  }

  // ---- Eliminar un cliente (y sus bienes y alertas) ----
  if (btn.dataset.rol === 'cliente') {
    const id = btn.dataset.id;
    const cliente = clientePorId(id);
    if (!cliente) return;

    const susBienes = bienes.filter((b) => b.clienteId === id);
    const susAlertas = alertas.filter((a) =>
      susBienes.some((b) => b.id === a.bienId)
    );

    let texto = `¿Eliminar al cliente "${cliente.nombre}"?`;
    if (susBienes.length || susAlertas.length) {
      texto += `\nTambién se eliminarán ${susBienes.length} bien(es) y ${susAlertas.length} alerta(s) asociados.`;
    }
    if (!confirm(texto)) return;

    const idsBienes = susBienes.map((b) => b.id);
    bienes = bienes.filter((b) => b.clienteId !== id);
    alertas = alertas.filter((a) => !idsBienes.includes(a.bienId));
    clientes = clientes.filter((c) => c.id !== id);
    guardar();
    renderTodo();
    return;
  }

  // ---- Eliminar un bien (y sus alertas) ----
  if (btn.dataset.rol === 'bien') {
    const id = btn.dataset.id;
    const bien = bienPorId(id);
    if (!bien) return;

    const susAlertas = alertas.filter((a) => a.bienId === id);
    let texto = `¿Eliminar el bien "${bien.partida}"?`;
    if (susAlertas.length) {
      texto += `\nTambién se eliminarán ${susAlertas.length} alerta(s) asociadas.`;
    }
    if (!confirm(texto)) return;

    alertas = alertas.filter((a) => a.bienId !== id);
    bienes = bienes.filter((b) => b.id !== id);
    guardar();
    renderTodo();
  }
});

// ---------- Formulario: cliente ----------
 $('formCliente').addEventListener('submit', (e) => {
  e.preventDefault();

  const nombre = $('cliNombre').value.trim();
  const doc = $('cliDoc').value.trim();
  const msg = $('msgCliente');

  if (!nombre || !doc) return;

  // Evita duplicar clientes con el mismo RUC/DNI
  if (clientes.some((c) => c.doc.toLowerCase() === doc.toLowerCase())) {
    mostrarMsg(msg, '⚠️ Ya existe un cliente con ese RUC/DNI.', false);
    return;
  }

  clientes.push({ id: uid(), nombre, doc });
  guardar();
  renderTodo();
  e.target.reset();
  mostrarMsg(msg, '✅ Cliente registrado correctamente.', true);
});

// ---------- Formulario: bien ----------
 $('formBien').addEventListener('submit', (e) => {
  e.preventDefault();

  const clienteId = $('bienCliente').value;
  const tipo = $('bienTipo').value;
  const partida = $('bienPartida').value.trim();
  const desc = $('bienDesc').value.trim();
  const msg = $('msgBien');

  if (!clienteId || !tipo || !partida) return;

  // Evita registrar dos veces la misma partida para el mismo cliente
  const duplicado = bienes.some(
    (b) =>
      b.clienteId === clienteId &&
      b.partida.toLowerCase() === partida.toLowerCase()
  );
  if (duplicado) {
    mostrarMsg(msg, '⚠️ Esa partida ya está registrada para este cliente.', false);
    return;
  }

  bienes.push({ id: uid(), clienteId, tipo, partida, desc });
  guardar();
  renderTodo();
  e.target.reset();
  mostrarMsg(msg, '✅ Bien registrado correctamente.', true);
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

  // Verifica que el bien pertenezca al cliente seleccionado
  const bien = bienPorId(bienId);
  if (!bien || bien.clienteId !== clienteId) {
    mostrarMsg(msg, '⚠️ El bien debe pertenecer al cliente seleccionado.', false);
    return;
  }

  alertas.push({
    id: uid(),
    bienId,
    mov,
    riesgo,
    detalle,
    ts: Date.now(),
    fecha: fechaAhora(),
  });
  guardar();
  renderTodo();
  e.target.reset();
  $('riesgoHint').textContent = 'Se sugiere automáticamente según el movimiento.';
  mostrarMsg(msg, '✅ Alerta registral creada correctamente.', true);
});

// ---------- Botones de la sección de alertas ----------
 $('btnBorrar').addEventListener('click', () => {
  if (!clientes.length && !bienes.length && !alertas.length) {
    alert('No hay datos que borrar.');
    return;
  }
  if (
    confirm(
      'Se eliminarán TODOS los clientes, bienes y alertas guardados en este navegador. ¿Deseas continuar?'
    )
  ) {
    clientes = [];
    bienes = [];
    alertas = [];
    guardar();
    renderTodo();
  }
});

 $('btnEjemplo').addEventListener('click', () => {
  if (!clientes.length && !bienes.length && !alertas.length) {
    cargarDatosDeEjemplo();
    renderTodo();
    return;
  }
  if (
    confirm(
      'Se reemplazarán los datos actuales por los datos de ejemplo. ¿Deseas continuar?'
    )
  ) {
    cargarDatosDeEjemplo();
    renderTodo();
  }
});

// ---------- Primera carga ----------
cargar();
renderTodo();
