/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, main_core_events, main_popup, ui_system_typography, im_v2_application_core, im_v2_const, im_v2_lib_analytics, im_v2_lib_promo) {
	'use strict';

	const COPILOT_ITEM_ID = 'copilot';
	const MORE_MENU_SHOW_EVENT = 'BX.Main.InterfaceButtons:onMoreMenuShow';
	const ARROW_HALF_WIDTH = 18;
	class BitrixGptAgentPromo {
		static #current = null;
		static show(options = {}) {
			BitrixGptAgentPromo.#current = new BitrixGptAgentPromo(options);
			BitrixGptAgentPromo.#current.#show();
		}
		static close() {
			BitrixGptAgentPromo.#current?.close();
		}
		#options;
		#menu;
		#bindElement;
		#interactionHandler;
		#popup;
		#moreMenuShowHandler = null;
		constructor(options) {
			this.#options = options;
			this.#menu = BitrixGptAgentPromo.#resolveTopMenu();
			this.#bindElement = BitrixGptAgentPromo.#resolveBindElement();
			this.#interactionHandler = () => {
				im_v2_lib_analytics.Analytics.getInstance().bitrixGptAgentPromo.onButtonClick();
				this.close();
			};
			this.#popup = new main_popup.Popup(this.#getPopupConfig());
		}
		close() {
			this.#popup.destroy();
		}
		#show() {
			this.#popup.show();
			this.#alignAngleToBindElement();
		}
		#getPopupConfig() {
			const bindElement = this.#bindElement;
			return {
				id: 'im-bitrix-gpt-agent-promo',
				className: 'bx-im-bitrix-gpt-agent-promo__scope',
				content: BitrixGptAgentPromo.#getContent(),
				designSystemContext: '--ui-context-content-dark',
				width: 440,
				closeIcon: {
					top: '4px',
					right: '4px'
				},
				autoHide: false,
				closeByEsc: true,
				animation: 'fading',
				overlay: false,
				padding: 0,
				background: 'var(--ui-color-accent-soft-element-blue)',
				borderRadius: '16px',
				bindElement,
				cacheable: false,
				bindOptions: {
					position: 'top'
				},
				angle: bindElement ? {
					offset: 0
				} : undefined,
				offsetTop: -12,
				events: {
					onAfterPopupShow: () => {
						this.#trackInteractions();
						im_v2_lib_analytics.Analytics.getInstance().bitrixGptAgentPromo.onBannerView();
						void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(im_v2_const.PromoId.bitrixGptAgent);
					},
					onPopupClose: () => {
						im_v2_lib_analytics.Analytics.getInstance().bitrixGptAgentPromo.onBannerClose();
					},
					onPopupDestroy: () => {
						this.#untrackInteractions();
						if (BitrixGptAgentPromo.#current === this) {
							BitrixGptAgentPromo.#current = null;
						}
						if (main_core.Type.isFunction(this.#options.onClose)) {
							this.#options.onClose();
						}
					}
				}
			};
		}
		static #getContent() {
			const titleText = main_core.Loc.getMessage('IM_ELEMENTS_BITRIX_GPT_AGENT_PROMO_TITLE', {
				'#COPILOT_AGENT_NAME#': im_v2_application_core.Core.getStore().getters['copilot/getAgentName']
			});
			const title = ui_system_typography.Headline.render(titleText ?? '', {
				size: 'sm',
				className: 'bx-im-bitrix-gpt-agent-promo__title'
			});
			const text = ui_system_typography.Text.render(main_core.Loc.getMessage('IM_ELEMENTS_BITRIX_GPT_AGENT_PROMO_TEXT') ?? '', {
				size: 'md',
				className: 'bx-im-bitrix-gpt-agent-promo__text'
			});
			return main_core.Tag.render`
			<div class="bx-im-bitrix-gpt-agent-promo__container">
				<div class="bx-im-bitrix-gpt-agent-promo__image"></div>
				<div class="bx-im-bitrix-gpt-agent-promo__content">
					${title}
					${text}
				</div>
			</div>
		`;
		}
		#alignAngleToBindElement() {
			if (!this.#bindElement) {
				return;
			}
			const bindRect = this.#bindElement.getBoundingClientRect();
			const popupRect = this.#popup.getPopupContainer().getBoundingClientRect();
			const offset = Math.round(bindRect.left + bindRect.width / 2 - popupRect.left - ARROW_HALF_WIDTH);
			this.#popup.setAngle({
				offset
			});
		}
		#trackInteractions() {
			if (!this.#menu || !this.#bindElement) {
				return;
			}
			if (this.#isBoundToMoreButton()) {
				this.#moreMenuShowHandler = () => {
					im_v2_lib_analytics.Analytics.getInstance().bitrixGptAgentPromo.onButtonClick();
					this.close();
				};
				main_core_events.EventEmitter.subscribe(this.#menu, MORE_MENU_SHOW_EVENT, this.#moreMenuShowHandler);
				return;
			}
			main_core.Event.bind(this.#bindElement, 'click', this.#interactionHandler);
		}
		#untrackInteractions() {
			if (this.#isBoundToMoreButton()) {
				if (this.#menu && this.#moreMenuShowHandler) {
					main_core_events.EventEmitter.unsubscribe(this.#menu, MORE_MENU_SHOW_EVENT, this.#moreMenuShowHandler);
				}
				return;
			}
			if (this.#bindElement) {
				main_core.Event.unbind(this.#bindElement, 'click', this.#interactionHandler);
			}
		}
		#isBoundToMoreButton() {
			return this.#bindElement !== null && this.#menu !== null && this.#bindElement === (this.#menu.getMoreButton?.() ?? null);
		}
		static #resolveTopMenu() {
			const menuManager = main_core.Reflection.getClass('BX.Main.interfaceButtonsManager');
			return menuManager?.getById('chat-menu') ?? menuManager?.getById('top_menu_id_collaboration') ?? null;
		}
		static #resolveBindElement() {
			const menu = BitrixGptAgentPromo.#resolveTopMenu();
			if (!menu) {
				return null;
			}
			const moreButton = menu.getMoreButton() ?? null;
			const copilotItem = menu.getItemById(COPILOT_ITEM_ID);
			if (!copilotItem) {
				return moreButton;
			}
			const isUsable = menu.isVisibleItem(copilotItem) && copilotItem.offsetParent !== null;
			return isUsable ? copilotItem : moreButton;
		}
	}

	exports.BitrixGptAgentPromo = BitrixGptAgentPromo;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX, BX.Event, BX.Main, BX.UI.System.Typography, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=bitrix-gpt-agent-promo.bundle.js.map
