import { Participante } from "./Models/models.js";
import JSZip from "jszip";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsZip = new JSZip();

const disciplinasASheet: Record<string, string> = {
    "60M": "xl/worksheets/sheet1.xml",
    "80M": "xl/worksheets/sheet2.xml",
    "100M": "xl/worksheets/sheet3.xml",
    "150M": "xl/worksheets/sheet4.xml",
    "200M": "xl/worksheets/sheet5.xml",
    "300M": "xl/worksheets/sheet6.xml",
    "400M": "xl/worksheets/sheet7.xml",
    "600M": "xl/worksheets/sheet8.xml",
    "800M": "xl/worksheets/sheet9.xml",
    "1000M": "xl/worksheets/sheet10.xml",
    "1200M": "xl/worksheets/sheet11.xml",
    "1500M": "xl/worksheets/sheet12.xml",
    "2400M": "xl/worksheets/sheet13.xml",
    "3000M": "xl/worksheets/sheet14.xml",
    "BALA": "xl/worksheets/sheet15.xml",
    "DISCO": "xl/worksheets/sheet16.xml",
    "JABA": "xl/worksheets/sheet17.xml",
    "MART": "xl/worksheets/sheet18.xml",
    "S.L.": "xl/worksheets/sheet19.xml",
    "S.T.": "xl/worksheets/sheet20.xml",
    "S.A.": "xl/worksheets/sheet21.xml",
    "S.G.": "xl/worksheets/sheet22.xml"
}

const celdasCatYSexo: Record<string, { cat: string, sexo: string }> = {
    "60M":   { cat: "D3", sexo: "F3" },
    "80M":   { cat: "D3", sexo: "F3" },
    "100M":  { cat: "D3", sexo: "F3" },
    "150M":  { cat: "D3", sexo: "F3" },
    "200M":  { cat: "D3", sexo: "F3" },
    "300M":  { cat: "D3", sexo: "F3" },
    "400M":  { cat: "D3", sexo: "F3" },
    "600M":  { cat: "D3", sexo: "F3" },
    "800M":  { cat: "D3", sexo: "F3" },
    "1000M": { cat: "D3", sexo: "F3" },
    "1200M": { cat: "D3", sexo: "F3" },
    "1500M": { cat: "D3", sexo: "F3" },
    "2400M": { cat: "D3", sexo: "F3" },
    "3000M": { cat: "D3", sexo: "F3" },
    "BALA":  { cat: "H3", sexo: "K3" },
    "DISCO": { cat: "H3", sexo: "K3" },
    "JABA":  { cat: "H3", sexo: "K3" },
    "MART":  { cat: "H3", sexo: "K3" },
    "S.L.":  { cat: "H3", sexo: "K3" },
    "S.T.":  { cat: "H3", sexo: "K3" },
    "S.A.":  { cat: "W3", sexo: "AM3" },
    "S.G.":  { cat: "W3", sexo: "AM3" }
}

const carrerasCortas = ["60M", "80M", "100M", "150M", "200M", "300M", "400M"];

const carrerasLargas = ["600M", "800M", "1000M", "1200M", "1500M", "2400M", "3000M"];

const lanzamientosYSaltos = ["BALA", "DISCO", "JABA", "MART", "S.L.", "S.T.", "S.A.", "S.G."];

function insertarAtletaEnFila(xml: string, numFila: number, atleta: Participante): string{
    const filaXml = `<row r="${numFila}" spans="1:7" x14ac:dyDescent="0.25"><c r="A${numFila}" s="13"/><c r="B${numFila}" s="13" t="inlineStr"><is><t>${atleta.nombre}</t></is></c><c r="C${numFila}" s="13" t="inlineStr"><is><t>${atleta.fNac}</t></is></c><c r="D${numFila}" s="13" t="inlineStr"><is><t>${atleta.institucion}</t></is></c><c r="E${numFila}" s="13"/><c r="F${numFila}" s="13"/><c r="G${numFila}" s="13"/></row>`;
    const regex = new RegExp(`<row r="${numFila}"[^>]*>.*?<\\/row>`, "s");
    return xml.replace(regex, filaXml);
}

function insertarValorEnCelda(xml: string, celda: string, valor: string, campo: string): string {
    const regexVacia = new RegExp(`<c r="${celda}"([^>]*)/>`, "s");
    const regexConContenido = new RegExp(`<c r="${celda}"([^>]*)>.*?</c>`, "s");
    
    const match = xml.match(regexVacia) || xml.match(regexConContenido);
    if (!match) return xml;
    
    const nuevaCelda = `<c r="${celda}" t="inlineStr"><is><t>${campo}${valor}</t></is></c>`;
    return xml.replace(match[0], nuevaCelda);
}

export async function crearExcel(map: Map<string, Participante[]>): Promise<Buffer> {
    const data = await fs.promises.readFile(path.join(__dirname, "Predetermined_Sheet", "PLANILLAS.xlsx"));
    const zip = await jsZip.loadAsync(data);

    let sheetCounter = 100;
    for (const [key, value] of map) {
        const disc = key.substring(0, key.indexOf("_"))
        const cat = key.substring(key.indexOf("_") + 1, key.lastIndexOf("_"))
        const sexo = key.substring(key.lastIndexOf("_") + 1)
        const path = disciplinasASheet[disc]
        if (!path) throw new Error(`La disciplina ${disc} no coincide con ninguna disciplina de la planilla`)
        let sheet = await zip.files[path]!.async("string");
    
        const celdas = celdasCatYSexo[disc];
        if (celdas) {
            sheet = insertarValorEnCelda(sheet, celdas.cat, cat, "CAT: ");
            sheet = insertarValorEnCelda(sheet, celdas.sexo, sexo, "SEXO: ");
        }

        if (carrerasCortas.includes(disc)){
            let atletaIndex = 0;
            for (let i = 6; atletaIndex < value.length && atletaIndex < 24;) {
                for (let x = 0; x < 6 && atletaIndex < value.length; x++) {
                    sheet = insertarAtletaEnFila(sheet, i, value[atletaIndex]!);
                    atletaIndex++;
                    i++;
                }
                i += 5;
            }
        } else if (carrerasLargas.includes(disc)) {
            let numFila = 6;
            value.forEach((atleta: Participante) => {
                sheet = insertarAtletaEnFila(sheet, numFila, atleta);
                numFila++;
            })
        } else if (lanzamientosYSaltos.includes(disc)) {
            let numFila = 5;
            value.forEach((atleta: Participante) => {
                sheet = insertarAtletaEnFila(sheet, numFila, atleta);
                numFila++;
            })
        } else {
            throw new Error("Ocurrió un error");
        }
        
        const newSheetPath = `xl/worksheets/sheet${sheetCounter}.xml`
        zip.file(newSheetPath, sheet);

        let rels = await zip.files["xl/_rels/workbook.xml.rels"]!.async("string");
        const newRel = `<Relationship Id="rId${sheetCounter}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheetCounter}.xml"/>`;
        rels = rels.replace("</Relationships>", `${newRel}</Relationships>`);
        zip.file("xl/_rels/workbook.xml.rels", rels);

        let workbookXml = await zip.files["xl/workbook.xml"]!.async("string");
        const newSheet = `<sheet name="${key}" sheetId="${sheetCounter}" r:id="rId${sheetCounter}"/>`;
        workbookXml = workbookXml.replace("</sheets>", `${newSheet}</sheets>`);
        zip.file("xl/workbook.xml", workbookXml);

        sheetCounter++;
    }

    return await zip.generateAsync({ type: "nodebuffer" });
}