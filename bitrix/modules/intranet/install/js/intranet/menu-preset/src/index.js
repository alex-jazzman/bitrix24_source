import { Type, Extension } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { Preset } from './preset';

import './style.css';

export type MenuPresetParamsType = {
	containerNode: HTMLElement,
	presetData?: Object,
	currentPresetId?: String,
};

export class MenuPreset
{
	#templateNode: ?HTMLElement = null;
	#application: ?Object = null;

	constructor(params: MenuPresetParamsType)
	{
		const containerNode = params?.containerNode;

		if (!Type.isDomNode(containerNode))
		{
			return;
		}

		this.#templateNode = containerNode.cloneNode(true);

		this.#application = BitrixVue.createApp(Preset, {
			rootNode: this.#templateNode,
			currentPresetId: params.currentPresetId,
			presetData: Extension.getSettings('intranet.menu-preset').presetData,
		});

		this.#application.mount(this.#templateNode);
	}

	getContent(): ?HTMLElement
	{
		return this.#templateNode;
	}
}
