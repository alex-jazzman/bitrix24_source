import { Loc, Tag, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { PopupManager, type Popup } from 'main.popup';
import { BannerDispatcher } from 'ui.banner-dispatcher';

import { UndoSendEvent } from '../notification/undo-send-notification';

export type UndoSendGuideOptions = {
	optionName: string,
	bindSelector?: string,
	ready?: boolean,
};

type GuidePopup = Pick<Popup, 'show' | 'close'>;

export type UndoSendGuideDependencies = {
	enqueue: (callback: (onDone: () => void) => void, options: { id: string }) => void,
	unregister: (id: string) => void,
	createPopup: (bindElement: HTMLElement, onDone: () => void) => GuidePopup,
	save: (optionName: string) => void,
	subscribeExpired: (handler: (event: BaseEvent) => void) => () => void,
};

const UserOptionCategory = 'mail.guide';
const QueueItemId = 'mail-undo-send-guide';
const PopupId = 'mail-undo-send-guide-popup';
const DefaultBindSelector = '.mail-list-settings-menu-popup-toggle';
const PopupWidth = 320;

type BannerQueue = {
	toQueue(callback: (onDone: () => void) => void, options?: { id?: string }): void,
};

type AutoLaunchGlobal = {
	UI: {
		AutoLaunch: {
			AutoLauncher: {
				unregister(id: string): void,
			},
		},
	},
};

const DefaultDependencies: UndoSendGuideDependencies = {
	enqueue: (callback, options): void => (BannerDispatcher.normal as unknown as BannerQueue).toQueue(
		callback,
		options,
	),
	unregister: (id): void => (BX as unknown as AutoLaunchGlobal).UI.AutoLaunch.AutoLauncher.unregister(id),
	createPopup: (bindElement, onDone): Popup => PopupManager.create({
		id: PopupId,
		bindElement,
		ariaLabel: Loc.getMessage('MAIL_UNDO_SEND_GUIDE_TITLE') ?? '',
		closeIcon: true,
		autoHide: true,
		closeByEsc: true,
		width: PopupWidth,
		angle: { offset: 24, position: 'top' },
		content: createContent(),
		events: {
			onClose: onDone,
		},
	}),
	save: (optionName): void => {
		(BX as unknown as {
			userOptions: {
				save(category: string, name: string, valueName: null, value: string): void,
			},
		}).userOptions.save(UserOptionCategory, optionName, null, 'Y');
	},
	subscribeExpired: (handler): (() => void) => {
		EventEmitter.subscribe(UndoSendEvent.Expired, handler);

		return (): void => EventEmitter.unsubscribe(UndoSendEvent.Expired, handler);
	},
};

function createContent(): HTMLElement
{
	const content: HTMLElement = Tag.render`<div data-testid="mail-undo-send-guide"></div>`;
	content.textContent = Loc.getMessage('MAIL_UNDO_SEND_GUIDE_TEXT') ?? '';

	return content;
}

export class UndoSendGuide
{
	#optionName: string;
	#bindSelector: string;
	#dependencies: UndoSendGuideDependencies;
	#popup: GuidePopup | null = null;
	#queued = false;
	#destroyed = false;
	#ready: boolean;
	#unsubscribeExpired: (() => void) | null = null;

	constructor(options: UndoSendGuideOptions, dependencies: UndoSendGuideDependencies = DefaultDependencies)
	{
		this.#optionName = options.optionName;
		this.#bindSelector = options.bindSelector ?? DefaultBindSelector;
		this.#dependencies = dependencies;
		this.#ready = options.ready === true;
	}

	show(): void
	{
		if (this.#queued || this.#destroyed || !Type.isStringFilled(this.#optionName))
		{
			return;
		}

		if (!this.#ready)
		{
			this.#unsubscribeExpired ??= this.#dependencies.subscribeExpired((): void => {
				this.#ready = true;
				this.#unsubscribeExpired?.();
				this.#unsubscribeExpired = null;
				this.show();
			});

			return;
		}

		if (!this.#resolveBindElement())
		{
			return;
		}

		this.#queued = true;
		this.#dependencies.enqueue((onDone): void => {
			const bindElement = this.#resolveBindElement();
			if (this.#destroyed || !bindElement)
			{
				onDone();

				return;
			}

			this.#popup = this.#dependencies.createPopup(bindElement, onDone);
			this.#popup.show();
			this.#dependencies.save(this.#optionName);
		}, { id: QueueItemId });
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#popup?.close();
		this.#popup = null;
		this.#unsubscribeExpired?.();
		this.#unsubscribeExpired = null;
		this.#dependencies.unregister(QueueItemId);
	}

	#resolveBindElement(): HTMLElement | null
	{
		const bindElement = document.querySelector(this.#bindSelector);

		return bindElement instanceof HTMLElement ? bindElement : null;
	}
}
