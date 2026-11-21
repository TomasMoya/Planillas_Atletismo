import { Router } from "express";
import multer from "multer";
import { parsearExcel } from "./parser.js";
import { agrupar } from "./grouper.js";
import { crearExcel } from "./writter.js";
export const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.post("/", upload.array("Planillas"), async (req, res) => {
    try {
        const archivos = req.files;
        const participantes = (await Promise.all(archivos.map((arch) => parsearExcel(arch.buffer)))).flat();
        const map = agrupar(participantes);
        const excel = await crearExcel(map);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Planillas_Organizadas.xlsx"');
        res.send(excel);
    }
    catch (e) {
        const mensaje = e instanceof Error ? e.message : "Ocurrió un error inesperado al procesar las planillas.";
        res.status(500).send(mensaje);
    }
});
//# sourceMappingURL=router.js.map