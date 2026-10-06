# Prompts de arte (IA) — Dungeon Pinball

Jogo atual (procedural, sem arte real ainda): calabouço de pedra com
tochas, baú e ossos; os "inimigos" são esferas com carinha de slime; o
lançador é um canhão de pedra/ferro desenhado via código.

Use estes prompts em qualquer gerador de imagem (Midjourney, DALL-E,
Stable Diffusion, etc.) e me manda os PNGs prontos (fundo transparente
sempre que possível) que eu integro no jogo.

Estilo-base para TODOS os prompts (cole isso em todos, ajustando só a
parte específica):
> 2D game asset, flat vector / painted fantasy dungeon style, bold
> clean outlines, moody torch-lit cave color palette (mossy greens,
> warm amber highlights, deep shadows), centered, transparent
> background, no text, no watermark, single object.

---

## 1. Inimigos (substituem as esferas com carinha)

Precisamos de 3 "classes de peso" (mesma lista usada no código:
hp 5 = pequeno, hp 8 = médio, hp 16 = chefe). Cada classe pode ter
2-3 variações visuais para não repetir sempre o mesmo bicho.

**Pequeno (hp 5) — "Cogumelo Rastejante" / "Morcego de Caverna":**
> A small cute-but-creepy cave mushroom creature with tiny stubby legs
> and a glowing spore cap, idle pose facing forward, [base style
> above]. Circular silhouette so it reads well as a round token.

> Alt: a tiny cave bat with glowing eyes, wings folded, round
> huddled pose, [base style above].

**Médio (hp 8) — "Sapo Venenoso" / "Rato Blindado":**
> A chunky poisonous cave toad with warty green-purple skin and a
> wide grinning mouth, sitting pose, round silhouette, [base style
> above].

> Alt: an armored cave rat wearing a crude bone/metal shoulder plate,
> round hunched pose, [base style above].

**Chefe (hp 16, maior) — "Guardião de Pedra" / "Dragão-Verme":**
> A large stone golem guardian with glowing crystal eyes and moss
> growing on its shoulders, imposing round-ish silhouette, [base
> style above].

> Alt: a coiled cave wyrm (worm-dragon) with small frilled fins and
> glowing veins, round coiled-up pose so it fits a circular token,
> [base style above].

(Se puder gerar cada um como círculo bem definido, ajuda muito — o
jogo coloca uma barra de vida em cima e troca a cor conforme leva
dano, então o desenho não precisa ter expressão de "machucado"
diferente por estágio, eu cuido disso via tint/overlay no código.)

## 2. Canhão / lançador

> A stubby stone-and-iron dungeon cannon mounted on a round swivel
> base, barrel pointing straight up, carved with simple rune
> engravings, [base style above]. Side view, barrel vertical,
> centered.

## 3. Bola

> A small glowing magic orb/marble, cyan-blue energy core with a
> soft outer glow, simple and clean, [base style above]. Perfect
> circle silhouette.

## 4. (Opcional) Fundo do calabouço

> A seamless tileable dungeon stone wall texture, mossy stone
> blocks, subtle cracks and mortar lines, dark cave palette, no
> characters, flat lighting, top-down game background tile.

---

### Como mandar pra mim

Pode mandar os PNGs direto aqui no chat (um por mensagem ou todos
juntos), me diz qual é qual (ex: "slime pequeno 1", "sapo médio",
"golem chefe", "canhão", "bola"). Eu ajusto escala/rotação no código
e troco as texturas proceduais pelos seus desenhos.
