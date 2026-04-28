import { Type, Loc } from 'main.core';
import { BaseEvent } from 'main.core.events';
import type { ItemOptions } from 'ui.entity-selector';
import { Item, TagSelector as UiTagSelector } from 'ui.entity-selector';
import { BitrixVueComponentProps } from 'ui.vue3';
import { RequiredMark } from '../../required-mark/required-mark';
import { Alert } from '../../alert/alert';

export type TagSelectorOption = {
	title: string,
	value: string | number,
	hint: ?string,
};

import './tag-selector.css';

export const TagSelector: BitrixVueComponentProps = {
	name: 'TagSelector',

	components: {
		RequiredMark,
		Alert,
	},

	props: {
		fieldName: {
			type: [
				String,
				Number,
			],
			required: true,
		},
		model: {
			type: Object,
			required: true,
		},
		fieldCaption: {
			type: String,
			required: true,
		},
		options: {
			/** @type TagSelectorOption[] */
			type: Array,
			required: true,
		},
		required: {
			type: Boolean,
			default: () => false,
		},
		multiple: {
			type: Boolean,
			default: () => false,
		},
		nullable: {
			type: Boolean,
			default: () => false,
		},
		placeholder: {
			type: String,
			default: () => null,
		},
		display: {
			default: null,
			validator: (value) => {
				return value === null || value === 'row';
			},
		},
		readonly: {
			type: Boolean,
			default: () => false,
		},
	},

	data(): Object
	{
		return {
			hint: null,
			isIgnoreValueChange: false,
		};
	},

	mounted(): void
	{
		this.getTagSelector().renderTo(this.$refs.tagSelectorContainer);
		this.adjustHint();

		if (Type.isFunction(this.model.subscribeValueChanged))
		{
			this.model.subscribeValueChanged(this.fieldName, this.onValueChanged);
		}
	},

	unmounted(): void
	{
		if (Type.isFunction(this.model.unsubscribeValueChanged))
		{
			this.model.unsubscribeValueChanged(this.fieldName, this.onValueChanged);
		}

		this.getTagSelector().getDialog().destroy();
	},

	methods: {
		onValueChanged(event: BaseEvent): void
		{
			if (this.isIgnoreValueChange)
			{
				return;
			}

			const newValue = event.getData().newValue;
			this.selectTag(newValue);
		},

		convertOptionToTagItem(option: TagSelectorOption): ItemOptions
		{
			let deselectable = this.multiple || this.nullable;
			if (this.readonly)
			{
				deselectable = false;
			}

			return {
				id: option.value,
				title: option.title,
				tabs: 'recents',
				entityId: 'select-item',
				deselectable,
			};
		},

		getTagSelector(): UiTagSelector
		{
			if (this.tagSelector)
			{
				return this.tagSelector;
			}

			const options = this.options;
			const addButtonCaption = this.multiple
				? Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_ADD_BUTTON_CAPTION_MULTIPLE')
				: Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_ADD_BUTTON_CAPTION_SINGLE');

			const addButtonCaptionMore = this.multiple
				? Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_ADD_BUTTON_CAPTION_MORE_MULTIPLE')
				: Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_ADD_BUTTON_CAPTION_MORE_SINGLE');

			const locked = this.readonly ? true : null;
			const showAddButton = !this.readonly;

			const items = options.map((option: TagSelectorOption) => this.convertOptionToTagItem(option));
			this.tagSelector = new UiTagSelector({
				locked,
				multiple: this.multiple,
				placeholder: this.placeholder,
				addButtonCaption,
				addButtonCaptionMore,
				showAddButton,
				dialogOptions: {
					height: 300,
					enableSearch: false,
					showAvatars: false,
					items,
					searchTabOptions: {
						stub: true,
						stubOptions: {
							title: Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_EMPTY_STATE_TITLE'),
							subtitle: Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_EMPTY_STATE_SUBTITLE'),
						},
					},
					events: {
						'Item:onBeforeSelect': (event) => {
							this.isIgnoreValueChange = true;
							this.onBeforeOptionSelect(event);
							this.isIgnoreValueChange = false;
						},
						'Item:onBeforeDeselect': (event) => {
							this.isIgnoreValueChange = true;
							this.onBeforeOptionDeselect(event);
							this.isIgnoreValueChange = false;
						},
					},
				},
			});

			this.selectTagByModel();

			return this.tagSelector;
		},

		onBeforeOptionSelect(event: BaseEvent): void
		{
			const itemId = event.getData().item.getId();

			if (this.multiple)
			{
				const currentValue = this.model.get(this.fieldName);
				let newValue = [];

				if (Type.isArray(currentValue))
				{
					newValue = [...currentValue];
				}
				else if (Type.isString(currentValue) && currentValue !== '')
				{
					newValue = [currentValue];
				}

				if (!newValue.includes(itemId))
				{
					newValue.push(itemId);
					this.model.set(this.fieldName, newValue);
				}

				return;
			}

			this.model.set(this.fieldName, itemId);
			this.adjustHint();
		},

		onBeforeOptionDeselect(event: BaseEvent): void
		{
			const item: Item = event.getData().item;
			const itemId = item.getId();

			if (this.multiple)
			{
				const newValues = this.model
					.get(this.fieldName)
					.filter((value) => value !== itemId)
				;

				if (newValues.length <= 0 && !this.nullable)
				{
					event.preventDefault();

					return;
				}

				this.model.set(this.fieldName, newValues);

				return;
			}

			const isSelectNewValue = itemId !== this.model.get(this.fieldName);
			if (isSelectNewValue)
			{
				return;
			}

			if (this.nullable)
			{
				this.model.set(this.fieldName, null);
				this.adjustHint();
			}
			else
			{
				event.preventDefault();
			}
		},

		selectTag(currentValue: any): void
		{
			if (this.multiple && Type.isArray(currentValue))
			{
				currentValue.forEach((value) => {
					const item = this.tagSelector.getDialog().getItem(['select-item', value]);
					if (item)
					{
						item.select();
					}
				});
			}
			else if (Type.isStringFilled(currentValue) || Type.isNumber(currentValue))
			{
				const selectedItem = this.tagSelector.getDialog().getItem(['select-item', currentValue]);
				if (selectedItem)
				{
					selectedItem.select();
				}
			}
		},

		selectTagByModel(): void
		{
			const currentValue = this.model.get(this.fieldName);
			this.selectTag(currentValue);
		},

		adjustHint(): void
		{
			if (this.multiple)
			{
				return;
			}

			const id = this.model.get(this.fieldName);

			let hint = null;
			this.options.forEach((option: TagSelectorOption) => {
				if (option.value === id)
				{
					hint = option.hint;
				}
			});

			this.hint = hint;
		},
	},

	computed: {
		containerClass(): Object
		{
			return {
				'crm-item-import__field': true,
				'--tag-selector': true,
				'ui-form-row': true,
				'--row': this.display === 'row',
			};
		},
	},

	template: `
		<div :class="containerClass">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text" :title="fieldCaption">
					{{ fieldCaption }}
					<RequiredMark v-if="required" />
				</div>
			</div>
			<div class="ui-ctl ui-ctl-w100">
				<div class="ui-ctl-element" ref="tagSelectorContainer" />
				<slot name="afterInput" />
			</div>
			<Alert class="crm-item-import__field-select-hint" v-if="hint">
				{{ hint }}
			</Alert>
		</div>
	`,
};
