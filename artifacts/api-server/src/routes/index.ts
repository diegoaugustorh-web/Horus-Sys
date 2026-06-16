import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientesRouter from "./clientes";
import produtosRouter from "./produtos";
import apolicesRouter from "./apolices";
import oportunidadesRouter from "./oportunidades";
import sinistrosRouter from "./sinistros";
import comissoesRouter from "./comissoes";
import consorciosRouter from "./consorcios";
import reunioesRouter from "./reunioes";
import usuariosRouter from "./usuarios";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/clientes", clientesRouter);
router.use("/produtos", produtosRouter);
router.use("/apolices", apolicesRouter);
router.use("/oportunidades", oportunidadesRouter);
router.use("/sinistros", sinistrosRouter);
router.use("/comissoes", comissoesRouter);
router.use("/consorcios", consorciosRouter);
router.use("/reunioes", reunioesRouter);
router.use("/usuarios", usuariosRouter);
router.use("/dashboard", dashboardRouter);

export default router;
