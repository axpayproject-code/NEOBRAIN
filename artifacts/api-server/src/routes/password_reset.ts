import {Router} from "express";
import {db,usersTable,passwordResetTokensTable,sessionsTable} from "@workspace/db";
import {eq,and} from "drizzle-orm";
import {randomBytes,scryptSync,createHash,timingSafeEqual} from "node:crypto";
import {sendEmail} from "../lib/email";
const router=Router();
const tokenHash=(value:string)=>createHash("sha256").update(value).digest("hex");
export function verifyPassword(password:string,stored:string){try{const [salt,hash]=stored.split(":");return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(hash,"hex"));}catch{return false;}}
router.post("/auth/forgot-password",async(req,res)=>{
 const email=typeof req.body.email==="string"?req.body.email.trim().toLowerCase():"";if(!email.includes("@"))return res.status(400).json({error:"Valid email required"});
 const [user]=await db.select().from(usersTable).where(eq(usersTable.email,email));let token:string|undefined;
 if(user){token=randomBytes(32).toString("hex");await db.insert(passwordResetTokensTable).values({userId:user.id,email:user.email,token:tokenHash(token),expiresAt:new Date(Date.now()+3600000)});const origin=process.env.APP_ORIGIN;if(origin)await sendEmail({to:email,subject:"Reset your NEOBRAIN password",html:`<p><a href="${origin}/reset-password?token=${token}">Reset your password</a></p><p>This link expires in one hour.</p>`});}
 return res.json({message:"If an account exists for this email, a reset link has been sent.",...(process.env.NODE_ENV!=="production"?{debug_token:token}:{})});
});
router.post("/auth/verify-reset-token",async(req,res)=>{const token=req.body.token;if(typeof token!=="string")return res.status(400).json({error:"Token required"});const [record]=await db.select().from(passwordResetTokensTable).where(and(eq(passwordResetTokensTable.token,tokenHash(token)),eq(passwordResetTokensTable.isUsed,false)));if(!record||record.expiresAt<new Date())return res.status(400).json({valid:false,error:"Invalid or expired token"});return res.json({valid:true,email:record.email});});
router.post("/auth/reset-password",async(req,res)=>{
 const {token,password}=req.body;if(typeof token!=="string"||typeof password!=="string"||password.length<8)return res.status(400).json({error:"Token and password of at least 8 characters required"});
 const changed=await db.transaction(async tx=>{const [record]=await tx.select().from(passwordResetTokensTable).where(and(eq(passwordResetTokensTable.token,tokenHash(token)),eq(passwordResetTokensTable.isUsed,false))).for("update");if(!record||record.expiresAt<new Date())return false;const salt=randomBytes(16).toString("hex");await tx.update(usersTable).set({passwordHash:`${salt}:${scryptSync(password,salt,64).toString("hex")}`}).where(eq(usersTable.id,record.userId));await tx.update(passwordResetTokensTable).set({isUsed:true,usedAt:new Date()}).where(eq(passwordResetTokensTable.id,record.id));await tx.delete(sessionsTable).where(eq(sessionsTable.userId,record.userId));return true;});
 if(!changed)return res.status(400).json({error:"Invalid or expired token"});res.clearCookie("neobrain_session",{path:"/"});return res.json({message:"Password reset successful. You may now log in."});
});
export default router;
