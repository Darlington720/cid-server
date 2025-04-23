import { Router } from "express";
import { getModules } from "../helpers/modules.js";

const router = Router();

router.get("/", async (req, res) => {
  const modules = await getModules();
  res.send({
    success: true,
    result: modules,
  });
});

export default router;
