import { Dom, Loc } from 'main.core';
import { type BaseEvent } from 'main.core.events';

import { undoSendApi } from '../api';
import { type UndoSendDelay, type UndoSendPreference } from '../types';

type MenuItem = {
	getContainer(): HTMLElement,
	getMenuWindow(): Menu,
	getSubMenu(): Menu | null,
	setText(text: string): void,
};

type Menu = {
	close(): void,
	getMenuItems(): MenuItem[],
	getParentMenuItem(): MenuItem | null,
	getRootMenuWindow(): Menu | null,
};

export type UndoSendMenuItemOptions = {
	id: string,
	text: string,
	className?: string,
	dataset?: Record<string, string>,
	items?: UndoSendMenuItemOptions[],
	events?: { onSubMenuShow?: (event: BaseEvent) => void },
	onclick?: (event: MouseEvent, item: MenuItem) => void,
};

type PreferenceApi = {
	setPreference(request: UndoSendPreference): Promise<UndoSendPreference>,
};

export type UndoSendMenuOptions = {
	delaySeconds: UndoSendDelay,
	api?: PreferenceApi,
	onSaveError?: (error: unknown) => void,
};

const ParentItemId = 'mail-undo-send-preference';
const DelayItemIdPrefix = 'mail-undo-send-preference-';
const SelectedClassName = 'menu-popup-item-accept';
const DelayValues: UndoSendDelay[] = [0, 5, 10, 20];

export class UndoSendMenu
{
	#delaySeconds: UndoSendDelay;
	#api: PreferenceApi;
	#onSaveError: (error: unknown) => void;
	#saveRevision = 0;

	constructor(options: UndoSendMenuOptions)
	{
		this.#delaySeconds = options.delaySeconds;
		this.#api = options.api ?? undoSendApi;
		this.#onSaveError = options.onSaveError ?? (() => {});
	}

	getItem(): UndoSendMenuItemOptions
	{
		return {
			id: ParentItemId,
			text: this.#getParentText(this.#delaySeconds),
			dataset: { testid: ParentItemId },
			items: DelayValues.map((delaySeconds) => this.#getDelayItem(delaySeconds)),
			events: {
				onSubMenuShow: (event): void => {
					const item = event.getTarget() as MenuItem;
					this.#updateSelectionState(item.getSubMenu());
				},
			},
		};
	}

	#getDelayItem(delaySeconds: UndoSendDelay): UndoSendMenuItemOptions
	{
		return {
			id: `${DelayItemIdPrefix}${delaySeconds}`,
			text: this.#getDelayText(delaySeconds),
			className: delaySeconds === this.#delaySeconds ? SelectedClassName : '',
			dataset: { testid: `${DelayItemIdPrefix}${delaySeconds}` },
			onclick: (event, item) => {
				event.preventDefault();
				void this.#save(delaySeconds, item);
			},
		};
	}

	async #save(delaySeconds: UndoSendDelay, selectedItem: MenuItem): Promise<void>
	{
		if (delaySeconds === this.#delaySeconds)
		{
			this.#closeRootMenu(selectedItem.getMenuWindow());

			return;
		}

		const revision = ++this.#saveRevision;

		try
		{
			const preference = await this.#api.setPreference({ delaySeconds });
			if (revision !== this.#saveRevision)
			{
				return;
			}

			this.#delaySeconds = preference.delaySeconds;
			this.#updateMenu(selectedItem);
			this.#closeRootMenu(selectedItem.getMenuWindow());
		}
		catch (error)
		{
			if (revision === this.#saveRevision)
			{
				this.#onSaveError(error);
			}
		}
	}

	#updateMenu(selectedItem: MenuItem): void
	{
		const subMenu = selectedItem.getMenuWindow();
		subMenu.getParentMenuItem()?.setText(this.#getParentText(this.#delaySeconds));
		this.#updateSelectionState(subMenu);
	}

	#updateSelectionState(menu: Menu | null): void
	{
		menu?.getMenuItems().forEach((item, index) => {
			const isSelected = DelayValues[index] === this.#delaySeconds;
			if (isSelected)
			{
				Dom.addClass(item.getContainer(), SelectedClassName);
			}
			else
			{
				Dom.removeClass(item.getContainer(), SelectedClassName);
			}

			Dom.attr(item.getContainer(), {
				role: 'menuitemradio',
				'aria-checked': isSelected ? 'true' : 'false',
			});
		});
	}

	#closeRootMenu(subMenu: Menu): void
	{
		(subMenu.getRootMenuWindow() ?? subMenu).close();
	}

	#getParentText(delaySeconds: UndoSendDelay): string
	{
		return Loc.getMessage('MAIL_UNDO_SEND_PREFERENCE_MENU', {
			'#VALUE#': this.#getInlineDelayText(delaySeconds),
		}) ?? '';
	}

	/**
	 * The value stands inside a sentence. Lowercasing the standalone phrase in code would break every
	 * language that capitalises nouns, so the wording for the sentence is a phrase of its own.
	 */
	#getInlineDelayText(delaySeconds: UndoSendDelay): string
	{
		if (delaySeconds === 0)
		{
			return Loc.getMessage('MAIL_UNDO_SEND_PREFERENCE_DISABLED_INLINE') ?? '';
		}

		return Loc.getMessage('MAIL_UNDO_SEND_PREFERENCE_SECONDS_INLINE', {
			'#SECONDS#': String(delaySeconds),
		}) ?? '';
	}

	#getDelayText(delaySeconds: UndoSendDelay): string
	{
		if (delaySeconds === 0)
		{
			return Loc.getMessage('MAIL_UNDO_SEND_PREFERENCE_DISABLED') ?? '';
		}

		return Loc.getMessage('MAIL_UNDO_SEND_PREFERENCE_SECONDS', {
			'#SECONDS#': String(delaySeconds),
		}) ?? '';
	}
}
