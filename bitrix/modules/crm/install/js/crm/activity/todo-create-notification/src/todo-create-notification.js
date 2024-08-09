import { TodoEditor } from 'crm.activity.todo-editor';
import { TodoEditorV2 } from 'crm.activity.todo-editor-v2';
import { TodoNotificationSkip } from 'crm.activity.todo-notification-skip';
import { TodoNotificationSkipMenu } from 'crm.activity.todo-notification-skip-menu';
import { Event, Loc, Tag } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Popup, PopupManager } from 'main.popup';
import { Button, ButtonColor, ButtonState, CancelButton, SaveButton } from 'ui.buttons';

import './todo-create-notification.css';

declare type TodoCreateNotificationParams = {
	entityTypeId: number,
	entityId: number,
	entityStageId: string,
	stageIdField: string,
	finalStages: Array<string>,
	skipPeriod: ?string,
	useTodoEditorV2?: boolean,
}

const SAVE_BUTTON_ID = 'save';
const CANCEL_BUTTON_ID = 'cancel';
const SKIP_BUTTON_ID = 'skip';

export class TodoCreateNotification
{
	#timeline: ?Object = null;
	#entityTypeId: string = null;
	#entityId: string = null;
	#entityStageId: string = null;
	#stageIdField: string = null;
	#finalStages: Array<string> = null;

	#allowCloseSlider: boolean = false;
	#isSkipped: boolean = false;
	#popup: ?Popup = null;
	#toDoEditor: ?TodoEditorV2 = null;
	#skipProvider: TodoNotificationSkip = null;
	#skipMenu: ?TodoNotificationSkipMenu = null;
	#sliderIsMinimizing: boolean = false;
	#useTodoEditorV2: boolean = false;

	constructor(params: TodoCreateNotificationParams)
	{
		this.#entityTypeId = params.entityTypeId;
		this.#entityId = params.entityId;
		this.#entityStageId = params.entityStageId;
		this.#stageIdField = params.stageIdField;
		this.#finalStages = params.finalStages;
		this.#isSkipped = Boolean(params.skipPeriod);
		this.#useTodoEditorV2 = (params.useTodoEditorV2 === true);

		if (BX.CrmTimelineManager)
		{
			this.#timeline = BX.CrmTimelineManager.getDefault();
		}

		this.#bindEvents();

		this.#skipProvider = new TodoNotificationSkip({
			entityTypeId: this.#entityTypeId,
			onSkippedPeriodChange: this.#onSkippedPeriodChange.bind(this),
		});
		this.#skipMenu = new TodoNotificationSkipMenu({
			entityTypeId: this.#entityTypeId,
			selectedValue: params.skipPeriod,
		});
	}

	#bindEvents(): void
	{
		if (this.#getSliderInstance())
		{
			EventEmitter.subscribe(this.#getSliderInstance(), 'SidePanel.Slider:onClose', this.#onCloseSlider.bind(this));
			EventEmitter.subscribe('Crm.EntityModel.Change', this.#onEntityModelChange.bind(this));
			EventEmitter.subscribe('onCrmEntityUpdate', this.#onEntityUpdate.bind(this));
			EventEmitter.subscribe('onCrmEntityDelete', this.#onEntityDelete.bind(this));
		}

		EventEmitter.subscribe('Crm.InterfaceToolbar.MenuBuild', this.#onToolbarMenuBuild.bind(this));
	}

	#getSliderInstance(): BX.SidePanel.Slider | null
	{
		if (top.BX && top.BX.SidePanel)
		{
			const slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider && slider.isOpen())
			{
				return slider;
			}
		}

		return null;
	}

	#isSliderMinimizeAvailable(): boolean
	{
		return Object.hasOwn(BX.SidePanel.Slider.prototype, 'minimize')
			&& Object.hasOwn(BX.SidePanel.Slider.prototype, 'isMinimizing')
		;
	}

	#onCloseSlider(event: BaseEvent): void
	{
		if (this.#allowCloseSlider || this.#isSkipped)
		{
			return;
		}

		const [sliderEvent] = event.getCompatData();

		if (sliderEvent.getSlider() !== top.BX.SidePanel.Instance.getSliderByWindow(window))
		{
			return;
		}

		if (!sliderEvent.isActionAllowed())
		{
			return; // editor has unsaved fields
		}

		if (!this.#timeline || this.#timeline.hasScheduledItems())
		{
			return; // timeline already has scheduled activities
		}

		if (this.#finalStages.includes(this.#entityStageId))
		{
			return; // element has final stage
		}

		this.#sliderIsMinimizing = this.#isSliderMinimizeAvailable() && sliderEvent.getSlider()?.isMinimizing();
		sliderEvent.denyAction();

		setTimeout(() => {
			this.#showTodoCreationNotification();
		}, 100);
	}

	#onEntityUpdate(event: BaseEvent): void
	{
		const [eventParams] = event.getCompatData();
		if (
			Object.hasOwn(eventParams, 'entityData')
			&& Object.hasOwn(eventParams.entityData, this.#stageIdField)
		)
		{
			this.#entityStageId = eventParams.entityData[this.#stageIdField];
		}
	}

	#onEntityDelete(event: BaseEvent): void
	{
		const [eventParams] = event.getCompatData();
		if (
			Object.hasOwn(eventParams, 'id')
			&& Text.toString(eventParams.id) === Text.toString(this.#entityId)
		)
		{
			this.#allowCloseSlider = true;
		}
	}

	#onEntityModelChange(event: BaseEvent): void
	{
		const [model, eventParams] = event.getCompatData();

		if (eventParams.fieldName === this.#stageIdField)
		{
			this.#entityStageId = model.getStringField(this.#stageIdField, this.#entityStageId);
		}
	}

	#onSkippedPeriodChange(period: string): void
	{
		this.#isSkipped = Boolean(period);
	}

	#onToolbarMenuBuild(event: BaseEvent): void
	{
		const [, { items }] = event.getData();
		items.push({ delimiter: true });
		for (const skipItem of this.#skipMenu.getItems())
		{
			items.push(skipItem);
		}
	}

	#onChangeDescription(event: BaseEvent): void
	{
		const { description } = event.getData();
		const saveButton = this.#popup?.getButton(SAVE_BUTTON_ID);
		if (description.length === 0 && !saveButton.getState())
		{
			saveButton.setState(ButtonState.DISABLED);
		}
		else if (description.length > 0 && saveButton.getState() === ButtonState.DISABLED)
		{
			saveButton.setState(null);
		}
	}

	#onSaveHotkeyPressed(): void
	{
		const saveButton = this.#popup?.getButton(SAVE_BUTTON_ID);
		if (!saveButton.getState()) // if save button is not disabled
		{
			this.#saveTodo();
		}
	}

	#onChangeUploaderContainerSize()
	{
		if (this.#popup)
		{
			this.#popup.adjustPosition();
		}
	}

	#onSkipMenuItemSelect(period): void
	{
		this.#popup?.getButton(SKIP_BUTTON_ID)?.getMenuWindow()?.close();

		this.#popup?.getButton(SAVE_BUTTON_ID)?.setState(ButtonState.DISABLED);
		this.#popup?.getButton(CANCEL_BUTTON_ID)?.setState(ButtonState.DISABLED);
		this.#popup?.getButton(SKIP_BUTTON_ID)?.setState(ButtonState.WAITING);

		this.#toDoEditor.cancel({
			analytics: {
				subSection: TodoEditorV2.AnalyticsSubSection.notificationPopup,
				element: TodoEditorV2.AnalyticsElement.skipPeriodButton,
				notificationSkipPeriod: period,
			},
		});

		this.#skipProvider.saveSkippedPeriod(period).then(() => {
			this.#isSkipped = Boolean(period);
			this.#skipMenu.setSelectedValue(period);
			this.#revertButtonsState();
			this.#allowCloseSlider = true;
			this.#showCancelNotificationInParentWindow();
			this.#getSliderInstance()?.close();
		}).catch(() => {
			this.#revertButtonsState();
		});
	}

	#saveTodo(): void
	{
		this.#popup?.getButton(SAVE_BUTTON_ID)?.setState(ButtonState.WAITING);
		this.#popup?.getButton(CANCEL_BUTTON_ID)?.setState(ButtonState.DISABLED);
		this.#popup?.getButton(SKIP_BUTTON_ID)?.setState(ButtonState.DISABLED);

		this.#toDoEditor.save().then((result) => {
			this.#revertButtonsState();

			if (!(Object.hasOwn(result, 'errors') && result.errors.length > 0))
			{
				this.#allowCloseSlider = true;
				this.#closePopup();
				this.#getSliderInstance()?.close();
			}
		}).catch(() => {
			this.#revertButtonsState();
		});
	}

	#cancel(): void
	{
		void this.#toDoEditor.cancel({
			analytics: {
				subSection: TodoEditorV2.AnalyticsSubSection.notificationPopup,
				element: TodoEditorV2.AnalyticsElement.cancelButton,
			},
		}).then(() => {
			this.#closePopup();
		});
	}

	#revertButtonsState()
	{
		this.#popup?.getButton(SAVE_BUTTON_ID)?.setState(null);
		this.#popup?.getButton(CANCEL_BUTTON_ID)?.setState(null);
		this.#popup?.getButton(SKIP_BUTTON_ID)?.setState(null);
	}

	#closePopup(): void
	{
		this.#popup?.close();
	}

	#closeSlider(): void
	{
		this.#allowCloseSlider = true;
		if (this.#isSliderMinimizeAvailable() && this.#sliderIsMinimizing)
		{
			this.#getSliderInstance()?.minimize();

			return;
		}

		this.#getSliderInstance()?.close();
	}

	#showTodoCreationNotification(): void
	{
		if (!this.#popup)
		{
			const htmlStyles = getComputedStyle(document.documentElement);
			const popupPadding = htmlStyles.getPropertyValue('--ui-space-inset-sm');
			const popupPaddingNumberValue = parseFloat(popupPadding) || 12;
			const popupOverlayColor = htmlStyles.getPropertyValue('--ui-color-base-solid') || '#000000';

			const { innerWidth } = window;

			this.#popup = PopupManager.create({
				id: `todo-create-confirm-${this.#entityTypeId}-${this.#entityId}`,
				closeIcon: !this.#useTodoEditorV2,
				padding: popupPaddingNumberValue,
				overlay: {
					opacity: 40,
					backgroundColor: popupOverlayColor,
				},
				content: this.#getPopupContent(),
				buttons: this.#getPopupButtons(),
				minWidth: 537,
				width: Math.round(innerWidth * 0.45),
				maxWidth: 737,
				events: {
					onClose: this.#closeSlider.bind(this),
				},
				className: 'crm-activity__todo-create-notification-popup',
			});
		}

		this.#popup.show();

		setTimeout(() => {
			this.#toDoEditor.setFocused();
		}, 10);

		setTimeout(() => {
			this.#popup.setClosingByEsc(true);

			Event.bind(document, 'keyup', (event) => {
				if (event.key === 'Escape')
				{
					void this.#toDoEditor.cancel({
						analytics: {
							subSection: TodoEditorV2.AnalyticsSubSection.notificationPopup,
							element: TodoEditorV2.AnalyticsElement.cancelButton,
						},
					});
				}
			});
		}, 300);
	}

	#getPopupDescription(): string
	{
		// eslint-disable-next-line init-declarations
		let messagePhrase;
		switch (this.#entityTypeId)
		{
			case BX.CrmEntityType.enumeration.lead:
				messagePhrase = 'CRM_ACTIVITY_TODO_NOTIFICATION_DESCRIPTION_LEAD';
				break;
			case BX.CrmEntityType.enumeration.deal:
				messagePhrase = 'CRM_ACTIVITY_TODO_NOTIFICATION_DESCRIPTION_DEAL';
				break;
			default:
				messagePhrase = 'CRM_ACTIVITY_TODO_NOTIFICATION_DESCRIPTION';
		}

		return Loc.getMessage(messagePhrase);
	}

	#getPopupContent(): HTMLElement
	{
		const editorContainer = Tag.render`<div></div>`;
		let content = null;

		if (this.#useTodoEditorV2)
		{
			const buttonsContainer = Tag.render`
				<div class="crm-activity__todo-create-notification_footer">
					<div class="crm-activity__todo-create-notification_buttons-container">
						<button 
							class="ui-btn ui-btn-xs ui-btn-primary ui-btn-round"
							onclick="${this.#saveTodo.bind(this)}"
						>
							${Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_OK_BUTTON_V2')}
						</button>
						<button
							class="ui-btn ui-btn-xs ui-btn-link"
							onclick="${this.#cancel.bind(this)}"
						>
							${Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_CANCEL_BUTTON_V2')}
						</button>
					</div>
					${this.#getPreparedForV2NotificationSkipButton().render()}
				</div>
			`;

			content = Tag.render`
				<div>
					<div class="crm-activity__todo-create-notification_title --v2">
						${this.#getNotificationTitle()}
					</div>
					<div>
						${editorContainer}
					</div>
					${buttonsContainer}
				</div>
			`;
		}
		else
		{
			content = Tag.render`
				<div class="crm-activity__todo-create-notification">
					<div class="crm-activity__todo-create-notification_title">
						${Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_TITLE')}
					</div>
					<div class="crm-activity__todo-create-notification_content">
						<div class="crm-activity__todo-create-notification_description">
							${this.#getPopupDescription()}
						</div>
						${editorContainer}
					</div>
				</div>
			`;
		}

		this.#createToDoEditor(editorContainer).show();

		return content;
	}

	#getNotificationTitle(): string
	{
		let code = null;

		switch (this.#entityTypeId)
		{
			case BX.CrmEntityType.enumeration.lead:
				code = 'CRM_ACTIVITY_TODO_NOTIFICATION_TITLE_V2_LEAD';
				break;
			case BX.CrmEntityType.enumeration.deal:
				code = 'CRM_ACTIVITY_TODO_NOTIFICATION_TITLE_V2_DEAL';
				break;
			default:
				code = 'CRM_ACTIVITY_TODO_NOTIFICATION_TITLE_V2';
		}

		return Loc.getMessage(code);
	}

	#getPreparedForV2NotificationSkipButton(): Button
	{
		return this.#createNotificationSkipButton()
			.setNoCaps()
			.addClass('crm-activity__todo-create-notification_skip-button')
		;
	}

	#createToDoEditor(container: HTMLDivElement): TodoEditor | TodoEditorV2
	{
		const params = {
			container,
			ownerTypeId: this.#entityTypeId,
			ownerId: this.#entityId,
			currentUser: this.#timeline.getCurrentUser(),
			pingSettings: this.#timeline.getPingSettings(),
			events: {
				onSaveHotkeyPressed: this.#onSaveHotkeyPressed.bind(this),
				onChangeUploaderContainerSize: this.#onChangeUploaderContainerSize.bind(this),
			},
			borderColor: TodoEditor.BorderColor.PRIMARY,
		};

		if (this.#useTodoEditorV2)
		{
			params.calendarSettings = this.#timeline.getCalendarSettings();
			params.colorSettings = this.#timeline.getColorSettings();
			params.defaultDescription = '';
			params.analytics = {
				section: TodoEditorV2.AnalyticsSubSection.details,
				subSection: TodoEditorV2.AnalyticsSubSection.notificationPopup,
			};

			this.#toDoEditor = new TodoEditorV2(params);
		}
		else
		{
			params.events.onChangeDescription = this.#onChangeDescription.bind(this);
			this.#toDoEditor = new TodoEditor(params);
		}

		return this.#toDoEditor;
	}

	#getPopupButtons(): Array<Button>
	{
		if (this.#useTodoEditorV2)
		{
			return [];
		}

		return [
			this.#createSaveButton(),
			this.#createCancelButton(),
			this.#createNotificationSkipButton(),
		];
	}

	#createSaveButton(): Button
	{
		return new SaveButton({
			id: SAVE_BUTTON_ID,
			round: true,
			state: this.#toDoEditor.getDescription() ? null : ButtonState.DISABLED,
			events: {
				click: this.#saveTodo.bind(this),
			},
		});
	}

	#createCancelButton(): Button
	{
		return new CancelButton({
			text: Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_CANCEL'),
			color: ButtonColor.LIGHT_BORDER,
			id: CANCEL_BUTTON_ID,
			round: true,
			events: {
				click: this.#cancel.bind(this),
			},
		});
	}

	#createNotificationSkipButton(): Button
	{
		return new Button({
			text: Loc.getMessage(
				this.#useTodoEditorV2
					? 'CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_V2'
					: 'CRM_ACTIVITY_TODO_NOTIFICATION_SKIP',
			),
			color: ButtonColor.LINK,
			id: SKIP_BUTTON_ID,
			dropdown: true,
			menu: {
				closeByEsc: true,
				items: this.#getSkipMenuItems(),
				minWidth: 233,
			},
		});
	}

	#getSkipMenuItems(): Array
	{
		return [
			{
				id: 'day',
				text: Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_FOR_DAY'),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'day'),
			},
			{
				id: 'week',
				text: Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_FOR_WEEK'),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'week'),
			},
			{
				id: 'month',
				text: Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_FOR_MONTH'),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'month'),
			},
			{
				id: 'forever',
				text: Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_FOREVER'),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'forever'),
			},
		];
	}

	#showCancelNotificationInParentWindow()
	{
		if (top.BX && top.BX.Runtime)
		{
			const entityTypeId = this.#entityTypeId;
			void top.BX.Runtime.loadExtension('crm.activity.todo-notification-skip')
				.then((exports) => {
					const skipProvider = new exports.TodoNotificationSkip({
						entityTypeId,
					});
					skipProvider.showCancelPeriodNotification();
				})
			;
		}
	}
}
