import { EventEmitter } from 'main.core.events';
import { BitrixVue } from 'ui.vue3';
import { BlocksAppComponent } from './component/app/app';
import { generateConstantId } from './utils';

export class SetupTemplateActivity extends EventEmitter
{
	#app: null;
	#currentValues: Object;
	#blocksElement: ?(HTMLDivElement | HTMLTableElement);
	#fieldTypeNames: Record<string, string>;

	constructor(parameters: {
		currentValues: Object,
		domElementId: string,
		fieldTypeNames: Record<string, string>,
		previewComponent: {...},
	})
	{
		super();
		this.setEventNamespace('BX.Bizproc.Activity');
		this.#currentValues = parameters.currentValues;
		this.#blocksElement = document.getElementById(parameters.domElementId);
		this.#fieldTypeNames = parameters.fieldTypeNames;
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
			fieldTypeNames: this.#fieldTypeNames,
			globalConstants: window.arWorkflowConstants || {},
		});
		this.#app.mount(this.#blocksElement);
	}
}
