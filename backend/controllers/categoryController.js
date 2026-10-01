const { pool } = require('../config/db');

const LEVELS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

// List all categories with their subjects grouped by level
exports.listCategories = async (req, res) => {
  try {
    const [cats] = await pool.query(
      `SELECT c.*, (SELECT COUNT(*) FROM subjects s WHERE s.category_id = c.id) AS subject_count
       FROM categories c ORDER BY c.id`
    );
    const [subs] = await pool.query(
      `SELECT s.*, c.name AS category_name, c.code AS category_code
       FROM subjects s JOIN categories c ON c.id = s.category_id
       ORDER BY c.id, s.name, FIELD(s.level, 'S1','S2','S3','S4','S5','S6')`
    );

    const byCategory = cats.map(cat => ({ ...cat, subjects: subs.filter(s => s.category_id === cat.id) }));
    res.json({ success: true, data: byCategory });
  } catch (err) {
    console.error('List categories error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Simple list of distinct category records (for dropdowns)
exports.getCategoryList = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, code, description FROM categories ORDER BY id');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get category list error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Simple list of distinct subjects for a category (for dropdowns)
exports.getSubjects = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const [rows] = await pool.query(
      `SELECT id, name, level FROM subjects WHERE category_id = ? ORDER BY name, FIELD(level, 'S1','S2','S3','S4','S5','S6')`,
      [categoryId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get subjects error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add a new category
exports.addCategory = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Category code is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, code, description) VALUES (?, ?, ?)',
      [name.trim(), code.trim().toUpperCase(), description || null]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'CATEGORY_ADDED', 'CATEGORY', ?, ?)`,
      [req.user.id, result.insertId, name.trim()]
    );

    res.status(201).json({ success: true, message: 'Category added', id: result.insertId });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Category name or code already exists' });
    }
    console.error('Add category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update an existing category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const [exist] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Category not found' });

    await pool.query(
      `UPDATE categories SET name = COALESCE(?, name), code = COALESCE(?, code), description = COALESCE(?, description)
       WHERE id = ?`,
      [name && name.trim() || null, code && code.trim().toUpperCase() || null, description ?? null, id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'CATEGORY_UPDATED', 'CATEGORY', ?, ?)`,
      [req.user.id, id, name || 'updated']
    );

    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Category name or code already exists' });
    }
    console.error('Update category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a category (cascades to its subjects)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [exist] = await pool.query('SELECT id, name FROM categories WHERE id = ?', [id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Category not found' });

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'CATEGORY_DELETED', 'CATEGORY', ?, ?)`,
      [req.user.id, id, exist[0].name]
    );

    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add a subject under a category
exports.addSubject = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, level = 'S1' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required' });
    }
    const lvl = String(level).toUpperCase();
    if (!LEVELS.includes(lvl)) {
      return res.status(400).json({ success: false, message: `Level must be one of: ${LEVELS.join(', ')}` });
    }

    const [cat] = await pool.query('SELECT id, name FROM categories WHERE id = ?', [categoryId]);
    if (cat.length === 0) return res.status(404).json({ success: false, message: 'Category not found' });

    await pool.query(
      'INSERT INTO subjects (category_id, name, level) VALUES (?, ?, ?)',
      [categoryId, name.trim(), lvl]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'SUBJECT_ADDED', 'SUBJECT', ?, ?)`,
      [req.user.id, categoryId, `${name.trim()} (${lvl}) - ${cat[0].name}`]
    );

    res.status(201).json({ success: true, message: 'Subject added' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: `Subject "${name}" already exists at this level` });
    }
    console.error('Add subject error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update a subject
exports.updateSubject = async (req, res) => {
  try {
    const { categoryId, subjectId } = req.params;
    const { name, level } = req.body;

    const [exist] = await pool.query('SELECT id FROM subjects WHERE id = ? AND category_id = ?', [subjectId, categoryId]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Subject not found' });

    const lvl = level ? String(level).toUpperCase() : null;
    if (lvl && !LEVELS.includes(lvl)) {
      return res.status(400).json({ success: false, message: `Level must be one of: ${LEVELS.join(', ')}` });
    }

    await pool.query(
      'UPDATE subjects SET name = COALESCE(?, name), level = COALESCE(?, level) WHERE id = ? AND category_id = ?',
      [name && name.trim() || null, lvl, subjectId, categoryId]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'SUBJECT_UPDATED', 'SUBJECT', ?, ?)`,
      [req.user.id, subjectId, name || 'updated']
    );

    res.json({ success: true, message: 'Subject updated' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A subject with this name and level already exists' });
    }
    console.error('Update subject error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a subject
exports.deleteSubject = async (req, res) => {
  try {
    const { categoryId, subjectId } = req.params;
    const [exist] = await pool.query('SELECT id, name, level FROM subjects WHERE id = ? AND category_id = ?', [subjectId, categoryId]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Subject not found' });

    await pool.query('DELETE FROM subjects WHERE id = ? AND category_id = ?', [subjectId, categoryId]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'SUBJECT_DELETED', 'SUBJECT', ?, ?)`,
      [req.user.id, subjectId, `${exist[0].name} (${exist[0].level})`]
    );

    res.json({ success: true, message: 'Subject deleted' });
  } catch (err) {
    console.error('Delete subject error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};