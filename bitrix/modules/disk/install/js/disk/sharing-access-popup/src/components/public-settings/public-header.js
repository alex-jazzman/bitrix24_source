import { Loc } from 'main.core';
import { Switcher } from 'ui.vue3.components.switcher';
import { TextXl } from 'ui.system.typography.vue';

import { SWITCHER_OPTIONS } from '../consts';

// @vue/component
export const PublicAccessHeader = {
	name: 'PublicAccessHeader',
	components: { Switcher, TextXl },
	props: {
		isActive: { type: Boolean, required: true },
		isDisabled: { type: Boolean, default: false },
		isToggleBlocked: { type: Boolean, default: false },
	},
	emits: ['toggle', 'blockedToggle'],
	setup()
	{
		return { SWITCHER_OPTIONS };
	},
	methods: {
		handleToggle(value)
		{
			// the wrapper has already rolled the widget back to isActive, so a blocked
			// attempt only has to leave isActive untouched upstream
			if (this.isToggleBlocked)
			{
				this.$emit('blockedToggle', value);

				return;
			}

			this.$emit('toggle', value);
		},
	},
	template: `
		<div class="access-public-block__header">
			<Switcher
				class="access-public-block__switcher"
				data-testid="disk-sharing-access-public-switcher"
				:isChecked="isActive"
				:isDisabled="isDisabled"
				:options="SWITCHER_OPTIONS"
				@check="handleToggle(true)"
				@uncheck="handleToggle(false)"
			/>
			<TextXl
				tag="div"
				className="access-public-block__title"
			>
				${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_SWITCHER_ACTION')}
			</TextXl>
		</div>
	`,
};
