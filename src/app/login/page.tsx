"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LoginDto } from "../../types/index";
import { user, preference } from "../../utils/api";
import { getErrorMessage } from "../../utils/error-handler";

export default function Login() {
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
      await user.login({
        email: loginData.email,
        password: loginData.senha,
      });

      // Verificar se há preferências temporárias no localStorage e sincronizar
      try {
        const tempPrefs = localStorage.getItem('casar_temp_preferences');
        if (tempPrefs) {
          const parsed = JSON.parse(tempPrefs);
          const newPreferences: Array<{ name: string; value: string; weight: number }> = [];
          
          for (const [name, value] of Object.entries(parsed)) {
            if (value) {
              newPreferences.push({ 
                name, 
                value: typeof value === 'string' ? value : Array.isArray(value) ? value.join(", ") : String(value), 
                weight: 1 
              });
            }
          }
          
          if (newPreferences.length > 0) {
            try {
              await preference.create({ preferences: newPreferences });
            } catch (err) {
              // Ignorar erros ao sincronizar preferências
              console.error("Erro ao sincronizar preferências:", err);
            }
          }
          
          localStorage.removeItem('casar_temp_preferences');
        }
      } catch (err) {
        // Ignorar erros do localStorage
      }

      // Redirecionar para a URL especificada ou para /conta
      const redirect = searchParams.get("redirect");
      router.push(redirect || "/conta");
    } catch (err: any) {
      setError(getErrorMessage(err, "Erro ao fazer login"));
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
            <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => router.push("/recuperar-senha")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#667eea",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  textDecoration: "underline"
                }}
              >
                Esqueci minha senha
              </button>
            </div>
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
