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
// ============================================================
function definirSituacao(media) {
  if (media === null) return "Nota ainda não disponível";
  if (media >= MEDIA_MINIMA) return "Bom desempenho";
  return "Atenção";
}

// ============================================================
// FUNÇÃO: classeSituacao(situacao)
// ============================================================
function classeSituacao(situacao) {
  if (situacao === "Bom desempenho") return "situacao bom";
  if (situacao === "Atenção") return "situacao atencao";
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
// FUNÇÃO: atualizarTela()
// Reconstrói tabela, cards, médias, faltas e situações
// ============================================================
function atualizarTela() {
  preencherTabela();
  preencherCards();
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
// FUNÇÃO: