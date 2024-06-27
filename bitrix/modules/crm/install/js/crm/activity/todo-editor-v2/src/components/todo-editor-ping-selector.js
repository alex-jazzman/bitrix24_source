import { CompactIcons, ItemSelector } from 'crm.field.item-selector';
import { hint } from 'ui.vue3.directives.hint';

export const TodoEditorPingSelector = {
	directives: { hint },
	props: {
		valuesList: {
			type: Array,
			required: true,
			default: [],
		},
		selectedValues: {
			type: Array,
			default: [],
		},
	},

	computed: {
		hint(): Object
		{
			return {
				text: this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_PING_SELECTOR_HINT'),
				popupOptions: {
					angle: {
						offset: 34,
						position: 'top',
					},
				},
			};
		},
	},

	methods: {
		getValue(): Array
		{
			if (this.itemSelector)
			{
				return this.itemSelector.getValue();
			}

			return [];
		},

		setValue(values: Array): void
		{
			if (this.itemSelector)
			{
				this.itemSelector.setValue(values);
			}
		},
	},

	mounted(): void
	{
		this.itemSelector = new ItemSelector({
			target: this.$refs.container,
			valuesList: this.valuesList,
			selectedValues: this.selectedValues,
			compactMode: true,
			icon: CompactIcons.BELL,
		});
	},

	template: '<div style="width: 100%;"><div ref="container" v-hint="hint"></div></div>',
};
