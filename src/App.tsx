import React, { useState } from "react";
import FileImporter from "./components/FileImporter";
import { Resultado } from "./utils/parseTxt";

export default function App() {
  const [resultados, setResultados] = useState<Resultado[]>([]);

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🧾 Gerador e Importador de Arquivos TXT
      </h1>

      <FileImporter onResults={setResultados} />

      {resultados.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2">Matrícula</th>
                <th className="p-2">Extras 100%</th>
                <th className="p-2">Extras 50%</th>
                <th className="p-2">Faltas Inj.</th>
                <th className="p-2">Faltas Just.</th>
                <th className="p-2">Atestados</th>
                <th className="p-2">Saldo Extra</th>
                <th className="p-2">Faltas Restantes</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{r.matricula}</td>
                  <td className="p-2">{r.extras100.toFixed(2)}</td>
                  <td className="p-2">{r.extras50.toFixed(2)}</td>
                  <td className="p-2">{r.faltasInjustificadas.toFixed(2)}</td>
                  <td className="p-2">{r.faltasJustificadas.toFixed(2)}</td>
                  <td className="p-2">{r.atestados.toFixed(2)}</td>
                  <td className="p-2">{r.saldoExtraRestante.toFixed(2)}</td>
                  <td className="p-2">{r.faltasRestantes.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
