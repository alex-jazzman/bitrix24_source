import { Event, Extension, Loc, Runtime, Type, ajax } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { InfoHelper } from 'ui.info-helper';
import { CatalogLoadingPopup } from 'vibecodeconnector.catalog-popup';

import './binder.css';

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
	opened: 'im:vibe-code-catalog:opened',
});

class ImButtonBinder
{
	#observer: MutationObserver | null = null;
	#boundElement: HTMLElement | null = null;
	#catalog = null;
	#catalogLoading: Promise | null = null;
	#catalogLoadGeneration: number = 0;
	#catalogExtension = null;
	#catalogExtensionLoading: Promise | null = null;
	#loadingPopup: CatalogLoadingPopup | null = null;
	#previewUserId: number | null = null;
	#isCatalogAllowed: boolean = false;
	#vibePlusPromoterCode: string | null = null;
	#isOpen: boolean = false;
	#mustAutoShow: boolean = false;
	#autoShownInSession: boolean = false;
	#autoShowOnClose: (() => void) | null = null;
	#newAppsCount: number = 0;
	#badgeNode: HTMLElement | null = null;
	#badgeLabelNode: HTMLElement | null = null;
	#recalcTimer: number | null = null;
	#recalcGeneration: number = 0;

	init(): void
	{
		const settings = Extension.getSettings(SELF_EXTENSION);
		// Closed by default: without the key the stub is shown, not an empty catalog.
		this.#isCatalogAllowed = settings.get('isCatalogAllowed', false) === true;
		const rawVibePlusPromoterCode = settings.get('vibePlusPromoterCode', null);
		this.#vibePlusPromoterCode = Type.isStringFilled(rawVibePlusPromoterCode)
			? rawVibePlusPromoterCode
			: null;

		// Without the allowance every catalog-bound value stays neutral: a leftover
		// ?previewUserId= would otherwise make #detectIsEmpty() query the catalog.
		const rawPreview = settings.get('previewUserId', null);
		this.#previewUserId = this.#isCatalogAllowed && typeof rawPreview === 'number' && rawPreview > 0
			? rawPreview
			: null;
		this.#mustAutoShow = this.#isCatalogAllowed
			&& this.#vibePlusPromoterCode === null
			&& settings.get('catalog_must_be_shown', false) === true;
		const rawNewAppsCount = settings.get('newAppsCount', 0);
		this.#newAppsCount = this.#isCatalogAllowed && Type.isNumber(rawNewAppsCount) && rawNewAppsCount > 0
			? Math.trunc(rawNewAppsCount)
			: 0;

		EventEmitter.subscribe(CatalogEvent.request, this.#handleRequest);
		EventEmitter.subscribe(CatalogEvent.opened, this.#handleOpened);

		this.#observer = new MutationObserver(() => this.#tryAttachInside(window.document));
		this.#observeDocument();
		this.#tryAttachInside(window.document);
	}

	#handleRequest = (event: BaseEvent): void => {
		const { open, node } = event.getData();
		if (open === true)
		{
			void this.#open(node instanceof HTMLElement ? node : null).catch(() => {});
		}
		else
		{
			this.#close();
		}
	};

	#handleOpened = (): void => {
		this.#scheduleRecalcNewAppsCount();
	};

	#tryAttachInside(root: ParentNode): void
	{
		if (this.#boundElement !== null)
		{
			if (this.#boundElement.isConnected)
			{
				return;
			}

			// The bound node was detached (e.g. a Vue re-render replaced it):
			// forget it and widen observation back to the whole document so the
			// replacement is found wherever it reappears.
			this.#boundElement = null;
			this.#observeDocument();
		}

		const node = root.querySelector?.(SELECTOR);
		if (!(node instanceof HTMLElement))
		{
			return;
		}

		this.#renderBadge(node);
		this.#boundElement = node;
		this.#watchBoundParent(node);
		this.#scheduleAutoShow(node);

		if (!node.hasAttribute(EVENTS_ATTRIBUTE))
		{
			Event.bind(node, 'click', this.#handleDomClick);
		}
	}

	#observeDocument(): void
	{
		this.#observer?.disconnect();
		this.#observer?.observe(window.document, { childList: true, subtree: true });
	}

	#watchBoundParent(node: HTMLElement): void
	{
		const parent = node.parentNode;
		if (this.#observer === null || !(parent instanceof Node))
		{
			return;
		}

		// Once the button is bound, narrow observation from the whole document
		// down to its parent: only the button's own removal/replacement needs
		// watching, so unrelated IM DOM mutations no longer trigger the callback.
		this.#observer.disconnect();
		this.#observer.observe(parent, { childList: true });
	}

	#scheduleAutoShow(node: HTMLElement): void
	{
		if (!this.#mustAutoShow || this.#autoShownInSession)
		{
			return;
		}

		this.#autoShownInSession = true;

		Runtime.loadExtension(BANNER_DISPATCHER_EXTENSION)
			.then(({ BannerDispatcher }) => {
				BannerDispatcher.normal.toQueue((onDone) => {
					// The catalog may already be open (opened manually before the
					// dispatcher slot became free): do not open it twice, just
					// release the queue slot.
					if (this.#isOpen)
					{
						onDone();

						return;
					}

			this.#autoShowOnClose = onDone;

					// The deferred node may be detached (the Vue button re-rendered);
					// open without an anchor instead of binding to a stale node.
					const anchor = node.isConnected ? node : null;

			this.#open(anchor).catch(() => { this.#finishAutoShow(false); });
				});
			})
			.catch(() => {
				// The banner dispatcher failed to load and there is no retry this
				// session; swallow the rejection to avoid an unhandled rejection.
			});
	}

	#markCatalogShown(): void
	{
		try
		{
			void ajax.runAction(MARK_SHOWN_ACTION).catch(() => {});
		}
		catch (error)
		{
			// The catalog view is recorded in the background: a network error must not break the UI.
		}
	}

	#handleDomClick = (event: MouseEvent): void => {
		const node = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;

		if (this.#isOpen)
		{
			this.#close();
		}
		else
		{
			void this.#open(node).catch(() => {});
		}
	};

	async #open(node: HTMLElement | null): Promise<void>
	{
		if (this.#vibePlusPromoterCode !== null)
		{
			InfoHelper.show(this.#vibePlusPromoterCode);

			return;
		}

		if (this.#isOpen)
		{
			return;
		}

		if (this.#catalog !== null)
		{
			this.#showCatalog(this.#catalog, node);
			this.#setOpenState();
			this.#scheduleRecalcNewAppsCount();

			return;
		}

		this.#setOpenState();

		try
		{
			this.#showLoadingPopup(node);
			const catalog = await this.#ensureCatalog();
			if (!this.#isOpen || catalog === null)
			{
				return;
			}

			const loadingPopup = this.#loadingPopup;
			this.#loadingPopup = null;
			this.#showCatalog(catalog, node, loadingPopup);
			this.#scheduleRecalcNewAppsCount();
		}
		catch (error)
		{
			console.error('[vibecodeconnector.catalog] failed to open catalog', error);
			this.#cancelLoadingPopup();

			throw error;
		}
	}

	#close(): void
	{
		if (this.#loadingPopup !== null)
		{
			this.#cancelLoadingPopup();

			return;
		}

		this.#catalog?.close();
	}

	#ensureCatalog(): Promise<any>
	{
		if (this.#catalog !== null)
		{
			return Promise.resolve(this.#catalog);
		}

		if (this.#catalogLoading === null)
		{
			const previewUserId = this.#previewUserId;
			const generation = ++this.#catalogLoadGeneration;
			this.#catalogLoading = Promise
				.all([this.#loadCatalogExtension(), this.#loadIsEmpty(previewUserId)])
				.then(([exports, isEmpty]) => {
					if (generation !== this.#catalogLoadGeneration)
					{
						return null;
					}

					this.#catalog = new exports.Catalog({
						...(Type.isBoolean(isEmpty) ? { isEmpty } : {}),
						previewUserId,
						onClose: () => { this.#closeCatalog(); },
					});

					return this.#catalog;
				})
				.catch((error) => {
					this.#catalogLoading = null;

					throw error;
				})
			;
		}

		return this.#catalogLoading;
	}

	async #loadCatalogExtension(): Promise<any>
	{
		if (this.#catalogExtension !== null)
		{
			return this.#catalogExtension;
		}

		if (this.#catalogExtensionLoading !== null)
		{
			const exports = await this.#catalogExtensionLoading;
			if (exports !== null)
			{
				return exports;
			}
		}

		const loading = Runtime.loadExtension(CATALOG_EXTENSION);
		this.#catalogExtensionLoading = loading;

		try
		{
			this.#catalogExtension = await loading;

			return this.#catalogExtension;
		}
		catch (error)
		{
			if (this.#catalogExtensionLoading === loading)
			{
				this.#catalogExtensionLoading = null;
			}

			throw error;
		}
	}

	#loadIsEmpty(previewUserId: number | null): Promise<boolean | null>
	{
		if (previewUserId === null)
		{
			return Promise.resolve(null);
		}

		return this.#detectIsEmpty(previewUserId)
			.then(({ isEmpty }) => (Type.isBoolean(isEmpty) ? isEmpty : null))
		;
	}

	#showLoadingPopup(node: HTMLElement | null): void
	{
		if (this.#loadingPopup !== null)
		{
			return;
		}

		this.#loadingPopup = new CatalogLoadingPopup();
		this.#loadingPopup.show(
			node,
			() => this.#cancelLoadingPopup(false),
			!this.#isCatalogAllowed,
		);
	}

	#cancelLoadingPopup(closePopup: boolean = true): void
	{
		const popup = this.#loadingPopup;
		if (popup === null)
		{
			return;
		}

		this.#loadingPopup = null;
		if (closePopup)
		{
			popup.close();
		}
		this.#catalogLoadGeneration++;
		this.#catalogLoading = null;
		this.#resetOpenState();
		this.#finishAutoShow(false);
	}

	#showCatalog(catalog, node: HTMLElement | null, loadingPopup: CatalogLoadingPopup | null = null): void
	{
		if (this.#isCatalogAllowed)
		{
			catalog.setNewAppsCount?.(this.#newAppsCount);
			catalog.show(node, loadingPopup);

			return;
		}

		catalog.showNoAccess(node, loadingPopup);
	}

	#setOpenState(): void
	{
		this.#isOpen = true;
		EventEmitter.emit(CatalogEvent.stateChanged, { active: true });
	}

	#resetOpenState(): void
	{
		if (!this.#isOpen)
		{
			return;
		}

		this.#isOpen = false;
		EventEmitter.emit(CatalogEvent.stateChanged, { active: false });
	}

	#closeCatalog()
	{
		this.#resetOpenState();
		this.#scheduleRecalcNewAppsCount();
		this.#finishAutoShow(true);
	}

	#finishAutoShow(markCatalogShown: boolean): void
	{
		if (this.#autoShowOnClose !== null)
		{
			const onClose = this.#autoShowOnClose;
			this.#autoShowOnClose = null;
			if (markCatalogShown)
			{
				this.#markCatalogShown();
			}
			onClose();
		}
	}

	#detectIsEmpty(previewUserId: number | null): Promise<any>
	{
		return new Promise((resolve) => {
			try
			{
				ajax.runAction('vibecodeconnector.Catalog.isEmpty', {
					data: previewUserId === null ? {} : { previewUserId },
				})
				.then((result) => {
					const isEmpty = result?.data?.isEmpty;
					resolve({ isEmpty });
				}).catch(() => {
					resolve({ isEmpty: null });
				});
			}
			catch (error)
			{
				resolve({ isEmpty: null });
			}
		});
	}

	#renderBadge(node: HTMLElement): void
	{
		if (!this.#isCatalogAllowed || this.#vibePlusPromoterCode !== null)
		{
			return;
		}

		if (this.#badgeNode === null || this.#badgeNode.parentElement !== node)
		{
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

	#syncBadge(): void
	{
		if (this.#badgeNode === null)
		{
			return;
		}

		const count = this.#newAppsCount;
		const isVisible = count > 0;

		this.#badgeNode.style.display = isVisible ? '' : 'none';
		if (this.#badgeLabelNode !== null)
		{
			this.#badgeLabelNode.style.display = isVisible ? '' : 'none';
		}

		this.#toggleBadgeDescription(isVisible);

		if (!isVisible)
		{
			return;
		}

		const overflowed = count > NEW_APPS_COUNT_OVERFLOW;
		this.#badgeNode.textContent = overflowed ? `${NEW_APPS_COUNT_OVERFLOW}+` : String(count);
		this.#badgeNode.classList.toggle(BADGE_OVERFLOWED_CLASS, overflowed);

		if (this.#badgeLabelNode !== null)
		{
			this.#badgeLabelNode.textContent = Loc.getMessagePlural(
				'VIBECODECONNECTOR_IM_BUTTON_BINDER_NEW_APPS_COUNT',
				count,
				{ '#COUNT#': count },
			);
		}
	}

	#toggleBadgeDescription(isVisible: boolean): void
	{
		const host = this.#badgeLabelNode?.parentElement ?? null;
		if (host === null)
		{
			return;
		}

		const ids = (host.getAttribute('aria-describedby') ?? '')
			.split(/\s+/)
			.filter((id) => id !== '' && id !== BADGE_LABEL_ID);

		if (isVisible)
		{
			ids.push(BADGE_LABEL_ID);
		}

		if (ids.length > 0)
		{
			host.setAttribute('aria-describedby', ids.join(' '));
		}
		else
		{
			host.removeAttribute('aria-describedby');
		}
	}

	#updateNewAppsCount(value: number): void
	{
		const normalized = Type.isNumber(value) && value > 0 ? Math.trunc(value) : 0;
		if (normalized === this.#newAppsCount)
		{
			return;
		}

		this.#newAppsCount = normalized;
		this.#syncBadge();
		this.#catalog?.setNewAppsCount?.(this.#newAppsCount);
	}

	#scheduleRecalcNewAppsCount(): void
	{
		if (!this.#isCatalogAllowed || this.#vibePlusPromoterCode !== null)
		{
			return;
		}

		if (this.#recalcTimer !== null)
		{
			clearTimeout(this.#recalcTimer);
		}

		this.#recalcTimer = setTimeout(() => {
			this.#recalcTimer = null;
			void this.#recalculateNewAppsCount();
		}, RECALC_DEBOUNCE_MS);
	}

	#recalculateNewAppsCount(): Promise<void>
	{
		const previewUserId = this.#previewUserId;
		const data = previewUserId === null ? {} : { previewUserId };
		const generation = ++this.#recalcGeneration;

		return new Promise((resolve) => {
			try
			{
				ajax.runAction(GET_NEW_APPS_COUNT_ACTION, { data })
					.then((result) => {
						const count = result?.data?.count;
						// Apply only the latest request: an earlier in-flight
						// recalc may resolve after a newer one and would otherwise
						// restore a stale count.
						if (generation === this.#recalcGeneration && Type.isNumber(count))
						{
							this.#updateNewAppsCount(count);
						}
						resolve();
					})
					.catch(() => {
						resolve();
					});
			}
			catch (error)
			{
				resolve();
			}
		});
	}
}

export { ImButtonBinder };

new ImButtonBinder().init();
