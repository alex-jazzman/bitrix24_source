import { Type } from 'main.core';

import { HeaderElement, type HeaderElementValue } from '../../const/element';
import { HeaderErrorCode } from '../../const/error';
import { documentHeaderService } from '../../infrastructure/service/document-header/document-header';
import { mapCompositionDtoToModel } from '../../infrastructure/service/document-header/mappers';
import { type HeaderServiceError } from '../../infrastructure/service/document-header/types';
import { useCompositionStore } from '../../model/composition/composition';

export type LoadCompositionResult =
	| { success: true }
	| { success: false, error: HeaderServiceError }
;

/** Elements the header serves by asking the controller, and the controller knows the opening by its session. */
const SessionBoundElements: ReadonlySet<HeaderElementValue> = new Set([HeaderElement.Rename, HeaderElement.Presence]);

/** The refusal of a request there is nothing to make it by; the caller decides what it means for it. */
const NoSessionError: HeaderServiceError = { code: HeaderErrorCode.NoDocumentSession, message: '' };

/**
 * The composition of the header for the opened object. The store knows nothing about the network and
 * the service knows nothing about the store, so the two are put together here; a refusal is handed
 * over to the caller, which decides that the header simply does not appear.
 */
export async function loadComposition(documentSessionHash: string | undefined): Promise<LoadCompositionResult>
{
	if (!Type.isStringFilled(documentSessionHash))
	{
		return { success: false, error: NoSessionError };
	}

	const result = await documentHeaderService.getComposition(documentSessionHash);
	if (!result.success)
	{
		return { success: false, error: result.error };
	}

	useCompositionStore().setComposition(result.data);

	return { success: true };
}

/**
 * The composition the page handed over together with itself. It is described by the very same service
 * the action of the controller answers with, so nothing is decided here beyond «is this a description
 * at all»: an answer which describes no opening is refused exactly the way a fetched one is.
 *
 * @returns `false` when the page carried no usable description - the caller then asks for it.
 */
export function applyComposition(response: unknown): boolean
{
	const composition = mapCompositionDtoToModel(response);
	if (composition === null)
	{
		return false;
	}

	useCompositionStore().setComposition(composition);

	return true;
}

/**
 * Whether the opening cannot be served without the session of the document: the page carried no
 * usable description, or the description asks for an element fetched from the controller.
 */
export function requiresDocumentSession(response: unknown): boolean
{
	const composition = mapCompositionDtoToModel(response);

	return composition === null
		|| composition.elements.some((element: HeaderElementValue) => SessionBoundElements.has(element))
	;
}
