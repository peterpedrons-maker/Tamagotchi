# Prompts de Arte — Runner

Estilo escolhido: **ilustração plana pintada**, tipo Alto's Adventure / Canyon
Runners — silhuetas limpas, sombreamento em gradiente suave, luz de contorno
quente, sem contorno preto grosso, sem pixel art dessa vez (o runner pede uma
sensação mais "atmosférica/cinematográfica" que combina com o efeito de
profundidade da pista). Todos os prompts abaixo já têm esse estilo embutido —
é só copiar e colar.

Personagem escolhido: um **espírito-raposa explorador**, deslizando de costas
num trenó/prancha brilhante, atravessando mundos diferentes. Funciona em
qualquer cenário sem precisar redesenhar o bicho a cada bioma.

---

## Personagem — sprite sheet (5 poses)

```
flat painted illustration game character sprite sheet, back view only
(character seen from behind, sliding away from the camera, never facing
forward), small fox-spirit explorer riding a glowing wooden sled, flat
painted illustration style like Alto's Adventure or Canyon Runners, soft
gradient shading, warm rim light along the edges, bold clean silhouette,
no black outlines, transparent background, 5 frames arranged in a single
horizontal row, consistent character size/proportions/lighting across all
5 frames, no text or labels in image.

Frame order, left to right:
1. Riding straight, neutral pose, scarf trailing behind in the wind
2. Riding straight, alternate pose with a slight bounce (for a subtle
   idle/running loop when alternated with frame 1)
3. Leaning left, body and sled banked hard to the left as if steering
   into the left lane
4. Leaning right, body and sled banked hard to the right as if steering
   into the right lane
5. Wipeout: character mid-tumble off the sled, arms flailing, sled
   flipping away
```

**Arquivo:** `public/sprites/rider.png` (5 quadros iguais lado a lado, fundo
transparente — me manda inteiro que eu recorto e encaixo cada pose no jogo).

---

## Moeda / coletável (universal, usada em qualquer bioma)

```
flat painted illustration game icon, a single glowing golden coin/gem
seen at a slight angle, soft gradient shading, warm rim light, bold clean
silhouette, no black outline, transparent background, no text or labels.
```

**Arquivo:** `public/sprites/coin.png`

---

## Biomas (cenário de fundo + obstáculo + decoração)

Cada prompt abaixo gera o "kit" de um bioma: o pano de fundo (céu/horizonte)
e os elementos que ficam na pista (obstáculo) e nas laterais (decoração).
Troca de bioma acontece a cada ~450m no jogo.

### 1. Floresta Mística

```
flat painted illustration game background, tall misty pine forest at dusk,
layered silhouette hills, soft gradient sky from deep indigo to warm
amber near the horizon, a few fireflies as small glowing dots, style like
Alto's Adventure, no characters, no text or labels, wide landscape
composition.
```
```
flat painted illustration game prop, a fallen mossy log obstacle blocking
a path, seen from a low angle as if rushing toward it, same soft painted
style, warm rim light, transparent background, no text.
```
```
flat painted illustration game prop, a tall pine tree silhouette with
warm rim light on one edge, side decoration for a forest trail, same
painted style, transparent background, no text.
```

**Arquivos:** `public/backgrounds/floresta.png`, `public/props/floresta-obstaculo.png`, `public/props/floresta-decor.png`

### 2. Caverna de Cristal

```
flat painted illustration game background, deep underground crystal
cavern, glowing violet and cyan crystal formations jutting from cave
walls, soft gradient ambient light from the crystals, layered silhouette
rock arches, style like Alto's Adventure, no characters, no text or
labels, wide landscape composition.
```
```
flat painted illustration game prop, a jagged glowing crystal spike
obstacle blocking a path, seen from a low angle as if rushing toward it,
same soft painted style, warm-cool rim light, transparent background,
no text.
```
```
flat painted illustration game prop, a cluster of small glowing violet
crystals, side decoration for a cave trail, same painted style,
transparent background, no text.
```

**Arquivos:** `public/backgrounds/caverna.png`, `public/props/caverna-obstaculo.png`, `public/props/caverna-decor.png`

### 3. Deserto Dourado

```
flat painted illustration game background, golden sand dunes at sunset,
layered silhouette dunes fading into a warm orange-to-pink gradient sky,
a distant sun low on the horizon, style like Alto's Adventure, no
characters, no text or labels, wide landscape composition.
```
```
flat painted illustration game prop, a sun-bleached rock/boulder
obstacle blocking a path, seen from a low angle as if rushing toward it,
same soft painted style, warm rim light, transparent background, no
text.
```
```
flat painted illustration game prop, a tall desert cactus silhouette
with warm rim light on one edge, side decoration for a desert trail,
same painted style, transparent background, no text.
```

**Arquivos:** `public/backgrounds/deserto.png`, `public/props/deserto-obstaculo.png`, `public/props/deserto-decor.png`

### 4. Geleira Polar

```
flat painted illustration game background, icy polar glacier field under
a pale blue-and-white gradient sky, layered silhouette ice ridges, soft
aurora glow near the horizon, style like Alto's Adventure, no characters,
no text or labels, wide landscape composition.
```
```
flat painted illustration game prop, a jagged ice-block obstacle
blocking a path, seen from a low angle as if rushing toward it, same
soft painted style, cool rim light, transparent background, no text.
```
```
flat painted illustration game prop, a tall icicle/ice-spire silhouette
with cool rim light on one edge, side decoration for a glacier trail,
same painted style, transparent background, no text.
```

**Arquivos:** `public/backgrounds/geleira.png`, `public/props/geleira-obstaculo.png`, `public/props/geleira-decor.png`

---

Me manda as imagens (inteiras ou já recortadas, tanto faz) e eu encaixo tudo
no jogo, trocando as formas geométricas que estão lá agora pelas artes de
verdade.
