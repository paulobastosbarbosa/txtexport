export interface Evento {
  empresa: string;
  ano: number;
  mes: number;
  matricula: string;
  codigoEvento: string;
  valor: number;
}

export interface Resultado {
  matricula: string;
  faltasInjustificadas: number;
  faltasJustificadas: number;
  atestados: number;
  extras100: number;
  extras50: number;
  saldoExtraRestante: number;
  faltasRestantes: number;
}

export function parseTxt(content: string): Resultado[] {
  const linhas = content.split(/\r?\n/).filter(l => l.trim() !== "");
  const eventos: Evento[] = linhas.map(linha => {
    return {
      empresa: linha.substring(0, 4),
      ano: parseInt(linha.substring(4, 8)),
      mes: parseInt(linha.substring(8, 10)),
      matricula: linha.substring(10, 16),
      codigoEvento: linha.substring(16, 20),
      valor: parseInt(linha.substring(20, 29)) / 60, // converte minutos em horas
    };
  });

  const porFuncionario: Record<string, Evento[]> = {};
  for (const e of eventos) {
    if (!porFuncionario[e.matricula]) porFuncionario[e.matricula] = [];
    porFuncionario[e.matricula].push(e);
  }

  const resultados: Resultado[] = [];

  for (const [matricula, evts] of Object.entries(porFuncionario)) {
    const faltasInj = soma(evts, ["2805"]);
    const faltasJust = soma(evts, ["2806"]);
    const atestados = soma(evts, ["2807"]);
    const extras100 = soma(evts, ["2901"]);
    const extras50 = soma(evts, ["2902"]);

    let faltasRestantes = faltasInj;
    let extra100Restante = extras100;
    let extra50Restante = extras50;

    if (faltasRestantes > 0) {
      const usado100 = Math.min(extra100Restante, faltasRestantes);
      faltasRestantes -= usado100;
      extra100Restante -= usado100;

      const usado50 = Math.min(extra50Restante, faltasRestantes);
      faltasRestantes -= usado50;
      extra50Restante -= usado50;
    }

    resultados.push({
      matricula,
      faltasInjustificadas: faltasInj,
      faltasJustificadas: faltasJust,
      atestados,
      extras100,
      extras50,
      saldoExtraRestante: extra100Restante + extra50Restante,
      faltasRestantes,
    });
  }

  return resultados;
}

function soma(eventos: Evento[], codigos: string[]): number {
  return eventos
    .filter(e => codigos.includes(e.codigoEvento))
    .reduce((acc, e) => acc + e.valor, 0);
}
