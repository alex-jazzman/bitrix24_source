import { Event, Loc, Tag, Type } from 'main.core';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { type Popup, PopupManager } from 'main.popup';
import { LiveAnnouncer } from 'ui.a11y';
import 'ui.design-tokens';
import 'ui.fonts.opensans';

import './style.css';

const USER_OPTION_CATEGORY = 'mail.guide';

export type LabelsGuideOptions = {
	id: string,
	bindElement: HTMLElement,
	userOptionName: string,
	onCreate: () => void,
};

export class LabelsGuide
{
	#popup: Popup | null = null;
	#id: string;
	#bindElement: HTMLElement;
	#userOptionName: string;
	#onCreate: () => void;

	constructor(options: LabelsGuideOptions)
	{
		this.#id = options.id;
		this.#bindElement = options.bindElement;
		this.#userOptionName = options.userOptionName;
		this.#onCreate = options.onCreate;
	}

	show(): void
	{
		if (!Type.isDomNode(this.#bindElement))
		{
			return;
		}

		BannerDispatcher.normal.toQueue((onDone: Function) => {
			const popup = this.#createPopup(onDone);
			this.#popup = popup;
			popup.show();
			popup.getZIndexComponent().setZIndex(400);
			this.#announceGuide();

			if (this.#userOptionName)
			{
				BX.userOptions.save(USER_OPTION_CATEGORY, this.#userOptionName, null, 'Y');
			}

			Event.bind(this.#bindElement, 'click', () => this.#popup?.close());

			// ui.auto-launch LaunchItemCallback is typed as `(done) => {}`; the value is ignored
			return {};
		});
	}

	#announceGuide(): void
	{
		const message = [
			Loc.getMessage('MAIL_LABELS_GUIDE_TITLE'),
			Loc.getMessage('MAIL_LABELS_GUIDE_TEXT'),
		]
			.filter((part) => Type.isStringFilled(part))
			.join('. ');

		LiveAnnouncer.announce(message);
	}

	#createPopup(onDone: Function): Popup
	{
		const titleId = `${this.#id}-title`;

		return PopupManager.create({
			id: this.#id,
			bindElement: this.#bindElement,
			closeIcon: true,
			autoHide: false,
			closeByEsc: true,
			angle: true,
			width: 320,
			ariaLabelledBy: titleId,
			content: this.#getContent(titleId),
			events: {
				onClose: () => onDone(),
			},
		});
	}

	#getContent(titleId: string): HTMLElement
	{
		const createButton = Tag.render`
			<button type="button" class="mail-labels-guide__create" data-testid="mail-labels-guide-create-btn">
				${Loc.getMessage('MAIL_LABELS_GUIDE_CREATE') ?? ''}
			</button>
		`;

		Event.bind(createButton, 'click', (): void => {
			this.#popup?.close();
			this.#onCreate();
		});

		return Tag.render`
			<div class="mail-labels-guide" data-testid="mail-labels-guide">
				<div id="${titleId}" class="mail-labels-guide__title">${Loc.getMessage('MAIL_LABELS_GUIDE_TITLE') ?? ''}</div>
				<div class="mail-labels-guide__description">${Loc.getMessage('MAIL_LABELS_GUIDE_TEXT') ?? ''}</div>
				${createButton}
			</div>
		`;
	}
}
