import { Loc, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize, CancelButton } from 'ui.buttons';
import { Dialog, DialogBackground } from 'ui.system.dialog';

import { ButtonRole, ConfirmPreset, getPresetDefaults } from './const';

export type ConfirmResult = 'confirm' | 'cancel' | 'dismiss';

export type ConfirmOptions = {
	title?: string,
	content: HTMLElement,
	preset?: string, // ConfirmPreset, default ConfirmPreset.OK_CANCEL
	confirmText?: string,
	cancelText?: string,
	destructive?: boolean,
	width?: number,
	onConfirm?: () => Promise<void> | void,
	onDismiss?: () => void,
};

export type AlertOptions = {
	title?: string,
	content: HTMLElement,
	confirmText?: string,
	width?: number,
};

let activeInstance = null;

function createPrimaryButton(text: string, role: string, onclick: (button: Button) => void): Button
{
	return new Button({
		text,
		size: ButtonSize.LARGE,
		useAirDesign: true,
		style: role === ButtonRole.DESTRUCTIVE ? AirButtonStyle.FILLED_ALERT : AirButtonStyle.FILLED,
		dataset: { testid: 'crm-timeline-dialog-confirm-btn' },
		onclick,
	});
}

function createCancelButton(text: string, onclick: () => void): CancelButton
{
	return new CancelButton({
		text,
		size: ButtonSize.LARGE,
		useAirDesign: true,
		style: AirButtonStyle.OUTLINE,
		dataset: { testid: 'crm-timeline-dialog-cancel-btn' },
		onclick,
	});
}

function open(
	options: ConfirmOptions | AlertOptions,
	buildCenterButtons: (finish: (result: ConfirmResult) => void) => Button[],
): Promise<ConfirmResult>
{
	if (activeInstance)
	{
		activeInstance.forceDismiss();
	}

	return new Promise((resolve) => {
		let settled = false;

		const finish = (result: ConfirmResult) => {
			if (settled)
			{
				return;
			}

			settled = true;

			if (activeInstance === instance)
			{
				activeInstance = null;
			}

			instance.hide();
			resolve(result);
		};

		const instance = new Dialog({
			title: options.title,
			content: options.content,
			width: options.width,
			hasOverlay: true,
			background: DialogBackground.vibrant,
			closeByEsc: true,
			closeByClickOutside: true,
			centerButtons: buildCenterButtons(finish),
			events: {
				onHide: () => {
					if (!settled)
					{
						options.onDismiss?.();
						finish('dismiss');
					}
				},
			},
		});

		instance.forceDismiss = () => {
			options.onDismiss?.();
			finish('dismiss');
		};

		activeInstance = instance;

		instance.show();
	});
}

export function confirm(options: ConfirmOptions): Promise<ConfirmResult>
{
	const defaults = getPresetDefaults(options.preset ?? ConfirmPreset.OK_CANCEL);
	const confirmText = options.confirmText ?? defaults.confirmText;
	const cancelText = options.cancelText ?? defaults.cancelText;
	const primaryRole = options.destructive === true ? ButtonRole.DESTRUCTIVE : ButtonRole.PRIMARY;

	return open(options, (finish) => {
		const primaryButton = createPrimaryButton(confirmText, primaryRole, (button) => {
			if (Type.isFunction(options.onConfirm))
			{
				button.setWaiting(true);

				Promise.resolve()
					.then(() => options.onConfirm())
					.then(() => {
						button.setWaiting(false);
						finish('confirm');
					})
					.catch(() => {
						// диалог остаётся открытым, promise не резолвится (ALG-01)
						button.setWaiting(false);
					})
				;

				return;
			}

			finish('confirm');
		});

		const cancelButton = createCancelButton(cancelText, () => finish('cancel'));

		return [primaryButton, cancelButton];
	});
}

export function alert(options: AlertOptions): Promise<void>
{
	const confirmText = options.confirmText ?? Loc.getMessage('CRM_TIMELINE_DIALOG_OK');

	return open(options, (finish) => [
		createPrimaryButton(confirmText, ButtonRole.PRIMARY, () => finish('confirm')),
	]).then(() => {});
}
