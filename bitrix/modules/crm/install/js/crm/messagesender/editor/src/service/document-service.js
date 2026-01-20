import { type Selector } from 'documentgenerator.selector';
import { Runtime, Type } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import { type Logger } from './logger';

export type Document = {
	title: string,
	publicUrl: string,
};

export class DocumentService
{
	#logger: Logger;
	#store: Store;

	#menu: ?Selector.Menu = null;

	constructor(params: { logger: Logger, store: Store })
	{
		this.#logger = params.logger;
		this.#store = params.store;
	}

	async selectOrCreateDocument(bindElement: HTMLElement): Promise<?Document>
	{
		void this.#store.dispatch('application/setProgress', { isLoading: true });

		try
		{
			const menu = await this.#getMenu();

			const result = await menu.show(bindElement);

			if (await this.#isDocument(result))
			{
				return {
					title: result.getTitle(),
					publicUrl: await this.#getPublicUrl(result),
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
					publicUrl: await this.#getPublicUrl(document),
				};
			}

			return null;
		}
		finally
		{
			void this.#store.dispatch('application/setProgress', { isLoading: false });
		}
	}

	async #getMenu(): Promise<Selector.Menu>
	{
		if (this.#menu)
		{
			return this.#menu;
		}

		const exports = await this.#loadExtension();

		/** @see BX.DocumentGenerator.Selector.Menu */
		this.#menu = new exports.Selector.Menu({
			moduleId: 'crm',
			provider: this.#store.state.application.contentProviders.documents.provider,
			value: this.#store.state.application.context.entityId,
			analyticsLabelPrefix: 'crmTimelineSmsEditor',
		});

		return this.#menu;
	}

	#getPublicUrl(document: Selector.Document): Promise<string>
	{
		return this.#getMenu()
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
