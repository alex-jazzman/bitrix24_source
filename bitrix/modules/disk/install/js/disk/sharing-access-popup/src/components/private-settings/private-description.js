// @vue/component
import { Loc } from 'main.core';
import { TextXl } from 'ui.system.typography.vue';

import { helpDesk } from '../../utils/help-desk';
import { ACCESS_PRIVATE_SELECT_FULL_TEXT, HELP_DESK_SLIDER_CODE_DESCRIPTION } from '../consts.js';

export const PrivateAccessDescription = {
	name: 'PrivateAccessDescription',
	components: { TextXl },
	props: {
		isChangeSettings: { type: Boolean, required: true },
		selectedAccessId: { type: String },
		numberEmployees: { type: Number },
		entityType: { type: String, default: 'FILE' },
		canChangeRights: { type: Boolean, default: false },
		isSettingsBlocked: { type: Boolean, default: false },
	},
	computed: {
		accessIdToText() {
			return ACCESS_PRIVATE_SELECT_FULL_TEXT[this.selectedAccessId];
		},
		privateDescriptionText() {
			if (this.isChangeSettings)
			{
				return Loc.getMessage('DISK_SHARING_ACCESS_POPUP_SELECT_ACCESS_PRIVATE_USERS');
			}

			if (this.numberEmployees > 0)
			{
				return Loc.getMessage(`DISK_SHARING_ACCESS_POPUP_EXTENDED_PRIVATE_DESCRIPTION_${this.entityType}`);
			}

			return Loc.getMessage(`DISK_SHARING_ACCESS_POPUP_DEFAULT_PRIVATE_DESCRIPTION_${this.accessIdToText}_${this.entityType}`);
		},
	},
	emits: ['changeSettings', 'blockedSettings', 'openDetails'],
	methods: {
		onChangeSettingsClick()
		{
			if (this.isSettingsBlocked)
			{
				this.$emit('blockedSettings');

				return;
			}

			this.$emit('changeSettings');
		},
		openHelpDesk()
		{
			helpDesk(HELP_DESK_SLIDER_CODE_DESCRIPTION, true);
		},
	},
	// the root is a fragment on purpose: the blocks below have to stay flex items of the parent
	// wrapper to keep their own align-self and z-index
	template: `
		<div class="access-private-block__description-wrapper">
			<TextXl
				tag="p"
				className="access-private-block__description-text"
				data-testid="disk-sharing-access-private-description"
			>
				{{ privateDescriptionText }}
			</TextXl>
		</div>
		<button
			v-if="!isChangeSettings && (canChangeRights || isSettingsBlocked)"
			data-testid="disk-sharing-private-settings-button"
			@click="onChangeSettingsClick"
			class="access-private-block__open-settings"
			data-testid="disk-sharing-access-private-settings-toggle"
			:class="{ 'access-private-block__open-settings--disabled': isSettingsBlocked }"
			:aria-disabled="isSettingsBlocked"
		>
			${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_CHANGE_BUTTON')}
		</button>
		<button
			v-if="isChangeSettings"
			@click="openHelpDesk"
			class="access-private-block__open-aside-popup"
			data-testid="disk-sharing-access-private-details"
		>
			${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_DETAILS_BUTTON')}
		</button>
	`,
};
