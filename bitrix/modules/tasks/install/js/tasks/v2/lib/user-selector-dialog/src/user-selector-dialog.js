import { Popup } from 'main.popup';
import type { BaseEvent } from 'main.core.events';

import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, Model } from 'tasks.v2.const';
import { EntitySelectorDialog, type ItemId, type Item } from 'tasks.v2.lib.entity-selector-dialog';
import type { UserModel } from 'tasks.v2.model.users';

type Params = {
	targetNode: HTMLElement,
	ids: number[],
	selectableIds: Set<number>,
	onSelect?: Function,
	onDeselect?: Function,
	onClose: Function,
	isMultiple: boolean,
	withAngle: boolean,
	enableSearch?: boolean,
};

let dialog: EntitySelectorDialog = null;

export const usersDialog = new class
{
	#ids: number[];
	#selectableIds: ?Set<number>;
	#onSelect: ?Function;
	#onDeselect: ?Function;
	#onClose: ?Function;
	#isMultiple: boolean = true;
	#withAngle: ?boolean;
	#enableSearch: boolean;

	#hidePromise: Resolvable;

	async show(params: Params): Promise<void>
	{
		if (dialog?.isOpen() && dialog.getTargetNode() !== params.targetNode)
		{
			this.#hidePromise = new Resolvable();

			await this.#hidePromise;
		}

		if (this.#shouldRecreateDialog(params))
		{
			dialog.destroy();
			dialog = null;
		}

		this.#ids = params.ids;
		this.#selectableIds = params.selectableIds;
		this.#onClose = params.onClose;
		this.#onSelect = params.onSelect;
		this.#onDeselect = params.onDeselect;
		this.#withAngle = params.withAngle ?? true;
		this.#isMultiple = params.isMultiple ?? true;
		this.#enableSearch = params.enableSearch ?? true;

		dialog ??= this.#createDialog();
		this.#fillDialog(this.#ids);
		dialog.selectItemsByIds(this.#items);
		this.#setSelectableByIds();
		dialog.showTo(params.targetNode);
	}

	getDialog(): EntitySelectorDialog
	{
		return dialog;
	}

	#shouldRecreateDialog(params: Params): boolean
	{
		if (dialog === null)
		{
			return false;
		}

		return this.#isMultiple !== (params.isMultiple ?? true)
			|| this.#enableSearch !== (params.enableSearch ?? true)
			|| this.#withAngle !== (params.withAngle ?? true)
		;
	}

	#createDialog(): EntitySelectorDialog
	{
		const restrictions = Core.getParams().restrictions;

		return new EntitySelectorDialog({
			context: 'tasks-card',
			enableSearch: this.#enableSearch,
			entities: [
				{
					id: EntitySelectorEntity.User,
					options: {
						emailUsers: true,
						inviteGuestLink: true,
						analyticsSource: 'tasks',
						lockGuestLink: !restrictions.mailUserIntegration.available,
						lockGuestLinkFeatureId: restrictions.mailUserIntegration.featureId,
					},
				},
				{
					id: EntitySelectorEntity.Department,
				},
			],
			preselectedItems: this.#items,
			events: {
				'Item:onSelect': (event: BaseEvent): void => {
					const { item } = event.getData();

					if (this.#onSelect)
					{
						this.#onSelect(item.getId());
					}

					if (this.#isMultiple)
					{
						return;
					}

					dialog.selectItemsByIds(this.#mapIdsToItemIds([item.getId()]));

					dialog.hide();
				},
				'Item:onDeselect': (event: BaseEvent): void => {
					if (this.#onDeselect)
					{
						const { item } = event.getData();
						this.#onDeselect(item.getId());
					}
				},
				onLoad: (): void => {
					this.#fillStore();
					this.#setSelectableByIds();
				},
				onHide: (): void => this.#hidePromise?.resolve(),
			},
			popupOptions: {
				events: {
					onShow: (baseEvent: BaseEvent): void => {
						const popup = baseEvent.getTarget();
						if (!this.#withAngle)
						{
							popup.setAngle(false);
							popup.setOffset({ offsetLeft: 0 });

							return;
						}

						const popupWidth = popup.getPopupContainer().offsetWidth;
						const targetNodeWidth = 10;

						const offsetLeft = targetNodeWidth - (popupWidth / 2);
						const angleShift = Popup.getOption('angleLeftOffset') - Popup.getOption('angleMinTop');

						popup.setAngle({ offset: popupWidth / 2 - angleShift });
						popup.setOffset({ offsetLeft: offsetLeft + Popup.getOption('angleLeftOffset') });
					},
					onClose: (): void => {
						this.#fillStore();
						const ids = dialog.getSelectedItems().map((item: Item) => item.getId());
						this.#onClose?.(ids);
					},
				},
			},
		});
	}

	#fillDialog(ids: number[]): void
	{
		if (!dialog || !dialog.isLoaded())
		{
			return;
		}

		const itemIds = new Set(dialog.getItems().map((it) => it.getId()));
		ids.filter((id) => !itemIds.has(id)).forEach((id: number) => {
			const user: UserModel = Core.getStore().getters[`${Model.Users}/getById`](id);
			dialog.addItem({
				id,
				entityId: EntitySelectorEntity.User,
				entityType: user.type,
				title: user.name,
				avatar: user.image,
				tabs: ['recents'],
			});
		});
	}

	#fillStore(): void
	{
		const users = dialog.getSelectedItems().map((item: Item): UserModel => ({
			id: item.getId(),
			name: item.getTitle(),
			image: item.getAvatar(),
			type: item.getEntityType(),
		}));

		void Core.getStore().dispatch(`${Model.Users}/upsertMany`, users);
	}

	#setSelectableByIds(): void
	{
		const selectableIds = dialog.getItems().map((item: Item) => item.getId());
		const unselectableIds = this.#ids.filter((id) => this.#selectableIds && !this.#selectableIds?.has(id));

		dialog.setSelectableByIds({
			selectable: this.#mapIdsToItemIds(selectableIds),
			unselectable: this.#mapIdsToItemIds(unselectableIds),
		});
	}

	get #items(): ItemId[]
	{
		return this.#mapIdsToItemIds(this.#ids);
	}

	#mapIdsToItemIds(ids: number[]): ItemId[]
	{
		return ids.map((id: number) => [EntitySelectorEntity.User, id]);
	}
}();

function Resolvable(): Promise
{
	let resolve = null;
	const promise = new Promise((res) => {
		resolve = res;
	});

	promise.resolve = resolve;

	return promise;
}
