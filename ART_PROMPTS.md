# Prompts de Arte das Criaturas

Cada bloco abaixo é uma grade **4 linhas (bichos) × 5 colunas (Ovo → Bebê → Criança → Adolescente → Adulto)**. Gera 1 imagem por grade, recorta as 20 células e salva conforme o nome indicado.

Arquivo final de cada célula: `public/creatures/<tipo>/<estagio>.png` (estágios: `ovo`, `bebe`, `crianca`, `adolescente`, `adulto`).

---

## Grade 1 — Comuns (Fera, Dragão, Fada, Anjo)

```
pixel art sprite sheet, 16-bit SNES RPG style, 4 rows x 5 columns grid,
thin grid lines separating cells, transparent background, front-facing
centered pose, crisp pixel edges, limited flat color palette, no gradients,
no text or labels in image. Each row is the same creature evolving left to
right through 5 life stages, growing larger and more detailed each column.

Column order (left to right): Egg (cracked shell hinting at the creature
inside) -> Baby (tiny, round, big eyes, minimal features) -> Child (short
limbs, simple face, core traits visible) -> Teen (taller, sharper features,
type traits more developed) -> Adult (full detailed final form, imposing
pose, all type traits prominent)

Row 1 "Fera": fierce beast-type, orange and red fur, wolf-and-bear
inspired, fangs and claws that grow more prominent each stage
Row 2 "Dragão": armored dragon-type, emerald green scales, thick shell,
small horns and wings that grow each stage
Row 3 "Fada": fae/pixie-type, light pink, delicate wings and antennae
that grow more ornate each stage
Row 4 "Anjo": angel-type, white and pale gold, serene face, small halo
that grows into feathered wings each stage
```

**Recorte:**
| Linha | Ovo | Bebê | Criança | Adolescente | Adulto |
|---|---|---|---|---|---|
| Fera | `fera/ovo.png` | `fera/bebe.png` | `fera/crianca.png` | `fera/adolescente.png` | `fera/adulto.png` |
| Dragão | `dragao/ovo.png` | `dragao/bebe.png` | `dragao/crianca.png` | `dragao/adolescente.png` | `dragao/adulto.png` |
| Fada | `fada/ovo.png` | `fada/bebe.png` | `fada/crianca.png` | `fada/adolescente.png` | `fada/adulto.png` |
| Anjo | `anjo/ovo.png` | `anjo/bebe.png` | `anjo/crianca.png` | `anjo/adolescente.png` | `anjo/adulto.png` |

---

## Grade 2 — Raros (Primitivo, Fantasma, Demônio, Celestial)

```
pixel art sprite sheet, 16-bit SNES RPG style, 4 rows x 5 columns grid,
thin grid lines separating cells, transparent background, front-facing
centered pose, crisp pixel edges, limited flat color palette, no gradients,
no text or labels in image. Each row is the same creature evolving left to
right through 5 life stages, growing larger and more detailed each column.

Column order (left to right): Egg (cracked shell hinting at the creature
inside) -> Baby (tiny, round, big eyes, minimal features) -> Child (short
limbs, simple face, core traits visible) -> Teen (taller, sharper features,
type traits more developed) -> Adult (full detailed final form, imposing
pose, all type traits prominent)

Row 1 "Primitivo": ancient primal beast-type, tan and brown thick hide,
small tusks and stone-like markings that grow each stage
Row 2 "Fantasma": ghostly spirit-type, pale translucent blue, wispy
trailing tail instead of legs, glowing eyes that grow eerier each stage
Row 3 "Demônio": swift dark imp-type, deep purple, small horns and a
pointed tail that grow sharper each stage
Row 4 "Celestial": cosmic guardian-type, gold with faint starry patterns,
a small orbiting shard/ring that grows more elaborate each stage
```

**Recorte:**
| Linha | Ovo | Bebê | Criança | Adolescente | Adulto |
|---|---|---|---|---|---|
| Primitivo | `primitivo/ovo.png` | `primitivo/bebe.png` | `primitivo/crianca.png` | `primitivo/adolescente.png` | `primitivo/adulto.png` |
| Fantasma | `fantasma/ovo.png` | `fantasma/bebe.png` | `fantasma/crianca.png` | `fantasma/adolescente.png` | `fantasma/adulto.png` |
| Demônio | `demonio/ovo.png` | `demonio/bebe.png` | `demonio/crianca.png` | `demonio/adolescente.png` | `demonio/adulto.png` |
| Celestial | `celestial/ovo.png` | `celestial/bebe.png` | `celestial/crianca.png` | `celestial/adolescente.png` | `celestial/adulto.png` |

---

Me manda as imagens (inteiras, já recortadas ou não — eu recorto se precisar) e eu encaixo tudo no jogo.
