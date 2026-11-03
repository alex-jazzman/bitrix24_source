import { getPeriodByValue, getPeriods } from '../../enum/period';
import { showPopupMenu } from '../../helper';
import { popupMenuMixin } from '../common/destroy-popup-menu';
import { FieldTitle } from '../common/field-title';
import { selectorA11yMixin } from '../common/selector-a11y';

// @vue/component
export const MultipleRepeatSelector = {
	components: {
		FieldTitle,
	},

	mixins: [popupMenuMixin('crm-recurring-multiple-repeat-selector'), selectorA11yMixin],

	props: {
		interval: {
			type: Number,
			required: true,
		},
		type: {
			type: Number,
			required: true,
		},
	},

	data(): Object
	{
		return {
			currentInterval: this.interval,
			currentType: this.type,
		};
	},

	computed: {
		title(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_CUSTOM_TITLE');
		},

		currentItemTitle(): string
		{
			return getPeriodByValue(this.currentType).title;
		},
	},

	watch: {
		currentType(): void
		{
			this.emitChange();
		},

		currentInterval(): void
		{
			this.emitChange();
		},
	},

	methods: {
		showSelector(event: ?Event = null): void
		{
			const menu = [];

			Object.values(getPeriods(true)).forEach(({ value, title }) => {
				menu.push({
					value,
					text: title,
					onclick: this.onChange.bind(this),
				});
			});

			this.markSelectorOpened('repeat');
			showPopupMenu(this.popupMenuId, this.$refs.selector, menu, () => this.markSelectorClosed('repeat'), event);
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
					value: this.currentInterval,
				});
			});
		},
	},

	// language=Vue
	template: `
		<div class="ui-entity-editor-content-block">
			<FieldTitle :title="title" :label-id="a11yId('repeat-title')" />
			<div class="crm-entity-widget-content-block-inner crm-entity-widget-content-block-colums-input">
				<div class="crm-entity-widget-content-block-input-wrapper">
					<input
						class="crm-entity-widget-content-input"
						type="number"
						v-model="currentInterval"
					>
					<div class="crm-entity-widget-content-block-select">
						<div
							ref="selector"
							:id="a11yId('repeat-value')"
							class="crm-entity-widget-content-select"
							role="button"
							tabindex="0"
							aria-haspopup="menu"
							:aria-expanded="isSelectorExpanded('repeat')"
							:aria-labelledby="selectorLabelledBy('repeat')"
							@click="showSelector"
							@keydown.enter.prevent="showSelector"
							@keydown.space.prevent="showSelector"
						>{{currentItemTitle}}</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
