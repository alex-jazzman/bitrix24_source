import { Api } from 'sign.v2.api';
import { BitrixVue } from 'ui.vue3';
import { PlaceholdersApp } from './app';
import { Loader } from 'main.loader';
import './style.css';

const sidePanelConfig = Object.freeze({
	link: 'sign:stub:placeholder-list',
	width: 500,
});

export class Placeholders
{
	#api = new Api();
	#app = null;
	#container = null;
	#loader = null;

	async show(): Promise<any>
	{
		return new Promise((resolve) => {
			BX.SidePanel.Instance.open(sidePanelConfig.link, {
				width: sidePanelConfig.width,
				cacheable: false,
				contentCallback: async () => {
					this.#container = this.#createContainer();
					this.#loader = new Loader({ target: this.#container });
					await this.#loadPlaceholders();

					return this.#container;
				},
				events: {
					onOpen: () => {
						resolve();
					},
					onClose: () => {
						this.#unmount();
					},
				},
			});
		});
	}

	async #loadPlaceholders(clearCache: boolean = false): Promise<void>
	{
		void this.#loader.show();

		try
		{
			const placeholdersData = await this.#api.placeholder.list(clearCache);
			this.#unmount();
			this.#createApp(this.#container, placeholdersData);
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

	#createContainer(): HTMLElement
	{
		return BX.Tag.render`<div class="sign-placeholders-container"></div>`;
	}

	#createApp(container: HTMLElement, placeholdersData: any): void
	{
		this.#app = BitrixVue.createApp(PlaceholdersApp, {
			sectionsData: placeholdersData,
			onListUpdate: () => {
				void this.#loadPlaceholders(true);
			},
		});
		this.#app.mount(container);
	}

	#unmount(): void
	{
		if (this.#app)
		{
			this.#app.unmount();
			this.#app = null;
		}
	}
}
