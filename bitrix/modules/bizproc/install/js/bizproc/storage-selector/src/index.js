import { Type, Event, Runtime, Tag, Text, Loc } from 'main.core';
import { Dialog } from 'ui.entity-selector';
import { EventEmitter, BaseEvent } from 'main.core.events';

export type StorageSelectorOptions = {
	dialogId: string,
	storageCodeInput: HTMLElement,
	onStateChange: (storageId: number) => void,
	initialValue?: string,
	footerOptions?: {
		label: string,
		itemLink: string,
	},
};

export function mapStorageBlocksToFilterFields(
	storageBlocks: Array<Object>,
	baseFieldsMap: Map<string, any>,
): Map<string, any>
{
	const result = new Map(baseFieldsMap);

	for (const block of storageBlocks)
	{
		const properties = block.activity?.Properties;
		if (!properties?.StorageCode || !Type.isArrayFilled(properties.SelectedFields))
		{
			continue;
		}

		const dynamicFields = properties.SelectedFields.map((field) => ({
			Id: field.code,
			Name: field.name,
			Type: field.type,
			Expression: `{{${field.name}}}`,
			SystemExpression: `{=Storage:{${field.code}}}`,
			Options: field.settings || null,
			Settings: field.settings || null,
			Multiple: field.multiple || false,
		}));

		const baseFields = Object.values(result.get('0') || {});
		result.set(String(properties.StorageCode), [...baseFields, ...dynamicFields]);
	}

	return result;
}

export function resolveCurrentStorageId(form: HTMLFormElement, codeFieldName: string = 'storage_code'): string
{
	const storageInput = form.querySelector('input[name="storage_id"]');
	const storageIdValue = storageInput?.value || '';
	const storageCodeValue = form[codeFieldName]?.value || '';

	return (!storageIdValue || storageIdValue === '0')
		? storageCodeValue
		: storageIdValue
	;
}

export class StorageSelector
{
	dialogId: string;
	#dialog: ?Dialog = null;
	#onStateChange: (storageId: number) => void;
	#isUpdating: boolean = false;
	#footerOptions: ?Object = null;
	#initialValue: string = '';
	#storageCodeInput: ?HTMLElement = null;
	#dynamicStorageCodes: Set<string> = new Set();

	constructor(options: StorageSelectorOptions)
	{
		this.dialogId = options.dialogId;
		this.#onStateChange = options.onStateChange;
		this.#initialValue = options.initialValue || '';
		this.#footerOptions = options.footerOptions || null;
		this.#storageCodeInput = options.storageCodeInput || null;

		this.#initRouter();
	}

	init(): void
	{
		this.#dialog = Dialog.getById(this.dialogId);

		if (this.#dialog && this.#footerOptions)
		{
			this.#setupFooter();
		}

		this.#bindEvents();

		EventEmitter.subscribeOnce('BX.Bizproc.CommonNodeSettings:onBlocksReady', (event: BaseEvent) => {
			const { blocks } = event.getData();
			const storageBlocks = (blocks || []).filter(
				(block) => block.activity?.Type === 'CreateStorageNode',
			);

			storageBlocks.forEach((block) => {
				const properties = block.activity?.Properties ?? {};
				if (Type.isStringFilled(properties.StorageCode) && Type.isFunction(this.#dialog.addItem))
				{
					this.#dynamicStorageCodes.add(String(properties.StorageCode));
					this.#dialog.addItem({
						id: properties.StorageCode,
						entityId: 'dynamic-storage',
						title: properties.StorageTitle,
						caption: Loc.getMessage('BIZPROC_JS_STORAGE_SELECTOR_DYNAMIC') || '',
						tabs: 'recents',
					});
				}
			});

			if (Type.isFunction(this.#dialog.getItem))
			{
				const item = this.#dialog.getItem({
					id: this.#initialValue,
					entityId: 'dynamic-storage',
				});

				if (item)
				{
					this.#isUpdating = true;
					item.select();
					this.#isUpdating = false;
				}
			}
		});
	}

	#setupFooter(): void
	{
		const label = this.#footerOptions?.label || '';
		const footer = Tag.render`
			<span class="ui-selector-footer-link ui-selector-footer-link-add">
				${Text.encode(label)}
			</span>
		`;

		Event.bind(footer, 'click', () => {
			BX.SidePanel.Instance.open('/bitrix/components/bitrix/bizproc.storage.edit/', {
				width: 1000,
				cacheable: false,
				events: {
					onCloseComplete: (event) => {
						this.#onStorageCreated(event);
					},
				},
			});
		});

		this.#dialog.setFooter(footer);
	}

	#onStorageCreated(event): void
	{
		const slider = event.getSlider();
		const dictionary = slider ? slider.getData() : null;

		if (!dictionary || !dictionary.has('data'))
		{
			return;
		}

		const data = dictionary.get('data');
		const storageId = Number(data.storageId || data.id) || null;
		const title = data.storageTitle || data.title || '';

		if (!storageId)
		{
			return;
		}

		const entityId = this.#dialog.getEntities()[0]?.id || 'bizproc-storage';
		const itemLink = this.#footerOptions?.itemLink || '';

		const item = this.#dialog.addItem({
			id: storageId,
			entityId,
			title,
			link: itemLink ? `${itemLink}${storageId}` : '',
			tabs: 'recents',
		});

		if (item)
		{
			item.select();
		}
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
			this.#dialog.subscribe('Item:onSelect', this.#onDialogChange.bind(this));
			this.#dialog.subscribe('Item:onDeselect', this.#onDialogDeselect.bind(this));
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
		const storageId = String(data.item.id);

		this.#notifyStateChange(storageId);
	}

	#onDialogDeselect(): void
	{
		if (this.#isUpdating)
		{
			return;
		}

		this.#notifyStateChange();
	}

	#notifyStateChange(storageId: string = ''): void
	{
		this.#updateStorageCodeInput(storageId);

		if (Type.isFunction(this.#onStateChange))
		{
			this.#onStateChange(storageId);
		}
	}

	#updateStorageCodeInput(storageId: string): void
	{
		if (!this.#storageCodeInput)
		{
			return;
		}

		this.#storageCodeInput.value = this.#dynamicStorageCodes.has(storageId) ? storageId : '';
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

	destroy(): void
	{
		const dialog = Dialog.getById(this.dialogId);
		if (dialog)
		{
			dialog.destroy();
		}
	}
}
