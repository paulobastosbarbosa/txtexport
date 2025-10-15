import React, { useState } from "react";
import { parseTxt, Resultado } from "../utils/parseTxt";

interface Props {
  onResults: (dados: Resultado[]) => void;
}

const FileImporter: React.FC<Props> = ({ onResults }) => {
  const [fileName, setFileName] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const text = await file.text();
    const resultados = parseTxt(text);
    onResults(resultados);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow text-center my-6">
      <h2 className="text-lg font-semibold mb-2">📥 Importar arquivo TXT</h2>
      <input
        type="file"
        accept=".txt"
        onChange={handleFile}
        className="border rounded p-2 w-full"
      />
      {fileName && <p className="mt-2 text-gray-600">Arquivo: {fileName}</p>}
    </div>
  );
};

export default FileImporter;
