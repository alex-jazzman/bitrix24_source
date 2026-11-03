import { getMultipleTypeByValue, multipleTypes } from '../../enum/multiple-type';
import { showPopupMenu } from '../../helper';
import { FieldTitle } from '../common/field-title';
import { selectorA11yMixin } from '../common/selector-a11y';

// @vue/component
export const MultipleTypeSelector = {
	components: {
		FieldTitle,
	},

	mixins: [selectorA11yMixin],

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
		showSelector(event: ?Event = null): void
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

			this.markSelectorOpened('multipleType');
			showPopupMenu(id, target, menu, () => this.markSelectorClosed('multipleType'), event);
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
			<FieldTitle :title="title" :label-id="a11yId('multipleType-title')"/>

			<div class="ui-entity-editor-content-block">
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100"
					role="button"
					tabindex="0"
					aria-haspopup="menu"
					:aria-expanded="isSelectorExpanded('multipleType')"
					:aria-labelledby="selectorLabelledBy('multipleType')"
					@click="showSelector"
					@keydown.enter.prevent="showSelector"
					@keydown.space.prevent="showSelector"
				>
					<div
						ref="selector"
						:id="a11yId('multipleType-value')"
						class="ui-ctl-element"
					>
						{{currentMultipleTypeTitle}}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
		</div>
	`,
};
