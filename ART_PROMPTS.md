# Prompts de Arte

## ⏸ Criaturas — pausado

Vamos esperar a mecânica de humor/expressão (feliz, triste, doente, etc.) estar pronta no código antes de gerar essas artes — assim não precisa redesenhar tudo depois. Os prompts abaixo continuam aqui prontos pra quando chegar a hora.

---

# 🖼 Interface do jogo — pode fazer já

3 prompts separados (ícones, cenário do quarto, moldura dos painéis). Nada de criatura aqui, só o "casco" do jogo.

## Ícones

```
pixel art icon set, 16-bit SNES RPG UI style, 32x32 px each, consistent
stroke weight and style across all icons, cyan-and-gold accent colors on
a transparent background, simple bold silhouettes readable at small
size, no text or labels in image, arranged in a clean grid, 4 columns.

Icons needed, in this order:
1. house (home) 2. heart 3. dumbbell 4. game controller
5. sword 6. backpack 7. open book 8. gear/cog
9. apple 10. bed 11. broom 12. wrapped gift
13. medicine pill 14. padlock 15. shield 16. wind swirl
17. brain 18. coin 19. expand/fullscreen arrows 20. (blank/spare)
```

**Recorte:** salva cada ícone como `public/icons/game/<nome>.png` — nomes na ordem: `home, heart, dumbbell, gamepad, sword, backpack, book, gear, apple, bed, broom, gift, pill, lock, shield, wind, brain, coin, expand`.

## Cenário do quarto

```
pixel art background scene, 16-bit SNES RPG style, highly detailed, cozy
pet's bedroom interior, wide landscape composition, warm wood tones,
window with a small hill and sky view, a bed, a bookshelf, a round rug
on the floor, soft ambient lighting, no characters or creatures in the
scene, empty floor space in the center-bottom reserved for a pet sprite
to stand on, no text or labels in image.
```

**Arquivo:** `public/backgrounds/room.png`

## Moldura dos painéis (janelas estilo RPG)

```
pixel art UI panel/dialogue box frame, 16-bit SNES RPG style (like
Chrono Trigger or Final Fantasy VI menu windows), dark navy blue fill,
thin cyan-glow pixel border, slightly rounded corners, subtle inner
shadow, transparent background outside the frame, single representative
panel large enough to see corner and edge detail clearly, no text inside.
```

**Arquivo:** `public/ui/panel-frame.png`

---

# 🐣 Criaturas (grades prontas para quando formos gerar)

Cada bloco é uma grade **2 linhas (bichos) × 5 colunas (Ovo → Bebê → Criança → Adolescente → Adulto)**. Menos bicho por imagem = mais detalhe em cada um.

Arquivo final de cada célula: `public/creatures/<tipo>/<estagio>.png` (estágios: `ovo`, `bebe`, `crianca`, `adolescente`, `adulto`).

---

## Grade 1 — Fera + Dragão

```
pixel art sprite sheet, 16-bit SNES RPG style, highly detailed, rich shading
and texture, 2 rows x 5 columns grid, thin grid lines separating cells,
transparent background, front-facing centered pose, crisp pixel edges, no
flat single-tone colors — blend 3-4 complementary tones per creature for a
natural, varied palette, no text or labels in image. Each row is the same
creature evolving left to right through 5 life stages, growing larger, more
detailed and more elaborate each column.

Column order (left to right): Egg (cracked shell hinting at the creature
inside) -> Baby (tiny, round, big eyes, minimal features) -> Child (short
limbs, simple face, core traits visible) -> Teen (taller, sharper features,
type traits more developed) -> Adult (full detailed final form, imposing
pose, all type traits prominent, intricate details)

Row 1 "Fera": feral beast-type, fangs and claws grow more prominent each
stage. Mixed warm palette — rust orange, warm brown, cream underbelly,
charcoal-dark stripes and claws. Wolf-and-bear inspired silhouette.
Row 2 "Dragão": armored dragon-type, thick shell and small horns that grow
into wings by adulthood. Mixed cool-to-warm palette — deep teal-green
scales, bronze underbelly, cream horns, mossy shadow tones.
```

**Recorte:**
| Linha | Ovo | Bebê | Criança | Adolescente | Adulto |
|---|---|---|---|---|---|
| Fera | `fera/ovo.png` | `fera/bebe.png` | `fera/crianca.png` | `fera/adolescente.png` | `fera/adulto.png` |
| Dragão | `dragao/ovo.png` | `dragao/bebe.png` | `dragao/crianca.png` | `dragao/adolescente.png` | `dragao/adulto.png` |

---

## Grade 2 — Fada + Anjo

```
pixel art sprite sheet, 16-bit SNES RPG style, highly detailed, rich shading
and texture, 2 rows x 5 columns grid, thin grid lines separating cells,
transparent background, front-facing centered pose, crisp pixel edges, no
flat single-tone colors — blend 3-4 complementary tones per creature for a
natural, varied palette, no text or labels in image. Each row is the same
creature evolving left to right through 5 life stages, growing larger, more
detailed and more elaborate each column.

Column order (left to right): Egg (cracked shell hinting at the creature
inside) -> Baby (tiny, round, big eyes, minimal features) -> Child (short
limbs, simple face, core traits visible) -> Teen (taller, sharper features,
type traits more developed) -> Adult (full detailed final form, imposing
pose, all type traits prominent, intricate details)

Row 1 "Fada": fae/pixie-type, delicate wings and antennae grow more ornate
each stage. Mixed soft palette — blush pink, pale lavender, mint-green
wing accents, faint gold freckle details.
Row 2 "Anjo": angel-type, serene expression, small halo grows into
feathered wings by adulthood. Mixed light palette — ivory, pale gold,
soft blue-grey wing tips, faint rose highlights.
```

**Recorte:**
| Linha | Ovo | Bebê | Criança | Adolescente | Adulto |
|---|---|---|---|---|---|
| Fada | `fada/ovo.png` | `fada/bebe.png` | `fada/crianca.png` | `fada/adolescente.png` | `fada/adulto.png` |
| Anjo | `anjo/ovo.png` | `anjo/bebe.png` | `anjo/crianca.png` | `anjo/adolescente.png` | `anjo/adulto.png` |

---

## Grade 3 — Primitivo + Fantasma

```
pixel art sprite sheet, 16-bit SNES RPG style, highly detailed, rich shading
and texture, 2 rows x 5 columns grid, thin grid lines separating cells,
transparent background, front-facing centered pose, crisp pixel edges, no
flat single-tone colors — blend 3-4 complementary tones per creature for a
natural, varied palette, no text or labels in image. Each row is the same
creature evolving left to right through 5 life stages, growing larger, more
detailed and more elaborate each column.

Column order (left to right): Egg (cracked shell hinting at the creature
inside) -> Baby (tiny, round, big eyes, minimal features) -> Child (short
limbs, simple face, core traits visible) -> Teen (taller, sharper features,
type traits more developed) -> Adult (full detailed final form, imposing
pose, all type traits prominent, intricate details)

Row 1 "Primitivo": ancient primal beast-type, small tusks and stone-like
markings grow each stage. Mixed earthy palette — warm clay tan, mossy
green lichen patches, bone-white tusks, dark umber markings.
Row 2 "Fantasma": ghostly spirit-type, wispy trailing tail instead of
legs, glowing eyes grow eerier each stage. Mixed cool palette — icy pale
blue, soft lavender wisps, silver highlights, deep indigo shadow trail.
```

**Recorte:**
| Linha | Ovo | Bebê | Criança | Adolescente | Adulto |
|---|---|---|---|---|---|
| Primitivo | `primitivo/ovo.png` | `primitivo/bebe.png` | `primitivo/crianca.png` | `primitivo/adolescente.png` | `primitivo/adulto.png` |
| Fantasma | `fantasma/ovo.png` | `fantasma/bebe.png` | `fantasma/crianca.png` | `fantasma/adolescente.png` | `fantasma/adulto.png` |

---

## Grade 4 — Demônio + Celestial

```
pixel art sprite sheet, 16-bit SNES RPG style, highly detailed, rich shading
and texture, 2 rows x 5 columns grid, thin grid lines separating cells,
transparent background, front-facing centered pose, crisp pixel edges, no
flat single-tone colors — blend 3-4 complementary tones per creature for a
natural, varied palette, no text or labels in image. Each row is the same
creature evolving left to right through 5 life stages, growing larger, more
detailed and more elaborate each column.

Column order (left to right): Egg (cracked shell hinting at the creature
inside) -> Baby (tiny, round, big eyes, minimal features) -> Child (short
limbs, simple face, core traits visible) -> Teen (taller, sharper features,
type traits more developed) -> Adult (full detailed final form, imposing
pose, all type traits prominent, intricate details)

Row 1 "Demônio": swift dark imp-type, small horns and pointed tail grow
sharper each stage. Mixed dark palette — deep violet, magenta undertones,
charcoal black, warm ember-orange eye-glow accent.
Row 2 "Celestial": cosmic guardian-type, a small orbiting shard/ring grows
more elaborate each stage. Mixed regal palette — warm gold, deep navy
star patterns, pale cream, soft turquoise accent.
```

**Recorte:**
| Linha | Ovo | Bebê | Criança | Adolescente | Adulto |
|---|---|---|---|---|---|
| Demônio | `demonio/ovo.png` | `demonio/bebe.png` | `demonio/crianca.png` | `demonio/adolescente.png` | `demonio/adulto.png` |
| Celestial | `celestial/ovo.png` | `celestial/bebe.png` | `celestial/crianca.png` | `celestial/adolescente.png` | `celestial/adulto.png` |

---

Me manda as imagens (inteiras, já recortadas ou não — eu recorto se precisar) e eu encaixo tudo no jogo.
