/* eslint-disable @bitrix24/bitrix24-rules/no-native-events-binding */
import { Browser, Page, Type, Reflection } from 'main.core';

import { FocusNavigator } from '../focus-navigator/focus-navigator';
import { FocusHistory } from './focus-history';
import { InputModalityTracker, type InputModality } from './input-modality-tracker';
import { AccessibilityLogger } from '../accessibility-logger/accessibility-logger';
import { AccessibilitySettings } from '../accessibility-settings/accessibility-settings';

type DocumentState = {
	detach: () => void;
};

/**
 * @memberof BX.UI.Accessibility
 */
export class FocusMonitor
{
	static #instance: FocusMonitor | null = null;
	readonly #history: FocusHistory;
	readonly #modality: InputModalityTracker;
	readonly #documents: WeakMap<Document, DocumentState> = new WeakMap();

	constructor()
	{
		this.#history = new FocusHistory(25);
		this.#modality = new InputModalityTracker();

		this.#attachDocument(document);
	}

	static get Instance(): FocusMonitor
	{
		return this.initialize();
	}

	static initialize(): FocusMonitor
	{
		// Create a focus monitor only in the top window
		const topWindow = Page.getRootWindow();
		if (topWindow !== window)
		{
			const monitor = Reflection.getClass('top.BX.UI.Accessibility.FocusMonitor') as typeof FocusMonitor;
			if (monitor !== null)
			{
				return monitor.Instance;
			}
		}

		if (this.#instance === null)
		{
			this.#instance = new FocusMonitor();
		}

		return this.#instance;
	}

	static enableDebug(): void
	{
		AccessibilityLogger.enable('focus-monitor');
	}

	static disableDebug(): void
	{
		AccessibilityLogger.disable('focus-monitor');
	}

	static shouldRestoreLostFocus(): boolean
	{
		return AccessibilitySettings.restoreLostFocus();
	}

	#attachDocument(doc: Document): void
	{
		if (this.#documents.has(doc))
		{
			return;
		}

		let pendingRestore: number | null = null;

		const onFocusIn = (event: FocusEvent) => {
			if (pendingRestore !== null)
			{
				clearTimeout(pendingRestore);
				pendingRestore = null;
			}

			const target = event.target as HTMLElement;
			if (Type.isElementNode(target))
			{
				this.#history.record(target);
				if (target.tagName === 'IFRAME')
				{
					this.attachIframe(target as HTMLIFrameElement);
				}
			}
		};

		const onFocusOut = () => {
			if (pendingRestore !== null)
			{
				return;
			}

			pendingRestore = window.setTimeout(() => {
				pendingRestore = null;
				this.#tryRestoreLostFocus(doc);
			}, 0);
		};

		doc.addEventListener('focusin', onFocusIn, true);
		doc.addEventListener('focusout', onFocusOut, true);

		const observer = this.#attachObserver(doc);
		this.#modality.attach(doc);
		this.#documents.set(doc, {
			detach: () => {
				if (pendingRestore !== null)
				{
					clearTimeout(pendingRestore);
				}

				doc.removeEventListener('focusin', onFocusIn, true);
				doc.removeEventListener('focusout', onFocusOut, true);

				this.#modality.detach(doc);
				observer?.disconnect();
			},
		});
	}

	attachIframe(iframe: HTMLIFrameElement)
	{
		if (!Type.isElementNode(iframe) || iframe.tagName !== 'IFRAME')
		{
			return;
		}

		try
		{
			const doc = iframe.contentDocument;
			if (!doc)
			{
				return;
			}

			const state = this.#documents.get(doc);
			if (state)
			{
				return;
			}

			this.#attachDocument(doc);

			// const onLoad = () => {
			// 	this.detachIframe(iframe);
			// 	this.attachIframe(iframe);
			// };
			//
			// iframe.addEventListener('load', onLoad);

			// const originalDetach = state.detach;
			// state.detach = () => {
			// 	// iframe.removeEventListener('load', onLoad);
			// 	originalDetach();
			// };
		}
		catch
		{
			// cross-origin
		}
	}

	detachIframe(iframe: HTMLIFrameElement)
	{
		try
		{
			const doc = iframe.contentDocument;
			if (!doc)
			{
				return;
			}

			const state = this.#documents.get(doc);
			if (state)
			{
				state.detach();
				this.#documents.delete(doc);
			}
		}
		catch
		{
			// cross-origin
		}
	}

	#tryRestoreLostFocus(doc: Document): void
	{
		if (!FocusMonitor.shouldRestoreLostFocus())
		{
			return;
		}

		const active = doc.activeElement;
		if (active && active !== doc.body)
		{
			return;
		}

		if (this.#modality.getLastModality() !== 'keyboard')
		{
			return;
		}

		const target = this.#history.getLastValid();
		if (target)
		{
			this.#restoreElementFocus(target);

			return;
		}

		// Fallback
		this.#restoreFocusToRoot(doc);
	}

	restoreFocus(): void
	{
		const target = this.#history.getLastValid();
		if (target)
		{
			this.#restoreElementFocus(target);

			return;
		}

		// Fallback
		this.#restoreFocusToRoot(document);
	}

	#restoreFocusToRoot(doc: Document): void
	{
		AccessibilityLogger.log('focus-monitor', 'restoring focus to root');

		FocusNavigator.restoreFocus(this.getRoot(doc), { preventScroll: true });
	}

	getRoot(doc: Document = document): HTMLElement
	{
		return doc.querySelector('[data-focus-root]') || doc.querySelector('main') || doc.body;
	}

	#restoreElementFocus(el: HTMLElement)
	{
		if (!el.isConnected)
		{
			return;
		}

		const ownerWindow = el.ownerDocument.defaultView;
		if (!ownerWindow)
		{
			return;
		}

		const activeElement = FocusNavigator.getActiveElement(el);
		if (activeElement === el)
		{
			return;
		}

		if (ownerWindow === window)
		{
			FocusNavigator.restoreFocus(el, { preventScroll: true });

			return;
		}

		ownerWindow.requestAnimationFrame(() => {
			FocusNavigator.restoreFocus(el, { preventScroll: true });
		});
	}

	getLastInputModality(): InputModality
	{
		return this.#modality.getLastModality();
	}

	getModalityTracker(): InputModalityTracker
	{
		return this.#modality;
	}

	#attachObserver(doc: Document): MutationObserver | null
	{
		if (!FocusMonitor.shouldRestoreLostFocus())
		{
			return null;
		}

		if (Browser.isFirefox() || Browser.isSafari())
		{
			// Firefox / Safari don't trigger focusout/focusin when element is removed, so we need to observe DOM mutations
			const observer = new MutationObserver((mutations) => {
				this.#tryRestoreLostFocus(doc);
			});

			const observe = () => observer.observe(doc.body, {
				childList: true,
				subtree: true,
				characterData: false,
			});

			if (doc.readyState === 'loading')
			{
				doc.addEventListener('DOMContentLoaded', observe);
			}
			else
			{
				observe();
			}

			return observer;
		}

		return null;
	}
}
