import { Api } from 'sign.v2.api';
import { BitrixVue } from 'ui.vue3';
import { Loader } from 'main.loader';
import { PlaceholdersApp } from './app';

export type PlaceholdersMountOptions = {
	container: HTMLElement,
	showHeader?: boolean,
};

/**
 * The surfaces of the panel - the slider and the floating widget - differ in the frame they give it,
 * not in the way it is built: both load the list and build the whole application anew from it.
 */
export class PlaceholdersMount
{
	#api = new Api();
	#options: PlaceholdersMountOptions;
	#loader: Loader;
	#app = null;
	#appInstance = null;

	constructor(options: PlaceholdersMountOptions)
	{
		this.#options = options;
		this.#loader = new Loader({ target: options.container });
	}

	getAppInstance(): any
	{
		return this.#appInstance;
	}

	async load(clearCache: boolean = false, restoreFocus: boolean = false): Promise<void>
	{
		void this.#loader.show();

		try
		{
			const placeholdersData = await this.#api.placeholder.list(clearCache);
			this.mount(placeholdersData, restoreFocus);
		}
		catch (error)
		{
			console.error('Load placeholders data error:', error);
		}
		finally
		{
			void this.#loader.hide();
		}
	}

	// The reload replaces the whole application, so the request for the focus travels with the update:
	// the panel that asked for it is unmounted before the new one appears.
	mount(placeholdersData: any, restoreFocus: boolean = false): void
	{
		this.unmount();

		this.#app = BitrixVue.createApp(PlaceholdersApp, {
			sectionsData: placeholdersData,
			showHeader: this.#options.showHeader ?? true,
			restoreFocus,
			onListUpdate: (options?: { restoreFocus?: boolean }) => {
				void this.load(true, options?.restoreFocus === true);
			},
		});
		this.#appInstance = this.#app.mount(this.#options.container);
	}

	unmount(): void
	{
		if (this.#app)
		{
			this.#app.unmount();
			this.#app = null;
			this.#appInstance = null;
		}
	}
}
