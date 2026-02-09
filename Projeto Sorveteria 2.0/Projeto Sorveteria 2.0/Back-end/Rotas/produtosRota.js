import express from "express";
import {
  cadastrarProduto,
  listarProdutos,
  deletarProduto
} from "../controladores/produtoControle.js";

const router = express.Router();

router.post("/", cadastrarProduto);
router.get("/", listarProdutos);
router.delete("/:id", deletarProduto);

export default router;
