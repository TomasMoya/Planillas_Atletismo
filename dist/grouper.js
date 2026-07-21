export function agrupar(participantes) {
    const map = new Map();
    participantes.forEach((participante) => {
        participante.disciplinas.forEach((dis) => {
            let combinacion = (dis + "_" + participante.categoria + "_" + participante.sexo).replaceAll(" ", "");
            const array = map.get(combinacion);
            if (array) {
                array.push(participante);
            }
            else {
                map.set(combinacion, [participante]);
            }
        });
    });
    return map;
}
//# sourceMappingURL=grouper.js.map