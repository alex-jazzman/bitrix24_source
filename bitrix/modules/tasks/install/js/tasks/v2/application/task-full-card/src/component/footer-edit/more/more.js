import { EventEmitter } from 'main.core.events';
import { mapGetters } from 'ui.vue3.vuex';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { BMenu, MenuItemDesign, type MenuOptions, type MenuItemOptions } from 'ui.system.menu.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { TaskCard } from 'tasks.v2.application.task-card';
import { EventName, GroupType, Model, TaskStatus } from 'tasks.v2.const';
import { usersDialog } from 'tasks.v2.lib.user-selector-dialog';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { templateService } from 'tasks.v2.provider.service.template-service';
import { statusService } from 'tasks.v2.provider.service.status-service';
import type { GroupModel } from 'tasks.v2.model.groups';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CoreParams } from 'tasks.v2.core';

import { ButtonId } from '../footer-edit-const';
import type { ButtonOptions } from '../footer-edit';

import './more.css';

// @vue/component
export const More = {
	name: 'TaskFullCardMoreActionsStatus',
	components: {
		UiButton,
		BMenu,
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
		settings: {},
	},
	props: {
		selectedButtons: {
			type: Array,
			default: () => ([]),
		},
	},
	setup(): {
		Outline: typeof Outline,
		AirButtonStyle: typeof AirButtonStyle,
		ButtonSize: typeof ButtonSize,
		task: TaskModel,
		settings: CoreParams,
		}
	{
		return {
			Outline,
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): { isMenuShown: boolean, loading: boolean }
	{
		return {
			isMenuShown: false,
			loading: false,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		group(): ?GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
		},
		isScrum(): boolean
		{
			return this.group?.type === GroupType.Scrum;
		},
		isCreator(): boolean
		{
			return this.currentUserId === this.task.creatorId;
		},
		isResponsible(): boolean
		{
			return (
				this.task.responsibleIds.includes(this.currentUserId)
				|| this.task.accomplicesIds?.includes(this.currentUserId)
			);
		},
		menuOptions(): Function
		{
			return (): MenuOptions => ({
				id: 'tasks-full-card-footer-more-menu',
				bindElement: this.$refs.button,
				items: this.menuItems,
			});
		},
		menuItems(): MenuItemOptions[]
		{
			if (this.isTemplate)
			{
				return [
					this.getCreateSubtaskForTemplate(),
					// todo: Uncomment after creating template copy V2 API
					// this.getCopyTemplate(),
					this.getDeleteTemplate(),
				];
			}

			const statuses = {
				[TaskStatus.Pending]: [
					this.getCompleteItem(),
					this.getDefferItem(),
					this.getDelegateItem(),
					this.getDeleteItem(),
					this.getStartItem(),
				],
				[TaskStatus.InProgress]: [
					this.getPauseItem(),
					this.getDefferItem(),
					this.getDelegateItem(),
					this.getDeleteItem(),
				],
				[TaskStatus.Deferred]: [
					this.getDelegateItem(),
					this.getDeleteItem(),
					this.getCompleteItem(),
				],
				[TaskStatus.SupposedlyCompleted]: [
					this.getFixItem(),
					this.getDelegateItem(),
					this.getDisapproveItem(),
					this.getDeleteItem(),
				],
				[TaskStatus.Completed]: [
					this.getRenewItem(),
					this.getDeleteItem(),
				],
			};

			const items = statuses[this.task.status] || [];

			return items.filter((item) => item !== null);
		},
		selectedButtonIds(): Set
		{
			return new Set(this.selectedButtons.map((button: ButtonOptions) => button?.id));
		},
		isDelegateLocked(): boolean
		{
			return !this.settings.restrictions.delegating.available;
		},
	},
	methods: {
		handleClick(): void
		{
			this.isMenuShown = true;
		},
		getStartItem(): MenuItemOptions
		{
			if (!this.task.rights.start)
			{
				return null;
			}

			if (this.selectedButtonIds.has(ButtonId.Start))
			{
				return null;
			}

			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_START'),
				icon: Outline.PLAY_L,
				onClick: (): void => this.waitStatus(statusService.start(this.taskId)),
			};
		},
		getDefferItem(): MenuItemOptions
		{
			if (!this.task.rights.defer)
			{
				return null;
			}

			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_DEFER'),
				icon: Outline.PAUSE_L,
				onClick: (): void => this.waitStatus(statusService.defer(this.taskId)),
			};
		},
		getPauseItem(): MenuItemOptions
		{
			if (!this.task.rights.pause)
			{
				return null;
			}

			if (this.selectedButtonIds.has(ButtonId.Pause))
			{
				return null;
			}

			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_PAUSE'),
				icon: Outline.HOURGLASS,
				onClick: (): void => this.waitStatus(statusService.pause(this.taskId)),
			};
		},
		getRenewItem(): MenuItemOptions
		{
			if (!this.task.rights.renew)
			{
				return null;
			}

			if (this.selectedButtonIds.has(ButtonId.Renew))
			{
				return null;
			}

			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_RENEW'),
				icon: Outline.UNDO,
				onClick: (): void => this.waitStatus(statusService.renew(this.taskId)),
			};
		},
		getFixItem(): MenuItemOptions
		{
			if (!this.task.rights.renew)
			{
				return null;
			}

			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_FIX'),
				icon: Outline.UNDO,
				onClick: (): void => this.waitStatus(statusService.renew(this.taskId)),
			};
		},
		getDisapproveItem(): MenuItemOptions
		{
			if (!this.task.rights.disapprove)
			{
				return null;
			}

			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_DISAPPROVE'),
				icon: Outline.UNDO,
				onClick: (): void => this.waitStatus(statusService.disapprove(this.taskId)),
			};
		},
		getCompleteItem(): MenuItemOptions
		{
			if (!this.task.rights.complete)
			{
				return null;
			}

			if (this.selectedButtonIds.has(ButtonId.Complete))
			{
				return null;
			}

			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_COMPLETE'),
				icon: Outline.SENDED,
				onClick: (): void => this.handleCompleteSelect(),
			};
		},
		getDelegateItem(): MenuItemOptions
		{
			if (!this.task.rights.delegate)
			{
				return null;
			}

			return {
				icon: Outline.DELEGATE,
				title: this.loc('TASKS_V2_TASK_FULL_CARD_DELEGATE'),
				isLocked: this.isDelegateLocked,
				onClick: (): void => this.handleDelegateSelect(),
			};
		},
		handleClose(usersIds: number[]): void
		{
			void taskService.update(this.taskId, { responsibleIds: [usersIds[0] ?? 0] });
		},
		async handleCompleteSelect(): void
		{
			await this.waitStatus(statusService.complete(this.taskId));
		},
		async handleDelegateSelect(): void
		{
			if (this.isDelegateLocked)
			{
				void showLimit({
					featureId: this.settings.restrictions.delegating.featureId,
				});

				return;
			}

			void usersDialog.show({
				targetNode: this.$refs.button,
				ids: this.task.responsibleIds,
				isMultiple: false,
				onClose: this.handleClose,
			});
		},
		getDeleteItem(): MenuItemOptions
		{
			if (!this.task.rights.remove)
			{
				return null;
			}

			return {
				design: MenuItemDesign.Alert,
				title: this.loc('TASKS_V2_TASK_FULL_CARD_DELETE'),
				icon: Outline.TRASHCAN,
				onClick: (): void => {
					void taskService.delete(this.taskId);
					EventEmitter.emit(EventName.CloseFullCard, { taskId: this.taskId });
				},
			};
		},
		async waitStatus(statusPromise: Promise): Promise<void>
		{
			this.loading = true;
			await statusPromise;
			this.loading = false;
		},
		getCreateSubtaskForTemplate(): MenuItemOptions | null
		{
			if (!this.settings.rights.templates.create)
			{
				return null;
			}

			const isLocked = !this.settings.restrictions.templatesSubtasks.available;

			return {
				isLocked,
				title: this.loc('TASKS_V2_TASK_TEMPLATE_CREATE_SUBTASK'),
				icon: Outline.RELATED_TASKS,
				onClick: (): void => {
					if (isLocked)
					{
						void showLimit({
							featureId: this.settings.restrictions.templatesSubtasks.featureId,
						});

						return;
					}

					TaskCard.showCompactCard({
						taskId: 'template0',
						groupId: this.task.groupId,
						parentId: this.taskId,
					});
				},
			};
		},
		getCopyTemplate(): MenuItemOptions | null
		{
			if (!this.settings.rights.templates.create)
			{
				return null;
			}

			return {
				title: this.loc('TASKS_V2_TASK_TEMPLATE_COPY'),
				icon: Outline.COPY,
				onClick: (): void => TaskCard.showFullCard({ taskId: 'template0', copiedFromId: idUtils.unbox(this.taskId) }),
			};
		},
		getDeleteTemplate(): MenuItemOptions | null
		{
			if (!this.task.rights.remove)
			{
				return null;
			}

			return {
				design: MenuItemDesign.Alert,
				title: this.loc('TASKS_V2_TASK_TEMPLATE_DELETE'),
				icon: Outline.TRASHCAN,
				onClick: async (): Promise<void> => {
					await templateService.delete(this.taskId);
					EventEmitter.emit(EventName.CloseFullCard, {
						taskId: this.taskId,
					});
				},
			};
		},
	},
	template: `
		<div ref="button">
			<UiButton
				v-if="menuItems.length > 0"
				:size="ButtonSize.LARGE"
				:style="AirButtonStyle.PLAIN"
				:leftIcon="Outline.MORE_L"
				:loading
				:dataset="{ taskButtonId: 'more' }"
				ref="button"
				@click="handleClick"
			/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
	`,
};
