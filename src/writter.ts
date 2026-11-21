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

// Cantidad de atletas por serie en las carreras cortas (60M-400M).
const ATLETAS_POR_SERIE = 6;

// Filas de separación visual entre el final de una serie y el encabezado de la siguiente,
// tal como están armadas en la plantilla oficial (PLANILLAS.xlsx).
const FILAS_DE_SEPARACION_ENTRE_SERIES = 3;

const PRIMERA_FILA_SERIES = 4;

function escaparXml(valor: string): string {
    return valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Reemplaza el valor de una celda puntual dentro de un fragmento de XML (una fila, o la hoja
// entera), preservando cualquier atributo que ya tuviera (sobre todo "s", el estilo/borde) para
// no romper el formato de tabla del resto de la fila.
function actualizarCeldaEnXml(xml: string, celda: string, valor: string): string {
    const regexVacia = new RegExp(`<c r="${celda}"([^>]*)/>`, "s");
    const regexConContenido = new RegExp(`<c r="${celda}"([^>]*)>.*?</c>`, "s");

    const match = xml.match(regexVacia) || xml.match(regexConContenido);
    if (!match) return xml;

    const atributos = (match[1] ?? "").replace(/\s*t="[^"]*"/, "");
    const nuevaCelda = `<c r="${celda}"${atributos} t="inlineStr"><is><t>${escaparXml(valor)}</t></is></c>`;
    return xml.replace(match[0], nuevaCelda);
}

function insertarAtletaEnFila(xml: string, numFila: number, atleta: Participante): string {
    const filaOriginal = extraerFila(xml, numFila);
    if (!filaOriginal) {
        throw new Error(`No se pudo ubicar la fila ${numFila} en la planilla para insertar a "${atleta.nombre}". El atleta no fue incluido.`);
    }

    let filaNueva = filaOriginal;
    filaNueva = actualizarCeldaEnXml(filaNueva, `B${numFila}`, atleta.nombre);
    filaNueva = actualizarCeldaEnXml(filaNueva, `C${numFila}`, atleta.fNac);
    filaNueva = actualizarCeldaEnXml(filaNueva, `D${numFila}`, atleta.institucion);

    const regex = new RegExp(`<row r="${numFila}"[^>]*?/>|<row r="${numFila}"[^>]*>.*?<\\/row>`, "s");
    return xml.replace(regex, filaNueva);
}

function insertarValorEnCelda(xml: string, celda: string, valor: string, campo: string): string {
    return actualizarCeldaEnXml(xml, celda, `${campo}${valor}`);
}

// ─── Utilidades genéricas para hacer crecer una hoja más allá de lo que trae la plantilla ───

function extraerFila(xml: string, numFila: number): string | null {
    const regex = new RegExp(`<row r="${numFila}"[^>]*?/>|<row r="${numFila}"[^>]*>.*?<\\/row>`, "s");
    const match = xml.match(regex);
    return match ? match[0] : null;
}

function eliminarFila(xml: string, numFila: number): string {
    const regex = new RegExp(`<row r="${numFila}"[^>]*?/>|<row r="${numFila}"[^>]*>.*?<\\/row>`, "s");
    return xml.replace(regex, "");
}

function renumerarFila(filaXml: string, numFilaOriginal: number, numFilaNueva: number): string {
    let resultado = filaXml.replace(`<row r="${numFilaOriginal}"`, `<row r="${numFilaNueva}"`);
    const regexCelda = new RegExp(`r="([A-Z]+)${numFilaOriginal}"`, "g");
    resultado = resultado.replace(regexCelda, (_match, col) => `r="${col}${numFilaNueva}"`);
    return resultado;
}

function agregarFilaAlFinalDeSheetData(xml: string, filaXml: string): string {
    return xml.replace("</sheetData>", `${filaXml}</sheetData>`);
}

function actualizarDimension(xml: string, nuevaUltimaFila: number): string {
    return xml.replace(/<dimension ref="A1:([A-Z]+)\d+"\/>/, (_m, col) => `<dimension ref="A1:${col}${nuevaUltimaFila}"/>`);
}

function moverMergeCell(xml: string, filaOriginal: number, filaNueva: number): string {
    const regex = new RegExp(`<mergeCell ref="([A-Z]+)${filaOriginal}:([A-Z]+)${filaOriginal}"/>`, "g");
    return xml.replace(regex, (_m, c1, c2) => `<mergeCell ref="${c1}${filaNueva}:${c2}${filaNueva}"/>`);
}

function obtenerNumerosDeFilaDesde(xml: string, desde: number): number[] {
    const regex = /<row r="(\d+)"/g;
    const numeros: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(xml)) !== null) {
        const n = parseInt(match[1]!, 10);
        if (n >= desde) numeros.push(n);
    }
    return numeros.sort((a, b) => a - b);
}

// Detecta, a partir de la fila donde empiezan los datos, hasta dónde llega el bloque de filas
// en blanco para atletas (filas consecutivas) y cuáles son las filas de "pie" (firmas, etc.)
// que vienen después de un salto. Si no hay salto, la hoja no tiene pie (ej: carreras largas).
function detectarEstructura(sheet: string, filaInicio: number): { ultimaFilaDatos: number, filasPie: number[] } {
    const numeros = obtenerNumerosDeFilaDesde(sheet, filaInicio);
    let ultimaFilaDatos = filaInicio - 1;
    let i = 0;
    while (i < numeros.length && numeros[i] === ultimaFilaDatos + 1) {
        ultimaFilaDatos = numeros[i]!;
        i++;
    }
    return { ultimaFilaDatos, filasPie: numeros.slice(i) };
}

// Construye la lista de atletas para carreras largas, lanzamientos y saltos: si hay más atletas
// que filas en blanco en la plantilla, agrega filas nuevas (clonando el estilo de la plantilla)
// y, si existe un "pie" (fila de firmas) después de los datos, lo corre hacia abajo para que no
// se pise con los datos nuevos.
function construirListaDinamica(sheet: string, atletas: Participante[], filaInicio: number): string {
    const { ultimaFilaDatos, filasPie } = detectarEstructura(sheet, filaInicio);
    const capacidadBase = ultimaFilaDatos - filaInicio + 1;
    const filasFaltantes = Math.max(0, atletas.length - capacidadBase);

    if (filasFaltantes > 0) {
        const filaBlancoPlantilla = extraerFila(sheet, ultimaFilaDatos);
        if (!filaBlancoPlantilla) {
            throw new Error(`No se encontró una fila de referencia (${ultimaFilaDatos}) para expandir la planilla.`);
        }

        if (filasPie.length > 0) {
            const filasPieXml = filasPie.map(n => extraerFila(sheet, n)!);
            filasPie.forEach(n => { sheet = eliminarFila(sheet, n); });

            for (let i = 0; i < filasFaltantes; i++) {
                const nuevaFila = renumerarFila(filaBlancoPlantilla, ultimaFilaDatos, ultimaFilaDatos + 1 + i);
                sheet = agregarFilaAlFinalDeSheetData(sheet, nuevaFila);
            }

            filasPie.forEach((filaOriginal, idx) => {
                const filaNueva = filaOriginal + filasFaltantes;
                const filaCorrida = renumerarFila(filasPieXml[idx]!, filaOriginal, filaNueva);
                sheet = agregarFilaAlFinalDeSheetData(sheet, filaCorrida);
                sheet = moverMergeCell(sheet, filaOriginal, filaNueva);
            });

            sheet = actualizarDimension(sheet, Math.max(...filasPie) + filasFaltantes);
        } else {
            for (let i = 0; i < filasFaltantes; i++) {
                const nuevaFila = renumerarFila(filaBlancoPlantilla, ultimaFilaDatos, ultimaFilaDatos + 1 + i);
                sheet = agregarFilaAlFinalDeSheetData(sheet, nuevaFila);
            }
            sheet = actualizarDimension(sheet, ultimaFilaDatos + filasFaltantes);
        }
    }

    let numFila = filaInicio;
    atletas.forEach((atleta) => {
        sheet = insertarAtletaEnFila(sheet, numFila, atleta);
        numFila++;
    });

    return sheet;
}

// ─── Carreras cortas: series de ATLETAS_POR_SERIE (andariveles) ───

function filaDatosVacia(numFila: number): string {
    return `<row r="${numFila}" spans="1:7" x14ac:dyDescent="0.3"><c r="A${numFila}" s="7"/><c r="B${numFila}" s="7"/><c r="C${numFila}" s="7"/><c r="D${numFila}" s="7"/><c r="E${numFila}" s="7"/><c r="F${numFila}" s="7"/><c r="G${numFila}" s="7"/></row>`;
}

function filaCabeceraSerie(numFila: number, primerBloque: boolean): string {
    const estiloA = primerBloque ? 25 : 26;
    const estiloB = primerBloque ? 25 : 27;
    return `<row r="${numFila}" spans="1:7" x14ac:dyDescent="0.3"><c r="A${numFila}" s="${estiloA}" t="s"><v>4</v></c><c r="B${numFila}" s="${estiloB}"/><c r="C${numFila}" s="3" t="s"><v>5</v></c><c r="D${numFila}" s="4"/><c r="E${numFila}" s="4"/><c r="F${numFila}" s="4"/><c r="G${numFila}" s="5"/></row>`;
}

function filaSubcabeceraSerie(numFila: number): string {
    return `<row r="${numFila}" spans="1:7" x14ac:dyDescent="0.3"><c r="A${numFila}" s="6" t="s"><v>12</v></c><c r="B${numFila}" s="6" t="s"><v>6</v></c><c r="C${numFila}" s="6" t="s"><v>7</v></c><c r="D${numFila}" s="6" t="s"><v>8</v></c><c r="E${numFila}" s="6" t="s"><v>9</v></c><c r="F${numFila}" s="6" t="s"><v>10</v></c><c r="G${numFila}" s="7"/></row>`;
}

function eliminarMergeCellDeFila(xml: string, numFila: number): string {
    const regex = new RegExp(`<mergeCell ref="[A-Z]+${numFila}:[A-Z]+${numFila}"/>`);
    return xml.replace(regex, "");
}

function actualizarContadorMergeCells(xml: string, delta: number): string {
    return xml.replace(/<mergeCells count="(\d+)">/, (_m, n) => `<mergeCells count="${parseInt(n, 10) + delta}">`);
}

// Intercala a los atletas por institución (round-robin) para que las primeras series no queden
// compuestas únicamente por atletas de una misma institución. El orden de las instituciones se
// mantiene por orden de aparición y, dentro de cada institución, se respeta el orden original.
// Si una institución tiene muchos más atletas que las demás, las últimas series inevitablemente
// quedarán compuestas solo por esa institución (se revisa y acomoda manualmente después).
function intercalarPorInstitucion(atletas: Participante[]): Participante[] {
    const grupos = new Map<string, Participante[]>();
    for (const atleta of atletas) {
        const grupo = grupos.get(atleta.institucion);
        if (grupo) {
            grupo.push(atleta);
        } else {
            grupos.set(atleta.institucion, [atleta]);
        }
    }

    const listas = [...grupos.values()];
    const maxLargo = Math.max(0, ...listas.map(l => l.length));
    const resultado: Participante[] = [];
    for (let i = 0; i < maxLargo; i++) {
        for (const lista of listas) {
            if (i < lista.length) resultado.push(lista[i]!);
        }
    }
    return resultado;
}

// Reconstruye por completo el bloque de series (desde PRIMERA_FILA_SERIES en adelante), sin
// depender de cuántos bloques trajera la plantilla: genera tantas series de ATLETAS_POR_SERIE
// como hagan falta para no dejar a ningún atleta afuera.
function construirSeriesCarrerasCortas(sheet: string, atletasOriginal: Participante[]): string {
    const atletas = intercalarPorInstitucion(atletasOriginal);
    const filasOriginales = obtenerNumerosDeFilaDesde(sheet, PRIMERA_FILA_SERIES);
    const filasHeaderOriginales = filasOriginales.filter(n =>
        new RegExp(`<mergeCell ref="[A-Z]+${n}:[A-Z]+${n}"/>`).test(sheet)
    );

    filasOriginales.forEach(n => { sheet = eliminarFila(sheet, n); });
    filasHeaderOriginales.forEach(n => { sheet = eliminarMergeCellDeFila(sheet, n); });
    sheet = actualizarContadorMergeCells(sheet, -filasHeaderOriginales.length);

    const numSeries = Math.max(1, Math.ceil(atletas.length / ATLETAS_POR_SERIE));
    let fila = PRIMERA_FILA_SERIES;
    let nuevasFilasXml = "";
    let nuevosMergesXml = "";

    for (let serie = 0; serie < numSeries; serie++) {
        const filaHeader = fila;
        nuevasFilasXml += filaCabeceraSerie(filaHeader, serie === 0);
        nuevosMergesXml += `<mergeCell ref="A${filaHeader}:B${filaHeader}"/>`;
        fila++;

        nuevasFilasXml += filaSubcabeceraSerie(fila);
        fila++;

        for (let i = 0; i < ATLETAS_POR_SERIE; i++) {
            nuevasFilasXml += filaDatosVacia(fila);
            fila++;
        }

        for (let i = 0; i < FILAS_DE_SEPARACION_ENTRE_SERIES; i++) {
            nuevasFilasXml += filaDatosVacia(fila);
            fila++;
        }
    }

    sheet = agregarFilaAlFinalDeSheetData(sheet, nuevasFilasXml);
    sheet = sheet.replace("</mergeCells>", `${nuevosMergesXml}</mergeCells>`);
    sheet = actualizarContadorMergeCells(sheet, numSeries);
    sheet = actualizarDimension(sheet, fila - 1);

    let atletaIndex = 0;
    let filaActual = PRIMERA_FILA_SERIES;
    for (let serie = 0; serie < numSeries && atletaIndex < atletas.length; serie++) {
        filaActual += 2; // saltar cabecera + subcabecera de la serie
        for (let i = 0; i < ATLETAS_POR_SERIE && atletaIndex < atletas.length; i++) {
            sheet = insertarAtletaEnFila(sheet, filaActual, atletas[atletaIndex]!);
            atletaIndex++;
            filaActual++;
        }
        filaActual += FILAS_DE_SEPARACION_ENTRE_SERIES;
    }

    return sheet;
}

export async function crearExcel(map: Map<string, Participante[]>): Promise<Buffer> {
    const data = await fs.promises.readFile(path.join(__dirname, "Predetermined_Sheet", "PLANILLAS.xlsx"));
    const zip = await jsZip.loadAsync(data);

    let sheetCounter = 100;
    for (const [key, value] of map) {
        const disc = key.substring(0, key.indexOf("_"))
        const cat = key.substring(key.indexOf("_") + 1, key.lastIndexOf("_"))
        const sexo = key.substring(key.lastIndexOf("_") + 1)
        const sheetPath = disciplinasASheet[disc]
        if (!sheetPath) throw new Error(`La disciplina ${disc} no coincide con ninguna disciplina de la planilla`)
        let sheet = await zip.files[sheetPath]!.async("string");

        const celdas = celdasCatYSexo[disc];
        if (celdas) {
            sheet = insertarValorEnCelda(sheet, celdas.cat, cat, "CAT: ");
            sheet = insertarValorEnCelda(sheet, celdas.sexo, sexo, "SEXO: ");
        }

        if (carrerasCortas.includes(disc)) {
            sheet = construirSeriesCarrerasCortas(sheet, value);
        } else if (carrerasLargas.includes(disc)) {
            sheet = construirListaDinamica(sheet, value, 6);
        } else if (lanzamientosYSaltos.includes(disc)) {
            sheet = construirListaDinamica(sheet, value, 5);
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
