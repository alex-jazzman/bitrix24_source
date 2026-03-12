import { Type, Event, Runtime } from 'main.core';
import { Dialog } from 'ui.entity-selector';
import { EventEmitter, BaseEvent } from 'main.core.events';

export type StorageSelectorOptions = {
	dialogId: string,
	storageCodeInput: HTMLTextAreaElement,
	onStateChange: () => void,
};

export class StorageSelector
{
	#dialogId: string;
	#dialog: ?Dialog = null;
	#codeInput: ?HTMLTextAreaElement = null;
	#onStateChange: () => void;
	#isUpdating: boolean = false;

	constructor(options: StorageSelectorOptions)
	{
		this.#dialogId = options.dialogId;
		this.#codeInput = options.storageCodeInput;
		this.#onStateChange = options.onStateChange;

		this.#initRouter();
	}

	init(): void
	{
		this.#dialog = Dialog.getById(this.#dialogId);

		this.#bindEvents();
	}

	#initRouter(): void
	{
		Runtime
			.loadExtension('bizproc.router')
			.then(({ Router }) => Router.init())
			.catch((e) => console.error(e));
	}

	#bindEvents(): void
	{
		if (this.#dialog)
		{
			const handler = this.#onDialogChange.bind(this);
			this.#dialog.subscribe('Item:onSelect', handler);
			this.#dialog.subscribe('Item:onDeselect', handler);
		}

		if (this.#codeInput)
		{
			Event.bind(this.#codeInput, 'change', this.#onCodeInputChange.bind(this));
		}

		EventEmitter.subscribe(
			'BX.Bizproc.Component.StorageItemList:onStorageRemove',
			this.#onStorageRemove.bind(this),
		);
	}

	#onDialogChange(event: BaseEvent): void
	{
		if (this.#isUpdating)
		{
			return;
		}

		const data = event.getData();
		const storageId = Number(data.item.id);

		if (storageId > 0 && this.#codeInput)
		{
			this.#codeInput.value = '';
		}

		this.#notifyStateChange(storageId);
	}

	#onCodeInputChange(): void
	{
		const currentDialogSelection = this.#dialog?.selectedItems.values()?.next()?.value;
		if (currentDialogSelection && this.#dialog)
		{
			this.#deselectDialog();
		}

		this.#notifyStateChange();
	}

	#deselectDialog(): void
	{
		this.#isUpdating = true;
		this.#dialog.deselectAll();
		this.#isUpdating = false;
	}

	#notifyStateChange(storageId: number = 0): void
	{
		if (Type.isFunction(this.#onStateChange))
		{
			this.#onStateChange(storageId);
		}
	}

	#onStorageRemove(event: BaseEvent): void
	{
		const storageId = Number(event.getData().storageId);
		if (storageId <= 0 || !this.#dialog)
		{
			return;
		}

		const item = this.#dialog.getItem({
			id: storageId,
			entityId: 'bizproc-storage',
		});

		if (item)
		{
			this.#dialog.removeItem(item);
			this.#notifyStateChange();
		}
	}
}
