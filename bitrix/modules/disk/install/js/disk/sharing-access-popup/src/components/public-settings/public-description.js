// @vue/component
import { Loc } from 'main.core';
import { TextXl } from 'ui.system.typography.vue';

import { formatAccessUntil } from '../../utils/access-date';
import { helpDesk } from '../../utils/help-desk';
import { HELP_DESK_SLIDER_CODE_DESCRIPTION } from '../consts.js';

export const PublicAccessDescription = {
	name: 'PublicAccessDescription',
	components: { TextXl },
	props: {
		selectedAccessId: { type: String, required: true },
		entityType: { type: String, default: 'FILE' },
		isActive: { type: Boolean, required: true },
		isFullSettings: { type: Boolean, required: true },
		accessEndDate: { type: [Number, Boolean], required: true },
		isPassword: { type: Boolean, required: true },
		isSettingsBlocked: { type: Boolean, default: false },
	},
	computed: {
		publicDescriptionText()
		{
			if (!this.isActive)
			{
				return Loc.getMessage(`DISK_SHARING_ACCESS_POPUP_DEFAULT_PUBLIC_DESCRIPTION_${this.entityType}`);
			}

			if (this.isFullSettings)
			{
				return Loc.getMessage('DISK_SHARING_ACCESS_POPUP_SELECT_ACCESS_PUBLIC_USERS');
			}

			let text = '';

			if (this.selectedAccessId === 'read')
			{
				text = Loc.getMessage(`DISK_SHARING_ACCESS_POPUP_ACTIVE_VIEW_PUBLIC_DESCRIPTION_${this.entityType}`);
			}
			else
			{
				text = Loc.getMessage(`DISK_SHARING_ACCESS_POPUP_ACTIVE_EDIT_PUBLIC_DESCRIPTION_${this.entityType}`);
			}

			const until = formatAccessUntil(this.accessEndDate);

			if (until)
			{
				text = `${text} ${until}`;
			}

			if (this.isPassword)
			{
				text = `${text}. ${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DESCRIPTION_PASSWORD_PROTECTED')}`;
			}

			return text;
		},
	},
	methods: {
		openHelpDesk()
		{
			helpDesk(HELP_DESK_SLIDER_CODE_DESCRIPTION, true);
		},
		onToggleSettings()
		{
			if (this.isSettingsBlocked)
			{
				this.$emit('blockedSettings');

				return;
			}

			this.$emit('toggleSettings');
		},
	},
	emits: ['toggleSettings', 'blockedSettings'],
	template: `
		<div class="access-public-block__description">
			<TextXl
				tag="p"
				className="access-public-block__description-text"
			>
				{{ publicDescriptionText }}
			</TextXl>
		</div>
		<button
			v-if="isActive && !isFullSettings"
			type="button"
			@click="onToggleSettings"
			class="access-public-block__open-settings"
			:class="{ 'access-public-block__open-settings--disabled': isSettingsBlocked }"
			:aria-disabled="isSettingsBlocked"
		>
			${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_CHANGE_BUTTON')}
		</button>
		<button
			v-if="isFullSettings"
			type="button"
			@click="openHelpDesk"
			class="access-public-block__open-aside-popup"
		>
			${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_DETAILS_BUTTON')}
		</button>
	`,
};
