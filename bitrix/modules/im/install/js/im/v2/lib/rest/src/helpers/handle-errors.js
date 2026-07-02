import { type RunActionError } from '../types/run-action';
import { type ErrorsConfig } from '../types/error';

const INVALID_AUTH_ERROR_CODE = 'invalid_authentication';

const errorCodesConfig = {
	[INVALID_AUTH_ERROR_CODE]: { retryCount: 1, timeout: null },
};

export const needRetryRequest = (responseErrors: RunActionError[]): boolean => {
	return responseErrors.some((responseError) => errorCodesConfig[responseError.code]);
};

export const getErrorConfig = (responseErrors: RunActionError[]): ErrorsConfig => {
	const error = responseErrors.find((responseError) => errorCodesConfig[responseError.code]);

	return errorCodesConfig[error.code];
};

export const hasInvalidAuthError = (responseErrors: RunActionError[]): boolean => {
	return responseErrors.some((error) => error.code === INVALID_AUTH_ERROR_CODE);
};
