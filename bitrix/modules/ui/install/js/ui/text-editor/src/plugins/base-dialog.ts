import { Type } from 'main.core';
import { MemoryCache, type BaseCache } from 'main.core.cache';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { Popup, type PopupOptions, type PopupTarget, type PopupTargetOptions } from 'main.popup';

import { DIALOG_FOCUS_TRAP } from '../helpers/dialog-focus-trap';
import { type EditorDialog } from './dialog-plugin';

export type BaseDialogOptions = {
	targetContainer?: HTMLElement;
	events?: Record<string, (event: BaseEvent) => void>;
};

export type DialogShowOptions = {
	target?: PopupTarget;
	targetOptions?: PopupTargetOptions;
};

/**
 * The popup half of an editor dialog: link, image, video, table size, smileys.
 *
 * DialogPlugin owns the editor half of the same pair -- the caret the dialog was opened on, the
 * position, the focus going back. This class owns the popup: one instance built on demand, the
 * options every editor dialog opens with, and the popup lifecycle events republished as events
 * of the dialog itself.
 *
 * A dialog adds what belongs to it alone -- its accessible name, its content, its geometry --
 * through getPopupOptions(), and reacts to the lifecycle by subscribing to itself rather than by
 * taking the popup handlers over. The events block is applied after those options, so no dialog
 * can end up swallowing an event its plugin listens to.
 */
export class BaseDialog extends EventEmitter implements EditorDialog
{
	#popup: Popup | null = null;
	#targetContainer: HTMLElement | null = null;
	#refs: BaseCache<HTMLElement> = new MemoryCache();

	constructor(eventNamespace: string, dialogOptions?: BaseDialogOptions)
	{
		super();
		this.setEventNamespace(eventNamespace);

		const options: BaseDialogOptions = Type.isPlainObject(dialogOptions) ? dialogOptions : {};

		this.setTargetContainer(options.targetContainer);
		this.subscribeFromOptions(options.events ?? {});
	}

	show(showOptions: DialogShowOptions = {}): void
	{
		const target: PopupTarget | undefined = showOptions.target ?? undefined;
		const targetOptions: PopupTargetOptions = Type.isPlainObject(showOptions.targetOptions)
			? showOptions.targetOptions
			: {};

		if (!Type.isUndefined(target))
		{
			this.getPopup().setBindElement(target);
		}

		this.getPopup().adjustPosition({
			...targetOptions,
			forceBindPosition: true,
		});

		this.getPopup().show();
	}

	hide(): void
	{
		this.#popup?.close();
	}

	/**
	 * Re-anchors the popup after its content changed size. A dialog that has never been opened has
	 * no popup yet, and building one only to position it would show nothing and cost a layout.
	 */
	adjustPosition(): void
	{
		this.#popup?.adjustPosition();
	}

	isShown(): boolean
	{
		return this.#popup !== null && this.#popup.isShown();
	}

	destroy(): void
	{
		this.#popup?.destroy();
	}

	setTargetContainer(container?: HTMLElement): void
	{
		if (Type.isElementNode(container))
		{
			this.#targetContainer = container;
		}
	}

	getTargetContainer(): HTMLElement | null
	{
		return this.#targetContainer;
	}

	/** The rendered parts of the dialog: built on the first call, handed back on the rest. */
	getRefs(): BaseCache<HTMLElement>
	{
		return this.#refs;
	}

	getPopup(): Popup
	{
		if (this.#popup === null)
		{
			this.#popup = new Popup({
				autoHide: true,
				padding: 0,
				closeByEsc: true,
				focusTrap: DIALOG_FOCUS_TRAP,
				targetContainer: this.getTargetContainer() ?? undefined,
				...this.getPopupOptions(),
				events: {
					onFirstShow: (): void => {
						this.emit('onFirstShow');
					},
					onShow: (): void => {
						this.emit('onShow');
					},
					onAfterShow: (): void => {
						this.emit('onAfterShow');
					},
					onClose: (): void => {
						this.emit('onClose');
					},
					onDestroy: (): void => {
						// cacheable: false makes a popup destroy itself on close; kept here, it would
						// swallow every later show(), which returns at once on a destroyed popup
						this.#popup = null;
						this.emit('onDestroy');
					},
				},
			});
		}

		return this.#popup;
	}

	getPopupOptions(): PopupOptions
	{
		return {};
	}
}
