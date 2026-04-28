/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,ui_vue3_components_richLoc,im_v2_component_message_base,im_v2_component_message_elements,im_v2_lib_helpdesk) {
	'use strict';

	// @vue/component
	const AiBizprocMessage = {
	  name: 'AiBizprocMessage',
	  components: {
	    AuthorTitle: im_v2_component_message_elements.AuthorTitle,
	    BaseMessage: im_v2_component_message_base.BaseMessage,
	    MessageStatus: im_v2_component_message_elements.MessageStatus,
	    DefaultMessageContent: im_v2_component_message_elements.DefaultMessageContent,
	    RichLoc: ui_vue3_components_richLoc.RichLoc
	  },
	  props: {
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
	      default: true
	    }
	  },
	  computed: {
	    message() {
	      return this.item;
	    }
	  },
	  methods: {
	    onWarningDetailsClick() {
	      const ARTICLE_CODE = '27777462';
	      im_v2_lib_helpdesk.openHelpdeskArticle(ARTICLE_CODE);
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  },
	  template: `
		<BaseMessage :item="item" :dialogId="dialogId" class="bx-im-message-ai-bizproc__container">
			<div class="bx-im-message-default__container">
				<AuthorTitle v-if="withTitle" :item="message"/>
				<DefaultMessageContent :item="message" :dialogId="dialogId" :withMessageStatus="false" />
			</div>
			<div class="bx-im-message-ai-bizproc__bottom-panel">
				<span class="bx-im-message-ai-bizproc__warning">
					<RichLoc
						:text="loc('IM_MESSAGE_AI_BIZPROC_WARNING_FOOTNOTE')"
						placeholder="[url]"
					>
						<template #url="{ text }">
							<span class="bx-im-message-ai-bizproc__warning_link" @click="onWarningDetailsClick">
								{{ text }}
							</span>
						</template>
					</RichLoc>
				</span>
				<div class="bx-im-message-ai-bizproc__status-container">
					<MessageStatus :item="message"/>
				</div>
			</div>
		</BaseMessage>
	`
	};

	exports.AiBizprocMessage = AiBizprocMessage;

}((this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}),BX.UI.Vue3.Components,BX.Messenger.v2.Component.Message,BX.Messenger.v2.Component.Message,BX.Messenger.v2.Lib));
//# sourceMappingURL=ai-bizproc.bundle.js.map
