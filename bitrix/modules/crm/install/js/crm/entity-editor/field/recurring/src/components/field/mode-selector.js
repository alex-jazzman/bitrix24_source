import { getModeByValue, modeItems } from '../../enum/mode';
import { resolveEntityTypeName, showPopupMenu } from '../../helper';
import { popupMenuMixin } from '../common/destroy-popup-menu';
import { FieldTitle } from '../common/field-title';
import { selectorA11yMixin } from '../common/selector-a11y';

// @vue/component
export const ModeSelector = {
	components: {
		FieldTitle,
	},

	mixins: [popupMenuMixin('crm-recurring-mode-selector'), selectorA11yMixin],

	props: {
		entityTypeId: {
			type: Number,
			required: true,
		},
		mode: {
			type: String,
			required: true,
		},
	},

	computed: {
		modeTitle(): string
		{
			const entityTypeName = resolveEntityTypeName(this.entityTypeId);

			return this.$Bitrix.Loc.getMessage(`CRM_EE_RECURRING_MODE_TITLE_${entityTypeName}`);
		},

		currentModeTitle(): string
		{
			return getModeByValue(this.mode).title;
		},
	},

	methods: {
		showModeSelector(event: ?Event = null): void
		{
			const menu = [];

			Object.values(modeItems).forEach(({ value, title }) => {
				menu.push({
					value,
					text: title,
					onclick: this.onChangeMode.bind(this),
				});
			});

			this.markSelectorOpened('mode');
			showPopupMenu(this.popupMenuId, this.$refs.modeSelector, menu, () => this.markSelectorClosed('mode'), event);
		},
		onChangeMode(_, item): void
		{
			this.$emit('onChange', item.value);

			item.getMenuWindow().close();
		},
	},

	// language=Vue
	template: `
		<div>
			<FieldTitle :title="modeTitle" :label-id="a11yId('mode-title')" />
		
			<div class="ui-entity-editor-content-block">
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100"
					role="button"
					tabindex="0"
					aria-haspopup="menu"
					:aria-expanded="isSelectorExpanded('mode')"
					:aria-labelledby="selectorLabelledBy('mode')"
					@click="showModeSelector"
					@keydown.enter.prevent="showModeSelector"
					@keydown.space.prevent="showModeSelector"
				>
					<div
						ref="modeSelector"
						:id="a11yId('mode-value')"
						class="ui-ctl-element"
					>
						{{currentModeTitle}}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
		</div>
	`,
};
