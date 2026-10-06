import { type AjaxResponse, Runtime, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import 'ui.design-tokens';
import { type DialogOptions } from 'ui.entity-selector';

import { Dialog } from 'crm.entity-selector';

import { type EditorOptions } from './editor-options';
import { PreviewLoader } from './preview-loader';

export class EventHandler
{
	#entityTypeId: number = null;
	#entityId: number = null;
	#categoryId: ?number = null;
	#isReadOnly: boolean = false;

	#placeholdersDialogDefaultOptions: ?DialogOptions = null;
	#dialogsCache: Map<string, Dialog> = new Map();
	#previewLoader: ?PreviewLoader = null;

	constructor(params: EditorOptions)
	{
		this.#assertValidParams(params);

		this.#entityTypeId = params.entityTypeId;
		this.#entityId = params.entityId;
		this.#categoryId = Type.isNumber(params.categoryId) ? params.categoryId : null;
		this.#isReadOnly = Boolean(params.isReadOnly ?? false);

		this.#prepareDialogOptions(params);
	}

	#prepareDialogOptions(params: EditorOptions): void
	{
		this.#placeholdersDialogDefaultOptions = {
			multiple: false,
			showAvatars: false,
			dropdownMode: true,
			compactView: true,
			enableSearch: true,
			tagSelectorOptions: {
				textBoxWidth: '100%',
			},
		};

		if (!this.#isReadOnly && this.#canUsePlaceholderProvider(params.usePlaceholderProvider))
		{
			this.#placeholdersDialogDefaultOptions.entities = [{
				id: 'placeholder',
				options: {
					entityTypeId: this.#entityTypeId,
					entityId: this.#entityId,
					categoryId: this.#categoryId ?? null,
				},
			}];
		}

		if (Type.isPlainObject(params.dialogOptions))
		{
			this.#placeholdersDialogDefaultOptions = { ...this.#placeholdersDialogDefaultOptions, ...params.dialogOptions };
		}
	}

	destroy(): void
	{
		this.#previewLoader?.destroy();
		this.#previewLoader = null;

		Runtime.destroy(this);
	}

	#assertValidParams(params: EditorOptions): void
	{
		if (!Type.isPlainObject(params))
		{
			throw new TypeError('BX.Crm.Template.Editor: The "params" argument must be object');
		}

		const isReadOnly = Boolean(params.isReadOnly ?? false);

		if (
			!isReadOnly
			&& this.#canUsePlaceholderProvider(params.usePlaceholderProvider)
			&& !BX.CrmEntityType.isDefined(params.entityTypeId)
		)
		{
			throw new TypeError('BX.Crm.Template.Editor: The "entityTypeId" argument is not correct');
		}
	}

	#canUsePlaceholderProvider(usePlaceholderProvider: ?boolean): boolean
	{
		if (Type.isBoolean(usePlaceholderProvider))
		{
			return usePlaceholderProvider;
		}

		return true;
	}

	onShowFieldsDialog(event: BaseEvent): void
	{
		const { placeholderId, filledPlaceholder, onShow, onHide, bindElement, updatePlaceholder } = event.getData();

		const dialogOptions = Runtime.clone(this.#placeholdersDialogDefaultOptions);

		if (filledPlaceholder)
		{
			dialogOptions.preselectedItems = [
				[
					filledPlaceholder.FIELD_ENTITY_TYPE,
					filledPlaceholder.FIELD_NAME,
				],
			];
		}

		// eslint-disable-next-line no-param-reassign
		dialogOptions.events = {
			onShow,
			onHide,
			'Item:onSelect': (dialogEvent: BaseEvent): void => {
				const item = dialogEvent.getData().item;

				const filledPlaceholderNew = {
					PLACEHOLDER_ID: placeholderId,
					FIELD_NAME: item.id,
					TITLE: item.title.text,
					PARENT_TITLE: item.supertitle.text,
					FIELD_ENTITY_TYPE: item.entityId,
				};

				updatePlaceholder(filledPlaceholderNew);
			},
		};

		dialogOptions.targetNode = bindElement;

		const dialog = this.#getDialog(placeholderId, dialogOptions);

		if (Type.isStringFilled(filledPlaceholder?.FIELD_VALUE))
		{
			dialog.getSelectedItems().forEach((item) => {
				item.deselect();
			});
		}

		dialog.show();
	}

	#getDialog(placeholderId: string, dialogOptions: DialogOptions): Dialog
	{
		if (this.#dialogsCache.has(placeholderId))
		{
			return this.#dialogsCache.get(placeholderId);
		}

		const dialog = new Dialog(dialogOptions);
		this.#dialogsCache.set(placeholderId, dialog);

		return dialog;
	}

	onLoadPreview(event: BaseEvent): Promise<AjaxResponse<{ preview: string }>>
	{
		this.#previewLoader ??= new PreviewLoader({
			entityTypeId: this.#entityTypeId,
			entityId: this.#entityId,
			categoryId: this.#categoryId,
		});

		const { template } = event.getData();

		return this.#previewLoader.loadPreview(template);
	}
}
