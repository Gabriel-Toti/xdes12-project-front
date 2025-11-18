"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { user, match } from "@/utils/api";
import Navbar from "@/components/Navbar";

// filepath: /home/zino/projects/xdes12-project-front/src/app/conta/page.tsx



type UserMatch = {
    id_user: string;
    id_property: string;
    number_announcement: number;
    accepted: boolean | null;
    announcement: {
        title: string;
        property: {
            name: string;
            address: string;
            participation?: Array<{
                users: {
                    phone?: string;
                    name?: string;
                };
            }>;
        };
    };
};

export default function Conta() {
    const router = useRouter();
    const [data, setData] = useState<any | null>(null);
    const [userMatches, setUserMatches] = useState<UserMatch[]>([]);
    const [loadingMatches, setLoadingMatches] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const me = await user.me();

            const isTruthy = (v: any) => {
                if (typeof v === "boolean") return v;
                if (typeof v === "number") return v > 0;
                if (typeof v === "string") return ["true", "1", "yes", "sim", "y"].includes(v.toLowerCase());
                return false;
            };

            const fmtDate = (d: any) => {
                if (!d) return "-";
                const date = d instanceof Date ? d : new Date(d);
                return isNaN(date.getTime())
                    ? String(d)
                    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
            };

            const fmtCPF = (c: any) => {
                const only = String(c ?? "").replace(/\D/g, "");
                if (only.length !== 11) return c ?? "-";
                return `${only.slice(0, 3)}.${only.slice(3, 6)}.${only.slice(6, 9)}-${only.slice(9)}`;
            };

            const fmtGender = (g: any) => {
                if (!g) return "-";
                const s = String(g).toLowerCase();
                if (["m", "masc", "masculino", "male"].includes(s)) return "Masculino";
                if (["f", "fem", "feminino", "female"].includes(s)) return "Feminino";
                return String(g);
            };

            const fmtPhone = (p: any): string => {
                if (!p) return "-";
                if (Array.isArray(p)) return p.filter(Boolean).map(fmtPhone).join(" | ");
                if (typeof p === "string" || typeof p === "number") return String(p);
                const country = p.countryCode ?? p.country ?? p.cc ?? "";
                const area = p.areaCode ?? p.area ?? p.ddd ?? "";
                const num = p.number ?? p.phone ?? p.value ?? "";
                let s = "";
                if (country) s += `+${String(country).replace(/^\+/, "")} `;
                if (area) s += `(${area}) `;
                s += num;
                return s.trim() || "-";
            };

            const display = {
                "Nome": me?.name ?? me?.fullName ?? me?.nome ?? "-",
                "Data de nascimento": fmtDate(me?.birthdate ?? me?.birthDate ?? me?.birthday ?? me?.birth_day),
                "E-mail": me?.email ?? me?.mail ?? me?.user?.email ?? "-",
                "CPF": fmtCPF(me?.cpf ?? me?.document ?? me?.cpfNumber),
                "Gênero": fmtGender(me?.gender ?? me?.sexo),
                "Premium": isTruthy(me?.premium ?? me?.isPremium ?? (me?.plan === "premium")) ? "Sim" : "Não",
                "Telefone": fmtPhone(me?.phone ?? me?.telefone ?? me?.phones ?? me?.contact?.phone),
            };

            setData(display);
        } catch (err: any) {
            setError(err?.message || "Erro ao carregar dados do usuário");
        } finally {
            setLoading(false);
        }
    };

    const loadMatches = async () => {
        setLoadingMatches(true);
        try {
            const matches = await match.getAll();
            setUserMatches(matches || []);
        } catch (err: any) {
            console.error("Erro ao carregar matches:", err);
            setUserMatches([]);
        } finally {
            setLoadingMatches(false);
        }
    };

    useEffect(() => {
        load();
        loadMatches();
    }, []);

    const openMatches = userMatches.filter(m => m.accepted === false || m.accepted === null);
    const acceptedMatches = userMatches.filter(m => m.accepted === true);

    return (
        <div className="app">
            <Navbar />
            <main className="app-main">
                <div className="cadastro-page">
                    <div className="cadastro-container">
                        <div className="cadastro-header">
                            <h2>CASAR</h2>
                            <h3>Minha Conta</h3>
                        </div>

                        {loading && <div className="loading-message">Carregando...</div>}
                        {error && <div className="error-message">{error}</div>}
                        {!loading && !error && (
                            <div className="account-content">
                                <table className="account-table">
                                    <tbody>
                                        {data && Object.entries(data).map(([key, value]) => (
                                            <tr key={key} className="px-5">
                                                <th className="text-left px-10">{key}</th>
                                                <td>{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Seção de Matches */}
                        <div style={{ marginTop: "2rem", padding: "1.5rem", background: "#f9fafb", borderRadius: "8px" }}>
                            <h3 style={{ marginBottom: "1rem" }}>Meus Matches</h3>
                            
                            {loadingMatches ? (
                                <div>Carregando matches...</div>
                            ) : (
                                <>
                                    {/* Matches em Aberto */}
                                    {openMatches.length > 0 && (
                                        <div style={{ marginBottom: "1.5rem" }}>
                                            <h4 style={{ marginBottom: "0.75rem", color: "#666" }}>
                                                Matches em Aberto ({openMatches.length})
                                            </h4>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                {openMatches.map((m, idx) => (
                                                    <div key={idx} style={{ padding: "1rem", background: "white", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                                                        <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                                                            {m.announcement.title}
                                                        </div>
                                                        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.25rem" }}>
                                                            <strong>Imóvel:</strong> {m.announcement.property.name}
                                                        </div>
                                                        <div style={{ fontSize: "0.9rem", color: "#666" }}>
                                                            <strong>Endereço:</strong> {m.announcement.property.address}
                                                        </div>
                                                        <div style={{ marginTop: "0.5rem", color: "#9ca3af", fontSize: "0.875rem" }}>
                                                            Aguardando resposta do responsável...
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Matches Aceitos */}
                                    {acceptedMatches.length > 0 && (
                                        <div>
                                            <h4 style={{ marginBottom: "0.75rem", color: "#666" }}>
                                                Matches Aceitos ({acceptedMatches.length})
                                            </h4>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                {acceptedMatches.map((m, idx) => {
                                                    const adminUser = m.announcement.property.participation?.[0]?.users;
                                                    return (
                                                        <div key={idx} style={{ padding: "1rem", background: "#d1fae5", borderRadius: "6px", border: "1px solid #059669" }}>
                                                            <div style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#065f46" }}>
                                                                ✓ {m.announcement.title}
                                                            </div>
                                                            <div style={{ fontSize: "0.9rem", color: "#065f46", marginBottom: "0.25rem" }}>
                                                                <strong>Imóvel:</strong> {m.announcement.property.name}
                                                            </div>
                                                            <div style={{ fontSize: "0.9rem", color: "#065f46", marginBottom: "0.5rem" }}>
                                                                <strong>Endereço:</strong> {m.announcement.property.address}
                                                            </div>
                                                            {adminUser && (
                                                                <div style={{ padding: "0.75rem", background: "white", borderRadius: "4px", border: "1px solid #059669" }}>
                                                                    <div style={{ fontWeight: "600", marginBottom: "0.25rem", color: "#065f46" }}>
                                                                        Contato do Responsável:
                                                                    </div>
                                                                    {adminUser.name && (
                                                                        <div style={{ fontSize: "0.9rem", color: "#065f46", marginBottom: "0.25rem" }}>
                                                                            <strong>Nome:</strong> {adminUser.name}
                                                                        </div>
                                                                    )}
                                                                    {adminUser.phone && (
                                                                        <div style={{ fontSize: "0.9rem", color: "#065f46", fontWeight: "600" }}>
                                                                            📞 <strong>Telefone:</strong> {adminUser.phone}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {openMatches.length === 0 && acceptedMatches.length === 0 && (
                                        <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
                                            Você ainda não possui matches.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="form-actions" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => router.push("/preferencias")}
                            >
                                Preferências
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => router.push("/imoveis")}
                            >
                                Meus Imóveis
                            </button>
                        </div>
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => router.push("/")}
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}