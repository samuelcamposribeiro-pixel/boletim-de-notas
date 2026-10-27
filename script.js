// ============================================================
// CONFIGURAÇÃO FIXA DO ALUNO
// Turma e número de chamada ficam fixos neste projeto.
// ============================================================
const CONFIG_ALUNO = {
  turma: "8A",
  numeroChamada: 29,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// ============================================================
// DADOS FICTÍCIOS — 8º ANO
// (usados quando a API não tiver dados salvos)
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

// Constante usada nas regras de situação
const MEDIA_MINIMA = 6.0;

// Frequência DEMONSTRATIVA
const FREQUENCIA_DEMONSTRATIVA = 92;

// Referência interna de risco de faltas (NÃO exibir na página)
const REFERENCIA_FALTAS_RISCO = 350;

// ============================================================
// ESTADO DA TELA
// ============================================================

// Dados que estão sendo mostrados agora (API > dados locais)
let dadosAtuais = { disciplinas: disciplinas };

// PIN digitado pelo estudante: fica SOMENTE em memória
let pinSessao = null;

// Evita cliques repetidos enquanto uma conexão está em andamento
let ocupado = false;

// Referências dos campos do editor (uma entrada por disciplina)
let camposEdicao = [];

// Instâncias dos gráficos (recriadas a cada atualização)
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// ============================================================
// FUNÇÃO: normalizarNota(valor)
// (usada para os dados antigos do projeto e para dados da API)
// ============================================================
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = typeof valor === "string"
    ? parseFloat(valor.replace(",", "."))
    : valor;

  if (isNaN(numero)) return null;

  if (numero >= 0 && numero <= 10) return Number(numero.toFixed(1));
  if (numero > 10 && numero <= 100) return Number((numero / 10).toFixed(1));

  return null;
}

// ============================================================
// FUNÇÃO: formatarNota(nota)
// ============================================================
function formatarNota(nota) {
  if (nota === null) return "Ainda não lançada";
  return nota.toFixed(1).replace(".", ",");
}

// ============================================================
// FUNÇÃO: calcularMedia(notas)
// ============================================================
function calcularMedia(notas) {
  const validas = notas.filter(n => n !== null);
  if (validas.length === 0) return null;
  const soma = validas.reduce((acc, n) => acc + n, 0);
  return Number((soma / validas.length).toFixed(1));
}

// ============================================================
// FUNÇÃO: somarFaltas(faltas)
// ============================================================
function somarFaltas(faltas) {
  if (!Array.isArray(faltas)) return 0;
  return faltas.reduce((acc, f) => acc + (Number(f) || 0), 0);
}

// ============================================================
// FUNÇÃO: definirSituacao(media)
// Regras: sem nota / Aprovado / Atenção / Ruim
// - Aprovado: média >= 6,0
// - Atenção: média exatamente 5,0
// - Ruim: média < 5,0
// ============================================================
function definirSituacao(media) {
  if (media === null) return "Nota ainda não disponível";
  if (media >= MEDIA_MINIMA) return "Aprovado";
  if (media === 5.0) return "Atenção";
  return "Ruim";
}

// ============================================================
// FUNÇÃO: classeSituacao(situacao)
// ============================================================
function classeSituacao(situacao) {
  if (situacao === "Aprovado") return "situacao bom";
  if (situacao === "Atenção") return "situacao atencao";
  if (situacao === "Ruim") return "situacao ruim";
  return "situacao indisponivel";
}

// ============================================================
// FUNÇÃO: criarCelula(texto, classe)
// ============================================================
function criarCelula(texto, classe) {
  const td = document.createElement("td");
  td.textContent = texto;
  if (classe) td.className = classe;
  return td;
}

// ============================================================
// FUNÇÃO: preencherTabela()
// Agora limpa a tabela antes de reconstruir (sem duplicar linhas)
// ============================================================
function preencherTabela() {
  const corpo = document.getElementById("corpo-tabela");

  // Limpa a tabela antes de reconstruir
  corpo.replaceChildren();

  dadosAtuais.disciplinas.forEach(item => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const media = calcularMedia([n1, n2, n3]);
    const faltas = somarFaltas(item.faltas);
    const situacao = definirSituacao(media);

    const tr = document.createElement("tr");

    tr.appendChild(criarCelula(item.disciplina));
    tr.appendChild(criarCelula(formatarNota(n1)));
    tr.appendChild(criarCelula(formatarNota(n2)));
    tr.appendChild(criarCelula(formatarNota(n3)));
    tr.appendChild(criarCelula(media === null ? "—" : media.toFixed(1).replace(".", ",")));

    const tdFaltas = criarCelula(faltas);
    tr.appendChild(tdFaltas);

    tr.appendChild(criarCelula(situacao, classeSituacao(situacao)));

    corpo.appendChild(tr);
  });
}

// ============================================================
// FUNÇÃO: preencherCards()
// Os valores são recalculados a cada chamada (sem acumular)
// ============================================================
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
    totalFaltas += somarFaltas(item.faltas);

    if (media !== null) {
      somaMedias += media;
      contMedias++;
      if (media >= MEDIA_MINIMA) bomDesempenho++;
      else atencao++;
    }
  });

  const mediaGeral = contMedias > 0
    ? (somaMedias / contMedias).toFixed(1).replace(".", ",")
    : "—";

  document.getElementById("media-geral").textContent = mediaGeral;
  document.getElementById("total-faltas").textContent = totalFaltas;
  document.getElementById("bom-desempenho").textContent = bomDesempenho;
  document.getElementById("atencao").textContent = atencao;
  document.getElementById("frequencia").textContent = FREQUENCIA_DEMONSTRATIVA + "%";
}

// ============================================================
// GRÁFICOS — CAMADA SOMENTE LEITURA
// Usam apenas dadosAtuais, sem alterar nada.
// ============================================================

// Cor principal vinda do CSS (fallback bordô)
function corPrincipalGrafico() {
  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue("--principal").trim();
  return valor || "#7b1e2b";
}

// Cinza claro para grades
function corGradeGrafico() {
  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue("--secundaria").trim();
  return valor || "#e6e6e6";
}

// Texto do eixo
function corTextoGrafico() {
  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue("--texto").trim();
  return valor || "#2d2d2d";
}

// ------------------------------------------------------------
// atualizarGraficoMedias()
// Barras horizontais com a média de cada disciplina.
// ------------------------------------------------------------
function atualizarGraficoMedias() {
  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas) return;

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
    const media = calcularMedia([n1, n2, n3]);

    rotulos.push(item.disciplina);
    valores.push(media); // null quando não há notas
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
        x: {
          min: 0,
          max: 10,
          ticks: { color: corTextoGrafico() },
          grid: { color: corGradeGrafico() }
        },
        y: {
          ticks: { color: corTextoGrafico(), autoSkip: false },
          grid: { display: false }
        }
      }
    }
  });
}

// ------------------------------------------------------------
// atualizarGraficoEvolucao()
// Linha com a média geral de cada trimestre.
// ------------------------------------------------------------
function atualizarGraficoEvolucao() {
  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas) return;

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

  const medias = somas.map((soma, i) => {
    if (contagens[i] === 0) return null;
    return Number((soma / contagens[i]).toFixed(1));
  });

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
        y: {
          min: 0,
          max: 10,
          ticks: { color: corTextoGrafico() },
          grid: { color: corGradeGrafico() }
        },
        x: {
          ticks: { color: corTextoGrafico() },
          grid: { display: false }
        }
      }
    }
  });
}

// ------------------------------------------------------------
// atualizarGraficoFaltas()
// Três barras: faltas somadas por trimestre.
// Também controla o badge "Perigo" (referência interna, sem exibir 350).
// ------------------------------------------------------------
function atualizarGraficoFaltas() {
  const canvas = document.getElementById("graficoFaltasTrimestres");
  if (!canvas) return;

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
        y: {
          beginAtZero: true,
          ticks: { color: corTextoGrafico(), precision: 0 },
          grid: { color: corGradeGrafico() }
        },
        x: {
          ticks: { color: corTextoGrafico() },
          grid: { display: false }
        }
      }
    }
  });
}

// ------------------------------------------------------------
// atualizarGraficos()
// Chamada após a tela já estar atualizada.
// ------------------------------------------------------------
function atualizarGraficos() {
  // Chart.js precisa estar disponível
  if (typeof Chart === "undefined") return;

  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}

// ============================================================
// FUNÇÃO: atualizarTela()
// Reconstrói tabela, cards e gráficos.
// ============================================================
function atualizarTela() {
  preencherTabela();
  preencherCards();
  atualizarGraficos();
}

// ============================================================
// FUNÇÃO: mostrarMensagem(elemento, texto, tipo)
// tipo pode ser "erro", "sucesso" ou vazio
// ============================================================
function mostrarMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = "mensagem" + (tipo ? " " + tipo : "");
}

// ============================================================
// FUNÇÃO: validarNotaEditor(texto)
// Aceita somente 0 a 10 (ponto ou vírgula) ou vazio.
// Vazio vira null. Valor inválido NÃO vira null nem zero.
// ============================================================
function validarNotaEditor(texto) {
  const limpo = texto.trim();

  if (limpo === "") return { valido: true, valor: null };

  if (!/^\d+([.,]\d+)?$/.test(limpo)) return { valido: false, valor: null };

  const numero = parseFloat(limpo.replace(",", "."));

  if (isNaN(numero) || numero < 0 || numero > 10) return { valido: false, valor: null };

  return { valido: true, valor: Number(numero.toFixed(1)) };
}

// ============================================================
// FUNÇÃO: validarFaltaEditor(texto)
// Aceita somente número inteiro, zero ou maior.
// Vazio é inválido e NÃO vira zero.
// ============================================================
function validarFaltaEditor(texto) {
  const limpo = texto.trim();

  if (!/^\d+$/.test(limpo)) return { valido: false, valor: null };

  const numero = Number(limpo);

  if (!Number.isSafeInteger(numero)) return { valido: false, valor: null };

  return { valido: true, valor: numero };
}

// ============================================================
// FUNÇÃO: criarCampoEdicao(valor, rotulo, modo)
// ============================================================
function criarCampoEdicao(valor, rotulo, modo) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = valor;
  input.setAttribute("inputmode", modo);
  input.setAttribute("autocomplete", "off");
  input.setAttribute("aria-label", rotulo);

  // Ao digitar de novo, tira a marca de erro do campo
  input.addEventListener("input", () => {
    input.classList.remove("campo-invalido");
  });

  return input;
}

// ============================================================
// FUNÇÃO: preencherEdicao()
// Monta os campos de edição com os dados atuais.
// O nome da disciplina é só texto (não editável).
// ============================================================
function preencherEdicao() {
  const corpo = document.getElementById("corpo-edicao");

  corpo.replaceChildren();
  camposEdicao = [];

  dadosAtuais.disciplinas.forEach(item => {
    const tr = document.createElement("tr");

    // Nome da disciplina: somente leitura
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

// ============================================================
// FUNÇÃO: lerCamposEdicao()
// Valida todos os campos. Se algum for inválido, marca o campo
// e devolve ok: false (nada é salvo).
// ============================================================
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

// ============================================================
// FUNÇÃO: abrirBoletim()
// POST /api/v1/boletins/abrir
// ============================================================
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

    // DADOS DA API > DADOS LOCAIS
    if (resultado && resultado.dados !== null && resultado.dados !== undefined) {
      if (!Array.isArray(resultado.dados.disciplinas)) {
        mostrarMensagem(mensagem, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
        return;
      }
      dadosAtuais = { disciplinas: resultado.dados.disciplinas };
    } else {
      // Sem dados salvos: usa as disciplinas do projeto (sem salvar automaticamente)
      dadosAtuais = { disciplinas: disciplinas };
    }

    // Login bem-sucedido: PIN fica só na memória e o campo é limpo
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

// ============================================================
// FUNÇÃO: abrirEdicao()
// ============================================================
function abrirEdicao() {
  preencherEdicao();
  mostrarMensagem(document.getElementById("mensagem-edicao"), "", "");
  document.getElementById("area-edicao").hidden = false;
}

// ============================================================
// FUNÇÃO: fecharEdicao()
// ============================================================
function fecharEdicao() {
  document.getElementById("area-edicao").hidden = true;
  mostrarMensagem(document.getElementById("mensagem-edicao"), "", "");
}

// ============================================================
// FUNÇÃO: salvarAlteracoes()
// PUT /api/v1/boletins/salvar
// ============================================================
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

    // Sucesso: atualiza os dados mostrados e reconstrói a tela
    dadosAtuais = { disciplinas: leitura.disciplinas };
    atualizarTela();
    preencherEdicao();
    mostrarMensagem(mensagem, "Dados salvos com sucesso.", "sucesso");
  } catch (erro) {
    // Em caso de falha, os campos digitados são mantidos para nova tentativa
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