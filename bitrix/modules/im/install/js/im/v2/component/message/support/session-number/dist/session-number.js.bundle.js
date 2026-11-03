/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_component_message_default, im_v2_component_message_file) {
	'use strict';

	const SESSION_ID_PARAMS_KEY = 'imolSid';

	// @vue/component
	const SessionNumberPlaque = {
		name: 'SessionNumberPlaque',
		props: {
			item: {
				type: Object,
				required: true
			}
		},
		computed: {
			message() {
				return this.item;
			},
			sessionNumberText() {
				return this.loc('IM_MESSAGE_SUPPORT_SESSION_NUMBER_TEXT', {
					'#SESSION_NUMBER#': this.sessionNumber
				});
			},
			sessionNumber() {
				return this.message.componentParams?.[SESSION_ID_PARAMS_KEY];
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div class="bx-im-message-support-session-number__container">
			<div class="bx-im-message-support-session-number__content">
				{{ sessionNumberText }}
			</div>
		</div>
	`
	};

	// @vue/component
	const SupportSessionNumberMessage = {
		name: 'SupportSessionNumber',
		components: {
			DefaultMessage: im_v2_component_message_default.DefaultMessage,
			FileMessage: im_v2_component_message_file.FileMessage,
			SessionNumberPlaque
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
			},
			containerHeight: {
				type: [Number, null],
				default: null
			}
		},
		data() {
			return {};
		},
		computed: {
			message() {
				return this.item;
			},
			hasFiles() {
				return this.message.files.length > 0;
			}
		},
		template: `
		<FileMessage
			v-if="hasFiles"
			:item="item"
			:dialogId="dialogId"
			:withTitle="withTitle"
			:containerHeight="containerHeight"
		>
			<template #before-message>
				<SessionNumberPlaque :item="item"/>
			</template>
		</FileMessage>
		<DefaultMessage v-else :item="item" :dialogId="dialogId" :withTitle="withTitle">
			<template #before-message>
				<SessionNumberPlaque :item="item"/>
			</template>
		</DefaultMessage>
	`
	};

	exports.SupportSessionNumberMessage = SupportSessionNumberMessage;

})(this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Component.Message);
//# sourceMappingURL=session-number.js.bundle.js.map
