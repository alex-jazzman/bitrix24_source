import { Dom, Loc, Tag, Type } from 'main.core';

const LOADING_CLASS = 'vibecodeconnector-app-link-loading';
const STATUS_CLASS = 'vibecodeconnector-app-link-status';
const LOADING_PHRASE_CODE = 'VIBECODECONNECTOR_SIDEPANEL_BINDER_APP_LINK_LOADING';

export function setLoadingState(anchor: HTMLElement | null, loading: boolean): void
{
	if (anchor === null)
	{
		return;
	}

	if (loading)
	{
		Dom.addClass(anchor, LOADING_CLASS);
		Dom.attr(anchor, 'aria-busy', 'true');
	}
	else
	{
		Dom.removeClass(anchor, LOADING_CLASS);
		Dom.attr(anchor, 'aria-busy', null);
	}

	announceLoadingState(anchor.ownerDocument, loading);
}

function announceLoadingState(ownerDocument: Document, loading: boolean): void
{
	const phrase = Loc.getMessage(LOADING_PHRASE_CODE) ?? '';
	if (loading && !Type.isStringFilled(phrase))
	{
		return;
	}

	const statusNode = loading ? getStatusNode(ownerDocument) : findStatusNode(ownerDocument);
	if (statusNode === null)
	{
		return;
	}

	const message = loading ? phrase : '';
	setTimeout(() => {
		statusNode.textContent = message;
	}, 0);
}

function findStatusNode(ownerDocument: Document): HTMLElement | null
{
	return ownerDocument.body.querySelector(`.${STATUS_CLASS}`);
}

function getStatusNode(ownerDocument: Document): HTMLElement
{
	const existingNode = findStatusNode(ownerDocument);
	if (existingNode !== null)
	{
		return existingNode;
	}

	const statusNode: HTMLElement = Tag.render`
		<div class="${STATUS_CLASS}" role="status" aria-live="polite"></div>
	`;
	Dom.append(statusNode, ownerDocument.body);

	return statusNode;
}
