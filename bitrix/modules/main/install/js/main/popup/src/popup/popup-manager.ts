/* eslint-disable no-underscore-dangle -- Public legacy state used by external modules. */
/* eslint-disable @bitrix24/bitrix24-rules/no-pseudo-private -- Public legacy state. */

import { Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { Popup } from './popup';
import { type PopupLegacyOptions, type PopupOptions, type PopupTarget } from './popup-types';

export class PopupManager
{
	/** @deprecated Use getPopups(). Public for legacy consumers. */
	private static _popups: Popup[] = [];

	/** @deprecated Use getCurrentPopup(). Public for legacy consumers. */
	private static _currentPopup: Popup | null = null;

	constructor()
	{
		throw new Error('You cannot make an instance of PopupManager.');
	}

	static create(options?: PopupOptions): Popup;
	static create(id: string | null, bindElement?: PopupTarget, params?: PopupLegacyOptions): Popup;

	static create(
		options?: PopupOptions | string | null,
		compatBindElement?: PopupTarget,
		compatParams?: PopupLegacyOptions,
	): Popup
	{
		if (Type.isPlainObject(options) && !compatBindElement && !compatParams)
		{
			if (!Type.isStringFilled(options.id))
			{
				throw new Error('BX.Main.Popup.Manager: "id" parameter is required.');
			}

			return this.getPopupById(options.id) ?? PopupManager.#subscribePopup(new Popup(options));
		}

		const id = Type.isString(options) ? options : null;
		const popupWindow = id === null ? null : this.getPopupById(id);

		return popupWindow ?? PopupManager.#subscribePopup(new Popup(id, compatBindElement, compatParams));
	}

	// Private static members are read through PopupManager, not the call receiver:
	// a subclass inherits the method but not the private slots.
	static #subscribePopup(popupWindow: Popup): Popup
	{
		popupWindow.subscribe('onShow', PopupManager.#handlePopupShow);
		popupWindow.subscribe('onClose', PopupManager.#handlePopupClose);

		return popupWindow;
	}

	static handleOnAfterInit = (event: BaseEvent): void => {
		event.getTarget().subscribeOnce('onDestroy', this.#handlePopupDestroy);

		this._popups.forEach((popup) => {
			if (popup.getId() === event.getTarget().getId())
			{
				console.error(`Duplicate id (${popup.getId()}) for the BX.Main.Popup instance.`);
			}
		});

		this._popups.push(event.getTarget());
	};

	static #handlePopupDestroy = (event: BaseEvent): void => {
		const destroyedPopup = event.getTarget();
		this._popups = this._popups.filter((popup) => {
			return popup !== destroyedPopup;
		});

		if (this._currentPopup === destroyedPopup)
		{
			this._currentPopup = null;
		}
	};

	static #handlePopupShow = (event: BaseEvent): void => {
		if (this._currentPopup !== null)
		{
			this._currentPopup.close();
		}

		this._currentPopup = event.getTarget();
	};

	static #handlePopupClose = (): void => {
		this._currentPopup = null;
	};

	static getCurrentPopup(): Popup | null
	{
		return this._currentPopup;
	}

	static isPopupExists(id: string): boolean
	{
		return this.getPopupById(id) !== null;
	}

	static isAnyPopupShown(): boolean
	{
		for (let i = 0, length = this._popups.length; i < length; i++)
		{
			if (this._popups[i].isShown())
			{
				return true;
			}
		}

		return false;
	}

	static getPopupById(id: string): Popup | null
	{
		for (let i = 0; i < this._popups.length; i++)
		{
			if (this._popups[i].getId() === id)
			{
				return this._popups[i];
			}
		}

		return null;
	}

	static getMaxZIndex(): number
	{
		let zIndex = 0;

		this.getPopups().forEach((popup: Popup) => {
			zIndex = Math.max(zIndex, popup.getZindex());
		});

		return zIndex;
	}

	static getPopups(): Popup[]
	{
		return this._popups;
	}
}

EventEmitter.subscribe('BX.Main.Popup:onAfterInit', PopupManager.handleOnAfterInit);
