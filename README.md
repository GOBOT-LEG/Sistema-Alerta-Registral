# 🛡️ Sistema Alerta Registral · Global Factoring

Web del **área legal** para dar seguimiento a las partidas SUNARP de los clientes de
factoring y confirming y de sus avales, vigiladas con **Alerta Registral**.

👉 **Web:** https://gobot-leg.github.io/Sistema-Alerta-Registral/

---

## Para usar la web (registrar y revisar datos)
1. Entra al link y ingresa con tu correo y contraseña.
   Los usuarios se crean en Supabase → **Authentication → Users → Add user**
   (marcar *Auto Confirm User*). No hay registro público.
2. Todo lo que registras (clientes, avales, partidas, alertas, títulos, expediente) se guarda en
   la base de datos y lo ve todo el equipo al instante.
3. Las alertas que llegan del correo de SUNARP entran como **PENDIENTE DE REVISIÓN**: en la ficha
   del cliente confirma el **acto** y el **riesgo** (recuadro amarillo).
4. Para el estado de un título usa **Síguelo ↗** y luego **Actualizar estado**.

No hace falta Claude ni Git para usar la web.

---

## Para cambiar la web (diseño o funciones) con Claude
1. Pídele a tu Claude: *"Descarga https://github.com/GOBOT-LEG/Sistema-Alerta-Registral en mis
   Documentos y trabajemos ahí"*.
2. Claude lee `CLAUDE.md`, que explica cómo está hecha la web y las reglas del proyecto.
3. **Antes de empezar:** "trae los últimos cambios de GitHub".
   **Al terminar:** "sube mis cambios a GitHub".
4. Eviten editar el mismo archivo al mismo tiempo, y avísense qué cambió cada una.

Los cambios publicados se ven en la web en 1–2 minutos.

---

## 📁 Estructura
```
index.html             → Estructura de la página
styles.css             → Estilos (colores del logo)
script.js              → Lógica (sesión, base de datos, vistas, formularios, avisos SUNARP)
config.js              → Conexión a Supabase (solo llave pública)
assets/logo-global.png → Logo
CLAUDE.md              → Guía técnica para Claude
```

## 🔒 Datos y seguridad
- Los datos están en **Supabase**, no en GitHub (este repositorio es público).
- Solo usuarios con sesión pueden leer o escribir.
- Nunca subir datos de clientes, contraseñas ni la llave `service_role`.
