"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Cadastro() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [genero, setGenero] = useState("");
  const [celular, setCelular] = useState("");
  const [cpf, setCpf] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = () => {
    if (
      !nome ||
      !email ||
      !senha ||
      !dataNascimento ||
      !genero ||
      !celular ||
      !cpf
    ) {
      setError("Por favor, preencha todos os campos");
      return false;
    }

    // email basic check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Email inválido");
      return false;
    }

    // senha min length
    if (senha.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres");
      return false;
    }

    // cpf digits basic check
    if (!/^[0-9]{11}$/.test(cpf.replace(/\D/g, ""))) {
      setError("CPF inválido (use somente números, 11 dígitos)");
      return false;
    }

    // celular basic check (10-11 digits)
    const onlyNums = celular.replace(/\D/g, "");
    if (!/^[0-9]{10,11}$/.test(onlyNums)) {
      setError("Celular inválido (10-11 dígitos)");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      // Aqui você chamaria sua API para criar o usuário.
      // Como esta workspace pode não ter a API configurada, faremos uma simulação.
      await new Promise((res) => setTimeout(res, 900));

      setSuccess(
        "Cadastro realizado com sucesso! Redirecionando para login..."
      );

      // redireciona para a tela de login e preenche o email
      setTimeout(() => {
        router.push(`/login?email=${encodeURIComponent(email)}`);
      }, 900);
    } catch (err: any) {
      setError(err?.message || "Erro ao cadastrar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Cadastro</h3>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input
                type="text"
                className="form-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

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
          </div>

          <div className="form-row">
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

            <div className="form-group">
              <label className="form-label">Data de Nascimento</label>
              <input
                type="date"
                className="form-input"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gênero</label>
              <select
                className="form-select"
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione o gênero
                </option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Celular</label>
              <input
                type="tel"
                className="form-input"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="(xx) xxxxx-xxxx"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">CPF</label>
            <input
              type="text"
              className="form-input"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="Apenas números"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push("/login")}
            >
              Voltar ao Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
