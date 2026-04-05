const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../config/database');
const dashboardController = require('../controllers/lenderDashboardController');
const router  = express.Router();

/* ---------- ensure folder ---------- */
const kycDir = path.join(__dirname, '../../uploads/kyc');
if (!fs.existsSync(kycDir)) fs.mkdirSync(kycDir, { recursive: true });

/* ---------- multer ---------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, kycDir),
  filename: (_req, file, cb) => {
    const ref  = _req.body.ref1Name || _req.body.refName || 'ref';
    const safe = ref.replace(/\s+/g, '_');
    const ext  = path.extname(file.originalname);
    cb(null, `${safe}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) return cb(null, true);
    cb(new Error('Only JPG, JPEG, PNG, PDF ≤ 5 MB'));
  }
});

/* ---------- helper ---------- */
const dbPath = (req, field) => {
  const f = req.files[field]?.[0];
  return f ? `uploads/kyc/${f.filename}` : null;
};

/* ---------- POST /api/lender/register ---------- */
router.post('/register',
  upload.fields([
    { name: 'firstIdProof', maxCount: 1 },
    { name: 'secondIdProof', maxCount: 1 },
    { name: 'shopPhoto', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 }
  ]),
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userId = req.user.uid;
      const body   = req.body;

      /* ---- basic validation ---- */
      if (!body.pincode || body.pincode.length !== 6) throw new Error('Invalid pincode');
      if (body.lenderType === 'business') {
        if (!body.gstin || body.gstin.length !== 15) throw new Error('Invalid GSTIN');
      }
      const mobiles = [body.ref1Mobile, body.ref2Mobile, body.refMobile].filter(Boolean);
      if (mobiles.some(m => !/^\d{10}$/.test(m))) throw new Error('Invalid mobile number');

      /* ---- city/state ---- */
      const { rows: [loc] } = await client.query(
        'SELECT city, state FROM pincode_master WHERE pincode = $1',
        [body.pincode]
      );
      if (!loc) throw new Error('Pincode not found in master');

      /* ---- payload ---- */
      const payload = {
        user_id: userId,
        lender_type: body.lenderType,
        full_address: body.fullAddress,
        business_address: body.businessAddress || null,
        pincode: body.pincode,
        city: loc.city,
        state: loc.state,
        digipin: body.digipin || null,
        ref1_name: body.ref1Name || null,
        ref1_mobile: body.ref1Mobile || null,
        ref2_name: body.ref2Name || null,
        ref2_mobile: body.ref2Mobile || null,
        ref_name: body.refName || null,
        ref_mobile: body.refMobile || null,
        gstin: body.gstin || null,
        trade_name: body.tradeName || null,
        legal_owner_name: body.legalOwnerName || null,
        first_id_proof: dbPath(req, 'firstIdProof'),
        second_id_proof: dbPath(req, 'secondIdProof'),
        shop_photo: dbPath(req, 'shopPhoto'),
        gst_certificate: dbPath(req, 'gstCertificate'),
        status: 'pending'
      };

      const cols = Object.keys(payload).join(',');
      const idxs = Object.keys(payload).map((_, i) => `$${i + 1}`).join(',');
      await client.query(
        `INSERT INTO lender_applications (${cols}) VALUES (${idxs})`,
        Object.values(payload)
      );

      await client.query('COMMIT');
      res.json({ success: true, message: 'Lender registration successful' });
    } catch (e) {
      await client.query('ROLLBACK');
      next(e);
    } finally {
      client.release();
    }
  }
);

/* ---------- GET /api/lender/status ---------- */
router.get('/status', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, lender_type, status FROM lender_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.uid]
    );
    res.json(rows[0] || null);
  } catch (e) { next(e); }
});

/* ---------- DASHBOARD APIS ---------- */
router.get('/dashboard/stats', dashboardController.getDashboardStats);
router.get('/dashboard/products', dashboardController.getProducts);
router.get('/dashboard/orders', dashboardController.getOrders);
router.get('/dashboard/earnings', dashboardController.getEarnings);

module.exports = router;