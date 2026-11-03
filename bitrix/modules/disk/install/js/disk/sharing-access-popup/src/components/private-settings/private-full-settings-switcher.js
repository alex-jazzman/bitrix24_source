import { Loc } from 'main.core';
import { Switcher } from 'ui.vue3.components.switcher';
import { TextXl } from 'ui.system.typography.vue';

import { SWITCHER_OPTIONS } from '../consts';

export const PrivateAccessFullSettingsSwitcher = {
	name: 'PrivateAccessFullSettingsSwitcher',
	components: { Switcher, TextXl },
	props: {
		isActive: { type: Boolean, required: true },
	},
	emits: ['toggle'],
	setup()
	{
		return { SWITCHER_OPTIONS };
	},
	template: `
		<div class="access-private-switcher__wrapper">
			<Switcher
				class="access-private-block__switcher"
				data-testid="disk-sharing-access-private-switcher"
				:isChecked="isActive"
				:options="SWITCHER_OPTIONS"
				@check="$emit('toggle', true)"
				@uncheck="$emit('toggle', false)"
			/>
			<TextXl
				tag="p"
				className="access-private-block__title"
			>
				${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_FULL_SETTINGS')}
			</TextXl>
		</div>
	`,
};
