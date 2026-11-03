import {Event, Cache, Dom, Loc, Type} from 'main.core';
import {SliderHacks} from 'landing.sliderhacks';

const onEditButtonClick = Symbol('onEditButtonClick');
const onBackButtonClick = Symbol('onBackButtonClick');
const onForwardButtonClick = Symbol('onForwardButtonClick');
const onCopyLinkButtonClick = Symbol('onCopyLinkButtonClick');
const onUniqueViewIconClick = Symbol('onUniqueViewIconClick');
const onUniqueViewKeydown = Symbol('onUniqueViewKeydown');
const onUniqueViewPointerEnter = Symbol('onUniqueViewPointerEnter');
const onUniqueViewPointerLeave = Symbol('onUniqueViewPointerLeave');
const onUniqueViewFocusOut = Symbol('onUniqueViewFocusOut');
const onDocumentClick = Symbol('onDocumentClick');

export class TopPanel
{
	static cache = new Cache.MemoryCache();

	constructor(data)
	{
		this.userData = data.userData;

		Event.bind(TopPanel.getEditButton(), 'click', this[onEditButtonClick]);
		Event.bind(TopPanel.getBackButton(), 'click', this[onBackButtonClick]);
		Event.bind(TopPanel.getForwardButton(), 'click', this[onForwardButtonClick]);
		Event.bind(TopPanel.getCopyLinkButton(), 'click', this[onCopyLinkButtonClick]);
		Event.bind(TopPanel.getUniqueViewIcon(), 'click', this[onUniqueViewIconClick]);
		Event.bind(TopPanel.getUniqueViewIcon(), 'pointerenter', this[onUniqueViewPointerEnter]);
		Event.bind(TopPanel.getUniqueViewIcon(), 'pointerleave', this[onUniqueViewPointerLeave]);
		Event.bind(TopPanel.getUniqueViewIcon(), 'focusout', this[onUniqueViewFocusOut]);
		Event.bind(TopPanel.getUniqueViewPopup(), 'pointerenter', this[onUniqueViewPointerEnter]);
		Event.bind(TopPanel.getUniqueViewPopup(), 'pointerleave', this[onUniqueViewPointerLeave]);
		Event.bind(TopPanel.getUniqueViewPopup(), 'focusout', this[onUniqueViewFocusOut]);

		TopPanel.pushHistory(window.location.toString());
		TopPanel.checkNavButtonsActivity();
		TopPanel.checkHints();
		TopPanel.initUniqueViewPopup(this.userData);
	}

	static getLayout(): HTMLDivElement
	{
		return TopPanel.cache.remember('layout', () => {
			return document.querySelector('.landing-pub-top-panel');
		});
	}

	static getEditButton(): HTMLAnchorElement
	{
		return TopPanel.cache.remember('editButton', () => {
			return TopPanel.getLayout().querySelector('.landing-pub-top-panel-edit-button');
		});
	}

	[onEditButtonClick](event)
	{
		event.preventDefault();

		const href = Dom.attr(event.currentTarget, 'href');
		const landingId = Dom.attr(event.currentTarget, 'data-landingId');

		if (Type.isString(href) && href !== '')
		{
			TopPanel.openSlider(href, landingId);
		}
	}

	static openSlider(url, landingId)
	{
		BX.SidePanel.Instance.open(url, {
			cacheable: false,
			customLeftBoundary: 60,
			allowChangeHistory: false,
			events: {
				onClose() {
					void SliderHacks.reloadSlider(
						window.location.toString().split('#')[0] + '#landingId' + landingId
					);
				},
			},
		});
	}

	// HISTORY save
	static history = [];
	static historyState;

	static pushHistory(url)
	{
		if (!Type.isNumber(TopPanel.historyState))
		{
			TopPanel.historyState = -1; // will increase later
		}

		if (TopPanel.historyState < TopPanel.history.length - 1)
		{
			TopPanel.history.splice(TopPanel.historyState + 1);
		}

		TopPanel.history.push(url);
		TopPanel.historyState++;
	}

	static checkNavButtonsActivity()
	{
		Dom.removeClass(TopPanel.getForwardButton(), 'ui-btn-disabled');
		Dom.removeClass(TopPanel.getBackButton(), 'ui-btn-disabled');

		if (
			!Type.isArrayFilled(TopPanel.history)
			|| !Type.isNumber(TopPanel.historyState)
			|| TopPanel.history.length === 1
		)
		{
			Dom.addClass(TopPanel.getForwardButton(), 'ui-btn-disabled');
			Dom.addClass(TopPanel.getBackButton(), 'ui-btn-disabled');
			return;
		}

		if (TopPanel.historyState === 0)
		{
			Dom.addClass(TopPanel.getBackButton(), 'ui-btn-disabled');
		}

		if (TopPanel.historyState >= TopPanel.history.length - 1)
		{
			Dom.addClass(TopPanel.getForwardButton(), 'ui-btn-disabled');
		}
	}

	static getBackButton(): HTMLAnchorElement
	{
		return TopPanel.cache.remember('backButton', () => {
			const layout = TopPanel.getLayout();
			return layout ? layout.querySelector('.landing-pub-top-panel-back') : null;
		});
	}

	static getForwardButton(): HTMLAnchorElement
	{
		return TopPanel.cache.remember('forwardButton', () => {
			const layout = TopPanel.getLayout();
			return layout ? layout.querySelector('.landing-pub-top-panel-forward') : null;
		});
	}

	static getCopyLinkButton(): HTMLAnchorElement
	{
		return TopPanel.cache.remember('copyLinkButton', () => {
			const layout = TopPanel.getLayout();
			return layout ? layout.querySelector('.landing-page-link-btn') : null;
		});
	}

	static getUniqueViewIcon(): HTMLAnchorElement
	{
		return TopPanel.cache.remember('uniqueViewIcon', () => {
			const layout = TopPanel.getLayout();
			return layout ? layout.querySelector('.landing-pub-top-panel-unique-view') : null;
		});
	}

	static getUniqueViewPopup(): HTMLDivElement
	{
		return TopPanel.cache.remember('uniqueViewPopup', () => {
			const layout = TopPanel.getLayout();
			return layout ? layout.querySelector('.landing-pub-top-panel-unique-view-popup') : null;
		});
	}

	// A popup opened by a click, a tap or the keyboard, as opposed to one the pointer merely hovers
	// open: only the first kind is closed by the next click on the button and survives the pointer.
	static uniqueViewPopupPinned = false;

	static isUniqueViewPopupShown(): boolean
	{
		const popup = TopPanel.getUniqueViewPopup();

		return popup !== null && !Dom.hasClass(popup, 'hide');
	}

	static isInsideUniqueView(node): boolean
	{
		const icon = TopPanel.getUniqueViewIcon();
		const popup = TopPanel.getUniqueViewPopup();

		return (
			(icon !== null && icon.contains(node))
			|| (popup !== null && popup.contains(node))
		);
	}

	static showUniqueViewPopup()
	{
		if (TopPanel.getUniqueViewPopup() === null || TopPanel.isUniqueViewPopupShown())
		{
			return;
		}

		Dom.removeClass(TopPanel.getUniqueViewPopup(), 'hide');
		Dom.attr(TopPanel.getUniqueViewIcon(), 'aria-expanded', 'true');

		// Both listeners live as long as the popup does. Escape has to reach it from wherever the
		// focus is, because the pointer opens the popup without moving the focus at all, and the
		// capture phase keeps a block of the site from swallowing the way out of the popup.
		Event.bind(document, 'keydown', TopPanel[onUniqueViewKeydown], true);
		Event.bind(document, 'click', TopPanel[onDocumentClick], true);
	}

	static hideUniqueViewPopup()
	{
		TopPanel.uniqueViewPopupPinned = false;

		if (!TopPanel.isUniqueViewPopupShown())
		{
			return;
		}

		Dom.addClass(TopPanel.getUniqueViewPopup(), 'hide');
		Dom.attr(TopPanel.getUniqueViewIcon(), 'aria-expanded', 'false');

		Event.unbind(document, 'keydown', TopPanel[onUniqueViewKeydown], true);
		Event.unbind(document, 'click', TopPanel[onDocumentClick], true);
	}

	static checkHints()
	{
		const linkPage = document.querySelector('.landing-pub-top-panel-chain-link-page');
		if (linkPage)
		{
			if (parseInt(window.getComputedStyle(linkPage).width) < 200)
			{
				Dom.style(linkPage, 'pointer-events', 'none');
			}
			else
			{
				BX.UI.Hint.init(BX('landing-pub-top-panel-chain-link-page'));
			}
		}
	}

	static initUniqueViewPopup(userData)
	{
		const setUserId = userData.id;
		const setUserName = userData.name;
		const avatar = userData.avatar;

		if (setUserId.length === setUserName.length){
			for (let i = 0; i < setUserId.length; i++)
			{
				this.createUserItem(setUserId[i], setUserName[i], avatar[i]);
			}
		}
	}

	static createUserItem(id, name, avatar)
	{
		const itemContainer = document.querySelector('.landing-pub-top-panel-unique-view-popup-item-container');
		const userUrl = window.location.origin + '/company/personal/user/' + id + '/';
		const userItem = BX.Dom.create({
			tag: 'div',
			props: {
				classList: 'landing-pub-top-panel-unique-view-popup-item',
			},
		});
		let userItemAvatar;
		if (avatar && avatar !== '')
		{
			userItemAvatar = BX.Dom.create({
				tag: 'div',
				props: {
					classList: 'landing-pub-top-panel-unique-view-popup-item-avatar',
				},
			});
			avatar = "url('" + avatar + "')";
			Dom.style(userItemAvatar, 'background-image', avatar);
		}
		else
		{
			userItemAvatar = BX.Dom.create({
				tag: 'div',
				props: {
					classList: 'landing-pub-top-panel-unique-view-popup-item-avatar landing-pub-top-panel-unique-view-popup-item-avatar-empty',
				},
			});
		}
		const userItemLink = BX.Dom.create({
			tag: 'a',
			props: {
				classList: 'landing-pub-top-panel-unique-view-popup-item-link',
			},
			text: name,
		});
		Dom.attr(userItemLink, 'href', userUrl);
		Dom.attr(userItemLink, 'target', '_blank');
		Dom.append(userItemAvatar, userItem);
		Dom.append(userItemLink, userItem);
		Dom.append(userItem, itemContainer);
	}

	[onCopyLinkButtonClick](event)
	{
		event.preventDefault();
		const link = BX.util.remove_url_param(window.location.href, ["IFRAME", "IFRAME_TYPE"]);
		const node = event.target;
		if (BX.clipboard.isCopySupported())
		{
			BX.clipboard.copy(link);
			this.timeoutIds = this.timeoutIds || [];
			const popupParams = {
				content: Loc.getMessage('LANDING_TPL_PUB_COPIED_LINK'),
				darkMode: true,
				autoHide: true,
				zIndex: 1000,
				angle: true,
				offsetLeft: 20,
				bindOptions: {
					position: 'top'
				}
			};
			const popup = new BX.PopupWindow(
				'landing_clipboard_copy',
				node,
				popupParams
			);
			popup.show();

			let timeoutId;
			while (timeoutId = this.timeoutIds.pop())
			{
				clearTimeout(timeoutId);
			}
			timeoutId = setTimeout(function(){
				popup.close();
			}, 2000);
			this.timeoutIds.push(timeoutId);
		}
	}

	[onUniqueViewIconClick]()
	{
		if (TopPanel.uniqueViewPopupPinned)
		{
			TopPanel.hideUniqueViewPopup();
			return;
		}

		// A popup the pointer holds open is taken over here instead of being closed: a tap reaches
		// the button as a hover first, and closing it would leave the tap without a visible result.
		TopPanel.uniqueViewPopupPinned = true;
		TopPanel.showUniqueViewPopup();
	}

	static [onUniqueViewKeydown](event)
	{
		if (event.key !== 'Escape' || !TopPanel.isUniqueViewPopupShown())
		{
			return;
		}

		// The page is opened inside a slider, which closes on the same key.
		event.preventDefault();
		event.stopPropagation();

		const icon = TopPanel.getUniqueViewIcon();
		// A popup opened by the pointer leaves the focus where the visitor put it.
		const takesTheFocusBack = TopPanel.isInsideUniqueView(document.activeElement);

		TopPanel.hideUniqueViewPopup();

		if (takesTheFocusBack && icon !== null)
		{
			icon.focus();
		}
	}

	[onUniqueViewPointerEnter](event)
	{
		// A touch reports itself as a hover as well, and there the popup belongs to the tap alone.
		if (event.pointerType !== 'mouse')
		{
			return;
		}

		TopPanel.showUniqueViewPopup();
	}

	[onUniqueViewPointerLeave](event)
	{
		// The pointer takes away only what it brought: a pinned popup stays, and so does one the
		// focus is inside.
		if (
			event.pointerType !== 'mouse'
			|| TopPanel.uniqueViewPopupPinned
			|| TopPanel.isInsideUniqueView(event.relatedTarget)
			|| TopPanel.isInsideUniqueView(document.activeElement)
		)
		{
			return;
		}

		TopPanel.hideUniqueViewPopup();
	}

	[onUniqueViewFocusOut](event)
	{
		if (TopPanel.isInsideUniqueView(event.relatedTarget))
		{
			return;
		}

		TopPanel.hideUniqueViewPopup();
	}

	static [onDocumentClick](event)
	{
		if (TopPanel.isInsideUniqueView(event.target))
		{
			return;
		}

		TopPanel.hideUniqueViewPopup();
	}

	[onBackButtonClick](event)
	{
		event.preventDefault();
		if (
			Type.isArrayFilled(TopPanel.history)
			&& Type.isNumber(TopPanel.historyState)
			&& TopPanel.historyState > 0
		)
		{
			void SliderHacks.reloadSlider(TopPanel.history[--TopPanel.historyState]);
			TopPanel.checkNavButtonsActivity();
		}
	}

	[onForwardButtonClick](event)
	{
		event.preventDefault();

		if (
			Type.isArrayFilled(TopPanel.history)
			&& Type.isNumber(TopPanel.historyState)
			&& (TopPanel.historyState < TopPanel.history.length - 1)
		)
		{
			void SliderHacks.reloadSlider(TopPanel.history[++TopPanel.historyState]);
			TopPanel.checkNavButtonsActivity();
		}
	}
}