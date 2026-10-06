import { Dom, Reflection } from 'main.core';
import { Alert, AlertColor, AlertIcon } from 'ui.alerts';
import { Center } from 'ui.notification';

import { pickPanelData } from './save-request';
import { HtmlEditorAdapter } from './html-editor-adapter';
import {
	type AjaxErrorResponse,
	type SignatureEditorCapability,
	type SignatureEditorOptions,
} from './types';
import './style.css';

type SidePanelManager = {
	Instance: {
		getTopSlider: () => object | null,
		postMessage: (slider: object, eventId: string, data: Record<string, number>) => void,
	},
};

export class SignatureEditor
{
	#options: SignatureEditorOptions;
	#editor: HtmlEditorAdapter;
	#connectedCapabilities: SignatureEditorCapability[] = [];
	#saveInProgress: boolean = false;
	#destroyed: boolean = false;

	constructor(options: SignatureEditorOptions)
	{
		this.#options = options;
		this.#editor = new HtmlEditorAdapter(options.editorInstanceId);
		this.#editor.syncToolbar();
		this.#editor.subscribeToViewModeChanges();
		Dom.attr(options.alertContainer, {
			role: 'alert',
			'aria-live': 'assertive',
			'aria-atomic': 'true',
		});

		if (options.panel && options.panelContainer)
		{
			options.panel.renderTo(options.panelContainer);
		}

		if (options.scopeCard && options.scopeCardContainer)
		{
			options.scopeCard.subscribeToScope((shared: boolean) => {
				this.#applyScope(shared);
			});
			options.scopeCard.renderTo(options.scopeCardContainer);
			this.#applyScope(options.scopeCard.isSharedScope());
		}

		for (const capability of options.capabilities ?? [])
		{
			capability.connect({
				editor: this.#editor,
				showError: (text: string) => this.showError(text),
				clearError: () => this.clearError(),
			});
			this.#connectedCapabilities.push(capability);
		}
	}

	save(closeAfter: boolean = false): void
	{
		void this.#save(closeAfter);
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		for (const capability of this.#connectedCapabilities)
		{
			capability.disconnect?.();
		}
		this.#connectedCapabilities = [];
	}

	async #save(closeAfter: boolean): Promise<void>
	{
		if (this.#saveInProgress || this.#destroyed)
		{
			return;
		}

		const { signatureId, scopeCard, transport } = this.#options;

		// The card says what is missing in its own place on the screen, so there is nothing to add
		if (scopeCard && !scopeCard.validate())
		{
			return;
		}

		this.#saveInProgress = true;
		const isNew = signatureId <= 0;

		try
		{
			if (this.#connectedCapabilities.length > 0 && !await this.#runBeforeSave())
			{
				return;
			}

			const savedId = await transport.save({
				signatureId,
				signature: this.#editor.getContent(),
				panelData: pickPanelData(this.#options),
			});

			if (isNew || closeAfter)
			{
				this.closeSlider(savedId);
			}
			else
			{
				Center.notify({ content: transport.getUpdateSuccessText() });
			}
		}
		catch (response)
		{
			this.showError(this.#getErrorMessage(response));
		}
		finally
		{
			this.#saveInProgress = false;
		}
	}

	showError(text: string): void
	{
		// Alert Flow typings mark all options as required, the runtime does not
		const alert = new Alert({
			color: AlertColor.DANGER,
			icon: AlertIcon.DANGER,
			text,
		} as unknown as ConstructorParameters<typeof Alert>[0]);

		Dom.clean(this.#options.alertContainer);
		Dom.append(alert.getContainer(), this.#options.alertContainer);
	}

	clearError(): void
	{
		Dom.clean(this.#options.alertContainer);
	}

	closeSlider(signatureId: number): void
	{
		const { eventId, idKey } = this.#options.sliderMessage;
		const sidePanel = Reflection.getClass('BX.SidePanel') as SidePanelManager | null;

		if (sidePanel)
		{
			const slider = sidePanel.Instance.getTopSlider();
			if (slider)
			{
				sidePanel.Instance.postMessage(slider, eventId, { [idKey]: signatureId });
			}
		}

		document.getElementById('ui-button-panel-close')?.click();
	}

	/*
	 * The sender card and the assignments are the two answers to one question, so only one of them
	 * is on the screen. Hiding keeps the card rendered: the chosen sender survives the switcher
	 * being flicked back and forth, and the text of the signature belongs to the first card, which
	 * neither of them touches.
	 */
	#applyScope(shared: boolean): void
	{
		const { panelContainer } = this.#options;

		if (panelContainer)
		{
			Dom.style(panelContainer, 'display', shared ? 'none' : '');
		}
	}

	#getErrorMessage(response: unknown): string
	{
		if (response instanceof Error)
		{
			return response.message;
		}

		const ajaxResponse = response as AjaxErrorResponse;

		const errors = ajaxResponse.errors ?? [];

		return errors[errors.length - 1]?.message ?? '';
	}

	async #runBeforeSave(index: number = 0): Promise<boolean>
	{
		const capability = this.#connectedCapabilities[index];
		if (!capability)
		{
			return true;
		}

		if (!await capability.beforeSave())
		{
			return false;
		}

		if (this.#destroyed)
		{
			return false;
		}

		return this.#runBeforeSave(index + 1);
	}
}
