import { Router } from "express";
const router=Router();
router.post("/video-analysis", (_req,res)=>res.status(503).json({error:"Automated clinical video scoring is disabled. Submit evidence for professional review."}));
export default router;
