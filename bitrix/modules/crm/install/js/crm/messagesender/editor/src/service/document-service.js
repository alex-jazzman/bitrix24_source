import { Runtime, Type } from 'main.core';

import { type Selector } from 'documentgenerator.selector';
import { type Logger } from './logger';

export type Document = {
	title: string,
	publicUrl: string,
};

export class DocumentService
{
	#logger: Logger;
	#menu: ?Selector.Menu = null;
	#menuCustomData: ?Object = null;

	constructor({ logger }: { logger: Logger })
	{
		this.#logger = logger;
	}

	async selectOrCreateDocument(bindElement: HTMLElement, customData: Object): Promise<?Document>
	{
		const menu = await this.#getMenu(customData);

		const result = await menu.show(bindElement);

		if (await this.#isDocument(result))
		{
			return {
				title: result.getTitle(),
				publicUrl: await this.#getPublicUrl(result, customData),
			};
		}

		if (await this.#isTemplate(result))
		{
			let document = null;
			try
			{
				document = await menu.createDocument(result);
			}
			catch (error)
			{
				this.#logger.error('Failed to create document from template', { template: result, error });

				throw error;
			}

			if (Type.isNil(document))
			{
				return null;
			}

			return {
				title: document.getTitle(),
				publicUrl: await this.#getPublicUrl(document, customData),
			};
		}

		return null;
	}

	async #getMenu(customData: Object): Promise<Selector.Menu>
	{
		if (this.#menu && this.#menuCustomData === customData)
		{
			return this.#menu;
		}

		const exports = await this.#loadExtension();

		const { moduleId, provider, value } = customData;

		/** @see BX.DocumentGenerator.Selector.Menu */
		this.#menu = new exports.Selector.Menu({
			moduleId,
			provider,
			value,
		});
		this.#menuCustomData = customData;

		return this.#menu;
	}

	#getPublicUrl(document: Selector.Document, customData: Object): Promise<string>
	{
		return this.#getMenu(customData)
			.then((menu) => {
				return menu.getDocumentPublicUrl(document);
			})
			.catch((error) => {
				this.#logger.error('Failed to get document public URL', { document, error });

				throw error;
			})
		;
	}

	async #isDocument(object: any): Promise<boolean>
	{
		const exports = await this.#loadExtension();

		/** @see BX.DocumentGenerator.Selector.Document */
		return object instanceof exports.Selector.Document;
	}

	async #isTemplate(object: any): Promise<boolean>
	{
		const exports = await this.#loadExtension();

		/** @see BX.DocumentGenerator.Selector.Template */
		return object instanceof exports.Selector.Template;
	}

	#loadExtension(): Promise<Object>
	{
		return Runtime.loadExtension('documentgenerator.selector')
			.catch((error) => {
				this.#logger.error('Failed to load documentgenerator.selector', error);

				throw error;
			})
		;
	}
}
