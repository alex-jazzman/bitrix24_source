import { Reflection } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { BlocksAppComponent } from './component/app';

const namespace = Reflection.namespace('BX.Bizproc.Activity');

class SetupTemplateActivity
{
	#currentValues: Object;
	#blocksElement: ?(HTMLDivElement | HTMLTableElement);
	#fieldTypeNames: Record<string, string>;

	constructor(parameters: {
		currentValues: Object,
		domElementId: string,
		fieldTypeNames: Record<string, string>,
	})
	{
		this.#currentValues = parameters.currentValues;
		this.#blocksElement = document.getElementById(parameters.domElementId);
		this.#fieldTypeNames = parameters.fieldTypeNames;
	}

	init(): void
	{
		const app = BitrixVue.createApp(BlocksAppComponent, {
			serializedBlocks: this.#currentValues?.blocks,
			fieldTypeNames: this.#fieldTypeNames,
		});
		app.mount(this.#blocksElement);
	}
}

namespace.SetupTemplateActivity = SetupTemplateActivity;
