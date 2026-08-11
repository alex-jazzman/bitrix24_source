import { Event, Loc, Tag, Type, Reflection } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup, type PopupOptions } from 'main.popup';
import { Headline, Text } from 'ui.system.typography';

import { Core } from 'im.v2.application.core';
import { PromoId } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { PromoManager } from 'im.v2.lib.promo';

import './css/bitrix-gpt-agent-promo.css';

const COPILOT_ITEM_ID = 'copilot';
const MORE_MENU_SHOW_EVENT = 'BX.Main.InterfaceButtons:onMoreMenuShow';
const ARROW_HALF_WIDTH = 18;

export type BitrixGptAgentPromoOptions = {
	onClose?: () => void;
};

export class BitrixGptAgentPromo
{
	static #current: BitrixGptAgentPromo | null = null;

	static show(options: BitrixGptAgentPromoOptions = {}): void
	{
		BitrixGptAgentPromo.#current = new BitrixGptAgentPromo(options);
		BitrixGptAgentPromo.#current.#show();
	}

	static close(): void
	{
		BitrixGptAgentPromo.#current?.close();
	}

	#options: BitrixGptAgentPromoOptions;
	#menu: any | null;
	#bindElement: HTMLElement | null;
	#interactionHandler: () => void;
	#popup: Popup;
	#moreMenuShowHandler: (() => void) | null = null;

	constructor(options: BitrixGptAgentPromoOptions)
	{
		this.#options = options;
		this.#menu = BitrixGptAgentPromo.#resolveTopMenu();
		this.#bindElement = BitrixGptAgentPromo.#resolveBindElement();
		this.#interactionHandler = () => {
			Analytics.getInstance().bitrixGptAgentPromo.onButtonClick();
			this.close();
		};
		this.#popup = new Popup(this.#getPopupConfig());
	}

	close(): void
	{
		this.#popup.destroy();
	}

	#show(): void
	{
		this.#popup.show();
		this.#alignAngleToBindElement();
	}

	#getPopupConfig(): PopupOptions
	{
		const bindElement = this.#bindElement;

		return {
			id: 'im-bitrix-gpt-agent-promo',
			className: 'bx-im-bitrix-gpt-agent-promo__scope',
			content: BitrixGptAgentPromo.#getContent(),
			designSystemContext: '--ui-context-content-dark',
			width: 440,
			// @ts-expect-error: main.popup types declare closeIcon as boolean, but runtime accepts a style object too.
			closeIcon: { top: '4px', right: '4px' },
			autoHide: false,
			closeByEsc: true,
			animation: 'fading',
			overlay: false,
			padding: 0,
			background: 'var(--ui-color-accent-soft-element-blue)',
			borderRadius: '16px',
			bindElement,
			cacheable: false,
			bindOptions: { position: 'top' },
			angle: bindElement ? { offset: 0 } : undefined,
			offsetTop: -12,
			events: {
				onAfterPopupShow: () => {
					this.#trackInteractions();
					Analytics.getInstance().bitrixGptAgentPromo.onBannerView();
					void PromoManager.getInstance().markAsWatched(PromoId.bitrixGptAgent);
				},
				onPopupClose: () => {
					Analytics.getInstance().bitrixGptAgentPromo.onBannerClose();
				},
				onPopupDestroy: () => {
					this.#untrackInteractions();
					if (BitrixGptAgentPromo.#current === this)
					{
						BitrixGptAgentPromo.#current = null;
					}

					if (Type.isFunction(this.#options.onClose))
					{
						this.#options.onClose();
					}
				},
			},
		};
	}

	static #getContent(): HTMLElement
	{
		const titleText = Loc.getMessage('IM_ELEMENTS_BITRIX_GPT_AGENT_PROMO_TITLE', {
			'#COPILOT_AGENT_NAME#': Core.getStore().getters['copilot/getAgentName'],
		});

		const title = Headline.render(titleText ?? '', {
			size: 'sm',
			className: 'bx-im-bitrix-gpt-agent-promo__title',
		});

		const text = Text.render(Loc.getMessage('IM_ELEMENTS_BITRIX_GPT_AGENT_PROMO_TEXT') ?? '', {
			size: 'md',
			className: 'bx-im-bitrix-gpt-agent-promo__text',
		});

		return Tag.render`
			<div class="bx-im-bitrix-gpt-agent-promo__container">
				<div class="bx-im-bitrix-gpt-agent-promo__image"></div>
				<div class="bx-im-bitrix-gpt-agent-promo__content">
					${title}
					${text}
				</div>
			</div>
		`;
	}

	#alignAngleToBindElement(): void
	{
		if (!this.#bindElement)
		{
			return;
		}

		const bindRect = this.#bindElement.getBoundingClientRect();
		const popupRect = this.#popup.getPopupContainer().getBoundingClientRect();
		const offset = Math.round(bindRect.left + bindRect.width / 2 - popupRect.left - ARROW_HALF_WIDTH);

		this.#popup.setAngle({ offset });
	}

	#trackInteractions(): void
	{
		if (!this.#menu || !this.#bindElement)
		{
			return;
		}

		if (this.#isBoundToMoreButton())
		{
			this.#moreMenuShowHandler = () => {
				Analytics.getInstance().bitrixGptAgentPromo.onButtonClick();
				this.close();
			};
			EventEmitter.subscribe(this.#menu, MORE_MENU_SHOW_EVENT, this.#moreMenuShowHandler);

			return;
		}

		Event.bind(this.#bindElement, 'click', this.#interactionHandler);
	}

	#untrackInteractions(): void
	{
		if (this.#isBoundToMoreButton())
		{
			if (this.#menu && this.#moreMenuShowHandler)
			{
				EventEmitter.unsubscribe(this.#menu, MORE_MENU_SHOW_EVENT, this.#moreMenuShowHandler);
			}

			return;
		}

		if (this.#bindElement)
		{
			Event.unbind(this.#bindElement, 'click', this.#interactionHandler);
		}
	}

	#isBoundToMoreButton(): boolean
	{
		return this.#bindElement !== null
			&& this.#menu !== null
			&& this.#bindElement === (this.#menu.getMoreButton?.() ?? null);
	}

	static #resolveTopMenu(): any
	{
		const menuManager: any = Reflection.getClass('BX.Main.interfaceButtonsManager');

		return menuManager?.getById('chat-menu') ?? menuManager?.getById('top_menu_id_collaboration') ?? null;
	}

	static #resolveBindElement(): HTMLElement | null
	{
		const menu = BitrixGptAgentPromo.#resolveTopMenu();
		if (!menu)
		{
			return null;
		}

		const moreButton = menu.getMoreButton() ?? null;
		const copilotItem = menu.getItemById(COPILOT_ITEM_ID);
		if (!copilotItem)
		{
			return moreButton;
		}

		const isUsable = menu.isVisibleItem(copilotItem) && copilotItem.offsetParent !== null;

		return isUsable ? copilotItem : moreButton;
	}
}
