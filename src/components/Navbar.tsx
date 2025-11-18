"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { user } from "../utils/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await user.me();
      setCurrentUser(userData);
    } catch (err) {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Chamar endpoint de logout para limpar o cookie httpOnly
      await user.logout();
    } catch (err) {
      // Mesmo se der erro, tenta redirecionar
      console.error("Erro ao fazer logout:", err);
    }
    // Redirecionar para login usando window.location.href para garantir redirecionamento completo
    window.location.href = "/login";
  };

  return (
    <header className="app-header">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ textDecoration: "none", color: "white" }}>
          <h1>CASAR</h1>
        </Link>
        <nav className="nav-menu">
          <Link className={`nav-link ${pathname === "/" ? "active" : ""}`} href="/">
            Home
          </Link>
          {currentUser ? (
            <>
              <Link className={`nav-link ${pathname === "/imoveis" ? "active" : ""}`} href="/imoveis">
                Meus Imóveis
              </Link>
              <Link className={`nav-link ${pathname === "/conta" ? "active" : ""}`} href="/conta">
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="nav-link"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  fontWeight: "inherit",
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link className={`nav-link ${pathname === "/cadastro" ? "active" : ""}`} href="/cadastro">
                Cadastro
              </Link>
              <Link className={`nav-link ${pathname === "/login" ? "active" : ""}`} href="/login">
                Login
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

