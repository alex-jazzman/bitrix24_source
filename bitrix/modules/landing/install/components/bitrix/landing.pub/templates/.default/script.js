/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core, landing_sliderhacks) {
	'use strict';

	class DiskFile {
		/**
		 * Constructor.
		 */
		constructor() {
			document.addEventListener('click', this.onClick.bind(this));
		}

		/**
		 * Click callback.
		 *
		 * @return {void}
		 */
		onClick(event) {
			let target = event.target;
			let href = target.getAttribute('href') || target.getAttribute('data-pseudo-url') && JSON.parse(target.getAttribute('data-pseudo-url')).href;
			if (!href) {
				const parentNode = target.parentNode;
				if (parentNode.nodeName === 'A') {
					href = parentNode.getAttribute('href');
					target = parentNode;
				} else {
					const grandParentNode = parentNode.parentNode;
					if (grandParentNode.nodeName === 'A') {
						href = grandParentNode.getAttribute('href');
						target = grandParentNode;
					}
				}
			}
			if (target.getAttribute('data-viewer-type')) {
				return;
			}
			if (href && href.indexOf('/bitrix/services/main/ajax.php?action=landing.api.diskFile.download') === 0) {
				BX.ajax.get(href.replace('landing.api.diskFile.download', 'landing.api.diskFile.view'), function (data) {
					if (typeof data === 'string') {
						data = JSON.parse(data);
					}
					if (!data.data) {
						return;
					}
					Object.keys(data.data).map(key => {
						target.setAttribute(key, data.data[key]);
					});
					target.click();
				});
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
		}
	}

	class SearchResult {
		/**
		 * Constructor.
		 */
		constructor() {
			this.prepareSearchInput();
			this.scrollToFirstBlock();
		}

		/**
		 * Prepare the search input field by populating it with the 'q' parameter value from the URL.
		 * @return {void}
		 */
		prepareSearchInput() {
			const params = new URLSearchParams(window.location.search);
			const qValue = params.get('q');
			const element = document.querySelector('[name="q"]');
			if (element && qValue) {
				element.value = qValue;
			}
		}

		/**
		 * Finds first highlight word and scroll to it.
		 * @return {void}
		 */
		scrollToFirstBlock() {
			var result = document.querySelector('.landing-highlight');
			if (result) {
				var parent = result.parentNode;
				while (parent) {
					if (parent.classList.contains('block-wrapper')) {
						window.scrollTo({
							top: parent.offsetTop,
							behavior: 'smooth'
						});
						break;
					}
					parent = parent.parentNode;
				}
			}
		}
	}

	class TimeStamp {
		/**
		 * Constructor.
		 */
		constructor() {
			this.removeTimestamp();
		}

		/**
		 * Removes 'ts' param from query string.
		 * @return {void}
		 */
		removeTimestamp() {
			let uri = window.location.toString();
			uri = uri.replace(/(ts=[\d]+[&]*)/, '');
			if (uri.slice(-1) === '?' || uri.slice(-1) === '&') {
				uri = uri.slice(0, -1);
			}
			window.history.replaceState({}, document.title, uri);
		}
	}

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
	class TopPanel {
		static cache = new main_core.Cache.MemoryCache();
		constructor(data) {
			this.userData = data.userData;
			main_core.Event.bind(TopPanel.getEditButton(), 'click', this[onEditButtonClick]);
			main_core.Event.bind(TopPanel.getBackButton(), 'click', this[onBackButtonClick]);
			main_core.Event.bind(TopPanel.getForwardButton(), 'click', this[onForwardButtonClick]);
			main_core.Event.bind(TopPanel.getCopyLinkButton(), 'click', this[onCopyLinkButtonClick]);
			main_core.Event.bind(TopPanel.getUniqueViewIcon(), 'click', this[onUniqueViewIconClick]);
			main_core.Event.bind(TopPanel.getUniqueViewIcon(), 'pointerenter', this[onUniqueViewPointerEnter]);
			main_core.Event.bind(TopPanel.getUniqueViewIcon(), 'pointerleave', this[onUniqueViewPointerLeave]);
			main_core.Event.bind(TopPanel.getUniqueViewIcon(), 'focusout', this[onUniqueViewFocusOut]);
			main_core.Event.bind(TopPanel.getUniqueViewPopup(), 'pointerenter', this[onUniqueViewPointerEnter]);
			main_core.Event.bind(TopPanel.getUniqueViewPopup(), 'pointerleave', this[onUniqueViewPointerLeave]);
			main_core.Event.bind(TopPanel.getUniqueViewPopup(), 'focusout', this[onUniqueViewFocusOut]);
			TopPanel.pushHistory(window.location.toString());
			TopPanel.checkNavButtonsActivity();
			TopPanel.checkHints();
			TopPanel.initUniqueViewPopup(this.userData);
		}
		static getLayout() {
			return TopPanel.cache.remember('layout', () => {
				return document.querySelector('.landing-pub-top-panel');
			});
		}
		static getEditButton() {
			return TopPanel.cache.remember('editButton', () => {
				return TopPanel.getLayout().querySelector('.landing-pub-top-panel-edit-button');
			});
		}
		[onEditButtonClick](event) {
			event.preventDefault();
			const href = main_core.Dom.attr(event.currentTarget, 'href');
			const landingId = main_core.Dom.attr(event.currentTarget, 'data-landingId');
			if (main_core.Type.isString(href) && href !== '') {
				TopPanel.openSlider(href, landingId);
			}
		}
		static openSlider(url, landingId) {
			BX.SidePanel.Instance.open(url, {
				cacheable: false,
				customLeftBoundary: 60,
				allowChangeHistory: false,
				events: {
					onClose() {
						void landing_sliderhacks.SliderHacks.reloadSlider(window.location.toString().split('#')[0] + '#landingId' + landingId);
					}
				}
			});
		}

		// HISTORY save
		static history = [];
		static pushHistory(url) {
			if (!main_core.Type.isNumber(TopPanel.historyState)) {
				TopPanel.historyState = -1; // will increase later
			}
			if (TopPanel.historyState < TopPanel.history.length - 1) {
				TopPanel.history.splice(TopPanel.historyState + 1);
			}
			TopPanel.history.push(url);
			TopPanel.historyState++;
		}
		static checkNavButtonsActivity() {
			main_core.Dom.removeClass(TopPanel.getForwardButton(), 'ui-btn-disabled');
			main_core.Dom.removeClass(TopPanel.getBackButton(), 'ui-btn-disabled');
			if (!main_core.Type.isArrayFilled(TopPanel.history) || !main_core.Type.isNumber(TopPanel.historyState) || TopPanel.history.length === 1) {
				main_core.Dom.addClass(TopPanel.getForwardButton(), 'ui-btn-disabled');
				main_core.Dom.addClass(TopPanel.getBackButton(), 'ui-btn-disabled');
				return;
			}
			if (TopPanel.historyState === 0) {
				main_core.Dom.addClass(TopPanel.getBackButton(), 'ui-btn-disabled');
			}
			if (TopPanel.historyState >= TopPanel.history.length - 1) {
				main_core.Dom.addClass(TopPanel.getForwardButton(), 'ui-btn-disabled');
			}
		}
		static getBackButton() {
			return TopPanel.cache.remember('backButton', () => {
				const layout = TopPanel.getLayout();
				return layout ? layout.querySelector('.landing-pub-top-panel-back') : null;
			});
		}
		static getForwardButton() {
			return TopPanel.cache.remember('forwardButton', () => {
				const layout = TopPanel.getLayout();
				return layout ? layout.querySelector('.landing-pub-top-panel-forward') : null;
			});
		}
		static getCopyLinkButton() {
			return TopPanel.cache.remember('copyLinkButton', () => {
				const layout = TopPanel.getLayout();
				return layout ? layout.querySelector('.landing-page-link-btn') : null;
			});
		}
		static getUniqueViewIcon() {
			return TopPanel.cache.remember('uniqueViewIcon', () => {
				const layout = TopPanel.getLayout();
				return layout ? layout.querySelector('.landing-pub-top-panel-unique-view') : null;
			});
		}
		static getUniqueViewPopup() {
			return TopPanel.cache.remember('uniqueViewPopup', () => {
				const layout = TopPanel.getLayout();
				return layout ? layout.querySelector('.landing-pub-top-panel-unique-view-popup') : null;
			});
		}

		// A popup opened by a click, a tap or the keyboard, as opposed to one the pointer merely hovers
		// open: only the first kind is closed by the next click on the button and survives the pointer.
		static uniqueViewPopupPinned = false;
		static isUniqueViewPopupShown() {
			const popup = TopPanel.getUniqueViewPopup();
			return popup !== null && !main_core.Dom.hasClass(popup, 'hide');
		}
		static isInsideUniqueView(node) {
			const icon = TopPanel.getUniqueViewIcon();
			const popup = TopPanel.getUniqueViewPopup();
			return icon !== null && icon.contains(node) || popup !== null && popup.contains(node);
		}
		static showUniqueViewPopup() {
			if (TopPanel.getUniqueViewPopup() === null || TopPanel.isUniqueViewPopupShown()) {
				return;
			}
			main_core.Dom.removeClass(TopPanel.getUniqueViewPopup(), 'hide');
			main_core.Dom.attr(TopPanel.getUniqueViewIcon(), 'aria-expanded', 'true');

			// Both listeners live as long as the popup does. Escape has to reach it from wherever the
			// focus is, because the pointer opens the popup without moving the focus at all, and the
			// capture phase keeps a block of the site from swallowing the way out of the popup.
			main_core.Event.bind(document, 'keydown', TopPanel[onUniqueViewKeydown], true);
			main_core.Event.bind(document, 'click', TopPanel[onDocumentClick], true);
		}
		static hideUniqueViewPopup() {
			TopPanel.uniqueViewPopupPinned = false;
			if (!TopPanel.isUniqueViewPopupShown()) {
				return;
			}
			main_core.Dom.addClass(TopPanel.getUniqueViewPopup(), 'hide');
			main_core.Dom.attr(TopPanel.getUniqueViewIcon(), 'aria-expanded', 'false');
			main_core.Event.unbind(document, 'keydown', TopPanel[onUniqueViewKeydown], true);
			main_core.Event.unbind(document, 'click', TopPanel[onDocumentClick], true);
		}
		static checkHints() {
			const linkPage = document.querySelector('.landing-pub-top-panel-chain-link-page');
			if (linkPage) {
				if (parseInt(window.getComputedStyle(linkPage).width) < 200) {
					main_core.Dom.style(linkPage, 'pointer-events', 'none');
				} else {
					BX.UI.Hint.init(BX('landing-pub-top-panel-chain-link-page'));
				}
			}
		}
		static initUniqueViewPopup(userData) {
			const setUserId = userData.id;
			const setUserName = userData.name;
			const avatar = userData.avatar;
			if (setUserId.length === setUserName.length) {
				for (let i = 0; i < setUserId.length; i++) {
					this.createUserItem(setUserId[i], setUserName[i], avatar[i]);
				}
			}
		}
		static createUserItem(id, name, avatar) {
			const itemContainer = document.querySelector('.landing-pub-top-panel-unique-view-popup-item-container');
			const userUrl = window.location.origin + '/company/personal/user/' + id + '/';
			const userItem = BX.Dom.create({
				tag: 'div',
				props: {
					classList: 'landing-pub-top-panel-unique-view-popup-item'
				}
			});
			let userItemAvatar;
			if (avatar && avatar !== '') {
				userItemAvatar = BX.Dom.create({
					tag: 'div',
					props: {
						classList: 'landing-pub-top-panel-unique-view-popup-item-avatar'
					}
				});
				avatar = "url('" + avatar + "')";
				main_core.Dom.style(userItemAvatar, 'background-image', avatar);
			} else {
				userItemAvatar = BX.Dom.create({
					tag: 'div',
					props: {
						classList: 'landing-pub-top-panel-unique-view-popup-item-avatar landing-pub-top-panel-unique-view-popup-item-avatar-empty'
					}
				});
			}
			const userItemLink = BX.Dom.create({
				tag: 'a',
				props: {
					classList: 'landing-pub-top-panel-unique-view-popup-item-link'
				},
				text: name
			});
			main_core.Dom.attr(userItemLink, 'href', userUrl);
			main_core.Dom.attr(userItemLink, 'target', '_blank');
			main_core.Dom.append(userItemAvatar, userItem);
			main_core.Dom.append(userItemLink, userItem);
			main_core.Dom.append(userItem, itemContainer);
		}
		[onCopyLinkButtonClick](event) {
			event.preventDefault();
			const link = BX.util.remove_url_param(window.location.href, ["IFRAME", "IFRAME_TYPE"]);
			const node = event.target;
			if (BX.clipboard.isCopySupported()) {
				BX.clipboard.copy(link);
				this.timeoutIds = this.timeoutIds || [];
				const popupParams = {
					content: main_core.Loc.getMessage('LANDING_TPL_PUB_COPIED_LINK'),
					darkMode: true,
					autoHide: true,
					zIndex: 1000,
					angle: true,
					offsetLeft: 20,
					bindOptions: {
						position: 'top'
					}
				};
				const popup = new BX.PopupWindow('landing_clipboard_copy', node, popupParams);
				popup.show();
				let timeoutId;
				while (timeoutId = this.timeoutIds.pop()) {
					clearTimeout(timeoutId);
				}
				timeoutId = setTimeout(function () {
					popup.close();
				}, 2000);
				this.timeoutIds.push(timeoutId);
			}
		}
		[onUniqueViewIconClick]() {
			if (TopPanel.uniqueViewPopupPinned) {
				TopPanel.hideUniqueViewPopup();
				return;
			}

			// A popup the pointer holds open is taken over here instead of being closed: a tap reaches
			// the button as a hover first, and closing it would leave the tap without a visible result.
			TopPanel.uniqueViewPopupPinned = true;
			TopPanel.showUniqueViewPopup();
		}
		static [onUniqueViewKeydown](event) {
			if (event.key !== 'Escape' || !TopPanel.isUniqueViewPopupShown()) {
				return;
			}

			// The page is opened inside a slider, which closes on the same key.
			event.preventDefault();
			event.stopPropagation();
			const icon = TopPanel.getUniqueViewIcon();
			// A popup opened by the pointer leaves the focus where the visitor put it.
			const takesTheFocusBack = TopPanel.isInsideUniqueView(document.activeElement);
			TopPanel.hideUniqueViewPopup();
			if (takesTheFocusBack && icon !== null) {
				icon.focus();
			}
		}
		[onUniqueViewPointerEnter](event) {
			// A touch reports itself as a hover as well, and there the popup belongs to the tap alone.
			if (event.pointerType !== 'mouse') {
				return;
			}
			TopPanel.showUniqueViewPopup();
		}
		[onUniqueViewPointerLeave](event) {
			// The pointer takes away only what it brought: a pinned popup stays, and so does one the
			// focus is inside.
			if (event.pointerType !== 'mouse' || TopPanel.uniqueViewPopupPinned || TopPanel.isInsideUniqueView(event.relatedTarget) || TopPanel.isInsideUniqueView(document.activeElement)) {
				return;
			}
			TopPanel.hideUniqueViewPopup();
		}
		[onUniqueViewFocusOut](event) {
			if (TopPanel.isInsideUniqueView(event.relatedTarget)) {
				return;
			}
			TopPanel.hideUniqueViewPopup();
		}
		static [onDocumentClick](event) {
			if (TopPanel.isInsideUniqueView(event.target)) {
				return;
			}
			TopPanel.hideUniqueViewPopup();
		}
		[onBackButtonClick](event) {
			event.preventDefault();
			if (main_core.Type.isArrayFilled(TopPanel.history) && main_core.Type.isNumber(TopPanel.historyState) && TopPanel.historyState > 0) {
				void landing_sliderhacks.SliderHacks.reloadSlider(TopPanel.history[--TopPanel.historyState]);
				TopPanel.checkNavButtonsActivity();
			}
		}
		[onForwardButtonClick](event) {
			event.preventDefault();
			if (main_core.Type.isArrayFilled(TopPanel.history) && main_core.Type.isNumber(TopPanel.historyState) && TopPanel.historyState < TopPanel.history.length - 1) {
				void landing_sliderhacks.SliderHacks.reloadSlider(TopPanel.history[++TopPanel.historyState]);
				TopPanel.checkNavButtonsActivity();
			}
		}
	}

	class PageTransition {
		/**
		 * Constructor.
		 */
		constructor() {
			this.init();
		}
		init() {
			const referrer = document.referrer;
			if (referrer !== '') {
				let isSameHost = false;
				let isDifferentPath = false;
				let isIframeDisabled = false;
				const previousUrl = new URL(referrer);
				if (previousUrl) {
					isSameHost = window.location.host === previousUrl.hostname;
					isDifferentPath = window.location.pathname !== previousUrl.pathname;
					isIframeDisabled = previousUrl.searchParams.get('IFRAME') !== 'Y';
				}
				if (!isIframeDisabled || !isSameHost || !isDifferentPath) {
					BX.removeClass(document.body, 'landing-page-transition');
				}
			} else {
				BX.removeClass(document.body, 'landing-page-transition');
			}
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', function () {
					setTimeout(() => {
						BX.removeClass(document.body, 'landing-page-transition');
					}, 300);
				});
			} else {
				setTimeout(() => {
					BX.removeClass(document.body, 'landing-page-transition');
				}, 300);
			}
		}
	}

	exports.DiskFile = DiskFile;
	exports.PageTransition = PageTransition;
	exports.SearchResult = SearchResult;
	exports.TimeStamp = TimeStamp;
	exports.TopPanel = TopPanel;

})(this.BX.Landing.Pub = this.BX.Landing.Pub || {}, BX, BX.Landing);
//# sourceMappingURL=script.js.map
