/* eslint-disable */
this.BX = this.BX || {};
this.BX.Vote = this.BX.Vote || {};
(function (exports,im_v2_component_message_base,im_v2_component_message_elements,vote_component_vote) {
	'use strict';

	// @vue/component
	const VoteChatDisplay = {
	  name: 'VoteChatDisplay',
	  components: {
	    BaseMessage: im_v2_component_message_base.BaseMessage,
	    VoteDisplay: vote_component_vote.VoteDisplay,
	    AuthorTitle: im_v2_component_message_elements.AuthorTitle,
	    MessageFooter: im_v2_component_message_elements.MessageFooter,
	    ReactionList: im_v2_component_message_elements.ReactionList
	  },
	  props: {
	    /** @type {ImModelMessage} */
	    item: {
	      type: Object,
	      required: true
	    },
	    dialogId: {
	      type: String,
	      required: true
	    },
	    withTitle: {
	      type: Boolean,
	      required: true
	    }
	  },
	  computed: {
	    savedMessageId() {
	      return Number.parseInt(this.item.id, 10);
	    },
	    voteItem() {
	      return this.item.componentParams;
	    }
	  },
	  template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withContextMenu="false"
			:withBackground="true"
		>
			<div class="bx-im-chat__vote-container">
				<AuthorTitle :item="item" class="bx-im-chat-title__vote"/>
				<div class="bx-im-chat-title__vote-icon"></div>
				<VoteDisplay
					:voteItem="voteItem"
					:entityId="savedMessageId"
					:entityType="'ImMessage'"
					:contextId="dialogId"
				/>
				<ReactionList :messageId="item.id" :contextDialogId="dialogId" class="bx-im-reaction-list__vote"/>
				<MessageFooter :item="item" :dialogId="dialogId" />
			</div>
		</BaseMessage>
	`
	};

	exports.VoteChatDisplay = VoteChatDisplay;

}((this.BX.Vote.Component = this.BX.Vote.Component || {}),BX.Messenger.v2.Component.Message,BX.Messenger.v2.Component.Message,BX.Vote.Component));
//# sourceMappingURL=index.bundle.js.map
