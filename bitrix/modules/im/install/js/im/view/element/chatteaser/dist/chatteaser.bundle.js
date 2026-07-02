/* eslint-disable */
(function (ui_designTokens, ui_vue, im_lib_utils) {
	'use strict';

	/**
	 * Bitrix Messenger
	 * ChatTeaser element Vue component
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.BitrixVue.component('bx-im-view-element-chat-teaser', {
		/*
		 * @emits 'click' {}
		 */
		props: {
			messageCounter: {
				default: 0
			},
			messageLastDate: {
				default: 0
			},
			languageId: {
				default: 'en'
			}
		},
		computed: {
			formattedDate() {
				return im_lib_utils.Utils.date.format(this.messageLastDate, null, this.$Bitrix.Loc.getMessages());
			},
			formattedCounter() {
				return this.messageCounter + ' ' + im_lib_utils.Utils.text.getLocalizeForNumber('IM_MESSENGER_COMMENT', this.messageCounter, this.languageId, this.$Bitrix.Loc.getMessages());
			}
		},
		template: `
		<div class="bx-im-element-chat-teaser" @click="$emit('click', $event)">
			<span class="bx-im-element-chat-teaser-join">{{$Bitrix.Loc.getMessage('IM_MESSENGER_COMMENT_OPEN')}}</span>
			<span class="bx-im-element-chat-teaser-comment">
				<span class="bx-im-element-chat-teaser-counter">{{formattedCounter}}</span>, {{formattedDate}}
			</span>
		</div>
	`
	});

})(BX, BX, BX.Messenger.Lib);
//# sourceMappingURL=chatteaser.bundle.js.map
