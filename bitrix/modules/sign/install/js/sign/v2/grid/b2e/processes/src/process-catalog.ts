import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { FocusNavigator } from 'ui.a11y';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';

import { openRunProcess } from './run-process';
import { type CatalogProcess } from './type';

import './style.css';

const RUN_BUTTON_SELECTOR = '[data-role="sign-b2e-process-run"]';

/**
 * Client half of the catalog page. The rows are built by the component of the page; this class answers
 * only for the "run" button of a row and sends the chosen process to the same public point the submenu
 * uses.
 */
export class ProcessCatalog
{
	static #instance: ProcessCatalog | null = null;

	/**
	 * Entry point of the page. The grid reloads over ajax and replaces its own rows, so the handler is
	 * delegated and installed once - a repeated call after a reload changes nothing.
	 */
	static bind(): void
	{
		if (ProcessCatalog.#instance !== null)
		{
			return;
		}

		ProcessCatalog.#instance = new ProcessCatalog();
		ProcessCatalog.#instance.#subscribe();
	}

	#subscribe(): void
	{
		Event.bind(document, 'click', this.#handleClick);
	}

	#handleClick = (event: MouseEvent): void => {
		const target = event.target;
		if (!Type.isDomNode(target))
		{
			return;
		}

		const button = (target as HTMLElement).closest(RUN_BUTTON_SELECTOR);
		if (button === null)
		{
			return;
		}

		const process = ProcessCatalog.#readProcess(button as HTMLElement);
		if (process === null)
		{
			return;
		}

		// tuning the constants is the work of the setter of the process, so an untuned one still starts:
		// the personnel officer is told what to expect and decides
		if (process.isConstantsTuned)
		{
			void openRunProcess(process);

			return;
		}

		this.#warnAboutConstants(process);
	};

	static #readProcess(button: HTMLElement): CatalogProcess | null
	{
		try
		{
			return JSON.parse(button.dataset.process ?? '');
		}
		catch
		{
			return null;
		}
	}

	#warnAboutConstants(process: CatalogProcess): void
	{
		const title = Loc.getMessage('SIGN_B2E_PROCESS_CATALOG_CONSTANTS_TITLE') ?? '';
		const content = Tag.render`
			<div class="sign-b2e-process-catalog__dialog" data-testid="sign-b2e-process-catalog-constants">
				${Loc.getMessage('SIGN_B2E_PROCESS_CATALOG_CONSTANTS_TEXT')}
			</div>
		`;

		const dialog: Dialog = new Dialog({
			title,
			content,
			hasOverlay: true,
			leftButtons: [
				new Button({
					useAirDesign: true,
					style: AirButtonStyle.FILLED,
					size: ButtonSize.LARGE,
					collapsedIcon: ButtonIcon.START,
					text: Loc.getMessage('SIGN_B2E_PROCESS_CATALOG_CONSTANTS_RUN') ?? '',
					dataset: { testid: 'sign-b2e-process-catalog-constants-run' },
					onclick: async () => {
						dialog.hide();
						await openRunProcess(process);
					},
				}),
				new Button({
					useAirDesign: true,
					style: AirButtonStyle.PLAIN,
					size: ButtonSize.LARGE,
					collapsedIcon: ButtonIcon.CANCEL,
					text: Loc.getMessage('SIGN_B2E_PROCESS_CATALOG_CONSTANTS_CANCEL') ?? '',
					dataset: { testid: 'sign-b2e-process-catalog-constants-cancel' },
					onclick: () => {
						dialog.hide();

						return true;
					},
				}),
			],
		});
		dialog.subscribe('onAfterShow', () => ProcessCatalog.#nameDialogAndMoveFocus(content, title));

		dialog.show();
	}

	/**
	 * `ui.system.dialog` neither names its dialog nor moves the focus into it, and keeps the container of
	 * its popup private: the content is the only node the caller holds on to.
	 */
	static #nameDialogAndMoveFocus(content: HTMLElement, title: string): void
	{
		const container = content.closest('[role="dialog"]') as HTMLElement | null;
		if (container === null)
		{
			return;
		}

		Dom.attr(container, 'aria-label', title);
		FocusNavigator.focusContainer(container);
	}
}
