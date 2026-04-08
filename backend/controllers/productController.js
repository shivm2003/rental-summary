/* backend/controllers/productController.js */

require('dotenv').config();
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');

// ============================================
// Multer Configuration
// ============================================
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only JPG, JPEG, PNG, WebP files allowed'));
  }
});

// ============================================
// Helper Functions
// ============================================

/** Generate base64 thumbnail from image buffer */
async function generateBase64Thumbnail(buffer) {
  try {
    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, { fit: 'inside' })
      .jpeg({ quality: 70 })
      .toBuffer();
    return `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;
  } catch (err) {
    console.error('Thumbnail generation failed:', err);
    return null;
  }
}

/** Delete multiple files from S3 (best-effort) */
async function cleanupS3Files(urls) {
  if (!urls?.length) return;
  await Promise.all(urls.map(url =>
    deleteFromS3(url).catch(err => console.error('S3 cleanup error:', err))
  ));
}

/** Get category name by ID for backward compatibility */
async function getCategoryNameById(categoryId) {
  if (!categoryId) return null;
  try {
    const { rows: [cat] } = await pool.query(
      'SELECT name FROM categories WHERE id = $1', [categoryId]
    );
    return cat?.name || null;
  } catch (err) {
    console.error('Error fetching category name:', err);
    return null;
  }
}

/**
 * Sanitise a numeric field from req.body.
 * Returns null for empty/undefined/NaN, otherwise a number.
 */
function toNumberOrNull(value) {
  if (value === '' || value === undefined || value === null) return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

/**
 * Sanitise a boolean that arrives as string ('true'/'false') or real boolean.
 */
function toBool(value) {
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

// ============================================
// Controller: createListing
// POST /api/listings/list
// ============================================
async function createListing(req, res, next) {
  const client = await pool.connect();
  const uploadedS3Urls = [];

  try {
    // ── Destructure all expected fields ───────────────────────────────────
    const {
      // Item details
      itemName,
      category,           // category_id value from frontend
      subcategory,        // subcategory_id value from frontend
      description,
      location,

      // Condition & history
      condition,
      purchaseMonth,
      purchaseYear,
      itemAge,
      originalPurchasePrice,

      // Rental rules
      minRentalDays = 1,
      maxRentalDays,
      advanceBookingDays = 1,

      // Delivery & handover
      deliveryHandlerType = 'you',
      deliveryOption = 'pickup',
      deliveryRadius,

      // Rental coverage
      pincode,
      city,
      state,
      country = 'India',

      // Safety
      idVerificationRequired,
      insuranceAvailable,

      // Pricing
      securityDeposit,
      rentalPricePerDay,
      priceUnit = 'day',

      // Terms & promo
      termsAndConditions,
      discountType,
      discountValue,
      discountStartDate,
      discountEndDate,
      promoCode,
      displayTagline,
    } = req.body;

    // ── Required field validation ─────────────────────────────────────────
    const missing = [];
    if (!itemName?.trim()) missing.push('itemName');
    if (!category) missing.push('category');
    if (!location?.trim()) missing.push('location');
    if (!condition) missing.push('condition');
    if (!rentalPricePerDay) missing.push('rentalPricePerDay');
    if (!pincode?.trim()) missing.push('pincode');
    if (!city?.trim()) missing.push('city');
    if (!state?.trim()) missing.push('state');

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    if (Number(rentalPricePerDay) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price per day must be greater than 0'
      });
    }

    if (!req.files?.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    // Validate pincode format (6-digit Indian pincode)
    if (!/^\d{6}$/.test(pincode?.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Pincode must be a 6-digit number'
      });
    }

    // Delivery radius required when lender handles delivery
    const needsRadius = deliveryHandlerType === 'you' &&
      (deliveryOption === 'delivery' || deliveryOption === 'both');
    if (needsRadius && !deliveryRadius) {
      return res.status(400).json({
        success: false,
        message: 'Delivery radius is required when you offer delivery'
      });
    }

    // Duration cross-check
    const minDays = parseInt(minRentalDays) || 1;
    const maxDays = maxRentalDays ? parseInt(maxRentalDays) : null;
    if (maxDays !== null && maxDays < minDays) {
      return res.status(400).json({
        success: false,
        message: 'Maximum rental duration must be greater than or equal to minimum'
      });
    }

    // ── Resolve category names for backward-compat column ─────────────────
    const categoryId = parseInt(category) || null;
    const subcategoryId = subcategory ? parseInt(subcategory) : null;
    const categoryName = await getCategoryNameById(categoryId);

    await client.query('BEGIN');

    // ── Insert listing ────────────────────────────────────────────────────
    const listingQuery = `
      INSERT INTO listings (
        lender_id,
        item_name,
        category,
        category_id,
        subcategory_id,
        description,
        location,

        condition,
        purchase_month,
        purchase_year,
        item_age,
        original_purchase_price,

        min_rental_days,
        max_rental_days,
        advance_booking_days,

        delivery_handler_type,
        delivery_option,
        delivery_radius_km,

        pincode,
        city,
        state,
        country,

        id_verification_required,
        insurance_available,

        security_deposit,
        rental_price_per_day,
        price_unit,

        terms_and_conditions,
        discount_type,
        discount_value,
        discount_start_date,
        discount_end_date,
        promo_code,
        display_tagline,

        availability,
        status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,
        $13,$14,$15,
        $16,$17,$18,
        $19,$20,$21,$22,
        $23,$24,
        $25,$26,$27,
        $28,$29,$30,$31,$32,$33,$34,
        $35, 'pending'
      )
      RETURNING id
    `;

    const { rows: [listing] } = await client.query(listingQuery, [
      req.user.uid,                          // $1  lender_id
      itemName.trim(),                       // $2  item_name
      categoryName,                          // $3  category (legacy string)
      categoryId,                            // $4  category_id
      subcategoryId,                         // $5  subcategory_id
      description?.trim() || null,           // $6  description
      location.trim(),                       // $7  location

      condition,                             // $8  condition
      toNumberOrNull(purchaseMonth),         // $9  purchase_month
      toNumberOrNull(purchaseYear),          // $10 purchase_year
      itemAge || null,                       // $11 item_age
      toNumberOrNull(originalPurchasePrice), // $12 original_purchase_price

      minDays,                               // $13 min_rental_days
      maxDays,                               // $14 max_rental_days
      parseInt(advanceBookingDays) || 0,     // $15 advance_booking_days

      deliveryHandlerType,                   // $16 delivery_handler_type
      deliveryOption,                        // $17 delivery_option
      toNumberOrNull(deliveryRadius),        // $18 delivery_radius_km

      pincode.trim(),                        // $19 pincode
      city.trim(),                           // $20 city
      state.trim(),                          // $21 state
      country || 'India',                    // $22 country

      toBool(idVerificationRequired),        // $23 id_verification_required
      toBool(insuranceAvailable),            // $24 insurance_available

      toNumberOrNull(securityDeposit) || 0,  // $25 security_deposit
      Number(rentalPricePerDay),             // $26 rental_price_per_day
      priceUnit,                             // $27 price_unit

      termsAndConditions?.trim() || null,    // $28 terms_and_conditions
      discountType || null,                  // $29 discount_type
      toNumberOrNull(discountValue),         // $30 discount_value
      discountStartDate || null,             // $31 discount_start_date
      discountEndDate || null,               // $32 discount_end_date
      promoCode?.trim() || null,             // $33 promo_code
      displayTagline?.trim() || null,        // $34 display_tagline
      JSON.stringify([]),                     // $35 availability (default empty array)
    ]);

    // ── Process and upload images ─────────────────────────────────────────
    const photoQuery = `
      INSERT INTO listing_photos
        (listing_id, storage_type, photo_path, base64_preview, full_url, metadata, display_order)
      VALUES ($1, 's3', $2, $3, $4, $5, $6)
    `;

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      const s3Url = await uploadToS3(
        file.buffer, file.originalname, 'products', file.mimetype
      );
      uploadedS3Urls.push(s3Url);

      const base64Preview = await generateBase64Thumbnail(file.buffer);
      const s3Key = s3Url.split('.amazonaws.com/')[1] || s3Url;

      const metadata = {
        size: file.size,
        mime: file.mimetype,
        originalName: file.originalname
      };

      try {
        const imgMeta = await sharp(file.buffer).metadata();
        metadata.width = imgMeta.width;
        metadata.height = imgMeta.height;
      } catch (err) {
        console.error('Image metadata extraction failed:', err);
      }

      await client.query(photoQuery, [
        listing.id, s3Key, base64Preview, s3Url, JSON.stringify(metadata), i
      ]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Your item has been successfully listed!',
      listingId: listing.id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create listing error:', error);
    await cleanupS3Files(uploadedS3Urls);
    next(error);
  } finally {
    client.release();
  }
}

// ============================================
// Controller: updateListing
// PUT /api/listings/:id
// ============================================
async function updateListing(req, res, next) {
  const client = await pool.connect();
  const uploadedS3Urls = [];

  try {
    const { id } = req.params;
    const { deleteImages = '[]' } = req.body;

    // Verify ownership
    const { rows } = await client.query(
      'SELECT id FROM listings WHERE id = $1 AND lender_id = $2',
      [id, req.user.uid]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });
    }

    await client.query('BEGIN');

    // ── Handle image deletions ────────────────────────────────────────────
    const toDelete = JSON.parse(deleteImages);
    if (toDelete.length > 0) {
      const { rows: photosToDelete } = await client.query(
        'SELECT full_url FROM listing_photos WHERE id = ANY($1) AND listing_id = $2',
        [toDelete, id]
      );
      await cleanupS3Files(photosToDelete.map(p => p.full_url));
      await client.query(
        'DELETE FROM listing_photos WHERE id = ANY($1) AND listing_id = $2',
        [toDelete, id]
      );
    }

    // ── Handle new image uploads ──────────────────────────────────────────
    if (req.files?.length > 0) {
      const { rows: maxOrder } = await client.query(
        'SELECT COALESCE(MAX(display_order), -1) as max_order FROM listing_photos WHERE listing_id = $1',
        [id]
      );
      let startOrder = maxOrder[0].max_order + 1;

      const photoQuery = `
        INSERT INTO listing_photos
          (listing_id, storage_type, photo_path, base64_preview, full_url, metadata, display_order)
        VALUES ($1, 's3', $2, $3, $4, $5, $6)
      `;

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const s3Url = await uploadToS3(file.buffer, file.originalname, 'products', file.mimetype);
        uploadedS3Urls.push(s3Url);

        const base64Preview = await generateBase64Thumbnail(file.buffer);
        const s3Key = s3Url.split('.amazonaws.com/')[1] || s3Url;
        const metadata = { size: file.size, mime: file.mimetype, originalName: file.originalname };

        try {
          const imgMeta = await sharp(file.buffer).metadata();
          metadata.width = imgMeta.width;
          metadata.height = imgMeta.height;
        } catch { }

        await client.query(photoQuery, [
          id, s3Key, base64Preview, s3Url, JSON.stringify(metadata), startOrder + i
        ]);
      }
    }

    // ── Build dynamic UPDATE query ────────────────────────────────────────
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    // Simple string / number fields — camelCase → snake_case mapping
    const simpleFields = {
      itemName: 'item_name',
      description: 'description',
      location: 'location',
      condition: 'condition',
      itemAge: 'item_age',
      minRentalDays: 'min_rental_days',
      maxRentalDays: 'max_rental_days',
      advanceBookingDays: 'advance_booking_days',
      deliveryHandlerType: 'delivery_handler_type',
      deliveryOption: 'delivery_option',
      deliveryRadius: 'delivery_radius_km',
      pincode: 'pincode',
      city: 'city',
      state: 'state',
      country: 'country',
      securityDeposit: 'security_deposit',
      rentalPricePerDay: 'rental_price_per_day',
      priceUnit: 'price_unit',
      originalPurchasePrice: 'original_purchase_price',
      termsAndConditions: 'terms_and_conditions',
      discountType: 'discount_type',
      discountValue: 'discount_value',
      discountStartDate: 'discount_start_date',
      discountEndDate: 'discount_end_date',
      promoCode: 'promo_code',
      displayTagline: 'display_tagline',
    };

    Object.entries(simpleFields).forEach(([jsKey, dbCol]) => {
      if (req.body[jsKey] !== undefined) {
        updateFields.push(`${dbCol} = $${paramCount++}`);
        values.push(req.body[jsKey] === '' ? null : req.body[jsKey]);
      }
    });

    // Numeric fields — coerce to number or null
    const numericFields = {
      purchaseMonth: 'purchase_month',
      purchaseYear: 'purchase_year',
    };

    Object.entries(numericFields).forEach(([jsKey, dbCol]) => {
      if (req.body[jsKey] !== undefined) {
        updateFields.push(`${dbCol} = $${paramCount++}`);
        values.push(toNumberOrNull(req.body[jsKey]));
      }
    });

    // Boolean fields
    const booleanFields = {
      idVerificationRequired: 'id_verification_required',
      insuranceAvailable: 'insurance_available',
    };

    Object.entries(booleanFields).forEach(([jsKey, dbCol]) => {
      if (req.body[jsKey] !== undefined) {
        updateFields.push(`${dbCol} = $${paramCount++}`);
        values.push(toBool(req.body[jsKey]));
      }
    });

    // Category (requires name lookup for legacy column)
    if (req.body.category !== undefined) {
      const catId = parseInt(req.body.category) || null;
      const catName = await getCategoryNameById(catId);
      updateFields.push(`category_id = $${paramCount++}`); values.push(catId);
      updateFields.push(`category = $${paramCount++}`); values.push(catName);
    }

    if (req.body.subcategory !== undefined) {
      const subId = req.body.subcategory ? parseInt(req.body.subcategory) : null;
      updateFields.push(`subcategory_id = $${paramCount++}`);
      values.push(subId);
    }

    // Execute update
    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      values.push(id);
      await client.query(
        `UPDATE listings SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        values
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Listing updated successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    await cleanupS3Files(uploadedS3Urls);
    next(error);
  } finally {
    client.release();
  }
}

// ============================================
// Controller: deleteListing
// DELETE /api/listings/:id
// ============================================
async function deleteListing(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const { rows: photos } = await client.query(
      'SELECT full_url FROM listing_photos WHERE listing_id = $1', [id]
    );

    await client.query('BEGIN');
    await client.query('DELETE FROM listing_photos WHERE listing_id = $1', [id]);

    const { rows: deleted } = await client.query(
      'DELETE FROM listings WHERE id = $1 AND lender_id = $2 RETURNING id',
      [id, req.user.uid]
    );

    if (!deleted.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });
    }

    await client.query('COMMIT');
    await cleanupS3Files(photos.map(p => p.full_url));

    res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

// ============================================
// Controller: getAllListings
// GET /api/listings
// ============================================
async function getAllListings(req, res, next) {
  try {
    const {
      search = '',
      cat,
      subcat,
      location,
      city,
      state,
      country,
      pincode,
      district,
      location_group_id,
      exclude,
      sort = 'newest',
      order = 'desc',
      page = 1,
      limit = 12,
    } = req.query;

    const offset = (page - 1) * limit;
    const args = [];

    let sql = `
      SELECT
        l.*,
        u.username AS lender_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id',           lp.id,
              'base64Preview',lp.base64_preview,
              'fullUrl',      lp.full_url,
              'storageType',  lp.storage_type,
              'path',         lp.photo_path
            ) ORDER BY lp.display_order
          ) FILTER (WHERE lp.id IS NOT NULL),
          '[]'
        ) AS photos
      FROM listings l
      JOIN  users         u  ON u.user_id    = l.lender_id
      LEFT JOIN listing_photos lp ON lp.listing_id = l.id
      WHERE l.status = 'active'
    `;

    // Only apply search filter when a search term is actually provided
    if (search && search.trim()) {
      sql += ` AND (l.item_name ILIKE $${args.length + 1} OR l.description ILIKE $${args.length + 1})`;
      args.push(`%${search.trim()}%`);
    }

    // Filters - FIXED: Handle category as string name or ID
    if (cat) {
      // Check if cat is numeric (ID) or string (name)
      const isNumeric = /^\d+$/.test(cat);
      if (isNumeric) {
        // It's an ID - check both category_id and legacy category column
        sql += ` AND (l.category_id = $${args.length + 1} OR l.category ILIKE $${args.length + 2})`;
        args.push(parseInt(cat), cat);
      } else {
        // It's a name - match against category name or find matching category IDs
        sql += ` AND (l.category ILIKE $${args.length + 1} OR l.category_id IN (SELECT id FROM categories WHERE name ILIKE $${args.length + 1}))`;
        args.push(`%${cat}%`);
      }
    }

    if (subcat) {
      sql += ` AND l.subcategory_id = $${args.length + 1}`;
      args.push(parseInt(subcat));
    }
    if (city) {
      sql += ` AND (l.city ILIKE $${args.length + 1} OR l.location ILIKE $${args.length + 1} OR l.district ILIKE $${args.length + 1})`;
      args.push(`%${city}%`);
    }
    if (location) {
      sql += ` AND (l.location ILIKE $${args.length + 1} OR l.city ILIKE $${args.length + 1} OR l.district ILIKE $${args.length + 1})`;
      args.push(`%${location}%`);
    }
    // PREFERRED: Filter by location group ID (exact, covers all aliases)
    if (location_group_id) {
      sql += ` AND l.location_group_id = $${args.length + 1}`;
      args.push(parseInt(location_group_id));
    }
    if (state) {
      sql += ` AND l.state ILIKE $${args.length + 1}`;
      args.push(`%${state}%`);
    }
    if (country) {
      sql += ` AND l.country ILIKE $${args.length + 1}`;
      args.push(`%${country}%`);
    }
    if (pincode) {
      sql += ` AND l.pincode = $${args.length + 1}`;
      args.push(pincode);
    }
    if (district) {
      sql += ` AND (l.district ILIKE $${args.length + 1} OR l.city ILIKE $${args.length + 1})`,
        args.push(`%${district}%`);
    }

    // FIXED: Handle exclude parameter
    if (exclude) {
      sql += ` AND l.id != $${args.length + 1}`;
      args.push(parseInt(exclude));
    }

    const sortCol = {
      price: 'l.rental_price_per_day',
      newest: 'l.created_at',
      name: 'l.item_name',
    }[sort] || 'l.created_at';

    sql += `
      GROUP BY l.id, u.username
      ORDER BY ${sortCol} ${order === 'asc' ? 'ASC' : 'DESC'}
      LIMIT $${args.length + 1} OFFSET $${args.length + 2}
    `;
    args.push(limit, offset);

    const { rows } = await pool.query(sql, args);

    // Count query — mirrors the same filters
    const countArgs = [];
    let countSql = `SELECT COUNT(*) AS total FROM listings l WHERE l.status = 'active'`;

    if (search && search.trim()) {
      countSql += ` AND (l.item_name ILIKE $${countArgs.length + 1} OR l.description ILIKE $${countArgs.length + 1})`;
      countArgs.push(`%${search.trim()}%`);
    }

    // FIXED: Apply same filters to count query
    if (cat) {
      const isNumeric = /^\d+$/.test(cat);
      if (isNumeric) {
        countSql += ` AND (l.category_id = $${countArgs.length + 1} OR l.category ILIKE $${countArgs.length + 2})`;
        countArgs.push(parseInt(cat), cat);
      } else {
        countSql += ` AND (l.category ILIKE $${countArgs.length + 1} OR l.category_id IN (SELECT id FROM categories WHERE name ILIKE $${countArgs.length + 1}))`;
        countArgs.push(`%${cat}%`);
      }
    }
    if (subcat) { countSql += ` AND l.subcategory_id = $${countArgs.length + 1}`; countArgs.push(parseInt(subcat)); }
    if (city) { countSql += ` AND (l.city ILIKE $${countArgs.length + 1} OR l.location ILIKE $${countArgs.length + 1} OR l.district ILIKE $${countArgs.length + 1})`; countArgs.push(`%${city}%`); }
    if (location) { countSql += ` AND (l.location ILIKE $${countArgs.length + 1} OR l.city ILIKE $${countArgs.length + 1} OR l.district ILIKE $${countArgs.length + 1})`; countArgs.push(`%${location}%`); }
    if (state) { countSql += ` AND l.state  ILIKE $${countArgs.length + 1}`; countArgs.push(`%${state}%`); }
    if (country) { countSql += ` AND l.country ILIKE $${countArgs.length + 1}`; countArgs.push(`%${country}%`); }
    if (pincode) { countSql += ` AND l.pincode = $${countArgs.length + 1}`; countArgs.push(pincode); }
    if (district) { countSql += ` AND (l.district ILIKE $${countArgs.length + 1} OR l.city ILIKE $${countArgs.length + 1})`; countArgs.push(`%${district}%`); }
    if (location_group_id) { countSql += ` AND l.location_group_id = $${countArgs.length + 1}`; countArgs.push(parseInt(location_group_id)); }
    if (exclude) { countSql += ` AND l.id != $${countArgs.length + 1}`; countArgs.push(parseInt(exclude)); }

    const { rows: [{ total }] } = await pool.query(countSql, countArgs);

    res.json({
      success: true,
      listings: rows,
      total: parseInt(total),
      page: parseInt(page),
      pages: Math.ceil(parseInt(total) / limit),
    });
  } catch (error) {
    console.error('getAllListings error:', error);
    next(error);
  }
}

// ============================================
// Controller: getMyListings
// GET /api/listings/my
// ============================================
async function getMyListings(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT l.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',           lp.id,
              'base64Preview',lp.base64_preview,
              'fullUrl',      lp.full_url,
              'storageType',  lp.storage_type,
              'path',         lp.photo_path
            ) ORDER BY lp.display_order
          ) FILTER (WHERE lp.id IS NOT NULL),
          '[]'
        ) AS photos
       FROM listings l
       LEFT JOIN listing_photos lp ON lp.listing_id = l.id
       WHERE l.lender_id = $1
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [req.user.uid]
    );
    res.json({ success: true, listings: rows });
  } catch (error) {
    console.error('getMyListings error:', error);
    next(error);
  }
}

// ============================================
// Controller: getListing
// GET /api/listings/:id
// ============================================
async function getListing(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT l.*,
        u.username AS lender_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id',           lp.id,
              'base64Preview',lp.base64_preview,
              'fullUrl',      lp.full_url,
              'storageType',  lp.storage_type,
              'path',         lp.photo_path
            ) ORDER BY lp.display_order
          ) FILTER (WHERE lp.id IS NOT NULL),
          '[]'
        ) AS photos
       FROM listings l
       JOIN  users u         ON u.user_id    = l.lender_id
       LEFT JOIN listing_photos lp ON lp.listing_id = l.id
       WHERE l.id = $1 AND l.status = 'active'
       GROUP BY l.id, u.username`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    res.json({ success: true, ...rows[0] });
  } catch (error) {
    console.error('getListing error:', error);
    next(error);
  }
}

// ============================================
// Controller: getPincodeInfo
// GET /api/pincode/:pincode
// ============================================
async function getPincodeInfo(req, res, next) {
  try {
    const { pincode } = req.params;

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: 'Invalid pincode format' });
    }

    const { rows } = await pool.query(
      'SELECT pincode, city, state FROM pincode_master WHERE pincode = $1 LIMIT 1',
      [pincode]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Pincode not found' });
    }

    res.json({ success: true, pincode: rows[0] });
  } catch (error) {
    console.error('getPincodeInfo error:', error);
    next(error);
  }
}

// ============================================
// Controller: getLocationGroups
// GET /api/locations
// ============================================
async function getLocationGroups(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT g.id, g.display_name, g.region,
              COUNT(l.id) AS listings_count
       FROM location_groups g
       LEFT JOIN listings l ON l.location_group_id = g.id AND l.status = 'active'
       GROUP BY g.id, g.display_name, g.region
       ORDER BY g.display_name ASC`
    );
    res.json({ success: true, locations: rows });
  } catch (error) {
    console.error('getLocationGroups error:', error);
    next(error);
  }
}

// ============================================
async function addReview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment, orderId } = req.body;
    const userId = req.user.uid;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Invalid rating' });
    }

    const { rows } = await pool.query(
      `INSERT INTO reviews (product_id, user_id, order_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, userId, orderId, rating, comment]
    );

    res.status(201).json({ success: true, review: rows[0], message: 'Review submitted successfully' });
  } catch (error) {
    if (error.constraint === 'reviews_product_id_user_id_order_id_key') {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product for this order.' });
    }
    console.error('addReview error:', error);
    next(error);
  }
}

async function getReviews(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, 
              COALESCE(p.first_name, u.username, 'User') as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id::text
       LEFT JOIN user_profiles p ON p.user_id = u.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );
    res.json({ success: true, reviews: rows });
  } catch (error) {
    console.error('getReviews error:', error);
    next(error);
  }
}

// ============================================
// Exports
// ============================================
module.exports = {
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  getAllListings,
  getListing,
  getPincodeInfo,
  getLocationGroups,
  uploadMiddleware: upload.any(),
  addReview,
  getReviews
};

