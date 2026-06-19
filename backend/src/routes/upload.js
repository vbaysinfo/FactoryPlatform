import { Router } from "express";
import multer from "multer";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/webp","application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new AppError("Only images and PDFs allowed"));
  }
});

router.post("/design-file", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("No file uploaded");
    const { room_id, revision_id } = req.body;
    const ext = req.file.originalname.split(".").pop();
    const fileName = `${req.tenantId}/${room_id || "general"}/${Date.now()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from("design-files")
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (error) throw new AppError(error.message);

    const { data: { publicUrl } } = supabaseAdmin.storage.from("design-files").getPublicUrl(fileName);

    if (room_id) {
      await supabaseAdmin.from("design_files").insert({
        room_id, revision_id, tenant_id: req.tenantId,
        file_name: req.file.originalname, file_url: publicUrl,
        file_type: req.file.mimetype, file_size_bytes: req.file.size,
        uploaded_by: req.user.id
      });
    }

    res.json({ url: publicUrl, file_name: req.file.originalname, size: req.file.size });
  } catch (err) { next(err); }
});

router.post("/proof-of-delivery", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("No file uploaded");
    const { dispatch_id } = req.body;
    const ext = req.file.originalname.split(".").pop();
    const fileName = `${req.tenantId}/delivery/${dispatch_id}-${Date.now()}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("delivery-proofs")
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
    if (error) throw new AppError(error.message);

    const { data: { publicUrl } } = supabaseAdmin.storage.from("delivery-proofs").getPublicUrl(fileName);

    if (dispatch_id) {
      await supabaseAdmin.from("dispatch_orders").update({ delivery_proof_url: publicUrl }).eq("id", dispatch_id).eq("tenant_id", req.tenantId);
    }

    res.json({ url: publicUrl });
  } catch (err) { next(err); }
});

export default router;
