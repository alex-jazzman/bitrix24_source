import { Type } from 'main.core';
import { getUserFacingErrorHtml } from 'biconnector.error-message';

import {
	AUTH_REQUIRED_ERROR_CODE,
	type ConnectionResponse,
	NETWORK_ERROR_CODE,
	type Refusal,
	RefusalForm,
} from '../../const/connection';

const readLimitCode = (customData: unknown): string | null => {
	if (!Type.isPlainObject(customData) || !Type.isStringFilled(customData.limitCode))
	{
		return null;
	}

	return customData.limitCode;
};

/**
 * ALG-01: the refusal described by the first error of the answer. One function serves all three sources -
 * the refusal with a successful HTTP status, the one the core call restored from an unsuccessful status
 * and the synthesized network one - because all three reach here as the same parsed answer.
 *
 * It reads the first error and not the first person-facing one: the order of the filters puts the
 * earliest cause first, and the ready picker of a text scans the whole array, so on an expired session it
 * would show the absence of the rights in BI instead of the requirement to sign in.
 *
 * Nothing is decided here and nothing is opened: the form, the signs and the ready server text are
 * returned, and the state to show them by is chosen by the scenarios.
 */
export const classifyRefusal = (response: ConnectionResponse): Refusal | null => {
	const error = response.errors.at(0);

	if (!error)
	{
		return null;
	}

	if (error.code === NETWORK_ERROR_CODE)
	{
		return { form: RefusalForm.Core, noServerVerdict: true, humanText: null };
	}

	if (error.code === AUTH_REQUIRED_ERROR_CODE)
	{
		return { form: RefusalForm.Core, authRequired: true, humanText: null };
	}

	// The signs of the branch are read only here: the two other forms carry none of them (AC-024).
	if ('branch' in error)
	{
		return {
			form: RefusalForm.Adapter,
			branch: error.code,
			retryable: error.retryable === true,
			previousConnectionMayBeLost: error.previousConnectionMayBeLost === true,
			humanText: getUserFacingErrorHtml(error),
		};
	}

	// The code of the tariff limit travels in the answers of the issue and of the reissue alone; the
	// refusal of the reading of the state carries `customData: null` and gives no code (AC-028).
	if (error.userFacing === true)
	{
		return {
			form: RefusalForm.Gateway,
			code: error.code,
			limitCode: readLimitCode(error.customData),
			humanText: getUserFacingErrorHtml(error),
		};
	}

	// The rest of the third form: the text of these codes is not meant for a person, so none travels up.
	return { form: RefusalForm.Core, code: error.code, humanText: null };
};
