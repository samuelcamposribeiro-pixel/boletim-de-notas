// ============================================================
// CONFIGURAÇÃO FIXA DO ALUNO
// ============================================================
const CONFIG_ALUNO = {
  turma: "8A",
  numeroChamada: 29,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// ============================================================
// DADOS FICTÍCIOS — 8º ANO
// ============================================================
const disciplinas = [
  { disciplina: "Língua Portuguesa",          tri1: "10,0", tri2: "9,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Matemática",                 tri1: "6,3",  tri2: "8,0", tri3: null, faltas: [2, 4, 0] },
  { disciplina: "Ciências",                   tri1: "8,6",  tri2: "8,8", tri3: null, faltas: [4, 1, 0] },
  { disciplina: "História",                   tri1: "10,0", tri2: "9,4", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Geografia",                  tri1: "8,4",  tri2: "7,7", tri3: null, faltas: [2, 0, 0] },
  { disciplina: "Língua Inglesa",             tri1: "9,1",  tri2: "9,0", tri3: null, faltas: [1, 0, 0] },
  { disciplina: "Arte",                       tri1: "10,0", tri2: "9,3", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Educação Física",            tri1: "9,2",  tri2: "9,2", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Educação Digital",           tri1: "10,0", tri2: "9,0", tri3: null, faltas: [2, 2, 0] },
  { disciplina: "Educação Financeira",        tri1: "10,0", tri2: "10,0",tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Estudo Orientado",           tri1: "10,0", tri2: "9,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Redação e Leitura",          tri1: "7,6",  tri2: "8,0", tri3: null, faltas: [2, 1, 0] },
  { disciplina: "Pensamento Lógico",          tri1: "10,0", tri2: "10,0",tri3: null, faltas: [1, 0, 0] },
  { disciplina: "Literatura Arte e Movimento",tri1: "9,0",  tri2: "6,2", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Práticas Experimentais",     tri1: "7,6",  tri2: "9,6", tri3: null, faltas: [3, 1, 0] }
];

const MEDIA_MINIMA = 6.0;
const FREQUENCIA_DEMONSTRATIVA = 92;
const REFERENCIA_FALTAS_RISCO = 350;

// ============================================================
// ESTADO DA TELA
// ============================================================
let dadosAtuais = { disciplinas: disciplinas };
let pinSessao = null;
let ocupado = false;
let camposEdicao = [];

let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================
function normalizarNota(valor) {
  if (valor === null || valor === undefined) return null;

  if (typeof valor === "string") {
    const t = valor.trim().toLowerCase();
    if (t === "" || t === "null" || t === "undefined" || t === "nan") return null;
  }

  const numero = typeof valor === "string"
    ? parseFloat(String(valor).replace(",", "."))
    : valor;

  if (isNaN(numero)) return null;

  if (numero >= 0 && numero <= 10) return Number(numero.toFixed(1));
  if (numero > 10 && numero <= 100) return Number((numero / 10).toFixed(1));

  return null;
}

function formatarNota(nota) {
  if (nota === null) return "Ainda não lançada";
  return nota.toFixed(1).replace(".", ",");
}

function calcularMedia(notas) {
  const validas = notas.filter(n => n !== null);
  if (validas.length === 0) return null;
  const soma = validas.reduce((acc, n) => acc + n, 0);
  return Number((soma / validas.length).toFixed(1));
}

function somarFaltas(faltas) {
  if (!Array.isArray(faltas)) return 0;
  return faltas.reduce((acc, f) => acc + (Number(f) || 0), 0);
}

function contarNotasLancadas(n1, n2, n3) {
  if (n3 !== null && n3 !== undefined && n3 !== "") return 3;
  if (n2 !== null && n2 !== undefined && n2 !== "") return 2;
  if (n1 !== null && n1 !== undefined && n1 !== "") return 1;
  return 0;
}

function definirSituacao(notas) {
  const n1 = notas[0];
  const n2 = notas[1];
  const n3 = notas[2];

  const trimestre = contarNotasLancadas(n1, n2, n3);

  if (trimestre === 0) return "Nota ainda não disponível";

  let soma = 0;
  if (n1 !== null) soma += n1 * 10;
  if (n2 !== null) soma += n2 * 10;
  if (n3 !== null) soma += n3 * 10;

  const faixas = {
    1: { bom: 60,  atencao: 50  },
    2: { bom: 120, atencao: 110 },
    3: { bom: 180, atencao: 170 }
  };

  const faixa = faixas[trimestre];

  if (soma >= faixa.bom) return "Bom desempenho";
  if (soma >= faixa.atencao) return "Atenção";
  return "Mal desempenho";
}

function classeSituacao(situacao) {
  if (situacao === "Bom desempenho") return "situacao bom";
  if (situacao === "Atenção") return "situacao atencao";
  if (situacao === "Mal desempenho") return "situacao mal";
  return "situacao indisponivel";
}

function criarCelula(texto, classe) {
  const td = document.createElement("td");
  td.textContent = texto;
  if (classe) td.className = classe;
  return td;
}

// ============================================================
// TABELA E CARDS
// ============================================================
function preencherTabela() {
  const corpo = document.getElementById("corpo-tabela");
  corpo.replaceChildren();

  dadosAtuais.disciplinas.forEach(item => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const media = calcularMedia([n1, n2, n3]);
    const faltas = somarFaltas(item.faltas);
    const situacao = definirSituacao([n1, n2, n3]);

    const tr = document.createElement("tr");

    tr.appendChild(criarCelula(item.disciplina));
    tr.appendChild(criarCelula(formatarNota(n1)));
    tr.appendChild(criarCelula(formatarNota(n2)));
    tr.appendChild(criarCelula(formatarNota(n3)));
    tr.appendChild(criarCelula(media === null ? "—" : media.toFixed(1).replace(".", ",")));
    tr.appendChild(criarCelula(faltas));
    tr.appendChild(criarCelula(situacao, classeSituacao(situacao)));

    corpo.appendChild(tr);
  });
}

function preencherCards() {
  let somaMedias = 0;
  let contMedias = 0;
  let totalFaltas = 0;
  let bomDesempenho = 0;
  let atencao = 0;

  dadosAtuais.disciplinas.forEach(item => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const media = calcularMedia([n1, n2, n3]);
    const situacao = definirSituacao([n1, n2, n3]);

    totalFaltas += somarFaltas(item.faltas);

    if (media !== null) {
      somaMedias += media;
      contMedias++;
    }

    if (situacao === "Bom desempenho") bomDesempenho++;
    else if (situacao === "Atenção") atencao++;
  });

  const mediaGeral = contMedias > 0
    ? (somaMedias / contMedias).toFixed(1).replace(".", ",")
    : "—";

  const totalDisciplinas = dadosAtuais.disciplinas.length;
  const porcentagemBom = totalDisciplinas > 0
    ? Math.round((bomDesempenho / totalDisciplinas) * 100)
    : 0;

  document.getElementById("media-geral").textContent = mediaGeral;
  document.getElementById("total-faltas").textContent = totalFaltas;
  document.getElementById("bom-desempenho").textContent = porcentagemBom + "%";
  document.getElementById("atencao").textContent = atencao;
  document.getElementById("frequencia").textContent = FREQUENCIA_DEMONSTRATIVA + "%";
}

// ============================================================
// GRÁFICOS — SOMENTE LEITURA
// ============================================================
function corPrincipalGrafico() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--principal").trim();
  return v || "#7b1e2b";
}

function corGradeGrafico() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--secundaria").trim();
  return v || "#e6e6e6";
}

function corTextoGrafico() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--texto").trim();
  return v || "#2d2d2d";
}

function atualizarGraficoMedias() {
  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas || typeof Chart === "undefined") return;

  if (graficoMedias) {
    graficoMedias.destroy();
    graficoMedias = null;
  }

  const rotulos = [];
  const valores = [];

  dadosAtuais.disciplinas.forEach(item => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);
    rotulos.push(item.disciplina);
    valores.push(calcularMedia([n1, n2, n3]));
  });

  graficoMedias = new Chart(canvas, {
    type: "bar",
    data: {
      labels: rotulos,
      datasets: [{
        label: "Média",
        data: valores,
        backgroundColor: corPrincipalGrafico(),
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const v = ctx.parsed.x;
              if (v === null || v === undefined) return "Sem nota";
              return v.toFixed(1).replace(".", ",");
            }
          }
        }
      },
      scales: {
        x: { min: 0, max: 10, ticks: { color: corTextoGrafico() }, grid: { color: corGradeGrafico() } },
        y: { ticks: { color: corTextoGrafico(), autoSkip: false }, grid: { display: false } }
      }
    }
  });
}

function atualizarGraficoEvolucao() {
  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas || typeof Chart === "undefined") return;

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
    graficoEvolucao = null;
  }

  const somas = [0, 0, 0];
  const contagens = [0, 0, 0];
  const chaves = ["tri1", "tri2", "tri3"];

  dadosAtuais.disciplinas.forEach(item => {
    chaves.forEach((chave, i) => {
      const nota = normalizarNota(item[chave]);
      if (nota !== null) {
        somas[i] += nota;
        contagens[i]++;
      }
    });
  });

  const medias = somas.map((soma, i) =>
    contagens[i] === 0 ? null : Number((soma / contagens[i]).toFixed(1))
  );

  graficoEvolucao = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Média geral",
        data: medias,
        borderColor: corPrincipalGrafico(),
        backgroundColor: corPrincipalGrafico(),
        tension: 0.25,
        spanGaps: false,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const v = ctx.parsed.y;
              if (v === null || v === undefined) return "Sem nota";
              return v.toFixed(1).replace(".", ",");
            }
          }
        }
      },
      scales: {
        y: { min: 0, max: 10, ticks: { color: corTextoGrafico() }, grid: { color: corGradeGrafico() } },
        x: { ticks: { color: corTextoGrafico() }, grid: { display: false } }
      }
    }
  });
}

function atualizarGraficoFaltas() {
  const canvas = document.getElementById("graficoFaltasTrimestres");
  if (!canvas || typeof Chart === "undefined") return;

  if (graficoFaltas) {
    graficoFaltas.destroy();
    graficoFaltas = null;
  }

  const faltasPorTri = [0, 0, 0];

  dadosAtuais.disciplinas.forEach(item => {
    if (!Array.isArray(item.faltas)) return;
    for (let i = 0; i < 3; i++) {
      faltasPorTri[i] += Number(item.faltas[i]) || 0;
    }
  });

  const total = faltasPorTri[0] + faltasPorTri[1] + faltasPorTri[2];
  const critico = total >= REFERENCIA_FALTAS_RISCO;

  const badge = document.getElementById("estadoFaltas");
  const card = document.getElementById("card-faltas");
  if (badge) badge.hidden = !critico;
  if (card) card.classList.toggle("critico", critico);

  graficoFaltas = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Faltas",
        data: faltasPorTri,
        backgroundColor: critico ? "#c0392b" : corPrincipalGrafico(),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const v = ctx.parsed.y;
              return v + " falta" + (v === 1 ? "" : "s");
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: corTextoGrafico(), precision: 0 }, grid: { color: corGradeGrafico() } },
        x: { ticks: { color: corTextoGrafico() }, grid: { display: false } }
      }
    }
  });
}

function atualizarGraficos() {
  if (typeof Chart === "undefined") return;
  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}

function atualizarTela() {
  preencherTabela();
  preencherCards();
  atualizarGraficos();
}

function mostrarMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = "mensagem" + (tipo ? " " + tipo : "");
}

function validarNotaEditor(texto) {
  const limpo = texto.trim();

  if (limpo === "") return { valido: true, valor: null };

  if (!/^\d+([.,]\d+)?$/.test(limpo)) return { valido: false, valor: null };

  const numero = parseFloat(limpo.replace(",", "."));

  if (isNaN(numero) || numero < 0 || numero > 10) return { valido: false, valor: null };

  return { valido: true, valor: Number(numero.toFixed(1)) };
}

function validarFaltaEditor(texto) {
  const limpo = texto.trim();

  if (!/^\d+$/.test(limpo)) return { valido: false, valor: null };

  const numero = Number(limpo);

  if (!Number.isSafeInteger(numero)) return { valido: false, valor: null };

  return { valido: true, valor: numero };
}

function criarCampoEdicao(valor, rotulo, modo) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = valor;
  input.setAttribute("inputmode", modo);
  input.setAttribute("autocomplete", "off");
  input.setAttribute("aria-label", rotulo);

  input.addEventListener("input", () => {
    input.classList.remove("campo-invalido");
  });

  return input;
}

function preencherEdicao() {
  const corpo = document.getElementById("corpo-edicao");

  corpo.replaceChildren();
  camposEdicao = [];

  dadosAtuais.disciplinas.forEach(item => {
    const tr = document.createElement("tr");

    tr.appendChild(criarCelula(item.disciplina));

    const notas = [];
    const faltas = [];
    const chaves = ["tri1", "tri2", "tri3"];

    chaves.forEach((chave, i) => {
      const nota = normalizarNota(item[chave]);
      const textoNota = nota === null ? "" : nota.toFixed(1).replace(".", ",");
      const campo = criarCampoEdicao(
        textoNota,
        item.disciplina + " — nota do " + (i + 1) + "º trimestre",
        "decimal"
      );
      const td = document.createElement("td");
      td.appendChild(campo);
      tr.appendChild(td);
      notas.push(campo);
    });

    for (let i = 0; i < 3; i++) {
      const bruto = Array.isArray(item.faltas) ? item.faltas[i] : undefined;
      const textoFalta = (bruto === undefined || bruto === null) ? "0" : String(bruto);
      const campo = criarCampoEdicao(
        textoFalta,
        item.disciplina + " — faltas do " + (i + 1) + "º trimestre",
        "numeric"
      );
      const td = document.createElement("td");
      td.appendChild(campo);
      tr.appendChild(td);
      faltas.push(campo);
    }

    corpo.appendChild(tr);
    camposEdicao.push({ notas: notas, faltas: faltas });
  });
}

function lerCamposEdicao() {
  const novas = [];
  let primeiroInvalido = null;

  dadosAtuais.disciplinas.forEach((item, indice) => {
    const campos = camposEdicao[indice];
    const notasValidadas = [];
    const faltasValidadas = [];

    campos.notas.forEach(campo => {
      const resultado = validarNotaEditor(campo.value);
      if (!resultado.valido) {
        campo.classList.add("campo-invalido");
        if (!primeiroInvalido) primeiroInvalido = campo;
      }
      notasValidadas.push(resultado.valor);
    });

    campos.faltas.forEach(campo => {
      const resultado = validarFaltaEditor(campo.value);
      if (!resultado.valido) {
        campo.classList.add("campo-invalido");
        if (!primeiroInvalido) primeiroInvalido = campo;
      }
      faltasValidadas.push(resultado.valor);
    });

    novas.push(Object.assign({}, item, {
      tri1: notasValidadas[0],
      tri2: notasValidadas[1],
      tri3: notasValidadas[2],
      faltas: faltasValidadas
    }));
  });

  if (primeiroInvalido) {
    primeiroInvalido.focus();
    return { ok: false, disciplinas: null };
  }

  return { ok: true, disciplinas: novas };
}

async function abrirBoletim() {
  if (ocupado) return;

  const campoPin = document.getElementById("campo-pin");
  const botaoEntrar = document.getElementById("botao-entrar");
  const mensagem = document.getElementById("mensagem-acesso");

  const pin = campoPin.value.trim();

  if (pin === "") {
    mostrarMensagem(mensagem, "Digite o PIN para entrar.", "erro");
    return;
  }

  ocupado = true;
  botaoEntrar.disabled = true;
  mostrarMensagem(mensagem, "Conectando...", "");

  try {
    const resposta = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/abrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pin
      })
    });

    if (resposta.status === 401) {
      mostrarMensagem(mensagem, "Turma, chamada ou PIN inválidos.", "erro");
      return;
    }

    if (resposta.status === 429) {
      mostrarMensagem(mensagem, "Muitas tentativas. Aguarde um minuto e tente novamente.", "erro");
      return;
    }

    if (!resposta.ok) {
      mostrarMensagem(mensagem, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
      return;
    }

    const resultado = await resposta.json();

    if (resultado && resultado.dados !== null && resultado.dados !== undefined) {
      if (!Array.isArray(resultado.dados.disciplinas)) {
        mostrarMensagem(mensagem, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
        return;
      }
      dadosAtuais = { disciplinas: resultado.dados.disciplinas };
    } else {
      dadosAtuais = { disciplinas: disciplinas };
    }

    pinSessao = pin;
    campoPin.value = "";
    mostrarMensagem(mensagem, "", "");

    document.getElementById("area-acesso").hidden = true;
    document.getElementById("area-boletim").hidden = false;

    atualizarTela();
  } catch (erro) {
    mostrarMensagem(mensagem, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
  } finally {
    ocupado = false;
    botaoEntrar.disabled = false;
  }
}

function abrirEdicao() {
  preencherEdicao();
  mostrarMensagem(document.getElementById("mensagem-edicao"), "", "");
  document.getElementById("area-edicao").hidden = false;
}

function fecharEdicao() {
  document.getElementById("area-edicao").hidden = true;
  mostrarMensagem(document.getElementById("mensagem-edicao"), "", "");
}

async function salvarAlteracoes() {
  if (ocupado) return;

  const mensagem = document.getElementById("mensagem-edicao");
  const botaoSalvar = document.getElementById("botao-salvar");

  const leitura = lerCamposEdicao();

  if (!leitura.ok) {
    mostrarMensagem(mensagem, "Corrija os campos destacados antes de salvar.", "erro");
    return;
  }

  ocupado = true;
  botaoSalvar.disabled = true;
  mostrarMensagem(mensagem, "Salvando...", "");

  try {
    const resposta = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/salvar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: leitura.disciplinas
        }
      })
    });

    if (resposta.status === 401) {
      mostrarMensagem(mensagem, "Turma, chamada ou PIN inválidos.", "erro");
      return;
    }

    if (resposta.status === 429) {
      mostrarMensagem(mensagem, "Muitas tentativas. Aguarde um minuto e tente novamente.", "erro");
      return;
    }

    if (!resposta.ok) {
      mostrarMensagem(mensagem, "Não foi possível salvar. Tente novamente.", "erro");
      return;
    }

    dadosAtuais = { disciplinas: leitura.disciplinas };
    atualizarTela();
    preencherEdicao();
    mostrarMensagem(mensagem, "Dados salvos com sucesso.", "sucesso");
  } catch (erro) {
    mostrarMensagem(mensagem, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
  } finally {
    ocupado = false;
    botaoSalvar.disabled = false;
  }
}

// ============================================================
// EXECUÇÃO
// ============================================================
document.getElementById("acesso-turma").textContent = CONFIG_ALUNO.turma;
document.getElementById("acesso-chamada").textContent = CONFIG_ALUNO.numeroChamada;

document.getElementById("botao-entrar").addEventListener("click", abrirBoletim);
document.getElementById("campo-pin").addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") abrirBoletim();
});

document.getElementById("botao-alterar").addEventListener("click", abrirEdicao);
document.getElementById("botao-salvar").addEventListener("click", salvarAlteracoes);
document.getElementById("botao-cancelar").addEventListener("click", fecharEdicao);