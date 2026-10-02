// ============================================================
// DADOS DICAS — 8º ANO
// ============================================================
const disciplinas = [
  { disciplina: "Língua Portuguesa",          tri1: "10,0", tri2: "9,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Matemática",                 tri1: "6,3",  tri2: "8,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Ciências",                   tri1: "8,6",  tri2: "8,8", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "História",                   tri1: "10,0", tri2: "9,4", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Geografia",                  tri1: "8,4",  tri2: "7,7", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Língua Inglesa",             tri1: "9,1",  tri2: "9,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Arte",                       tri1: "10,0", tri2: "9,3", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Educação Física",            tri1: "9,2",  tri2: "9,2", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Educação Digital",           tri1: "10,0", tri2: "9,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Educação Financeira",        tri1: "10,0", tri2: "10,0",tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Estudo Orientado",           tri1: "10,0", tri2: "9,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Redação e Leitura",          tri1: "7,6",  tri2: "8,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Pensamento Lógico",          tri1: "10,0", tri2: "10,0",tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Literatura Arte e Movimento",tri1: "9,0",  tri2: "6,2", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Práticas Experimentais",     tri1: "7,6",  tri2: "9,6", tri3: null, faltas: [0, 0, 0] }
];

// Constante usada nas regras de situação
const MEDIA_MINIMA = 6.0;

// Frequência DEMONSTRATIVA
const FREQUENCIA_DEMONSTRATIVA = 92;

// ============================================================
// FUNÇÃO: normalizarNota(valor)
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
  return faltas.reduce((acc, f) => acc + f, 0);
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
// ============================================================
function preencherTabela() {
  const corpo = document.getElementById("corpo-tabela");

  disciplinas.forEach(item => {
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
// ============================================================
function preencherCards() {
  let somaMedias = 0;
  let contMedias = 0;
  let totalFaltas = 0;
  let bomDesempenho = 0;
  let atencao = 0;

  disciplinas.forEach(item => {
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
// EXECUÇÃO
// ============================================================
preencherTabela();
preencherCards();