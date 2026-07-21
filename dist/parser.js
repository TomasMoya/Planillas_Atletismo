import ExcelJS from "exceljs";
function getCellText(cell) {
    if (cell.value != null && cell.type === 8 /* ExcelJS.ValueType.RichText */) {
        const valorCelda = cell.value.richText;
        return valorCelda.map(rt => rt.text).join("");
    }
    else if (cell.value === null) {
        return "";
    }
    else {
        return String(cell.value);
    }
}
export async function parsearExcel(file) {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.load(file.buffer);
        const participantes = [];
        workbook.eachSheet((worksheet) => {
            const excelCategoria = worksheet.name.replace(".", "");
            let excelInstitucion = "";
            let excelProfesor = "";
            let headerRowIndex = -1;
            let disciplinas = [];
            worksheet.eachRow((row, rowNumber) => {
                const headerAntes = headerRowIndex;
                row.eachCell((cell, cellNumber) => {
                    if (getCellText(cell).includes("INSTITUCION:")) {
                        if (getCellText(cell).trim() === "INSTITUCION:") {
                            excelInstitucion = getCellText(row.getCell(cellNumber + 1));
                        }
                        else {
                            excelInstitucion = getCellText(cell).trim().replace("INSTITUCION:", "");
                        }
                    }
                    else if (getCellText(cell).includes("PROFESOR/A:")) {
                        if (getCellText(cell).trim() === "PROFESOR/A:") {
                            excelProfesor = getCellText(row.getCell(cellNumber + 1));
                        }
                        else {
                            excelProfesor = getCellText(cell).trim().replace("PROFESOR/A:", "");
                        }
                    }
                    else if (getCellText(cell).includes("ATLETA")) {
                        headerRowIndex = rowNumber;
                    }
                });
                if (headerRowIndex !== headerAntes) {
                    let pasaronFNac = false;
                    row.eachCell((cell, cellNumber) => {
                        if (getCellText(cell).includes("F. NAC")) {
                            pasaronFNac = true;
                        }
                        else if (pasaronFNac && getCellText(cell) !== "") {
                            disciplinas.push({ column: cellNumber, nombre: getCellText(cell) });
                        }
                    });
                }
                else if (headerRowIndex > 0) {
                    if (getCellText(row.getCell(2)) !== "") {
                        const atleta = { institucion: excelInstitucion,
                            profesor: excelProfesor,
                            sexo: getCellText(row.getCell(1)).trim().toUpperCase(),
                            nombre: getCellText(row.getCell(2)),
                            fNac: getCellText(row.getCell(3)),
                            categoria: excelCategoria,
                            disciplinas: [] };
                        row.eachCell((cell, cellNumber) => {
                            if (getCellText(cell).toUpperCase() === "X") {
                                atleta.disciplinas.push(disciplinas.find((p) => p.column === cellNumber).nombre);
                            }
                        });
                        participantes.push(atleta);
                    }
                }
            });
        });
        return participantes;
    }
    catch (e) {
        throw new Error("El proceso de parseo falló");
    }
}
//# sourceMappingURL=parser.js.map