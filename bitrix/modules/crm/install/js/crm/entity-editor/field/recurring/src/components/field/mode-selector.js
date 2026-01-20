import { getModeByValue, modeItems } from '../../enum/mode';
import { resolveEntityTypeName, showPopupMenu } from '../../helper';
import { popupMenuMixin } from '../common/destroy-popup-menu';
import { FieldTitle } from '../common/field-title';

// @vue/component
export const ModeSelector = {
	components: {
		FieldTitle,
	},

	mixins: [popupMenuMixin('crm-recurring-mode-selector')],

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
		showModeSelector(): void
		{
			const menu = [];

			Object.values(modeItems).forEach(({ value, title }) => {
				menu.push({
					value,
					text: title,
					onclick: this.onChangeMode.bind(this),
				});
			});

			showPopupMenu(this.popupMenuId, this.$refs.modeSelector, menu);
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
			<FieldTitle :title="modeTitle" />
		
			<div class="ui-entity-editor-content-block">
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
					<div
						ref="modeSelector"
						class="ui-ctl-element"
						@click="showModeSelector"
					>
						{{currentModeTitle}}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
		</div>
	`,
};
