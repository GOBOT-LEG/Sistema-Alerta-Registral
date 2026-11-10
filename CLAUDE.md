# Sistema Alerta Registral · Global Factoring (área legal)

Web interna del **área legal** de Global Factoring S.A. para dar seguimiento a los bienes
(partidas SUNARP) de los clientes de **factoring** y **confirming** y de sus **avales**, vigilados
con el servicio **Alerta Registral** de SUNARP. La usan dos personas del área legal (Stephanie y
su compañera) y se le muestra a la jefatura.

- Web publicada: https://gobot-leg.github.io/Sistema-Alerta-Registral/ (GitHub Pages, rama `main`)
- Repositorio: https://github.com/GOBOT-LEG/Sistema-Alerta-Registral
- Idioma de la web y de los mensajes: **español** (Perú). Usuarias no técnicas: explica en simple.

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Estructura: menú lateral, vistas, ventanas (modales) y pantalla de ingreso |
| `script.js` | Toda la lógica: sesión, lectura/escritura en Supabase, vistas, formularios |
| `styles.css` | Estilos (colores del logo: azul `#0780c9`, navy `#0d2238`, gris `#353333`) |
| `config.js` | URL de Supabase y **llave pública** (publishable). Nada secreto |
| `assets/logo-global.png` | Logo |
| `supabase/` | **No se sube a GitHub** (`.gitignore`): scripts SQL con datos de clientes |

Es HTML/CSS/JS plano, sin build ni dependencias locales. `supabase-js` se carga por CDN
(`@supabase/supabase-js@2.45.4`).

## Vistas (navegación por `#hash`)
- `#resumen`: indicadores (clientes, partidas, pendientes de revisión, riesgo alto), últimas
  alertas, cobertura, **Títulos en trámite** y partidas recientes.
- `#clientes`: tabla de clientes (filtro factoring/confirming, solo sin partidas). Clic en una fila → ficha.
- `#cliente/<id>`: **ficha completa** del cliente: datos, avales, partidas separadas por titular
  (cliente / cada aval), **historial de movimientos** (línea de tiempo), expediente editable.
- `#partidas`: todas las partidas vigiladas, con titular y último movimiento.
- `#alertas`: todas las alertas; filtros Pendientes / Alto / Medio / Bajo.

## Datos: Supabase (no hay datos en GitHub)
Proyecto Supabase "Alerta Registral GF" (organización "Global Factoring", plan gratuito).
Todas las tablas tienen RLS: **solo usuarios autenticados** leen y escriben. El registro público
está desactivado; los usuarios se crean en Supabase → Authentication → Users.

- `clientes`: id, producto (`factoring`|`confirming`), nombre, ruc (único), partida_pj, oficina,
  ubicacion, fecha_contrato, nota, documentos (jsonb: contrato, firmado, pagare, fichaRuc,
  vigencia, copiaLiteral, reporteTrib), creado_por.
- `avales`: id, cliente_id, tipo (`natural`|`juridica`), nombre, ruc, partida_pj, oficina, nota,
  cliente_relacionado (si el aval también es cliente).
- `partidas`: id, cliente_id, **aval_id** (null = el bien es del cliente; si no, del aval),
  registro (`inmueble`|`mueble`|`vehicular`), partida, ficha, oficina, zona, fecha_registro,
  estado, alerta_registral. Único: (cliente_id, partida).
- `alertas`: id, partida_id, **mov** (`pendiente`|`venta`|`embargo`|`garantia`|`anotacion`|
  `cancelacion`|`otro`), **riesgo** (`alto`|`medio`|`bajo`, **null si mov = pendiente**), detalle,
  fecha, dia (generado, hora de Lima), prueba, numero_titulo, fecha_presentacion,
  revisado_por, revisado_en, creado_por. Único: (partida_id, mov, dia) → evita duplicados.
- `titulo_eventos`: historial del título SUNARP de una alerta: alerta_id, estado
  (`presentado`|`en_calificacion`|`observado`|`liquidado`|`apelado`|`inscrito`|`tachado`|`otro`),
  fecha, nota, creado_por.

**Regla del negocio:** las alertas que entran sin acto confirmado son `mov = 'pendiente'`,
`riesgo = null` ("PENDIENTE DE REVISIÓN"). El acto y el riesgo **los confirma el área legal**
en la ficha (recuadro "Acto pendiente de revisión"), y queda `revisado_por` / `revisado_en`.

## Automatización diaria (correo de SUNARP)
En la computadora de Stephanie hay una tarea programada de Claude ("Revisar avisos de Alerta
Registral", 8:30 a. m.) que lee los correos de `alerta@sunarp.gob.pe` y por cada aviso llama, en
la web abierta con sesión iniciada, a:

```js
await procesarAvisoSunarp({ texto, fecha })   // script.js
```

`leerAvisoSunarp(texto)` extrae partida, título (formato `AAAA-NNNNNNNN`), fecha, oficina, enlace y
estado. `procesarAvisoSunarp` ubica la partida, crea la alerta pendiente si el título es nuevo o
agrega el estado en `titulo_eventos` si ya existía, y no duplica. Devuelve `resultado`:
`nueva_alerta` | `estado_actualizado` | `duplicado` | `partida_no_vigilada` | `no_reconocido` | `error` | `sin_sesion`.

- **No crees otra tarea igual** en otra computadora.
- **No cambies el nombre ni la forma de llamar** a `procesarAvisoSunarp` sin avisar: la tarea depende de eso.

## Reglas al cambiar el proyecto
1. **Antes de editar:** `git pull`. **Al terminar:** commit con mensaje claro en español y `git push`.
   Avisa a la otra persona qué cambiaste.
2. **Nunca** subas datos de clientes a GitHub (el repo es público). No vuelvas a crear `clientes.js`
   ni pongas nombres, RUC o partidas reales en el código o en este archivo.
3. En `config.js` solo va la llave **pública**. **Nunca** la `service_role` / `secret`, ni contraseñas.
4. Si cambias la estructura de la base de datos: escribe el SQL (idempotente: `if not exists`,
   `drop constraint if exists`), pídele a la dueña del proyecto Supabase que lo ejecute en el
   SQL Editor **antes** de publicar el código que lo usa, y haz que la web siga funcionando si el
   cambio aún no se aplicó (como hace `titulosDisponibles` con `titulo_eventos`).
5. Cada vez que publiques cambios en `script.js` o `styles.css`, **sube el número de versión**
   `?v=...` de los tres enlaces en `index.html` (styles.css, config.js, script.js) para que el
   navegador no use archivos viejos.
6. Para probar localmente sirve la carpeta con cualquier servidor estático (por ejemplo
   `npx serve` o `python -m http.server`) y entra con tu usuario. La sesión es por dirección:
   en `localhost` hay que iniciar sesión aparte.
7. Antes de borrar datos o de probar escribiendo en la base de datos, recuerda que es la base
   **real y compartida**: usa datos marcados como prueba y bórralos después.

## Datos de prueba que existen hoy
- Una alerta de compraventa marcada **Prueba** en un cliente de Piura (sobre la partida de su aval).
- Una partida de prueba (estado "Prueba") con una alerta pendiente en un cliente de Lima, creada
  a partir de un aviso de ejemplo de SUNARP.
Se borran cuando el área legal lo indique.

## Pendientes conocidos
- Cargar el resto de clientes de factoring (hoy hay una muestra) desde la web.
- Correo oficial donde lleguen los avisos de SUNARP (hoy se revisa el buzón de Stephanie).
- Limpiar el historial de GitHub: commits antiguos contienen datos de clientes.
