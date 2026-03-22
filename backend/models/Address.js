/* backend/models/Address.js */

const pool = require('../config/database');

class Address {
    static async create(addressData) {
        const {
            user_id, type = 'home', name, mobile, pincode, state, city,
            locality, building_no, floor = null, landmark = null,
            latitude = null, longitude = null, is_default = false
        } = addressData;

        const query = `
            INSERT INTO user_addresses (
                user_id, type, name, mobile, pincode, state, city,
                locality, building_no, floor, landmark, latitude, longitude, is_default
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;

        const values = [
            user_id, type, name, mobile, pincode, state, city,
            locality, building_no, floor, landmark, latitude, longitude, is_default
        ];

        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    static async findByUserId(userId, includeInactive = false) {
        let query = `
            SELECT * FROM user_addresses 
            WHERE user_id = $1
            ${includeInactive ? '' : "AND is_active = true"}
            ORDER BY is_default DESC, created_at DESC
        `;
        
        const { rows } = await pool.query(query, [userId]);
        return rows;
    }

    static async findById(id, userId = null) {
        let query = 'SELECT * FROM user_addresses WHERE id = $1';
        const params = [id];

        if (userId) {
            query += ' AND user_id = $2';
            params.push(userId);
        }

        const { rows } = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findDefaultByUserId(userId) {
        const query = `
            SELECT * FROM user_addresses 
            WHERE user_id = $1 AND is_default = true AND is_active = true
            LIMIT 1
        `;
        
        const { rows } = await pool.query(query, [userId]);
        return rows[0] || null;
    }

    static async update(id, userId, updates) {
        const allowedFields = [
            'type', 'name', 'mobile', 'pincode', 'state', 'city',
            'locality', 'building_no', 'floor', 'landmark',
            'latitude', 'longitude', 'is_default', 'is_active'
        ];

        const setClauses = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                setClauses.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (setClauses.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(id, userId);
        const query = `
            UPDATE user_addresses 
            SET ${setClauses.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
            RETURNING *
        `;

        const { rows } = await pool.query(query, values);
        return rows[0] || null;
    }

    static async delete(id, userId) {
        const query = `
            UPDATE user_addresses 
            SET is_active = false, updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        
        const { rows } = await pool.query(query, [id, userId]);
        return rows[0] || null;
    }

    static async setAsDefault(id, userId) {
        const query = `
            UPDATE user_addresses 
            SET is_default = true, updated_at = NOW()
            WHERE id = $1 AND user_id = $2 AND is_active = true
            RETURNING *
        `;
        
        const { rows } = await pool.query(query, [id, userId]);
        return rows[0] || null;
    }

    static async countByUserId(userId, includeInactive = false) {
        let query = 'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = $1';
        if (!includeInactive) {
            query += ' AND is_active = true';
        }
        
        const { rows } = await pool.query(query, [userId]);
        return parseInt(rows[0].count);
    }

    static formatAddress(address) {
        if (!address) return null;

        const parts = [
            address.building_no,
            address.floor && `${address.floor} Floor`,
            address.locality,
            address.landmark && `Near ${address.landmark}`,
            `${address.city}, ${address.state} - ${address.pincode}`
        ].filter(Boolean);

        return {
            id: address.id,
            type: address.type,
            name: address.name,
            mobile: address.mobile,
            pincode: address.pincode,
            state: address.state,
            city: address.city,
            locality: address.locality,
            building_no: address.building_no,
            floor: address.floor,
            landmark: address.landmark,
            fullAddress: parts.join(', '),
            shortAddress: `${address.locality}, ${address.city}`,
            isDefault: address.is_default,
            createdAt: address.created_at
        };
    }
}

module.exports = Address;