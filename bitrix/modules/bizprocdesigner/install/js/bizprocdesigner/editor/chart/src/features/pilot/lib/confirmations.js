import { Text, Type } from 'main.core';

import type { ApiError } from '../../../shared/api';

// A refusal the publisher may lift by confirming the consequences the server named in data.required.
const CONFIRMATION_REQUIRED_ERROR_CODE = 'CONFIRMATION_REQUIRED';

// One answer may carry several refusals and only some of them may be confirmed away, so the code is
// looked for among all of them: which refusal the server named first decides nothing.
function isConfirmationRefusal(error: ApiError): boolean
{
	const errors = Type.isArrayFilled(error?.errors) ? error.errors : [];

	return errors.some((item: { code?: string }) => item?.code === CONFIRMATION_REQUIRED_ERROR_CODE);
}

/**
 * The codes the server asks to confirm and has not been given yet. What is asked for is the list of
 * data.required, and the code of the refusal only tells that the list may be acted upon at all -
 * neither of them is read by its place in the answer. Confirmations accumulate: a server that asks in
 * two rounds must not lose the code confirmed in the first one. A code demanded a second time cannot be
 * confirmed any further, so such an answer reads as an ordinary refusal instead of looping the
 * operation.
 */
export function getMissingConfirmations(error: ApiError, confirmations: Array<string>): Array<string>
{
	const required = Type.isArrayFilled(error?.data?.required) ? error.data.required : [];
	if (required.length === 0 || !isConfirmationRefusal(error))
	{
		return [];
	}

	return required.filter((code: string) => !confirmations.includes(code));
}

/**
 * What the publisher is told before an operation over the pilot: every consequence the server named on
 * a line of its own, because a single common warning would hide one of them. A code this editor does
 * not know yet is left to the wording of the server, and a refusal without a message to the general one.
 *
 * The text goes into markup, so the wording of the server is encoded; a phrase of the localization is
 * markup of this editor and is left as it is - encoding it would show its own entities literally.
 *
 * @param messages code of a confirmation -> id of the phrase describing its consequence
 * @param getMessage the localization of the caller, so the same builder serves the store and the components
 */
export function buildConsequencesText(
	{ required, error, messages, getMessage, fallbackMessageId }: {
		required: Array<string>,
		error: ApiError,
		messages: Map<string, string>,
		getMessage: (messageId: string) => ?string,
		fallbackMessageId: string,
	},
): string
{
	const consequences = required
		.filter((code: string) => messages.has(code))
		.map((code: string) => (getMessage(messages.get(code)) ?? ''))
	;

	if (consequences.length === 0)
	{
		const [firstError] = error.errors ?? [];

		consequences.push(
			Type.isStringFilled(firstError?.message)
				? Text.encode(firstError.message)
				: (getMessage(fallbackMessageId) ?? ''),
		);
	}

	return consequences.join('<br>');
}
