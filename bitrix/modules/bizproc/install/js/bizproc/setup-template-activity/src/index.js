import { EventEmitter } from 'main.core.events';
import { BitrixVue } from 'ui.vue3';
import { BlocksAppComponent } from './component/app/app';
import { generateConstantId } from './utils';
import type { ConstantConfiguration } from './types';

export class SetupTemplateActivity extends EventEmitter
{
	#app: null;
	#currentValues: Object;
	#blocksElement: ?(HTMLDivElement | HTMLTableElement);
	#constantConfigurationList: ConstantConfiguration[];

	constructor(parameters: {
		currentValues: Object,
		domElementId: string,
		constantConfigurationList: ConstantConfiguration[],
		previewComponent: {...},
	})
	{
		super();
		this.setEventNamespace('BX.Bizproc.Activity');
		this.#currentValues = parameters.currentValues;
		this.#blocksElement = document.getElementById(parameters.domElementId);
		this.#constantConfigurationList = parameters.constantConfigurationList;
	}

	#getBlocks(): string
	{
		const blocks = JSON.parse(this.#currentValues?.blocks) ?? [];

		blocks.forEach((block) => {
			block.id = generateConstantId();

			block.items.forEach((item) => {
				if (!item?.id)
				{
					item.id = generateConstantId();
				}
			});
		});

		return JSON.stringify(blocks);
	}

	unmount(): void
	{
		this.#app?.unmount();
	}

	init(): void
	{
		this.#app = BitrixVue.createApp(BlocksAppComponent, {
			serializedBlocks: this.#getBlocks(),
			constantConfigurationList: this.#constantConfigurationList,
			globalConstants: window.arWorkflowConstants || {},
		});
		this.#app.mount(this.#blocksElement);
	}
}
