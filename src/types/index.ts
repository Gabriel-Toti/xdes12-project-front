export interface Usuario {
    id: string;
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    genero: string;
    senha?: string;
    dataNascimento: string;
    tipo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUsuarioDto {
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
    genero: string;
    senha: string;
    dataNascimento: string;
    tipo: boolean;
}

export interface UpdateUsuarioDto {
    nome?: string;
    email?: string;
    telefone?: string;
    senha?: string;
    dataNascimento?: string;
    tipo?: boolean;
}

export interface LoginDto {
    email: string;
    senha: string;
}

export interface PreferenceEntry {
    name: string;
    value: string;
    weight: number;
}
