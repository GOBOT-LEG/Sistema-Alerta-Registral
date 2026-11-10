# 🛡️ Sistema Alerta Registral

Página web básica para un **sistema de monitoreo y alertas de movimientos registrales**
(predios y vehículos). Proyecto colaborativo entre dos integrantes.

---

## 📁 Estructura del proyecto

```
sistema-alerta-registral/
├── index.html             → Página principal (estructura y contenido)
├── styles.css             → Estilos (colores del logo de Global Factoring)
├── clientes.js            → Cartera de clientes factoring/confirming y sus bienes
├── script.js              → Lógica (panel, cartera, registro y alertas)
├── assets/logo-global.png → Logo de la empresa
└── README.md              → Este archivo
```

### Cómo agregar clientes o partidas SUNARP
Abre `clientes.js`. Cada cliente es un bloque `{ ... }`. Para registrar sus bienes,
llena la lista `bienes` del cliente (las instrucciones están al inicio del archivo).
Los bienes y alertas que se agregan desde la página se guardan solo en ese navegador;
lo que va en `clientes.js` lo ve todo el equipo.

---

## 👀 Cómo ver la página

**Opción A — En tu computadora:**
Abre `index.html` con doble clic y se abrirá en tu navegador.

**Opción B — Online gratis con GitHub Pages (recomendado):**
1. En el repositorio de GitHub: **Settings → Pages**.
2. En *Build and deployment*: Source = **Deploy from a branch**.
3. Branch = **main** y carpeta **/(root)** → botón **Save**.
4. En 1–2 minutos la web estará publicada en:
   `https://TU-USUARIO.github.io/sistema-alerta-registral/`

---

## 🤝 Cómo trabajamos en equipo (GitHub)

### Reglas de oro para no pisarnos
1. **Antes de editar**, siempre revisa la última versión del archivo en GitHub.
2. **Divide archivos**: mientras una edita `index.html`, la otra puede trabajar en
   `css/styles.css` o `js/script.js`. Así nunca chocan sus cambios.
3. **Sube tus cambios pronto** con mensajes claros, por ejemplo:
   - `Agrego sección de contacto`
   - `Cambio colores del menú`
   - `Corrijo el formulario de alertas`

### Flujo fácil (editar directo desde la web de GitHub)
1. Entra a tu repositorio en `github.com`.
2. Abre el archivo que quieres cambiar → botón **lápiz ✏️**.
3. Edita el texto/código → **Commit changes** (guarda con un mensaje descriptivo).
4. La otra integrante hace lo mismo sobre la versión actualizada.

> 💡 Cuando el proyecto crezca, se recomienda usar **ramas + pull requests**,
> pero para empezar este flujo simple es suficiente.

---

## 👥 Invitar a tu compañera como colaboradora

1. En el repositorio: **Settings → Collaborators → Add people**.
2. Escribe su usuario o correo de GitHub → **Add**.
3. Ella acepta la invitación desde su correo o desde **Notifications** en GitHub.
4. Listo: ambas pueden ver y editar el proyecto.

---

## ✏️ Qué personalizar primero

- [ ] Nombres reales del equipo en la sección **Equipo** (`index.html`, sección `#equipo`).
- [ ] Colores principales en `css/styles.css` (variables dentro de `:root`).
- [ ] Textos de la portada y servicios según el enfoque final del proyecto.
