import { PlaceholdersApp } from './app';
import { PlaceholdersMount } from './mount';
import './style.css';

export { PlaceholdersApp, PlaceholdersMount };

const sidePanelConfig = Object.freeze({
	link: 'sign:stub:placeholder-list',
	width: 500,
});

export class Placeholders
{
	#mount = null;

	async show(): Promise<any>
	{
		return new Promise((resolve) => {
			BX.SidePanel.Instance.open(sidePanelConfig.link, {
				width: sidePanelConfig.width,
				cacheable: false,
				contentCallback: async () => {
					const container = this.#createContainer();
					this.#mount = new PlaceholdersMount({ container });
					await this.#mount.load();

					return container;
				},
				events: {
					onOpen: () => {
						resolve();
					},
					onClose: () => {
						this.#mount?.unmount();
					},
				},
			});
		});
	}

	#createContainer(): HTMLElement
	{
		return BX.Tag.render`<div class="sign-placeholders-container"></div>`;
	}
}
