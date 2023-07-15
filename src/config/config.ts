import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export default registerAs('config', () => ({
	laravel_url: process.env.LARAVEL_URL,
}));

export const validation = {
	LARAVEL_URL: Joi.string().required(),
};
