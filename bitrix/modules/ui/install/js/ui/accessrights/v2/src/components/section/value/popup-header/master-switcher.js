import { Switcher } from 'ui.vue3.components.switcher';
import { Label as UiLabel } from 'ui.system.label.vue';
import { LabelStyle, LabelSize } from 'ui.system.label';
import { createAirSwitcherOptions } from '../../../../utils';
import '../../../../css/value/popup-header/master-switcher.css';

export const MasterSwitcher = {
	name: 'MasterSwitcher',
	components: { Switcher, UiLabel },
	emits: ['check', 'uncheck'],
	props: {
		isChecked: {
			type: Boolean,
			required: true,
		},
		showBadge: {
			type: Boolean,
			default: true,
		},
		isInteractive: {
			type: Boolean,
			default: true,
		},
	},
	inject: ['section', 'right'],
	computed: {
		switcherOptions(): Object {
			return createAirSwitcherOptions('large');
		},
		badgeText(): string {
			const code = this.isChecked
				? 'JS_UI_ACCESSRIGHTS_V2_AVAILABLE_FOR_ROLE'
				: 'JS_UI_ACCESSRIGHTS_V2_UNAVAILABLE_FOR_ROLE';

			return this.$Bitrix.Loc.getMessage(code);
		},
		badgeStyle(): string {
			return this.isChecked ? LabelStyle.TINTED : LabelStyle.TINTED_NO_ACCENT;
		},
		labelSize(): string {
			return LabelSize.MD;
		},
	},
	template: `
		<div class="ui-access-rights-v2-cell-popup-header-master-switcher">
			<UiLabel
				v-if="showBadge && isInteractive"
				:value="badgeText"
				:style="badgeStyle"
				:size="labelSize"
			/>
			<div class="ui-access-rights-v2-cell-popup-header-master-switcher-row">
				<slot/>
				<div v-if="isInteractive" class="ui-access-rights-v2-cell-popup-header-toggle-container">
					<Switcher
						:is-checked="isChecked"
						@check="$emit('check')"
						@uncheck="$emit('uncheck')"
						:options="switcherOptions"
						data-accessrights-min-max
					/>
				</div>
			</div>
		</div>
	`,
};
