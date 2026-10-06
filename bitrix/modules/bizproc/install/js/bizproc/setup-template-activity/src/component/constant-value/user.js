import { Loc, Type } from 'main.core';
import { TagSelector } from 'ui.entity-selector';
import {
	USER_ENTITY_TYPES,
	getUserSelectorEntities,
	normalizeUserValue,
	parseUserValue,
} from '../../lib/user-value';

// @vue/component
export const ConstantValueUser = {
	name: 'ConstantValueUser',
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		multiple: {
			type: Boolean,
			default: false,
		},
		modelValue: {
			type: [String, Array],
			default: '',
		},
	},
	emits: ['update:modelValue'],
	watch: {
		multiple(): void
		{
			this.reinitializeSelector();
		},
	},
	mounted(): void
	{
		this.initializeSelector();
	},
	beforeUnmount(): void
	{
		this.destroySelector();
	},
	methods: {
		syncValue(): void
		{
			if (!this.tagSelector)
			{
				return;
			}

			const newValues = this.tagSelector.getTags().map((tag) => {
				const rawId = tag.getId();
				const entityId = tag.getEntityId();

				if (entityId === USER_ENTITY_TYPES.USER)
				{
					return `user_${rawId}`;
				}

				if (entityId === USER_ENTITY_TYPES.DEPARTMENT)
				{
					if (Type.isString(rawId) && rawId.endsWith(':F'))
					{
						return `group_hr${rawId.replace(':F', '')}`;
					}

					return `group_hrr${rawId}`;
				}

				return null;
			}).filter(Boolean);

			if (this.multiple)
			{
				// Multiple values are stored as an array - same shape the launch form
				// (ConstantComponent.getCurrentConstantValue) and other multiple constant
				// fields (entity-selector) expect for preselect.
				this.$emit('update:modelValue', newValues);
			}
			else
			{
				this.$emit('update:modelValue', newValues.length > 0 ? newValues[0] : '');
			}
		},
		getPreselectedItems(): Array
		{
			return this.normalizeModelValue()
				.map((element) => this.parseValue(element))
				.filter(Boolean)
			;
		},
		normalizeModelValue(): Array<string>
		{
			return normalizeUserValue(this.modelValue, this.multiple);
		},
		parseValue(rawValue: string): Array | null
		{
			return parseUserValue(rawValue);
		},
		destroySelector(): void
		{
			if (this.tagSelector)
			{
				this.tagSelector.getDialog().destroy();
				this.tagSelector = null;
			}
		},
		reinitializeSelector(): void
		{
			this.destroySelector();
			if (this.$refs.container)
			{
				this.$refs.container.innerHTML = '';
			}

			this.initializeSelector();
		},
		initializeSelector(): void
		{
			this.tagSelector = new TagSelector({
				multiple: this.multiple,
				showCreateButton: false,
				dialogOptions: {
					context: `BIZPROC_SETUP_TEMPLATE_ACTIVITY_USER_SELECTOR_${this.item.id}`,
					preselectedItems: this.getPreselectedItems(),
					popupOptions: {
						className: 'bizproc-setuptemplateactivity-no-tabs-selector-popup',
					},
					width: 500,
					entities: getUserSelectorEntities(),
					multiple: this.multiple,
					showAvatars: true,
					dropdownMode: true,
					compactView: true,
					height: 250,
				},
				addButtonCaption: Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_ADD_USER'),
				events: {
					onAfterTagAdd: this.syncValue,
					onAfterTagRemove: this.syncValue,
				},
			});

			this.tagSelector.renderTo(this.$refs.container);

			// In dropdownMode the dialog loads lazily on first open, so preselected items stay
			// unresolved (shown as a "hidden" placeholder) until the user opens it. Force the load
			// now so they render as tags immediately, including when a saved constant is reopened.
			if (this.getPreselectedItems().length > 0)
			{
				this.tagSelector.getDialog()?.load();
			}
		},
	},
	template: `
		<div ref="container" data-testid="bizproc-setup-template-constant-value-user"></div>
	`,
};
