import { Runtime } from 'main.core';

export class ExtensionLoader
{
	#extensionName: string;
	#exportName: string;
	#loadPromise: ?Promise<?Object> = null;
	#exports: ?Object = null;

	constructor(extensionName: string, exportName: string)
	{
		this.#extensionName = extensionName;
		this.#exportName = exportName;
	}

	load(): Promise<?Object>
	{
		this.#loadPromise ??= Runtime.loadExtension(this.#extensionName)
			.then((exports: Object): ?Object => {
				if (exports?.[this.#exportName])
				{
					this.#exports = exports;

					return exports;
				}

				this.#loadPromise = null;

				return null;
			})
			.catch((): null => {
				this.#loadPromise = null;

				return null;
			})
		;

		return this.#loadPromise;
	}

	getExports(): ?Object
	{
		return this.#exports;
	}
}

export const announcerLoader = new ExtensionLoader('ui.a11y', 'LiveAnnouncer');

export const resultServiceLoader = new ExtensionLoader(
	'tasks.v2.provider.service.result-service',
	'resultService',
);
