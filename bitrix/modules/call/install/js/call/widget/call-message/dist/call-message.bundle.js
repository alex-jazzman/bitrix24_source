/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, ui_vue3, ui_vue3_directives_hint, im_public, im_v2_component_message_base, im_v2_component_message_elements, im_v2_const, im_v2_lib_dateFormatter, call_lib_analytics, call_lib_callManager) {
	'use strict';

	const CallMessageBody = ui_vue3.defineComponent({
		name: 'CallMessageBody',
		props: {
			iconClasses: {
				type: Array,
				required: true
			},
			text: {
				type: String,
				required: true
			},
			date: {
				type: String,
				required: true
			}
		},
		template: `
		<span :class="iconClasses"></span>
		<span class="bx-call-message__text-container">
			<span class="bx-call-message__text">{{ text }}</span>
			<span class="bx-im-message-status__date bx-call-message__date">{{ date }}</span>
		</span>
	`
	});

	const MESSAGE_TYPE = {
		start: 'START',
		finish: 'FINISH',
		declined: 'DECLINED',
		busy: 'BUSY',
		missed: 'MISSED',
		cancelled: 'CANCELLED'
	};
	const CallMessage = ui_vue3.defineComponent({
		name: 'CallMessage',
		components: {
			BaseMessage: im_v2_component_message_base.BaseMessage,
			MessageHeader: im_v2_component_message_elements.MessageHeader,
			CallMessageBody
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
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
		setup() {
			return {
				hintTimeout: null
			};
		},
		data() {
			return {
				showHint: false
			};
		},
		computed: {
			message() {
				return this.item;
			},
			componentParams() {
				return this.item.componentParams;
			},
			messageIconClasses() {
				const result = ['bx-call-message__icon'];
				switch (this.componentParams.messageType) {
					case MESSAGE_TYPE.start:
						result.push('bx-call-message__icon--secondary');
						break;
					case MESSAGE_TYPE.finish:
						result.push('bx-call-message__icon--primary');
						break;
					case MESSAGE_TYPE.declined:
					case MESSAGE_TYPE.busy:
					case MESSAGE_TYPE.missed:
					case MESSAGE_TYPE.cancelled:
						result.push('bx-call-message__icon--danger');
						break;
					default:
						result.push('bx-call-message__icon--secondary');
						break;
				}
				return result;
			},
			messageText() {
				return this.componentParams.messageText;
			},
			formattedDate() {
				return im_v2_lib_dateFormatter.DateFormatter.formatByCode(this.message.date, im_v2_lib_dateFormatter.DateCode.shortTimeFormat);
			},
			hasActiveCurrentCall() {
				return call_lib_callManager.CallManager.getInstance().hasActiveCurrentCall(this.dialogId);
			},
			hasActiveAnotherCall() {
				return call_lib_callManager.CallManager.getInstance().hasActiveAnotherCall(this.dialogId);
			},
			hasActiveCallInDialog() {
				return call_lib_callManager.CallManager.getInstance().hasActiveCallInDialog(this.dialogId);
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isConference() {
				return this.dialog.type === im_v2_const.ChatType.videoconf;
			},
			isInteractive() {
				return !this.hasActiveAnotherCall && this.hasActiveCallInDialog;
			},
			isBusy() {
				return this.hasActiveAnotherCall;
			},
			isActionable() {
				return this.isInteractive || this.isBusy;
			},
			accessibleName() {
				if (this.isBusy) {
					return this.messageText;
				}
				const action = this.hasActiveCurrentCall ? this.loc('CALL_MESSAGE_RETURN_TO_CALL_ARIA') : this.loc('CALL_MESSAGE_JOIN_CALL_ARIA');
				return `${this.messageText}. ${action}`;
			},
			hintTargetId() {
				return `bx-call-message-hint-${this.message.id}`;
			},
			activeCallHintText() {
				return this.loc('CALL_MESSAGE_HAS_ACTIVE_CALL_HINT');
			},
			hintContent() {
				if (!this.showHint) {
					return null;
				}
				return {
					text: this.activeCallHintText,
					popupOptions: {
						bindOptions: {
							position: 'top'
						},
						angle: {
							position: 'bottom'
						},
						targetContainer: document.body,
						offsetLeft: 65,
						offsetTop: 0
					}
				};
			}
		},
		beforeUnmount() {
			clearTimeout(this.hintTimeout ?? undefined);
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return main_core.Loc.getMessage(phraseCode, replacements) ?? '';
			},
			onMessageClick() {
				if (this.hasActiveAnotherCall) {
					this.showHint = true;
					clearTimeout(this.hintTimeout ?? undefined);
					this.hintTimeout = setTimeout(() => {
						this.showHint = false;
					}, 10000);
					return;
				}
				if (!this.hasActiveCallInDialog) {
					return;
				}
				if (this.componentParams.messageType === MESSAGE_TYPE.start) {
					call_lib_analytics.Analytics.getInstance().onStartCallMessageClick({
						dialog: this.dialog
					});
				} else {
					call_lib_analytics.Analytics.getInstance().onFinishCallMessageClick({
						dialog: this.dialog
					});
				}
				if (this.isConference) {
					void im_public.Messenger.openConference({
						code: this.dialog.public.code
					});
				} else {
					void im_public.Messenger.startVideoCall(this.dialogId);
				}
			}
		},
		template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withContextMenu="false"
			:withBackground="true"
			:withReactions="false"
			class="bx-call-message__scope"
		>
			<div class="bx-call-message__container">
				<div class="bx-call-message__content-wrapper">
					<MessageHeader :withTitle="withTitle" :item="item" />
					<button
						v-if="isActionable"
						type="button"
						class="bx-call-message__button"
						:aria-label="accessibleName"
						:aria-disabled="isBusy ? 'true' : null"
						:aria-describedby="isBusy ? hintTargetId : null"
						@click="onMessageClick"
					>
						<span :key="showHint" v-hint="hintContent" class="bx-call-message__content">
							<CallMessageBody :iconClasses="messageIconClasses" :text="messageText" :date="formattedDate" />
						</span>
						<span v-if="isBusy" :id="hintTargetId" class="bx-call-message__sr-only">
							{{ activeCallHintText }}
						</span>
					</button>
					<div v-else class="bx-call-message__content">
						<CallMessageBody :iconClasses="messageIconClasses" :text="messageText" :date="formattedDate" />
					</div>
				</div>
			</div>
		</BaseMessage>
	`
	});

	exports.CallMessage = CallMessage;

})(this.BX.Call.Widget = this.BX.Call.Widget || {}, BX, BX.Vue3, BX.Vue3.Directives, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Component.Message, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Call.Lib, BX.Call.Lib);
//# sourceMappingURL=call-message.bundle.js.map
