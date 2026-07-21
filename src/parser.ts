import ExcelJS, {type Cell, type Row } from "exceljs";
import { type Participante } from "./Models/models.js"

function getCellText(cell: Cell): string{
    if (cell.value != null && cell.type === ExcelJS.ValueType.RichText) {
        const valorCelda = (cell.value as ExcelJS.CellRichTextValue).richText;
        return valorCelda.map(rt => rt.text).join("");
    } else if (cell.value === null) {
        return "";
    } else {
        return String(cell.value)
    }
}

export async function parsearExcel(file: Buffer): Promise<Participante[]> {
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.load(file.buffer as ArrayBuffer)

        const participantes: Participante[] = [];

        workbook.eachSheet((worksheet) => {
            const excelCategoria = worksheet.name.replace(".", "");
            let excelInstitucion = "";
            let excelProfesor = "";
            let headerRowIndex = -1;
            let disciplinas: {column: number, nombre: string}[] = [];

            worksheet.eachRow((row: Row, rowNumber: number) => {
                const headerAntes = headerRowIndex;
                
                row.eachCell((cell: Cell, cellNumber: number) => {
                    if (getCellText(cell).includes("INSTITUCION:")) {
                        if (getCellText(cell).trim() === "INSTITUCION:"){
                            excelInstitucion = getCellText(row.getCell(cellNumber + 1))
                        } else {
                            excelInstitucion = getCellText(cell).trim().replace("INSTITUCION:" , "")
                        }
                    } else if (getCellText(cell).includes("PROFESOR/A:")) {
                        if (getCellText(cell).trim() === "PROFESOR/A:"){
                            excelProfesor = getCellText(row.getCell(cellNumber + 1))
                        } else {
                            excelProfesor = getCellText(cell).trim().replace("PROFESOR/A:" , "")
                        }
                    } else if (getCellText(cell).includes("ATLETA")) {
                        headerRowIndex = rowNumber;
                    }
                })

                if (headerRowIndex !== headerAntes) {
                    let pasaronFNac = false;
                    row.eachCell((cell: Cell, cellNumber: number) => {
                        if (getCellText(cell).includes("F. NAC")) {
                            pasaronFNac = true;
                        } else if (pasaronFNac && getCellText(cell) !== "") {
                            disciplinas.push({ column: cellNumber, nombre: getCellText(cell) });
                        }
                    })
                } else if (headerRowIndex > 0){
                    if (getCellText(row.getCell(2)) !== "") {
                        const atleta: Participante = { institucion: excelInstitucion,
                        profesor: excelProfesor,
                        sexo: getCellText(row.getCell(1)).trim().toUpperCase() as "F" | "M",
                        nombre: getCellText(row.getCell(2)),
                        fNac: getCellText(row.getCell(3)),
                        categoria: excelCategoria,
                        disciplinas: []
                        }
                        row.eachCell((cell: Cell, cellNumber: number) => {
                            if (getCellText(cell).toUpperCase() === "X"){
                                atleta.disciplinas.push(disciplinas.find((p) => p.column === cellNumber)!.nombre)
                            }
                        })

                        participantes.push(atleta)
                    }
                }
            })
        })

        return participantes
    } catch (e) {
        throw new Error("El proceso de parseo falló");
    }
}