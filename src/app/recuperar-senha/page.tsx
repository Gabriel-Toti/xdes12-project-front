"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { user } from "@/utils/api";
import { getErrorMessage } from "@/utils/error-handler";

export const dynamic = 'force-dynamic';

export default function RecuperarSenha() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Informe o email cadastrado para continuar.");
      return;
    }

    try {
      setLoading(true);
      await user.requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(getErrorMessage(err, "Não foi possível enviar o email."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Recuperar senha</h3>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <p>
              Enviamos um email com o código de verificação e o link para redefinir
              sua senha. Verifique também a caixa de spam.
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: "1rem" }}
              onClick={() => router.push(`/redefinir-senha?email=${encodeURIComponent(email)}`)}
            >
              Inserir código de redefinição
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="cadastro-form">
            <div className="form-group">
              <label className="form-label">Email cadastrado</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Enviando..." : "Enviar código"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push("/login")}
              >
                Voltar para login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

