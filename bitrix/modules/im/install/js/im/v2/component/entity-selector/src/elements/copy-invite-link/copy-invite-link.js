import { hint } from 'ui.vue3.directives.hint';
import { Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.core';
import { BIcon, Set as IconsSet } from 'ui.icon-set.api.vue';
import { type PopupOptions } from 'main.popup';

import { showUpdateGuestLinkConfirm } from 'im.v2.lib.confirm';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import './css/copy-invite-link.css';

// @vue/component
export const CopyInviteLink = {
	name: 'CopyInviteLink',
	components: { UiButton, BIcon },
	directives: { hint },
	inject: ['enableAutoHide', 'disableAutoHide'],
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		isCopyingInviteLink: {
			type: Boolean,
			required: true,
		},
		isUpdatingInviteLink: {
			type: Boolean,
			required: true,
		},
		canUpdateLink: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['onCopyInviteLink', 'onUpdateInviteLink'],
	computed: {
		ButtonSize: () => ButtonSize,
		ButtonIcon: () => Outline,
		IconsSet: () => IconsSet,
		isInviteLinkAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.inviteByLinkAvailable);
		},
		refreshIcon(): string
		{
			if (this.isUpdatingInviteLink)
			{
				return this.IconsSet.CLOCK_2;
			}

			return this.IconsSet.REFRESH_5;
		},
		updateLinkHint(): { text: string, popupOptions: PopupOptions }
		{
			return {
				text: this.loc('IM_ENTITY_SELECTOR_ADD_GUEST_LINK_UPDATE_HINT_MSGVER_1'),
				popupOptions: {
					width: 278,
					bindOptions: {
						position: 'top',
					},
					angle: {
						offset: 36,
						position: 'top',
					},
					targetContainer: document.body,
					offsetTop: -8,
				},
			};
		},
	},
	methods: {
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		async confirmAndUpdateInviteLink()
		{
			this.disableAutoHide();
			const confirmResult = await showUpdateGuestLinkConfirm();
			if (!confirmResult)
			{
				this.enableAutoHide();

				return;
			}

			this.enableAutoHide();
			this.$emit('onUpdateInviteLink');
		},
	},
	template: `
		<div v-if="isInviteLinkAvailable" class="bx-im-copy-invite-link__invite-block --link">
			<span class="bx-im-copy-invite-link__invite-block-title --ellipsis">
				{{ loc('IM_ENTITY_SELECTOR_ADD_GUEST_INVITE_BY_LINK') }}
			</span>
			<UiButton
				:size="ButtonSize.SMALL"
				:left-icon="ButtonIcon.LINK"
				:loading="isCopyingInviteLink"
				:disabled="isUpdatingInviteLink"
				:text="loc('IM_ENTITY_SELECTOR_ADD_GUEST_COPY_LINK')"
				@click="$emit('onCopyInviteLink')"
			/>
			<button
				v-if="canUpdateLink"
				v-hint="updateLinkHint"
				:class="{'--loading': isUpdatingInviteLink}"
				class="bx-im-copy-invite-link__update-link_button"
				@click="confirmAndUpdateInviteLink"
			>
				<BIcon :name="refreshIcon" :size="20" />
			</button>
		</div>
	`,
};
