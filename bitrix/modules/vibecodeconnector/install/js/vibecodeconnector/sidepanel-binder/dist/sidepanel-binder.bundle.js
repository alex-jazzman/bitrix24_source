/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_sidepanel) {
	'use strict';

	const LOADING_CLASS = 'vibecodeconnector-app-link-loading';
	const STATUS_CLASS = 'vibecodeconnector-app-link-status';
	const LOADING_PHRASE_CODE = 'VIBECODECONNECTOR_SIDEPANEL_BINDER_APP_LINK_LOADING';
	function setLoadingState(anchor, loading) {
		if (anchor === null) {
			return;
		}
		if (loading) {
			main_core.Dom.addClass(anchor, LOADING_CLASS);
			main_core.Dom.attr(anchor, 'aria-busy', 'true');
		} else {
			main_core.Dom.removeClass(anchor, LOADING_CLASS);
			main_core.Dom.attr(anchor, 'aria-busy', null);
		}
		announceLoadingState(anchor.ownerDocument, loading);
	}
	function announceLoadingState(ownerDocument, loading) {
		const phrase = main_core.Loc.getMessage(LOADING_PHRASE_CODE) ?? '';
		if (loading && !main_core.Type.isStringFilled(phrase)) {
			return;
		}
		const statusNode = loading ? getStatusNode(ownerDocument) : findStatusNode(ownerDocument);
		if (statusNode === null) {
			return;
		}
		const message = loading ? phrase : '';
		setTimeout(() => {
			statusNode.textContent = message;
		}, 0);
	}
	function findStatusNode(ownerDocument) {
		return ownerDocument.body.querySelector(`.${STATUS_CLASS}`);
	}
	function getStatusNode(ownerDocument) {
		const existingNode = findStatusNode(ownerDocument);
		if (existingNode !== null) {
			return existingNode;
		}
		const statusNode = main_core.Tag.render`
		<div class="${STATUS_CLASS}" role="status" aria-live="polite"></div>
	`;
		main_core.Dom.append(statusNode, ownerDocument.body);
		return statusNode;
	}

	const OPEN_APP_EXTENSION = 'vibecodeconnector.open-app';
	async function openAppSlider(catalogItemId) {
		try {
			const openApp = await main_core.Runtime.loadExtension(OPEN_APP_EXTENSION);
			return openApp.openAppSlider?.(catalogItemId) === true;
		} catch {
			return false;
		}
	}

	const SELF_EXTENSION = 'vibecodeconnector.sidepanel-binder';
	const APP_PAGE_CONDITION = '^(?:https?:)?(?://[^/]+)?/vibecode/app/(\\d+)/?(?:[?#]|$)';
	const LEGACY_APP_PAGE_CONDITION = '^(?:https?:)?(?://[^/]+)?/bitrix/services/main/ajax\\.php' + '\\?(?=(?:[^#]*&)?action=vibecodeconnector\\.Catalog\\.openAppPage(?:[&#]|$))' + '(?:[^#]*&)?catalogItemId=(\\d+)(?:[&#]|$)';
	const pendingItemIds = new Set();
	function createAppPageRule() {
		return {
			condition: [APP_PAGE_CONDITION, LEGACY_APP_PAGE_CONDITION],
			handler: (event, link) => {
				if (!isOpenAppInIframeEnabled()) {
					return false;
				}
				const catalogItemId = main_core.Text.toInteger(link?.matches?.[1]);
				if (catalogItemId <= 0) {
					return false;
				}
				event.preventDefault();
				if (!pendingItemIds.has(catalogItemId)) {
					openCatalogApp(catalogItemId, link.url, link?.anchor ?? null);
				}
				return true;
			}
		};
	}
	function isOpenAppInIframeEnabled() {
		return main_core.Extension.getSettings(SELF_EXTENSION).get('openAppInIframe', false) === true;
	}
	async function openCatalogApp(catalogItemId, url, anchor) {
		pendingItemIds.add(catalogItemId);
		setLoadingState(anchor, true);
		try {
			if (!(await openAppSlider(catalogItemId))) {
				main_core.Page.redirect(url);
			}
		} finally {
			pendingItemIds.delete(catalogItemId);
			setLoadingState(anchor, false);
		}
	}

	const ANCHORS_BOUND_FLAG = 'vibecodeconnectorAppPageAnchorsBound';
	function bindAppPageAnchors() {
		if (main_core.Page.getRootWindow() !== window) {
			return false;
		}
		return bindAppPageAnchorsTo(window, main_sidepanel.SidePanel.Instance);
	}
	function bindAppPageAnchorsTo(rootWindow, sliderManager) {
		if (!rootWindow || !sliderManager) {
			return false;
		}
		if (rootWindow[ANCHORS_BOUND_FLAG] === true) {
			return false;
		}
		const bindingWindow = rootWindow;
		bindingWindow[ANCHORS_BOUND_FLAG] = true;
		sliderManager.bindAnchors({
			rules: [createAppPageRule()]
		});
		return true;
	}
	bindAppPageAnchors();

	exports.bindAppPageAnchors = bindAppPageAnchors;
	exports.bindAppPageAnchorsTo = bindAppPageAnchorsTo;

})(this.BX.Vibecodeconnector = this.BX.Vibecodeconnector || {}, BX, BX.SidePanel);
//# sourceMappingURL=sidepanel-binder.bundle.js.map
