/* backend/controllers/addressController.js */

const Address = require('../models/Address');
const pool = require('../config/database');

const validateAddress = (data) => {
    const errors = [];
    
    const required = ['name', 'mobile', 'pincode', 'state', 'city', 'locality', 'building_no'];
    required.forEach(field => {
        if (!data[field] || String(data[field]).trim() === '') {
            errors.push(`${field} is required`);
        }
    });

    if (data.mobile && !/^\d{10}$/.test(data.mobile.replace(/\D/g, ''))) {
        errors.push('Mobile number must be 10 digits');
    }

    if (data.pincode && !/^\d{6}$/.test(data.pincode)) {
        errors.push('Pincode must be 6 digits');
    }

    const validTypes = ['home', 'work', 'other'];
    if (data.type && !validTypes.includes(data.type)) {
        errors.push('Type must be home, work, or other');
    }

    return errors;
};

exports.getAddresses = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const addresses = await Address.findByUserId(userId);

        res.json({
            success: true,
            count: addresses.length,
            addresses: addresses.map(addr => Address.formatAddress(addr))
        });
    } catch (error) {
        next(error);
    }
};

exports.getAddress = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;

        const address = await Address.findById(id, userId);

        if (!address || !address.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        res.json({
            success: true,
            address: Address.formatAddress(address)
        });
    } catch (error) {
        next(error);
    }
};

exports.getDefaultAddress = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const address = await Address.findDefaultByUserId(userId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'No default address found'
            });
        }

        res.json({
            success: true,
            address: Address.formatAddress(address)
        });
    } catch (error) {
        next(error);
    }
};

exports.createAddress = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const addressData = req.body;

        const errors = validateAddress(addressData);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        const cleanMobile = addressData.mobile.replace(/\D/g, '');
        const addressCount = await Address.countByUserId(userId);
        const isDefault = addressCount === 0 ? true : !!addressData.is_default;

        const newAddress = await Address.create({
            user_id: userId,
            type: addressData.type || 'home',
            name: addressData.name.trim(),
            mobile: cleanMobile,
            pincode: addressData.pincode,
            state: addressData.state.trim(),
            city: addressData.city.trim(),
            locality: addressData.locality.trim(),
            building_no: addressData.building_no.trim(),
            floor: addressData.floor?.trim() || null,
            landmark: addressData.landmark?.trim() || null,
            latitude: addressData.latitude || null,
            longitude: addressData.longitude || null,
            is_default: isDefault
        });

        res.status(201).json({
            success: true,
            message: 'Address created successfully',
            address: Address.formatAddress(newAddress)
        });
    } catch (error) {
        next(error);
    }
};

exports.updateAddress = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;
        const updates = req.body;

        const existing = await Address.findById(id, userId);
        if (!existing || !existing.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        const allowedUpdates = {};
        const allowedFields = [
            'type', 'name', 'mobile', 'pincode', 'state', 'city',
            'locality', 'building_no', 'floor', 'landmark',
            'latitude', 'longitude', 'is_default', 'is_active'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'mobile') {
                    allowedUpdates[field] = updates[field].replace(/\D/g, '');
                } else if (['name', 'state', 'city', 'locality', 'building_no', 'floor', 'landmark'].includes(field)) {
                    allowedUpdates[field] = updates[field]?.trim();
                } else {
                    allowedUpdates[field] = updates[field];
                }
            }
        });

        if (allowedUpdates.mobile && !/^\d{10}$/.test(allowedUpdates.mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number must be 10 digits'
            });
        }

        if (allowedUpdates.pincode && !/^\d{6}$/.test(allowedUpdates.pincode)) {
            return res.status(400).json({
                success: false,
                message: 'Pincode must be 6 digits'
            });
        }

        const updated = await Address.update(id, userId, allowedUpdates);

        res.json({
            success: true,
            message: 'Address updated successfully',
            address: Address.formatAddress(updated)
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteAddress = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;

        const existing = await Address.findById(id, userId);
        if (!existing || !existing.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        await Address.delete(id, userId);

        if (existing.is_default) {
            const remaining = await Address.findByUserId(userId);
            if (remaining.length > 0) {
                await Address.setAsDefault(remaining[0].id, userId);
            }
        }

        res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.setDefaultAddress = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;

        const existing = await Address.findById(id, userId);
        if (!existing || !existing.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        const updated = await Address.setAsDefault(id, userId);

        res.json({
            success: true,
            message: 'Default address updated',
            address: Address.formatAddress(updated)
        });
    } catch (error) {
        next(error);
    }
};

exports.validatePincode = async (req, res, next) => {
    try {
        const { pincode } = req.params;

        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pincode format'
            });
        }

        const { rows } = await pool.query(
            'SELECT pincode, city, state, district FROM pincode_master WHERE pincode = $1',
            [pincode]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pincode not found or service not available in this area'
            });
        }

        res.json({
            success: true,
            pincode: rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.getAddressCount = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const count = await Address.countByUserId(userId);

        res.json({
            success: true,
            count
        });
    } catch (error) {
        next(error);
    }
};