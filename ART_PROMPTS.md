# Prompts de Arte das Criaturas

Espaço pra organizar os prompts de IA conforme forem sendo gerados. Cada linha das tabelas abaixo vira um arquivo PNG que entra no jogo.

## Estilo visual

- **Pixel art 16-bit**, estilo SNES (referências: Chrono Trigger, Secret of Mana, Pokémon Gold/Silver overworld) — contornos limpos, poucas cores por sprite, nada de gradientes suaves/realistas.
- **Fundo transparente** (PNG).
- Gere em resolução alta (512×512 ou 1024×1024) mesmo sendo pixel art — o jogo redimensiona pra baixo. Prefira formas simples e bem definidas a detalhes minúsculos que se perdem ao reduzir.
- Enquadramento: criatura centralizada, ocupando a maior parte do quadro, vista de frente ou 3/4 (estilo "retrato de menu de status" de RPG, não sprite de mapa).

### Template de prompt (ponto de partida, ajuste à vontade)

```
pixel art creature, 16-bit SNES RPG style, [descrição da criatura/pose],
[paleta de cores], clean outlines, centered, transparent background,
front-facing portrait, no gradients, crisp pixel edges
```

### Paleta sugerida por tipo (placeholder atual do jogo — pode manter ou trocar)

| Tipo | Cor base |
|---|---|
| Fera | laranja/vermelho `#EF6B4A` |
| Dragão | verde esmeralda `#2F9E6B` |
| Fada | rosa claro `#F19BD8` |
| Anjo | branco/dourado claro `#F5EECB` |
| Primitivo | marrom `#A9793F` |
| Fantasma | azul pálido `#9FD6E8` |
| Demônio | roxo escuro `#8B3FA8` |
| Celestial | dourado `#F3C94D` |

## Convenção de arquivos

```
public/creatures/<tipo>/<estagio>.png
```

Estágios: `ovo`, `bebe`, `crianca`, `adolescente`, `adulto`.
O Ovo é compartilhado por todos os tipos (mistério até nascer) — só 1 arquivo, não varia.

## Checklist

### Ovo (compartilhado, 1 arquivo só)
- [ ] `ovo.png`
  Prompt:

---

### Fera — comum · foco Ataque
- [ ] `fera/bebe.png` — Prompt:
- [ ] `fera/crianca.png` — Prompt:
- [ ] `fera/adolescente.png` — Prompt:
- [ ] `fera/adulto.png` — Prompt:

### Dragão — comum · foco Defesa
- [ ] `dragao/bebe.png` — Prompt:
- [ ] `dragao/crianca.png` — Prompt:
- [ ] `dragao/adolescente.png` — Prompt:
- [ ] `dragao/adulto.png` — Prompt:

### Fada — comum · foco Velocidade
- [ ] `fada/bebe.png` — Prompt:
- [ ] `fada/crianca.png` — Prompt:
- [ ] `fada/adolescente.png` — Prompt:
- [ ] `fada/adulto.png` — Prompt:

### Anjo — comum · foco Inteligência
- [ ] `anjo/bebe.png` — Prompt:
- [ ] `anjo/crianca.png` — Prompt:
- [ ] `anjo/adolescente.png` — Prompt:
- [ ] `anjo/adulto.png` — Prompt:

---

### Primitivo — raro · foco Ataque + Defesa
- [ ] `primitivo/bebe.png` — Prompt:
- [ ] `primitivo/crianca.png` — Prompt:
- [ ] `primitivo/adolescente.png` — Prompt:
- [ ] `primitivo/adulto.png` — Prompt:

### Fantasma — raro · foco Defesa + Velocidade
- [ ] `fantasma/bebe.png` — Prompt:
- [ ] `fantasma/crianca.png` — Prompt:
- [ ] `fantasma/adolescente.png` — Prompt:
- [ ] `fantasma/adulto.png` — Prompt:

### Demônio — raro · foco Velocidade + Ataque
- [ ] `demonio/bebe.png` — Prompt:
- [ ] `demonio/crianca.png` — Prompt:
- [ ] `demonio/adolescente.png` — Prompt:
- [ ] `demonio/adulto.png` — Prompt:

### Celestial — raro · foco Inteligência + Defesa
- [ ] `celestial/bebe.png` — Prompt:
- [ ] `celestial/crianca.png` — Prompt:
- [ ] `celestial/adolescente.png` — Prompt:
- [ ] `celestial/adulto.png` — Prompt:

## Como entregar

Pode colar as imagens em qualquer lugar (anexar aqui na conversa, subir numa pasta, etc.) — só marca o checkbox e cola o prompt usado em cada linha pra eu saber qual arquivo é qual e manter o histórico do que já foi gerado.
