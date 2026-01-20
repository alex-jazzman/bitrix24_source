/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports,main_core,main_core_events,call_application_conferenceChannel,call_lib_callManager,call_lib_analytics,im_public,im_v2_const,im_v2_component_elements_chatTitle,im_v2_component_elements_button,im_v2_component_elements_avatar) {
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
	        im_public.Messenger.openConference({
	          code: this.dialog.public.code
	        });
	        return;
	      }
	      const hasThisActiveCall = await this.getCallManager().sendBroadcastRequest(this.activeCall.call.uuid);
	      if (hasThisActiveCall.some(call => call)) {
	        return;
	      }
	      this.getCallManager().joinCall(this.activeCall.call.id, this.activeCall.call.uuid, this.activeCall.dialogId);
	    },
	    onBackToCallClick() {
	      if (this.isConference) {
	        call_application_conferenceChannel.ConferenceChannel.getInstance().sendRequest(this.dialog.public.code);
	        return;
	      }
	      this.getCallManager().sendBroadcastRequest(this.activeCall.call.uuid);
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
	      if (this.activeCall.state !== im_v2_const.RecentCallStatus.joined) {
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

}((this.BX.Call.Component = this.BX.Call.Component || {}),BX,BX.Event,BX.Messenger.Application,BX.Call.Lib,BX.Call.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Const,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Component.Elements));
//# sourceMappingURL=active-call.bundle.js.map
