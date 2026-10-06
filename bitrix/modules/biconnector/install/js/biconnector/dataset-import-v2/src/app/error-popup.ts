import { Loc, Tag, Text } from 'main.core';
import { Popup } from 'main.popup';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import type { ButtonOptions } from 'ui.buttons';
import { Icon, Outline } from 'ui.icon-set.api.core';

export function showErrorPopup(
	error: { errors?: Array<{ message: string }>, message?: string } | unknown,
	title?: string | null,
): void
{
	const safeTitle = title ?? Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE') ?? '';
	const message = (error as { errors?: Array<{ message: string }> })?.errors?.[0]?.message
		|| (error as { message?: string })?.message
		|| Loc.getMessage('DATASET_IMPORT_V2_SAVE_ERROR')
		|| '';

	const content = Tag.render`
		<div class="biconnector-dataset-import-v2-error-popup" data-testid="dataset-import-error-popup">
			<div class="biconnector-dataset-import-v2-error-popup__body">
				<div class="biconnector-dataset-import-v2-error-popup__mascot"></div>
				<div class="biconnector-dataset-import-v2-error-popup__text">
					<h3 class="biconnector-dataset-import-v2-error-popup__title" id="biconnector-dataset-import-v2-error-popup-title">${Text.encode(safeTitle)}</h3>
					<div class="biconnector-dataset-import-v2-error-popup__description">${Text.encode(message)}</div>
				</div>
			</div>
			<div class="biconnector-dataset-import-v2-error-popup__actions"></div>
		</div>
	`;

	const popup: any = new Popup({
		id: 'biconnector-import-v2-save-error',
		content,
		className: 'biconnector-dataset-import-v2-error-popup',
		width: 400,
		padding: 0,
		autoHide: false,
		fixed: true,
		overlay: true,
		closeIcon: false,
		closeByEsc: true,
		cacheable: false,
		ariaLabelledBy: 'biconnector-dataset-import-v2-error-popup-title',
		focusTrap: {
			initialFocus: 'first-tabbable',
		},
	} as any);

	const closeButton = Tag.render`
		<button
			type="button"
			class="biconnector-dataset-import-v2-error-popup__close"
			aria-label="${Loc.getMessage('DATASET_IMPORT_V2_POPUP_CLOSE')}"
			data-testid="dataset-import-error-popup-close-btn"
		></button>
	`;
	const closeIcon = new Icon({ icon: Outline.CROSS_L, size: 28 }).render();
	closeIcon.setAttribute('aria-hidden', 'true');
	closeButton.append(closeIcon);
	closeButton.addEventListener('click', () => popup.close());
	content.prepend(closeButton);

	const okButtonOptions: Partial<ButtonOptions> = {
		useAirDesign: true,
		text: Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_OK') ?? '',
		style: AirButtonStyle.FILLED,
		size: ButtonSize.LARGE,
		onclick: (): {} => {
			popup.close();

			return {};
		},
	};
	const okButton = new Button(okButtonOptions as ButtonOptions);
	okButton.render().dataset.testid = 'dataset-import-error-popup-ok-btn';
	content.querySelector('.biconnector-dataset-import-v2-error-popup__actions')?.append(okButton.render());

	popup.show();
}
