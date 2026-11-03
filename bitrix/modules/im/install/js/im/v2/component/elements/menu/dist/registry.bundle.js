/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_popup, im_v2_lib_utils, im_v2_component_elements_popup, ui_iconSet_api_vue, im_v2_lib_feature, im_v2_lib_counter) {
	'use strict';

	const ID_PREFIX = 'im-v2-menu';

	// Match ui.system.menu: each item is its own Tab stop, so the menu navigates with Tab
	// (no arrow-key roving). This selector locates the first item to seed focus on open.
	const FOCUSABLE_ITEM_SELECTOR = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

			// Non-reactive handles: DOM/popup references must not live in reactive state.
			this.openerElement = null;
			this.onPopupAfterShow = null;
		},
		mounted() {
			// The popup (child) mounts first, so the container is already in the DOM here.
			// Capture the opener before moving focus inside, then seed focus on the first item.
			this.openerElement = document.activeElement;

			// The popup show animation keeps items at opacity 0 for a frame. A direct focus()
			// still lands there, but if the container is not focusable yet, retry once shown.
			if (!this.focusFirstItem()) {
				this.subscribeOnPopupShown();
			}
		},
		beforeUnmount() {
			// Runs before the child popup unmounts, so the container DOM is still present.
			const popup = main_popup.PopupManager.getPopupById(this.id);
			if (popup && this.onPopupAfterShow) {
				popup.unsubscribe('onAfterShow', this.onPopupAfterShow);
			}
			this.returnFocusToOpener();
		},
		methods: {
			focusFirstItem() {
				const container = this.$refs.container;
				const firstItem = container?.querySelector(FOCUSABLE_ITEM_SELECTOR) ?? null;
				firstItem?.focus({
					preventScroll: true
				});

				// Confirm focus actually moved inside (it will not while the popup stays hidden).
				return Boolean(container?.contains(document.activeElement));
			},
			subscribeOnPopupShown() {
				const popup = main_popup.PopupManager.getPopupById(this.id);
				if (!popup) {
					return;
				}
				this.onPopupAfterShow = () => {
					this.focusFirstItem();
				};
				popup.subscribe('onAfterShow', this.onPopupAfterShow);
			},
			returnFocusToOpener() {
				// With an active focus trap the popup restores focus to the opener itself on close,
				// so restoring here as well would move focus twice. The trap is opt-in
				// (useFocusTrapInDialogs) and off by default in production, where we restore it.
				const focusTrap = main_popup.PopupManager.getPopupById(this.id)?.getFocusTrap() ?? null;
				if (focusTrap !== null) {
					return;
				}

				// Only restore when focus still lives inside the menu (it would be lost on unmount).
				// If the user moved focus elsewhere - clicked outside, or activated an item that
				// navigated away - leave it where it is.
				const container = this.$refs.container;
				if (container?.contains(document.activeElement) && this.openerElement) {
					this.openerElement.focus({
						preventScroll: true
					});
				}
			}
		},
		template: `
		<MessengerPopup
			:config="config"
			@close="$emit('close')"
			:id="id"
		>
			<div class="bx-im-menu__container" :class="className" ref="container">
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
		lock: 'lock',
		folder: 'folder'
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
			},
			// When the after-content slot holds its own interactive control (e.g. the Copilot role
			// button), the button role moves from the container to the inner content. That keeps the
			// slotted control a sibling of the button instead of nested inside it (nested interactive
			// controls fail axe). Off by default, so every other menu item is unchanged.
			hasInteractiveAfterContent: {
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
		methods: {
			handleActivationKeydown(event) {
				// Only the item itself reacts; keydowns bubbling up from nested focusable controls
				// (e.g. the Copilot role button) are handled by those controls, not the item.
				if (event.target !== event.currentTarget) {
					return;
				}
				if (event.key === 'Enter' || event.key === ' ') {
					// Synthesize the same native click the mouse path uses: the parent binds @click,
					// which falls through to this root element, so keyboard and mouse share one handler.
					event.preventDefault();
					this.$el.click();
				}
			},
			onContentKeydown(event) {
				// The content is the button only when it holds interactive after-content; otherwise the
				// container is the button and this keydown must stay inert.
				if (!this.hasInteractiveAfterContent) {
					return;
				}
				this.handleActivationKeydown(event);
			}
		},
		template: `
		<div
			class="bx-im-menu-item__container"
			:class="[containerClasses, { '--focus-visible': !hasInteractiveAfterContent }]"
			:role="hasInteractiveAfterContent ? null : 'button'"
			:tabindex="hasInteractiveAfterContent ? null : 0"
			@keydown="handleActivationKeydown"
		>
			<div
				class="bx-im-menu-item__content"
				:class="[{'--with-icon': !!preparedIcon}, { '--focus-visible': hasInteractiveAfterContent }]"
				:role="hasInteractiveAfterContent ? 'button' : null"
				:tabindex="hasInteractiveAfterContent ? 0 : null"
				@keydown="onContentKeydown"
			>
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

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX.Main, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.UI.IconSet, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
