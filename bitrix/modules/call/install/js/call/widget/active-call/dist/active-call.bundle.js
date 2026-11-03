/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, main_core_events, ui_dialogs_messagebox, im_public, im_v2_component_elements_avatar, im_v2_component_elements_button, im_v2_component_elements_chatTitle, im_v2_const, call_application_conferenceChannel, call_lib_analytics, call_lib_callManager) {
	'use strict';

	// @vue/component
	const ActiveCall = {
		name: 'ActiveCall',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			ChatTitle: im_v2_component_elements_chatTitle.ChatTitle,
			ChatButton: im_v2_component_elements_button.ChatButton
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
			ButtonSize: () => im_v2_component_elements_button.ButtonSize,
			ButtonColor: () => im_v2_component_elements_button.ButtonColor,
			ButtonIcon: () => im_v2_component_elements_button.ButtonIcon,
			activeCall() {
				return this.item;
			},
			dialog() {
				return this.$store.getters['chats/get'](this.activeCall.dialogId, true);
			},
			isConference() {
				return this.dialog.type === im_v2_const.ChatType.videoconf;
			},
			preparedName() {
				return main_core.Text.decode(this.activeCall.name);
			},
			anotherDeviceColorScheme() {
				return {
					backgroundColor: 'transparent',
					borderColor: '#bbde4d',
					iconColor: '#525c69',
					textColor: '#525c69',
					hoverColor: 'transparent'
				};
			},
			isTabWithActiveCall() {
				return this.$store.getters['recent/calls/hasActiveCall']() && Boolean(this.getCallManager().hasCurrentCall());
			},
			hasJoined() {
				return this.activeCall.state === im_v2_const.RecentCallStatus.joined;
			}
		},
		created() {
			if (this.hasJoined) {
				return;
			}
			if (this.isConference) {
				void this.getCallManager().syncActiveConferenceState(this.activeCall.dialogId, this.activeCall.call.uuid, this.dialog.public.code);
				return;
			}
			void this.getCallManager().syncActiveCallState(this.activeCall.dialogId, this.activeCall.call.uuid);
		},
		methods: {
			async onJoinClick() {
				main_core_events.EventEmitter.emit(im_v2_const.EventType.call.onJoinFromRecentItem);
				if (this.isConference) {
					call_lib_analytics.Analytics.getInstance().onJoinConferenceClick({
						callId: this.activeCall.call.id
					});
					const hasThisActiveConference = await call_application_conferenceChannel.ConferenceChannel.getInstance().sendRequest(this.dialog.public.code);
					if (hasThisActiveConference.some(call => call)) {
						return;
					}

					// A conference is opened by the messenger, bypassing the call controller, so the slot has to be
					// released here: otherwise a ringing invitation stays in it and keeps ringing on the server.
					this.getCallManager().releaseRingingCallSlot();
					void im_public.Messenger.openConference({
						code: this.dialog.public.code
					});
					return;
				}
				const hasThisActiveCall = await this.getCallManager().sendBroadcastRequest(this.activeCall.call.uuid);
				if (hasThisActiveCall) {
					return;
				}
				this.getCallManager().joinCall(this.activeCall.call.id, this.activeCall.call.uuid, this.activeCall.dialogId);
			},
			async onBackToCallClick() {
				if (this.isConference) {
					const hasThisActiveConference = await call_application_conferenceChannel.ConferenceChannel.getInstance().sendRequest(this.dialog.public.code);
					if (hasThisActiveConference.some(call => call)) {
						return;
					}
					void im_public.Messenger.openConference({
						code: this.dialog.public.code
					});
					return;
				}
				const hasThisActiveCall = await this.getCallManager().sendBroadcastRequest(this.activeCall.call.uuid);
				if (hasThisActiveCall) {
					return;
				}
				if (this.dialog.type === im_v2_const.ChatType.user) {
					new ui_dialogs_messagebox.MessageBox({
						title: this.loc('CALL_MULTI_DEVICE_DIALOG_TITLE'),
						message: this.loc('CALL_MULTI_DEVICE_DIALOG_MESSAGE'),
						buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
						okCaption: this.loc('CALL_MULTI_DEVICE_DIALOG_CONFIRM'),
						cancelCaption: this.loc('CALL_MULTI_DEVICE_DIALOG_CANCEL'),
						onOk: async messageBox => {
							await this.getCallManager().takeOverCall(this.activeCall.dialogId, this.activeCall.call.uuid);
							messageBox.close();
						}
					}).show();
					return;
				}
				this.getCallManager().joinCall(this.activeCall.call.id, this.activeCall.call.uuid, this.activeCall.dialogId);
			},
			onLeaveCallClick() {
				this.getCallManager().leaveCurrentCall();
			},
			onClick(event) {
				const recentItem = this.$store.getters['recent/get'](this.activeCall.dialogId);
				if (!recentItem) {
					return;
				}
				this.$emit('click', {
					item: recentItem,
					$event: event
				});
			},
			returnToCall() {
				if (!this.hasJoined) {
					return;
				}
				this.getCallManager().unfoldCurrentCall();
			},
			getCallManager() {
				return call_lib_callManager.CallManager.getInstance();
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div :data-id="activeCall.dialogId" class="bx-im-list-recent-item__wrap bx-im-list-recent-active-call-item__wrap">
			<div @click="onClick" class="bx-im-list-recent-item__container bx-im-list-recent-active-call__container">
				<div class="bx-im-list-recent-item__avatar_container">
					<ChatAvatar 
						:avatarDialogId="activeCall.dialogId" 
						:contextDialogId="activeCall.dialogId" 
						:size="AvatarSize.XL" 
					/>
				</div>
				<div class="bx-im-list-recent-item__content_container">
					<div class="bx-im-list-recent-active-call__title_container">
						<ChatTitle :text="preparedName" />
						<div class="bx-im-list-recent-active-call__title_icon"></div>
					</div>
					<div v-if="!hasJoined" class="bx-im-list-recent-active-call__actions_container">
						<div class="bx-im-list-recent-active-call__actions_item --join">
							<ChatButton @click.stop="onJoinClick" :size="ButtonSize.M" :color="ButtonColor.Success" :isRounded="true" :text="loc('CALL_LIST_RECENT_ACTIVE_CALL_JOIN')" />
						</div>
					</div>
					<div v-else-if="hasJoined && isTabWithActiveCall" class="bx-im-list-recent-active-call__actions_container">
						<div class="bx-im-list-recent-active-call__actions_item --return">
							<ChatButton @click.stop="returnToCall" :size="ButtonSize.M" :color="ButtonColor.Success" :isRounded="true" :text="loc('CALL_LIST_RECENT_ACTIVE_CALL_RETURN')" />
						</div>
					</div>
					<div v-else-if="hasJoined && !isTabWithActiveCall" class="bx-im-list-recent-active-call__actions_container">
						<div class="bx-im-list-recent-active-call__actions_item --another-device">
							<ChatButton :size="ButtonSize.M" @click.stop="onBackToCallClick" :customColorScheme="anotherDeviceColorScheme" :isRounded="true" :text="loc('CALL_LIST_RECENT_ACTIVE_CALL_ANOTHER_DEVICE')" />
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	exports.ActiveCall = ActiveCall;

})(this.BX.Call.Widget = this.BX.Call.Widget || {}, BX, BX.Event, BX.UI.Dialogs, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Const, BX.Messenger.Application, BX.Call.Lib, BX.Call.Lib);
//# sourceMappingURL=active-call.bundle.js.map
