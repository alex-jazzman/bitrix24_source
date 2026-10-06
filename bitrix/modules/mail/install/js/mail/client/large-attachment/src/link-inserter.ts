import { Loc, Tag, Text, Type } from 'main.core';

import { MainMailFormAdapter } from './adapter/main-mail-form-adapter';
import { type LargeAttachmentFormAdapter } from './type/form-adapter';

export type InsertedLink = {
	publicUrl: string,
	token: string,
	fileIds: number[],
	sourceFileIds?: number[],
	folderName: string,
};

export class LinkInserter
{
	#formAdapter: Pick<LargeAttachmentFormAdapter, 'getBody' | 'insertBody' | 'setBody'>;
	#inserted: InsertedLink[] = [];

	constructor(
		formAdapter: Pick<LargeAttachmentFormAdapter, 'getBody' | 'insertBody' | 'setBody'> | string,
	)
	{
		this.#formAdapter = Type.isString(formAdapter)
			? new MainMailFormAdapter({ formId: formAdapter, uploaderControlId: '' })
			: formAdapter
		;
	}

	// Inserts the public Disk link into the editor body as a plain hyperlink (not an attachment tag)
	// and remembers it for the post-send scenario (SC-004). Returns false when the editor is not reachable.
	insert(link: InsertedLink): boolean
	{
		const title = link.folderName || Loc.getMessage('MAIL_LARGE_ATTACHMENT_LINK_TITLE') || '';
		const html = LinkInserter.buildLinkHtml(link.publicUrl, title);
		if (!this.#formAdapter.insertBody(link.publicUrl, html))
		{
			return false;
		}

		this.#inserted.push(link);

		return true;
	}

	getInserted(): InsertedLink[]
	{
		return [...this.#inserted];
	}

	restore(links: InsertedLink[]): boolean
	{
		return links.every((link: InsertedLink): boolean => {
			const title = link.folderName || Loc.getMessage('MAIL_LARGE_ATTACHMENT_LINK_TITLE') || '';
			const html = LinkInserter.buildLinkHtml(link.publicUrl, title);

			return this.#formAdapter.insertBody(link.publicUrl, html);
		});
	}

	replace(links: InsertedLink[], replacement: InsertedLink): boolean
	{
		const content = this.#formAdapter.getBody();
		const container = document.createElement('div');
		container.innerHTML = content;
		const replacedUrls = new Set(links.map((link: InsertedLink): string => (
			LinkInserter.#normalizeUrl(link.publicUrl)
		)));
		const anchors = [...container.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(
			(anchor: HTMLAnchorElement): boolean => replacedUrls.has(LinkInserter.#normalizeUrl(anchor.href)),
		);
		if (anchors.length === 0)
		{
			return false;
		}

		anchors[0].setAttribute('href', replacement.publicUrl);
		anchors.slice(1).forEach((anchor: HTMLAnchorElement): void => {
			anchor.remove();
		});

		return this.#formAdapter.setBody(container.innerHTML);
	}

	remove(links: InsertedLink[]): void
	{
		const content = this.#formAdapter.getBody();
		const container = document.createElement('div');
		container.innerHTML = content;
		const removedUrls = new Set(links.map((link: InsertedLink): string => (
			LinkInserter.#normalizeUrl(link.publicUrl)
		)));
		container.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor: HTMLAnchorElement): void => {
			if (removedUrls.has(LinkInserter.#normalizeUrl(anchor.href)))
			{
				anchor.remove();
			}
		});
		const updatedContent = container.innerHTML;

		if (updatedContent !== content)
		{
			this.#formAdapter.setBody(updatedContent);
		}
	}

	// User-controlled data (folder/set name) is escaped; the URL is escaped for attribute context.
	static buildLinkHtml(url: string, title: string): string
	{
		const link: HTMLAnchorElement = Tag.render`<a href="${Text.encode(url)}">${Text.encode(title)}</a>`;

		return link.outerHTML;
	}

	static #normalizeUrl(url: string): string
	{
		const anchor = document.createElement('a');
		anchor.href = url;

		return anchor.href;
	}
}
