# RUN NINJA — NINJA RUSH V3

**Jogo de corrida infinita com ninja, ciclo dia/noite, chuva e poças escorregadias.**

## Jogar no navegador

Abra [index.html](index.html) no Chrome ou Edge (ou veja a versão publicada quando o GitHub Pages estiver habilitado).
A versão de navegador está versionada em arquivos separados:

- [web/index.html](web/index.html) — tela do jogo
- [web/assets/css/game.css](web/assets/css/game.css) — interface
- [web/assets/js/game.js](web/assets/js/game.js) — jogabilidade, animações e clima

## Mecânicas

- Corrida infinita com três faixas, salto, deslize e modo Foco.
- Ninja articulado por código, sem recortes de imagem.
- Clima muda durante a partida, de noite para dia e chuva.
- Chuva reduz velocidade e resposta do personagem; poças provocam derrapagens.
- No modo treino, pressione **T** para avançar o clima.

## Controles

**PC:** A/D ou ←/→ (faixas), W/↑/espaço (pular), S/↓ (deslizar), E (Foco), P (pausa).
**Celular:** gestos para mudar de faixa, pular e deslizar; botões inferiores de direção ocultados.

## Unity 6 e assets organizados

O pacote integral de backup **RUN_NINJA_V3_COMPLETO_ORGANIZADO.zip** foi preparado para download na conversa do ChatGPT. Inclui projeto Unity 6, cenas, scripts divididos em Core/Player/World/Weather/Rendering/UI, shaders, artes conceituais, imagens de referência e documentação.

**Atenção:** somente a versão web e sua programação estão publicadas neste repositório neste momento. O projeto Unity e os assets binários permanecem no ZIP entregue separadamente. A versão web não é uma build Unity WebGL; o projeto Unity ainda não foi compilado no Editor.

## Publicação GitHub Pages

Em **Settings → Pages**, escolha `Deploy from a branch`, `main` e `/(root)` para expor o `index.html`.
