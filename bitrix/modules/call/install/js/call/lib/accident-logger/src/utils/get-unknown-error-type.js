import { Type } from 'main.core';

export function getUnknownErrorType(errorMsg)
{
	/**
	 * A map of error types to patterns for matching.
	 * Supports: strings (checked via .includes()), regular expressions (via .test()), and arrays of patterns.
	 */
	const ERROR_PATTERNS = {
		NULL_PROPERTY_READING: [
			'Cannot read properties of null',
			/Cannot read property.*of null/i,
		],
		UNDEFINED_PROPERTY_READING: 'Cannot read properties of undefined',
		EMPTY_CALLTOKEN: 'Empty callToken',
		UNKNOWN_JS_FUNCTION: 'BX JS Extension: Unknown JS function!',
		NOT_FUNCTION: 'is not a function',
		NULL_NOT_OBJECT: 'null is not an object',
		UNDEFINED_NOT_OBJECT: 'undefined is not an object',
		NULL_PROPERTY_ACCESS: /can't access property.*is null/i,
		UNDEFINED_PROPERTY_ACCESS: /can't access property.*is undefined/i,
		CALL_NOT_FOUND: 'Call not found',
		IS_NULL: 'is null',
		IS_UNDEFINED: 'is undefined',
		NOT_CONSTRUCTOR: 'is not a constructor',
	};

	/**
	 * Checks if the error message matches the given pattern.
	 * @param {string} msg - the error message to check
	 * @param {string|RegExp|Array} pattern - the pattern to match against
	 * @returns {boolean} true if a match is found
	 */
	function matchesPattern(msg, pattern)
	{
		if (!Type.isString(msg))
		{
			return false;
		}

		if (Type.isString(pattern))
		{
			return msg.includes(pattern);
		}

		if (pattern instanceof RegExp)
		{
			return pattern.test(msg);
		}

		if (Array.isArray(pattern))
		{
			return pattern.some((item) => matchesPattern(msg, item));
		}

		return false;
	}

	// Iterate through all error types and check if the message matches any pattern
	for (const [errorType, pattern] of Object.entries(ERROR_PATTERNS))
	{
		if (matchesPattern(errorMsg, pattern))
		{
			return errorType;
		}
	}

	// If no pattern matches, return the default error type
	return 'UNKNOWN_ERROR';
}
