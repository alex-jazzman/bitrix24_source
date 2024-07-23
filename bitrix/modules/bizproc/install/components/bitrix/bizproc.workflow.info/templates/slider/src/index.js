import { Event, Dom, ajax, Loc, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Button, ButtonIcon, ButtonSize, ButtonColor } from 'ui.buttons';
import { UserStatus } from 'bizproc.task';
import { MessageBox } from 'ui.dialogs.messagebox';

import './style.css';
import 'sidepanel';

type TaskButton = {
	TARGET_USER_STATUS: number,
	NAME: string,
	VALUE: string,
	TEXT: string,
};

export class WorkflowInfo
{
	currentUserId: number;
	workflowId: string;
	taskId: number;
	taskUserId: number;
	taskButtons: ?Array<TaskButton>;
	taskForm: ?HTMLFormElement;
	buttonsPanel: ?HTMLElement;
	canDelegateTask: boolean;

	constructor(options: {
		currentUserId: number,
		workflowId: string,
		taskId: number,
		taskUserId: number,
		taskButtons?: Array<TaskButton>,
		taskForm?: HTMLFormElement,
		buttonsPanel: HTMLElement,
		canDelegateTask: boolean,
	})
	{
		this.currentUserId = options.currentUserId;
		this.workflowId = options.workflowId;
		this.taskId = options.taskId;
		this.taskUserId = options.taskUserId;
		this.taskButtons = options.taskButtons;
		this.taskForm = options.taskForm;
		this.buttonsPanel = options.buttonsPanel;
		this.canDelegateTask = options.canDelegateTask;

		this.handleMarkAsRead = Runtime.debounce(this.#sendMarkAsRead, 100, this);
	}

	init(): void
	{
		if (this.buttonsPanel)
		{
			this.#renderButtons();
		}

		this.handleMarkAsRead();

		EventEmitter.subscribe('OnUCCommentWasRead', (event) => {
			const [xmlId] = event.getData();
			if (xmlId === `WF_${this.workflowId}`)
			{
				this.handleMarkAsRead();
			}
		});
		if (this.taskForm)
		{
			Event.bind(this.taskForm, 'input', (event) => {
				const target = event.target;
				if (target.matches('input, textarea, select'))
				{
					const formRow = target.closest('.ui-form-content');
					if (formRow)
					{
						this.#clearError(formRow);
					}
				}
			});
			this.taskForm.querySelectorAll('.ui-form-content').forEach((row) => {
				Event.bind(row, 'click', (event) => {
					const target = event.currentTarget;
					this.#clearError(target);
				});
			});
			EventEmitter.subscribe('BX.UI.Selector:onChange', (event) => {
				const box = BX(`crm-${event.data[0].selectorId}-box`);
				const formRow = box.closest('.ui-form-content');
				if (formRow)
				{
					this.#clearError(formRow);
				}
			});
			EventEmitter.subscribe('OnIframeKeyup', (event) => {
				const box = event.target.dom.cont;
				const formRow = box.closest('.ui-form-content');
				if (formRow)
				{
					this.#clearError(formRow);
				}
			});
		}
	}

	#renderButtons(): void
	{
		if (this.taskButtons)
		{
			this.taskButtons.forEach((taskButton: TaskButton) => {
				const targetStatus = new UserStatus(taskButton.TARGET_USER_STATUS);
				const isDecline = targetStatus.isNo() || targetStatus.isCancel();

				const button = new Button({
					color: isDecline ? ButtonColor.LIGHT_BORDER : ButtonColor.SUCCESS,
					// icon: isDecline ? ButtonIcon.CANCEL : ButtonIcon.DONE,
					round: true,
					size: ButtonSize.MEDIUM,
					// noCaps: true,
					text: taskButton.TEXT,
					onclick: (btn) => this.#handleTaskButtonClick(taskButton, btn),
				});

				Dom.style(button.getContainer(), 'minWidth', '160px');
				Dom.style(button.getContainer(), 'maxWidth', '200px');
				Dom.attr(button.getContainer(), 'title', taskButton.TEXT);
				Dom.append(button.getContainer(), this.buttonsPanel);
			});
		}

		if (this.canDelegateTask)
		{
			const button = new Button({
				color: ButtonColor.LINK,
				size: ButtonSize.MEDIUM,
				// noCaps: true,
				text: Loc.getMessage('BPWFI_SLIDER_BUTTON_DELEGATE'),
				onclick: (btn) => this.#handleDelegateButtonClick(btn),
			});

			Dom.style(button.getContainer(), 'minWidth', '160px');
			Dom.style(button.getContainer(), 'maxWidth', '200px');
			Dom.append(button.getContainer(), this.buttonsPanel);
		}
	}

	#handleTaskButtonClick(taskButton: TaskButton, uiButton: Button): void
	{
		const formData = new FormData(this.taskForm);
		formData.append('taskId', this.taskId);
		formData.append(taskButton.NAME, taskButton.VALUE);

		uiButton.setDisabled(true);

		ajax.runAction('bizproc.task.do', {
			data: formData,
		}).then(() => {
			uiButton.setDisabled(false);
			BX.SidePanel.Instance.getSliderByWindow(window)?.close();
		}).catch((response) => {
			if (BX.type.isArray(response.errors))
			{
				const popupErrors = [];
				response.errors.forEach((error) => {
					const fieldName = error.customData;
					if (this.taskForm && fieldName)
					{
						const field = this.taskForm.querySelector(`[data-cid="${fieldName}"]`);
						if (field)
						{
							this.#showError(error, field);
						}
					}
					else
					{
						popupErrors.push(error.message);
					}
				});

				if (popupErrors.length > 0)
				{
					MessageBox.alert(popupErrors.join(', '));
				}
			}

			uiButton.setDisabled(false);
		});
	}

	#handleDelegateButtonClick(uiButton: Button): void
	{
		uiButton.setDisabled(true);

		Runtime.loadExtension('ui.entity-selector').then((exports) => {
			const { Dialog } = exports;
			uiButton.setDisabled(false);

			const dialog = new Dialog({
				targetNode: uiButton.getContainer(),
				context: 'bp-task-delegation',
				entities: [
					{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							emailUsers: false,
							inviteEmployeeLink: false,
							inviteGuestLink: false,
						},
					},
					{
						id: 'department',
						options: {
							selectMode: 'usersOnly',
						},
					},
				],
				popupOptions: {
					bindOptions: { forceBindPosition: true },
				},
				enableSearch: true,
				events: {
					'Item:onSelect': (event) => {
						const item = event.getData().item;
						this.#delegateTask(item.getId());
					},
					onHide: (event) => {
						event.getTarget().destroy();
					},
				},
				hideOnSelect: true,
				offsetTop: 3,
				clearUnavailableItems: true,
				multiple: false,
			});

			dialog.show();
		})
			.catch((e) => {
				console.error(e);
				uiButton.setDisabled(false);
			});
	}

	#delegateTask(toUserId: number): void
	{
		const actionData = {
			taskIds: [this.taskId],
			fromUserId: this.taskUserId || this.currentUserId,
			toUserId,
		};

		ajax.runAction('bizproc.task.delegate', { data: actionData })
			.then((response) => {
				BX.SidePanel.Instance.getSliderByWindow(window)?.close();
			}).catch((response) => {
				MessageBox.alert(response.errors.pop().message);
			});
	}

	#sendMarkAsRead(): void
	{
		ajax.runAction('bizproc.workflow.comment.markAsRead', {
			data: {
				workflowId: this.workflowId,
				userId: this.currentUserId,
			},
		});
	}

	#clearError(target: HTMLElement): void
	{
		const errorContainer = target.querySelector('.ui-form-notice');
		if (errorContainer)
		{
			BX.Dom.remove(errorContainer);
		}
	}

	#showError(error: string, field: HTMLElement): void
	{
		const parentContainer = field.querySelector('.ui-form-content');
		let errorContainer = field.querySelector('.ui-form-notice');
		if (!errorContainer)
		{
			errorContainer = BX.Dom.create(
				'div',
				{ attrs: { className: 'ui-form-notice' } },
			);

			errorContainer.innerText = error.message;
			if (parentContainer)
			{
				BX.Dom.append(errorContainer, parentContainer);
			}
		}
	}
}
