const Joi = require('joi');

const signUpSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().optional(),
  mobile: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
  password: Joi.string().min(6).required(),
});

const signInSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().optional(),
  mobile: Joi.string().email().optional()
});

module.exports = { signUpSchema, signInSchema };
