/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, ui_vue3, im_v2_component_elements_avatar, im_v2_const) {
	'use strict';

	const CompactActiveCall = ui_vue3.defineComponent({
		name: 'CompactActiveCall',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar
		},
		props: {
			item: {
				type: Object,
				required: true
			}
		},
		emits: ['click'],
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			activeCall() {
				return this.item;
			},
			hasJoined() {
				return this.activeCall.state === im_v2_const.RecentCallStatus.joined;
			},
			statusPhrase() {
				return this.hasJoined ? this.loc('CALL_COMPACT_ACTIVE_CALL_JOINED_ARIA') : this.loc('CALL_COMPACT_ACTIVE_CALL_WAITING_ARIA');
			},
			chatName() {
				return main_core.Text.decode(this.activeCall.name);
			},
			accessibleName() {
				return this.chatName ? `${this.chatName}. ${this.statusPhrase}` : this.statusPhrase;
			}
		},
		methods: {
			onClick() {
				this.$emit('click', {
					dialogId: this.activeCall.dialogId
				});
			},
			loc(phraseCode) {
				return main_core.Loc.getMessage(phraseCode) ?? '';
			}
		},
		template: `
		<div
			:data-id="activeCall.dialogId"
			class="bx-im-list-recent-compact-item__wrap"
			data-testid="call-compact-active-call-item"
		>
			<button
				type="button"
				class="bx-im-list-recent-compact-item__container bx-call-compact-active-call__button"
				data-testid="call-compact-active-call-chip"
				:aria-label="accessibleName"
				@click="onClick"
			>
				<span class="bx-im-list-recent-compact-item__avatar_container">
					<ChatAvatar
						:avatarDialogId="activeCall.dialogId"
						:contextDialogId="activeCall.dialogId"
						:size="AvatarSize.M"
						:withSpecialTypes="false"
					/>
					<span
						class="bx-im-list-recent-compact-active-call__icon"
						:class="'--' + activeCall.state"
						data-testid="call-compact-active-call-icon"
					></span>
				</span>
			</button>
		</div>
	`
	});

	exports.CompactActiveCall = CompactActiveCall;

})(this.BX.Call.Widget = this.BX.Call.Widget || {}, BX, BX.Vue3, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Const);
//# sourceMappingURL=compact-active-call.bundle.js.map
