import { Loc, Reflection, Runtime } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { Api } from 'sign.v2.api';

export class EditorIntegration
{
	#api: Api;
	#onApplied: (documentData: Object, newBlankId: number) => Promise<void>;
	#onFinished: () => void;

	constructor(
		api: Api,
		onApplied: (documentData: Object, newBlankId: number) => Promise<void>,
		onFinished: () => void = () => {},
	)
	{
		this.#api = api;
		this.#onApplied = onApplied;
		this.#onFinished = onFinished;
	}

	async openEditor(documentData: Object): Promise<?{ diskFileId: number }>
	{
		const { editUrl, diskFileId } = await this.#api.getEditUrl(documentData.uid);
		if (!editUrl)
		{
			return null;
		}

		let fileSaved = false;
		let editorClosed = false;
		let documentWasChanged = false;

		const tryApply = async () => {
			if (!fileSaved || !editorClosed)
			{
				if (editorClosed && !documentWasChanged)
				{
					unsubscribeAll();
					await this.#discardEditedFile(documentData, diskFileId);
					this.#onFinished();
				}

				return;
			}

			unsubscribeAll();
			await this.#applyEditedFile(documentData, diskFileId);
		};

		const handleSaved = (event: BaseEvent) => {
			const data = event.getData();
			const object = Array.isArray(data) ? data[0] : data?.object;
			if (Number(object?.id) !== diskFileId)
			{
				return;
			}

			fileSaved = true;
			tryApply();
		};

		const handleClosed = (event: BaseEvent) => {
			const [sliderEvent] = event.getData();

			if (sliderEvent.getEventId() !== 'Disk.OnlyOffice:onClosed')
			{
				return;
			}

			const eventData = sliderEvent.getData();
			if (Number(eventData?.object?.id) !== diskFileId)
			{
				return;
			}

			documentWasChanged = Boolean(eventData?.documentWasChanged);
		};

		const handleSliderClosed = () => {
			editorClosed = true;
			tryApply();
		};

		const unsubscribeAll = () => {
			EventEmitter.unsubscribe('Disk.OnlyOffice:onSaved', handleSaved);
			EventEmitter.unsubscribe('SidePanel.Slider:onMessage', handleClosed);
		};

		await Runtime.loadExtension('disk');
		EventEmitter.subscribe('Disk.OnlyOffice:onSaved', handleSaved);
		EventEmitter.subscribe('SidePanel.Slider:onMessage', handleClosed);

		Reflection.getClass('BX.SidePanel').Instance.open(editUrl, {
			width: '100%',
			cacheable: false,
			customLeftBoundary: 30,
			allowChangeHistory: false,
			data: { documentEditor: true },
			events: {
				onCloseComplete: handleSliderClosed,
			},
		});

		return { diskFileId };
	}

	async #applyEditedFile(documentData: Object, diskFileId: number): Promise<void>
	{
		try
		{
			const { blankId } = await this.#api.applyEditedFile(documentData.uid, diskFileId);
			await this.#onApplied(documentData, blankId);
		}
		catch (applyError)
		{
			console.error(applyError);
			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_V2_B2E_DOCUMENT_SETUP_EDITOR_APPLY_ERROR'),
			});
		}
		finally
		{
			this.#onFinished();
		}
	}

	async #discardEditedFile(documentData: Object, diskFileId: number): Promise<void>
	{
		try
		{
			await this.#api.discardEditedFile(documentData.uid, diskFileId);
		}
		catch (discardError)
		{
			console.error(discardError);
		}
	}
}
