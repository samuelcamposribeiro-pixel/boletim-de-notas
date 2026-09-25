// ============================================================
// DADOS FICTÍCIOS — 8º ANO
// Estes são os "dados brutos". As notas ainda não estão no
// formato 0–10, e o JavaScript vai normalizar tudo sozinho.
// ============================================================
const disciplinas = [
  { disciplina: "Língua Portuguesa",          tri1: 82,    tri2: "7,8", tri3: 85,   faltas: [2, 1, 1] },
  { disciplina: "Matemática",                 tri1: 52,    tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências",                   tri1: "8,1", tri2: 76,    tri3: 8.0,  faltas: [1, 2, 0] },
  { disciplina: "História",                   tri1: 7.0,   tri2: 84,    tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia",                  tri1: 68,    tri2: 7.3,   tri3: "7,9",faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa",             tri1: 86,    tri2: "8,1", tri3: 8.7,  faltas: [1, 0, 0] },
  { disciplina: "Arte",                       tri1: 9.0,   tri2: 92,    tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física",            tri1: 95,    tri2: 9.0,   tri3: "9,4",faltas: [0, 1, 0] },
  { disciplina: "Educação Digital",           tri1: 88,    tri2: 9.1,   tri3: 93,   faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira",        tri1: 74,    tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado",           tri1: 8.0,   tri2: 83,    tri3: "8,5",faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura",          tri1: 62,    tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico",          tri1: 48,    tri2: 5.6,   tri3: "6,0",faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento",tri1: "7,7", tri2: 80,    tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais",     tri1: 58,    tri2: "6,2", tri3: 6.4,  faltas: [1, 1, 1] }
];

// Constante usada nas regras de situação
const MEDIA_MINIMA = 6.0;

// Frequência FICTÍCIA (apenas demonstrativa nesta etapa).
// Em versões futuras ela será calculada de outra forma.
const FREQUENCIA_DEMONSTRATIVA = 92;

// ============================================================
// FUNÇÃO: normalizarNota(valor)
// Converte qualquer nota para a escala 0–10.
// Retorna null quando a nota ainda não foi lançada.
// ============================================================
function normalizarNota(valor) {
  // Vazio, null ou undefined = nota ainda não lançada
  if (valor === null || valor === undefined || valor === "") return null;

  // Aceita ponto ou vírgula decimal
  const numero = typeof valor === "string"
    ? parseFloat(valor.replace(",", "."))
    : valor;

  // Se não for número válido, ignora
  if (isNaN(numero)) return null;

  // Entre 0 e 10: mantém
  if (numero >= 0 && numero <= 10) return Number(numero.toFixed(1));

  // Maior que 10 e até 100: divide por 10
  if (numero > 10 && numero <= 100) return Number((numero / 10).toFixed(1));

  // Fora das regras: inválido
  return null;
}

// ============================================================
// FUNÇÃO: formatarNota(nota)
// Devolve o texto que vai aparecer na tabela.
// ============================================================
function formatarNota(nota) {
  if (nota === null) return "Ainda não lançada";
  return nota.toFixed(1).replace(".", ",");
}

// ============================================================
// FUNÇÃO: calcularMedia(notas)
// Média usando SOMENTE notas disponíveis.
// Nota ausente nunca vira zero.
// ============================================================
function calcularMedia(notas) {
  const validas = notas.filter(n => n !== null);
  if (validas.length === 0) return null;
  const soma = validas.reduce((acc, n) => acc + n, 0);
  return Number((soma / validas.length).toFixed(1));
}

// ============================================================
// FUNÇÃO: somarFaltas(faltas)
// Soma os três trimestres.
// ============================================================
function somarFaltas(faltas) {
  return faltas.reduce((acc, f) => acc + f, 0);
}

// ============================================================
// FUNÇÃO: definirSituacao(media)
// Aplica as regras de situação.
// ============================================================
function definirSituacao(media) {
  if (media === null) return "Nota ainda não disponível";
  if (media >= MEDIA_MINIMA) return "Bom desempenho";
  return "Atenção";
}

// ============================================================
// FUNÇÃO: classeSituacao(situacao)
// Devolve a classe CSS correspondente à situação.
// ============================================================
function classeSituacao(situacao) {
  if (situacao === "Bom desempenho") return "situacao bom";
  if (situacao === "Atenção") return "situacao atencao";
  return "situacao indisponivel";
}

// ============================================================
// FUNÇÃO: criarCelula(texto, classe)
// Cria uma célula <td> já com o texto e a classe opcional.
// ============================================================
function criarCelula(texto, classe) {
  const td = document.createElement("td");
  td.textContent = texto;
  if (classe) td.className = classe;
  return td;
}

// ============================================================
// FUNÇÃO: preencherTabela()
// Percorre o array de disciplinas e monta as linhas da tabela.
// ============================================================
function preencherTabela() {
  const corpo = document.getElementById("corpo-tabela");

  disciplinas.forEach(item => {
    // Normaliza cada nota
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const media = calcularMedia([n1, n2, n3]);
    const faltas = somarFaltas(item.faltas);
    const situacao = definirSituacao(media);

    // Cria a linha
    const tr = document.createElement("tr");

    tr.appendChild(criarCelula(item.disciplina));
    tr.appendChild(criarCelula(formatarNota(n1)));
    tr.appendChild(criarCelula(formatarNota(n2)));
    tr.appendChild(criarCelula(formatarNota(n3)));
    tr.appendChild(criarCelula(media === null ? "—" : media.toFixed(1).replace(".", ",")));

    // Faltas em badge simples
    const tdFaltas = criarCelula(faltas);
    tr.appendChild(tdFaltas);

    // Situação com classe de cor
    tr.appendChild(criarCelula(situacao, classeSituacao(situacao)));

    corpo.appendChild(tr);
  });
}

// ============================================================
// FUNÇÃO: preencherCards()
// Calcula e mostra os valores dos cards de resumo.
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
// Quando a página termina de carregar, monta tabela e cards.
// ============================================================
preencherTabela();
preencherCards();