import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import { router } from "./router.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/procesar", (req, res, next) => {
    console.log("Método:", req.method, "Path:", req.path);
    next();
});
const ruta = app.use("/procesar", router);
ruta.listen(3000, () => {
    console.log("Escuchando al puerto 3000");
});
//# sourceMappingURL=index.js.map