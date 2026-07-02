import { getSortedErrors } from '../src/error/sorted-errors';

const SIGN_CLIENT_CONNECTION_ERROR_CODE = 'SIGN_CLIENT_CONNECTION_ERROR';

describe('getSortedErrors', () => {
	it('Should prioritize sign client connection error', () => {
		const errors = [
			{ code: 0, message: 'Default error', customData: {} },
			{ code: 'SIGN_CLIENT_CONNECTION_ERROR', message: 'Connection error', customData: {} },
			{ code: 'LICENSE_LIMITATIONS', message: 'License error', customData: {} },
		];

		const sortedErrors = getSortedErrors(errors, SIGN_CLIENT_CONNECTION_ERROR_CODE);

		assert.deepStrictEqual(
			sortedErrors.map((error) => error.code),
			['SIGN_CLIENT_CONNECTION_ERROR', 'LICENSE_LIMITATIONS', 0],
		);
	});

	it('Should place non-empty string codes after connection error and before other values', () => {
		const errors = [
			{ code: '0', message: 'String zero error', customData: {} },
			{ code: 'LICENSE_LIMITATIONS', message: 'License error', customData: {} },
			{ code: '', message: 'Empty code error', customData: {} },
			{ code: 0, message: 'Numeric zero error', customData: {} },
		];

		const sortedErrors = getSortedErrors(errors, SIGN_CLIENT_CONNECTION_ERROR_CODE);

		assert.deepStrictEqual(
			sortedErrors.map((error) => error.code),
			['0', 'LICENSE_LIMITATIONS', '', 0],
		);
	});

	it('Should place numeric codes after non-empty string codes', () => {
		const errors = [
			{ code: 0, message: 'Default error', customData: {} },
			{ code: 1001, message: 'Known numeric error', customData: {} },
			{ code: 'KNOWN_ERROR', message: 'Known string error', customData: {} },
		];

		const sortedErrors = getSortedErrors(errors, SIGN_CLIENT_CONNECTION_ERROR_CODE);

		assert.deepStrictEqual(
			sortedErrors.map((error) => error.code),
			['KNOWN_ERROR', 0, 1001],
		);
	});

	it('Should return empty array for empty input', () => {
		const sortedErrors = getSortedErrors([], SIGN_CLIENT_CONNECTION_ERROR_CODE);

		assert.deepStrictEqual(sortedErrors, []);
	});

	it('Should place error without code after connection and non-empty string codes', () => {
		const errors = [
			{ code: 'LICENSE_LIMITATIONS', message: 'License error', customData: {} },
			{ message: 'Error without code', customData: {} },
			{ code: 'SIGN_CLIENT_CONNECTION_ERROR', message: 'Connection error', customData: {} },
		];

		const sortedErrors = getSortedErrors(errors, SIGN_CLIENT_CONNECTION_ERROR_CODE);

		assert.deepStrictEqual(
			sortedErrors.map((error) => error.code),
			['SIGN_CLIENT_CONNECTION_ERROR', 'LICENSE_LIMITATIONS', undefined],
		);
	});

	it('Should not mutate original errors array', () => {
		const errors = [
			{ code: 0, message: 'Default error', customData: {} },
			{ code: 'LICENSE_LIMITATIONS', message: 'License error', customData: {} },
		];

		void getSortedErrors(errors, SIGN_CLIENT_CONNECTION_ERROR_CODE);

		assert.deepStrictEqual(
			errors.map((error) => error.code),
			[0, 'LICENSE_LIMITATIONS'],
		);
	});
});
