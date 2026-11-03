/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_ui_popup, call_component_ui_button, call_component_ui_icon) {
	'use strict';

	const CallFollowUpPopup = ui_vue3.defineComponent({
		name: 'CallFollowUpPopup',
		components: {
			CallPopup: call_component_ui_popup.CallPopup,
			CallIcon: call_component_ui_icon.CallIcon,
			CallButton: call_component_ui_button.CallButton
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		props: {
			settings: {
				type: Boolean,
				default: false
			},
			tariff: {
				type: Boolean,
				default: false
			},
			boost: {
				type: Boolean,
				default: false
			},
			enabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['toggle', 'hidden'],
		methods: {
			show(target) {
				this.$refs.popup?.show(target);
			},
			hide() {
				this.$refs.popup?.hide();
			},
			toggle(target) {
				this.$refs.popup?.toggle(target);
			},
			handleClick() {
				this.$emit('toggle');
				this.hide();
			}
		},
		template: `
		<CallPopup ref="popup" class-name="call-follow-up-popup" @hidden="$emit('hidden')">
			<div class="call-follow-up-popup__logo">
				<div class="call-follow-up-popup__icon">
					<CallIcon icon="copilot-solid" :size="42" />
				</div>
				<div class="call-follow-up-popup__title">{{ loc('CALL_BLOCK_FOLLOW_UP_POPUP_TITLE') }}</div>
			</div>
			<div class="call-follow-up-popup__description">{{ loc('CALL_BLOCK_FOLLOW_UP_POPUP_DESCRIPTION') }}</div>
			<ul class="call-follow-up-popup-list">
				<li class="call-follow-up-popup-list__item">
					<CallIcon icon="text" color="purple" :size="22" />
					<div class="call-follow-up-popup-list__text">{{ loc('CALL_BLOCK_FOLLOW_UP_POPUP_LIST_ITEM_RESULTS') }}</div>
				</li>
				<li class="call-follow-up-popup-list__item">
					<CallIcon icon="create-chat" color="purple" :size="22" />
					<div class="call-follow-up-popup-list__text">{{ loc('CALL_BLOCK_FOLLOW_UP_POPUP_LIST_ITEM_ANALYSE') }}</div>
				</li>
				<li class="call-follow-up-popup-list__item">
					<CallIcon icon="magic-wand" color="purple" :size="22" />
					<div class="call-follow-up-popup-list__text">{{ loc('CALL_BLOCK_FOLLOW_UP_POPUP_LIST_ITEM_GRADE') }}</div>
				</li>
				<li class="call-follow-up-popup-list__item">
					<CallIcon icon="bulleted-list" color="purple" :size="22" />
					<div class="call-follow-up-popup-list__text">
						{{ loc('CALL_BLOCK_FOLLOW_UP_POPUP_LIST_ITEM_TRANSCRIPT') }}
					</div>
				</li>
			</ul>
			<div class="call-follow-up-popup__action">
				<span v-if="settings">{{ loc('CALL_BLOCK_FOLLOW_UP_POPUP_CONCERN_NOT_ACCEPTED') }}</span>
				<CallButton
					v-else-if="tariff || boost"
					test-id="call-follow-up-popup-button"
					:size="34"
					color="gradient"
					animated
					:label="tariff ? loc('CALL_FOOTER_POPUP_CLOUD_RECORD_BUTTON_BUY') : loc('CALL_BLOCK_FOLLOW_UP_POPUP_BUTTON_BUY_BOOST')"
					@click="handleClick"
				>
					<template #prepend>
						<CallIcon icon="rocket" />
					</template>
				</CallButton>
				<CallButton
					v-else-if="enabled"
					test-id="call-follow-up-popup-button"
					:size="34"
					color="transparent"
					border
					:label="loc('CALL_BLOCK_FOLLOW_UP_POPUP_BUTTON_DISABLE')"
					@click="handleClick"
				/>
				<CallButton
					v-else
					test-id="call-follow-up-popup-button"
					:size="34"
					border
					:label="loc('CALL_BLOCK_FOLLOW_UP_POPUP_BUTTON_ENABLE')"
					@click="handleClick"
				/>
			</div>
		</CallPopup>
	`
	});

	exports.CallFollowUpPopup = CallFollowUpPopup;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3, BX.Call.Component.UI, BX.Call.Component.Ui, BX.Call.Component.Ui);
//# sourceMappingURL=follow-up-popup.bundle.js.map
