/* ===================================
   Sistema Alerta Registral
   JavaScript básico (demo)
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

// ---------- Alertas (demo con localStorage) ----------
const STORAGE_KEY = 'alertas_registrales';
const form = document.getElementById('alertForm');
const list = document.getElementById('alertList');
const emptyMsg = document.getElementById('alertEmpty');
const countBadge = document.getElementById('alertCount');
const formMsg = document.getElementById('formMsg');

function obtenerAlertas() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function guardarAlertas(alertas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alertas));
}

// Evita inyectar HTML escribiendo texto seguro
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function crearItem(alerta) {
  const li = document.createElement('li');
  li.className = 'alert-item';
  li.innerHTML = `
    <div class="alert-info">
      <div class="alert-top">
        <strong>${escapar(alerta.titular)}</strong>
        <span class="alert-type">${escapar(alerta.tipo)}</span>
      </div>
      <span class="alert-partida">📋 ${escapar(alerta.partida)}</span>
      ${alerta.detalle ? `<span class="alert-detail">${escapar(alerta.detalle)}</span>` : ''}
      <div class="alert-bottom">
        <span class="status">⏳ Pendiente de revisión</span>
        <span class="alert-date">${alerta.fecha}</span>
      </div>
    </div>
    <button class="alert-delete" data-id="${alerta.id}" aria-label="Eliminar alerta">✕</button>
  `;
  return li;
}

function renderizar() {
  const alertas = obtenerAlertas();
  list.innerHTML = '';
  countBadge.textContent = alertas.length;
  emptyMsg.style.display = alertas.length ? 'none' : 'block';

  alertas.forEach((alerta) => {
    list.appendChild(crearItem(alerta));
  });
}

// Eliminar una alerta
list.addEventListener('click', (e) => {
  if (!e.target.classList.contains('alert-delete')) return;
  const id = e.target.dataset.id;
  guardarAlertas(obtenerAlertas().filter((a) => String(a.id) !== id));
  renderizar();
});

// Registrar una alerta nueva
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const titular = document.getElementById('titular').value.trim();
  const tipo = document.getElementById('tipo').value;
  const partida = document.getElementById('partida').value.trim();
  const detalle = document.getElementById('detalle').value.trim();

  if (!titular || !tipo || !partida) return;

  const alerta = {
    id: Date.now(),
    titular,
    tipo,
    partida,
    detalle,
    fecha: new Date().toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  const alertas = obtenerAlertas();
  alertas.unshift(alerta);
  guardarAlertas(alertas);
  renderizar();

  form.reset();
  formMsg.textContent = '✅ Alerta registrada correctamente.';
  formMsg.classList.add('ok');
  setTimeout(() => {
    formMsg.textContent = '';
    formMsg.classList.remove('ok');
  }, 3000);
});

// Primera carga
renderizar();
