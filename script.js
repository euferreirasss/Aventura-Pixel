
const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const GRAVIDADE = 0.65;

const painelMoedas = document.getElementById("moedas");
const painelVidas = document.getElementById("vidas");
const painelNivel = document.getElementById("nivel");
const mensagem = document.getElementById("mensagem");

const teclas = {};

let moedas = 0;
let vidas = 3;
let nivel = 1;
let cameraX = 0;
let estado = "jogar";
let invulneravel = 0;
let tempo = 0;

let plataformas = [];
let moedasJogo = [];
let inimigos = [];
let particulas = [];
let objetivoX = 0;

const jogador = {
  x: 70,
  y: 300,
  w: 30,
  h: 42,
  vx: 0,
  vy: 0,
  velocidade: 4.5,
  forcaSalto: -13,
  noChao: false,
  direcao: 1
};

function criarNivel() {
  plataformas = [];
  moedasJogo = [];
  inimigos = [];
  particulas = [];
  cameraX = 0;

  jogador.x = 70;
  jogador.y = 300;
  jogador.vx = 0;
  jogador.vy = 0;

  const larguraNivel = 2600 + (nivel - 1) * 500;
  objetivoX = larguraNivel - 100;

  // Criar chão e buracos.
  let x = 0;

  while (x < larguraNivel) {
    const comprimento = 180 + Math.random() * 240;
    const buraco = x > 350 && Math.random() < 0.18;

    if (!buraco) {
      plataformas.push({
        x,
        y: 465,
        w: Math.min(comprimento, larguraNivel - x),
        h: 100,
        tipo: "chao"
      });
    }

    x += comprimento;

    if (buraco) {
      x += 65 + Math.random() * 35;
    }
  }

  // Plataformas suspensas.
  for (let i = 0; i < 19 + nivel * 2; i++) {
    const px = 230 + i * 125 + Math.random() * 70;
    const py = 280 + Math.random() * 100;

    plataformas.push({
      x: px,
      y: py,
      w: 75 + Math.random() * 45,
      h: 22,
      tipo: Math.random() < 0.35 ? "bloco" : "plataforma"
    });

    if (i % 2 === 0) {
      moedasJogo.push({
        x: px + 30,
        y: py - 40,
        r: 10,
        apanhada: false
      });
    }
  }

  // Moedas pelo percurso.
  for (let i = 0; i < larguraNivel / 90; i++) {
    if (Math.random() < 0.7) {
      moedasJogo.push({
        x: 150 + i * 90,
        y: 390 - Math.random() * 90,
        r: 10,
        apanhada: false
      });
    }
  }

  // Inimigos.
  for (let i = 0; i < 10 + nivel * 2; i++) {
    inimigos.push({
      x: 350 + i * 210,
      y: 425,
      w: 32,
      h: 35,
      vx: Math.random() < 0.5 ? 1.1 : -1.1,
      inicio: 300 + i * 210,
      fim: 480 + i * 210,
      vivo: true
    });
  }

  estado = "jogar";
  atualizarPainel();
  mensagem.textContent = "Encontra a bandeira no fim do nível!";
}

function atualizarPainel() {
  painelMoedas.textContent = moedas;
  painelVidas.textContent = vidas;
  painelNivel.textContent = nivel;
}

function colidem(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function saltar() {
  if (estado === "jogar" && jogador.noChao) {
    jogador.vy = jogador.forcaSalto;
    jogador.noChao = false;
  }
}

function criarParticulas(x, y, cor, quantidade = 8) {
  for (let i = 0; i < quantidade; i++) {
    particulas.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 5,
      vida: 35,
      cor
    });
  }
}

function perderVida() {
  if (invulneravel > 0 || estado !== "jogar") return;

  vidas--;
  invulneravel = 100;
  atualizarPainel();

  if (vidas <= 0) {
    estado = "fim";
    mensagem.textContent = "Fim do jogo! Carrega em Reiniciar.";
    return;
  }

  jogador.x = Math.max(50, jogador.x - 100);
  jogador.y = 250;
  jogador.vx = 0;
  jogador.vy = 0;

  mensagem.textContent = "Cuidado! Perdeste uma vida.";
}

function atualizar() {
  if (estado !== "jogar") return;

  tempo++;

  let direcao = 0;

  if (teclas.ArrowLeft || teclas.KeyA) direcao--;
  if (teclas.ArrowRight || teclas.KeyD) direcao++;

  jogador.vx = direcao * jogador.velocidade;

  if (direcao !== 0) jogador.direcao = direcao;

  // Movimento horizontal.
  jogador.x += jogador.vx;

  for (const p of plataformas) {
    if (!colidem(jogador, p)) continue;

    if (jogador.vx > 0) jogador.x = p.x - jogador.w;
    if (jogador.vx < 0) jogador.x = p.x + p.w;
  }

  // Gravidade e movimento vertical.
  const yAnterior = jogador.y;

  jogador.vy += GRAVIDADE;
  jogador.y += jogador.vy;
  jogador.noChao = false;

  for (const p of plataformas) {
    if (!colidem(jogador, p)) continue;

    if (jogador.vy >= 0 && yAnterior + jogador.h <= p.y + 8) {
      jogador.y = p.y - jogador.h;
      jogador.vy = 0;
      jogador.noChao = true;
    } else if (jogador.vy < 0 && yAnterior >= p.y + p.h - 5) {
      jogador.y = p.y + p.h;
      jogador.vy = 0;
    }
  }

  // Apanhar moedas.
  for (const moeda of moedasJogo) {
    if (moeda.apanhada) continue;

    const caixa = {
      x: moeda.x - moeda.r,
      y: moeda.y - moeda.r,
      w: moeda.r * 2,
      h: moeda.r * 2
    };

    if (colidem(jogador, caixa)) {
      moeda.apanhada = true;
      moedas++;
      criarParticulas(moeda.x, moeda.y, "#ffdf43", 6);
      atualizarPainel();
    }
  }

  // Inimigos e colisões.
  if (invulneravel > 0) invulneravel--;

  for (const inimigo of inimigos) {
    if (!inimigo.vivo) continue;

    inimigo.x += inimigo.vx;

    if (inimigo.x < inimigo.inicio || inimigo.x > inimigo.fim) {
      inimigo.vx *= -1;
    }

    if (invulneravel === 0 && colidem(jogador, inimigo)) {
      const porCima =
        jogador.vy > 0 &&
        yAnterior + jogador.h <= inimigo.y + 12;

      if (porCima) {
        inimigo.vivo = false;
        jogador.vy = -9;
        moedas += 2;
        criarParticulas(inimigo.x, inimigo.y, "#ff824d", 12);
        atualizarPainel();
      } else {
        perderVida();
      }
    }
  }

  // Cair num buraco.
  if (jogador.y > H + 100) {
    perderVida();
  }

  // Chegada à bandeira.
  if (jogador.x >= objetivoX) {
    estado = "vitoria";
    mensagem.textContent = "Nível concluído! Carrega em Espaço para continuar.";
  }

  cameraX = Math.max(0, jogador.x - W * 0.35);

  for (const p of particulas) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.vida--;
  }

  particulas = particulas.filter(p => p.vida > 0);
}

function retangulo(x, y, w, h, cor) {
  ctx.fillStyle = cor;
  ctx.fillRect(
    Math.round(x - cameraX),
    Math.round(y),
    Math.round(w),
    Math.round(h)
  );
}

function desenharFundo() {
  const gradiente = ctx.createLinearGradient(0, 0, 0, H);
  gradiente.addColorStop(0, "#58c8ff");
  gradiente.addColorStop(1, "#d5f6ff");

  ctx.fillStyle = gradiente;
  ctx.fillRect(0, 0, W, H);

  // Sol.
  ctx.fillStyle = "#ffe36b";
  ctx.beginPath();
  ctx.arc(800 - cameraX * 0.1, 90, 42, 0, Math.PI * 2);
  ctx.fill();

  // Nuvens.
  for (let i = 0; i < 10; i++) {
    const x =
      ((i * 180 - cameraX * 0.25) % (W + 200) + W + 200) %
      (W + 200) - 80;

    const y = 60 + (i % 3) * 65;

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 12, 28, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Colinas.
  for (let i = 0; i < 9; i++) {
    const x = i * 180 - (cameraX * 0.4) % 180;

    ctx.fillStyle = "#8bdc83";
    ctx.beginPath();
    ctx.arc(x, 465, 100, Math.PI, 0);
    ctx.fill();
  }
}

function desenharPlataformas() {
  for (const p of plataformas) {
    if (p.x + p.w < cameraX || p.x > cameraX + W) continue;

    if (p.tipo === "chao") {
      retangulo(p.x, p.y, p.w, p.h, "#b87542");
      retangulo(p.x, p.y, p.w, 12, "#35b94d");
      retangulo(p.x, p.y + 12, p.w, 4, "#27883a");

      for (let x = p.x + 15; x < p.x + p.w; x += 35) {
        retangulo(x, p.y + 28, 4, 20, "#94572f");
      }
    } else if (p.tipo === "bloco") {
      retangulo(p.x, p.y, p.w, p.h, "#e7a443");
      retangulo(p.x, p.y, p.w, 4, "#ffe09a");
      retangulo(p.x + p.w / 2 - 2, p.y + 4, 4, p.h - 4, "#b76d2d");
    } else {
      retangulo(p.x, p.y, p.w, p.h, "#a56b3f");
      retangulo(p.x, p.y, p.w, 6, "#42c95a");
    }
  }
}

function desenharMoedas() {
  for (const m of moedasJogo) {
    if (m.apanhada) continue;

    const x = m.x - cameraX;
    if (x < -30 || x > W + 30) continue;

    const escala = 0.75 + Math.abs(Math.sin(tempo * 0.09)) * 0.25;

    ctx.fillStyle = "#d48a16";
    ctx.beginPath();
    ctx.ellipse(x, m.y, m.r * escala, m.r, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffe45b";
    ctx.beginPath();
    ctx.ellipse(x - 2, m.y - 2, m.r * escala * 0.65, m.r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff5a3";
    ctx.fillRect(x - 2, m.y - 5, 3, 8);
  }
}

function desenharInimigos() {
  for (const e of inimigos) {
    if (!e.vivo) continue;

    const x = e.x - cameraX;
    if (x < -50 || x > W + 50) continue;

    ctx.fillStyle = "#a84bce";
    ctx.fillRect(x, e.y + 8, e.w, e.h - 8);

    ctx.fillStyle = "#d98cf2";
    ctx.fillRect(x + 4, e.y + 4, e.w - 8, 18);

    ctx.fillStyle = "white";
    ctx.fillRect(x + 6, e.y + 12, 7, 9);
    ctx.fillRect(x + 20, e.y + 12, 7, 9);

    ctx.fillStyle = "#241c3c";
    ctx.fillRect(x + 9, e.y + 15, 3, 5);
    ctx.fillRect(x + 23, e.y + 15, 3, 5);

    ctx.fillStyle = "#4d2763";
    ctx.fillRect(x + 3, e.y + e.h - 3, 10, 5);
    ctx.fillRect(x + 20, e.y + e.h - 3, 10, 5);
  }
}

function desenharJogador() {
  if (invulneravel > 0 && Math.floor(invulneravel / 6) % 2 === 0) {
    return;
  }

  const x = jogador.x - cameraX;
  const y = jogador.y;

  // Pernas.
  ctx.fillStyle = "#355bd4";
  ctx.fillRect(x + 4, y + 28, 9, 12);
  ctx.fillRect(x + 18, y + 28, 9, 12);

  // Sapatos.
  ctx.fillStyle = "#573522";
  ctx.fillRect(x + 1, y + 37, 13, 5);
  ctx.fillRect(x + 17, y + 37, 13, 5);

  // Corpo.
  ctx.fillStyle = "#ff8b38";
  ctx.fillRect(x + 3, y + 17, 24, 15);

  // Jardineiras.
  ctx.fillStyle = "#2679de";
  ctx.fillRect(x + 5, y + 23, 20, 10);
  ctx.fillRect(x + 9, y + 18, 4, 5);
  ctx.fillRect(x + 19, y + 18, 4, 5);

  // Cabeça e cabelo.
  ctx.fillStyle = "#f5bd83";
  ctx.fillRect(x + 5, y + 3, 21, 18);

  ctx.fillStyle = "#663923";
  ctx.fillRect(x + 3, y + 5, 5, 14);
  ctx.fillRect(x + 7, y + 1, 16, 5);

  // Boné.
  ctx.fillStyle = "#159b67";
  ctx.fillRect(x + 2, y, 25, 7);
  ctx.fillRect(x + 15, y + 5, 17, 4);

  // Olho.
  ctx.fillStyle = "#242033";
  const olhoX = jogador.direcao > 0 ? x + 21 : x + 8;
  ctx.fillRect(olhoX, y + 10, 3, 5);
}

function desenharBandeira() {
  const x = objetivoX - cameraX;
  if (x < -50 || x > W + 50) return;

  retangulo(objetivoX, 285, 6, 180, "#f5f5f5");
  retangulo(objetivoX + 6, 285, 65, 35, "#ff4d4d");
  retangulo(objetivoX + 6, 320, 45, 25, "#ffd447");

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px Arial";
  ctx.fillText("FIM", x + 9, 309);
}

function desenharParticulas() {
  for (const p of particulas) {
    ctx.globalAlpha = Math.max(0, p.vida / 40);
    ctx.fillStyle = p.cor;
    ctx.fillRect(p.x - cameraX, p.y, 6, 6);
  }

  ctx.globalAlpha = 1;
}

function desenharSobreposicao() {
  if (estado === "jogar") return;

  ctx.fillStyle = "rgba(15, 24, 48, 0.72)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe36b";
  ctx.font = "bold 42px Arial";

  if (estado === "vitoria") {
    ctx.fillText("NÍVEL CONCLUÍDO!", W / 2, H / 2 - 25);
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText("Carrega em ESPAÇO para continuar", W / 2, H / 2 + 25);
  } else {
    ctx.fillText("FIM DO JOGO", W / 2, H / 2 - 25);
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText("Carrega em Reiniciar", W / 2, H / 2 + 25);
  }

  ctx.textAlign = "left";
}

function desenhar() {
  desenharFundo();
  desenharPlataformas();
  desenharMoedas();
  desenharBandeira();
  desenharInimigos();
  desenharJogador();
  desenharParticulas();
  desenharSobreposicao();
}

function ciclo() {
  atualizar();
  desenhar();
  requestAnimationFrame(ciclo);
}

// Controlos do teclado.
window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
    event.preventDefault();
  }

  teclas[event.code] = true;

  if (
    event.code === "Space" ||
    event.code === "ArrowUp" ||
    event.code === "KeyW"
  ) {
    if (estado === "vitoria") {
      nivel++;
      criarNivel();
    } else if (estado === "jogar" && !event.repeat) {
      saltar();
    }
  }
});

window.addEventListener("keyup", (event) => {
  teclas[event.code] = false;
});

window.addEventListener("blur", () => {
  for (const tecla in teclas) {
    teclas[tecla] = false;
  }
});

// Botões para telemóvel.
function configurarBotao(id, codigo) {
  const botao = document.getElementById(id);

  botao.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    teclas[codigo] = true;

    if (codigo === "ArrowUp") saltar();
  });

  for (const evento of [
    "pointerup",
    "pointercancel",
    "lostpointercapture"
  ]) {
    botao.addEventListener(evento, () => {
      teclas[codigo] = false;
    });
  }
}

configurarBotao("esquerda", "ArrowLeft");
configurarBotao("direita", "ArrowRight");
configurarBotao("saltar", "ArrowUp");

// Reiniciar o jogo.
document.getElementById("reiniciar").addEventListener("click", () => {
  moedas = 0;
  vidas = 3;
  nivel = 1;
  tempo = 0;
  invulneravel = 0;

  criarNivel();
  atualizarPainel();
});

criarNivel();
ciclo();
