import { Loc, Tag, Text } from 'main.core';

/**
 * The process a signing document was created by, as API-07 gives it out.
 */
export type DocumentProcess = {
	workflowId: string,
	entityId: number,
	name: string,
	url: string,
};

/**
 * An address the card may lead to. The card of a process lives on the portal, and an address beginning with
 * two slashes is a protocol-relative one - it would take the person off it.
 */
export function isInternalUrl(url: string): boolean
{
	return url.startsWith('/') && !url.startsWith('//');
}

/**
 * The line "Created by the process ..." of the card of a document. An empty answer leaves the card without
 * it and is not a failure: a document created by no process and a process the person may not see arrive
 * alike from API-07, and the card must not tell them apart.
 *
 * The feature switched off is answered before this: the page mounts nothing under a closed flag, and the
 * action itself answers with no process at all (AC-017).
 */
export function renderProcessLine(process: DocumentProcess | null): HTMLElement | null
{
	if (process === null)
	{
		return null;
	}

	return Tag.render`
		<div class="sign-b2e-document-process-link" data-testid="sign-b2e-document-process-link">
			<span class="sign-b2e-document-process-link__label">
				${Text.encode(Loc.getMessage('SIGN_B2E_DOCUMENT_PROCESS_LINK_LABEL') ?? '')}
			</span>
			${renderName(process)}
		</div>
	`;
}

/**
 * The name of the process, and where it leads. A name the card cannot lead anywhere from is still worth
 * saying: the person learns what created the document even when the address is not one to follow.
 */
function renderName(process: DocumentProcess): HTMLElement
{
	const name = Text.encode(process.name);
	if (!isInternalUrl(process.url))
	{
		return Tag.render`<span class="sign-b2e-document-process-link__name">${name}</span>`;
	}

	return Tag.render`
		<a
			class="sign-b2e-document-process-link__name"
			href="${Text.encode(process.url)}"
			target="_top"
			data-testid="sign-b2e-document-process-link-url"
		>${name}</a>
	`;
}
