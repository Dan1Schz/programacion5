import { Router } from "express";   
<<<<<<< HEAD
import {listMaterias, getMaterias, getTareasByMateria, createMateria, replaceMateria, updateMateria, deleteMateria} from "../controllers/materias.controller.js";
=======
import {listMaterias, getMaterias, createMateria, replaceMateria, updateMateria, deleteMateria} from "../controllers/materias.controller.js";
>>>>>>> beae233a744cd909d52ec1bb58860408155235be

const router = Router();
router.get("/",listMaterias);
router.get("/:id", getMaterias);
<<<<<<< HEAD
router.get("/:id/tareas", getTareasByMateria);
=======
>>>>>>> beae233a744cd909d52ec1bb58860408155235be
router.post("/", createMateria);
router.put("/:id", replaceMateria);
router.patch("/:id", updateMateria);
router.delete("/:id", deleteMateria);



export default router;