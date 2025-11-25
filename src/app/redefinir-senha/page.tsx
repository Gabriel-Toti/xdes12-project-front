"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { user } from "@/utils/api";
import { getErrorMessage } from "@/utils/error-handler";

export default function RedefinirSenha() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialCode = searchParams.get("code") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialCode) setCode(initialCode);
  }, [initialEmail, initialCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !code || !password || !confirmPassword) {
      setError("Preencha todos os campos para continuar.");
      return;
    }

    if (password !== confirmPassword) {
      setError("A confirmação precisa ser igual à nova senha.");
      return;
    }

    try {
      setLoading(true);
      await user.resetPassword({ email, code, password });
      setSuccess(true);
    } catch (err: any) {
      setError(getErrorMessage(err, "Não foi possível redefinir a senha."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Redefinir senha</h3>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <p>Senha redefinida com sucesso! Faça login novamente.</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: "1rem" }}
              onClick={() => router.push(`/login?email=${encodeURIComponent(email)}`)}
            >
              Ir para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="cadastro-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Código de verificação</label>
              <input
                type="text"
                className="form-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nova senha</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar nova senha</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : "Redefinir senha"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push("/recuperar-senha")}
              >
                Voltar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

