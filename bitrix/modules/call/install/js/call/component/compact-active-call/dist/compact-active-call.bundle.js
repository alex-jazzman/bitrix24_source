/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports,im_v2_component_elements_avatar) {
	'use strict';

	// @vue/component
	const CompactActiveCall = {
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
	    }
	  },
	  methods: {
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
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div :data-id="activeCall.dialogId" class="bx-im-list-recent-compact-item__wrap">
			<div @click="onClick" class="bx-im-list-recent-compact-item__container">
				<div class="bx-im-list-recent-compact-item__avatar_container">
					<ChatAvatar 
						:avatarDialogId="activeCall.dialogId"
						:contextDialogId="activeCall.dialogId"
						:size="AvatarSize.M" 
						:withSpecialTypes="false" 
					/>
					<div class="bx-im-list-recent-compact-active-call__icon" :class="'--' + activeCall.state"></div>
				</div>
			</div>
		</div>
	`
	};

	exports.CompactActiveCall = CompactActiveCall;

}((this.BX.Call.Component = this.BX.Call.Component || {}),BX.Messenger.v2.Component.Elements));
//# sourceMappingURL=compact-active-call.bundle.js.map
