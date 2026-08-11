import { BaseEvent, EventEmitter } from 'main.core.events';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

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
import { ITEM_TYPES, EDITING_MODES } from '../../constants';

import './app.css';

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
	props:
	{
		serializedBlocks: {
			type: [String, null],
			required: true,
		},
		/** @type ConstantConfiguration[] */
		constantConfigurationList: {
			type: Array,
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
			initialConstantIds: new Set(),
			editingConstant: null,
			isEditingFormChanged: false,
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
		this.blocks = JSON.parse(this.serializedBlocks) ?? [];
		this.initialConstantIds = new Set(this.localConstantIds);

		EventEmitter.subscribe(
			'Bizproc.NodeSettings:nodeSettingsSaving',
			this.onNodeSettingsSave,
		);
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:drop', this.onItemDrop);
	},
	beforeUnmount(): void
	{
		this.isShowPreview = false;
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:drop', this.onItemDrop);
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
		onAddBlock(): void
		{
			this.blocks.push(makeEmptyBlock());
		},
		onAddItem(blockIndex: number, item: Item): void
		{
			this.blocks[blockIndex].items.push(item);
		},
		canSwitchEditingForm(): Promise<boolean>
		{
			if (this.editingConstant === null || !this.isEditingFormChanged)
			{
				return Promise.resolve(true);
			}

			return this.showConfirmDiscard();
		},
		async onCreateConstant(blockIndex: number, item: ConstantItem): Promise<void>
		{
			if (!await this.canSwitchEditingForm())
			{
				return;
			}

			this.isEditingFormChanged = false;
			this.editingConstant = {
				blockIndex,
				itemIndex: null,
				item: { ...item },
				mode: EDITING_MODES.CREATE,
			};
		},
		async onEditConstant(blockIndex: number, itemIndex: number): Promise<void>
		{
			if (!await this.canSwitchEditingForm())
			{
				return;
			}

			this.isEditingFormChanged = false;
			this.editingConstant = {
				blockIndex,
				itemIndex,
				item: { ...this.blocks[blockIndex].items[itemIndex] },
				mode: EDITING_MODES.EDIT,
			};
		},
		showConfirmDiscard(): Promise<boolean>
		{
			return new Promise((resolve) => {
				const messageBox = new MessageBox({
					message: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DISCARD_CONFIRM'),
					buttons: MessageBoxButtons.OK_CANCEL,
					okCaption: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DISCARD_OK'),
					cancelCaption: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_DISCARD_CANCEL'),
					onOk: () => {
						resolve(true);
						messageBox.close();
					},
					onCancel: () => {
						resolve(false);
						messageBox.close();
					},
				});
				messageBox.show();
			});
		},
		onSaveEditingConstant(payload: UpdateItemPropertyEventPayload): void
		{
			if (!this.editingConstant)
			{
				return;
			}

			const { blockIndex, itemIndex, mode } = this.editingConstant;
			const newValues = payload.propertyValues;
			const setError = payload.setError;
			const currentItem = mode === EDITING_MODES.EDIT ? this.blocks[blockIndex].items[itemIndex] : null;
			const newId = newValues.id;

			if (newId && newId !== currentItem?.id && this.allConstantIds.has(newId))
			{
				setError();

				return;
			}

			if (mode === EDITING_MODES.CREATE)
			{
				this.blocks[blockIndex].items.push(newValues);
			}
			else
			{
				this.blocks[blockIndex].items[itemIndex] = {
					...currentItem,
					...newValues,
				};
			}

			this.editingConstant = null;
		},
		onCancelEditingConstant(): void
		{
			this.editingConstant = null;
		},
		onDeleteBlock(blockIndex: number): void
		{
			if (this.editingConstant?.blockIndex === blockIndex)
			{
				this.editingConstant = null;
			}
			else if (this.editingConstant?.blockIndex > blockIndex)
			{
				this.editingConstant = {
					...this.editingConstant,
					blockIndex: this.editingConstant.blockIndex - 1,
				};
			}

			this.blocks.splice(blockIndex, 1);
		},
		onDeleteItem(blockIndex: number, itemIndex: number): void
		{
			if (this.editingConstant?.blockIndex === blockIndex && this.editingConstant.itemIndex === itemIndex)
			{
				this.editingConstant = null;
			}
			else if (this.editingConstant?.blockIndex === blockIndex && this.editingConstant.itemIndex > itemIndex)
			{
				this.editingConstant = {
					...this.editingConstant,
					itemIndex: this.editingConstant.itemIndex - 1,
				};
			}

			this.blocks[blockIndex].items.splice(itemIndex, 1);
		},
		onUpdateItemProperty(blockIndex: number, itemIndex: number, payload: UpdateItemPropertyEventPayload): void
		{
			const currentItem = this.blocks[blockIndex].items[itemIndex];
			const newValues = payload.propertyValues;

			this.blocks[blockIndex].items[itemIndex] = {
				...currentItem,
				...newValues,
			};
		},
		isCreatingConstantInBlock(blockIndex: number): boolean
		{
			return (
				this.editingConstant !== null
				&& this.editingConstant.mode === EDITING_MODES.CREATE
				&& this.editingConstant.blockIndex === blockIndex
			);
		},
		isEditingConstantUnderItem(blockIndex: number, itemIndex: number): boolean
		{
			return (
				this.editingConstant !== null
				&& this.editingConstant.mode === EDITING_MODES.EDIT
				&& this.editingConstant.blockIndex === blockIndex
				&& this.editingConstant.itemIndex === itemIndex
			);
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
							:constantConfigurationList="constantConfigurationList"
							@delete="onDeleteItem(blockIndex, itemIndex)"
							@updateItemProperty="onUpdateItemProperty(blockIndex, itemIndex, $event)"
							@edit="onEditConstant(blockIndex, itemIndex)"
							@itemDragStart="onItemDragStart($event, blockIndex, itemIndex)"
						/>
					</template>
					<template #after-item="{ itemIndex }">
						<EditConstantPopupForm
							v-if="isEditingConstantUnderItem(blockIndex, itemIndex)"
							:item="editingConstant.item"
							:constantConfigurationList="constantConfigurationList"
							:isCreation="false"
							@update:item="onSaveEditingConstant"
							@update:changed="isEditingFormChanged = $event"
							@cancel="onCancelEditingConstant"
						/>
					</template>
					<template #before-footer>
						<EditConstantPopupForm
							v-if="isCreatingConstantInBlock(blockIndex)"
							:item="editingConstant.item"
							:constantConfigurationList="constantConfigurationList"
							:isCreation="true"
							@update:item="onSaveEditingConstant"
							@update:changed="isEditingFormChanged = $event"
							@cancel="onCancelEditingConstant"
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

		<Teleport
			to="#preview-panel"
			:disabled="!isShowPreview"
		>
			<PreviewApp
				v-if="isShowPreview"
				:blocks="preparedBlocks"
			/>
		</Teleport>
	`,
};
