export const customResponse = (message = 'Operacion Exitosa', body = null, statusCode = 200) => {
	return {
		statusCode,
		message,
		body,
	};
};
