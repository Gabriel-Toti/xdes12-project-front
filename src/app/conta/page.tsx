"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { user } from "@/utils/api";

// filepath: /home/zino/projects/xdes12-project-front/src/app/conta/page.tsx



export default function Conta() {
    const router = useRouter();
    const [data, setData] = useState<any | null>(null);
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

    useEffect(() => {
        load();
    }, []);

    return (
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
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => router.push("/preferencias")}
                    >
                        Preferências
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
    );
}