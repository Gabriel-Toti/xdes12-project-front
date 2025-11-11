"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LoginDto, AuthResponse } from "../types/index";
import { user } from "../utils/api";

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
      const response: AuthResponse = await user.login({
        email: loginData.email,
        password: loginData.senha,
      });

      router.push("/conta");
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Erro ao fazer login"
      );
    } finally {
      setLoading(false);
    }
  };

export default function Home() {
  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>CASAR</h1>
          <nav className="nav-menu">
            <Link className="nav-link" href="/cadastro">Conta</Link>
            <Link className="nav-link" href="/anuncio">Anúncio</Link>
            <Link className="nav-link" href="/imovel">Imóvel</Link>
            <Link className="nav-link" href="/preferencias">Preferências</Link>
            <Link className="nav-link" href="/">Home</Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <section style={{ maxWidth: 900, margin: "1.5rem auto" }}>
          <h2 className="page-title">Anúncio de exemplo</h2>

          <div className="card">
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 220, height: 140, background: "#f0f0f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
                Foto do imóvel
              </div>

              <div style={{ flex: 1 }}>
                <div className="card-title">Quarto disponível em República Central</div>
                <div className="card-subtitle" style={{ marginBottom: 8 }}>Quarto mobiliado, perto da universidade</div>
                <p style={{ color: "#555", marginBottom: 8 }}>Descrição curta: quarto individual em república com cozinha compartilhada, lavanderia e internet inclusa.</p>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ fontWeight: 700, color: "#333" }}>R$ 900 / mês</div>
                  <div style={{ color: "#666" }}>Vagas: 1</div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <Link href="/anuncio" className="btn btn-primary">Ver anúncio</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}