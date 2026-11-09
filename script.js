/* ===================================
   GLOBAL FACTORING — Sistema Alerta Registral
   Estilos
==================================== */

:root {
  --primary: #16324f;
  --primary-soft: #1f4e79;
  --accent: #e63946;
  --accent-dark: #c22833;
  --bg: #f6f8fb;
  --card: #ffffff;
  --text: #22303e;
  --muted: #5b6b7c;
  --border: #e3e9f0;
  --radius: 14px;
  --shadow: 0 8px 24px rgba(22, 50, 79, 0.08);

  /* Semáforo de riesgo registral */
  --riesgo-alto: #e63946;
  --riesgo-alto-bg: #fdecee;
  --riesgo-medio: #f59e0b;
  --riesgo-medio-bg: #fef4e6;
  --riesgo-bajo: #16a34a;
  --riesgo-bajo-bg: #e9f9ef;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
  color: var(--text);
  background: var(--bg);
  line-height: 1.6;
}

.container { width: min(1100px, 92%); margin: 0 auto; }

/* ---------- Encabezado ---------- */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--primary);
  font-size: 1.1rem;
}
.logo-icon { font-size: 1.6rem; }
.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.logo-text strong { color: var(--accent); }
.logo-sub {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 2.2px;
  text-transform: uppercase;
  color: var(--primary-soft);
}

.nav { display: flex; gap: 22px; }
.nav a {
  text-decoration: none;
  color: var(--muted);
  font-weight: 600;
  font-size: 0.95rem;
  transition: color 0.2s;
}
.nav a:hover { color: var(--accent); }

.menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  color: var(--primary);
}

/* ---------- Portada ---------- */
.hero {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-soft) 60%, #2d6da3 100%);
  color: #fff;
  padding: 90px 0 70px;
  text-align: center;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.hero h1 {
  font-size: clamp(1.9rem, 4vw, 3rem);
  line-height: 1.2;
  max-width: 780px;
  margin: 0 auto 18px;
}
.hero .highlight { color: #ffd166; }

.hero-sub {
  max-width: 660px;
  margin: 0 auto 30px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 1.05rem;
}

.hero-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 46px;
}

.btn {
  display: inline-block;
  padding: 13px 28px;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  font-size: 0.98rem;
  cursor: pointer;
  border: none;
  transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
  font-family: inherit;
}
.btn:hover { transform: translateY(-2px); }
.btn-primary {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 6px 18px rgba(230, 57, 70, 0.35);
}
.btn-primary:hover { background: var(--accent-dark); }
.btn-outline {
  background: transparent;
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.6);
}
.btn-outline:hover { background: rgba(255, 255, 255, 0.1); }
.btn-block { width: 100%; }
.btn-sm { padding: 9px 18px; font-size: 0.88rem; }

.btn-neutral {
  background: #fff;
  color: var(--primary-soft);
  border: 1.5px solid var(--border);
}
.btn-neutral:hover { border-color: var(--primary-soft); }

.btn-danger {
  background: #fff;
  color: var(--riesgo-alto);
  border: 1.5px solid var(--riesgo-alto);
}
.btn-danger:hover {
  background: var(--riesgo-alto);
  color: #fff;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 46px;
  flex-wrap: wrap;
}
.stat { display: flex; flex-direction: column; }
.stat strong { font-size: 1.5rem; color: #ffd166; }
.stat span { font-size: 0.85rem; color: rgba(255, 255, 255, 0.75); }

/* ---------- Secciones ---------- */
.section { padding: 70px 0; }
.section-alt { background: #eef2f7; }

.section-title {
  text-align: center;
  font-size: 1.9rem;
  color: var(--primary);
  margin-bottom: 8px;
}
.section-sub {
  text-align: center;
  color: var(--muted);
  max-width: 620px;
  margin: 0 auto 44px;
}

.grid { display: grid; gap: 22px; }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-2 { grid-template-columns: repeat(2, 1fr); }

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 26px;
  box-shadow: var(--shadow);
  transition: transform 0.2s;
}
.card:hover { transform: translateY(-4px); }
.card.paso:hover { transform: none; }

.card h3 {
  color: var(--primary);
  margin: 12px 0 8px;
  font-size: 1.1rem;
}
.card p { color: var(--muted); font-size: 0.94rem; }

.card-icon { font-size: 2rem; }

/* ---------- Panel de control ---------- */
.panel-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.panel-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px 12px;
  text-align: center;
}
.panel-card strong {
  display: block;
  font-size: 2rem;
  line-height: 1.2;
  color: var(--primary);
}
.panel-card span { font-size: 0.8rem; color: var(--muted); }
.panel-icon { display: block; font-size: 1.3rem; margin-bottom: 6px; }

.panel-card.risk-alto { border-top: 4px solid var(--riesgo-alto); }
.panel-card.risk-alto strong { color: var(--riesgo-alto); }
.panel-card.risk-medio { border-top: 4px solid var(--riesgo-medio); }
.panel-card.risk-medio strong { color: #b45309; }
.panel-card.risk-bajo { border-top: 4px solid var(--riesgo-bajo); }
.panel-card.risk-bajo strong { color: var(--riesgo-bajo); }

.panel-note {
  text-align: center;
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 20px;
}

/* ---------- Registro en 3 pasos ---------- */
.paso-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.paso-head .step-num {
  margin: 0;
  width: 38px;
  height: 38px;
  font-size: 1rem;
  flex-shrink: 0;
}
.paso-head h3 { margin: 0; font-size: 1.05rem; }

.hint {
  font-size: 0.76rem;
  color: var(--muted);
  line-height: 1.4;
}

.mini-list {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mini-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--muted);
}
#listaClientes,
#listaBienes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 170px;
  overflow-y: auto;
}
.mini-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 7px 10px 7px 12px;
}
.mini-info { flex: 1; min-width: 0; }
.mini-info strong {
  display: block;
  color: var(--primary);
  font-size: 0.84rem;
  line-height: 1.3;
}
.mini-sub {
  display: block;
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.3;
}
.mini-vacio {
  color: var(--muted);
  font-size: 0.8rem;
  font-style: italic;
}
.mini-x {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 0.95rem;
  padding: 4px 6px;
  flex-shrink: 0;
  transition: color 0.2s;
}
.mini-x:hover { color: var(--accent); }

/* ---------- Formularios ---------- */
.field { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.field label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--primary);
}
.field input,
.field select,
.field textarea {
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  background: #fbfcfe;
  transition: border 0.2s;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--primary-soft);
  background: #fff;
}

.form-msg {
  min-height: 22px;
  font-size: 0.9rem;
  color: var(--accent);
  text-align: center;
  font-weight: 600;
}
.form-msg.ok { color: #1a9e5c; }

/* ---------- Lista de alertas ---------- */
.toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.alert-empty {
  color: var(--muted);
  font-size: 0.95rem;
  background: #fff7e0;
  border: 1px dashed #e8c96a;
  padding: 18px;
  border-radius: 12px;
}

.alert-list { list-style: none; display: flex; flex-direction: column; gap: 14px; }

.alert-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-left: 5px solid var(--border);
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: var(--shadow);
}
.alert-item.risk-alto { border-left-color: var(--riesgo-alto); }
.alert-item.risk-medio { border-left-color: var(--riesgo-medio); }
.alert-item.risk-bajo { border-left-color: var(--riesgo-bajo); }

.alert-info { flex: 1; min-width: 0; }

.alert-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.risk-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 999px;
}
.risk-badge.alto { background: var(--riesgo-alto-bg); color: var(--riesgo-alto); }
.risk-badge.medio { background: var(--riesgo-medio-bg); color: #b45309; }
.risk-badge.bajo { background: var(--riesgo-bajo-bg); color: var(--riesgo-bajo); }

.alert-date { font-size: 0.78rem; color: var(--muted); }

.alert-cliente {
  color: var(--primary);
  font-size: 1rem;
}
.alert-doc {
  font-size: 0.78rem;
  color: var(--muted);
  font-weight: 600;
  margin-left: 6px;
}
.alert-partida {
  display: block;
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 4px;
}
.alert-mov {
  display: block;
  font-size: 0.9rem;
  color: var(--text);
  font-weight: 600;
  margin-top: 6px;
}
.alert-detail {
  display: block;
  font-size: 0.88rem;
  color: var(--muted);
  margin-top: 6px;
}

.alert-delete {
  background: none;
  border: 1px solid var(--border);
  color: var(--muted);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  flex-shrink: 0;
  transition: all 0.2s;
}
.alert-delete:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* ---------- Pasos (cómo funciona) ---------- */
.step {
  text-align: center;
  padding: 30px 22px;
  background: var(--card);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.step-num {
  width: 46px;
  height: 46px;
  margin: 0 auto 14px;
  display: grid;
  place-items: center;
  background: var(--primary);
  color: #fff;
  font-weight: 800;
  font-size: 1.2rem;
  border-radius: 50%;
}
.step h3 { color: var(--primary); margin-bottom: 8px; font-size: 1.08rem; }
.step p { color: var(--muted); font-size: 0.94rem; }

/* ---------- Pie de página ---------- */
.footer {
  background: var(--primary);
  color: rgba(255, 255, 255, 0.85);
  padding: 40px 0;
  text-align: center;
}
.footer-inner p { margin: 4px 0; font-size: 0.92rem; }
.footer strong { color: #fff; }
.footer-note {
  max-width: 560px;
  margin: 10px auto 0 !important;
  font-size: 0.8rem !important;
  color: rgba(255, 255, 255, 0.6);
}
.copy {
  margin-top: 14px !important;
  font-size: 0.82rem !important;
  color: rgba(255, 255, 255, 0.6);
}

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
  .panel-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 640px) {
  .menu-btn { display: block; }

  .nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fff;
    flex-direction: column;
    gap: 0;
    border-bottom: 1px solid var(--border);
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }
  .nav.open { max-height: 320px; }
  .nav a { padding: 14px 6%; border-top: 1px solid var(--border); }

  .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
  .panel-grid { grid-template-columns: repeat(2, 1fr); }
  .hero { padding: 60px 0 50px; }
  .hero-stats { gap: 26px; }
  .section { padding: 54px 0; }
  .toolbar { justify-content: stretch; }
  .toolbar .btn { flex: 1; }
}
