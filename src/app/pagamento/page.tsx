"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { payment } from "@/utils/api";
import { getErrorMessage } from "@/utils/error-handler";

export const dynamic = 'force-dynamic';

export default function Pagamento() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const type = searchParams.get("type") as "boost" | "premium" | null;
  const propertyId = searchParams.get("propertyId");
  const number = searchParams.get("number");

  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validar que os parâmetros necessários estão presentes
    if (!type || (type === "boost" && (!propertyId || !number))) {
      setError("Parâmetros inválidos para pagamento");
    }
  }, [type, propertyId, number]);

  const formatCardNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    // Adiciona espaços a cada 4 dígitos
    return numbers.match(/.{1,4}/g)?.join(" ") || numbers;
  };

  const formatExpiryDate = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    // Adiciona barra após 2 dígitos
    if (numbers.length >= 2) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
    }
    return numbers;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) { // 16 dígitos + 3 espaços
      setCardNumber(formatted);
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) { // MM/YY
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, "");
    if (numbers.length <= 3) {
      setCvv(numbers);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!type) {
      setError("Tipo de pagamento não especificado");
      return;
    }

    if (type === "boost" && (!propertyId || !number)) {
      setError("Dados do anúncio não especificados");
      return;
    }

    // Validações básicas
    if (cardNumber.replace(/\s/g, "").length < 16) {
      setError("Número do cartão deve ter 16 dígitos");
      return;
    }

    if (!cardHolder.trim()) {
      setError("Nome do portador é obrigatório");
      return;
    }

    if (expiryDate.length !== 5) {
      setError("Data de validade inválida (use MM/AA)");
      return;
    }

    if (cvv.length < 3) {
      setError("CVV deve ter 3 dígitos");
      return;
    }

    setLoading(true);
    try {
      await payment.process({
        type,
        propertyId: type === "boost" ? propertyId! : undefined,
        number: type === "boost" ? (number ? parseInt(number) : undefined) : undefined,
        cardNumber: cardNumber.replace(/\s/g, ""),
        cardHolder: cardHolder.trim(),
        expiryDate: expiryDate,
        cvv: cvv
      });

      // Redirecionar após sucesso
      if (type === "boost") {
        router.push(`/anuncio/${propertyId}/${number}`);
      } else {
        router.push("/conta");
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Erro ao processar pagamento"));
    } finally {
      setLoading(false);
    }
  };

  if (!type || (type === "boost" && (!propertyId || !number))) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div className="error-message">
            Parâmetros inválidos para pagamento
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push("/")}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Pagamento Simulado</h3>
          <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.5rem" }}>
            {type === "boost" 
              ? "Patrocinar Anúncio" 
              : "Ativar Conta Premium"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label className="form-label">Número do Cartão</label>
            <input
              type="text"
              className="form-input"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nome do Portador</label>
            <input
              type="text"
              className="form-input"
              placeholder="NOME COMPLETO"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Validade (MM/AA)</label>
              <input
                type="text"
                className="form-input"
                placeholder="MM/AA"
                value={expiryDate}
                onChange={handleExpiryDateChange}
                maxLength={5}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">CVV</label>
              <input
                type="text"
                className="form-input"
                placeholder="123"
                value={cvv}
                onChange={handleCvvChange}
                maxLength={3}
                required
              />
            </div>
          </div>

          <div style={{ 
            padding: "1rem", 
            background: "#f3f4f6", 
            borderRadius: "8px",
            marginBottom: "1rem"
          }}>
            <p style={{ fontSize: "0.875rem", color: "#666", margin: 0 }}>
              <strong>⚠️ Atenção:</strong> Este é um sistema de pagamento simulado. 
              Nenhuma transação real será processada. Os dados fornecidos não serão validados.
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ color: "white" }}
            >
              {loading ? "Processando..." : "Confirmar Pagamento"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

