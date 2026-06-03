# CODEX_BRIEF.md — HeroIndex v2 / Ciudad Sin Crimen

## 1. Contexto del proyecto

HeroIndex v2 es una aplicación web diegética para un oneshot/campaña de superhéroes ambientada en el mundo de Ciudad Sin Crimen.

La app debe sentirse como una plataforma pública dentro del universo: una mezcla entre red social, ranking corporativo, noticiero, app de reputación heroica y propaganda empresarial.

Inspiraciones de tono:
- The Boys
- Dispatch
- My Hero Academia, especialmente el sistema de rankings heroicos

La prioridad actual es que los jugadores puedan abrir la app durante la sesión, especialmente desde celular, y sentir que sus héroes existen dentro del mundo.

Flujo ideal del jugador:

Jugador abre HeroIndex → ve noticias del mundo → ve ranking → encuentra su héroe → entiende si subió/bajó → siente que está dentro del ecosistema heroico.

## 2. Objetivo principal de la v2 usable

HeroIndex debe funcionar primero como experiencia pública para jugadores.

Prioridades:

1. Experiencia inmersiva del jugador.
2. Uso rápido en celular durante la partida.
3. Ranking y noticias como centro dramático.
4. Perfiles públicos de héroes como identidad del jugador.
5. ORÁCULO funcional, pero visualmente secundario y oculto para jugadores.

La app pública NO debe sentirse como un CMS ni como un panel administrativo.

## 3. Stack técnico

El proyecto usa:

- React
- Vite
- Firebase
- Vercel
- GitHub

Rama relevante:

- heroindex-v2-react

No cambiar sin instrucción explícita:

- Firebase config
- Auth
- Modelos de datos
- Estructura base del proyecto
- Variables de entorno existentes

## 4. Regla ORÁCULO

ORÁCULO es la capa GM/admin dentro del universo HeroIndex.

Los controles internos solo deben aparecer si:

```js
import.meta.env.VITE_ORACULO_MODE === "true"
