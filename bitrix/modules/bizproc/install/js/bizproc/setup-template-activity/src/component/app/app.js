import { BaseEvent, EventEmitter } from 'main.core.events';
import { Slider } from 'main.sidepanel';
// eslint-disable-next-line no-unused-vars
import { markRaw, computed } from 'ui.vue3';

import { BlockComponent } from '../block/block';
import { AddBlockBtn } from '../add-block-btn/add-block-btn';
import { AddElementBtn } from '../add-element-btn/add-element-btn';

import { AppHeader } from '../app-header/app-header';
import { PreviewBtn } from '../preview-btn/preview-btn';
import { TitleField } from '../title-field/title-field';
import { DescriptionField } from '../description-field/description-field';
import { DelimiterField } from '../delimiter-field/delimiter-field';
import { ConstantField } from '../constant-field/constant-field';
import { TitleIconField } from '../title-icon-field/title-icon-field';

import { EditConstantPopupForm } from '../edit-constant-popup-form/edit-constant-popup-form';

import { PreviewApp } from '../preview-app/preview-app';
import { makeEmptyBlock, convertConstants } from '../../utils';
import { ITEM_TYPES } from '../../constants';

import './app.css';
import type {
	Block,
	Item,
	UpdateItemPropertyEventPayload,
	ConstantItem,
} from '../../types';

const ACTIVITY_NAME = 'SetupTemplateActivity';

const ELEMENT_COMPONENTS = {
	[ITEM_TYPES.TITLE]: TitleField,
	[ITEM_TYPES.TITLE_WITH_ICON]: TitleIconField,
	[ITEM_TYPES.DESCRIPTION]: DescriptionField,
	[ITEM_TYPES.DELIMITER]: DelimiterField,
	[ITEM_TYPES.CONSTANT]: ConstantField,
};

type ItemDragStartPayload = {
	event: MouseEvent,
	element: HTMLElement,
};

// @vue/component
export const BlocksAppComponent = {
	name: 'BlocksAppComponent',
	components: {
		BlockComponent,
		AddBlockBtn,
		AddElementBtn,
		AppHeader,
		PreviewBtn,
		TitleField,
		TitleIconField,
		DescriptionField,
		DelimiterField,
		ConstantField,
		PreviewApp,
		EditConstantPopupForm,
	},
	provide(): { sliderInstance: typeof Slider }
	{
		return {
			editSlider: computed(() => this.sliderInstance),
		};
	},
	props:
	{
		serializedBlocks: {
			type: [String, null],
			required: true,
		},
		/** Record<string, string> */
		fieldTypeNames: {
			type: Object,
			required: true,
		},
		globalConstants: {
			type: Object,
			required: false,
			default: () => ({}),
		},
	},
	data(): { blocks: Block[] }
	{
		return {
			blocks: [],
			isShowPreview: false,
			sliderInstance: null,
			initialConstantIds: new Set(),
			currentBlockIndex: null,
			createdConstant: null,
		};
	},
	computed:
	{
		formValue(): string
		{
			return JSON.stringify(this.blocks);
		},
		preparedBlocks(): Block[]
		{
			return this.blocks
				.map((block, index) => {
					const items = block.items
						.map((item) => {
							if (!item.text && item.itemType === ITEM_TYPES.TITLE)
							{
								return {
									...item,
									text: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_CONTENT'),
								};
							}

							if (!item.text && item.itemType === ITEM_TYPES.DESCRIPTION)
							{
								return {
									...item,
									text: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_CONTENT'),
								};
							}

							return { ...item };
						});

					return {
						...block,
						items,
					};
				});
		},
		localConstants(): Array<ConstantItem>
		{
			return this.blocks
				.flatMap((block) => block.items || [])
				.filter((item) => item?.itemType === ITEM_TYPES.CONSTANT);
		},
		localConstantIds(): string[]
		{
			return this.localConstants
				.filter((item) => item.id)
				.map((item) => item.id);
		},
		allConstantIds(): Set<string>
		{
			const globalIds = Object.keys(this.globalConstants);
			const localIds = this.localConstantIds;

			return new Set([...globalIds, ...localIds]);
		},
	},
	mounted(): void
	{
		this.initEditSlider();
		this.blocks = JSON.parse(this.serializedBlocks) ?? [];
		this.initialConstantIds = new Set(this.localConstantIds);

		EventEmitter.subscribe('SidePanel.Slider:onClosing', this.onCancelConstant);
		EventEmitter.subscribe(
			'Bizproc.NodeSettings:nodeSettingsSaving',
			this.onNodeSettingsSave,
		);
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:drop', this.onItemDrop);
	},
	beforeUnmount(): void
	{
		this.isShowPreview = false;
		EventEmitter.unsubscribe('SidePanel.Slider:onClosing', this.onCancelConstant);
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:drop', this.onItemDrop);
		this.sliderInstance?.destroy();
	},
	unmounted()
	{
		EventEmitter.unsubscribe(
			'Bizproc.NodeSettings:nodeSettingsSaving',
			this.onNodeSettingsSave,
		);
	},
	methods:
	{
		initEditSlider(): void
		{
			this.sliderInstance = markRaw(new Slider('', {
				contentCallback: () => this.$refs.bizprocSetupTemplateActivityPopup,
				width: 596,
				outerBoundary: {
					right: 8,
					top: 64,
				},
				startPosition: 'bottom',
				overlayClassName: 'bizproc-setuptemplateactivity-app__overlay',
			}));
		},
		onAddBlock(): void
		{
			this.blocks.push(makeEmptyBlock());
		},
		onAddItem(blockIndex: number, item: Item): void
		{
			this.blocks[blockIndex].items.push(item);
		},
		onCreateConstant(blockIndex: number, item: Item): void
		{
			this.currentBlockIndex = blockIndex;
			this.createdConstant = { ...item };
			this.sliderInstance?.open();
		},
		onSaveConstant(blockIndex: number, item: Item): void
		{
			const newId = item.propertyValues.id;
			const setError = item.setError;

			if (this.allConstantIds.has(newId))
			{
				setError();

				return;
			}

			this.blocks[blockIndex].items.push(item.propertyValues);
			this.currentBlockIndex = null;
			this.createdConstant = null;

			this.sliderInstance?.close();
		},
		onCancelConstant(): void
		{
			this.currentBlockIndex = null;
			this.createdConstant = null;
		},
		onDeleteBlock(blockIndex: number): void
		{
			this.blocks.splice(blockIndex, 1);
		},
		onDeleteItem(blockIndex: number, itemIndex: number): void
		{
			this.blocks[blockIndex].items.splice(itemIndex, 1);
		},
		onUpdateItemProperty(blockIndex: number, itemIndex: number, payload: UpdateItemPropertyEventPayload): void
		{
			const currentItem = this.blocks[blockIndex].items[itemIndex];
			const newValues = payload.propertyValues;
			const setError = payload.setError;
			const newId = newValues.id;

			if (newId && newId !== currentItem.id && this.allConstantIds.has(newId))
			{
				setError();

				return;
			}

			this.blocks[blockIndex].items[itemIndex] = {
				...currentItem,
				...newValues,
			};

			if (this.sliderInstance?.isOpen())
			{
				this.sliderInstance.close();
			}
		},
		onItemsReorder(blockIndex: number, newItems: Array<any>): void
		{
			this.blocks[blockIndex].items = newItems;
		},
		getElementComponent(type: string): { [string]: Object }
		{
			return ELEMENT_COMPONENTS[type];
		},
		onToggleShowPreview(): void
		{
			this.isShowPreview = !this.isShowPreview;
			EventEmitter.emit('BX.Bizproc:setuptemplateactivity:preview', this.isShowPreview);
		},
		onNodeSettingsSave(event): void
		{
			const { formData } = event.getData();

			if (formData.activity !== ACTIVITY_NAME)
			{
				return;
			}

			const currentConstants = this.localConstants;
			const missingIds = new Set(this.initialConstantIds);
			const constantsToUpdate = {};

			for (const constant of currentConstants)
			{
				if (constant?.id)
				{
					constantsToUpdate[constant.id] = convertConstants(constant);
					missingIds.delete(constant.id);
				}
			}

			const deletedConstantIds = [...missingIds];

			EventEmitter.emit('Bizproc:onConstantsUpdated', {
				constantsToUpdate,
				deletedConstantIds,
			});

			this.initialConstantIds = new Set(this.localConstantIds);
		},
		onItemDragStart(payload: ItemDragStartPayload, blockIndex: number, itemIndex: number): void
		{
			EventEmitter.emit('Bizproc.SetupTemplate:Draggable:start', {
				...payload,
				sourceBlockIndex: blockIndex,
				sourceItemIndex: itemIndex,
			});
		},
		onItemDrop(event: BaseEvent): void
		{
			const payload = event.getData();
			const { sourceBlockIndex, sourceItemIndex, targetBlockIndex, targetItemIndex } = payload;

			if (targetBlockIndex === null || targetItemIndex === null)
			{
				return;
			}

			const newBlocks = JSON.parse(JSON.stringify(this.blocks));
			const [movedItem] = newBlocks[sourceBlockIndex].items.splice(sourceItemIndex, 1);
			if (!movedItem)
			{
				return;
			}

			let finalTargetIndex = targetItemIndex;
			if (sourceBlockIndex === targetBlockIndex && sourceItemIndex < targetItemIndex)
			{
				finalTargetIndex--;
			}

			newBlocks[targetBlockIndex].items.splice(finalTargetIndex, 0, movedItem);

			this.blocks = newBlocks;
		},
	},
	template: `
		<div
			class="bizproc-setuptemplateactivity-app"
			id="bizproc-setuptemplateactivity-app"
			ref="setuptemplateactivity"
		>
			<input
				:value="formValue"
				type="hidden"
				id="id_blocks"
				name="blocks"
			/>

			<AppHeader>
				<template #preview-btn>
					<PreviewBtn
						:showPreview="isShowPreview"
						@click="onToggleShowPreview"
					/>
				</template>
			</AppHeader>

			<div class="bizproc-setuptemplateactivity-app__blocks">
				<BlockComponent
					v-for="(block, blockIndex) in blocks"
					:key="block.id"
					:position="blockIndex + 1"
					:items="block.items"
					:blockIndex="blockIndex"
					@deleteBlock="onDeleteBlock(blockIndex)"
					@update:items="onItemsReorder(blockIndex, $event)"
				>
					<template #item="{ item, itemIndex }">
						<component
							:is="getElementComponent(item.itemType)"
							:item="item"
							:fieldTypeNames="fieldTypeNames"
							@delete="onDeleteItem(blockIndex, itemIndex)"
							@updateItemProperty="onUpdateItemProperty(blockIndex, itemIndex, $event)"
							@itemDragStart="onItemDragStart($event, blockIndex, itemIndex)"
						/>
					</template>
					<template #footer>
						<AddElementBtn
							:constantIds="allConstantIds"
							@add:element="onAddItem(blockIndex, $event)"
							@create:constant="onCreateConstant(blockIndex, $event)"
						/>
					</template>
				</BlockComponent>
				<AddBlockBtn @click="onAddBlock"/>
			</div>
		</div>

		<div
			class="bizproc-setuptemplateactivity-app__popup"
			ref="bizprocSetupTemplateActivityPopup"
		>
			<div
				id="bizproc-setuptemplateactivity-popup-content"
				class="bizproc-setuptemplateactivity-app__popup-content"
			>
			</div>
		</div>

		<Teleport
			to="#preview-panel"
			:disabled="!isShowPreview"
		>
			<PreviewApp
				v-if="isShowPreview"
				:blocks="preparedBlocks"
			/>
		</Teleport>

		<Teleport
			to="#bizproc-setuptemplateactivity-popup-content"
			:disabled="!createdConstant"
		>
			<EditConstantPopupForm
				v-if="createdConstant !== null"
				:item="createdConstant"
				:fieldTypeNames="fieldTypeNames"
				@update:item="onSaveConstant(currentBlockIndex, $event)"
				@cancel="onCancelConstant"
				:isCreation="true"
			/>
		</Teleport>
	`,
};
