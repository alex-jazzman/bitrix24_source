import { Dom } from 'main.core';
import { Api } from 'sign.v2.api';

import { type DocumentProcess, renderProcessLine } from './line';

import './style.css';

export type DocumentProcessLinkOptions = {
	containerId: string,
	documentId: number,
};

/**
 * The line "Created by the process ..." on the page of a document of the KEDO section - the second half of
 * the link between a document and the process that created it, the first being the deal in the timeline.
 *
 * The card of the document itself is a component of crm and takes nothing from outside, so the line stands
 * on the page sign owns (Q-4).
 */
export class DocumentProcessLink
{
	static async mount(options: DocumentProcessLinkOptions): Promise<void>
	{
		const container = document.getElementById(options.containerId);
		if (container === null || options.documentId < 1)
		{
			return;
		}

		const line = renderProcessLine(await DocumentProcessLink.#load(options.documentId));
		if (line !== null)
		{
			Dom.append(line, container);
		}
	}

	/**
	 * The process of the document. A refused request leaves the page as it was: the transport of the module
	 * reports the refusal itself, and a document without a line is the ordinary document of the section.
	 */
	static async #load(documentId: number): Promise<DocumentProcess | null>
	{
		try
		{
			return (await new Api().process.getByDocument(documentId)).process;
		}
		catch
		{
			return null;
		}
	}
}
