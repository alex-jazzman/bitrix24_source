import { Loc, Type } from 'main.core';
import { openCollectionPicker } from 'note.ui.collection-picker';

export type PickCollectionPopupResult = {
	collectionId: number,
	collectionTitle: string,
} | null;

export type PickCollectionPopupOptions = {
	api: Object,
	store: Object,
	canCreateCollection?: boolean,
	onFail?: (error: mixed) => void,
};

export function openPickCollectionPopup(options: PickCollectionPopupOptions): Promise<PickCollectionPopupResult>
{
	const api = options?.api;
	const store = options?.store;
	const canCreateCollection = Boolean(options?.canCreateCollection);
	const onFail = Type.isFunction(options?.onFail) ? options.onFail : () => {};

	return openCollectionPicker({
		title: Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TITLE') || '',
		description: canCreateCollection
			? (Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TEXT_WITH_CREATE') || '')
			: (Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TEXT') || ''),
		placeholder: Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_PLACEHOLDER') || '',
		primaryLabel: Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_PRIMARY') || '',
		cancelLabel: Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_CANCEL') || '',
		canCreateCollection,
		createFooterLabel: Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_FOOTER_CREATE') || '',
		onCreateCollection: async (name) => {
			try
			{
				const created = await api.createCollection(name);
				const id = Number(created?.id);
				if (!Number.isInteger(id) || id <= 0)
				{
					return null;
				}

				const collectionName = String(created?.name || name);
				if (store && store.actions && Type.isFunction(store.actions.insertCollectionLocal))
				{
					const maxPosition = (store.state?.collections?.value || []).reduce(
						(max, item) => Math.max(max, Number(item?.position || 0)),
						0,
					);
					store.actions.insertCollectionLocal({
						id,
						name: collectionName,
						position: Number(created?.position || (maxPosition + 1)),
						canEditCollection: true,
						canManagePermissions: true,
					});
				}

				return { id, title: collectionName };
			}
			catch (error)
			{
				onFail(error);

				return null;
			}
		},
	});
}
