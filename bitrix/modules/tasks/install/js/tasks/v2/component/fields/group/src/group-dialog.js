import { EventEmitter } from 'main.core.events';
import { Notifier } from 'ui.notification-manager';
import { Messenger } from 'im.public';
import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, Model, Endpoint, GroupType, EventName } from 'tasks.v2.const';
import { EntitySelectorDialog, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { type GroupModel } from 'tasks.v2.model.groups';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { groupService } from 'tasks.v2.provider.service.group-service';

type Params = {
	targetNode: HTMLElement,
	taskId: number | string,
	onClose: Function,
};

export const groupDialog = new class
{
	#dialog: EntitySelectorDialog;
	#taskId: number | string;
	#onClose: Function | null;

	show(params: Params): void
	{
		this.#taskId = params.taskId;
		this.#onClose = params.onClose;

		this.#dialog ??= this.#createDialog();
		this.#dialog.selectItemsByIds(this.#items);
		this.#dialog.showTo(params.targetNode);
	}

	#openInMessenger(group: GroupModel): void
	{
		const externalId = `sg${group.id}`;

		if (group.type === GroupType.Collab)
		{
			Messenger.openChat(externalId);

			return;
		}

		Messenger.openCollab(externalId);
	}

	async openGroup(isAutonomous: boolean, group: GroupModel, taskId: number = 0): Promise<void>
	{
		if (
			Core.getParams().features.isNewProjectsOn
			&& (
				Messenger.isEmbeddedMode()
				|| Messenger.isMessengerSliderOpened()
			)
			&& group.type !== GroupType.Scrum
		)
		{
			const closeEventName = (
				isAutonomous
					? EventName.CardClosed
					: EventName.FullCardClosed
			);
			EventEmitter.subscribeOnce(closeEventName, () => {
				this.#openInMessenger(group);
			});

			if (isAutonomous)
			{
				EventEmitter.emit(`${EventName.CloseCard}:${taskId}`);
			}
			else
			{
				EventEmitter.emit(EventName.TryCloseFullCard, { taskId });
			}
		}
		else
		{
			void this.#emulateAnchorClick(group);
		}
	}

	async openProject(group: GroupModel): Promise<void>
	{
		if (
			Core.getParams().features.isNewProjectsOn
			&& (
				Messenger.isEmbeddedMode()
				|| Messenger.isMessengerSliderOpened()
			)
			&& group.type !== GroupType.Scrum
		)
		{
			this.#openInMessenger(group);
		}
		else
		{
			void this.#emulateAnchorClick(group);
		}
	}

	async #emulateAnchorClick(group: GroupModel): void
	{
		const href = await groupService.getUrl(group.id, group.type);

		BX.SidePanel.Instance.emulateAnchorClick(href);
	}

	#createDialog(): EntitySelectorDialog
	{
		return new EntitySelectorDialog({
			context: 'tasks-card',
			multiple: false,
			hideOnDeselect: true,
			enableSearch: true,
			entities: [
				{
					id: EntitySelectorEntity.Project,
				},
			],
			preselectedItems: this.#items,
			events: {
				onLoad: this.#fillStore,
			},
			popupOptions: {
				events: {
					onClose: this.#handleGroupSelect,
				},
			},
		});
	}

	#handleGroupSelect = async (): Promise<void> => {
		const onClose = this.#onClose;
		this.#onClose = null;

		if (!this.#dialog.isLoaded())
		{
			onClose?.();

			return;
		}

		// Singleton dialog: a show() for another card can overwrite this.#taskId while an await
		// below is in flight, so capture the id and current group synchronously and use only these.
		const taskId = this.#taskId;
		const currentGroupId = taskService.getStoreTask(taskId).groupId;

		const groupId = await this.#fillStore();

		if (currentGroupId === groupId)
		{
			onClose?.();

			return;
		}

		taskService.setSilentErrorMode(true);
		const updatePromise = taskService.update(taskId, { groupId, stageId: 0 });
		groupService.setHasScrumInfo(taskId, updatePromise);

		onClose?.(groupId);

		const result = await updatePromise;

		taskService.setSilentErrorMode(false);

		if (result[Endpoint.TaskUpdate]?.length)
		{
			const error = result[Endpoint.TaskUpdate][0];

			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-update-group-error',
				text: error?.message,
			});
		}

		// Refetch canCreateEpic unconditionally: setHasScrumInfo() cleared it as a fail-safe, so on
		// update failure (server unchanged) the refetch restores the old group's real right, and on
		// success the new group's. The synthetic promise from setHasScrumInfo() would otherwise
		// short-circuit the mount-fetch with the stale flag. Each call self-guards by task id kind:
		// getScrumInfo runs for a real task, getEpicCreationRight for a create-mode draft.
		void groupService.getScrumInfo(taskId, { force: true });
		void groupService.getEpicCreationRight(taskId);
	};

	#fillStore = async (): Promise<number> => {
		const item = this.#dialog.getSelectedItems()[0];
		if (!item)
		{
			return 0;
		}

		const group = {
			id: item.getId(),
			name: item.getTitle(),
			image: item.getAvatar(),
			type: item.getEntityType(),
		};

		await Core.getStore().dispatch(`${Model.Groups}/insert`, group);

		return group.id;
	};

	get #items(): ItemId[]
	{
		return this.#groupId ? [[EntitySelectorEntity.Project, this.#groupId]] : [];
	}

	get #groupId(): ?number
	{
		return taskService.getStoreTask(this.#taskId).groupId;
	}
}();
