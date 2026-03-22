const pool = require('../config/database');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');
const multer = require('multer');
const path = require('path');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only JPG, PNG, WebP images allowed'));
  }
});

// ============================================
// Homepage categories (public)
// ============================================
exports.getHomepageCategories = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        id,
        name,
        slug,
        image_url
      FROM categories 
      WHERE parent_id IS NULL
        AND is_active = true
      ORDER BY display_order ASC, name ASC`
    );

    res.json({ 
      success: true,
      count: rows.length,
      categories: rows 
    });
  } catch (error) {
    console.error('❌ getHomepageCategories error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// ============================================
// Admin categories (full details)
// ============================================
exports.getAdminCategories = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.display_order,
        c.is_active,
        c.image_url,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT l.id) as product_count,
        (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as children_count
      FROM categories c
      LEFT JOIN listings l ON l.category = c.id::varchar
      WHERE c.parent_id IS NULL
        AND c.is_active = true
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC`
    );

    res.json({ 
      success: true,
      count: rows.length,
      categories: rows 
    });
  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// Update display order / basic settings
// ============================================
exports.updateHomepageSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_order, image_url } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(display_order);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE categories 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ 
      success: true,
      message: 'Settings updated',
      category: rows[0] 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Get pre-signed URL for image upload
// ============================================
exports.getIconUploadUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ message: 'filename and contentType required' });
    }

    // Verify category exists
    const { rows } = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `categories/icons/${id}/${Date.now()}-${Math.round(Math.random() * 1E9)}-${cleanFilename}`;

    const { s3Client } = require('../utils/s3');
    
    // ✅ FIXED: Removed ACL: 'public-read' for buckets with ACL disabled
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      // ACL: 'public-read' // REMOVED: Causes 400 on modern S3 buckets
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

    // Save URL to database
    await pool.query(
      'UPDATE categories SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [publicUrl, id]
    );

    res.json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
      contentType // Echo back for frontend verification
    });
  } catch (error) {
    console.error('Get upload URL error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Bulk update display orders
// ============================================
exports.bulkUpdateOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { orders } = req.body; // Array of { id, display_order }

    if (!Array.isArray(orders)) {
      return res.status(400).json({ message: 'orders array required' });
    }

    await client.query('BEGIN');

    for (const { id, display_order } of orders) {
      await client.query(
        'UPDATE categories SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [display_order, id]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Order updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk update error:', error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// ============================================
// Get all categories (public)
// ============================================
exports.getAllCategories = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        id, name, slug, parent_id, level,
        image_url, description,
        display_order, is_active
       FROM categories 
       WHERE is_active = true
       ORDER BY level ASC, display_order ASC, name ASC`
    );
    res.json({ categories: rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Get category tree
// ============================================
exports.getCategoryTree = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, 
        CASE 
          WHEN c.parent_id IS NULL THEN NULL 
          ELSE json_build_object('id', p.id, 'name', p.name, 'slug', p.slug)
        END as parent
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       ORDER BY c.level ASC, c.display_order ASC, c.name ASC`
    );
    
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };
    
    const tree = buildTree(rows);
    res.json({ categories: rows, tree });
  } catch (error) {
    console.error('Get tree error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Get single category
// ============================================
exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: [category] } = await pool.query(
      `SELECT c.*, 
        CASE 
          WHEN c.parent_id IS NULL THEN NULL 
          ELSE json_build_object('id', p.id, 'name', p.name)
        END as parent
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.id = $1`,
      [id]
    );
    
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    const { rows: children } = await pool.query(
      'SELECT id, name, slug, image_url FROM categories WHERE parent_id = $1 AND is_active = true',
      [id]
    );
    
    res.json({ ...category, children });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Create category
// ============================================
exports.createCategory = async (req, res) => {
  try {
    const { name, description, parent_id, display_order } = req.body;
    
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let level = 0;
    if (parent_id) {
      const { rows: [parent] } = await pool.query(
        'SELECT level FROM categories WHERE id = $1',
        [parent_id]
      );
      if (parent) level = parent.level + 1;
    }
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        'categories',
        req.file.mimetype
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO categories (
        name, slug, description, image_url,
        parent_id, level, display_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *`,
      [
        name, slug, description, imageUrl,
        parent_id || null, level, display_order || 0
      ]
    );

    res.status(201).json({ 
      message: 'Category created successfully', 
      category: rows[0] 
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Update category
// ============================================
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id, display_order, is_active } = req.body;
    
    const { rows: [existing] } = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    
    if (!existing) return res.status(404).json({ message: 'Category not found' });
    
    if (parent_id && parent_id == id) {
      return res.status(400).json({ message: 'Category cannot be its own parent' });
    }
    
    let imageUrl = existing.image_url;
    
    if (req.file) {
      if (existing.image_url) {
        await deleteFromS3(existing.image_url);
      }
      imageUrl = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        'categories',
        req.file.mimetype
      );
    }

    const { rows } = await pool.query(
      `UPDATE categories 
       SET name = $1, description = $2, image_url = $3,
           parent_id = $4, display_order = $5, is_active = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [
        name || existing.name, 
        description, 
        imageUrl, 
        parent_id !== undefined ? (parent_id || null) : existing.parent_id, 
        display_order !== undefined ? display_order : existing.display_order, 
        is_active !== undefined ? is_active : existing.is_active,
        id
      ]
    );

    res.json({ message: 'Category updated', category: rows[0] });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Delete category (with all children)
// ============================================
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      `WITH RECURSIVE category_tree AS (
        SELECT id, image_url, parent_id FROM categories WHERE id = $1
        UNION ALL
        SELECT c.id, c.image_url, c.parent_id 
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT id, image_url FROM category_tree`,
      [id]
    );
    
    for (const row of rows) {
      if (row.image_url) {
        await deleteFromS3(row.image_url);
      }
    }
    
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    
    res.json({ 
      message: 'Category deleted',
      deletedCount: rows.length 
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// Get subcategories by parent category ID (for product listing)
// ============================================
exports.getSubcategories = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate parent category exists
    const { rows: [parent] } = await pool.query(
      'SELECT id, name FROM categories WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (!parent) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found or inactive' 
      });
    }
    
    // Get all subcategories (direct children only)
    const { rows: subcategories } = await pool.query(
      `SELECT 
        id,
        name,
        slug,
        image_url,
        display_order
      FROM categories 
      WHERE parent_id = $1 
        AND is_active = true
      ORDER BY display_order ASC, name ASC`,
      [id]
    );

    res.json({ 
      success: true,
      parent: {
        id: parent.id,
        name: parent.name
      },
      count: subcategories.length,
      subcategories 
    });
  } catch (error) {
    console.error('❌ getSubcategories error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};