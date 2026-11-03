import { showPopupMenu } from '../../helper';
import { popupMenuMixin } from '../common/destroy-popup-menu';
import { FieldTitle } from '../common/field-title';
import { selectorA11yMixin } from '../common/selector-a11y';

// @vue/component
export const CategorySelector = {
	components: {
		FieldTitle,
	},

	mixins: [popupMenuMixin('crm-recurring-category-selector'), selectorA11yMixin],

	props: {
		categoryId: {
			type: Number,
			required: true,
		},
		categories: {
			type: Array,
			required: true,
		},
	},

	computed: {
		categoryTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_CATEGORY_TITLE');
		},

		currentCategoryTitle(): string
		{
			const currentCategory = this.categories.find((item) => Number(item.VALUE) === Number(this.categoryId));

			return currentCategory ? currentCategory.NAME : this.$Bitrix.Loc.getMessage('CRM_EE_RECURRING_CATEGORY_TITLE_WITHOUT_PERMISSIONS');
		},
	},

	methods: {
		showCategorySelector(event: ?Event = null): void
		{
			const menu = [];

			this.categories.forEach((category) => {
				menu.push({
					value: Number(category.VALUE),
					text: category.NAME,
					onclick: this.onChangeCategory.bind(this),
				});
			});

			this.markSelectorOpened('category');
			showPopupMenu(this.popupMenuId, this.$refs.categorySelector, menu, () => this.markSelectorClosed('category'), event);
		},
		onChangeCategory(_, item): void
		{
			this.$emit('onChange', item.value);

			item.getMenuWindow().close();
		},
	},

	// language=Vue
	template: `
		<div>
			<FieldTitle :title="categoryTitle" :label-id="a11yId('category-title')" />
		
			<div class="ui-entity-editor-content-block">
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100"
					role="button"
					tabindex="0"
					aria-haspopup="menu"
					:aria-expanded="isSelectorExpanded('category')"
					:aria-labelledby="selectorLabelledBy('category')"
					@click="showCategorySelector"
					@keydown.enter.prevent="showCategorySelector"
					@keydown.space.prevent="showCategorySelector"
				>
					<div
						ref="categorySelector"
						:id="a11yId('category-value')"
						class="ui-ctl-element"
					>
						{{currentCategoryTitle}}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
		</div>
	`,
};
