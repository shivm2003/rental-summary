const { body } = require('express-validator');

exports.validateLogin = [
  body('identifier').notEmpty().withMessage('Email or phone required'),
  body('password').notEmpty().withMessage('Password required')
];