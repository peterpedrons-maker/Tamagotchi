# Prompts de Arte — Vila (RPG top-down)

Estilo: **pixel art top-down, 16-bit**, no espírito da imagem de referência que você mandou (aquele RPG de masmorra com o herói, esqueletos, baú). Todos os prompts abaixo já têm o estilo embutido — só copiar e colar. Personagem com pose única por direção (sem animação complexa), como você pediu.

---

## Personagem (herói) — 4 direções

```
top-down 2D pixel art RPG character sprite sheet, 16-bit SNES style,
chibi-proportioned adventurer with a simple tunic and short hair, seen
from a top-down 3/4 angle, soft shading, light source from the upper
left, clean readable silhouette, no heavy black outline, transparent
background, no text or labels. 4 frames in a single horizontal row,
each frame a single static standing pose (no animation needed), same
character size/proportions/lighting in every frame.

Frame order, left to right:
1. Facing down/toward camera
2. Facing up/away from camera (back visible)
3. Facing left (side view)
4. Facing right (side view, mirrored from frame 3)
```

**Arquivo:** `public/sprites/hero.png` (4 quadros iguais lado a lado, fundo transparente).

---

## Casa

```
top-down 2D pixel art RPG building sprite, 16-bit SNES style, a small
cottage/house seen from a front-top-down angle (like a village house in
a Zelda-style RPG), wood-and-thatch or wood-and-brick walls, a sloped
roof, a door, two small windows, soft shading, light source from the
upper left, transparent background, no text or labels, no characters.
```

**Arquivo:** `public/sprites/house.png` (uma casa só — eu reaproveito ela, recolorindo levemente pra variar entre as 5 do mapa, ou você pode me mandar 2-3 variações se preferir mais variedade).

---

## Árvore

```
top-down 2D pixel art RPG tree sprite, 16-bit SNES style, seen from a
top-down angle, round leafy canopy with visible texture/shading, a
short trunk peeking out at the base, soft shading, light source from
the upper left, transparent background, no text or labels.
```

**Arquivo:** `public/sprites/tree.png`

---

## Fonte/poço da praça

```
top-down 2D pixel art RPG landmark sprite, 16-bit SNES style, a small
stone village well/fountain seen from a top-down angle, circular stone
rim, dark water visible in the center, soft shading, light source from
the upper left, transparent background, no text or labels.
```

**Arquivo:** `public/sprites/well.png`

---

## Chão — grama (textura de tile)

```
top-down 2D pixel art RPG ground texture, 16-bit SNES style, a single
seamless tileable grass tile, subtle color variation and small texture
detail (tiny blades/speckles), designed to repeat edge-to-edge with no
visible seams, soft even lighting (no strong directional shadow), no
text or labels.
```

**Arquivo:** `public/tiles/grass.png` (recomendo gerar em 128x128 ou 256x256 pra ter espaço de detalhe, eu redimensiono/ladrilho no jogo).

## Chão — caminho de terra (textura de tile)

```
top-down 2D pixel art RPG ground texture, 16-bit SNES style, a single
seamless tileable dirt/path tile, warm brown tones, subtle texture
(small pebbles/cracks), designed to repeat edge-to-edge with no visible
seams, soft even lighting (no strong directional shadow), no text or
labels.
```

**Arquivo:** `public/tiles/dirt.png`

> Nota sobre os dois tiles de chão: IA não garante 100% seamless de primeira — se ficar com emenda visível eu ainda consigo disfarçar no código (blend/borda suavizada), então não precisa ficar perfeito.

---

Me manda as imagens (inteiras ou já recortadas, tanto faz — se vierem com fundo colorido ao invés de transparente, tudo bem também, eu removo) que eu troco tudo no jogo.
