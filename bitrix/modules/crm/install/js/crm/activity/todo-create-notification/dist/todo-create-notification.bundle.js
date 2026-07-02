/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_activity_todoEditorV2, crm_activity_todoNotificationSkip, crm_activity_todoNotificationSkipMenu, main_core, main_core_events, main_popup, ui_buttons) {
	'use strict';

	const SAVE_BUTTON_ID = 'save';
	const CANCEL_BUTTON_ID = 'cancel';
	const SKIP_BUTTON_ID = 'skip';
	class TodoCreateNotification {
		#timeline = null;
		#entityTypeId = null;
		#entityId = null;
		#entityStageId = null;
		#stageIdField = null;
		#finalStages = null;
		#allowCloseSlider = false;
		#isSkipped = false;
		#popup = null;
		#toDoEditor = null;
		#skipProvider = null;
		#skipMenu = null;
		#sliderIsMinimizing = false;
		#analytics = null;
		#refs = new main_core.Cache.MemoryCache();
		constructor(params) {
			this.#entityTypeId = params.entityTypeId;
			this.#entityId = params.entityId;
			this.#entityStageId = params.entityStageId;
			this.#stageIdField = params.stageIdField;
			this.#finalStages = params.finalStages;
			this.#isSkipped = Boolean(params.skipPeriod);
			this.#analytics = params.analytics ?? {};
			if (BX.CrmTimelineManager) {
				this.#timeline = BX.CrmTimelineManager.getDefault();
			}
			this.#bindEvents();
			this.#skipProvider = new crm_activity_todoNotificationSkip.TodoNotificationSkip({
				entityTypeId: this.#entityTypeId,
				onSkippedPeriodChange: this.#onSkippedPeriodChange.bind(this)
			});
			this.#skipMenu = new crm_activity_todoNotificationSkipMenu.TodoNotificationSkipMenu({
				entityTypeId: this.#entityTypeId,
				selectedValue: params.skipPeriod
			});
		}
		#bindEvents() {
			if (this.#getSliderInstance()) {
				main_core_events.EventEmitter.subscribe(this.#getSliderInstance(), 'SidePanel.Slider:onClose', this.#onCloseSlider.bind(this));
				main_core_events.EventEmitter.subscribe('Crm.EntityModel.Change', this.#onEntityModelChange.bind(this));
				main_core_events.EventEmitter.subscribe('onCrmEntityUpdate', this.#onEntityUpdate.bind(this));
				main_core_events.EventEmitter.subscribe('onCrmEntityDelete', this.#onEntityDelete.bind(this));
			}
			main_core_events.EventEmitter.subscribe('Crm.InterfaceToolbar.MenuBuild', this.#onToolbarMenuBuild.bind(this));
		}
		#getSliderInstance() {
			if (top.BX && top.BX.SidePanel) {
				const slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
				if (slider && slider.isOpen()) {
					return slider;
				}
			}
			return null;
		}
		#isSliderMinimizeAvailable() {
			return Object.hasOwn(BX.SidePanel.Slider.prototype, 'minimize') && Object.hasOwn(BX.SidePanel.Slider.prototype, 'isMinimizing');
		}
		#onCloseSlider(event) {
			if (this.#allowCloseSlider || this.#isSkipped) {
				return;
			}
			const [sliderEvent] = event.getCompatData();
			if (sliderEvent.getSlider() !== top.BX.SidePanel.Instance.getSliderByWindow(window)) {
				return;
			}
			if (!sliderEvent.isActionAllowed()) {
				return; // editor has unsaved fields
			}
			if (!this.#timeline || this.#timeline.hasScheduledItems()) {
				return; // timeline already has scheduled activities
			}
			if (this.#finalStages.includes(this.#entityStageId)) {
				return; // element has final stage
			}
			this.#sliderIsMinimizing = this.#isSliderMinimizeAvailable() && sliderEvent.getSlider()?.isMinimizing();
			sliderEvent.denyAction();
			setTimeout(async () => {
				this.#showTodoCreationNotification();
			}, 100);
		}
		#onEntityUpdate(event) {
			const [eventParams] = event.getCompatData();
			if (Object.hasOwn(eventParams, 'entityData') && Object.hasOwn(eventParams.entityData, this.#stageIdField)) {
				this.#entityStageId = eventParams.entityData[this.#stageIdField];
			}
		}
		#onEntityDelete(event) {
			const [eventParams] = event.getCompatData();
			if (Object.hasOwn(eventParams, 'id') && Text.toString(eventParams.id) === Text.toString(this.#entityId)) {
				this.#allowCloseSlider = true;
			}
		}
		#onEntityModelChange(event) {
			const [model, eventParams] = event.getCompatData();
			if (eventParams.fieldName === this.#stageIdField) {
				this.#entityStageId = model.getStringField(this.#stageIdField, this.#entityStageId);
			}
		}
		#onSkippedPeriodChange(period) {
			this.#isSkipped = Boolean(period);
		}
		#onToolbarMenuBuild(event) {
			const [, {
				items
			}] = event.getData();
			items.push({
				delimiter: true
			});
			for (const skipItem of this.#skipMenu.getItems()) {
				items.push(skipItem);
			}
		}
		#onSaveHotkeyPressed() {
			const saveButton = this.#popup?.getButton(SAVE_BUTTON_ID);
			if (!saveButton.getState())
				// if save button is not disabled
				{
					this.#saveTodo();
				}
		}
		#onChangeUploaderContainerSize() {
			if (this.#popup) {
				this.#popup.adjustPosition();
			}
		}
		#onSkipMenuItemSelect(period) {
			this.#popup?.getButton(SKIP_BUTTON_ID)?.getMenuWindow()?.close();
			this.#popup?.getButton(SAVE_BUTTON_ID)?.setState(ui_buttons.ButtonState.DISABLED);
			this.#popup?.getButton(CANCEL_BUTTON_ID)?.setState(ui_buttons.ButtonState.DISABLED);
			this.#popup?.getButton(SKIP_BUTTON_ID)?.setState(ui_buttons.ButtonState.WAITING);
			this.getTodoEditor().cancel({
				analytics: {
					...this.#analytics,
					element: crm_activity_todoEditorV2.TodoEditorV2.AnalyticsElement.skipPeriodButton,
					notificationSkipPeriod: period
				}
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
		#saveTodo() {
			this.#popup?.getButton(SAVE_BUTTON_ID)?.setState(ui_buttons.ButtonState.WAITING);
			this.#popup?.getButton(CANCEL_BUTTON_ID)?.setState(ui_buttons.ButtonState.DISABLED);
			this.#popup?.getButton(SKIP_BUTTON_ID)?.setState(ui_buttons.ButtonState.DISABLED);
			this.getTodoEditor().save().then(result => {
				this.#revertButtonsState();
				if (!(Object.hasOwn(result, 'errors') && result.errors.length > 0)) {
					this.#allowCloseSlider = true;
					this.#closePopup();
					this.#getSliderInstance()?.close();
				}
			}).catch(() => {
				this.#revertButtonsState();
			});
		}
		#cancel() {
			void this.getTodoEditor().cancel({
				analytics: {
					...this.#analytics,
					element: crm_activity_todoEditorV2.TodoEditorV2.AnalyticsElement.cancelButton
				}
			}).then(() => {
				this.#closePopup();
			});
		}
		#revertButtonsState() {
			this.#popup?.getButton(SAVE_BUTTON_ID)?.setState(null);
			this.#popup?.getButton(CANCEL_BUTTON_ID)?.setState(null);
			this.#popup?.getButton(SKIP_BUTTON_ID)?.setState(null);
		}
		#closePopup() {
			this.#popup?.close();
		}
		#closeSlider() {
			this.#allowCloseSlider = true;
			if (this.#isSliderMinimizeAvailable() && this.#sliderIsMinimizing) {
				this.#getSliderInstance()?.minimize();
				return;
			}
			this.#getSliderInstance()?.close();
		}
		#showTodoCreationNotification() {
			if (!this.#popup) {
				const htmlStyles = getComputedStyle(document.documentElement);
				const popupPadding = htmlStyles.getPropertyValue('--ui-space-inset-sm');
				const popupPaddingNumberValue = parseFloat(popupPadding) || 12;
				const popupOverlayColor = htmlStyles.getPropertyValue('--ui-color-base-solid') || '#000000';
				const {
					innerWidth
				} = window;
				this.#popup = main_popup.PopupManager.create({
					id: `todo-create-confirm-${this.#entityTypeId}-${this.#entityId}`,
					closeIcon: false,
					padding: popupPaddingNumberValue,
					overlay: {
						opacity: 40,
						backgroundColor: popupOverlayColor
					},
					content: this.#getPopupContent(),
					minWidth: 537,
					width: Math.round(innerWidth * 0.45),
					maxWidth: 737,
					events: {
						onClose: this.#closeSlider.bind(this),
						onFirstShow: () => {
							this.getTodoEditor().show();
							this.getTodoEditor().setFocused();
						}
					},
					className: 'crm-activity__todo-create-notification-popup'
				});
			}
			this.#popup.show();
			setTimeout(() => {
				this.getTodoEditor().setFocused();
			}, 10);
			setTimeout(() => {
				this.#popup.setClosingByEsc(true);
				main_core.Event.bind(document, 'keyup', event => {
					if (event.key === 'Escape') {
						void this.getTodoEditor().cancel({
							analytics: {
								...this.#analytics,
								element: crm_activity_todoEditorV2.TodoEditorV2.AnalyticsElement.cancelButton
							}
						});
					}
				});
			}, 300);
		}
		#getPopupContent() {
			return this.#refs.remember('content', () => {
				const buttonsContainer = main_core.Tag.render`
				<div class="crm-activity__todo-create-notification_footer">
					<div class="crm-activity__todo-create-notification_buttons-container">
						<button 
							class="ui-btn ui-btn-xs ui-btn-primary ui-btn-round"
							onclick="${this.#saveTodo.bind(this)}"
						>
							${main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_OK_BUTTON_V2')}
						</button>
						<button
							class="ui-btn ui-btn-xs ui-btn-link"
							onclick="${this.#cancel.bind(this)}"
						>
							${main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_CANCEL_BUTTON_V2')}
						</button>
					</div>
					${this.#getPreparedForV2NotificationSkipButton().render()}
				</div>
			`;
				return main_core.Tag.render`
				<div>
					<div class="crm-activity__todo-create-notification_title --v2">
						${this.#getNotificationTitle()}
					</div>
					<div>
						${this.#getTodoEditorContainer()}
					</div>
					${buttonsContainer}
				</div>
			`;
			});
		}
		#getTodoEditorContainer() {
			return this.#refs.remember('editor', () => {
				return main_core.Tag.render`<div></div>`;
			});
		}
		#getNotificationTitle() {
			let code = null;
			switch (this.#entityTypeId) {
				case BX.CrmEntityType.enumeration.lead:
					code = 'CRM_ACTIVITY_TODO_NOTIFICATION_TITLE_V2_LEAD';
					break;
				case BX.CrmEntityType.enumeration.deal:
					code = 'CRM_ACTIVITY_TODO_NOTIFICATION_TITLE_V2_DEAL';
					break;
				default:
					code = 'CRM_ACTIVITY_TODO_NOTIFICATION_TITLE_V2';
			}
			return main_core.Loc.getMessage(code);
		}
		#getPreparedForV2NotificationSkipButton() {
			return this.#createNotificationSkipButton().setNoCaps().addClass('crm-activity__todo-create-notification_skip-button');
		}
		getTodoEditor() {
			if (this.#toDoEditor !== null) {
				return this.#toDoEditor;
			}
			const params = {
				container: this.#getTodoEditorContainer(),
				ownerTypeId: this.#entityTypeId,
				ownerId: this.#entityId,
				currentUser: this.#timeline.getCurrentUser(),
				pingSettings: this.#timeline.getPingSettings(),
				events: {
					onSaveHotkeyPressed: this.#onSaveHotkeyPressed.bind(this),
					onChangeUploaderContainerSize: this.#onChangeUploaderContainerSize.bind(this)
				},
				borderColor: crm_activity_todoEditorV2.TodoEditorV2.BorderColor.PRIMARY
			};
			params.calendarSettings = this.#timeline.getCalendarSettings();
			params.colorSettings = this.#timeline.getColorSettings();
			params.defaultDescription = '';
			params.analytics = this.#analytics;
			this.#toDoEditor = new crm_activity_todoEditorV2.TodoEditorV2(params);
			return this.#toDoEditor;
		}
		#createNotificationSkipButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_V2'),
				color: ui_buttons.ButtonColor.LINK,
				id: SKIP_BUTTON_ID,
				dropdown: true,
				menu: {
					closeByEsc: true,
					items: this.#getSkipMenuItems(),
					minWidth: 233
				}
			});
		}
		#getSkipMenuItems() {
			return [{
				id: 'day',
				text: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_FOR_DAY'),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'day')
			}, {
				id: 'week',
				text: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_FOR_WEEK'),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'week')
			}, {
				id: 'month',
				text: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_FOR_MONTH'),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'month')
			}, {
				id: 'forever',
				text: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_FOREVER'),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'forever')
			}];
		}
		#showCancelNotificationInParentWindow() {
			if (top.BX && top.BX.Runtime) {
				const entityTypeId = this.#entityTypeId;
				void top.BX.Runtime.loadExtension('crm.activity.todo-notification-skip').then(exports$1 => {
					const skipProvider = new exports$1.TodoNotificationSkip({
						entityTypeId
					});
					skipProvider.showCancelPeriodNotification();
				});
			}
		}
	}

	exports.TodoCreateNotification = TodoCreateNotification;

})(this.BX.Crm.Activity = this.BX.Crm.Activity || {}, BX.Crm.Activity, BX.Crm.Activity, BX.Crm.Activity, BX, BX.Event, BX.Main, BX.UI);
//# sourceMappingURL=todo-create-notification.bundle.js.map
