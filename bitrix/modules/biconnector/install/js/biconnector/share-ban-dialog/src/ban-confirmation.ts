import { Loc, Tag } from 'main.core';
import { Loader } from 'main.loader';
import { AirButtonStyle, Button, ButtonSize, type ButtonOptions } from 'ui.buttons';
import { Dialog, type DialogOptions } from 'ui.system.dialog';

import { phrase } from './phrase';

export type ShareSummary = {
	activeCount: number,
	isBanned: boolean,
	title: string,
};

// Shows a loader until the summary is set: the confirm button is unavailable while the text is unknown.
export class BanConfirmation
{
	#dialog: Dialog;
	#confirmButton: Button;
	#result: Promise<boolean>;
	#isConfirmed: boolean = false;
	#isClosed: boolean = false;
	#isClosedByCaller: boolean = false;

	constructor()
	{
		const confirmText = phrase('BICONNECTOR_SHARE_BAN_DIALOG_BAN_BUTTON');
		this.#confirmButton = createButton(confirmText, AirButtonStyle.FILLED, () => {
			this.#isConfirmed = true;
			this.#dialog.hide();
		});
		this.#confirmButton.setDisabled(true);

		const loaderNode: HTMLElement = Tag.render`<div class="biconnector-share-ban-dialog-popup-loader"></div>`;
		void new Loader({ target: loaderNode, size: 40 }).show();

		const cancelText = phrase('BICONNECTOR_SHARE_BAN_DIALOG_CANCEL');
		this.#dialog = new Dialog({
			content: loaderNode,
			centerButtons: [
				this.#confirmButton,
				createButton(cancelText, AirButtonStyle.PLAIN, () => this.#dialog.hide()),
			],
			hasOverlay: true,
			width: 480,
		} as DialogOptions);

		this.#result = new Promise((resolve) => {
			this.#dialog.subscribe('onHide', () => {
				this.#isClosed = true;
				resolve(this.#isConfirmed);
			});
		});
	}

	show(): void
	{
		this.#dialog.show();
	}

	setSummary(summary: ShareSummary): void
	{
		this.#dialog.setTitle(phrase('BICONNECTOR_SHARE_BAN_DIALOG_BAN_TITLE', { '#TITLE#': summary.title }));
		this.#dialog.setContent(
			Tag.render`<div class="biconnector-share-ban-dialog-popup-content">${buildBanContent(summary)}</div>`,
		);
		this.#confirmButton.setDisabled(false);
	}

	getResult(): Promise<boolean>
	{
		return this.#result;
	}

	close(): void
	{
		if (!this.#isClosed)
		{
			this.#isClosedByCaller = true;
			this.#dialog.hide();
		}
	}

	isClosed(): boolean
	{
		return this.#isClosed;
	}

	isCancelled(): boolean
	{
		return this.#isClosed && !this.#isClosedByCaller;
	}
}

function buildBanContent(summary: ShareSummary): string
{
	if (summary.activeCount <= 0)
	{
		return phrase('BICONNECTOR_SHARE_BAN_DIALOG_BAN_TEXT_EMPTY');
	}

	const countLine = Loc.getMessagePlural('BICONNECTOR_SHARE_BAN_DIALOG_BAN_TEXT_COUNT', summary.activeCount, {
		'#COUNT#': String(summary.activeCount),
	}) ?? '';

	return `${countLine} ${phrase('BICONNECTOR_SHARE_BAN_DIALOG_BAN_TEXT_ACTIVE')}`;
}

function createButton(text: string, style: string, onClick: () => void): Button
{
	const options: Partial<ButtonOptions> = {
		text,
		size: ButtonSize.LARGE,
		style,
		useAirDesign: true,
		onclick: (): {} => {
			onClick();

			return {};
		},
	};

	return new Button(options as ButtonOptions);
}
