import { showPopupMenu } from '../../helper';
import { popupMenuMixin } from '../common/destroy-popup-menu';
import { FieldTitle } from '../common/field-title';

// @vue/component
export const CategorySelector = {
	components: {
		FieldTitle,
	},

	mixins: [popupMenuMixin('crm-recurring-category-selector')],

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
		showCategorySelector(): void
		{
			const menu = [];

			this.categories.forEach((category) => {
				menu.push({
					value: Number(category.VALUE),
					text: category.NAME,
					onclick: this.onChangeCategory.bind(this),
				});
			});

			showPopupMenu(this.popupMenuId, this.$refs.categorySelector, menu);
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
			<FieldTitle :title="categoryTitle" />
		
			<div class="ui-entity-editor-content-block">
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
					<div
						ref="categorySelector"
						class="ui-ctl-element"
						@click="showCategorySelector"
					>
						{{currentCategoryTitle}}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
		</div>
	`,
};
