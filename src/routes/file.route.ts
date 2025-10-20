import { Router } from "express";

import { FilesHttpController } from "../controllers/file.http.controller";

const router = Router();
const filesHttpController = new FilesHttpController();

// Listar archivos
router.get("/", filesHttpController.getFilesController);
// Obtener archivo por nombre
router.get("/:name", filesHttpController.getFileByNameController);

export default router;
