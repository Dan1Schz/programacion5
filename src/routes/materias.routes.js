import { Router } from "express";   
import {listMaterias, getMaterias, getTareasByMateria, getEventosByMateria, createMateria, replaceMateria, updateMateria, deleteMateria} from "../controllers/materias.controller.js";

const router = Router();
router.get("/",listMaterias);
router.get("/:id", getMaterias);
router.get("/:id/tareas", getTareasByMateria);
router.get("/:id/eventos", getEventosByMateria);
router.post("/", createMateria);
router.put("/:id", replaceMateria);
router.patch("/:id", updateMateria);
router.delete("/:id", deleteMateria);



export default router;