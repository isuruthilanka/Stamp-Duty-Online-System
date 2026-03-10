const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return res.status(400).json({ errors: errors.array() });
};

const loginValidator = [
    body('emailOrUsername').trim().notEmpty().withMessage('Email or Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];

const userValidator = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('role').isIn(['ADMIN', 'COMMISSIONER', 'DC', 'ASSESSOR', 'TAX_OFFICER', 'REGISTRAR', 'LAWYER', 'FINANCIAL_CO']).withMessage('Invalid role'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    validate
];

const applicationValidator = [
    body('category').notEmpty().withMessage('Category is required'),
    body('region').notEmpty().withMessage('Region is required'),
    body('applicant').notEmpty().withMessage('Applicant name is required'),
    validate
];

module.exports = {
    loginValidator,
    userValidator,
    applicationValidator
};
