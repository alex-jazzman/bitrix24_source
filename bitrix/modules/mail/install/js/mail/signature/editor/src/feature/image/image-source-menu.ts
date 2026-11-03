import { Dom, Event, Loc, Reflection } from 'main.core';
import { Button } from 'ui.buttons';

type ImageSourceCapability = {
	prepareInsertion(anchor?: HTMLElement | null): void,
	chooseLocal(): Promise<void>,
	chooseDisk(): Promise<void>,
};

type HtmlEditorToolbarControl = {
	className?: string,
	title?: string,
	disabled?: boolean,
	pCont: HTMLElement,
	GetCont(): HTMLElement,
	Disable(disabled: boolean): void,
};

type HtmlEditorInstance = {
	toolbar?: {
		controls?: {
			InsertImage?: HtmlEditorToolbarControl,
		},
	},
};

type HtmlEditorManager = {
	Get(id: string): HtmlEditorInstance | false | null | undefined,
};

export type ImageSourceMenuOptions = {
	editorInstanceId: string,
	capability: ImageSourceCapability,
};

export class ImageSourceMenu
{
	#options: ImageSourceMenuOptions;
	#button: Button | null = null;
	#control: HtmlEditorToolbarControl | null = null;
	#originalContainer: HTMLElement | null = null;
	#originalDisable: HtmlEditorToolbarControl['Disable'] | null = null;
	#prepareInsertion: (() => void) | null = null;

	constructor(options: ImageSourceMenuOptions)
	{
		this.#options = options;
	}

	attach(): boolean
	{
		if (this.#button)
		{
			return true;
		}

		const control = this.#resolveControl();
		const originalContainer = control?.GetCont();
		if (!control || !(originalContainer instanceof HTMLElement))
		{
			return false;
		}

		const label = Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_INSERT') || control.title || '';
		const button = new Button({
			baseClass: control.className || originalContainer.className,
			className: 'mail-signature-editor-image-button',
			collapsedIcon: '',
			dropdown: false,
			props: {
				type: 'button',
				title: label,
				'aria-label': label,
				'aria-haspopup': 'menu',
				'aria-expanded': 'false',
			},
			systemMenu: {
				items: [
					{
						id: 'mail-signature-editor-image-local',
						title: Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_SOURCE_LOCAL') || '',
						onClick: (): void => {
							void this.#options.capability.chooseLocal();
						},
					},
					{
						id: 'mail-signature-editor-image-disk',
						title: Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_SOURCE_DISK') || '',
						onClick: (): void => {
							void this.#options.capability.chooseDisk();
						},
					},
				],
			},
		});
		const buttonContainer = button.render();
		this.#prepareInsertion = (): void => this.#options.capability.prepareInsertion(buttonContainer);
		Event.bind(buttonContainer, 'focusin', this.#prepareInsertion);
		Event.bind(buttonContainer, 'click', this.#prepareInsertion);
		const icon = document.createElement('i');
		icon.setAttribute('aria-hidden', 'true');
		Dom.append(icon, buttonContainer);

		this.#control = control;
		this.#button = button;
		this.#originalContainer = originalContainer;
		this.#originalDisable = control.Disable;
		control.pCont = buttonContainer;
		control.Disable = (disabled: boolean): void => {
			this.#originalDisable?.call(control, disabled);
			button.setDisabled(disabled);
		};
		button.setDisabled(control.disabled === true);
		Dom.replace(originalContainer, buttonContainer);

		return true;
	}

	destroy(): void
	{
		if (!this.#button || !this.#control || !this.#originalContainer || !this.#originalDisable)
		{
			return;
		}

		const buttonContainer = this.#button.getContainer();
		if (this.#prepareInsertion)
		{
			Event.unbind(buttonContainer, 'focusin', this.#prepareInsertion);
			Event.unbind(buttonContainer, 'click', this.#prepareInsertion);
		}
		this.#button.setSystemMenu(false);
		this.#control.pCont = this.#originalContainer;
		this.#control.Disable = this.#originalDisable;

		if (buttonContainer.parentNode)
		{
			Dom.replace(buttonContainer, this.#originalContainer);
		}

		this.#button = null;
		this.#control = null;
		this.#originalContainer = null;
		this.#originalDisable = null;
		this.#prepareInsertion = null;
	}

	#resolveControl(): HtmlEditorToolbarControl | null
	{
		const manager = Reflection.getClass('BXHtmlEditor') as unknown as HtmlEditorManager | null;
		const editor = manager?.Get(this.#options.editorInstanceId);

		return editor ? editor.toolbar?.controls?.InsertImage ?? null : null;
	}
}
