import { type SignatureItemDto } from '../../../model/compose/types';

export type AjaxError = {
	code?: string | number,
	message: string,
	customData?: unknown,
};

/** A failed request rejects with an envelope of the same shape, so the errors are read in one place. */
export type AjaxResponse<T> = {
	data: T,
	errors: AjaxError[],
	status: 'success' | 'error',
};

/** The shape of the signatures block of the initial data, minus the settings path that data alone carries. */
export type SignaturesResponse = {
	bySender?: Record<string, SignatureItemDto[]>,
	choices?: Record<string, string>,
};

/** The address comes with the flag turned on alone, so the flag is what the form checks. */
export type CalendarSharingLinkResponse = {
	isSharingFeatureEnabled?: boolean,
	sharingUrl?: string,
};
