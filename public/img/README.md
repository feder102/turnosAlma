# Imágenes de la landing

El logo (`public/brand/`), la foto del hero y los reels (`public/media/`) ya
están: se rescataron de la rama `feat/landing-shadcn-branding`, que tenía el
contenido visual real pero nunca se fusionó a `main`.

Todavía faltan las fotos de zona por tratamiento (círculos de 56px en la
sección "¿Qué zonas tratamos?") y una foto de la fachada para "¿Dónde
estamos?". Mientras no existan, esas cards muestran el emoji sobre degradado
en vez de imagen rota. Apenas el archivo exista en esta carpeta con el nombre
de la tabla, se activa solo — en `src/app/page.tsx` cada entrada ya tiene el
campo `image` listo.

| Archivo            | Dónde se usa                | Medida sugerida | Recorte  |
| ------------------ | ---------------------------- | ---------------- | -------- |
| `sede.jpg`          | Sección "¿Dónde estamos?"    | 1200×900          | 4:3      |
| `zona-piernas.jpg`  | Card "Piernas completas"     | 256×256           | Cuadrado |
| `zona-cavado.jpg`   | Card "Cavado, axilas..."     | 256×256           | Cuadrado |
| `zona-rostro.jpg`   | Card "Rostro y bozo"         | 256×256           | Cuadrado |
| `zona-hombre.jpg`   | Card "Depilación masculina"  | 256×256           | Cuadrado |

Recomendaciones:

- Exportar en JPG con calidad ~80 (o WebP); Next las optimiza en build pero
  conviene no subir originales de varios MB.
- Las fotos de zona se ven en un círculo de 56px: elegí planos cerrados que
  se lean bien en chico.
- Evitá fotos con texto quemado encima en las de zona — a diferencia del
  hero (`soprano-vs-cera.jpg`), esas cards ya ponen su propio título.
