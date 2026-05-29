# Guía de Deploy — HeroIndex en Vercel
## Desde cero, sin conocimientos previos

---

## PASO 1 — Crear cuenta GitHub

GitHub es donde vas a guardar el código. Es gratuito.

1. Ve a **https://github.com**
2. Haz clic en **"Sign up"**
3. Ingresa tu email, crea una contraseña, elige un nombre de usuario
4. Verifica tu email cuando llegue el mensaje
5. En los pasos de configuración inicial, elige el plan **Free**

---

## PASO 2 — Subir la app a GitHub

### Opción A — Sin instalar nada (recomendada para empezar)

1. Una vez dentro de GitHub, haz clic en el botón verde **"New"** (arriba a la izquierda)
2. En **"Repository name"** escribe: `heroindex`
3. Deja todo lo demás como está
4. Haz clic en **"Create repository"**
5. En la página que aparece, haz clic en **"uploading an existing file"**
6. Arrastra los archivos de la carpeta `heroindex3` al área de carga:
   - `index.html`
   - carpeta `css/` con `style.css`
   - carpeta `js/` con `app.js` y `data.js`

   > ⚠️ GitHub no acepta carpetas vacías. Sube los archivos uno por uno si es necesario.

7. En la parte de abajo, escribe un mensaje como `"Primera versión"` y haz clic en **"Commit changes"**

### Opción B — Con GitHub Desktop (más cómodo a largo plazo)

1. Descarga **GitHub Desktop** desde https://desktop.github.com
2. Instala y conecta tu cuenta
3. Crea un nuevo repositorio apuntando a la carpeta `heroindex3`
4. Haz clic en **"Publish repository"**

---

## PASO 3 — Crear cuenta Vercel

Vercel es quien va a poner la app en internet. También es gratuito.

1. Ve a **https://vercel.com**
2. Haz clic en **"Sign Up"**
3. Elige **"Continue with GitHub"** — esto los conecta automáticamente
4. Autoriza a Vercel cuando GitHub lo pida

---

## PASO 4 — Hacer el deploy

1. Una vez dentro de Vercel, haz clic en **"Add New Project"**
2. Vercel va a mostrar tus repositorios de GitHub
3. Busca `heroindex` y haz clic en **"Import"**
4. En la pantalla de configuración:
   - **Framework Preset**: selecciona **"Other"**
   - **Root Directory**: déjalo como está (`./`)
   - **Build Command**: déjalo vacío
   - **Output Directory**: déjalo vacío
5. Haz clic en **"Deploy"**
6. Espera 30-60 segundos mientras Vercel procesa

---

## PASO 5 — Tu app está en internet

Vercel te va a dar una URL como:

```
https://heroindex-tu-usuario.vercel.app
```

Esa es tu app. La puedes abrir en cualquier dispositivo.

---

## ACTUALIZAR LA APP EN EL FUTURO

Cada vez que quieras actualizar la app (nueva versión con más funciones), solo tienes que:

1. Reemplazar los archivos en GitHub (subir los nuevos)
2. Vercel detecta el cambio **automáticamente** y hace un nuevo deploy en segundos

No tienes que hacer nada más en Vercel.

---

## COMPARTIR CON JUGADORES

La URL de Vercel la puedes compartir con todos los jugadores.

- En desktop van a ver la interfaz con sidebar
- En móvil van a ver la interfaz con bottom nav

Para que los jugadores no vean los datos GM (Risk Index, flags ORÁCULO):
- Comparte la URL normalmente
- Los jugadores simplemente no activan el **Modo GM** (toggle en el sidebar / ícono de campana en móvil)

---

## PREGUNTAS FRECUENTES

**¿Los datos se pierden si recargo?**
No. Los datos se guardan en `localStorage` del navegador. Pero son locales a cada dispositivo. Para compartir el estado entre sesiones, usa **Exportar JSON** en el panel GM y pásale el archivo a quien lo necesite.

**¿Puedo usar un dominio propio como heroindex.cl?**
Sí, Vercel lo permite en el plan gratuito. En el dashboard de tu proyecto ve a **Settings → Domains** y sigue las instrucciones.

**¿Es seguro dejar la app pública?**
La app no tiene servidor ni base de datos. Todo corre en el navegador. No hay información sensible expuesta.

---

## RESUMEN EN 5 PASOS

1. Crear cuenta en github.com ✓
2. Crear repositorio y subir archivos ✓
3. Crear cuenta en vercel.com con GitHub ✓
4. Importar el repositorio en Vercel ✓
5. Copiar la URL y compartir ✓

---

## FIREBASE — CONTENIDO COMPARTIDO Y CMS GM

HeroIndex ahora puede leer contenido compartido desde **Firebase Realtime Database** y subir imágenes a **Firebase Storage**. Esto permite que el GM publique noticias, anuncios y comentarios falsos sin editar código, y que todos los jugadores vean los mismos cambios.

### 1. Activar Realtime Database

1. Entra a https://console.firebase.google.com
2. Abre el proyecto usado por HeroIndex.
3. Ve a **Build → Realtime Database**.
4. Crea la base de datos si aún no existe.
5. Usa la región recomendada por Firebase.
6. Para pruebas puedes iniciar en modo test, pero revisa la advertencia de seguridad más abajo.

HeroIndex usa estas rutas:

```txt
news/{newsId}
ads/{adId}
comments/{newsId}/{commentId}
heroes
config/gmPasswordHash
```

### 2. Activar Firebase Storage

1. En Firebase Console, ve a **Build → Storage**.
2. Haz clic en **Get started** / **Comenzar**.
3. Elige una ubicación de Storage.
4. Confirma la creación del bucket.

Las imágenes subidas desde el Content Manager se guardan en carpetas como:

```txt
news/{timestamp-fileName}
ads/{timestamp-fileName}
```

La URL pública descargable se guarda luego en Realtime Database como `imageUrl`.

### 3. Estructura de noticias

Cada noticia se guarda en:

```txt
news/{newsId}
```

Campos esperados:

```txt
title
source
category
imageUrl
publicVersion
corporateVersion
oracleVersion
views
likes
shares
commentsCount
tags
published
createdAt
```

Notas:

- `publicVersion` aparece para público y jugadores.
- `corporateVersion` puede usarse como copy corporativo cuando corresponda.
- `oracleVersion` solo debe mostrarse cuando la sesión GM está activa.
- `published: false` oculta la noticia del feed público.

### 4. Estructura de anuncios

Cada anuncio se guarda en:

```txt
ads/{adId}
```

Campos esperados:

```txt
brand
headline
body
imageUrl
placement
active
createdAt
```

Notas:

- `placement: home` aparece en los espacios publicitarios del Home.
- `active: false` oculta el anuncio.
- Si no hay anuncios activos, HeroIndex usa los anuncios fallback definidos en el código.

### 5. Estructura de comentarios falsos

Cada comentario se guarda en:

```txt
comments/{newsId}/{commentId}
```

Campos esperados:

```txt
authorType: anonymous | npcHero | corporation
authorName
authorHeroSlug
body
likes
createdAt
```

Los comentarios se muestran como preview bajo los posts del Media Feed.

### 6. Uso del Content Manager

1. Entra como GM.
2. Abre **Panel GM**.
3. Busca la sección **Content Manager — Firebase**.
4. Desde ahí puedes:
   - crear noticias/media posts,
   - subir imágenes de noticias,
   - crear anuncios,
   - subir imágenes de anuncios,
   - agregar comentarios falsos a una noticia publicada.
5. Al publicar, los datos se guardan en Firebase y los jugadores los ven al recargar o cuando la app detecta cambios.

### 7. Advertencia de seguridad importante

La UI actual usa el modo GM existente como bloqueo visual y narrativo. Esto sirve para la mesa y para prototipar, pero **no es autenticación segura de producción**.

Antes de publicar una campaña con datos sensibles reales debes configurar:

- **Firebase Authentication** para identificar usuarios/GM reales.
- **Realtime Database Rules** para limitar escritura de `news`, `ads` y `comments` solo a GM autenticados.
- **Storage Rules** para limitar subida de imágenes solo a GM autenticados.
- Reglas de lectura separadas si vas a guardar contenido verdaderamente secreto.

No guardes secretos reales en `oracleVersion`, `flags`, identidades o comentarios si las reglas de Firebase permiten lectura pública.
