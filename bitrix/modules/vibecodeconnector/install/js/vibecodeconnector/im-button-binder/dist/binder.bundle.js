/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_infoHelper, vibecodeconnector_catalogPopup) {
	'use strict';

	const SELECTOR = '.bx-im-list-container-vibe-code-catalog-button__container';
	const EVENTS_ATTRIBUTE = 'data-bx-vibe-code-catalog-events';
	const CATALOG_EXTENSION = 'vibecodeconnector.catalog';
	const BANNER_DISPATCHER_EXTENSION = 'ui.banner-dispatcher';
	const SELF_EXTENSION = 'vibecodeconnector.im-button-binder';
	const MARK_SHOWN_ACTION = 'vibecodeconnector.Catalog.markCatalogShown';
	const GET_NEW_APPS_COUNT_ACTION = 'vibecodeconnector.Catalog.getNewAppsCount';
	const NEW_APPS_COUNT_OVERFLOW = 99;
	const RECALC_DEBOUNCE_MS = 300;
	const BADGE_CLASS = 'vibecodeconnector-im-button-binder__badge';
	const BADGE_OVERFLOWED_CLASS = 'vibecodeconnector-im-button-binder__badge--overflowed';
	const BADGE_LABEL_CLASS = 'vibecodeconnector-im-button-binder__badge-label';
	const BADGE_LABEL_ID = 'vibecodeconnector-im-button-binder__badge-label';
	const CatalogEvent = Object.freeze({
		request: 'im:vibe-code-catalog:request',
		stateChanged: 'im:vibe-code-catalog:state-changed',
		opened: 'im:vibe-code-catalog:opened'
	});
	class ImButtonBinder {
		#observer = null;
		#boundElement = null;
		#catalog = null;
		#catalogLoading = null;
		#catalogLoadGeneration = 0;
		#catalogExtension = null;
		#catalogExtensionLoading = null;
		#loadingPopup = null;
		#previewUserId = null;
		#isCatalogAllowed = false;
		#vibePlusPromoterCode = null;
		#isOpen = false;
		#mustAutoShow = false;
		#autoShownInSession = false;
		#autoShowOnClose = null;
		#newAppsCount = 0;
		#badgeNode = null;
		#badgeLabelNode = null;
		#recalcTimer = null;
		#recalcGeneration = 0;
		init() {
			const settings = main_core.Extension.getSettings(SELF_EXTENSION);
			// Closed by default: without the key the stub is shown, not an empty catalog.
			this.#isCatalogAllowed = settings.get('isCatalogAllowed', false) === true;
			const rawVibePlusPromoterCode = settings.get('vibePlusPromoterCode', null);
			this.#vibePlusPromoterCode = main_core.Type.isStringFilled(rawVibePlusPromoterCode) ? rawVibePlusPromoterCode : null;

			// Without the allowance every catalog-bound value stays neutral: a leftover
			// ?previewUserId= would otherwise make #detectIsEmpty() query the catalog.
			const rawPreview = settings.get('previewUserId', null);
			this.#previewUserId = this.#isCatalogAllowed && typeof rawPreview === 'number' && rawPreview > 0 ? rawPreview : null;
			this.#mustAutoShow = this.#isCatalogAllowed && this.#vibePlusPromoterCode === null && settings.get('catalog_must_be_shown', false) === true;
			const rawNewAppsCount = settings.get('newAppsCount', 0);
			this.#newAppsCount = this.#isCatalogAllowed && main_core.Type.isNumber(rawNewAppsCount) && rawNewAppsCount > 0 ? Math.trunc(rawNewAppsCount) : 0;
			main_core_events.EventEmitter.subscribe(CatalogEvent.request, this.#handleRequest);
			main_core_events.EventEmitter.subscribe(CatalogEvent.opened, this.#handleOpened);
			this.#observer = new MutationObserver(() => this.#tryAttachInside(window.document));
			this.#observeDocument();
			this.#tryAttachInside(window.document);
		}
		#handleRequest = event => {
			const {
				open,
				node
			} = event.getData();
			if (open === true) {
				void this.#open(node instanceof HTMLElement ? node : null).catch(() => {});
			} else {
				this.#close();
			}
		};
		#handleOpened = () => {
			this.#scheduleRecalcNewAppsCount();
		};
		#tryAttachInside(root) {
			if (this.#boundElement !== null) {
				if (this.#boundElement.isConnected) {
					return;
				}

				// The bound node was detached (e.g. a Vue re-render replaced it):
				// forget it and widen observation back to the whole document so the
				// replacement is found wherever it reappears.
				this.#boundElement = null;
				this.#observeDocument();
			}
			const node = root.querySelector?.(SELECTOR);
			if (!(node instanceof HTMLElement)) {
				return;
			}
			this.#renderBadge(node);
			this.#boundElement = node;
			this.#watchBoundParent(node);
			this.#scheduleAutoShow(node);
			if (!node.hasAttribute(EVENTS_ATTRIBUTE)) {
				main_core.Event.bind(node, 'click', this.#handleDomClick);
			}
		}
		#observeDocument() {
			this.#observer?.disconnect();
			this.#observer?.observe(window.document, {
				childList: true,
				subtree: true
			});
		}
		#watchBoundParent(node) {
			const parent = node.parentNode;
			if (this.#observer === null || !(parent instanceof Node)) {
				return;
			}

			// Once the button is bound, narrow observation from the whole document
			// down to its parent: only the button's own removal/replacement needs
			// watching, so unrelated IM DOM mutations no longer trigger the callback.
			this.#observer.disconnect();
			this.#observer.observe(parent, {
				childList: true
			});
		}
		#scheduleAutoShow(node) {
			if (!this.#mustAutoShow || this.#autoShownInSession) {
				return;
			}
			this.#autoShownInSession = true;
			main_core.Runtime.loadExtension(BANNER_DISPATCHER_EXTENSION).then(({
				BannerDispatcher
			}) => {
				BannerDispatcher.normal.toQueue(onDone => {
					// The catalog may already be open (opened manually before the
					// dispatcher slot became free): do not open it twice, just
					// release the queue slot.
					if (this.#isOpen) {
						onDone();
						return;
					}
					this.#autoShowOnClose = onDone;

					// The deferred node may be detached (the Vue button re-rendered);
					// open without an anchor instead of binding to a stale node.
					const anchor = node.isConnected ? node : null;
					this.#open(anchor).catch(() => {
						this.#finishAutoShow(false);
					});
				});
			}).catch(() => {
				// The banner dispatcher failed to load and there is no retry this
				// session; swallow the rejection to avoid an unhandled rejection.
			});
		}
		#markCatalogShown() {
			try {
				void main_core.ajax.runAction(MARK_SHOWN_ACTION).catch(() => {});
			} catch (error) {
				// The catalog view is recorded in the background: a network error must not break the UI.
			}
		}
		#handleDomClick = event => {
			const node = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
			if (this.#isOpen) {
				this.#close();
			} else {
				void this.#open(node).catch(() => {});
			}
		};
		async #open(node) {
			if (this.#vibePlusPromoterCode !== null) {
				ui_infoHelper.InfoHelper.show(this.#vibePlusPromoterCode);
				return;
			}
			if (this.#isOpen) {
				return;
			}
			if (this.#catalog !== null) {
				this.#showCatalog(this.#catalog, node);
				this.#setOpenState();
				this.#scheduleRecalcNewAppsCount();
				return;
			}
			this.#setOpenState();
			try {
				this.#showLoadingPopup(node);
				const catalog = await this.#ensureCatalog();
				if (!this.#isOpen || catalog === null) {
					return;
				}
				const loadingPopup = this.#loadingPopup;
				this.#loadingPopup = null;
				this.#showCatalog(catalog, node, loadingPopup);
				this.#scheduleRecalcNewAppsCount();
			} catch (error) {
				console.error('[vibecodeconnector.catalog] failed to open catalog', error);
				this.#cancelLoadingPopup();
				throw error;
			}
		}
		#close() {
			if (this.#loadingPopup !== null) {
				this.#cancelLoadingPopup();
				return;
			}
			this.#catalog?.close();
		}
		#ensureCatalog() {
			if (this.#catalog !== null) {
				return Promise.resolve(this.#catalog);
			}
			if (this.#catalogLoading === null) {
				const previewUserId = this.#previewUserId;
				const generation = ++this.#catalogLoadGeneration;
				this.#catalogLoading = Promise.all([this.#loadCatalogExtension(), this.#loadIsEmpty(previewUserId)]).then(([exports, isEmpty]) => {
					if (generation !== this.#catalogLoadGeneration) {
						return null;
					}
					this.#catalog = new exports.Catalog({
						...(main_core.Type.isBoolean(isEmpty) ? {
							isEmpty
						} : {}),
						previewUserId,
						onClose: () => {
							this.#closeCatalog();
						}
					});
					return this.#catalog;
				}).catch(error => {
					this.#catalogLoading = null;
					throw error;
				});
			}
			return this.#catalogLoading;
		}
		async #loadCatalogExtension() {
			if (this.#catalogExtension !== null) {
				return this.#catalogExtension;
			}
			if (this.#catalogExtensionLoading !== null) {
				const exports = await this.#catalogExtensionLoading;
				if (exports !== null) {
					return exports;
				}
			}
			const loading = main_core.Runtime.loadExtension(CATALOG_EXTENSION);
			this.#catalogExtensionLoading = loading;
			try {
				this.#catalogExtension = await loading;
				return this.#catalogExtension;
			} catch (error) {
				if (this.#catalogExtensionLoading === loading) {
					this.#catalogExtensionLoading = null;
				}
				throw error;
			}
		}
		#loadIsEmpty(previewUserId) {
			if (previewUserId === null) {
				return Promise.resolve(null);
			}
			return this.#detectIsEmpty(previewUserId).then(({
				isEmpty
			}) => main_core.Type.isBoolean(isEmpty) ? isEmpty : null);
		}
		#showLoadingPopup(node) {
			if (this.#loadingPopup !== null) {
				return;
			}
			this.#loadingPopup = new vibecodeconnector_catalogPopup.CatalogLoadingPopup();
			this.#loadingPopup.show(node, () => this.#cancelLoadingPopup(false), !this.#isCatalogAllowed);
		}
		#cancelLoadingPopup(closePopup = true) {
			const popup = this.#loadingPopup;
			if (popup === null) {
				return;
			}
			this.#loadingPopup = null;
			if (closePopup) {
				popup.close();
			}
			this.#catalogLoadGeneration++;
			this.#catalogLoading = null;
			this.#resetOpenState();
			this.#finishAutoShow(false);
		}
		#showCatalog(catalog, node, loadingPopup = null) {
			if (this.#isCatalogAllowed) {
				catalog.setNewAppsCount?.(this.#newAppsCount);
				catalog.show(node, loadingPopup);
				return;
			}
			catalog.showNoAccess(node, loadingPopup);
		}
		#setOpenState() {
			this.#isOpen = true;
			main_core_events.EventEmitter.emit(CatalogEvent.stateChanged, {
				active: true
			});
		}
		#resetOpenState() {
			if (!this.#isOpen) {
				return;
			}
			this.#isOpen = false;
			main_core_events.EventEmitter.emit(CatalogEvent.stateChanged, {
				active: false
			});
		}
		#closeCatalog() {
			this.#resetOpenState();
			this.#scheduleRecalcNewAppsCount();
			this.#finishAutoShow(true);
		}
		#finishAutoShow(markCatalogShown) {
			if (this.#autoShowOnClose !== null) {
				const onClose = this.#autoShowOnClose;
				this.#autoShowOnClose = null;
				if (markCatalogShown) {
					this.#markCatalogShown();
				}
				onClose();
			}
		}
		#detectIsEmpty(previewUserId) {
			return new Promise(resolve => {
				try {
					main_core.ajax.runAction('vibecodeconnector.Catalog.isEmpty', {
						data: previewUserId === null ? {} : {
							previewUserId
						}
					}).then(result => {
						const isEmpty = result?.data?.isEmpty;
						resolve({
							isEmpty
						});
					}).catch(() => {
						resolve({
							isEmpty: null
						});
					});
				} catch (error) {
					resolve({
						isEmpty: null
					});
				}
			});
		}
		#renderBadge(node) {
			if (!this.#isCatalogAllowed || this.#vibePlusPromoterCode !== null) {
				return;
			}
			if (this.#badgeNode === null || this.#badgeNode.parentElement !== node) {
				this.#badgeNode = document.createElement('span');
				this.#badgeNode.className = BADGE_CLASS;
				this.#badgeNode.setAttribute('aria-hidden', 'true');
				this.#badgeLabelNode = document.createElement('span');
				this.#badgeLabelNode.className = BADGE_LABEL_CLASS;
				this.#badgeLabelNode.id = BADGE_LABEL_ID;
				node.appendChild(this.#badgeNode);
				node.appendChild(this.#badgeLabelNode);
			}
			this.#syncBadge();
		}
		#syncBadge() {
			if (this.#badgeNode === null) {
				return;
			}
			const count = this.#newAppsCount;
			const isVisible = count > 0;
			this.#badgeNode.style.display = isVisible ? '' : 'none';
			if (this.#badgeLabelNode !== null) {
				this.#badgeLabelNode.style.display = isVisible ? '' : 'none';
			}
			this.#toggleBadgeDescription(isVisible);
			if (!isVisible) {
				return;
			}
			const overflowed = count > NEW_APPS_COUNT_OVERFLOW;
			this.#badgeNode.textContent = overflowed ? `${NEW_APPS_COUNT_OVERFLOW}+` : String(count);
			this.#badgeNode.classList.toggle(BADGE_OVERFLOWED_CLASS, overflowed);
			if (this.#badgeLabelNode !== null) {
				this.#badgeLabelNode.textContent = main_core.Loc.getMessagePlural('VIBECODECONNECTOR_IM_BUTTON_BINDER_NEW_APPS_COUNT', count, {
					'#COUNT#': count
				});
			}
		}
		#toggleBadgeDescription(isVisible) {
			const host = this.#badgeLabelNode?.parentElement ?? null;
			if (host === null) {
				return;
			}
			const ids = (host.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id !== '' && id !== BADGE_LABEL_ID);
			if (isVisible) {
				ids.push(BADGE_LABEL_ID);
			}
			if (ids.length > 0) {
				host.setAttribute('aria-describedby', ids.join(' '));
			} else {
				host.removeAttribute('aria-describedby');
			}
		}
		#updateNewAppsCount(value) {
			const normalized = main_core.Type.isNumber(value) && value > 0 ? Math.trunc(value) : 0;
			if (normalized === this.#newAppsCount) {
				return;
			}
			this.#newAppsCount = normalized;
			this.#syncBadge();
			this.#catalog?.setNewAppsCount?.(this.#newAppsCount);
		}
		#scheduleRecalcNewAppsCount() {
			if (!this.#isCatalogAllowed || this.#vibePlusPromoterCode !== null) {
				return;
			}
			if (this.#recalcTimer !== null) {
				clearTimeout(this.#recalcTimer);
			}
			this.#recalcTimer = setTimeout(() => {
				this.#recalcTimer = null;
				void this.#recalculateNewAppsCount();
			}, RECALC_DEBOUNCE_MS);
		}
		#recalculateNewAppsCount() {
			const previewUserId = this.#previewUserId;
			const data = previewUserId === null ? {} : {
				previewUserId
			};
			const generation = ++this.#recalcGeneration;
			return new Promise(resolve => {
				try {
					main_core.ajax.runAction(GET_NEW_APPS_COUNT_ACTION, {
						data
					}).then(result => {
						const count = result?.data?.count;
						// Apply only the latest request: an earlier in-flight
						// recalc may resolve after a newer one and would otherwise
						// restore a stale count.
						if (generation === this.#recalcGeneration && main_core.Type.isNumber(count)) {
							this.#updateNewAppsCount(count);
						}
						resolve();
					}).catch(() => {
						resolve();
					});
				} catch (error) {
					resolve();
				}
			});
		}
	}
	new ImButtonBinder().init();

	exports.ImButtonBinder = ImButtonBinder;

})(this.BX.Vibecodeconnector = this.BX.Vibecodeconnector || {}, BX, BX.Event, BX.UI, BX.Vibecodeconnector);
//# sourceMappingURL=binder.bundle.js.map
