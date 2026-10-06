import { ajax, Loc, Type } from 'main.core';
import { Center as NotificationCenter } from 'ui.notification';

import { type TabConfig } from '../catalog';
import { type CatalogItem } from '../tab-controller';
import { sendCatalogAnalytics } from '../utils/analytics';
import { CatalogRenameDialog, ICON_ACTION_REPLACE } from './popup-rename-dialog';

const KIND_APPLICATION = 'application';
const UPDATE_ACTION = 'vibecodeconnector.Catalog.update';

type CatalogAnalyticsSender = (payload: { event: string, c_section?: string }) => void;

type CatalogPopupItemRenameActionOptions = {
	onRenamed?: () => void,
	sendAnalytics?: CatalogAnalyticsSender,
};

type CatalogPopupItemRenameMenuItem = {
	title: string,
	onClick: () => void,
};

type CatalogRenamePayload = {
	title: string,
	description: string,
	titleChanged: boolean,
	descriptionChanged: boolean,
	iconAction: 'keep' | 'replace' | 'delete',
	iconFile: File | null,
};

export class CatalogPopupItemRenameAction
{
	#item: CatalogItem;
	#tab: TabConfig | null;
	#onRenamed: (() => void) | null;
	#sendAnalytics: CatalogAnalyticsSender;
	#dialog: CatalogRenameDialog | null = null;

	constructor(
		item: CatalogItem,
		tab: TabConfig | null = null,
		options: CatalogPopupItemRenameActionOptions = {},
	)
	{
		this.#item = item;
		this.#tab = tab;
		this.#onRenamed = options.onRenamed ?? null;
		this.#sendAnalytics = options.sendAnalytics ?? sendCatalogAnalytics;
	}

	canBeRenamed(): boolean
	{
		if (this.#tab?.extraData?.previewUserId)
		{
			return false;
		}

		return this.#item.isMine === true && this.#item.kind === KIND_APPLICATION;
	}

	getMenuItem(): ?CatalogPopupItemRenameMenuItem
	{
		if (!this.canBeRenamed())
		{
			return null;
		}

		return {
			title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_MENU_EDIT'),
			onClick: () => this.#openDialog(),
		};
	}

	#openDialog(): void
	{
		this.#dialog = new CatalogRenameDialog({
			title: this.#item.title,
			description: this.#item.description,
			isDescriptionDefault: this.#item.isDescriptionDefault === true,
			iconUrl: this.#item.iconUrl,
			color: this.#item.color,
			onSubmit: (payload: CatalogRenamePayload) => this.submitRename(payload),
		});

		this.#dialog.show();
	}

	submitRename(payload: CatalogRenamePayload): Promise<void>
	{
		return ajax.runAction(UPDATE_ACTION, {
			data: this.#buildFormData(payload),
		}).catch((rejection) => {
			throw new Error(this.#firstErrorMessage(rejection));
		}).then((response) => {
			if (this.#hasErrors(response))
			{
				throw new Error(this.#firstErrorMessage(response));
			}

			this.#applyServerItem(response);

			this.#dialog?.hide();

			this.#showSuccessToast();
			this.#sendAnalyticsSafely();
			this.#notifyRenamedSafely();
		});
	}

	#buildFormData(payload: CatalogRenamePayload): FormData
	{
		const formData = new FormData();

		formData.append('catalogItemId', String(this.#item.id));

		if (payload.titleChanged)
		{
			formData.append('title', payload.title);
		}

		if (payload.descriptionChanged)
		{
			formData.append('description', payload.description);
		}

		formData.append('iconAction', payload.iconAction);

		if (payload.iconAction === ICON_ACTION_REPLACE && payload.iconFile !== null)
		{
			formData.append('icon', payload.iconFile);
		}

		return formData;
	}

	#applyServerItem(response: mixed): void
	{
		const item = response?.data?.item;
		if (!Type.isPlainObject(item))
		{
			return;
		}

		if (Type.isStringFilled(item.title))
		{
			this.#item.title = item.title;
		}

		this.#item.description = Type.isStringFilled(item.description) ? item.description : null;
		this.#item.isDescriptionDefault = item.isDescriptionDefault === true;

		if (item.iconUrl !== undefined)
		{
			this.#item.iconUrl = Type.isStringFilled(item.iconUrl) ? item.iconUrl : null;
		}
	}

	#sendAnalyticsSafely(): void
	{
		try
		{
			this.#sendAnalytics({ event: 'rename_app', c_section: 'menu' });
		}
		catch (error)
		{
			console.error('[vibecodeconnector.catalog] rename analytics failed', this.#item.id, error);
		}
	}

	#notifyRenamedSafely(): void
	{
		try
		{
			this.#onRenamed?.();
		}
		catch (error)
		{
			console.error('[vibecodeconnector.catalog] rename re-render failed', this.#item.id, error);
		}
	}

	#showSuccessToast(): void
	{
		NotificationCenter.notify({
			content: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_SUCCESS'),
			autoHide: true,
		});
	}

	#hasErrors(response: mixed): boolean
	{
		return Type.isArrayFilled(response?.errors);
	}

	#firstErrorMessage(response: mixed): string
	{
		const first = response?.errors?.[0];

		return Type.isStringFilled(first?.message)
			? first.message
			: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_GENERIC');
	}
}
