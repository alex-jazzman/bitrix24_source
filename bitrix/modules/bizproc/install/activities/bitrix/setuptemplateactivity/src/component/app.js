import { EventEmitter } from 'main.core.events';
import { convertConstants } from '../utils';
import { BlockComponent } from './block';
import { ITEM_TYPES } from '../constants';

import type { Block, ConstantItem, Item, UpdateItemPropertyEventPayload } from '../types';

const ACTIVITY_NAME = 'SetupTemplateActivity';

// @vue/component
export const BlocksAppComponent = {
	name: 'BlocksAppComponent',
	components: { BlockComponent },
	props: {
		serializedBlocks: {
			type: [String, null],
			required: true,
		},
		/** Record<string, string> */
		fieldTypeNames: {
			type: Object,
			required: true,
		},
	},
	data(): { blocks: Block[] }
	{
		return {
			blocks: JSON.parse(this.serializedBlocks) ?? [],
			initialConstantIds: null,
		};
	},
	computed: {
		formValue(): string
		{
			return JSON.stringify(this.blocks);
		},
	},
	created()
	{
		this.initialConstantIds = new Set(
			this.blocks
				.flatMap((block) => block.items || [])
				.filter((item) => item?.itemType === ITEM_TYPES.CONSTANT && item.id)
				.map((item) => item.id),
		);
	},
	mounted()
	{
		EventEmitter.subscribe(
			'Bizproc.NodeSettings:nodeSettingsSaving',
			this.onNodeSettingsSave,
		);
	},
	unmounted()
	{
		EventEmitter.unsubscribe(
			'Bizproc.NodeSettings:nodeSettingsSaving',
			this.onNodeSettingsSave,
		);
	},
	methods: {
		addBlock(): void
		{
			this.blocks.push(this.makeEmptyBlock());
		},
		makeEmptyBlock(): Block
		{
			return { items: [] };
		},
		addItem(blockIndex: number, item: Item): void
		{
			this.blocks[blockIndex].items.push(item);
		},
		deleteBlock(blockIndex: number): void
		{
			this.blocks.splice(blockIndex, 1);
		},
		deleteItem(blockIndex: number, itemIndex: number): void
		{
			this.blocks[blockIndex].items.splice(itemIndex, 1);
		},
		onUpdateItemProperty(blockIndex: number, payload: UpdateItemPropertyEventPayload): void
		{
			for (const [property: string, value] of Object.entries(payload.propertyValues))
			{
				this.blocks[blockIndex].items[payload.itemIndex][property] = value;
			}
		},
		onNodeSettingsSave(event): void
		{
			const { formData } = event.getData();

			if (formData.activity !== ACTIVITY_NAME)
			{
				return;
			}

			const currentConstants: ConstantItem[] = this.blocks
				.flatMap((block) => block.items || [])
				.filter((item) => item?.itemType === ITEM_TYPES.CONSTANT);

			const currentConstantIds = new Set(currentConstants.map((item) => item.id));
			const deletedConstantIds = [];
			for (const initialId of this.initialConstantIds)
			{
				if (!currentConstantIds.has(initialId))
				{
					deletedConstantIds.push(initialId);
				}
			}

			const constantsToUpdate = {};
			for (const constant of currentConstants)
			{
				if (constant?.id)
				{
					constantsToUpdate[constant.id] = convertConstants(constant);
				}
			}

			EventEmitter.emit('Bizproc:onConstantsUpdated', {
				constantsToUpdate,
				deletedConstantIds,
			});

			this.initialConstantIds = currentConstantIds;
		},
	},
	template: `
		<div>
			<input type="hidden" id="id_blocks" name="blocks" :value="formValue"/>
			<div>
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_APP_TITLE') }}
			</div>
			<div v-for="(block, index) in blocks">
				<BlockComponent 
					:key="index"
					:items="block.items"
					:position="index + 1"
					:fieldTypeNames="fieldTypeNames"
					@addItem="addItem(index, $event)"
					@deleteBlock="deleteBlock(index)"
					@deleteItem="deleteItem(index, $event)"
					@updateItemProperty="onUpdateItemProperty(index, $event)"
				/>
			</div>
			<div @click="addBlock">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_BLOCK') }}
			</div>
		</div>
	`,
};
