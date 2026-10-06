import { Loc, Tag, Type } from 'main.core';
import { PopupManager, type Popup } from 'main.popup';
import { BannerDispatcher } from 'ui.banner-dispatcher';

export type AhaGuideParams = {
	formId: string,
	optionName: string,
};

// Must match Bitrix\Mail\Helper\Config\Guide::USER_OPTION_CATEGORY so the server-side
// wasLargeAttachmentAhaShown() check reads the mark saved here. The option name itself
// is passed in from PHP (Guide::getLargeAttachmentAhaGuideOptionName()) to avoid drift.
const USER_OPTION_CATEGORY = 'mail.guide';
const POPUP_ID = 'mail-large-attachment-aha-guide';
const UPLOADER_SELECTOR = '.disk-user-field-control';
const POPUP_WIDTH = 320;
const AUTO_DISMISS_DELAY = 12000;

type UserOptionsGlobal = {
	userOptions: {
		save(category: string, name: string, valueName: string | null, value: string): void,
	},
};

// One-time contextual onboarding shown next to the file uploader on the first large
// attachment (SC-002). No CTA (AC-012); closes by the cross icon, outside click or
// auto-dismiss (AC-013); shown once per user (AC-010) via ui.banner-dispatcher + BX.userOptions.
export class AhaGuide
{
	#formId: string;
	#optionName: string;
	#popup: Popup | null = null;
	#shown: boolean = false;
	#autoDismissTimer: number | null = null;

	constructor(params: AhaGuideParams)
	{
		this.#formId = params.formId;
		this.#optionName = params.optionName;
	}

	show(): void
	{
		if (this.#shown)
		{
			return;
		}

		const bindElement = this.#resolveBindElement();
		if (!bindElement)
		{
			return;
		}

		this.#shown = true;

		BannerDispatcher.normal.toQueue((onDone: Function): Popup => {
			this.#popup = this.#createPopup(bindElement, onDone);
			this.#popup.show();
			this.#save();

			this.#autoDismissTimer = window.setTimeout(
				(): void => this.#popup?.close(),
				AUTO_DISMISS_DELAY,
			);

			return this.#popup;
		});
	}

	destroy(): void
	{
		if (this.#autoDismissTimer !== null)
		{
			window.clearTimeout(this.#autoDismissTimer);
			this.#autoDismissTimer = null;
		}

		this.#popup?.close();
		this.#popup = null;
	}

	#resolveBindElement(): HTMLElement | null
	{
		const form = document.getElementById(this.#formId);
		const uploader = form?.querySelector(UPLOADER_SELECTOR) ?? null;

		return uploader instanceof HTMLElement ? uploader : null;
	}

	#createPopup(bindElement: HTMLElement, onDone: Function): Popup
	{
		return PopupManager.create({
			id: POPUP_ID,
			bindElement,
			closeIcon: true,
			autoHide: true,
			closeByEsc: true,
			width: POPUP_WIDTH,
			angle: { offset: 40, position: 'top' },
			content: this.#renderContent(),
			events: {
				onClose: (): void => {
					onDone();
				},
			},
		});
	}

	#renderContent(): HTMLElement
	{
		const content: HTMLElement = Tag.render`
			<div
				class="mail-large-attachment-aha"
				data-testid="mail-large-attachment-aha-guide"
			></div>
		`;
		content.textContent = Loc.getMessage('MAIL_LARGE_ATTACHMENT_AHA_TEXT') ?? '';

		return content;
	}

	#save(): void
	{
		if (!Type.isStringFilled(this.#optionName))
		{
			return;
		}

		(BX as unknown as UserOptionsGlobal).userOptions.save(
			USER_OPTION_CATEGORY,
			this.#optionName,
			null,
			'Y',
		);
	}
}
