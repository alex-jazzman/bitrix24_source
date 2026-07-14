/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, im_v2_lib_utils, im_v2_component_elements_popup, ui_iconSet_api_vue, im_v2_lib_feature, im_v2_lib_counter) {
	'use strict';

	const ID_PREFIX = 'im-v2-menu';

	// @vue/component
	const MessengerMenu = {
		name: 'MessengerMenu',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup
		},
		props: {
			config: {
				type: Object,
				required: true
			},
			className: {
				type: String,
				required: false,
				default: ''
			}
		},
		emits: ['close'],
		data() {
			return {
				id: ''
			};
		},
		created() {
			this.id = this.config.id ?? `${ID_PREFIX}-${im_v2_lib_utils.Utils.text.getUuidV4()}`;
		},
		template: `
		<MessengerPopup
			:config="config"
			@close="$emit('close')"
			:id="id"
		>
			<div class="bx-im-menu__container" :class="className">
				<slot name="header"></slot>
				<slot></slot>
				<slot name="footer"></slot>
			</div>
		</MessengerPopup>
	`
	};

	const MenuItemIcon = {
		chat: 'chat',
		channel: 'channel',
		collab: 'collab',
		collabV2: 'collab-v2',
		conference: 'conference',
		upload: 'upload',
		file: 'file',
		task: 'task',
		meeting: 'meeting',
		summary: 'summary',
		vote: 'vote',
		aiText: 'ai-text',
		aiImage: 'ai-image',
		copilot: 'copilot',
		calendarSlot: 'calendar-slot',
		documentSign: 'document-sign',
		b24: 'b24',
		aiAssistant: 'ai-assistant',
		lock: 'lock'
	};

	// @vue/component
	const MenuItem = {
		name: 'MenuItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			icon: {
				type: String,
				required: false,
				default: ''
			},
			title: {
				type: String,
				required: true
			},
			subtitle: {
				type: String,
				required: false,
				default: ''
			},
			disabled: {
				type: Boolean,
				required: false,
				default: false
			},
			counter: {
				type: Number,
				required: false,
				default: 0
			},
			withBottomBorder: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			formattedCounter() {
				if (this.counter === 0) {
					return '';
				}
				return im_v2_lib_counter.CounterManager.formatCounter(this.counter);
			},
			preparedIcon() {
				return this.disabled ? MenuItemIcon.lock : this.icon;
			},
			containerClasses() {
				return {
					'--disabled': this.disabled,
					'--bottom-border': this.withBottomBorder
				};
			},
			isAiAssistantItem() {
				if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available)) {
					return false;
				}
				return this.icon === MenuItemIcon.aiAssistant;
			}
		},
		template: `
		<div class="bx-im-menu-item__container" :class="containerClasses">
			<div class="bx-im-menu-item__content" :class="{'--with-icon': !!preparedIcon}">
				<BIcon
					v-if="isAiAssistantItem"
					:name="OutlineIcons.BITRIX_GPT"
					class="bx-im-menu_item__ai-assistant-icon"
				/>
				<div v-else-if="preparedIcon" class="bx-im-menu_item__icon" :class="'--' + preparedIcon"></div>
				<div class="bx-im-menu-item__text-content" :class="{'--with-subtitle': !!subtitle}">
					<div class="bx-im-menu-item__title">
						<div 
							class="bx-im-menu-item__title_text"
							:class="{ '--ai-assistant': isAiAssistantItem }"
						>
							{{ title }}
						</div>
						<slot name="after-title"></slot>
						<div v-if="counter" class="bx-im-menu-item__title_counter">{{ formattedCounter }}</div>
					</div>
					<div v-if="subtitle" :title="subtitle" class="bx-im-menu-item__subtitle">{{ subtitle }}</div>
					<slot name="below-content"></slot>
				</div>
			</div>
			<slot name="after-content"></slot>
		</div>
	`
	};

	exports.MenuItem = MenuItem;
	exports.MenuItemIcon = MenuItemIcon;
	exports.MessengerMenu = MessengerMenu;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
