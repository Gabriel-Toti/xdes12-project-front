"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LoginDto, AuthResponse } from "../types/index";
import { authApi } from "../utils/api";

export function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !senha) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    try {
      setLoading(true);
      const loginData: LoginDto = { email, senha };
      const response: AuthResponse = await authApi.login(loginData);

      if (!response || !response.token) {
        setError("Erro ao autenticar: resposta inválida do servidor");
        return;
      }

      localStorage.setItem("token", response.token);
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      router.push("/conta");
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Erro ao fazer login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Login</h3>
        </div>

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
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>

          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                router.push("/cadastro");
              }}
            >
              Cadastre-se aqui
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;