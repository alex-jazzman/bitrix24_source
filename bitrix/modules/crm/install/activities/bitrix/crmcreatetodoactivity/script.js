/* eslint-disable */
(function (bizproc_automation, crm_field_colorSelector, main_core, main_core_events, main_popup, ui_entitySelector, ui_iconSet_api_core) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Activity');
	class CrmCreateTodoActivity {
		#isRobot;
		#colorSelector;
		#colorId;
		#locationSelectorWrapper;
		#additionalSettingsButton;
		#documentFields;
		#additionalSettingsWrapper;
		#documentType;
		#additionalSettingsFields;
		#dataConfig;
		#fileSelector;
		#fileControl;
		#diskControl;
		#diskControlItems;
		#attachmentType;
		constructor(options) {
			this.#documentFields = options.documentFields;
			this.#isRobot = options.isRobot === true;
			this.#documentType = options.documentType;
			if (this.#isRobot) {
				this.#assertValidOptions(options);
				this.#additionalSettingsWrapper = options.additionalSettingsWrapper;
				this.#additionalSettingsButton = options.additionalSettingsButton;
				main_core.Event.bind(this.#additionalSettingsButton, 'click', this.#onAdditionalSettingsButtonClick.bind(this));
				this.#dataConfig = options.dataConfig;
				this.#colorSelector = this.#getColorSelector(options.colorSelectorWrapper, options.colorSettings, options.isAvailableColor);
				this.#colorId = options.colorSettings.selectedValueId;
				main_core_events.EventEmitter.subscribe(this.#colorSelector, crm_field_colorSelector.ColorSelectorEvents.EVENT_COLORSELECTOR_VALUE_CHANGE, this.#onColorChanged.bind(this));
				this.#setOnBeforeSaveSettingsCallback();
				this.#additionalSettingsFields = {};
			} else if (options.attachmentType) {
				this.#fileControl = options.fileControl;
				this.#diskControl = options.diskControl;
				this.#diskControlItems = options.diskControlItems;
				this.#attachmentType = options.attachmentType.value;
				main_core.Event.bind(options.attachmentType, 'change', event => this.#onChangeAttachmentTypeHandler(event.target.value));
				main_core.Event.bind(options.showDiskFileDialogButton, 'click', this.#openDiskFileDialog.bind(this));
			}
		}
		#setOnBeforeSaveSettingsCallback() {
			if (!this.#isRobot) {
				return;
			}
			const dialog = bizproc_automation.Designer.getInstance()?.getRobotSettingsDialog();
			if (dialog?.robot) {
				dialog.robot.setOnBeforeSaveRobotSettings(this.#onBeforeSaveRobotSettings.bind(this));
			}
		}
		#onBeforeSaveRobotSettings() {
			const data = {
				color_id: this.#colorId
			};
			if (this.#additionalSettingsFields.LocationId) {
				data.location_id = this.locationSelectorDialog.getTags()[0]?.id;
			}
			return data;
		}
		#onColorChanged({
			data
		}) {
			this.#colorId = data.value;
		}
		#getLocationSelectorDialog(locationId) {
			if (this.locations === null) {
				return null;
			}
			if (main_core.Type.isNil(this.locationSelectorDialog)) {
				const tabs = [{
					id: 'location',
					title: main_core.Loc.getMessage('CRM_BP_CREATE_TODO_LOCATION_SELECTOR_ROOMS_ENTITY_TITLE')
				}];
				const items = [];
				this.locations.rooms?.forEach(room => {
					items.push({
						id: room.ID,
						title: room.NAME,
						subtitle: this.#getCapacityTitle(room.CAPACITY ?? null),
						entityId: 'location',
						tabs: 'location',
						avatarOptions: {
							bgColor: room.COLOR,
							bgSize: '22px',
							bgImage: 'none'
						},
						customData: {
							locationId: room.LOCATION_ID
						}
					});
				});
				this.locationSelectorDialog = new ui_entitySelector.TagSelector({
					multiple: false,
					textBoxAutoHide: true,
					dialogOptions: {
						id: 'todo-robot-calendar-room-selector-dialog',
						targetNode: this.#locationSelectorWrapper,
						context: 'CRM_ACTIVITY_TODO_ROBOT_CALENDAR_ROOM',
						multiple: false,
						dropdownMode: true,
						showAvatars: true,
						enableSearch: true,
						width: 450,
						height: 300,
						zIndex: 2500,
						items,
						tabs
					}
				});
				if (locationId) {
					const locationTag = items.find(location => location.id === locationId) ?? this.#getLocationExpressionTag(locationId);
					this.locationSelectorDialog.addTag(locationTag);
				}
			}
			return this.locationSelectorDialog;
		}
		#getLocationExpressionTag(expression) {
			return {
				id: expression,
				title: expression,
				entityId: 'location'
			};
		}
		async #renderLocation(value) {
			this.renderControl('Duration');
			this.locations = await this.#fetchRoomsManagerData();
			const wrapper = main_core.Tag.render`<div id="id_location"></div>`;
			this.#getLocationSelectorDialog(value).renderTo(wrapper);
			return wrapper;
		}
		async #fetchRoomsManagerData() {
			return new Promise(resolve => {
				main_core.ajax.runAction('calendar.api.locationajax.getRoomsManagerData').then(response => {
					resolve(response.data);
				}).catch(errors => {
					console.log(errors);
				});
			});
		}
		#prepareMenuItems() {
			const menuItems = [];
			// eslint-disable-next-line unicorn/no-this-assignment
			const createTodo = this;
			menuItems.push({
				html: this.#getActionItemHtml('CALENDAR_1', main_core.Loc.getMessage('CRM_BP_CREATE_TODO_ACTIONS_CALENDAR')),
				onclick() {
					this.popupWindow.close();
					createTodo.renderControl('Duration');
				}
			}, {
				html: this.#getActionItemHtml('PERSON', main_core.Loc.getMessage('CRM_BP_CREATE_TODO_ACTIONS_CLIENT')),
				onclick() {
					this.popupWindow.close();
					createTodo.renderControl('Client', 'Y');
				}
			}, {
				html: this.#getActionItemHtml('PERSONS_2', main_core.Loc.getMessage('CRM_BP_CREATE_TODO_ACTIONS_COLLEAGUE')),
				fieldName: 'Colleagues',
				onclick() {
					this.popupWindow.close();
					createTodo.renderControl('Colleagues');
				}
			}, {
				html: this.#getActionItemHtml('LOCATION_1', main_core.Loc.getMessage('CRM_BP_CREATE_TODO_ACTIONS_ADDRESS')),
				onclick() {
					this.popupWindow.close();
					createTodo.renderControl('Address');
				}
			});
			if ('LocationId' in this.#documentFields) {
				menuItems.push({
					html: this.#getActionItemHtml('CHATS_PERSONS', main_core.Loc.getMessage('CRM_BP_CREATE_TODO_ACTIONS_ROOM')),
					onclick() {
						this.popupWindow.close();
						createTodo.renderControl('LocationId');
					}
				});
			}
			menuItems.push({
				html: this.#getActionItemHtml('INSERT_HYPERLINK', main_core.Loc.getMessage('CRM_BP_CREATE_TODO_ACTIONS_LINK')),
				onclick() {
					this.popupWindow.close();
					createTodo.renderControl('Link');
				}
			});
			if ('Attachment' in this.#documentFields) {
				menuItems.push({
					html: this.#getActionItemHtml('ATTACH', main_core.Loc.getMessage('CRM_BP_CREATE_TODO_ACTIONS_FILE')),
					text: this.#documentFields.Attachment.Name,
					onclick() {
						this.popupWindow.close();
						createTodo.renderControl('Attachment');
					}
				});
			}
			return menuItems;
		}
		#onAdditionalSettingsButtonClick() {
			const menuId = `bp-create-todo-activity-${Math.random()}`;
			main_popup.PopupMenu.show(menuId, this.#additionalSettingsButton, this.#prepareMenuItems(), {
				autoHide: true,
				offsetLeft: main_core.Dom.getPosition(this).width / 2,
				angle: {
					position: 'top',
					offset: 0
				},
				className: 'bizproc-automation-inline-selector-menu',
				overlay: {
					backgroundColor: 'transparent'
				}
			});
		}
		async renderControl(fieldName, value = null) {
			if (this.#additionalSettingsFields[fieldName] || !(fieldName in this.#documentFields)) {
				return;
			}
			if (fieldName === 'Colleagues') {
				this.renderControl('Duration');
			}
			const newRow = main_core.Dom.create('div', {
				attrs: {
					className: 'bizproc-automation-popup-settings'
				}
			});
			main_core.Dom.append(main_core.Dom.create('span', {
				text: this.#documentFields[fieldName].Name,
				attrs: {
					className: 'bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete'
				}
			}), newRow);
			const deleteButton = main_core.Dom.create('a', {
				attrs: {
					className: 'bizproc-automation-popup-settings-delete bizproc-automation-popup-settings-link bizproc-automation-popup-settings-link-light'
				},
				props: {
					href: '#'
				},
				events: {
					click: e => this.#removeControl(fieldName, e)
				},
				text: main_core.Loc.getMessage('CRM_BP_CREATE_TODO_ADDITIONAL_FIELD_DELETE')
			});
			main_core.Dom.append(deleteButton, newRow);

			// eslint-disable-next-line init-declarations
			let node;
			if (fieldName === 'LocationId') {
				node = await this.#renderLocation(value);
			} else if (fieldName === 'Attachment') {
				node = this.#renderFile();
			} else {
				node = this.#renderBaseControl(fieldName, value);
			}
			main_core.Dom.append(node, newRow);
			this.#additionalSettingsFields[fieldName] = newRow;
			main_core.Dom.append(this.#additionalSettingsFields[fieldName], this.#additionalSettingsWrapper);
		}
		#renderBaseControl(fieldName, value = null) {
			return BX.Bizproc.FieldType.renderControl(this.#documentType, this.#documentFields[fieldName], this.#documentFields[fieldName].FieldName, value);
		}
		#renderFile() {
			const wrapper = main_core.Dom.create('div', {
				attrs: {
					'data-role': 'file-selector',
					'data-config': this.#dataConfig
				}
			});
			this.#fileSelector = new bizproc_automation.FileSelector({
				context: new bizproc_automation.SelectorContext({
					fields: bizproc_automation.getGlobalContext().document.getFields(),
					rootGroupTitle: bizproc_automation.getGlobalContext().document.title
				})
			});
			this.#fileSelector.renderTo(wrapper);
			const template = bizproc_automation.Designer.getInstance().getRobotSettingsDialog()?.template;
			if (template) {
				template.robotSettingsControls.push(this.#fileSelector);
			}
			return wrapper;
		}
		#removeControl(fieldName, e = null) {
			if (!this.#additionalSettingsFields[fieldName]) {
				return;
			}
			if (fieldName === 'Attachment') {
				this.#fileSelector.destroy();
			}
			if (fieldName === 'Duration') {
				this.#removeControl('Colleagues');
				this.#removeControl('LocationId');
			}
			e?.preventDefault();
			main_core.Dom.remove(this.#additionalSettingsFields[fieldName]);
			delete this.#additionalSettingsFields[fieldName];
		}
		#getCapacityTitle(value) {
			if (main_core.Type.isNil(value) || value <= 0) {
				return '';
			}
			return main_core.Loc.getMessage('CRM_BP_CREATE_TODO_LOCATION_SELECTOR_ROOMS_CAPACITY', {
				'#CAPACITY_VALUE#': value
			});
		}
		#getActionItemHtml(iconKey, message) {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main[iconKey],
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-palette-gray-50'),
				size: 25
			});
			return main_core.Tag.render`
			<span class="bizproc_automation-todo-activity-actions-menu-item">
				<span class="bizproc_automation-todo-activity-actions-menu-item-icon">${icon.render()}</span>
				${message}
			</span>
		`;
		}
		#getColorSelector(wrapper, settings, isAvailableColor) {
			return new crm_field_colorSelector.ColorSelector({
				target: wrapper,
				colorList: settings.valuesList,
				selectedColorId: isAvailableColor ? settings.selectedValueId : 'default',
				readOnlyMode: settings.readOnlyMode
			});
		}
		#onChangeAttachmentTypeHandler(value) {
			this.#fileControl.hidden = value === 'disk';
			this.#diskControl.hidden = value === 'file';
			const disableInputs = BX(`BPMA-${this.#attachmentType}-control`).querySelectorAll('input');
			for (const disableInput of disableInputs) {
				disableInput.disable = true;
			}
			const enableInputs = BX(`BPMA-${value}-control`).querySelectorAll('input');
			for (const enableInput of enableInputs) {
				enableInput.disabled = false;
			}
		}
		#openDiskFileDialog() {
			const urlSelect = `/bitrix/tools/disk/uf.php?action=selectFile&dialog2=Y&SITE_ID=${main_core.Loc.getMessage('SITE_ID')}`;
			const dialogName = 'BPMA';
			BX.ajax.get(urlSelect, `multiselect=Y&dialogName=${dialogName}`, () => {
				setTimeout(() => {
					BX.DiskFileDialog.obCallback[dialogName] = {
						saveButton: (tab, path, selected) => this.#onSaveButtonClickHandler(tab, path, selected)
					};
					BX.DiskFileDialog.openDialog(dialogName);
				}, 10);
			});
		}
		#onSaveButtonClickHandler(tab, path, selected) {
			for (const file of Object.values(selected)) {
				if (file.type === 'file') {
					main_core.Dom.append(this.#renderAttachmentFile(file), this.#diskControlItems);
				}
			}
		}
		#renderAttachmentFile(file) {
			const fileWrapper = main_core.Tag.render`
			<div>
				<input type="hidden" name="attachment[]" value="${file.id.toString().slice(1)}"/>
				<span style="color: grey">${BX.util.htmlspecialchars(file.name)}</span>
			</div>
		`;
			const deleteButton = main_core.Tag.render`
			<a style="color: red; text-decoration: none; border-bottom: 1px dotted">x</a>
		`;
			main_core.Event.bind(deleteButton, 'click', () => main_core.Dom.remove(fileWrapper));
			main_core.Dom.append(deleteButton, fileWrapper);
			return fileWrapper;
		}
		#assertValidOptions(options) {
			if (!main_core.Type.isObject(options.documentFields)) {
				throw new TypeError('documentFields must be a object');
			}
			if (!main_core.Type.isElementNode(options.additionalSettingsWrapper)) {
				throw new Error('additionalSettingsWrapper must be HTMLElement');
			}
			if (!main_core.Type.isElementNode(options.additionalSettingsButton)) {
				throw new Error('additionalSettingsButton must be HTMLElement');
			}
			if (!main_core.Type.isArrayFilled(options.documentType)) {
				throw new Error('documentType must be filled array');
			}
			if (!main_core.Type.isElementNode(options.colorSelectorWrapper)) {
				throw new Error('colorSelectorWrapper must be HTMLElement');
			}
			if (!main_core.Type.isStringFilled(options.formName)) {
				throw new Error('formName must be filled string');
			}
			if (!main_core.Type.isStringFilled(options.dataConfig)) {
				throw new Error('dataConfig must be a filled string');
			}
			if (!main_core.Type.isObject(options.colorSettings)) {
				throw new TypeError('colorSettings must be a object');
			}
		}
	}
	namespace.CrmCreateTodoActivity = CrmCreateTodoActivity;

})(BX.Bizproc.Automation, BX.Crm.Field, BX, BX.Event, BX.Main, BX.UI.EntitySelector, BX.UI.IconSet);
//# sourceMappingURL=script.js.map
