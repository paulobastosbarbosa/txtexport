// src/utils/parseTxt.ts

export interface Evento {
  empresa: string;
  ano: number;
  mes: number;
  matricula: string;
  codigoEvento: string;
  valorEvento: number;
}

export interface ResultadoCalculo {
  matricula: string;
  extrasRestantes: number;
  faltasRestantes: number;
  detalhes: string;
}

/**
 * Lê o conteúdo do arquivo TXT e converte para uma lista de eventos estruturados.
 */
export function parseTxtFile(content: string): Evento[] {
  const lines = content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const eventos: Evento[] = lines.map(line => ({
    empresa: line.substring(0, 4),
    ano: parseInt(line.substring(4, 8)),
    mes: parseInt(line.substring(8, 10)),
    matricula: line.substring(10, 16),
    codigoEvento: line.substring(16, 20),
    valorEvento: parseInt(line.substring(20, 29)),
  }));

  return eventos;
}

/**
 * Faz o cálculo de saldo entre horas extras e faltas.
 */
export function calcularSaldo(eventos: Evento[]): ResultadoCalculo[] {
  const funcionarios = new Map<string, Evento[]>();

  // Agrupar por matrícula
  for (const ev of eventos) {
    if (!funcionarios.has(ev.matricula)) funcionarios.set(ev.matricula, []);
    funcionarios.get(ev.matricula)!.push(ev);
  }

  const resultados: ResultadoCalculo[] = [];

  funcionarios.forEach((evs, matricula) => {
    const extras100 = evs.filter(e => e.codigoEvento === "2805").reduce((s, e) => s + e.valorEvento, 0);
    const extras50 = evs.filter(e => e.codigoEvento === "2806").reduce((s, e) => s + e.valorEvento, 0);
    const faltasInj = evs.filter(e => e.codigoEvento === "2807").reduce((s, e) => s + e.valorEvento, 0);
    const faltasJust = evs.filter(e => e.codigoEvento === "2808").reduce((s, e) => s + e.valorEvento, 0);
    const atestados = evs.filter(e => e.codigoEvento === "2809").reduce((s, e) => s + e.valorEvento, 0);

    // Converter minutos ou centésimos para horas (ajuste se necessário)
    const conv = (v: number) => v / 60;

    let extras100h = conv(extras100);
    let extras50h = conv(extras50);
    let faltasInjH = conv(faltasInj);
    const faltasJustH = conv(faltasJust);
    const atestadosH = conv(atestados);

    // Desconta faltas injustificadas primeiro das extras 100%
    if (faltasInjH > 0) {
      const desconto100 = Math.min(faltasInjH, extras100h);
      faltasInjH -= desconto100;
      extras100h -= desconto100;
    }

    // Depois desconta das extras 50%
    if (faltasInjH > 0) {
      const desconto50 = Math.min(faltasInjH, extras50h);
      faltasInjH -= desconto50;
      extras50h -= desconto50;
    }

    resultados.push({
      matricula,
      extrasRestantes: extras100h + extras50h,
      faltasRestantes: faltasInjH,
      detalhes: `Faltas Just: ${faltasJustH}h | Atestados: ${atestadosH}h`,
    });
  });

  return resultados;
}
