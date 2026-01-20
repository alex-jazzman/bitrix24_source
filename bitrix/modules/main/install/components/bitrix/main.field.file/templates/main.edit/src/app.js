import { Type } from 'main.core';
import { BitrixVue, VueCreateAppResult } from 'ui.vue3';
import { Main, AppContext } from './components/main';

declare type AppConstructorParams = {
	fieldName: string,
	controlId: string,
	containerId: string,
	context: AppContext,
	value: Array,
};

export class App
{
	#app: ?VueCreateAppResult = null;

	constructor(params: AppConstructorParams)
	{
		const container = document.getElementById(params.containerId);

		if (!Type.isDomNode(container))
		{
			throw new Error('container not found');
		}

		this.#app = BitrixVue.createApp(
			{
				...Main,
			},
			{
				fieldName: params.fieldName,
				controlId: params.controlId,
				context: params.context,
				values: params.value.map((value) => parseInt(value, 10)),
			},
		);

		this.#app.mount(container);
	}
}
