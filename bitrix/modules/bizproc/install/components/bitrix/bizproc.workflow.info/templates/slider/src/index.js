import { Event, Dom, ajax, Loc, Runtime, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Button, ButtonSize, ButtonColor } from 'ui.buttons';
import { UserStatus } from 'bizproc.task';
import { MessageBox } from 'ui.dialogs.messagebox';
import { TaskField, TaskFieldError } from './types';
import { ValidateHelper } from './validate-helper';
import { doTaskAction } from './actions';

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
	taskFields: ?Array<TaskField>;
	taskName: string;
	buttonsPanel: ?HTMLElement;
	workflowContent: HTMLElement;
	canDelegateTask: boolean;
	#isChanged: boolean = false;
	#messageBox: MessageBox;
	#canClose: boolean = false;
	#workflowResult: ?{} = null;
	#canUseHumanResources: boolean;

	constructor(options: {
		currentUserId: number,
		workflowId: string,
		taskId: number,
		taskUserId: number,
		taskButtons?: Array<TaskButton>,
		taskForm?: HTMLFormElement,
		taskFields: ?Array<TaskField>;
		taskName: string;
		buttonsPanel: HTMLElement,
		workflowContent: HTMLElement,
		canDelegateTask: boolean,
		workflowResult: ?{},
		fastClose: boolean,
		saveVariables: boolean,
		canUseHumanResources: boolean,
	})
	{
		this.currentUserId = options.currentUserId;
		this.workflowId = options.workflowId;
		this.taskId = options.taskId;
		this.taskUserId = options.taskUserId;
		this.taskButtons = options.taskButtons;
		this.taskForm = options.taskForm;
		this.taskFields = options.taskFields;
		this.taskName = options.taskName;
		this.buttonsPanel = options.buttonsPanel;
		this.workflowContent = options.workflowContent;
		this.canDelegateTask = options.canDelegateTask;
		this.fastClose = options.fastClose;
		this.saveVariables = options.saveVariables;
		this.#canUseHumanResources = Text.toBoolean(options.canUseHumanResources);

		this.handleMarkAsRead = Runtime.debounce(this.#sendMarkAsRead, 100, this);
		this.#workflowResult = Type.isNil(options.workflowResult) ? null : options.workflowResult;
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
			Event.bind(this.taskForm, 'change', () => {
				this.#isChanged = true;
			});
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
				this.#isChanged = true;
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
					this.#isChanged = true;
				}
			});

			EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', (event) => {
				if (event.target.context === 'BIZPROC')
				{
					this.#isChanged = true;
				}
			});
			EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', (event) => {
				if (event.target.context === 'BIZPROC')
				{
					this.#isChanged = true;
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
			EventEmitter.subscribe('OnContentChanged', (event) => {
				if (event.target.dom.cont.closest('.ui-form-content'))
				{
					this.#isChanged = true;
				}
			});

			EventEmitter.subscribe('BX.Disk.Uploader.Integration:Item:onAdd', (event) => {
				if ((event.target.getUploader().getHiddenFieldsContainer().closest('.ui-form-content')))
				{
					this.#isChanged = true;
				}
			});
			EventEmitter.subscribe('BX.Disk.Uploader.Integration:Item:onRemove', (event) => {
				if ((event.target.getUploader().getHiddenFieldsContainer().closest('.ui-form-content')))
				{
					this.#isChanged = true;
				}
			});

			EventEmitter.subscribe('SidePanel.Slider:onClose', (event) => {
				if (event.getTarget().getWindow() === window && this.#isChanged && !this.#canClose)
				{
					event.getCompatData()[0].denyAction();
					if (!this.#messageBox?.getPopupWindow().isShown())
					{
						this.#showConfirmDialog();
					}
				}
			});
		}

		const desc = this.workflowContent.querySelector('.bp-workflow-info__desc-inner');
		if (desc)
		{
			BX.UI.Hint.init(desc);
		}

		const resultNode = this.workflowContent.querySelector('[data-role="bp-workflow-result"]');
		if (resultNode && this.#workflowResult)
		{
			Runtime.loadExtension('bizproc.workflow.result')
				.then((exports) => {
					if (exports?.WorkflowResult)
					{
						new exports.WorkflowResult(this.#workflowResult).renderTo(resultNode);
					}
				})
				.catch(() => {})
			;
		}
	}

	#renderButtons(): void
	{
		if (this.taskButtons)
		{
			Dom.clean(this.buttonsPanel);
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
		const errors =
			this.#isNeedValidate(taskButton.NAME)
				? ValidateHelper.checkRequiredFieldsFilled(formData, this.#getRequiredFields())
				: []
		;
		if (Type.isArrayFilled(errors))
		{
			this.#showErrors(errors);

			return;
		}

		formData.append('taskId', this.taskId);
		formData.append('workflowId', this.workflowId);
		formData.append('taskName', this.taskName);
		formData.append(taskButton.NAME, taskButton.VALUE);
		const slider = BX.SidePanel.Instance.getSliderByWindow(window);

		uiButton.setDisabled(true);
		if (this.fastClose)
		{
			this.#canClose = true;
			slider?.close();
			slider.setCacheable(true);
		}

		doTaskAction(formData, slider, this.fastClose)
			.then(() => {
				slider?.setCacheable(false);
				Dom.addClass(this.workflowContent, 'fade-out');
				this.#getNextTaskOrClose(formData);
			})
			.catch((response) => {
				this.#showErrors(this.#prepareErrors(response.errors));
			})
			.finally(() => uiButton.setDisabled(false))
		;
	}

	#isNeedValidate(buttonName: string): boolean
	{
		return !(buttonName === 'cancel' && !this.saveVariables);
	}

	#getRequiredFields(): Array<TaskField>
	{
		if (Type.isNil(this.taskFields))
		{
			return [];
		}

		return this.taskFields.filter((field) => field.Required);
	}

	#getNextTaskOrClose(formData: FormData): void
	{
		ajax.runAction('bizproc.task.getUserTaskByWorkflowId', {
			data: formData,
		}).then((res) => {
			if (BX.type.isArray(res.data.additionalParams) && res.data.additionalParams.length === 0)
			{
				this.#canClose = true;
				BX.SidePanel.Instance.getSliderByWindow(window)?.close();
			}
			else
			{
				this.#renderNextTask(res.data);
			}
		}).catch((response) => {
			Dom.toggleClass(this.workflowContent, 'fade-out fade-in');
			MessageBox.alert(response.errors.pop().message);
		});
	}

	#prepareErrors(responseErrors: Array): Array<TaskFieldError>
	{
		const errors = [];
		for (const error of responseErrors)
		{
			errors.push({
				fieldId: error.customData ?? null,
				message: error.message,
			});
		}

		return errors;
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
						id: this.#canUseHumanResources ? 'structure-node' : 'department',
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
				this.#canClose = true;
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

	#showErrors(errors: Array<TaskFieldError>)
	{
		if (BX.type.isArray(errors))
		{
			const popupErrors = [];
			errors.forEach((error) => {
				const fieldName = error.fieldId;
				if (this.taskForm && fieldName)
				{
					this.#showError(error.message, fieldName);
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
	}

	#showError(message: string, id: string): void
	{
		const field = this.taskForm.querySelector(`[data-cid="${id}"]`);
		if (!field)
		{
			return;
		}

		const parentContainer = field.querySelector('.ui-form-content');
		let errorContainer = field.querySelector('.ui-form-notice');
		if (!errorContainer)
		{
			errorContainer = BX.Dom.create(
				'div',
				{ attrs: { className: 'ui-form-notice' } },
			);

			errorContainer.innerText = message;
			if (parentContainer)
			{
				BX.Dom.append(errorContainer, parentContainer);
			}
		}
	}

	#renderNextTask(data)
	{
		this.#isChanged = false;
		this.#renderTaskFields(data);

		if (data.additionalParams)
		{
			this.taskId = data.additionalParams.ID;
			this.fastClose = data.additionalParams.IS_LAST_TASK_FOR_USER;
			this.saveVariables = data.additionalParams.saveVariables;
			this.taskFields = data.additionalParams.FIELDS;
			const subject = this.workflowContent.querySelector('.bp-workflow-info__subject');
			if (subject)
			{
				subject.innerText = data.additionalParams.NAME;
			}
			const desc = this.workflowContent.querySelector('.bp-workflow-info__desc-inner');
			if (desc)
			{
				const descWrap = desc.closest('.bp-workflow-info__tabs-block');
				if (data.additionalParams.DESCRIPTION.length > 0)
				{
					Dom.removeClass(descWrap, 'block-hidden');
				}
				else
				{
					Dom.addClass(descWrap, 'block-hidden');
				}

				desc.innerHTML = data.additionalParams.DESCRIPTION;
				BX.UI.Hint.init(desc);
			}

			const slider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider)
			{
				const currentUrl = slider.getUrl();
				const newUrl = currentUrl.replace(/\/bizproc\/\d+\//, `/bizproc/${this.taskId}/`);
				slider.setUrl(newUrl);
				top.history.replaceState({}, '', newUrl);
			}
		}

		if (data.additionalParams && data.additionalParams.BUTTONS)
		{
			this.taskButtons = data.additionalParams.BUTTONS;
		}

		this.init();
		Dom.removeClass(this.workflowContent, 'fade-out');
		Dom.addClass(this.workflowContent, 'fade-in');

		Event.bindOnce(this.workflowContent, 'animationend', () => {
			Dom.removeClass(this.workflowContent, 'fade-in');
		});
	}

	#renderTaskFields(data)
	{
		const taskFields = this.workflowContent.querySelector('.bp-workflow-info__editor');
		if (BX.type.isArray(data.html) && data.html.length > 0)
		{
			Dom.removeClass(taskFields, 'block-hidden');
			Dom.clean(this.taskForm);
			data.html.forEach((renderedControl, controlId) => {
				const fieldData = data.additionalParams?.FIELDS?.[controlId];
				if (fieldData)
				{
					const labelClass = fieldData.Required ? 'ui-form-label --required' : 'ui-form-label';
					const node = Tag.render`
						<div class="ui-form-row" data-cid="${Text.encode(fieldData.Id)}">
							<div class="${labelClass}">
								<div class="ui-ctl-label-text">${Text.encode(fieldData.Name)}</div>
							</div>
							<div class="ui-form-content"></div>
						</div>
					`;

					BX.Runtime.html(node.querySelector('.ui-form-content'), renderedControl);
					this.taskForm.append(node);
				}
			});
		}
		else
		{
			Dom.addClass(taskFields, 'block-hidden');
		}
	}

	#showConfirmDialog()
	{
		this.#messageBox = MessageBox.confirm(
			Loc.getMessage('BPWFI_SLIDER_CONFIRM_DESCRIPTION'),
			Loc.getMessage('BPWFI_SLIDER_CONFIRM_TITLE'),
			() => {
				this.#canClose = true;
				BX.SidePanel.Instance.getSliderByWindow(window)?.close();
			},
			Loc.getMessage('BPWFI_SLIDER_CONFIRM_ACCEPT'),
			() => {
				this.#messageBox.close();
				this.#messageBox = null;
			},
			Loc.getMessage('BPWFI_SLIDER_CONFIRM_CANCEL'),
		);
	}
}
