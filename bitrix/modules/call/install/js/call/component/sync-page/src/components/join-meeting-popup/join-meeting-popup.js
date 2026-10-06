import { CallPopupContainer } from 'call.component.elements';
import { isGuestCallLink } from '../../lib/guest-link';

import './join-meeting-popup.css';

const POPUP_ID = 'call-join-meeting-popup';
const POPUP_CONFIG = {
	width: 420,
	padding: 0,
	overlay: true,
	autoHide: true,
	closeByEsc: true,
	closeIcon: true,
	contentBorderRadius: '18px',
	angle: false,
};

// @vue/component
export const JoinMeetingPopup = {
	name: 'JoinMeetingPopup',
	components: { CallPopupContainer },
	emits: ['close', 'join'],
	setup(): Object
	{
		return {
			popupId: POPUP_ID,
			popupConfig: POPUP_CONFIG,
		};
	},
	data()
	{
		return {
			meetingInput: '',
		};
	},
	computed:
	{
		isJoinDisabled()
		{
			return !isGuestCallLink(this.meetingInput);
		},
	},
	methods:
	{
		onJoinClick()
		{
			if (this.isJoinDisabled)
			{
				return;
			}

			this.$emit('join', this.meetingInput);
		},
		onClose()
		{
			this.$emit('close');
		},
	},
	template: /* HTML */`
		<CallPopupContainer :config="popupConfig" :id="popupId" @close="onClose">
			<div class="call-sync-page__join-popup_container">
				<div class="call-sync-page__join-popup_title">
					{{ $Bitrix.Loc.getMessage('CALL_SYNC_PAGE_JOIN_POPUP_TITLE') }}
				</div>
				<input
					class="call-sync-page__join-popup_input"
					v-model.trim="meetingInput"
					:aria-label="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_JOIN_POPUP_INPUT_PLACEHOLDER')"
					:placeholder="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_JOIN_POPUP_INPUT_PLACEHOLDER')"
					@keydown.enter="onJoinClick"
				/>
				<button
					type="button"
					class="call-sync-page__join-popup_button"
					:class="{'--disabled': isJoinDisabled}"
					:disabled="isJoinDisabled"
					@click="onJoinClick"
				>
					{{ $Bitrix.Loc.getMessage('CALL_SYNC_PAGE_JOIN_POPUP_BUTTON') }}
				</button>
			</div>
		</CallPopupContainer>
	`,
};
