// src/components/FileImporter.tsx
import React, { useState } from "react";
import { parseTxtFile, calcularSaldo, ResultadoCalculo } from "../utils/parseTxt";

export default function FileImporter() {
  const [resultados, setResultados] = useState<ResultadoCalculo[]>([]);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const text = await file.text();
    const eventos = parseTxtFile(text);
    const calculos = calcularSaldo(eventos);
    setResultados(calculos);
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-2xl max-w-3xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">📂 Importar Arquivo TXT</h2>

      <input
        type="file"
        accept=".txt"
        onChange={handleFileUpload}
        className="border p-2 rounded w-full mb-4"
      />

      {fileName && <p className="text-sm text-gray-500 mb-4">Arquivo: {fileName}</p>}

      {resultados.length > 0 && (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border p-2">Matrícula</th>
              <th className="border p-2">Extras Restantes (h)</th>
              <th className="border p-2">Faltas Restantes (h)</th>
              <th className="border p-2">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r, i) => (
              <tr key={i}>
                <td className="border p-2">{r.matricula}</td>
                <td className="border p-2">{r.extrasRestantes.toFixed(2)}</td>
                <td className="border p-2">{r.faltasRestantes.toFixed(2)}</td>
                <td className="border p-2">{r.detalhes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
