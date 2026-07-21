import { Participante } from "./Models/models.js";

export function agrupar(participantes: Participante[]): Map<string, Participante[]> {
    const map: Map<string, Participante[]> = new Map<string, Participante[]>();

    participantes.forEach((participante) => {
        participante.disciplinas.forEach((dis) => {
            let combinacion = (dis + "_" + participante.categoria + "_" + participante.sexo).replaceAll(" ", "")
            
            const array = map.get(combinacion);
            if (array) {
                array.push(participante)
            } else {
                map.set(combinacion, [participante])
            }
        })
    })

    return map;
}