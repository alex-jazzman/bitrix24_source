// @vue/component
import { BaseEvent } from 'main.core.events';
import { Dialog as EntityDialog } from 'ui.entity-selector';

type ItemId = [
	string,
		string | number,
];

export const Dialog = {
	emits: [
		'onSelectItem',
		'onDeselectItem',
	],

	props: {
		items: {
			type: Array,
			default: [],
		},
		tabs: {
			type: Array,
			default: [],
		},
		entities: {
			type: Array,
			default: [],
		},
		showAvatars: {
			type: Boolean,
		},
		multiple: {
			type: Boolean,
		},
		context: {
			type: String,
			default: '',
		},
		events: {
			type: Object,
			default: {},
		},
		readOnly: {
			type: Boolean,
		},
		preselectedItems: {
			type: Array,
		},
	},

	data(): Object
	{
		return {
			selectedItemTitle: '',
		};
	},

	methods: {
		getDialog(): EntityDialog
		{
			if (!this.dialog)
			{
				const targetNode = this.$refs.dialog;

				this.dialog = new EntityDialog({
					targetNode,
					context: this.context,
					multiple: this.multiple,
					dropdownMode: true,
					showAvatars: this.showAvatars,
					enableSearch: true,
					width: 450,
					zIndex: 2500,
					items: this.items,
					preselectedItems: this.preselectedItems,
					entities: this.entities,
					tabs: this.tabs,
					searchOptions: {
						allowCreateItem: false,
					},
					events: {
						'Item:onSelect': (event: BaseEvent) => {
							const { item: selectedItem } = event.getData();
							this.selectedItemTitle = selectedItem.title.text;

							this.emitSelectItem(selectedItem);
						},
						'Item:onDeselect': (event: BaseEvent) => {
							const { item: deselectedItem } = event.getData();
							this.selectedItemTitle = '';

							this.emitDeselectItem(deselectedItem);
						},
					},
				});
			}

			return this.dialog;
		},
		emitSelectItem(selectedItem: Array): void
		{
			this.$emit('onSelectItem', selectedItem);
		},
		emitDeselectItem(deselectedItem: Array): void
		{
			this.$emit('onDeselectItem', deselectedItem);
		},
		selectItem(itemId: ItemId): void
		{
			const item = this.dialog.getItem(itemId);
			item?.select();
		},
		show(): void
		{
			this.getDialog().show();
		},
		toggleDialog(): void
		{
			if (this.readOnly)
			{
				return;
			}

			const dialog = this.getDialog();

			if (dialog.isOpen())
			{
				dialog.hide();
			}
			else
			{
				dialog.show();
			}
		},
		destroy(): void
		{
			this.dialog?.destroy();
			this.dialog = null;
		},
	},

	computed: {
		elementTitle(): string
		{
			return this.items.find((item) => item.selected)?.title ?? '';
		},
		customData(): ?Object
		{
			return this.items.find((item) => item.selected)?.customData ?? '';
		},
		controlClassList(): Array
		{
			return [
				'ui-ctl',
				'ui-ctl-after-icon',
				{ 'ui-ctl-dropdown': !this.readOnly },
			];
		},
		iconClassList(): Array // @todo
		{
			return [
				'crm-repeat-sale__segment-sandbox-field-icon',
				{ '--color': Boolean(this.customData?.color) },
			];
		},
		iconStyleList(): Object
		{
			if (this.customData?.color === null)
			{
				return {};
			}

			return {
				backgroundColor: this.customData.color,
			};
		},
	},

	// language=Vue
	template: `
		<div
			:class="controlClassList"
			ref="dialog"
			@click="toggleDialog"
		>
    		<div 
				v-if="!readOnly"
				class="ui-ctl-after ui-ctl-icon-angle"
			></div>
			<div class="ui-ctl-element">
				<span class="crm-repeat-sale__sandbox-dialog-field">
					<span 
						:class="iconClassList"
						:style="iconStyleList"
					></span>
					<span
						v-if="entities.length > 0"
						class="crm-repeat-sale__sandbox-dialog-field-value"
					>
						{{selectedItemTitle}}
					</span>
					<span
						v-else
						class="crm-repeat-sale__sandbox-dialog-field-value"
					>
						{{elementTitle}}
					</span>
				</span>
			</div>
		</div>
	`,
};
