export interface Participante {
    institucion: string;
    profesor: string;
    sexo: "F" | "M";
    nombre: string;
    fNac: string;
    categoria: string;
    disciplinas: string[];
}

export interface DisciplinasCategorias {
    disciplina: string;
    categoria: string;
    sexo: "F" | "M";
}   