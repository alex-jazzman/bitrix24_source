import { getMultipleTypeByValue, multipleTypes } from '../../enum/multiple-type';
import { showPopupMenu } from '../../helper';
import { FieldTitle } from '../common/field-title';

// @vue/component
export const MultipleTypeSelector = {
	components: {
		FieldTitle,
	},

	props: {
		type: {
			type: Number,
			required: true,
		},
	},

	data(): Object
	{
		return {
			currentType: this.type,
		};
	},

	computed: {
		title(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_TITLE');
		},

		currentMultipleTypeTitle(): string
		{
			return getMultipleTypeByValue(this.currentType).title;
		},
	},

	watch: {
		currentType(): void
		{
			this.emitChange();
		},
	},

	methods: {
		showSelector(): void
		{
			const menu = [];

			Object.values(multipleTypes).forEach(({ value, title }) => {
				menu.push({
					value,
					text: title,
					onclick: this.onChange.bind(this),
				});
			});

			const target = this.$refs.selector;
			const id = 'crm-recurring-multiple-type-selector';

			showPopupMenu(id, target, menu);
		},

		onChange(_, item): void
		{
			this.currentType = item.value;
			item.getMenuWindow().close();
		},

		emitChange(): void
		{
			void this.$nextTick(() => {
				this.$emit('onChange', {
					type: this.currentType,
				});
			});
		},
	},

	// language=Vue
	template: `
		<div class="ui-entity-editor-content-block">
			<FieldTitle :title="title"/>

			<div class="ui-entity-editor-content-block">
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
					<div
						ref="selector"
						class="ui-ctl-element"
						@click="showSelector"
					>
						{{currentMultipleTypeTitle}}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
		</div>
	`,
};
