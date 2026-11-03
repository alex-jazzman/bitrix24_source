/* eslint-disable */
(function (main_core, ui_cnt, main_core_events, ui_dialogs_checkboxList, main_loader, main_popup) {
	'use strict';

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * BX.Grid.ActionPanel
		 *
		 * @param {BX.Main.grid} parent
		 * @param {object} actions List of available actions Bitrix\Main\Grid\Panel\Actions::getList()
		 * @param {string} actions.CREATE
		 * @param {string} actions.SEND
		 * @param {string} actions.ACTIVATE
		 * @param {string} actions.SHOW
		 * @param {string} actions.HIDE
		 * @param {string} actions.REMOVE
		 * @param {string} actions.CALLBACK
		 * @param {string} actions.INLINE_EDIT
		 * @param {string} actions.HIDE_ALL_EXPECT
		 * @param {string} actions.SHOW_ALL
		 * @param {string} actions.RESET_CONTROLS
		 *
		 * @param {object} types List of available control types
		 * of the actions panel Bitrix\Main\Grid\Panel\Types::getList()
		 * @param {string} types.DROPDOWN
		 * @param {string} types.CHECKBOX
		 * @param {string} types.TEXT
		 * @param {string} types.BUTTON
		 * @param {string} types.LINK
		 * @param {string} types.CUSTOM
		 * @param {string} types.HIDDEN
		 *
		 * @constructor
		 */
		BX.Grid.ActionPanel = function (parent, actions, types) {
			this.parent = null;
			this.rel = {};
			this.actions = null;
			this.types = null;
			this.lastActivated = [];
			this.init(parent, actions, types);
			this.button = [];
			this.elements = [];
			this.buttonOnChange = [];
			this.buttonData = {};
		};
		BX.Grid.ActionPanel.prototype = {
			init(parent, actions, types) {
				this.parent = parent;
				this.actions = eval(actions);
				this.types = eval(types);
				BX.addCustomEvent(window, 'Dropdown::change', BX.proxy(this._dropdownEventHandle, this));
				BX.addCustomEvent(window, 'Dropdown::load', BX.proxy(this._dropdownEventHandle, this));
				const panel = this.getPanel();
				BX.bind(panel, 'change', BX.delegate(this._checkboxChange, this));
				BX.bind(panel, 'click', BX.delegate(this._clickOnButton, this));
				BX.addCustomEvent(window, 'Grid::updated', BX.proxy(this._gridUpdatedEventHandle, this));
			},
			destroy() {
				BX.removeCustomEvent(window, 'Dropdown::change', BX.proxy(this._dropdownEventHandle, this));
				BX.removeCustomEvent(window, 'Dropdown::load', BX.proxy(this._dropdownEventHandle, this));
				BX.removeCustomEvent(window, 'Grid::updated', BX.proxy(this._gridUpdatedEventHandle, this));
			},
			_gridUpdatedEventHandle() {
				const cancelButton = BX('grid_cancel_button');
				cancelButton && BX.fireEvent(BX.firstChild(cancelButton), 'click');
			},
			_dropdownEventHandle(id, event, item, dataItem) {
				this.isPanelControl(BX(id)) && this._dropdownChange(id, event, item, dataItem);
			},
			resetForAllCheckbox() {
				const checkbox = this.getForAllCheckbox();
				if (BX.type.isDomNode(checkbox)) {
					checkbox.checked = null;
				}
			},
			getForAllCheckbox() {
				return BX.Grid.Utils.getByClass(this.getPanel(), this.parent.settings.get('classForAllCheckbox'), true);
			},
			getPanel() {
				return BX.Grid.Utils.getByClass(this.parent.getContainer(), this.parent.settings.get('classActionPanel'), true);
			},
			getApplyButton() {
				return BX.Grid.Utils.getByClass(this.getPanel(), this.parent.settings.get('classPanelApplyButton'), true);
			},
			isPanelControl(node) {
				return BX.hasClass(node, this.parent.settings.get('classPanelControl'));
			},
			getTextInputs() {
				return BX.Grid.Utils.getBySelector(this.getPanel(), 'input[type="text"]');
			},
			getHiddenInputs() {
				return BX.Grid.Utils.getBySelector(this.getPanel(), 'input[type="hidden"]');
			},
			getSelects() {
				return BX.Grid.Utils.getBySelector(this.getPanel(), 'select');
			},
			getDropdowns() {
				return BX.Grid.Utils.getByClass(this.getPanel(), this.parent.settings.get('classDropdown'));
			},
			getCheckboxes() {
				return BX.Grid.Utils.getByClass(this.getPanel(), this.parent.settings.get('classPanelCheckbox'));
			},
			getButtons() {
				return BX.Grid.Utils.getByClass(this.getPanel(), this.parent.settings.get('classPanelButton'));
			},
			isDropdown(node) {
				return BX.hasClass(node, this.parent.settings.get('classDropdown'));
			},
			isCheckbox(node) {
				return BX.hasClass(node, this.parent.settings.get('classPanelCheckbox'));
			},
			isTextInput(node) {
				return node.type === 'text';
			},
			isHiddenInput(node) {
				return node.type === 'hidden';
			},
			isSelect(node) {
				return node.tagName === 'SELECT';
			},
			createDropdown(data, relative) {
				const emptyText = data.EMPTY_TEXT || '';
				const isMultiple = data.MULTIPLE === 'Y';
				const container = this.createContainer(data.ID, relative, {});
				const dropdown = BX.create('div', {
					props: {
						className: 'main-dropdown main-grid-panel-control',
						id: `${data.ID}_control`
					},
					attrs: {
						name: data.NAME,
						'data-name': data.NAME,
						'data-empty-text': emptyText,
						'data-multiple': isMultiple ? 'Y' : 'N',
						'data-items': JSON.stringify(data.ITEMS),
						'data-value': isMultiple ? '' : data.ITEMS[0].VALUE,
						'data-popup-position': 'fixed'
					},
					children: [BX.create('span', {
						props: {
							className: 'main-dropdown-inner'
						},
						html: isMultiple ? emptyText : data.ITEMS[0].NAME
					})]
				});
				container.appendChild(dropdown);
				return container;
			},
			createCheckbox(data, relative) {
				const checkbox = this.createContainer(data.ID, relative, {});
				const inner = BX.create('span', {
					props: {
						className: 'main-grid-checkbox-container'
					}
				});
				const titleSpan = BX.create('span', {
					props: {
						className: 'main-grid-control-panel-content-title'
					}
				});
				const input = BX.create('input', {
					props: {
						type: 'checkbox',
						className: `${this.parent.settings.get('classPanelCheckbox')} main-grid-checkbox`,
						id: `${data.ID}_control`
					},
					attrs: {
						value: data.VALUE || '',
						title: data.TITLE || '',
						name: data.NAME || '',
						'data-onchange': JSON.stringify(data.ONCHANGE)
					}
				});
				input.checked = data.CHECKED || null;
				checkbox.appendChild(inner);
				checkbox.appendChild(titleSpan);
				inner.appendChild(input);
				inner.appendChild(BX.create('label', {
					props: {
						className: 'main-grid-checkbox'
					},
					attrs: {
						for: `${data.ID}_control`,
						title: data.TITLE
					}
				}));
				titleSpan.appendChild(BX.create('label', {
					attrs: {
						for: `${data.ID}_control`,
						title: data.TITLE
					},
					html: data.LABEL
				}));
				return checkbox;
			},
			/**
			 * @param {object} data
			 * @param {object} data.ID
			 * @param {object} data.TITLE
			 * @param {object} data.PLACEHOLDER
			 * @param {object} data.ONCHANGE
			 * @param {string} relative
			 * @returns {*}
			 */
			createText(data, relative) {
				const container = this.createContainer(data.ID, relative, {});
				const title = BX.type.isNotEmptyString(data.TITLE) ? data.TITLE : '';
				if (title !== '') {
					container.appendChild(BX.create('label', {
						attrs: {
							title,
							for: `${data.ID}_control`
						},
						text: title
					}));
				}
				container.appendChild(BX.create('input', {
					props: {
						className: 'main-grid-control-panel-input-text main-grid-panel-control',
						id: `${data.ID}_control`
					},
					attrs: {
						name: data.NAME,
						title,
						placeholder: data.PLACEHOLDER || '',
						value: data.VALUE || '',
						type: 'text',
						'data-onchange': JSON.stringify(data.ONCHANGE || [])
					}
				}));
				return container;
			},
			createHidden(data, relative) {
				const container = this.createContainer(data.ID, relative, {
					CLASS: 'main-grid-panel-hidden-control-container'
				});
				container.appendChild(BX.create('input', {
					props: {
						id: `${data.ID}_control`,
						type: 'hidden'
					},
					attrs: {
						name: data.NAME,
						value: data.VALUE || ''
					}
				}));
				return container;
			},
			createButton(data, relative) {
				this.buttonOnChange = data.ONCHANGE || [];
				this.buttonData = data;
				this.button = this.createButtonNode(data);
				BX.removeCustomEvent(window, 'Grid::unselectRow', BX.proxy(this.prepareButton, this));
				BX.removeCustomEvent(window, 'Grid::selectRow', BX.proxy(this.prepareButton, this));
				BX.removeCustomEvent(window, 'Grid::allRowsSelected', BX.proxy(this.prepareButton, this));
				BX.removeCustomEvent(window, 'Grid::allRowsUnselected', BX.proxy(this.prepareButton, this));
				if (this.buttonData.SETTINGS && data.ID === this.buttonData.SETTINGS.buttonId) {
					BX.addCustomEvent(window, 'Grid::unselectRow', BX.proxy(this.prepareButton, this));
					BX.addCustomEvent(window, 'Grid::selectRow', BX.proxy(this.prepareButton, this));
					BX.addCustomEvent(window, 'Grid::allRowsSelected', BX.proxy(this.prepareButton, this));
					BX.addCustomEvent(window, 'Grid::allRowsUnselected', BX.proxy(this.prepareButton, this));
				}
				this.prepareButton();
				const container = this.createContainer(data.ID, relative, {});
				container.appendChild(this.button);
				return container;
			},
			createButtonNode(data) {
				return BX.create('button', {
					props: {
						className: `ui-btn${data.CLASS ? ` ${data.CLASS}` : ''}`,
						id: `${data.ID}_control`,
						title: BX.type.isNotEmptyString(data.TITLE) ? data.TITLE : ''
					},
					attrs: {
						name: data.NAME || ''
					},
					html: data.TEXT
				});
			},
			prepareButton() {
				const isDisabled = this.isSetButtonDisabled();
				if (isDisabled) {
					BX.Dom.attr(this.button, 'data-onchange', []);
					BX.Dom.addClass(this.button, 'ui-btn-disabled');
				} else {
					BX.Dom.attr(this.button, 'data-onchange', this.buttonOnChange);
					BX.Dom.removeClass(this.button, 'ui-btn-disabled');
				}

				// The class only paints the button grey. Without the attribute the control keeps its
				// place in the Tab order and still fires on Enter, so a keyboard user runs an action
				// the pointer user cannot even click.
				this.button.disabled = isDisabled;
			},
			isSetButtonDisabled() {
				return Boolean(this.buttonData.SETTINGS && this.buttonData.SETTINGS.minSelectedRows && this.getSelectedIds().length < this.buttonData.SETTINGS.minSelectedRows);
			},
			/**
			 * @param {object} data
			 * @param {object} data.ID
			 * @param {object} data.TITLE
			 * @param {object} data.PLACEHOLDER
			 * @param {object} data.ONCHANGE
			 * @param {object} data.CLASS
			 * @param {object} data.HREF
			 * @param {string} relative
			 * @returns {*}
			 */
			createLink(data, relative) {
				const container = this.createContainer(data.ID, relative, {});
				const link = BX.create('a', {
					props: {
						className: `main-grid-link${data.CLASS ? ` ${data.CLASS}` : ''}`,
						id: `${data.ID}_control`
					},
					attrs: {
						href: data.HREF || '',
						'data-onchange': JSON.stringify(data.ONCHANGE || [])
					},
					html: data.TEXT
				});
				container.appendChild(link);
				return container;
			},
			createCustom(data, relative) {
				const container = this.createContainer(data.ID, relative, {
					CLASS: 'main-grid-panel-hidden-control-container'
				});
				const custom = BX.create('div', {
					props: {
						className: `main-grid-panel-custom${data.CLASS ? ` ${data.CLASS}` : ''}`
					},
					html: data.VALUE
				});
				container.appendChild(custom);
				return container;
			},
			createContainer(id, relative, options) {
				id = id.replace('_control', '');
				relative = relative.replace('_control', '');
				options = options || {};
				return BX.create('span', {
					props: {
						className: this.parent.settings.get('classPanelControlContainer') + (options.CLASS ? ` ${options.CLASS}` : ''),
						id
					},
					attrs: {
						'data-relative': relative
					}
				});
			},
			removeItemsRelativeCurrent(node) {
				let element = node;
				const relative = [node.id];
				const result = [];
				let dataRelative;
				while (element) {
					dataRelative = BX.data(element, 'relative');
					if (relative.includes(dataRelative)) {
						relative.push(element.id);
						result.push(element);
					}
					element = element.nextElementSibling;
				}
				result.forEach(current => {
					BX.remove(current);
				});
			},
			validateData(data) {
				return 'ONCHANGE' in data && BX.type.isArray(data.ONCHANGE);
			},
			activateControl(id) {
				const element = BX(id);
				if (BX.type.isDomNode(element)) {
					BX.removeClass(element, this.parent.settings.get('classDisable'));
					element.disabled = null;
				}
			},
			deactivateControl(id) {
				const element = BX(id);
				if (BX.type.isDomNode(element)) {
					BX.addClass(element, this.parent.settings.get('classDisable'));
					element.disabled = true;
				}
			},
			showControl(id) {
				const control = BX(id);
				control && BX.show(control);
			},
			hideControl(id) {
				const control = BX(id);
				control && BX.hide(control);
			},
			validateActionObject(action) {
				return BX.type.isPlainObject(action) && 'ACTION' in action && BX.type.isNotEmptyString(action.ACTION) && (action.ACTION === this.actions.RESET_CONTROLS || 'DATA' in action && BX.type.isArray(action.DATA));
			},
			validateControlObject(controlObject) {
				return BX.type.isPlainObject(controlObject) && 'TYPE' in controlObject && 'ID' in controlObject;
			},
			createDate(data, relative) {
				const container = this.createContainer(data.ID, relative, {});
				const date = BX.decl({
					block: 'main-ui-date',
					mix: ['main-grid-panel-date'],
					calendarButton: true,
					valueDelete: true,
					placeholder: 'PLACEHOLDER' in data ? data.PLACEHOLDER : '',
					name: 'NAME' in data ? `${data.NAME}_from` : '',
					tabindex: 'TABINDEX' in data ? data.TABINDEX : '',
					value: 'VALUE' in data ? data.VALUE : '',
					enableTime: 'TIME' in data ? data.TIME ? 'true' : 'false' : 'false'
				});
				container.appendChild(date);
				return container;
			},
			createControl(controlObject, relativeId) {
				let newElement = null;
				switch (controlObject.TYPE) {
					case this.types.DROPDOWN:
						newElement = this.createDropdown(controlObject, relativeId);
						break;
					case this.types.CHECKBOX:
						newElement = this.createCheckbox(controlObject, relativeId);
						break;
					case this.types.TEXT:
						newElement = this.createText(controlObject, relativeId);
						break;
					case this.types.HIDDEN:
						newElement = this.createHidden(controlObject, relativeId);
						break;
					case this.types.BUTTON:
						newElement = this.createButton(controlObject, relativeId);
						break;
					case this.types.LINK:
						newElement = this.createLink(controlObject, relativeId);
						break;
					case this.types.CUSTOM:
						newElement = this.createCustom(controlObject, relativeId);
						break;
					case this.types.DATE:
						newElement = this.createDate(controlObject, relativeId);
						break;
				}
				return newElement;
			},
			onChangeHandler(container, actions, isPseudo) {
				let newElement;
				let callback;
				const self = this;
				if (BX.type.isDomNode(container) && BX.type.isArray(actions)) {
					actions.forEach(function (action) {
						if (self.validateActionObject(action)) {
							if (action.ACTION === self.actions.CREATE) {
								self.removeItemsRelativeCurrent(container);
								const preparedData = BX.Runtime.clone(action.DATA).reverse();
								preparedData.forEach(controlObject => {
									if (self.validateControlObject(controlObject)) {
										newElement = self.createControl(controlObject, container.id || BX.data(container, 'relative'));
										if (BX.type.isDomNode(newElement)) {
											BX.insertAfter(newElement, container);
											if ('ONCHANGE' in controlObject && controlObject.TYPE === self.types.CHECKBOX && 'CHECKED' in controlObject && controlObject.CHECKED) {
												self.onChangeHandler(newElement, controlObject.ONCHANGE);
											}
											if (controlObject.TYPE === self.types.DROPDOWN && BX.type.isArray(controlObject.ITEMS) && controlObject.ITEMS.length > 0 && 'ONCHANGE' in controlObject.ITEMS[0] && BX.type.isArray(controlObject.ITEMS[0].ONCHANGE)) {
												self.onChangeHandler(newElement, controlObject.ITEMS[0].ONCHANGE);
											}
										}
									}
								});
							}
							if (action.ACTION === self.actions.ACTIVATE) {
								self.removeItemsRelativeCurrent(container);
								if (BX.type.isArray(action.DATA)) {
									action.DATA.forEach(currentId => {
										self.lastActivated.push(currentId.ID);
										self.activateControl(currentId.ID);
									});
								}
							}
							if (action.ACTION === self.actions.SHOW && BX.type.isArray(action.DATA)) {
								action.DATA.forEach(showCurrent => {
									self.showControl(showCurrent.ID);
								});
							}
							if (action.ACTION === self.actions.HIDE && BX.type.isArray(action.DATA)) {
								action.DATA.forEach(hideCurrent => {
									self.hideControl(hideCurrent.ID);
								});
							}
							if (action.ACTION === self.actions.HIDE_ALL_EXPECT && BX.type.isArray(action.DATA)) {
								(self.getControls() || []).forEach(current => {
									if (!action.DATA.some(el => {
										return el.ID === current.id;
									})) {
										self.hideControl(current.id);
									}
								});
							}
							if (action.ACTION === self.actions.SHOW_ALL) {
								(self.getControls() || []).forEach(current => {
									self.showControl(current.id);
								});
							}
							if (action.ACTION === self.actions.REMOVE && BX.type.isArray(action.DATA)) {
								action.DATA.forEach(removeCurrent => {
									BX.remove(BX(removeCurrent.ID));
								});
							}
							if (action.ACTION === self.actions.CALLBACK) {
								this.confirmDialog(action, BX.delegate(() => {
									if (BX.type.isArray(action.DATA)) {
										action.DATA.forEach(currentCallback => {
											if (currentCallback.JS.includes('Grid.')) {
												callback = currentCallback.JS.replace('Grid', 'self.parent');
												callback = callback.replace('()', '');
												callback += '.apply(self.parent, [container])';
												try {
													eval(callback); // jshint ignore:line
												} catch (err) {
													throw new Error(err);
												}
											} else if (BX.type.isNotEmptyString(currentCallback.JS)) {
												try {
													eval(currentCallback.JS);
												} catch (err) {
													throw new Error(err);
												}
											}
										});
									}
								}, this));
							}
							if (action.ACTION === self.actions.RESET_CONTROLS) {
								this.removeItemsRelativeCurrent(container);
							}
						}
					}, this);
				} else {
					if (!isPseudo) {
						this.removeItemsRelativeCurrent(container);
					}
					self.lastActivated.forEach(current => {
						self.deactivateControl(current);
					});
					self.lastActivated = [];
				}
			},
			confirmDialog(action, then, cancel) {
				this.parent.confirmDialog(action, then, cancel);
			},
			/**
			 * Dropdown value change handler
			 * @param {string} id Dropdown id
			 * @param {object} event
			 * @param item
			 * @param {object} dataItem
			 * @param {object} dataItem.ONCHANGE
			 * @param {boolean} dataItem.PSEUDO
			 * @private
			 */
			_dropdownChange(id, event, item, dataItem) {
				const dropdown = BX(id);
				const container = dropdown.parentNode;
				const onChange = dataItem && 'ONCHANGE' in dataItem ? dataItem.ONCHANGE : null;
				const isPseudo = dataItem && 'PSEUDO' in dataItem && dataItem.PSEUDO !== false;
				this.onChangeHandler(container, onChange, isPseudo);
			},
			_checkboxChange(event) {
				let onChange;
				try {
					onChange = eval(BX.data(event.target, 'onchange'));
				} catch {
					onChange = null;
				}
				this.onChangeHandler(BX.findParent(event.target, {
					className: this.parent.settings.get('classPanelContainer')
				}, true, false), event.target.checked || event.target.id.includes('actallrows_') ? onChange : null);
			},
			_clickOnButton(event) {
				let onChange;
				if (this.isButton(event.target)) {
					event.preventDefault();
					try {
						onChange = eval(BX.data(event.target, 'onchange'));
					} catch {
						onChange = null;
					}
					this.onChangeHandler(BX.findParent(event.target, {
						className: this.parent.settings.get('classPanelContainer')
					}, true, false), onChange);
				}
			},
			isButton(node) {
				return BX.hasClass(node, this.parent.settings.get('classPanelButton'));
			},
			getSelectedIds() {
				const rows = this.parent.getRows().getSelected().filter(row => {
					return row.isShown();
				});
				return rows.map(current => {
					return current.getId();
				});
			},
			getControls() {
				return BX.findChild(this.getPanel(), {
					className: this.parent.settings.get('classPanelControlContainer')
				}, true, true);
			},
			getValues() {
				const data = {};
				const self = this;
				const controls = [].concat(this.getDropdowns(), this.getTextInputs(), this.getHiddenInputs(), this.getSelects(), this.getCheckboxes(), this.getButtons());
				(controls || []).forEach(current => {
					if (BX.type.isDomNode(current)) {
						if (self.isDropdown(current)) {
							let dropdownValue = BX.data(current, 'value');
							const multiple = BX.data(current, 'multiple') === 'Y';
							dropdownValue = dropdownValue !== null && dropdownValue !== undefined ? dropdownValue : '';
							data[BX.data(current, 'name')] = multiple ? dropdownValue.split(',') : dropdownValue;
						}
						if (self.isSelect(current)) {
							data[current.getAttribute('name')] = current.options[current.selectedIndex].value;
						}
						if (self.isCheckbox(current) && current.checked) {
							data[current.getAttribute('name')] = current.value;
						}
						if (self.isTextInput(current) || self.isHiddenInput(current)) {
							data[current.getAttribute('name')] = current.value;
						}
						if (self.isButton(current)) {
							const name = BX.data(current, 'name');
							let value = BX.data(current, 'value');
							value = value !== null && value !== undefined ? value : '';
							if (name) {
								data[name] = value;
							}
						}
					}
				});
				return data;
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * Base class
		 * @param {BX.Main.grid} parent
		 * @constructor
		 */
		BX.Grid.BaseClass = function (parent) {
			this.parent = parent;
		};
		BX.Grid.BaseClass.prototype = {
			getParent() {
				return this.parent;
			}
		};
	})();

	/**
	 * @memberOf BX.Grid
	 */
	class CellActionState {
		static SHOW_BY_HOVER = 'main-grid-cell-content-action-by-hover';
		static ACTIVE = 'main-grid-cell-content-action-active';
	}
	const namespace$6 = main_core.Reflection.namespace('BX.Grid');
	namespace$6.CellActionState = CellActionState;

	/**
	 * @memberOf BX.Grid
	 */
	class CellActions {
		static PIN = 'main-grid-cell-content-action-pin';
		static MUTE = 'main-grid-cell-content-action-mute';
	}
	const namespace$5 = main_core.Reflection.namespace('BX.Grid');
	namespace$5.CellActions = CellActions;

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * BX.Grid.ColsSortable
		 * @param {BX.Main.grid} parent
		 * @constructor
		 */
		BX.Grid.ColsSortable = function (parent) {
			this.parent = null;
			this.dragItem = null;
			this.targetItem = null;
			this.rowsList = null;
			this.colsList = null;
			this.dragRect = null;
			this.offset = null;
			this.startDragOffset = null;
			this.dragColumn = null;
			this.targetColumn = null;
			this.isDrag = null;
			this.init(parent);
		};
		BX.Grid.ColsSortable.prototype = {
			init(parent) {
				this.parent = parent;
				this.colsList = this.getColsList();
				this.rowsList = this.getRowsList();
				if (!this.inited) {
					this.inited = true;
					BX.addCustomEvent('Grid::updated', BX.proxy(this.reinit, this));
					BX.addCustomEvent('Grid::headerUpdated', BX.proxy(this.reinit, this));
				}
				this.registerObjects();
			},
			destroy() {
				BX.removeCustomEvent('Grid::updated', BX.proxy(this.reinit, this));
				this.unregisterObjects();
			},
			reinit() {
				this.unregisterObjects();
				this.reset();
				this.init(this.parent);
			},
			reset() {
				this.dragItem = null;
				this.targetItem = null;
				this.rowsList = null;
				this.colsList = null;
				this.dragRect = null;
				this.offset = null;
				this.startDragOffset = null;
				this.dragColumn = null;
				this.targetColumn = null;
				this.isDrag = null;
				this.fixedTableColsList = null;
			},
			isActive() {
				return this.isDrag;
			},
			registerObjects() {
				this.unregisterObjects();
				this.getColsList().forEach(this.register, this);
				this.getFixedHeaderColsList().forEach(this.register, this);
			},
			unregisterObjects() {
				this.getColsList().forEach(this.unregister, this);
				this.getFixedHeaderColsList().forEach(this.unregister, this);
			},
			unregister(column) {
				jsDD.unregisterObject(column);
			},
			register(column) {
				column.onbxdragstart = BX.proxy(this._onDragStart, this);
				column.onbxdrag = BX.proxy(this._onDrag, this);
				column.onbxdragstop = BX.proxy(this._onDragEnd, this);
				jsDD.registerObject(column);
			},
			getColsList() {
				if (!this.colsList) {
					this.colsList = BX.Grid.Utils.getByTag(this.parent.getRows().getHeadFirstChild().getNode(), 'th');
					this.colsList = this.colsList.filter(function (current) {
						return !this.isStatic(current);
					}, this);
				}
				return this.colsList;
			},
			getFixedHeaderColsList() {
				if (!this.fixedTableColsList && this.parent.getParam('ALLOW_PIN_HEADER')) {
					this.fixedTableColsList = BX.Grid.Utils.getByTag(this.parent.getPinHeader().getFixedTable(), 'th');
					this.fixedTableColsList = this.fixedTableColsList.filter(function (current) {
						return !this.isStatic(current);
					}, this);
				}
				return this.fixedTableColsList || [];
			},
			getRowsList() {
				let rowsList = this.parent.getRows().getSourceRows();
				if (this.parent.getParam('ALLOW_PIN_HEADER')) {
					rowsList = rowsList.concat(BX.Grid.Utils.getByTag(this.parent.getPinHeader().getFixedTable(), 'tr'));
				}
				return rowsList;
			},
			isStatic(item) {
				return BX.hasClass(item, this.parent.settings.get('classCellStatic')) && !BX.hasClass(item, 'main-grid-fixed-column');
			},
			getDragOffset() {
				const offset = this.parent.getScrollContainer().scrollLeft - this.startScrollOffset;
				return jsDD.x - this.startDragOffset - this.dragRect.left + offset;
			},
			getColumn(cell) {
				let column = [];
				if (cell instanceof HTMLTableCellElement) {
					column = this.rowsList.map(row => {
						return row.cells[cell.cellIndex];
					});
				}
				return column;
			},
			_onDragStart() {
				if (this.parent.getParam('ALLOW_PIN_HEADER') && this.parent.getPinHeader().isPinned()) {
					this.colsList = this.getFixedHeaderColsList();
				} else {
					this.colsList = this.getColsList();
				}
				this.startScrollOffset = this.parent.getScrollContainer().scrollLeft;
				this.isDrag = true;
				this.dragItem = jsDD.current_node;
				this.dragRect = this.dragItem.getBoundingClientRect();
				this.offset = Math.ceil(this.dragRect.width);
				this.startDragOffset = jsDD.start_x - this.dragRect.left;
				this.dragColumn = this.getColumn(this.dragItem);
				this.dragIndex = BX.Grid.Utils.getIndex(this.colsList, this.dragItem);
				this.parent.preventSortableClick = true;
			},
			isDragToRight(node, index) {
				const nodeClientRect = node.getBoundingClientRect();
				const nodeCenter = Math.ceil(nodeClientRect.left + nodeClientRect.width / 2 + BX.scrollLeft(window));
				const dragIndex = this.dragIndex;
				const x = jsDD.x;
				return index > dragIndex && x > nodeCenter;
			},
			isDragToLeft(node, index) {
				const nodeClientRect = node.getBoundingClientRect();
				const nodeCenter = Math.ceil(nodeClientRect.left + nodeClientRect.width / 2 + BX.scrollLeft(window));
				const dragIndex = this.dragIndex;
				const x = jsDD.x;
				return index < dragIndex && x < nodeCenter;
			},
			isDragToBack(node, index) {
				const nodeClientRect = node.getBoundingClientRect();
				const nodeCenter = Math.ceil(nodeClientRect.left + nodeClientRect.width / 2 + BX.scrollLeft(window));
				const dragIndex = this.dragIndex;
				const x = jsDD.x;
				return index > dragIndex && x < nodeCenter || index < dragIndex && x > nodeCenter;
			},
			isMovedToRight(node) {
				return node.style.transform === `translate3d(${-this.offset}px, 0px, 0px)`;
			},
			isMovedToLeft(node) {
				return node.style.transform === `translate3d(${this.offset}px, 0px, 0px)`;
			},
			isMoved(node) {
				return node.style.transform !== 'translate3d(0px, 0px, 0px)' && node.style.transform !== '';
			},
			/**
			 * Moves grid column by offset
			 * @param {array} column - Array cells of column
			 * @param {int} offset - Pixels offset
			 * @param {int} [transition = 300] - Transition duration in milliseconds
			 */
			moveColumn(column, offset, transition) {
				transition = BX.type.isNumber(transition) ? transition : 300;
				BX.Grid.Utils.styleForEach(column, {
					transition: `${transition}ms`,
					transform: `translate3d(${offset}px, 0px, 0px)`
				});
			},
			_onDrag() {
				this.dragOffset = this.getDragOffset();
				this.targetItem = this.targetItem || this.dragItem;
				this.targetColumn = this.targetColumn || this.dragColumn;
				const leftOffset = -this.offset;
				const rightOffset = this.offset;
				const defaultOffset = 0;
				const dragTransitionDuration = 0;
				this.moveColumn(this.dragColumn, this.dragOffset, dragTransitionDuration);
				[].forEach.call(this.colsList, function (current, index) {
					if (current && !current.classList.contains('main-grid-cell-static')) {
						if (this.isDragToRight(current, index) && !this.isMovedToRight(current)) {
							this.targetColumn = this.getColumn(current);
							this.moveColumn(this.targetColumn, leftOffset);
						}
						if (this.isDragToLeft(current, index) && !this.isMovedToLeft(current)) {
							this.targetColumn = this.getColumn(current);
							this.moveColumn(this.targetColumn, rightOffset);
						}
						if (this.isDragToBack(current, index) && this.isMoved(current)) {
							this.targetColumn = this.getColumn(current);
							this.moveColumn(this.targetColumn, defaultOffset);
						}
					}
				}, this);
			},
			_onDragEnd() {
				[].forEach.call(this.dragColumn, function (current, index) {
					BX.Grid.Utils.collectionSort(current, this.targetColumn[index]);
				}, this);
				this.rowsList.forEach(current => {
					BX.Grid.Utils.styleForEach(current.cells, {
						transition: '',
						transform: ''
					});
				});
				this.reinit();
				const columns = this.colsList.map(current => {
					return BX.data(current, 'name');
				});
				this.parent.getUserOptions().setColumns(columns);
				BX.onCustomEvent(this.parent.getContainer(), 'Grid::columnMoved', [this.parent, columns]);
				setTimeout(() => {
					this.parent.preventSortableClick = false;
				}, 10);
			}
		};
	})();

	/**
	 * @memberOf BX.Grid
	 */
	class Counters {
		static Type = {
			LEFT: 'left',
			LEFT_ALIGNED: 'left-aligned',
			RIGHT: 'right'
		};
		static Color = {
			DANGER: 'ui-counter-danger',
			SUCCESS: 'ui-counter-success',
			PRIMARY: 'ui-counter-primary',
			GRAY: 'ui-counter-gray',
			LIGHT: 'ui-counter-light',
			DARK: 'ui-counter-dark',
			WARNING: 'ui-counter-warning'
		};
		static Size = {
			LARGE: 'ui-counter-lg',
			MEDIUM: 'ui-counter-md'
		};
	}
	const namespace$4 = main_core.Reflection.namespace('BX.Grid');
	namespace$4.Counters = Counters;

	(function () {

		BX.namespace('BX.Grid');
		const originalUpdatePageData = window.parent.BX.ajax.UpdatePageData;
		function disableBxAjaxUpdatePageData() {
			window.parent.BX.ajax.UpdatePageData = function () {};
		}
		function enableBxAjaxUpdatePageData() {
			window.parent.BX.ajax.UpdatePageData = originalUpdatePageData;
		}

		/**
		 * Works with requests and server response
		 * @param {BX.Main.grid} parent
		 * @constructor
		 */
		BX.Grid.Data = function (parent) {
			this.parent = parent;
			this.reset();
		};

		/**
		 * Reset to default values
		 * @private
		 */
		BX.Grid.Data.prototype.reset = function () {
			this.response = null;
			this.xhr = null;
			this.headRows = null;
			this.bodyRows = null;
			this.footRows = null;
			this.moreButton = null;
			this.pagination = null;
			this.counterDisplayed = null;
			this.counterSelected = null;
			this.counterTotal = null;
			this.limit = null;
			this.actionPanel = null;
			this.rowsByParentId = {};
			this.rowById = {};
			this.isValidResponse = null;
		};

		/**
		 * Gets filter
		 * @return {BX.Main.Filter}
		 */
		BX.Grid.Data.prototype.getParent = function () {
			return this.parent;
		};

		/**
		 * Validates server response
		 * @return {boolean}
		 */
		BX.Grid.Data.prototype.validateResponse = function () {
			if (!BX.type.isBoolean(this.isValidResponse)) {
				this.isValidResponse = Boolean(this.getResponse()) && Boolean(BX.Grid.Utils.getByClass(this.getResponse(), this.getParent().settings.get('classContainer'), true));
			}
			return this.isValidResponse;
		};

		/**
		 * Send request
		 * @param {string} [url]
		 * @param {string} [method]
		 * @param {object} [data]
		 * @param {string} [action]
		 * @param {function} [then]
		 * @param {function} [error]
		 */
		BX.Grid.Data.prototype.request = function (url, method, data, action, then, error) {
			if (!BX.type.isString(url)) {
				url = '';
			}
			if (!BX.type.isNotEmptyString(method)) {
				method = 'GET';
			}
			if (!BX.type.isPlainObject(data)) {
				data = {};
			}
			const eventArgs = {
				gridId: this.parent.getId(),
				url,
				method,
				data
			};
			this.parent.disableCheckAllCheckboxes();
			BX.onCustomEvent(window, 'Grid::beforeRequest', [this, eventArgs]);
			if (eventArgs.hasOwnProperty('cancelRequest') && eventArgs.cancelRequest === true) {
				return;
			}
			url = eventArgs.url;
			if (!BX.type.isNotEmptyString(url)) {
				url = this.parent.baseUrl;
			}
			url = BX.Grid.Utils.addUrlParams(url, {
				sessid: BX.bitrix_sessid(),
				internal: 'true',
				grid_id: this.parent.getId()
			});
			if ('apply_filter' in data && data.apply_filter === 'Y') {
				url = BX.Grid.Utils.addUrlParams(url, {
					apply_filter: 'Y'
				});
			} else {
				url = BX.util.remove_url_param(url, 'apply_filter');
			}
			if ('clear_nav' in data && data.clear_nav === 'Y') {
				url = BX.Grid.Utils.addUrlParams(url, {
					clear_nav: 'Y'
				});
			} else {
				url = BX.util.remove_url_param(url, 'clear_nav');
			}
			url = BX.Grid.Utils.addUrlParams(url, {
				grid_action: action || 'showpage'
			});
			method = eventArgs.method;
			data = eventArgs.data;
			this.reset();
			const self = this;
			setTimeout(() => {
				const formData = BX.Http.Data.convertObjectToFormData(data);
				disableBxAjaxUpdatePageData();
				var xhr = BX.ajax({
					url: BX.Grid.Utils.ajaxUrl(url, self.getParent().getAjaxId()),
					data: formData,
					method,
					dataType: 'html',
					headers: [{
						name: 'X-Ajax-Grid-UID',
						value: self.getParent().getAjaxId()
					}, {
						name: 'X-Ajax-Grid-Req',
						value: JSON.stringify({
							action: action || 'showpage'
						})
					}],
					processData: true,
					scriptsRunFirst: false,
					start: false,
					preparePost: false,
					onsuccess(response) {
						self.response = BX.create('div', {
							html: response
						});
						self.response = self.response.querySelector(`#${self.parent.getContainerId()}`);
						self.xhr = xhr;
						if (self.parent.getParam('HANDLE_RESPONSE_ERRORS')) {
							let res;
							try {
								res = JSON.parse(response);
							} catch {
								res = {
									messages: []
								};
							}
							if (res.messages.length > 0) {
								self.parent.arParams.MESSAGES = res.messages;
								self.parent.messages.show();
								self.parent.tableUnfade();
								if (BX.type.isFunction(error)) {
									BX.delegate(error, self)(xhr);
								}
								return;
							}
						}
						if (BX.type.isFunction(then)) {
							self.parent.enableCheckAllCheckboxes();
							BX.delegate(then, self)(response, xhr);
						}
						enableBxAjaxUpdatePageData();
					},
					onerror(err) {
						self.error = error;
						self.xhr = xhr;
						if (BX.type.isFunction(error)) {
							self.parent.enableCheckAllCheckboxes();
							BX.delegate(error, self)(xhr, err);
						}
					}
				});
				xhr.send(formData);
			}, 0);
		};

		/**
		 * Gets server response
		 * @return {?Element}
		 */
		BX.Grid.Data.prototype.getResponse = function () {
			return this.response;
		};

		/**
		 * Returns a grid container
		 * @return {?Element}
		 */
		BX.Grid.Data.prototype.getContainer = function () {
			const className = this.getParent().settings.get('classContainer');
			if (BX.Dom.hasClass(this.getResponse(), className)) {
				return this.getResponse();
			}
			return BX.Grid.Utils.getByClass(this.getResponse(), className, true);
		};

		/**
		 * Gets head rows of grid from server response
		 * @return {?HTMLTableRowElement[]}
		 */
		BX.Grid.Data.prototype.getHeadRows = function () {
			if (!this.headRows) {
				this.headRows = BX.Grid.Utils.getByClass(this.getResponse(), this.getParent().settings.get('classHeadRow'));
			}
			return this.headRows;
		};

		/**
		 * Gets body rows of grid form server request
		 * @return {?HTMLTableRowElement[]}
		 */
		BX.Grid.Data.prototype.getBodyRows = function () {
			if (!this.bodyRows) {
				this.bodyRows = BX.Grid.Utils.getByClass(this.getResponse(), this.getParent().settings.get('classBodyRow'));
			}
			return this.bodyRows;
		};

		/**
		 * Gets rows by parent id
		 * @param {string|number} id
		 * @return {?HTMLTableRowElement[]}
		 */
		BX.Grid.Data.prototype.getRowsByParentId = function (id) {
			if (!(id in this.rowsByParentId)) {
				this.rowsByParentId[id] = BX.Grid.Utils.getBySelector(this.getResponse(), `.${this.getParent().settings.get('classBodyRow')}[data-parent-id="${id}"]`);
			}
			return this.rowsByParentId[id];
		};

		/**
		 * Gets row by row id
		 * @param {string|number} id
		 * @return {?HTMLTableRowElement}
		 */
		BX.Grid.Data.prototype.getRowById = function (id) {
			if (!(id in this.rowById)) {
				this.rowById[id] = BX.Grid.Utils.getBySelector(this.getResponse(), `.${this.getParent().settings.get('classBodyRow')}[data-id="${id}"]`, true);
			}
			return this.rowById[id];
		};

		/**
		 * Gets tfoot rows of grid from request
		 * @return {?HTMLTableRowElement[]}
		 */
		BX.Grid.Data.prototype.getFootRows = function () {
			if (!this.footRows) {
				this.footRows = BX.Grid.Utils.getByClass(this.getResponse(), this.getParent().settings.get('classFootRow'));
			}
			return this.footRows;
		};

		/**
		 * Gets more button from request
		 * @return {?HTMLElement}
		 */
		BX.Grid.Data.prototype.getMoreButton = function () {
			if (!this.moreButton) {
				this.moreButton = BX.Grid.Utils.getByClass(this.getResponse(), this.getParent().settings.get('classMoreButton'), true);
			}
			return this.moreButton;
		};

		/**
		 * Gets pagination of grid from request
		 * @return {?HTMLElement}
		 */
		BX.Grid.Data.prototype.getPagination = function () {
			if (!this.pagination) {
				this.pagination = BX.Grid.Utils.getByClass(this.getResponse(), this.getParent().settings.get('classPagination'), true);
				if (BX.type.isDomNode(this.pagination)) {
					this.pagination = BX.firstChild(this.pagination);
				}
			}
			return this.pagination;
		};

		/**
		 * Gets counter of displayed rows
		 * @return {?HTMLElement}
		 */
		BX.Grid.Data.prototype.getCounterDisplayed = function () {
			if (!this.counterDisplayed) {
				this.counterDisplayed = BX.Grid.Utils.getByClass(this.getResponse(), this.getParent().settings.get('classCounterDisplayed'), true);
			}
			return this.counterDisplayed;
		};

		/**
		 * Gets counter of selected rows
		 * @return {?HTMLElement}
		 */
		BX.Grid.Data.prototype.getCounterSelected = function () {
			if (!this.counterSelected) {
				this.counterSelected = BX.Grid.Utils.getByClass(this.getResponse(), this.getParent().settings.get('classCounterSelected'), true);
			}
			return this.counterSelected;
		};

		/**
		 * Gets counter of total rows count
		 * @return {?HTMLElement}
		 */
		BX.Grid.Data.prototype.getCounterTotal = function () {
			if (!BX.type.isDomNode(this.counterTotal)) {
				const selector = `.${this.getParent().settings.get('classCounterTotal')} .${this.getParent().settings.get('classPanelCellContent')}`;
				this.counterTotal = BX.Grid.Utils.getBySelector(this.getResponse(), selector, true);
			}
			return this.counterTotal;
		};

		/**
		 * Gets dropdown of pagesize
		 * @return {?HTMLElement}
		 */
		BX.Grid.Data.prototype.getLimit = function () {
			if (!this.limit) {
				this.limit = BX.Grid.Utils.getByClass(this.getResponse(), this.getParent().settings.get('classPageSize'), true);
			}
			return this.limit;
		};

		/**
		 * Gets dropdown of pagesize
		 * @alias BX.Grid.Data.prototype.getLimit
		 * @return {?HTMLElement}
		 */
		BX.Grid.Data.prototype.getPageSize = function () {
			return this.getLimit();
		};

		/**
		 * Gets action panel of grid
		 * @return {?HTMLElement}
		 */
		BX.Grid.Data.prototype.getActionPanel = function () {
			if (!this.actionPanel) {
				this.actionPanel = BX.Grid.Utils.getByClass(this.getResponse(), this.getParent().settings.get('classActionPanel'), true);
			}
			return this.actionPanel;
		};
	})();

	(function () {

		BX.namespace('BX.Main');

		/**
		 * BX.Main.dropdown
		 * @param dropdown
		 */
		BX.Main.dropdown = function (dropdown) {
			this.id = null;
			this.dropdown = null;
			this.items = null;
			this.value = null;
			this.menuId = null;
			this.menu = null;
			this.menuItems = null;
			this.multiple = null;
			this.emptyText = null;
			this.dataItems = 'items';
			this.dataValue = 'value';
			this.dataPseudo = 'pseudo';
			this.dropdownItemClass = 'main-dropdown-item';
			this.activeClass = 'main-dropdown-active';
			this.selectedClass = 'main-dropdown-item-selected';
			this.notSelectedClass = 'main-dropdown-item-not-selected';
			this.lockedClass = 'main-dropdown-item-locked';
			this.menuItemClass = 'menu-popup-item';
			this.init(dropdown);
		};
		BX.Main.dropdown.prototype = {
			init(dropdown) {
				this.id = dropdown.id;
				this.dropdown = dropdown;
				this.items = this.getItems();
				this.value = this.getValue();
				this.menuId = this.getMenuId();
				this.multiple = this.getMultiple();
				this.emptyText = this.getEmptyText();
				this.openedByKeyboard = false;
				this.initialFocusPosition = null;
				this.menu = this.createMenu();
				this.menu.popupWindow.show();
				this.adjustPosition();
				BX.bind(this.dropdown, 'click', BX.delegate(this._onClick, this));
				BX.bind(this.dropdown, 'keydown', BX.delegate(this._onKeyDown, this));
			},
			_onClick() {
				this.openedByKeyboard = false;
				this.initialFocusPosition = null;
				this.showMenu();
			},
			/**
			 * The menu itself needs no key handling: main.popup walks the items, activates them and
			 * closes on Escape on its own. Only opening is ours, and with it the fact that the menu
			 * was opened from the keyboard — that is what decides whether the focus goes inside.
			 *
			 * ArrowUp opens the menu at its last item, the way the interface buttons of main do it.
			 */
			_onKeyDown(event) {
				const isActivation = event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
				const isArrowDown = event.key === 'ArrowDown';
				const isArrowUp = event.key === 'ArrowUp';
				if (!isActivation && !isArrowDown && !isArrowUp) {
					return;
				}
				event.preventDefault();
				this.openWithKeyboard(event.key);
			},
			/**
			 * Opens the menu the way a keyboard user asked for it. Public because the manager builds
			 * the instance lazily, on the first event that reaches the control: the key that created
			 * the dropdown has already passed it by, so the opening is carried out from there.
			 */
			openWithKeyboard(key) {
				this.openedByKeyboard = true;
				this.initialFocusPosition = key === 'ArrowUp' ? 'last' : 'first';
				this.showMenu();
			},
			getMenuId() {
				return `${this.id}_menu`;
			},
			getItems() {
				let result;
				try {
					const str = this.dropdown.dataset[this.dataItems];
					result = JSON.parse(str);
					result = this.prepareItemsValues(result);
				} catch {
					result = [];
				}
				return result;
			},
			prepareItemsValues(items) {
				return items.map(item => {
					if ('VALUE' in item) {
						item.VALUE = String(item.VALUE);
					}
					if ('ITEMS' in item) {
						item.ITEMS = this.prepareItemsValues(item.ITEMS);
					}
					return item;
				});
			},
			// single
			getValue() {
				return this.dropdown.dataset[this.dataValue];
			},
			getValueItem() {
				const value = this.getValue();
				return this.getDataItemByValue(value);
			},
			// multiple
			getValueAsArray() {
				let value = this.getValue();
				if (value === undefined) {
					value = '';
				}
				return value.toString().split(',').filter(i => i !== '');
			},
			getValueItems() {
				const values = this.getValueAsArray();
				return this.getDataItemsByValues(values);
			},
			toggleValue(value) {
				if (this.multiple) {
					if (value || value === 0 || value === '0') {
						const values = this.getValueAsArray();
						const index = values.indexOf(value);
						if (index < 0) {
							values.push(value);
						} else {
							values.splice(index, 1);
						}
						this.dropdown.dataset[this.dataValue] = values.join(',');
					} else {
						this.dropdown.dataset[this.dataValue] = null;
					}
				} else {
					this.dropdown.dataset[this.dataValue] = value;
				}
			},
			getValueText() {
				if (this.multiple) {
					return this.getValueItems().map(item => item.NAME).filter(i => Boolean(i)).join(', ') || this.emptyText;
				}
				const item = this.getValueItem();
				if (item) {
					return item.NAME;
				}

				// A value outside the item list has no caption of its own: keep the rendered one
				// rather than wiping it with the empty text the dropdown was not given.
				return this.emptyText ?? this.getRenderedText();
			},
			getRenderedText() {
				const caption = BX.firstChild(this.dropdown);
				if (!caption) {
					return '';
				}
				return this.dropdown.dataset.htmlEntity === 'true' ? caption.innerHTML : caption.innerText;
			},
			getMultiple() {
				return this.dropdown.dataset.multiple === 'Y';
			},
			getEmptyText() {
				return this.dropdown.dataset.emptyText || null;
			},
			prepareMenuItems() {
				const self = this;
				let attrs;
				let subItem;
				const currentValue = this.multiple ? this.getValueAsArray() : this.getValue();
				function prepareItems(items) {
					const isHtmlEntity = self.dropdown.dataset.htmlEntity === 'true';
					return items.map(item => {
						attrs = {};
						attrs[`data-${self.dataValue}`] = item.VALUE;
						attrs[`data-${self.dataPseudo}`] = 'PSEUDO' in item && item.PSEUDO ? 'true' : 'false';
						subItem = BX.create('div', {
							children: [BX.create('span', {
								props: {
									className: self.dropdownItemClass
								},
								attrs,
								html: isHtmlEntity ? item.NAME : null,
								text: isHtmlEntity ? null : item.NAME
							})]
						});
						const selected = self.multiple ? currentValue.includes(item.VALUE) : currentValue === item.VALUE;
						return {
							html: subItem.innerHTML,
							className: selected ? self.selectedClass : self.notSelectedClass,
							delimiter: item.DELIMITER,
							items: 'ITEMS' in item ? prepareItems(item.ITEMS) : null
						};
					});
				}
				const items = prepareItems(this.items);
				BX.onCustomEvent(window, 'Dropdown::onPrepareItems', [this.id, this.menuId, items]);
				return items;
			},
			createMenu() {
				const self = this;
				return BX.PopupMenu.create(this.getMenuId(), this.dropdown, this.prepareMenuItems(), {
					autoHide: true,
					offsetTop: -8,
					// The menu hangs under its dropdown, not to the right of it. The 40px used
					// to make room for the angle that pointed at the control; the angle was
					// dropped in bc96b69c0149 and the offset was left behind, shifting every
					// menu of the grid rightwards. Callers can still ask for one by hand.
					offsetLeft: Number(this.dropdown.dataset.menuOffsetLeft || 0),
					maxHeight: Number(this.dropdown.dataset.menuMaxHeight || 170),
					// Without the trap MenuItem.focus() only paints the item and leaves the real
					// focus outside, so the built-in arrow navigation has nothing to move. The
					// default is no help here: it hangs on the ui.a11y setting, which is on only
					// where Dev\Main\Migrator\ModuleUpdater exists.
					focusTrap: true,
					ariaLabel: this.dropdown.getAttribute('aria-label') || this.dropdown.dataset.name || null,
					navigationOptions: {
						initialFocusPosition: this.initialFocusPosition
					},
					events: {
						onPopupClose: BX.delegate(this._onCloseMenu, this),
						onPopupShow() {
							self._onShowMenu();
						},
						// The menu ignores input until the opening animation is over, so the
						// focus is placed after it, not on show.
						onAfterPopupShow() {
							self._onAfterShowMenu();
						}
					}
				});
			},
			showMenu() {
				this.menu = BX.PopupMenu.getMenuById(this.menuId);
				if (!this.menu) {
					this.menu = this.createMenu();
					this.menu.popupWindow.show();
				}
				this.adjustPosition();
			},
			/**
			 * Puts the menu of a panel dropdown over its control. The menu stays where main.popup put
			 * it — in the body — and is placed by the measured position of the dropdown instead of
			 * being moved inside it. Moving it used to break the keyboard: the focused item was taken
			 * out of the document by the rebuild that follows, and with it the focus, so the arrows
			 * walked the highlight while the focus sat on the body.
			 *
			 * The panel of group actions floats: once the grid is scrolled past it, the panel becomes
			 * `position: fixed` at the bottom of the viewport. The menu therefore follows the same
			 * kind of positioning as the panel it belongs to, and is kept on the control while the
			 * page scrolls.
			 */
			adjustPosition() {
				if (this.dropdown.dataset.popupPosition !== 'fixed') {
					return;
				}
				this.placeAbovePanel();
				this.bindPanelFollow();
			},
			placeAbovePanel() {
				const container = this.menu?.popupWindow?.popupContainer;
				if (!BX.type.isDomNode(container)) {
					return;
				}
				const dropdownRect = this.dropdown.getBoundingClientRect();
				const menuHeight = container.offsetHeight;
				const gap = 5;

				// The panel is fixed to the viewport while it floats, so the menu is too: it then keeps
				// its place on the control without a scroll handler doing the work on every frame.
				//
				// The state is read off the panel itself rather than off its class: unpinning is
				// animated and the class is dropped 200ms late (pin-panel.js), so a scroll landing in
				// between would be measured against a state the panel has already left.
				const panel = this.dropdown.closest('.main-grid-action-panel');
				const isFloating = BX.type.isDomNode(panel) && getComputedStyle(panel).position === 'fixed';
				container.style.setProperty('position', isFloating ? 'fixed' : 'absolute');
				container.style.setProperty('bottom', 'auto');
				container.style.setProperty('right', 'auto');
				const top = isFloating ? dropdownRect.top - menuHeight - gap : dropdownRect.top - menuHeight - gap + window.scrollY;
				const left = isFloating ? dropdownRect.left : dropdownRect.left + window.scrollX;
				container.style.setProperty('top', `${Math.round(top)}px`);
				container.style.setProperty('left', `${Math.round(left)}px`);
			},
			bindPanelFollow() {
				if (this.panelFollowHandler) {
					return;
				}

				// The panel unpins with an animation, so the frame a scroll event lands on is not the
				// frame the panel settles in. The menu is therefore re-placed for as long as the
				// scrolling lasts and a little after it stops, instead of once per event.
				let until = 0;
				let running = false;
				const tick = () => {
					this.placeAbovePanel();
					if (Date.now() < until) {
						requestAnimationFrame(tick);
						return;
					}
					running = false;
				};
				this.panelFollowHandler = () => {
					// main.popup closes the menu on a scroll of its binding element, but the panel
					// floats and the control stays on screen, so the menu is kept with it.
					until = Date.now() + 300;
					if (!running) {
						running = true;
						requestAnimationFrame(tick);
					}
				};
				window.addEventListener('scroll', this.panelFollowHandler, true);
				window.addEventListener('resize', this.panelFollowHandler);
			},
			unbindPanelFollow() {
				if (!this.panelFollowHandler) {
					return;
				}
				window.removeEventListener('scroll', this.panelFollowHandler, true);
				window.removeEventListener('resize', this.panelFollowHandler);
				this.panelFollowHandler = null;
			},
			getSubItem(node) {
				return BX.Grid.Utils.getByClass(node, this.dropdownItemClass, true);
			},
			refresh(item) {
				const subItem = this.getSubItem(item);
				let value = BX.data(subItem, this.dataValue);
				if (BX.Type.isUndefined(value)) {
					value = '';
				}
				this.toggleValue(value);
				if (this.dropdown.dataset.htmlEntity === 'true') {
					BX.firstChild(this.dropdown).innerHTML = this.getValueText();
				} else {
					BX.firstChild(this.dropdown).innerText = this.getValueText();
				}
			},
			selectItem(node) {
				const self = this;
				(this.menu.menuItems || []).forEach(current => {
					// multiple
					if (self.multiple) {
						if (node === current.layout.item) {
							if (BX.hasClass(node, self.selectedClass)) {
								BX.addClass(current.layout.item, self.notSelectedClass);
								BX.removeClass(current.layout.item, self.selectedClass);
							} else {
								BX.removeClass(current.layout.item, self.notSelectedClass);
								BX.addClass(current.layout.item, self.selectedClass);
							}
						}
						return;
					}

					// single
					BX.removeClass(current.layout.item, self.selectedClass);
					if (node === current.layout.item) {
						BX.removeClass(current.layout.item, self.notSelectedClass);
						BX.addClass(current.layout.item, self.selectedClass);
					} else {
						BX.addClass(current.layout.item, self.notSelectedClass);
					}
				});
			},
			lockedItem(node) {
				BX.addClass(node, this.lockedClass);
			},
			getDataItemIndexByValue(items, value) {
				if (BX.type.isArray(items)) {
					items.map((current, index) => {
						if (current.VALUE === value) {
							return false;
						}
					});
				}
				return false;
			},
			getDataItemByValue(value) {
				return this.findDataItemByValue(this.items, value);
			},
			findDataItemByValue(items, value) {
				for (const current of items) {
					if ('VALUE' in current && current.VALUE === value) {
						return current;
					}
					if ('ITEMS' in current) {
						const nestedItem = this.findDataItemByValue(current.ITEMS, value);
						if (nestedItem) {
							return nestedItem;
						}
					}
				}
				return null;
			},
			getDataItemsByValues(values, items = this.items) {
				const result = [];
				items.forEach(item => {
					if ('VALUE' in item && values.includes(item.VALUE)) {
						result.push(item);
					}
					if ('ITEMS' in item) {
						result.push(...this.getDataItemsByValues(values, item.ITEMS));
					}
				});
				return result;
			},
			_onShowMenu() {
				const self = this;
				BX.addClass(this.dropdown, this.activeClass);
				this.dropdown.setAttribute('aria-expanded', 'true');
				(this.menu.menuItems || []).forEach(current => {
					BX.bind(current.layout.item, 'click', BX.delegate(self._onItemClick, self));
				});
			},
			_onAfterShowMenu() {
				if (!this.openedByKeyboard) {
					return;
				}
				const navigation = this.menu?.getNavigation?.();
				if (this.initialFocusPosition === 'last') {
					navigation?.focusLast?.();
					return;
				}
				navigation?.focusFirst?.();
			},
			_onCloseMenu() {
				// Only the panel dropdowns ever start following, so the teardown is called the way it
				// may be absent: a dropdown that never positioned itself has nothing to unbind.
				this.unbindPanelFollow?.();
				BX.removeClass(this.dropdown, this.activeClass);
				this.dropdown.setAttribute('aria-expanded', 'false');
				BX.PopupMenu.destroy(this.menuId);

				// The menu is destroyed with every close, taking the focus with it: without this the
				// next Tab would start the walk over from the top of the page.
				if (this.openedByKeyboard) {
					this.openedByKeyboard = false;
					this.dropdown.focus();
				}
			},
			_onItemClick(event) {
				const item = this.getMenuItem(event.target);
				let value;
				let dataItem;
				const subItem = this.getSubItem(item);
				const isPseudo = BX.data(subItem, 'pseudo');
				if (isPseudo === 'true') {
					value = BX.data(subItem, 'value');
					dataItem = this.getDataItemByValue(value);
				} else {
					this.refresh(item);
					this.selectItem(item);
					if (!this.multiple) {
						this.menu.popupWindow.close();
					}
					value = this.getValue();
					dataItem = this.getDataItemByValue(value);
				}
				event.stopPropagation();
				BX.onCustomEvent(window, 'Dropdown::change', [this.dropdown.id, event, item, dataItem, value]);
			},
			getMenuItem(node) {
				let item = node;
				if (!BX.hasClass(item, this.menuItemClass)) {
					item = BX.findParent(item, {
						class: this.menuItemClass
					});
				}
				return item;
			}
		};
	})();

	(function () {

		BX.namespace('BX.Main');
		BX.Main.dropdownManager = {
			dropdownClass: 'main-dropdown',
			data: {},
			init() {
				const self = this;
				let onLoadItems;
				let items;

				// A dropdown is built on demand, at the first event that reaches it. The pointer is
				// not the only way in: a keyboard user activates the control with Enter, Space or
				// an arrow, and without this branch no instance would ever be created for them —
				// so the menu, its navigation and the whole keyboard path would simply not exist.
				const ensureInstance = target => {
					if (!BX.hasClass(target, this.dropdownClass)) {
						return null;
					}
					const existing = this.getById(target.id);
					if (existing && existing.dropdown === target) {
						self.push(target.id, existing);
						return existing;
					}
					const created = new BX.Main.dropdown(target);
					self.push(target.id, created);
					return created;
				};
				BX.bind(document, 'click', BX.delegate(function (event) {
					if (BX.hasClass(event.target, this.dropdownClass)) {
						event.preventDefault();
						ensureInstance(event.target);
					}
				}, this));
				BX.bind(document, 'keydown', BX.delegate(function (event) {
					const isActivation = event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
					const isArrow = event.key === 'ArrowDown' || event.key === 'ArrowUp';
					if (!isActivation && !isArrow) {
						return;
					}
					if (!BX.hasClass(event.target, this.dropdownClass)) {
						return;
					}
					const instance = ensureInstance(event.target);

					// The instance binds its own keydown handler, but only from now on: the very
					// key that created it has already passed that element by, so the opening it
					// asked for is carried out here.
					if (instance) {
						event.preventDefault();
						instance.openWithKeyboard(event.key);
					}
				}, this));
				onLoadItems = BX.Grid.Utils.getByClass(document.body, this.dropdownClass);
				if (BX.type.isArray(onLoadItems)) {
					onLoadItems.forEach(current => {
						self.getById(current.id);
						try {
							items = eval(BX.data(current, 'items'));
						} catch {}
						BX.onCustomEvent(window, 'Dropdown::load', [current.id, {}, null, BX.type.isArray(items) && items.length > 0 ? items[0] : [], BX.data(current, 'value')]);
					});
				}
			},
			push(id, instance) {
				this.data[id] = instance;
			},
			getById(id) {
				return id in this.data ? this.data[id] : null;
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * @param {HtmlElement} node
		 * @param {BX.Main.grid} [parent]
		 * @constructor
		 */
		BX.Grid.Element = function (node, parent) {
			this.node = null;
			this.href = null;
			this.parent = null;
			this.init(node, parent);
		};
		BX.Grid.Element.prototype = {
			init(node, parent) {
				this.node = node;
				this.parent = parent;
				this.resetOnclickAttr();
			},
			getParent() {
				return this.parent;
			},
			load() {
				BX.addClass(this.getNode(), this.getParent().settings.get('classLoad'));
			},
			unload() {
				BX.removeClass(this.getNode(), this.getParent().settings.get('classLoad'));
			},
			isLoad() {
				return BX.hasClass(this.getNode(), this.getParent().settings.get('classLoad'));
			},
			resetOnclickAttr() {
				if (BX.type.isDomNode(this.getNode())) {
					this.getNode().onclick = null;
				}
			},
			getObserver() {
				return BX.Grid.observer;
			},
			getNode() {
				return this.node;
			},
			getLink() {
				let result;
				try {
					result = this.getNode().href;
				} catch {
					result = null;
				}
				return result;
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * BX.Grid.Fader
		 * @param {BX.Main.grid} parent
		 * @constructor
		 */
		BX.Grid.Fader = function (parent) {
			this.parent = null;
			this.table = null;
			this.container = null;
			this.init(parent);
		};
		BX.Grid.Fader.prototype = {
			init(parent) {
				this.parent = parent;
				this.table = this.parent.getTable();
				this.container = this.table.parentNode;
				this.scrollStartEventName = this.parent.isTouch() ? 'touchstart' : 'mouseenter';
				this.scrollEndEventName = this.parent.isTouch() ? 'touchend' : 'mouseleave';
				if (this.parent.getParam('ALLOW_PIN_HEADER')) {
					this.fixedTable = this.parent.getPinHeader().getFixedTable();
				}
				this.debounceScrollHandler = BX.debounce(this._onWindowScroll, 400, this);
				BX.bind(window, 'resize', BX.proxy(this.toggle, this));
				document.addEventListener('scroll', this.debounceScrollHandler, BX.Grid.Utils.listenerParams({
					passive: true
				}));
				this.container.addEventListener('scroll', BX.proxy(this.toggle, this), BX.Grid.Utils.listenerParams({
					passive: true
				}));
				BX.addCustomEvent(window, 'Grid::updated', BX.proxy(this.toggle, this));
				BX.addCustomEvent(window, 'Grid::resize', BX.proxy(this.toggle, this));
				BX.addCustomEvent(window, 'Grid::headerUpdated', BX.proxy(this._onHeaderUpdated, this));
				BX.addCustomEvent(window, 'Grid::columnResize', BX.proxy(this.toggle, this));
				BX.bind(this.getEarLeft(), this.scrollStartEventName, BX.proxy(this._onMouseoverLeft, this));
				BX.bind(this.getEarRight(), this.scrollStartEventName, BX.proxy(this._onMouseoverRight, this));
				BX.bind(this.getEarLeft(), this.scrollEndEventName, BX.proxy(this.stopScroll, this));
				BX.bind(this.getEarRight(), this.scrollEndEventName, BX.proxy(this.stopScroll, this));
				this.toggle();
				this.adjustEarOffset(true);
			},
			destroy() {
				BX.unbind(window, 'resize', BX.proxy(this.toggle, this));
				document.removeEventListener('scroll', this.debounceScrollHandler, BX.Grid.Utils.listenerParams({
					passive: true
				}));
				this.container.removeEventListener('scroll', BX.proxy(this.toggle, this), BX.Grid.Utils.listenerParams({
					passive: true
				}));
				BX.removeCustomEvent(window, 'Grid::updated', BX.proxy(this.toggle, this));
				BX.removeCustomEvent(window, 'Grid::headerUpdated', BX.proxy(this._onHeaderUpdated, this));
				BX.removeCustomEvent(window, 'Grid::columnResize', BX.proxy(this.toggle, this));
				BX.unbind(this.getEarLeft(), this.scrollStartEventName, BX.proxy(this._onMouseoverLeft, this));
				BX.unbind(this.getEarRight(), this.scrollStartEventName, BX.proxy(this._onMouseoverRight, this));
				BX.unbind(this.getEarLeft(), this.scrollEndEventName, BX.proxy(this.stopScroll, this));
				BX.unbind(this.getEarRight(), this.scrollEndEventName, BX.proxy(this.stopScroll, this));
				this.hideLeftEar();
				this.hideRightEar();
				this.stopScroll();
			},
			_onHeaderUpdated() {
				if (this.parent.getParam('ALLOW_PIN_HEADER')) {
					this.fixedTable = this.parent.getPinHeader().getFixedTable();
				}
			},
			_onMouseoverLeft(event) {
				this.parent.isTouch() && event.preventDefault();
				this.startScrollByDirection('left');
			},
			_onMouseoverRight(event) {
				this.parent.isTouch() && event.preventDefault();
				this.startScrollByDirection('right');
			},
			stopScroll() {
				clearTimeout(this.scrollTimer);
				clearInterval(this.scrollInterval);
			},
			startScrollByDirection(direction) {
				const container = this.container;
				let offset = container.scrollLeft;
				const self = this;
				const stepLength = 8;
				const stepTime = 1000 / 60 / 2;
				this.scrollTimer = setTimeout(() => {
					self.scrollInterval = setInterval(() => {
						container.scrollLeft = direction == 'right' ? offset += stepLength : offset -= stepLength;
					}, stepTime);
				}, 100);
			},
			getEarLeft() {
				if (!this.earLeft) {
					this.earLeft = BX.Grid.Utils.getByClass(this.parent.getContainer(), this.parent.settings.get('classEarLeft'), true);
				}
				return this.earLeft;
			},
			getEarRight() {
				if (!this.earRight) {
					this.earRight = BX.Grid.Utils.getByClass(this.parent.getContainer(), this.parent.settings.get('classEarRight'), true);
				}
				return this.earRight;
			},
			getShadowLeft() {
				return this.parent.getContainer().querySelector('.main-grid-fade-shadow-left');
			},
			getShadowRight() {
				return this.parent.getContainer().querySelector('.main-grid-fade-shadow-right');
			},
			adjustEarOffset(prepare) {
				if (prepare) {
					this.windowHeight = BX.height(window);
					this.tbodyPos = BX.pos(this.table.tBodies[0]);
					this.headerPos = BX.pos(this.table.tHead);
				}
				let scrollY = window.scrollY;
				if (this.parent.isIE()) {
					scrollY = document.documentElement.scrollTop;
				}
				let bottomPos = scrollY + this.windowHeight - this.tbodyPos.top;
				let posTop = scrollY - this.tbodyPos.top;
				if (bottomPos > this.tbodyPos.bottom - this.tbodyPos.top) {
					bottomPos = this.tbodyPos.bottom - this.tbodyPos.top;
				}
				if (posTop < this.headerPos.height) {
					posTop = this.headerPos.height;
				} else {
					bottomPos -= posTop;
					bottomPos += this.headerPos.height;
				}
				BX.Grid.Utils.requestAnimationFrame(BX.proxy(function () {
					if (posTop !== this.lastPosTop) {
						const translate = `translate3d(0px, ${posTop}px, 0)`;
						this.getEarLeft().style.transform = translate;
						this.getEarRight().style.transform = translate;
					}
					if (bottomPos !== this.lastBottomPos) {
						this.getEarLeft().style.height = `${bottomPos}px`;
						this.getEarRight().style.height = `${bottomPos}px`;
					}
					this.lastPosTop = posTop;
					this.lastBottomPos = bottomPos;
				}, this));
			},
			_onWindowScroll() {
				this.adjustEarOffset();
			},
			hasScroll() {
				return this.table.offsetWidth > this.container.clientWidth;
			},
			hasScrollLeft() {
				return this.container.scrollLeft > 0;
			},
			hasScrollRight() {
				return this.table.offsetWidth > Math.round(this.container.scrollLeft + this.container.clientWidth);
			},
			showLeftEar() {
				BX.addClass(this.container.parentNode, this.parent.settings.get('classFadeContainerLeft'));
				BX.addClass(this.getEarLeft(), this.parent.settings.get('classShow'));
			},
			hideLeftEar() {
				BX.removeClass(this.container.parentNode, this.parent.settings.get('classFadeContainerLeft'));
				BX.removeClass(this.getEarLeft(), this.parent.settings.get('classShow'));
			},
			showRightEar() {
				BX.addClass(this.container.parentNode, this.parent.settings.get('classFadeContainerRight'));
				BX.addClass(this.getEarRight(), this.parent.settings.get('classShow'));
			},
			hideRightEar() {
				BX.removeClass(this.container.parentNode, this.parent.settings.get('classFadeContainerRight'));
				BX.removeClass(this.getEarRight(), this.parent.settings.get('classShow'));
			},
			adjustFixedTablePosition() {
				const left = this.container.scrollLeft;
				BX.Grid.Utils.requestAnimationFrame(BX.delegate(function () {
					this.fixedTable.style.marginLeft = `${-left}px`;
				}, this));
			},
			toggle() {
				this.adjustEarOffset(true);
				this.fixedTable && this.adjustFixedTablePosition();
				if (this.hasScroll()) {
					this.hasScrollLeft() ? this.showLeftEar() : this.hideLeftEar();
					this.hasScrollRight() ? this.showRightEar() : this.hideRightEar();
				} else {
					this.hideLeftEar();
					this.hideRightEar();
				}
			}
		};
	})();

	(function () {

		BX.namespace('BX.Main');

		/**
		 * @event Grid::ready
		 * @event Grid::columnMoved
		 * @event Grid::rowMoved
		 * @event Grid::pageSizeChanged
		 * @event Grid::optionsUpdated
		 * @event Grid::dataSorted
		 * @event Grid::thereSelectedRows
		 * @event Grid::allRowsSelected
		 * @event Grid::allRowsUnselected
		 * @event Grid::noSelectedRows
		 * @event Grid::updated
		 * @event Grid::headerPinned
		 * @event Grid::headerUnpinned
		 * @event Grid::beforeRequest
		 * @param {string} containerId
		 * @param {object} arParams
		 * @param {boolean} arParams.ALLOW_COLUMNS_SORT
		 * @param {boolean} arParams.ALLOW_ROWS_SORT
		 * @param {boolean} arParams.ALLOW_COLUMNS_RESIZE
		 * @param {boolean} arParams.SHOW_ROW_CHECKBOXES
		 * @param {boolean} arParams.ALLOW_HORIZONTAL_SCROLL
		 * @param {boolean} arParams.ALLOW_PIN_HEADER
		 * @param {boolean} arParams.SHOW_ACTION_PANEL
		 * @param {boolean} arParams.PRESERVE_HISTORY
		 * @param {boolean} arParams.ALLOW_CONTEXT_MENU
		 * @param {object} arParams.DEFAULT_COLUMNS
		 * @param {boolean} arParams.ENABLE_COLLAPSIBLE_ROWS
		 * @param {object} arParams.EDITABLE_DATA
		 * @param {string} arParams.SETTINGS_TITLE
		 * @param {string} arParams.APPLY_SETTINGS
		 * @param {string} arParams.CANCEL_SETTINGS
		 * @param {string} arParams.CONFIRM_APPLY
		 * @param {string} arParams.CONFIRM_CANCEL
		 * @param {string} arParams.CONFIRM_MESSAGE
		 * @param {string} arParams.CONFIRM_FOR_ALL_MESSAGE
		 * @param {string} arParams.CONFIRM_RESET_MESSAGE
		 * @param {object} arParams.COLUMNS_ALL_WITH_SECTIONS
		 * @param {boolean} arParams.ENABLE_FIELDS_SEARCH
		 * @param {object} arParams.CHECKBOX_LIST_OPTIONS
		 * @param {array} arParams.HEADERS_SECTIONS
		 * @param {string} arParams.RESET_DEFAULT
		 * @param {object} userOptions
		 * @param {object} userOptionsActions
		 * @param {object} userOptionsHandlerUrl
		 * @param {object} panelActions
		 * @param {object} panelTypes
		 * @param {object} editorTypes
		 * @param {object} messageTypes
		 * @constructor
		 */
		BX.Main.grid = function (containerId, arParams, userOptions, userOptionsActions, userOptionsHandlerUrl, panelActions, panelTypes, editorTypes, messageTypes) {
			BX.Event.EventEmitter.makeObservable(this, 'BX.Main.Grid');
			this.settings = null;
			this.containerId = '';
			this.container = null;
			this.wrapper = null;
			this.fadeContainer = null;
			this.scrollContainer = null;
			this.pagination = null;
			this.moreButton = null;
			this.table = null;
			this.rows = null;
			this.history = false;
			this.userOptions = null;
			this.checkAll = null;
			this.sortable = null;
			this.updater = null;
			this.data = null;
			this.fader = null;
			this.editor = null;
			this.isEditMode = null;
			this.pinHeader = null;
			this.pinPanel = null;
			this.arParams = null;
			this.resize = null;
			this.editableRows = [];
			this.init(containerId, arParams, userOptions, userOptionsActions, userOptionsHandlerUrl, panelActions, panelTypes, editorTypes, messageTypes);
		};
		BX.Main.grid.prototype = {
			init(containerId, arParams, userOptions, userOptionsActions, userOptionsHandlerUrl, panelActions, panelTypes, editorTypes, messageTypes) {
				this.baseUrl = window.location.pathname + window.location.search;
				this.container = BX(containerId);
				if (!BX.type.isNotEmptyString(containerId)) {
					throw 'BX.Main.grid.init: parameter containerId is empty';
				}
				if (BX.type.isPlainObject(arParams)) {
					this.arParams = arParams;
				} else {
					throw new TypeError('BX.Main.grid.init: arParams isn\'t object');
				}
				this.settings = new BX.Grid.Settings();
				this.containerId = containerId;
				this.specialEmptyColumnAdjusted = false;
				this.userOptions = new BX.Grid.UserOptions(this, userOptions, userOptionsActions, userOptionsHandlerUrl);
				this.gridSettings = new BX.Grid.SettingsWindow.Manager(this);
				this.messages = new BX.Grid.Message(this, messageTypes);
				this.cache = new BX.Cache.MemoryCache();
				if (this.getParam('ALLOW_PIN_HEADER')) {
					this.pinHeader = new BX.Grid.PinHeader(this);
					BX.addCustomEvent(window, 'Grid::headerUpdated', BX.proxy(this.bindOnCheckAll, this));
				}
				this.bindOnCheckAll();
				if (this.getParam('ALLOW_HORIZONTAL_SCROLL')) {
					this.fader = new BX.Grid.Fader(this);
				}
				this.pageSize = new BX.Grid.Pagesize(this);
				this.editor = new BX.Grid.InlineEditor(this, editorTypes);
				if (this.getParam('SHOW_ACTION_PANEL')) {
					this.actionPanel = new BX.Grid.ActionPanel(this, panelActions, panelTypes);
					this.pinPanel = new BX.Grid.PinPanel(this);

					// The panel is rendered disabled and wakes up only once a row is ticked, so its
					// controls have to start out of reach as well — otherwise they are reachable by
					// Tab from the moment the page loads.
					const panel = this.getActionsPanel().getPanel();
					if (BX.Type.isDomNode(panel) && BX.hasClass(panel, this.settings.get('classDisable'))) {
						this.toggleActionsPanelControls(false);
					}
				}
				this.isEditMode = false;
				if (!BX.type.isDomNode(this.getContainer())) {
					throw `BX.Main.grid.init: Failed to find container with id ${this.getContainerId()}`;
				}
				if (!BX.type.isDomNode(this.getTable())) {
					throw 'BX.Main.grid.init: Failed to find table';
				}
				this.bindOnRowEvents();
				if (this.getParam('ALLOW_COLUMNS_RESIZE')) {
					this.resize = new BX.Grid.Resize(this);
				}
				this.bindOnMoreButtonEvents();
				this.bindOnClickPaginationLinks();
				this.bindOnClickHeader();
				if (this.getParam('ALLOW_ROWS_SORT')) {
					this.initRowsDragAndDrop();
				}
				if (this.getParam('ALLOW_COLUMNS_SORT')) {
					this.initColsDragAndDrop();
				}
				this.getRows().initSelected();
				this.adjustEmptyTable(this.getRows().getSourceBodyChild());
				BX.onCustomEvent(this.getContainer(), 'Grid::ready', [this]);
				BX.addCustomEvent(window, 'Grid::unselectRow', BX.proxy(this._onUnselectRows, this));
				BX.addCustomEvent(window, 'Grid::unselectRows', BX.proxy(this._onUnselectRows, this));
				BX.addCustomEvent(window, 'Grid::allRowsUnselected', BX.proxy(this._onUnselectRows, this));
				BX.addCustomEvent(window, 'Grid::updated', BX.proxy(this._onGridUpdated, this));
				window.frames[this.getFrameId()].onresize = BX.throttle(this._onFrameResize, 20, this);
				if (this.getParam('ALLOW_STICKED_COLUMNS')) {
					this.initStickedColumns();
				}
			},
			destroy() {
				BX.removeCustomEvent(window, 'Grid::unselectRow', BX.proxy(this._onUnselectRows, this));
				BX.removeCustomEvent(window, 'Grid::unselectRows', BX.proxy(this._onUnselectRows, this));
				BX.removeCustomEvent(window, 'Grid::allRowsUnselected', BX.proxy(this._onUnselectRows, this));
				BX.removeCustomEvent(window, 'Grid::headerPinned', BX.proxy(this.bindOnCheckAll, this));
				BX.removeCustomEvent(window, 'Grid::updated', BX.proxy(this._onGridUpdated, this));
				this.getPinHeader() && this.getPinHeader().destroy();
				this.getFader() && this.getFader().destroy();
				this.getResize() && this.getResize().destroy();
				this.getColsSortable() && this.getColsSortable().destroy();
				this.getRowsSortable() && this.getRowsSortable().destroy();
				this.getSettingsWindow() && this.getSettingsWindow().destroy();
				this.getActionsPanel() && this.getActionsPanel().destroy();
				this.getPinPanel() && this.getPinPanel().destroy();
				this.getPageSize() && this.getPageSize().destroy();
			},
			_onFrameResize() {
				this.adjustSpecialEmptyColumnWidth();
				BX.onCustomEvent(window, 'Grid::resize', [this]);
			},
			_onGridUpdated(grid) {
				if (grid instanceof BX.Main.grid && grid !== this) {
					return;
				}
				this.initStickedColumns();
				this.adjustFadePosition(this.getFadeOffset());
			},
			/**
			 * @private
			 * @return {string}
			 */
			getFrameId() {
				return `main-grid-tmp-frame-${this.getContainerId()}`;
			},
			/**
			 * The phrases come from template.php through BX.message and are absent in an old cached page,
			 * so an announcement without a text is silently dropped.
			 * @private
			 * @param {string} messageId
			 * @param {object} [replacements]
			 */
			announce(messageId, replacements = {}) {
				const announcer = BX.UI?.Accessibility?.LiveAnnouncer;
				let message = BX.message(messageId);
				if (!announcer || !BX.Type.isStringFilled(message)) {
					return;
				}
				Object.keys(replacements).forEach(placeholder => {
					message = message.replace(placeholder, replacements[placeholder]);
				});
				announcer.announce(message);
			},
			enableActionsPanel() {
				if (this.getParam('SHOW_ACTION_PANEL')) {
					const panel = this.getActionsPanel().getPanel();
					if (BX.type.isDomNode(panel)) {
						const wasHidden = BX.hasClass(panel, this.settings.get('classDisable'));
						BX.removeClass(panel, this.settings.get('classDisable'));
						this.toggleActionsPanelControls(true);
						this.toggleSkipToActions(true);
						if (wasHidden) {
							this.announce('interface_grid_actions_panel_available');
						}
					}
				}
			},
			/**
			 * The link lives before the table and leads past it, to the actions. It only makes sense
			 * while something is selected, so it shares the fate of the panel it points at: reaching
			 * the actions otherwise means tabbing through every row that was just ticked.
			 * @param {boolean} enabled
			 */
			toggleSkipToActions(enabled) {
				const link = BX.Grid.Utils.getBySelector(this.getContainer(), '.main-grid-skip-to-actions', true);
				if (BX.Type.isDomNode(link)) {
					link.hidden = !enabled;
				}
			},
			disableActionsPanel() {
				this.toggleSkipToActions(false);
				if (this.getParam('SHOW_ACTION_PANEL')) {
					const panel = this.getActionsPanel().getPanel();
					if (BX.type.isDomNode(panel)) {
						BX.addClass(panel, this.settings.get('classDisable'));
						this.toggleActionsPanelControls(false);
					}
				}
			},
			/**
			 * Takes the controls of a disabled panel out of reach, or gives them back. The class the
			 * panel carries only dims them and sets `pointer-events: none`, which stops the pointer
			 * and nothing else: with the keyboard the controls kept their tab stops and still fired
			 * on Enter, so an action could be run that the mouse could not even click.
			 *
			 * The exception mirrors the stylesheet: the «for all rows» control stays operable while
			 * the panel is off, because that is what it is for.
			 *
			 * @param {boolean} enabled
			 */
			toggleActionsPanelControls(enabled) {
				const panel = this.getActionsPanel().getPanel();
				if (!BX.Type.isDomNode(panel)) {
					return;
				}
				const containers = panel.querySelectorAll('.main-grid-panel-control-container');
				containers.forEach(container => {
					if (container.id && container.id.includes('actallrows_')) {
						return;
					}
					container.querySelectorAll('button, input, select, textarea, a[href], [tabindex]').forEach(control => {
						if (enabled) {
							// The tab stop is restored to what the markup asked for, not simply
							// dropped: the dropdowns of the panel carry `tabindex="0"` of their own
							// (template.php), and removing the attribute would take them out of the
							// Tab order for good — the control looks active and cannot be reached.
							if (Object.hasOwn(control.dataset, 'gridPanelTabindex')) {
								const restored = control.dataset.gridPanelTabindex;
								delete control.dataset.gridPanelTabindex;
								if (restored === '') {
									control.removeAttribute('tabindex');
								} else {
									BX.Dom.attr(control, 'tabindex', restored);
								}
							}
							control.removeAttribute('aria-disabled');
							if (control.dataset.gridPanelDisabled === 'true') {
								delete control.dataset.gridPanelDisabled;
								control.disabled = false;
							}
							return;
						}
						if (!Object.hasOwn(control.dataset, 'gridPanelTabindex')) {
							control.dataset.gridPanelTabindex = control.getAttribute('tabindex') ?? '';
						}
						BX.Dom.attr(control, 'tabindex', '-1');
						BX.Dom.attr(control, 'aria-disabled', 'true');

						// `disabled` is ours to drop only if it was ours to set: a control the panel
						// itself disabled must stay disabled once the panel wakes up.
						if (!control.disabled) {
							control.dataset.gridPanelDisabled = 'true';
							control.disabled = true;
						}
					});
				});
			},
			getSettingsWindow() {
				return this.gridSettings;
			},
			_onUnselectRows() {
				const panel = this.getActionsPanel();
				let checkbox;
				if (panel instanceof BX.Grid.ActionPanel) {
					checkbox = panel.getForAllCheckbox();
					if (BX.type.isDomNode(checkbox)) {
						checkbox.checked = null;
						this.disableForAllCounter();
					}
				}
				this.adjustCheckAllCheckboxes();
			},
			/**
			 * @return {boolean}
			 */
			isIE() {
				if (!BX.type.isBoolean(this.ie)) {
					this.ie = BX.hasClass(document.documentElement, 'bx-ie');
				}
				return this.ie;
			},
			/**
			 * @return {boolean}
			 */
			isTouch() {
				if (!BX.type.isBoolean(this.touch)) {
					this.touch = BX.hasClass(document.documentElement, 'bx-touch');
				}
				return this.touch;
			},
			/**
			 * @param {string} paramName
			 * @param {*} [defaultValue]
			 * @return {*}
			 */
			getParam(paramName, defaultValue) {
				if (defaultValue === undefined) {
					defaultValue = null;
				}
				return this.arParams.hasOwnProperty(paramName) ? this.arParams[paramName] : defaultValue;
			},
			/**
			 * @return {HTMLElement[]}
			 */
			getCounterTotal() {
				return BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classCounterTotal'), true);
			},
			getActionKey() {
				return `action_button_${this.getId()}`;
			},
			/**
			 * @return {?BX.Grid.PinHeader}
			 */
			getPinHeader() {
				if (this.getParam('ALLOW_PIN_HEADER')) {
					this.pinHeader = this.pinHeader || new BX.Grid.PinHeader(this);
				}
				return this.pinHeader;
			},
			/**
			 * @return {BX.Grid.Resize}
			 */
			getResize() {
				if (!(this.resize instanceof BX.Grid.Resize) && this.getParam('ALLOW_COLUMNS_RESIZE')) {
					this.resize = new BX.Grid.Resize(this);
				}
				return this.resize;
			},
			confirmForAll(container) {
				let checkbox;
				const self = this;
				if (BX.type.isDomNode(container)) {
					checkbox = BX.Grid.Utils.getByTag(container, 'input', true);
				}
				if (checkbox.checked) {
					this.getActionsPanel().confirmDialog({
						CONFIRM: true,
						CONFIRM_MESSAGE: this.arParams.CONFIRM_FOR_ALL_MESSAGE
					}, () => {
						if (BX.type.isDomNode(checkbox)) {
							checkbox.checked = true;
						}
						self.selectAllCheckAllCheckboxes();
						self.getRows().selectAll();
						self.enableForAllCounter();
						self.updateCounterDisplayed();
						self.updateCounterSelected();
						self.enableActionsPanel();
						self.adjustCheckAllCheckboxes();
						self.lastRowAction = null;
						BX.onCustomEvent(window, 'Grid::allRowsSelected', []);
					}, () => {
						if (BX.type.isDomNode(checkbox)) {
							checkbox.checked = null;
							self.disableForAllCounter();
							self.updateCounterDisplayed();
							self.updateCounterSelected();
							self.adjustCheckAllCheckboxes();
							self.lastRowAction = null;
						}
					});
				} else {
					this.unselectAllCheckAllCheckboxes();
					this.adjustCheckAllCheckboxes();
					this.getRows().unselectAll();
					this.disableForAllCounter();
					this.updateCounterDisplayed();
					this.updateCounterSelected();
					this.disableActionsPanel();
					BX.onCustomEvent(window, 'Grid::allRowsUnselected', []);
				}
			},
			disableCheckAllCheckboxes() {
				this.getCheckAllCheckboxes().forEach(checkbox => {
					checkbox.getNode().disabled = true;
				});
			},
			enableCheckAllCheckboxes() {
				this.getCheckAllCheckboxes().forEach(checkbox => {
					checkbox.getNode().disabled = false;
				});
			},
			indeterminateCheckAllCheckboxes() {
				this.getCheckAllCheckboxes().forEach(checkbox => {
					checkbox.getNode().indeterminate = true;
				});
			},
			determinateCheckAllCheckboxes() {
				this.getCheckAllCheckboxes().forEach(checkbox => {
					checkbox.getNode().indeterminate = false;
				});
			},
			editSelected() {
				this.disableCheckAllCheckboxes();
				this.getRows().editSelected();
				this.announce('interface_grid_edit_mode_announce');
				this.focusFirstEditor();
				if (this.getParam('ALLOW_PIN_HEADER')) {
					this.getPinHeader()._onGridUpdate();
				}
				BX.onCustomEvent(window, 'Grid::resize', [this]);
			},
			/**
			 * Puts the caret into the first field of the edit mode. The button that switches the
			 * mode on stands in the action panel, above the table, so without this the way to the
			 * fields is a walk through every row that was put into edit — the further down the
			 * first edited row sits, the longer it is.
			 *
			 * The first editable control is preferred; a cell whose editor carries none takes the
			 * focus itself, the same way the inline editor returns it on Escape.
			 */
			focusFirstEditor() {
				const container = BX.Grid.Utils.getByClass(this.getTable(), this.settings.get('classEditorContainer'), true);
				if (!BX.Type.isDomNode(container)) {
					return;
				}
				const control = container.querySelector('input, select, textarea, button, [tabindex]');
				if (BX.Type.isDomNode(control)) {
					control.focus();
					return;
				}

				// The cell is focusable just long enough to take the focus: a tabindex left behind
				// would turn the cell into a permanent stop for assistive tech.
				BX.Dom.attr(container, 'tabindex', '-1');
				container.focus();
				BX.bind(container, 'blur', function onBlur() {
					BX.unbind(container, 'blur', onBlur);
					BX.Dom.attr(container, 'tabindex', null);
				});
			},
			editSelectedSave() {
				const data = {
					FIELDS: this.getRows().getEditSelectedValues(true)
				};
				if (this.getParam('ALLOW_VALIDATE')) {
					this.tableFade();
					data[this.getActionKey()] = 'validate';
					this.getData().request('', 'POST', data, 'validate', res => {
						res = JSON.parse(res);
						if (res.messages.length > 0) {
							this.arParams.MESSAGES = res.messages;
							this.messages.show();
							const editButton = this.getActionsPanel().getButtons().find(button => {
								return button.id === 'grid_edit_button_control';
							});
							this.tableUnfade();
							BX.fireEvent(editButton, 'click');
						} else {
							data[this.getActionKey()] = 'edit';
							this.reloadTable('POST', data);
						}
					});
					return;
				}
				if (this.getParam('HANDLE_RESPONSE_ERRORS')) {
					data[this.getActionKey()] = 'edit';
					const self = this;
					this.tableFade();
					this.getData().request('', 'POST', data, '', function (res) {
						try {
							res = JSON.parse(res);
						} catch {
							res = {
								messages: []
							};
						}
						if (res.messages.length > 0) {
							self.arParams.MESSAGES = res.messages;
							self.messages.show();
							const editButton = self.getActionsPanel().getButtons().find(button => {
								return button.id === 'grid_edit_button_control';
							});
							self.tableUnfade();
							BX.fireEvent(editButton, 'click');
							return;
						}
						self.getRows().reset();
						const bodyRows = this.getBodyRows();
						self.getUpdater().updateContainer(this.getContainer());
						self.getUpdater().updateHeadRows(this.getHeadRows());
						self.getUpdater().updateBodyRows(bodyRows);
						self.getUpdater().updateFootRows(this.getFootRows());
						self.getUpdater().updatePagination(this.getPagination());
						self.getUpdater().updateMoreButton(this.getMoreButton());
						self.getUpdater().updateCounterTotal(this.getCounterTotal());
						self.adjustEmptyTable(bodyRows);
						self.bindOnRowEvents();
						self.bindOnMoreButtonEvents();
						self.bindOnClickPaginationLinks();
						self.bindOnClickHeader();
						self.bindOnCheckAll();
						self.updateCounterDisplayed();
						self.updateCounterSelected();
						self.disableActionsPanel();
						self.disableForAllCounter();
						if (self.getParam('SHOW_ACTION_PANEL')) {
							self.getUpdater().updateGroupActions(this.getActionPanel());
						}
						if (self.getParam('ALLOW_COLUMNS_SORT')) {
							self.colsSortable.reinit();
						}
						if (self.getParam('ALLOW_ROWS_SORT')) {
							self.rowsSortable.reinit();
						}
						self.tableUnfade();
						BX.onCustomEvent(window, 'Grid::updated', [self]);
					}, res => {
						const editButton = self.getActionsPanel().getButtons().find(button => {
							return button.id === 'grid_edit_button_control';
						});
						self.tableUnfade();
						BX.fireEvent(editButton, 'click');
					});
					return;
				}
				data[this.getActionKey()] = 'edit';
				this.reloadTable('POST', data);
			},
			getForAllKey() {
				return `action_all_rows_${this.getId()}`;
			},
			updateRow(id, data, url, callback) {
				const row = this.getRows().getById(id);
				if (row instanceof BX.Grid.Row) {
					row.update(data, url, callback);
				}
			},
			removeRow(id, data, url, callback) {
				const row = this.getRows().getById(id);
				if (row instanceof BX.Grid.Row) {
					row.remove(data, url, callback);
				}
			},
			addRow(data, url, callback) {
				const action = this.getUserOptions().getAction('GRID_ADD_ROW');
				const rowData = {
					action,
					data
				};
				const self = this;
				this.tableFade();
				this.getData().request(url, 'POST', rowData, null, function () {
					const bodyRows = this.getBodyRows();
					self.getUpdater().updateBodyRows(bodyRows);
					self.tableUnfade();
					self.getRows().reset();
					self.getUpdater().updateFootRows(this.getFootRows());
					self.getUpdater().updatePagination(this.getPagination());
					self.getUpdater().updateMoreButton(this.getMoreButton());
					self.getUpdater().updateCounterTotal(this.getCounterTotal());
					self.bindOnRowEvents();
					self.adjustEmptyTable(bodyRows);
					self.bindOnMoreButtonEvents();
					self.bindOnClickPaginationLinks();
					self.updateCounterDisplayed();
					self.updateCounterSelected();
					if (self.getParam('ALLOW_COLUMNS_SORT')) {
						self.colsSortable.reinit();
					}
					if (self.getParam('ALLOW_ROWS_SORT')) {
						self.rowsSortable.reinit();
					}
					BX.onCustomEvent(window, 'Grid::rowAdded', [{
						data,
						grid: self,
						response: this
					}]);
					BX.onCustomEvent(window, 'Grid::updated', [self]);
					if (BX.type.isFunction(callback)) {
						callback({
							data,
							grid: self,
							response: this
						});
					}
				});
			},
			editSelectedCancel() {
				this.getRows().editSelectedCancel();
				this.enableCheckAllCheckboxes();
				if (this.getParam('ALLOW_PIN_HEADER')) {
					this.getPinHeader()._onGridUpdate();
				}
			},
			removeSelected() {
				const data = {
					ID: this.getRows().getSelectedIds()
				};
				const values = this.getActionsPanel().getValues();
				data[this.getActionKey()] = 'delete';
				data[this.getForAllKey()] = this.getForAllKey() in values ? values[this.getForAllKey()] : 'N';
				this.reloadTable('POST', data);
			},
			sendSelected() {
				const values = this.getActionsPanel().getValues();
				const selectedRows = this.getRows().getSelectedIds();
				const data = {
					rows: selectedRows,
					controls: values
				};
				this.reloadTable('POST', data);
			},
			sendRowAction(action, data) {
				if (!BX.type.isPlainObject(data)) {
					data = {};
				}
				data[this.getActionKey()] = action;
				this.reloadTable('POST', data);
			},
			/**
			 * @return {?BX.Grid.ActionPanel}
			 */
			getActionsPanel() {
				return this.actionPanel;
			},
			getPinPanel() {
				return this.pinPanel;
			},
			getApplyButton() {
				return BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classPanelButton'), true);
			},
			getEditor() {
				return this.editor;
			},
			reload(url) {
				this.reloadTable('GET', {}, null, url);
			},
			getPanels() {
				return BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classPanels'), true);
			},
			getEmptyBlock() {
				return BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classEmptyBlock'), true);
			},
			adjustEmptyTable(rows) {
				function adjustEmptyBlockPosition(event) {
					const target = event.currentTarget;
					BX.style(emptyBlock, 'transform', `translate3d(${BX.scrollLeft(target)}px, 0px, 0`);
				}
				const filteredRows = rows.filter(row => {
					return BX.Dom.attr(row, 'data-id') !== 'template_0' && !BX.Dom.hasClass(row, 'main-grid-hide');
				});
				if (!BX.hasClass(document.documentElement, 'bx-ie') && filteredRows.length === 1 && BX.hasClass(filteredRows[0], this.settings.get('classEmptyRows'))) {
					const gridRect = BX.pos(this.getContainer());
					const scrollBottom = BX.scrollTop(window) + BX.height(window);
					const diff = gridRect.bottom - scrollBottom;
					const panelsHeight = BX.height(this.getPanels());
					var emptyBlock = this.getEmptyBlock();
					const containerWidth = BX.width(this.getContainer());
					if (containerWidth) {
						BX.width(emptyBlock, containerWidth);
					}
					BX.style(emptyBlock, 'transform', `translate3d(${BX.scrollLeft(this.getScrollContainer())}px, 0px, 0`);
					BX.unbind(this.getScrollContainer(), 'scroll', adjustEmptyBlockPosition);
					BX.bind(this.getScrollContainer(), 'scroll', adjustEmptyBlockPosition);
					let parent = this.getContainer();
					let paddingOffset = 0;
					while (parent = parent.parentElement) {
						const parentPaddingTop = parseFloat(BX.style(parent, 'padding-top'));
						const parentPaddingBottom = parseFloat(BX.style(parent, 'padding-bottom'));
						if (!isNaN(parentPaddingTop)) {
							paddingOffset += parentPaddingTop;
						}
						if (!isNaN(parentPaddingBottom)) {
							paddingOffset += parentPaddingBottom;
						}
					}
					if (diff > 0) {
						BX.style(this.getTable(), 'min-height', `${gridRect.height - diff - panelsHeight - paddingOffset}px`);
					} else if (Math.abs(diff) === scrollBottom) {
						// If the grid is hidden
						BX.style(this.getTable(), 'min-height', '');
					} else {
						BX.style(this.getTable(), 'min-height', `${gridRect.height + Math.abs(diff) - panelsHeight - paddingOffset}px`);
					}
					BX.Dom.addClass(this.getContainer(), 'main-grid-empty-stub');
					if (this.getCurrentPage() <= 1) {
						this.hidePanels();
					}
				} else {
					BX.style(this.getTable(), 'min-height', '');

					// Chrome hack for 0116845 bug. @todo refactoring
					BX.style(this.getTable(), 'height', '1px');
					requestAnimationFrame(() => {
						BX.style(this.getTable(), 'height', '1px');
					});
					this.showPanels();
					BX.Dom.removeClass(this.getContainer(), 'main-grid-empty-stub');
				}
			},
			reloadTable(method, data, callback, url) {
				let bodyRows;
				if (!BX.type.isNotEmptyString(method)) {
					method = 'GET';
				}
				if (!BX.type.isPlainObject(data)) {
					data = {};
				}
				const self = this;
				this.tableFade();
				if (!BX.type.isString(url)) {
					url = '';
				}
				this.getData().request(url, method, data, '', function () {
					BX.onCustomEvent(window, 'BX.Main.Grid:onBeforeReload', [self]);
					self.getRows().reset();
					bodyRows = this.getBodyRows();
					self.getUpdater().updateContainer(this.getContainer());
					self.getUpdater().updateHeadRows(this.getHeadRows());
					self.getUpdater().updateBodyRows(bodyRows);
					self.getUpdater().updateFootRows(this.getFootRows());
					self.getUpdater().updatePagination(this.getPagination());
					self.getUpdater().updateMoreButton(this.getMoreButton());
					self.getUpdater().updateCounterTotal(this.getCounterTotal());
					self.adjustEmptyTable(bodyRows);
					self.bindOnRowEvents();
					self.bindOnMoreButtonEvents();
					self.bindOnClickPaginationLinks();
					self.bindOnClickHeader();
					self.bindOnCheckAll();
					self.updateCounterDisplayed();
					self.updateCounterSelected();
					self.disableActionsPanel();
					self.disableForAllCounter();
					if (self.getParam('SHOW_ACTION_PANEL')) {
						self.getUpdater().updateGroupActions(this.getActionPanel());
					}
					if (self.getParam('ALLOW_COLUMNS_SORT')) {
						self.colsSortable.reinit();
					}
					if (self.getParam('ALLOW_ROWS_SORT')) {
						self.rowsSortable.reinit();
					}
					self.tableUnfade();
					BX.onCustomEvent(window, 'Grid::updated', [self]);
					if (BX.type.isFunction(callback)) {
						callback();
					}
					if (self.getParam('ALLOW_PIN_HEADER')) {
						self.getPinHeader()._onGridUpdate();
					}
				});
			},
			getGroupEditButton() {
				return BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classGroupEditButton'), true);
			},
			getGroupDeleteButton() {
				return BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classGroupDeleteButton'), true);
			},
			enableGroupActions() {
				const editButton = this.getGroupEditButton();
				const deleteButton = this.getGroupDeleteButton();
				if (BX.type.isDomNode(editButton)) {
					BX.removeClass(editButton, this.settings.get('classGroupActionsDisabled'));
				}
				if (BX.type.isDomNode(deleteButton)) {
					BX.removeClass(deleteButton, this.settings.get('classGroupActionsDisabled'));
				}
			},
			disableGroupActions() {
				const editButton = this.getGroupEditButton();
				const deleteButton = this.getGroupDeleteButton();
				if (BX.type.isDomNode(editButton)) {
					BX.addClass(editButton, this.settings.get('classGroupActionsDisabled'));
				}
				if (BX.type.isDomNode(deleteButton)) {
					BX.addClass(deleteButton, this.settings.get('classGroupActionsDisabled'));
				}
			},
			closeActionsMenu() {
				const rows = this.getRows().getRows();
				for (let i = 0, l = rows.length; i < l; i++) {
					rows[i].closeActionsMenu();
				}
			},
			getPageSize() {
				return this.pageSize;
			},
			/**
			 * @return {?BX.Grid.Fader}
			 */
			getFader() {
				return this.fader;
			},
			/**
			 * @return {BX.Grid.Data}
			 */
			getData() {
				this.data = this.data || new BX.Grid.Data(this);
				return this.data;
			},
			/**
			 * @return {BX.Grid.Updater}
			 */
			getUpdater() {
				this.updater = this.updater || new BX.Grid.Updater(this);
				return this.updater;
			},
			isSortableHeader(item) {
				return BX.hasClass(item, this.settings.get('classHeaderSortable'));
			},
			isNoSortableHeader(item) {
				return BX.hasClass(item, this.settings.get('classHeaderNoSortable'));
			},
			bindOnClickHeader() {
				const self = this;
				let cell;
				BX.bind(this.getContainer(), 'click', event => {
					cell = BX.findParent(event.target, {
						tag: 'th'
					}, true, false);
					if (cell && self.isSortableHeader(cell) && !self.preventSortableClick) {
						const onBeforeSortEvent = new BX.Event.BaseEvent({
							data: {
								grid: self,
								columnName: BX.data(cell, 'name')
							}
						});
						BX.Event.EventEmitter.emit('BX.Main.grid:onBeforeSort', onBeforeSortEvent);
						if (onBeforeSortEvent.isDefaultPrevented()) {
							return;
						}
						self.preventSortableClick = false;
						self._clickOnSortableHeader(cell, event);
					}
				});
			},
			enableEditMode() {
				this.isEditMode = true;
			},
			disableEditMode() {
				this.isEditMode = false;
			},
			isEditMode() {
				return this.isEditMode;
			},
			getColumnHeaderCellByName(name) {
				return BX.Grid.Utils.getBySelector(this.getContainer(), `#${this.getId()} th[data-name="${name}"]`, true);
			},
			getColumnByName(name) {
				const columns = this.getParam('DEFAULT_COLUMNS');
				return Boolean(name) && name in columns ? columns[name] : null;
			},
			/**
			 * @deprecated Unused since the column is addressed by its head cell rather than
			 * by a position corrected for the placeholders. Kept because the method is part
			 * of the public `BX.Grid.Grid` prototype and outside code may still call it.
			 *
			 * @param {number} index
			 * @returns {number}
			 */
			adjustIndex(index) {
				const fixedCells = this.getAllRows()[0].querySelectorAll('.main-grid-fixed-column').length;
				return index + fixedCells;
			},
			/**
			 * The class a service cell is marked with in every row, or null for a cell that
			 * carries a column of its own. A service cell is matched by this class rather
			 * than by its position: a row carries its own set of them, and a row with
			 * `draggable === false` has no drag cell while the head always does.
			 *
			 * @param {HTMLElement} cell
			 * @returns {string|null}
			 */
			getServiceCellClass(cell) {
				return ['main-grid-cell-drag', 'main-grid-cell-checkbox', 'main-grid-cell-action'].find(className => cell.classList.contains(className)) ?? null;
			},
			/**
			 * Cells of a row that carry a column of their own: the service cells are left
			 * out, and so are the placeholders standing in for the already pinned columns.
			 *
			 * @param {HTMLElement} row
			 * @returns {Array<HTMLElement>}
			 */
			getRowColumnCells(row) {
				return [].slice.call(row.children).filter(cell => {
					return this.getServiceCellClass(cell) === null && !cell.classList.contains('main-grid-fixed-column-placeholder');
				});
			},
			/**
			 * The cell of `row` standing for the same column as `headCell`. A service head
			 * cell is matched by its own class, a column head cell by its ordinal among the
			 * cells that carry a column - both counted the same way in every row, whatever
			 * service cells that row happens to carry.
			 *
			 * @param {HTMLElement} row
			 * @param {HTMLElement} headCell
			 * @returns {HTMLElement|undefined}
			 */
			getRowCellByHeadCell(row, headCell, columnIndex = null) {
				const serviceClass = this.getServiceCellClass(headCell);
				if (serviceClass !== null) {
					return [].slice.call(row.children).find(cell => {
						return cell.classList.contains(serviceClass) && !cell.classList.contains('main-grid-fixed-column-placeholder');
					});
				}
				const index = columnIndex === null ? this.getRowColumnCells(this.getAllRows()[0]).indexOf(headCell) : columnIndex;
				return index === -1 ? undefined : this.getRowColumnCells(row)[index];
			},
			/**
			 * Cells of the column the given head cell heads, one per row. The ordinal of the
			 * head cell is resolved once for the whole pass: `adjustFixedColumnsPosition()`
			 * runs on every mousemove of a column resize, so re-deriving it per row would
			 * put a full scan of the head row into the gesture.
			 *
			 * @param {HTMLElement} headCell
			 * @returns {Array<HTMLElement>}
			 */
			getColumnByHeadCell(headCell) {
				// A service head cell is matched by its class, so its ordinal is never read.
				const columnIndex = this.getServiceCellClass(headCell) === null ? this.getRowColumnCells(this.getAllRows()[0]).indexOf(headCell) : -1;
				return this.getAllRows().reduce((accumulator, row) => {
					if (!row.classList.contains('main-grid-row-custom') && !row.classList.contains('main-grid-row-empty')) {
						const cell = this.getRowCellByHeadCell(row, headCell, columnIndex);
						if (cell) {
							accumulator.push(cell);
						}
					}
					return accumulator;
				}, []);
			},
			getColumnByIndex(index) {
				const headCell = this.getAllRows()[0].children[index];
				return headCell ? this.getColumnByHeadCell(headCell) : [];
			},
			getAllRows() {
				const rows = [].slice.call(this.getTable().rows);
				const fixedTable = this.getContainer().parentElement.querySelector('.main-grid-fixed-bar table');
				if (fixedTable) {
					rows.push(fixedTable.rows[0]);
				}
				return rows;
			},
			hasEmptyRow() {
				return this.getAllRows().some(row => BX.hasClass(row, 'main-grid-row-empty'));
			},
			initStickedColumns() {
				if (this.hasEmptyRow()) {
					return;
				}
				if (this.areStickedColumnsInitialized()) {
					return;
				}
				this.resetStickedColumns();

				// Pin by the head cell itself: pinning inserts placeholders that shift the
				// cells, so an index captured before the pass would drift.
				[].slice.call(this.getAllRows()[0].children).forEach(function (cell) {
					if (cell.classList.contains('main-grid-sticked-column') && !cell.classList.contains('main-grid-sticked-column-right')) {
						this.stickyColumnByHeadCell(cell);
					}
				}, this);

				// Right-sticked columns accumulate from the right edge, so pin them
				// right-to-left. Resolve the live offset each iteration: pinning inserts
				// clones that shift the cells, so a pre-captured snapshot would drift.
				let rightOffset = this.getRightStickedColumnOffset();
				while (rightOffset !== -1) {
					this.stickyRightColumnByRightOffset(rightOffset);
					rightOffset = this.getRightStickedColumnOffset();
				}
				this.adjustSpecialEmptyColumnWidth();
				if (this.getParam('ALLOW_COLUMNS_RESIZE')) {
					this.getResize().destroy();
					this.getResize().init(this);
				}
			},
			areStickedColumnsInitialized() {
				const rows = this.getAllRows().filter(row => {
					return !row.classList.contains('main-grid-row-custom') && !row.classList.contains('main-grid-row-empty');
				});
				const headRow = rows[0];
				if (!headRow) {
					return true;
				}
				const headCells = [].slice.call(headRow.children);
				const hasPendingColumn = headCells.some(cell => {
					const isLeftPending = cell.classList.contains('main-grid-sticked-column') && !cell.classList.contains('main-grid-sticked-column-right') && !cell.classList.contains('main-grid-fixed-column');
					const isRightPending = cell.classList.contains('main-grid-sticked-column-right') && !cell.classList.contains('main-grid-fixed-column-right');
					return isLeftPending || isRightPending;
				});
				if (hasPendingColumn) {
					return false;
				}
				const fixedLeftCount = headCells.filter(cell => {
					return cell.classList.contains('main-grid-fixed-column');
				}).length;
				const fixedRightCount = headCells.filter(cell => {
					return cell.classList.contains('main-grid-fixed-column-right');
				}).length;
				if (fixedLeftCount === 0 && fixedRightCount === 0) {
					return true;
				}

				// Only the pinned cells are counted, not the cells of the whole row: rows
				// legitimately differ in their service cells, while a row reloaded from the
				// server arrives with no pinned cell at all and gives the mismatch away.
				return rows.every(row => {
					const cells = [].slice.call(row.children);
					const rowFixedLeftCount = cells.filter(cell => {
						return cell.classList.contains('main-grid-fixed-column');
					}).length;
					const rowFixedRightCount = cells.filter(cell => {
						return cell.classList.contains('main-grid-fixed-column-right');
					}).length;
					return rowFixedLeftCount === fixedLeftCount && rowFixedRightCount === fixedRightCount;
				});
			},
			resetStickedColumns() {
				this.getAllRows().forEach(row => {
					row.querySelectorAll('.main-grid-fixed-column-placeholder').forEach(placeholder => {
						BX.remove(placeholder);
					});
					[].slice.call(row.children).forEach(cell => {
						if (cell.classList.contains('main-grid-fixed-column')) {
							cell.classList.remove('main-grid-fixed-column');
							cell.style.removeProperty('left');
						}
						if (cell.classList.contains('main-grid-fixed-column-right')) {
							cell.classList.remove('main-grid-fixed-column-right');
							cell.style.removeProperty('right');
						}
					});
				});
			},
			setStickedColumns(columns) {
				if (BX.type.isArray(columns)) {
					const options = this.getUserOptions();
					const actions = [{
						action: options.getAction('GRID_SET_STICKED_COLUMNS'),
						stickedColumns: columns
					}];
					options.batch(actions, () => {
						this.reloadTable();
					});
				}
			},
			getStickedColumns() {
				const columns = [].slice.call(this.getHead().querySelectorAll('.main-grid-cell-head'));
				return columns.reduce((acc, column) => {
					if (BX.hasClass(column, 'main-grid-fixed-column') && !BX.hasClass(column, 'main-grid-cell-checkbox') && !BX.hasClass(column, 'main-grid-cell-action')) {
						acc.push(column.dataset.name);
					}
					return acc;
				}, []);
			},
			prepareFixedColumnPlaceholder(cell) {
				const clone = BX.clone(cell);
				clone.classList.add('main-grid-fixed-column-placeholder');
				clone.classList.remove('main-grid-sticked-column');
				clone.classList.remove('main-grid-sticked-column-right');
				BX.Grid.Utils.hideFromAssistiveTech(clone);

				// The placeholder is a copy of a live cell down to its ids, and unlike the pinned
				// head it is inert through and through: nothing inside it is reachable, so there is
				// nothing left for an id to address. They are dropped rather than renamed, which
				// would only litter the document with ids nothing points at.
				[clone, ...clone.querySelectorAll('[id]')].forEach(element => {
					element.removeAttribute('id');
				});

				// The placeholder has to reserve exactly the width of the cell it stands in
				// for. Without an upper bound the table stretches its column to fit the
				// cloned content, and the surplus becomes a gap after the sticked column.
				clone.style.maxWidth = clone.style.width;
				return clone;
			},
			/**
			 * Width the column is pinned at. Its own width comes first: a rendered width
			 * depends on how far the table had been laid out by the time the column got
			 * pinned, so a column with a width of its own would end up one size on a full
			 * page load and another one after the table is reloaded.
			 *
			 * @param {HTMLElement} headCell
			 * @returns {number}
			 */
			getStickedColumnWidth(headCell) {
				return parseInt(headCell.style.width, 10) || headCell.clientWidth;
			},
			/**
			 * `left` offset the column is pinned at, measured in the head row: the cell
			 * pinned before it in the head, plus that cell's width. Returns `null` when
			 * nothing is pinned before it yet - the column then keeps its own position.
			 *
			 * @param {HTMLElement} headCell
			 * @returns {?number}
			 */
			getStickedColumnLeft(headCell) {
				const lastStickyCell = this.getLastStickyCellFromRow(headCell.parentElement);
				if (!lastStickyCell) {
					return null;
				}
				let left = parseInt(BX.style(lastStickyCell, 'left'));
				let width = parseInt(BX.style(lastStickyCell, 'width'));
				left = isNaN(left) ? 0 : left;
				width = isNaN(width) ? 0 : width;
				return left + width;
			},
			stickyColumnByIndex(index) {
				this.stickyColumnByHeadCell(this.getAllRows()[0].children[index]);
			},
			stickyColumnByHeadCell(headCell) {
				const column = headCell ? this.getColumnByHeadCell(headCell) : [];
				if (column.length === 0) {
					return;
				}
				const cellWidth = this.getStickedColumnWidth(column[0]);
				const heights = column.map(cell => {
					return BX.height(cell);
				});

				// One offset for the whole column, measured in the head. Accumulating it
				// per row would shift the column in every row whose leading service cells
				// differ from the head - a row with `draggable === false` carries no drag
				// cell, so its offset would come up short by that cell's width.
				const columnLeft = this.getStickedColumnLeft(headCell);
				column.forEach(function (cell, cellIndex) {
					cell.style.minWidth = `${cellWidth}px`;
					cell.style.width = `${cellWidth}px`;
					cell.style.minHeight = `${heights[cellIndex]}px`;
					const clone = this.prepareFixedColumnPlaceholder(cell);
					if (columnLeft !== null) {
						cell.style.left = `${columnLeft}px`;
					}
					cell.classList.add('main-grid-fixed-column');
					cell.classList.add('main-grid-cell-static');
					clone.classList.add('main-grid-cell-static');
					if (this.getColsSortable()) {
						this.getColsSortable().unregister(cell);
						this.getColsSortable().unregister(clone);
					}
					BX.insertAfter(clone, cell);
				}, this);
				this.adjustFadePosition(this.getFadeOffset());
			},
			adjustFixedColumnsPosition() {
				const columnsPosition = [].slice.call(this.getAllRows()[0].children).reduce((accumulator, cell, index, columns) => {
					let cellLeft;
					let cellWidth;
					if (columns[index - 1] && columns[index - 1].classList.contains('main-grid-fixed-column')) {
						cellLeft = parseInt(BX.style(columns[index - 1], 'left'));
						cellWidth = parseInt(BX.style(columns[index - 1], 'width'));
						cellLeft = isNaN(cellLeft) ? 0 : cellLeft;
						cellWidth = isNaN(cellWidth) ? 0 : cellWidth;
						accumulator.push({
							index: index + 1,
							left: cellLeft + cellWidth
						});
					}
					return accumulator;
				}, []);
				columnsPosition.forEach(function (item) {
					const column = this.getColumnByIndex(item.index);
					column.forEach(cell => {
						if (item.index !== columnsPosition[columnsPosition.length - 1].index) {
							cell.style.left = `${item.left}px`;
						}
					});
				}, this);
				this.adjustFixedRightColumnsPosition();
				this.getAllRows().forEach(row => {
					const height = BX.height(row);
					const cells = [].slice.call(row.children);
					cells.forEach(cell => {
						cell.style.minHeight = `${height}px`;
					});
				});
				this.adjustSpecialEmptyColumnWidth();
			},
			/**
			 * `right` offsets of the right-fixed columns, laid out anew from their current
			 * widths: a column pinned to the right edge carries every column pinned to its
			 * left, so resizing it moves all of them.
			 */
			adjustFixedRightColumnsPosition() {
				const headCells = [].slice.call(this.getAllRows()[0].children);
				let offset = 0;
				for (let index = headCells.length - 1; index >= 0; index--) {
					if (!headCells[index].classList.contains('main-grid-fixed-column-right')) {
						continue;
					}
					this.getColumnCellsByRightOffset(headCells.length - 1 - index).forEach(cell => {
						cell.style.right = `${offset}px`;
					});
					offset += this.getStickedColumnWidth(headCells[index]);
				}
			},
			/**
			 * Every column a sticked cell leaves behind - the placeholder holding its place
			 * and the anonymous one the table wraps the absolute cell in - claims a share of
			 * the width no column asked for, and that share shows up as an empty gap right
			 * after the sticked column. Give the whole remainder to the trailing empty cell
			 * so there is nothing left to share.
			 */
			adjustSpecialEmptyColumnWidth() {
				const isSticked = cell => {
					return cell.classList.contains('main-grid-fixed-column') || cell.classList.contains('main-grid-fixed-column-right');
				};
				const headRow = this.getAllRows()[0];
				const hasStickedColumn = Boolean(headRow) && [].slice.call(headRow.children).some(isSticked);

				// A grid with nothing pinned has nothing to give away, so it must not pay for
				// a pass over its rows on every resize event. The flag keeps the pass for the
				// one call that has to take a previously given away width back.
				if (!hasStickedColumn && !this.specialEmptyColumnAdjusted) {
					return;
				}
				this.specialEmptyColumnAdjusted = hasStickedColumn;

				// Three passes over the rows - reset, measure, apply - so a write never lands
				// between two reads: interleaved, they would force a reflow per row.
				const targets = this.getAllRows().reduce((accumulator, row) => {
					const emptyCell = row.querySelector('.main-grid-special-empty');
					if (emptyCell) {
						emptyCell.style.removeProperty('width');
						emptyCell.style.removeProperty('min-width');
						accumulator.push({
							row,
							emptyCell
						});
					}
					return accumulator;
				}, []);
				targets.map(({
					row,
					emptyCell
				}) => {
					const cells = [].slice.call(row.children);
					if (!cells.some(isSticked)) {
						return null;
					}
					const declaredWidth = cells.reduce((width, cell) => {
						return cell === emptyCell || isSticked(cell) ? width : width + cell.offsetWidth;
					}, 0);
					return {
						emptyCell,
						rest: row.closest('table').clientWidth - declaredWidth
					};
				}).forEach(target => {
					if (!target || target.rest <= 0) {
						return;
					}

					// `important` to outweigh the `min-width: 0 !important` that keeps the
					// cell from claiming any width of its own
					target.emptyCell.style.setProperty('width', `${target.rest}px`, 'important');
					target.emptyCell.style.setProperty('min-width', `${target.rest}px`, 'important');
				});
			},
			getLastStickyCellFromRowByIndex(index) {
				return this.getLastStickyCellFromRow(this.getAllRows()[index]);
			},
			getLastStickyCellFromRow(row) {
				return [].slice.call(row.children).reduceRight((accumulator, cell) => {
					if (!accumulator && cell.classList.contains('main-grid-fixed-column')) {
						accumulator = cell;
					}
					return accumulator;
				}, null);
			},
			/**
			 * Cells (across all rows) of the column standing a given number of cells from
			 * the end of the row. Counted from the end, because the leading cells differ
			 * from row to row - a row with `draggable === false` carries no drag cell, an
			 * aggregate row prefixes a set of its own - while the trailing cell is always
			 * a single one, so an equal distance from the end means the same column.
			 *
			 * @param {number} offset
			 * @returns {Array<HTMLElement>}
			 */
			getColumnCellsByRightOffset(offset) {
				return this.getAllRows().reduce((accumulator, row) => {
					if (!row.classList.contains('main-grid-row-custom') && !row.classList.contains('main-grid-row-empty')) {
						const cell = row.children[row.children.length - 1 - offset];
						cell && accumulator.push(cell);
					}
					return accumulator;
				}, []);
			},
			/**
			 * Distance from the end of the head row to the rightmost right-sticked head
			 * cell that has not been pinned yet, or -1 when none is left.
			 *
			 * @returns {number}
			 */
			getRightStickedColumnOffset() {
				const cells = [].slice.call(this.getAllRows()[0].children);
				for (let index = cells.length - 1; index >= 0; index--) {
					if (cells[index].classList.contains('main-grid-sticked-column-right') && !cells[index].classList.contains('main-grid-fixed-column-right')) {
						return cells.length - 1 - index;
					}
				}
				return -1;
			},
			/**
			 * Where a right-fixed cell ends, counted from the right edge of the table.
			 * Read from the inline styles this code writes itself: a computed style read
			 * right after writing sizes would force a layout on every row.
			 *
			 * @param {HTMLElement} cell
			 * @returns {number}
			 */
			getStickedRightEdge(cell) {
				const right = parseInt(cell.style.right, 10);
				const width = parseInt(cell.style.width, 10);
				return (isNaN(right) ? 0 : right) + (isNaN(width) ? 0 : width);
			},
			stickyRightColumnByRightOffset(offset) {
				const column = this.getColumnCellsByRightOffset(offset);
				if (column.length === 0) {
					return;
				}
				const cellWidth = this.getStickedColumnWidth(column[0]);
				const heights = column.map(cell => {
					return BX.height(cell);
				});
				column.forEach(function (cell, cellIndex) {
					cell.style.minWidth = `${cellWidth}px`;
					cell.style.width = `${cellWidth}px`;
					cell.style.minHeight = `${heights[cellIndex]}px`;
					const clone = this.prepareFixedColumnPlaceholder(cell);
					const lastStickyCell = this.getLastStickyRightCellFromRow(cell.parentElement);
					cell.style.right = `${lastStickyCell ? this.getStickedRightEdge(lastStickyCell) : 0}px`;
					cell.classList.add('main-grid-fixed-column-right');
					cell.classList.add('main-grid-cell-static');
					clone.classList.add('main-grid-cell-static');
					if (this.getColsSortable()) {
						this.getColsSortable().unregister(cell);
						this.getColsSortable().unregister(clone);
					}
					BX.insertAfter(clone, cell);
				}, this);
				this.adjustFadePosition(this.getFadeOffset());
			},
			getLastStickyRightCellFromRow(row) {
				return [].slice.call(row.children).reduce((accumulator, cell) => {
					if (!accumulator && cell.classList.contains('main-grid-fixed-column-right')) {
						accumulator = cell;
					}
					return accumulator;
				}, null);
			},
			getFadeOffset() {
				let fadeOffset = 0;
				const lastStickyCell = this.getLastStickyCellFromRowByIndex(0);
				if (lastStickyCell) {
					let lastStickyCellLeft = parseInt(BX.style(lastStickyCell, 'left'));
					let lastStickyCellWidth = lastStickyCell.offsetWidth;
					lastStickyCellLeft = isNaN(lastStickyCellLeft) ? 0 : lastStickyCellLeft;
					lastStickyCellWidth = isNaN(lastStickyCellWidth) ? 0 : lastStickyCellWidth;
					fadeOffset = lastStickyCellLeft + lastStickyCellWidth;
				}
				return fadeOffset;
			},
			getFadeOffsetRight() {
				let fadeOffset = 0;
				const cells = [].slice.call(this.getAllRows()[0].children).filter(cell => cell.classList.contains('main-grid-fixed-column-right'));
				cells.forEach(cell => {
					fadeOffset += cell.offsetWidth;
				});
				return fadeOffset;
			},
			adjustFadePosition(offset) {
				const fader = this.getFader();
				const earLeft = fader.getEarLeft();
				const shadowLeft = fader.getShadowLeft();
				earLeft.style.left = `${offset}px`;
				shadowLeft.style.left = `${offset}px`;

				// Only reposition the right fade/ear when a right-sticked column exists;
				// otherwise leave the native right shadow/ear at their default position.
				const rightOffset = this.getFadeOffsetRight();
				const earRight = fader.getEarRight();
				const shadowRight = fader.getShadowRight();
				if (rightOffset > 0) {
					if (earRight) {
						earRight.style.right = `${rightOffset}px`;
					}
					if (shadowRight) {
						shadowRight.style.right = `${rightOffset}px`;
						// Switch to the clipped mirror of the left shadow, so the pinned
						// column shows a clean linear shadow instead of the default ellipse.
						shadowRight.classList.add('--sticked');
					}
				} else {
					// A reload can replace the columns, so the offset of the previous pinned
					// column must not stay on the ear and the shadow.
					if (earRight) {
						earRight.style.right = '';
					}
					if (shadowRight) {
						shadowRight.style.right = '';
						shadowRight.classList.remove('--sticked');
					}
				}
			},
			/**
			 * @param {string|object} column
			 */
			sortByColumn(column) {
				let headerCell = null;
				let header = null;
				if (BX.type.isPlainObject(column)) {
					header = column;
					header.sort_url = this.prepareSortUrl(column);
				} else {
					headerCell = this.getColumnHeaderCellByName(column);
					header = this.getColumnByName(column);
				}
				if (header && (Boolean(headerCell) && !BX.hasClass(headerCell, this.settings.get('classLoad')) || !headerCell)) {
					Boolean(headerCell) && BX.addClass(headerCell, this.settings.get('classLoad'));
					this.tableFade();
					const self = this;

					// The head is replaced wholesale below, and with it the button the sort was
					// started from: the focus would land on the body and the keyboard user would
					// start the walk over. The column is remembered here and the focus put back on
					// its new button once the head is rendered again.
					const sortedColumn = BX.Type.isDomNode(headerCell) ? headerCell.dataset.name : null;
					this.getUserOptions().setSort(header.sort_by, header.sort_order, () => {
						self.getData().request(header.sort_url, null, null, 'sort', function () {
							self.rows = null;
							self.getUpdater().updateHeadRows(this.getHeadRows());
							self.getUpdater().updateBodyRows(this.getBodyRows());
							self.getUpdater().updatePagination(this.getPagination());
							self.getUpdater().updateMoreButton(this.getMoreButton());
							self.bindOnRowEvents();
							self.bindOnMoreButtonEvents();
							self.bindOnClickPaginationLinks();
							self.bindOnCheckAll();
							self.updateCounterDisplayed();
							self.updateCounterSelected();
							self.disableActionsPanel();
							self.disableForAllCounter();
							if (self.getParam('SHOW_ACTION_PANEL')) {
								self.getActionsPanel().resetForAllCheckbox();
							}
							if (self.getParam('ALLOW_ROWS_SORT')) {
								self.rowsSortable.reinit();
							}
							if (self.getParam('ALLOW_COLUMNS_SORT')) {
								self.colsSortable.reinit();
							}
							BX.onCustomEvent(window, 'BX.Main.grid:sort', [header, self]);
							BX.onCustomEvent(window, 'Grid::updated', [self]);
							self.tableUnfade();
							self.restoreSortFocus(sortedColumn);
						});
					});
				}
			},
			prepareSortUrl(header) {
				let url = window.location.toString();
				if ('sort_by' in header) {
					url = BX.util.add_url_param(url, {
						by: header.sort_by
					});
				}
				if ('sort_order' in header) {
					url = BX.util.add_url_param(url, {
						order: header.sort_order
					});
				}
				return url;
			},
			_clickOnSortableHeader(header, event) {
				event.preventDefault();
				this.sortByColumn(BX.data(header, 'name'));
			},
			getObserver() {
				return BX.Grid.observer;
			},
			initRowsDragAndDrop() {
				this.rowsSortable = new BX.Grid.RowsSortable(this);
			},
			initColsDragAndDrop() {
				this.colsSortable = new BX.Grid.ColsSortable(this);
			},
			/**
			 * @return {BX.Grid.RowsSortable}
			 */
			getRowsSortable() {
				return this.rowsSortable;
			},
			/**
			 * @return {BX.Grid.ColsSortable}
			 */
			getColsSortable() {
				return this.colsSortable;
			},
			getUserOptionsHandlerUrl() {
				return this.userOptionsHandlerUrl || '';
			},
			/**
			 * @return {BX.Grid.UserOptions}
			 */
			getUserOptions() {
				return this.userOptions;
			},
			getCheckAllCheckboxes() {
				const checkAllNodes = BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classCheckAllCheckboxes'));
				return checkAllNodes.map(current => {
					return new BX.Grid.Element(current);
				});
			},
			selectAllCheckAllCheckboxes() {
				this.getCheckAllCheckboxes().forEach(current => {
					current.getNode().checked = true;
				});
			},
			unselectAllCheckAllCheckboxes() {
				this.getCheckAllCheckboxes().forEach(current => {
					current.getNode().checked = false;
				});
			},
			adjustCheckAllCheckboxes() {
				const total = this.getRows().getBodyChild().filter(row => {
					return row.isShown() && Boolean(row.getCheckbox());
				}).length;
				const selected = this.getRows().getSelected().filter(row => {
					return row.isShown();
				}).length;
				if (total > 0 && selected > 0 && total === selected) {
					this.selectAllCheckAllCheckboxes();
				} else {
					this.unselectAllCheckAllCheckboxes();
				}
				if (selected > 0 && selected < total) {
					this.indeterminateCheckAllCheckboxes();
				} else {
					this.determinateCheckAllCheckboxes();
				}
			},
			bindOnCheckAll() {
				const self = this;
				this.getCheckAllCheckboxes().forEach(current => {
					current.getObserver().add(current.getNode(), 'change', self._clickOnCheckAll, self);
				});
			},
			_clickOnCheckAll(event) {
				event.preventDefault();
				this.toggleSelectionAll();
				this.determinateCheckAllCheckboxes();
			},
			toggleSelectionAll() {
				if (!this.getRows().isAllSelected() && (this.lastRowAction === 'select' || !this.lastRowAction || !this.getRows().isSelected())) {
					this.getRows().selectAll();
					this.selectAllCheckAllCheckboxes();
					this.enableActionsPanel();
					BX.onCustomEvent(window, 'Grid::allRowsSelected', [this]);
				} else {
					this.getRows().unselectAll();
					this.unselectAllCheckAllCheckboxes();
					this.disableActionsPanel();
					BX.onCustomEvent(window, 'Grid::allRowsUnselected', [this]);
				}
				delete this.lastRowAction;
				this.updateCounterSelected();
			},
			bindOnClickPaginationLinks() {
				const self = this;
				this.getPagination().getLinks().forEach(current => {
					current.getObserver().add(current.getNode(), 'click', self._clickOnPaginationLink, self);
				});
			},
			bindOnMoreButtonEvents() {
				const self = this;
				this.getMoreButton().getObserver().add(this.getMoreButton().getNode(), 'click', self._clickOnMoreButton, self);
			},
			bindOnRowEvents() {
				const observer = this.getObserver();
				const showCheckboxes = this.getParam('SHOW_ROW_CHECKBOXES');
				const enableCollapsibleRows = this.getParam('ENABLE_COLLAPSIBLE_ROWS');
				this.getRows().getBodyChild().forEach(function (current) {
					showCheckboxes && observer.add(current.getNode(), 'click', this._onClickOnRow, this);
					// Selection rides on a click on the row, and the checkbox itself is excluded from it
					// by nodeName. The mouse never lands on the input — pointer-events: none sends the
					// click to the cell — but Space does, and the row would stay unselected under a
					// ticked box. change arrives from both, so the keyboard gets its own way in.
					showCheckboxes && current.getCheckbox() && observer.add(current.getCheckbox(), 'change', this._onRowCheckboxChange, this);
					showCheckboxes && current.getCheckbox() && observer.add(current.getCheckbox(), 'keydown', this._onRowCheckboxKeyDown, this);
					current.getDefaultAction() && observer.add(current.getNode(), 'dblclick', this._onRowDblclick, this);
					current.getActionsButton() && observer.add(current.getActionsButton(), 'click', this._clickOnRowActionsButton, this);
					enableCollapsibleRows && current.getCollapseButton() && observer.add(current.getCollapseButton(), 'click', this._onCollapseButtonClick, this);
					observer.add(current.getNode(), 'mouseover', this._onCellMouseOver, this);
				}, this);
			},
			/**
			 * Takes the keyboard from a row checkbox straight to the group actions. The panel sits
			 * after the table, so a user who ticked a row in the middle of a long list had to walk
			 * out through every row below it — the link before the table only helps while the focus
			 * is still above them.
			 *
			 * Alt+ArrowDown reads as «down, to the panel» and is free here: Shift already carries the
			 * range selection of rows. The combo is announced on the checkbox itself through
			 * `aria-keyshortcuts`, so a screen reader names it when the control takes the focus.
			 */
			_onRowCheckboxKeyDown(event) {
				if (!event.altKey || event.key !== 'ArrowDown') {
					return;
				}
				if (!this.getParam('SHOW_ACTION_PANEL')) {
					return;
				}
				const panel = this.getActionsPanel()?.getPanel();

				// Nothing to jump to while the panel sleeps: it wakes up with the first selected row.
				if (!BX.Type.isDomNode(panel) || BX.hasClass(panel, this.settings.get('classDisable'))) {
					return;
				}
				event.preventDefault();
				const control = panel.querySelector('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
				if (BX.Type.isDomNode(control)) {
					control.focus();
					return;
				}
				panel.focus();
			},
			/**
			 * Brings the row model in line with the checkbox the browser has already toggled. Idempotent
			 * on purpose: a mouse click selects the row through _onClickOnRow and change follows right
			 * after, so the handler must recognise the state it already has and do nothing.
			 *
			 * The comparison runs against the class of the row, not against isSelected(): that one reads
			 * the checkbox first, and by the time change arrives the browser has already ticked it —
			 * every state would look like a match and the handler would never do anything at all.
			 */
			_onRowCheckboxChange(event) {
				const row = this.getRows().get(event.target);
				if (!row || !row.getCheckbox()) {
					return;
				}
				const checked = event.target.checked;
				const selectedByRow = BX.hasClass(row.getNode(), this.settings.get('classCheckedRow'));
				if (checked === selectedByRow) {
					return;
				}
				if (checked) {
					this.lastRowAction = 'select';
					row.select();
					BX.onCustomEvent(window, 'Grid::selectRow', [row, this]);
				} else {
					this.lastRowAction = 'unselect';
					row.unselect();
					BX.onCustomEvent(window, 'Grid::unselectRow', [row, this]);
				}
				this.updateCounterSelected();
				this.adjustRows();
				this.adjustCheckAllCheckboxes();
			},
			/**
			 * A body cell clips its content at its own edge, and whether the text reaches past it
			 * changes with every column resize, so the title is read off the layout under the
			 * pointer. Decoration drawn in the container margins stays inside the cell and does
			 * not call for a title. A ROW_LAYOUT cell has no inner wrapper and clips at the edge
			 * of the content container itself.
			 */
			_onCellMouseOver(event) {
				const container = event.target?.closest?.(`.${this.settings.get('classCellContainer')}`);
				if (!container || !this.getTable()?.contains(container)) {
					return;
				}
				const clip = container.closest('.main-grid-cell-inner') ?? container;
				const cell = clip.parentElement;
				if (!cell || cell.tagName !== 'TD' || BX.Dom.hasClass(cell.parentElement, 'main-grid-row-custom')) {
					return;
				}
				if (clip.scrollWidth <= clip.clientWidth + 1) {
					cell.removeAttribute('title');
					return;
				}
				const text = (container.innerText || '').trim();
				if (text !== '' && cell.getAttribute('title') !== text) {
					cell.setAttribute('title', text);
				}
			},
			_onCollapseButtonClick(event) {
				event.preventDefault();
				event.stopPropagation();
				const row = this.getRows().get(event.currentTarget);
				row.toggleChildRows();
				event.currentTarget.setAttribute('aria-expanded', row.isExpand() ? 'true' : 'false');
				if (row.isCustom()) {
					this.getUserOptions().setCollapsedGroups(this.getRows().getIdsCollapsedGroups());
				} else {
					this.getUserOptions().setExpandedRows(this.getRows().getIdsExpandedRows());
				}
				BX.fireEvent(document.body, 'click');
			},
			_clickOnRowActionsButton(event) {
				const row = this.getRows().get(event.target);
				event.preventDefault();
				if (row.actionsMenuIsShown()) {
					row.closeActionsMenu();
				} else {
					row.showActionsMenu();
				}
			},
			_onRowDblclick(event) {
				event.preventDefault();
				const row = this.getRows().get(event.target);
				let defaultJs = '';
				if (!row.isEdit()) {
					clearTimeout(this.clickTimer);
					this.clickPrevent = true;
					try {
						defaultJs = row.getDefaultAction();
						eval(defaultJs);
					} catch (err) {
						console.warn(err);
					}
				}
			},
			_onClickOnRow(event) {
				const clickDelay = 50;
				const selection = window.getSelection();
				if (event.target.nodeName === 'LABEL') {
					event.preventDefault();
				}
				if (event.shiftKey || selection.toString().length === 0) {
					if (event.shiftKey) {
						selection.removeAllRanges();
					}
					this.clickTimer = setTimeout(BX.delegate(function () {
						if (!this.clickPrevent) {
							clickActions.apply(this, [event]);
						}
						this.clickPrevent = false;
					}, this), clickDelay);
				}
				function clickActions(event) {
					let rows;
					let row;
					let containsNotSelected;
					let min;
					let max;
					let contentContainer;
					let isPrevent = true;

					// The row actions button used to be an <a>, excluded by the nodeName check below.
					const isRowActionsButton = Boolean(event.target.closest && event.target.closest(`.${this.settings.get('classRowActionButton')}`));
					if (event.target.nodeName !== 'A' && event.target.nodeName !== 'INPUT' && !isRowActionsButton) {
						row = this.getRows().get(event.target);
						if (row) {
							contentContainer = row.getContentContainer(event.target);
							if (BX.type.isDomNode(contentContainer) && event.target.nodeName !== 'TD' && event.target !== contentContainer) {
								isPrevent = BX.data(contentContainer, 'prevent-default') === 'true';
							}
							if (isPrevent) {
								if (row.getCheckbox()) {
									rows = [];
									this.currentIndex = 0;
									this.getRows().getRows().forEach(function (currentRow, index) {
										if (currentRow === row) {
											this.currentIndex = index;
										}
									}, this);
									this.lastIndex = this.lastIndex || this.currentIndex;
									if (event.shiftKey) {
										min = Math.min(this.currentIndex, this.lastIndex);
										max = Math.max(this.currentIndex, this.lastIndex);
										while (min <= max) {
											rows.push(this.getRows().getRows()[min]);
											min++;
										}
										containsNotSelected = rows.some(current => {
											return !current.isSelected();
										});
										if (containsNotSelected) {
											rows.forEach(current => {
												current.select();
											});
											this.lastRowAction = 'select';
											BX.onCustomEvent(window, 'Grid::selectRows', [rows, this]);
										} else {
											rows.forEach(current => {
												current.unselect();
											});
											this.lastRowAction = 'unselect';
											BX.onCustomEvent(window, 'Grid::unselectRows', [rows, this]);
										}
									} else if (row.isSelected()) {
										this.lastRowAction = 'unselect';
										row.unselect();
										BX.onCustomEvent(window, 'Grid::unselectRow', [row, this]);
									} else {
										this.lastRowAction = 'select';
										row.select();
										BX.onCustomEvent(window, 'Grid::selectRow', [row, this]);
									}
									this.updateCounterSelected();
									this.lastIndex = this.currentIndex;
								}
								this.adjustRows();
								this.adjustCheckAllCheckboxes();
							}
						}
					}
				}
			},
			adjustRows() {
				if (this.getRows().isSelected()) {
					BX.onCustomEvent(window, 'Grid::thereSelectedRows', [this]);
					this.enableActionsPanel();
				} else {
					BX.onCustomEvent(window, 'Grid::noSelectedRows', []);
					this.disableActionsPanel();
				}
			},
			getPagination() {
				return new BX.Grid.Pagination(this);
			},
			getState() {
				return window.history.state;
			},
			tableFade() {
				BX.addClass(this.getTable(), this.settings.get('classTableFade'));
				this.getLoader().show();
				BX.onCustomEvent('Grid::disabled', [this]);
			},
			tableUnfade() {
				BX.removeClass(this.getTable(), this.settings.get('classTableFade'));
				this.getLoader().hide();
				BX.onCustomEvent('Grid::enabled', [this]);
			},
			_clickOnPaginationLink(event) {
				event.preventDefault();
				const self = this;
				const link = this.getPagination().getLink(event.target);
				if (!link.isLoad()) {
					this.getUserOptions().resetExpandedRows();
					link.load();
					this.tableFade();
					this.getData().request(link.getLink(), null, null, 'pagination', function () {
						self.rows = null;
						self.getUpdater().updateBodyRows(this.getBodyRows());
						self.getUpdater().updateHeadRows(this.getHeadRows());
						self.getUpdater().updateMoreButton(this.getMoreButton());
						self.getUpdater().updatePagination(this.getPagination());
						self.bindOnRowEvents();
						self.bindOnMoreButtonEvents();
						self.bindOnClickPaginationLinks();
						self.bindOnCheckAll();
						self.updateCounterDisplayed();
						self.updateCounterSelected();
						self.disableActionsPanel();
						self.disableForAllCounter();
						if (self.getParam('SHOW_ACTION_PANEL')) {
							self.getActionsPanel().resetForAllCheckbox();
						}
						if (self.getParam('ALLOW_ROWS_SORT')) {
							self.rowsSortable.reinit();
						}
						if (self.getParam('ALLOW_COLUMNS_SORT')) {
							self.colsSortable.reinit();
						}
						link.unload();
						self.tableUnfade();
						BX.onCustomEvent(window, 'Grid::updated', [self]);
					});
				}
			},
			/**
			 * Only the result of a load is announced: at the moment of the click the numbers are not
			 * known yet, and a pair of "loading" and "loaded" sounds intrusive on a fast answer.
			 * @param {number} countBefore
			 */
			announceLoadedRows(countBefore) {
				const countDisplayed = this.getRows().getCountDisplayed();
				const loaded = countDisplayed - countBefore;
				if (loaded <= 0) {
					return;
				}
				this.announce('interface_grid_rows_loaded_announce', {
					'#COUNT#': loaded,
					'#TOTAL#': countDisplayed
				});
			},
			/**
			 * The refreshed list speaks once: a changed selection is the more specific fact and it has
			 * already been announced by the counter, so the general phrase would only pad the queue.
			 */
			announceUpdated(isCountSelectedAnnounced = false) {
				if (isCountSelectedAnnounced) {
					return;
				}
				this.announce('interface_grid_updated_announce');
			},
			_clickOnMoreButton(event) {
				event.preventDefault();
				const self = this;
				const moreButton = this.getMoreButton();
				const countBefore = this.getRows().getCountDisplayed();
				moreButton.load();
				this.getData().request(moreButton.getLink(), null, null, 'more', function () {
					self.getUpdater().appendBodyRows(this.getBodyRows());
					self.getUpdater().updateMoreButton(this.getMoreButton());
					self.getUpdater().updatePagination(this.getPagination());
					self.getRows().reset();
					self.bindOnRowEvents();
					self.bindOnMoreButtonEvents();
					self.bindOnClickPaginationLinks();
					self.bindOnCheckAll();
					self.updateCounterDisplayed();
					self.updateCounterSelected();
					self.announceLoadedRows(countBefore);
					if (self.getParam('ALLOW_PIN_HEADER')) {
						self.getPinHeader()._onGridUpdate();
					}
					if (self.getParam('ALLOW_ROWS_SORT')) {
						self.rowsSortable.reinit();
					}
					if (self.getParam('ALLOW_COLUMNS_SORT')) {
						self.colsSortable.reinit();
					}
					self.unselectAllCheckAllCheckboxes();
					BX.onCustomEvent(window, 'Grid::updated', [self]);
				});
			},
			getAjaxId() {
				return BX.data(this.getContainer(), this.settings.get('ajaxIdDataProp'));
			},
			update(data, action) {
				let newRows;
				let newHeadRows;
				let newNavPanel;
				let thisBody;
				let thisHead;
				let thisNavPanel;
				if (!BX.type.isNotEmptyString(data)) {
					return;
				}
				thisBody = BX.Grid.Utils.getByTag(this.getTable(), 'tbody', true);
				thisHead = BX.Grid.Utils.getByTag(this.getTable(), 'thead', true);
				thisNavPanel = BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classNavPanel'), true);
				data = BX.create('div', {
					html: data
				});
				newHeadRows = BX.Grid.Utils.getByClass(data, this.settings.get('classHeadRow'));
				newRows = BX.Grid.Utils.getByClass(data, this.settings.get('classDataRows'));
				newNavPanel = BX.Grid.Utils.getByClass(data, this.settings.get('classNavPanel'), true);
				if (action === this.settings.get('updateActionMore')) {
					this.getRows().addRows(newRows);
					this.unselectAllCheckAllCheckboxes();
				}
				if (action === this.settings.get('updateActionPagination')) {
					BX.cleanNode(thisBody);
					this.getRows().addRows(newRows);
					this.unselectAllCheckAllCheckboxes();
				}
				if (action === this.settings.get('updateActionSort')) {
					BX.cleanNode(thisHead);
					BX.cleanNode(thisBody);
					thisHead.appendChild(newHeadRows[0]);
					this.getRows().addRows(newRows);
				}
				thisNavPanel.innerHTML = newNavPanel.innerHTML;
				this.bindOnRowEvents();
				this.bindOnMoreButtonEvents();
				this.bindOnClickPaginationLinks();
				this.bindOnClickHeader();
				this.bindOnCheckAll();
				this.updateCounterDisplayed();
				this.updateCounterSelected();
				this.sortable.reinit();
			},
			getCounterDisplayed() {
				return BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classCounterDisplayed'));
			},
			getCounterSelected() {
				return BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classCounterSelected'));
			},
			updateCounterDisplayed() {
				const counterDisplayed = this.getCounterDisplayed();
				let rows;
				if (BX.type.isArray(counterDisplayed)) {
					rows = this.getRows();
					counterDisplayed.forEach(current => {
						if (BX.type.isDomNode(current)) {
							current.innerText = rows.getCountDisplayed();
						}
					});
				}
			},
			updateCounterSelected() {
				const counterSelected = this.getCounterSelected();
				let rows;
				if (BX.type.isArray(counterSelected)) {
					rows = this.getRows();
					counterSelected.forEach(current => {
						if (BX.type.isDomNode(current)) {
							current.innerText = rows.getCountSelected();
						}
					});
				}
				return this.announceCountSelected();
			},
			/**
			 * The counter is rewritten on every redraw, so only a changed number is worth a word.
			 * @private
			 * @returns {boolean} whether the change was announced
			 */
			announceCountSelected() {
				const rows = this.getRows();
				const selected = rows.getCountSelected();
				if (selected === this.announcedCountSelected) {
					return false;
				}
				const isFirstRender = this.announcedCountSelected === undefined;
				this.announcedCountSelected = selected;
				if (isFirstRender && selected === 0) {
					return false;
				}
				this.announce('interface_grid_selected_announce', {
					'#SELECTED#': selected,
					'#TOTAL#': rows.getCountDisplayed()
				});
				return true;
			},
			getContainerId() {
				return this.containerId;
			},
			getId() {
				// ID is equals to container Id
				return this.containerId;
			},
			getContainer() {
				return BX(this.getContainerId());
			},
			getCounter() {
				if (!this.counter) {
					this.counter = BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classCounter'));
				}
				return this.counter;
			},
			enableForAllCounter() {
				const counter = this.getCounter();
				if (BX.type.isArray(counter)) {
					counter.forEach(function (current) {
						BX.addClass(current, this.settings.get('classForAllCounterEnabled'));
					}, this);
				}
			},
			disableForAllCounter() {
				const counter = this.getCounter();
				if (BX.type.isArray(counter)) {
					counter.forEach(function (current) {
						BX.removeClass(current, this.settings.get('classForAllCounterEnabled'));
					}, this);
				}
			},
			getScrollContainer() {
				if (!this.scrollContainer) {
					this.scrollContainer = BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classScrollContainer'), true);
				}
				return this.scrollContainer;
			},
			getWrapper() {
				if (!this.wrapper) {
					this.wrapper = BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classWrapper'), true);
				}
				return this.wrapper;
			},
			getFadeContainer() {
				if (!this.fadeContainer) {
					this.fadeContainer = BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classFadeContainer'), true);
				}
				return this.fadeContainer;
			},
			getTable() {
				return BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classTable'), true);
			},
			getHeaders() {
				return BX.Grid.Utils.getBySelector(this.getWrapper(), `.main-grid-header[data-relative="${this.getContainerId()}"]`);
			},
			getHead() {
				return BX.Grid.Utils.getByTag(this.getContainer(), 'thead', true);
			},
			getBody() {
				return BX.Grid.Utils.getByTag(this.getContainer(), 'tbody', true);
			},
			getFoot() {
				return BX.Grid.Utils.getByTag(this.getContainer(), 'tfoot', true);
			},
			/**
			 * @return {BX.Grid.Rows}
			 */
			getRows() {
				if (!(this.rows instanceof BX.Grid.Rows)) {
					this.rows = new BX.Grid.Rows(this);
				}
				return this.rows;
			},
			getMoreButton() {
				const node = BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classMoreButton'), true);
				return new BX.Grid.Element(node, this);
			},
			/**
			 * Gets loader instance
			 * @return {BX.Grid.Loader}
			 */
			getLoader() {
				if (!(this.loader instanceof BX.Grid.Loader)) {
					this.loader = new BX.Grid.Loader(this);
				}
				return this.loader;
			},
			blockSorting() {
				const headerCells = BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classHeadCell'));
				headerCells.forEach(function (header) {
					if (this.isSortableHeader(header)) {
						BX.removeClass(header, this.settings.get('classHeaderSortable'));
						BX.addClass(header, this.settings.get('classHeaderNoSortable'));
						this.setSortButtonDisabled(header, true);
					}
				}, this);
			},
			/**
			 * Puts the focus back on the sort button of a column whose head has just been re-rendered.
			 * Sorting replaces the whole head, so the button the user pressed is gone by now and the
			 * focus with it — without this the keyboard walk would start again from the top of the page
			 * on every sort.
			 *
			 * Only a keyboard sort is restored. After a click the focus belongs wherever the pointer
			 * left it, and pulling it into the table would move the page under the user's hand;
			 * `ui.a11y` keeps the modality on the root element, the same one the focus ring reads.
			 *
			 * @param {string|null} columnName
			 */
			restoreSortFocus(columnName) {
				if (!BX.Type.isStringFilled(columnName)) {
					return;
				}
				if (document.documentElement.dataset.inputModality === 'pointer') {
					return;
				}
				const active = document.activeElement;

				// The old button is detached by now, so a focus that was on it leaves the body as the
				// active element; anything still focused is a control the user moved to meanwhile.
				if (active && active !== document.body && this.getContainer()?.contains(active)) {
					return;
				}
				const header = BX.Grid.Utils.getBySelector(this.getHead(), `.main-grid-cell-head[data-name="${columnName}"]`, true);
				if (!BX.Type.isDomNode(header)) {
					return;
				}
				const button = BX.Grid.Utils.getBySelector(header, '.main-grid-head-sort-button', true);
				BX.Type.isDomNode(button) && button.focus();
			},
			/**
			 * The classes only grey the header out; the button inside it stays focusable and clickable
			 * unless it is disabled too, so the keyboard would still reach a sort the mouse cannot.
			 * @param {Element} header
			 * @param {boolean} disabled
			 */
			setSortButtonDisabled(header, disabled) {
				const button = BX.Grid.Utils.getBySelector(header, '.main-grid-head-sort-button', true);
				if (BX.Type.isDomNode(button)) {
					button.disabled = disabled;
				}
			},
			unblockSorting() {
				const headerCells = BX.Grid.Utils.getByClass(this.getContainer(), this.settings.get('classHeadCell'));
				headerCells.forEach(function (header) {
					if (this.isNoSortableHeader(header) && header.dataset.sortBy) {
						BX.addClass(header, this.settings.get('classHeaderSortable'));
						BX.removeClass(header, this.settings.get('classHeaderNoSortable'));
						this.setSortButtonDisabled(header, false);
					}
				}, this);
			},
			confirmDialog(action, then, cancel) {
				let dialog;
				let popupContainer;
				let applyButton;
				let cancelButton;
				if ('CONFIRM' in action && action.CONFIRM) {
					action.CONFIRM_MESSAGE = action.CONFIRM_MESSAGE || this.arParams.CONFIRM_MESSAGE;
					action.CONFIRM_APPLY_BUTTON = action.CONFIRM_APPLY_BUTTON || this.arParams.CONFIRM_APPLY;
					action.CONFIRM_CANCEL_BUTTON = action.CONFIRM_CANCEL_BUTTON || this.arParams.CONFIRM_CANCEL;
					dialog = new BX.PopupWindow(`${this.getContainerId()}-confirm-dialog`, null, {
						content: `<div class="main-grid-confirm-content">${action.CONFIRM_MESSAGE}</div>`,
						titleBar: 'CONFIRM_TITLE' in action ? action.CONFIRM_TITLE : '',
						autoHide: false,
						zIndex: 9999,
						overlay: 0.4,
						offsetTop: -100,
						closeIcon: false,
						closeByEsc: true,
						events: {
							onClose() {
								BX.unbind(window, 'keydown', hotKey);
								dialog.destroy();
							}
						},
						buttons: [new BX.PopupWindowButton({
							text: action.CONFIRM_APPLY_BUTTON,
							id: `${this.getContainerId()}-confirm-dialog-apply-button`,
							events: {
								click() {
									BX.type.isFunction(then) ? then() : null;
									this.popupWindow.close();
									this.popupWindow.destroy();
									BX.onCustomEvent(window, 'Grid::confirmDialogApply', [this]);
									BX.unbind(window, 'keydown', hotKey);
								}
							}
						}), new BX.PopupWindowButtonLink({
							text: action.CONFIRM_CANCEL_BUTTON,
							id: `${this.getContainerId()}-confirm-dialog-cancel-button`,
							events: {
								click() {
									BX.type.isFunction(cancel) ? cancel() : null;
									this.popupWindow.close();
									this.popupWindow.destroy();
									BX.onCustomEvent(window, 'Grid::confirmDialogCancel', [this]);
									BX.unbind(window, 'keydown', hotKey);
								}
							}
						})]
					});
					if (!dialog.isShown()) {
						dialog.show();
						popupContainer = dialog.popupContainer;
						BX.removeClass(popupContainer, this.settings.get('classCloseAnimation'));
						BX.addClass(popupContainer, this.settings.get('classShowAnimation'));
						applyButton = BX(`${this.getContainerId()}-confirm-dialog-apply-button`);
						cancelButton = BX(`${this.getContainerId()}-confirm-dialog-cancel-button`);
						BX.bind(window, 'keydown', hotKey);
					}
				} else {
					BX.type.isFunction(then) ? then() : null;
				}
				function hotKey(event) {
					if (event.code === 'Enter') {
						event.preventDefault();
						event.stopPropagation();
						BX.fireEvent(applyButton, 'click');
					}
					if (event.code === 'Escape') {
						event.preventDefault();
						event.stopPropagation();
						BX.fireEvent(cancelButton, 'click');
					}
				}
			},
			getCurrentPage() {
				const currentPage = parseInt(this.arParams.CURRENT_PAGE);
				if (BX.Type.isNumber(currentPage)) {
					return currentPage;
				}
				return 0;
			},
			/**
			 * @private
			 * @return {Element | any}
			 */
			getEmptyStub() {
				return this.getTable().querySelector('.main-grid-row-empty');
			},
			/**
			 * @private
			 */
			showEmptyStub() {
				const stub = this.getEmptyStub();
				if (stub) {
					BX.Dom.attr(stub, 'hidden', null);
					BX.Dom.addClass(this.getContainer(), 'main-grid-empty-stub');
					if (this.getCurrentPage() <= 1) {
						this.hidePanels();
					}
				}
			},
			/**
			 * @private
			 */
			hideEmptyStub() {
				const stub = this.getEmptyStub();
				if (stub) {
					BX.Dom.attr(stub, 'hidden', true);
					BX.Dom.removeClass(this.getContainer(), 'main-grid-empty-stub');
					BX.Dom.style(this.getTable(), 'min-height', null);
					this.showPanels();
				}
			},
			/**
			 * @private
			 */
			showPanels() {
				BX.Dom.show(this.getPanels());
				if (this.getPanels().offsetHeight > 0) {
					BX.Dom.removeClass(this.getContainer(), 'main-grid-empty-footer');
				}
			},
			/**
			 * @private
			 */
			hidePanels() {
				BX.Dom.hide(this.getPanels());
				BX.Dom.addClass(this.getContainer(), 'main-grid-empty-footer');
			},
			/**
			 * @return {BX.Grid.Row}
			 */
			getTemplateRow() {
				const templateRow = BX.Runtime.clone(this.getRows().getBodyChild(true).find(row => {
					return row.getId() === 'template_0';
				}));
				const cloned = BX.Runtime.clone(templateRow.getNode());
				BX.Dom.prepend(cloned, this.getBody());
				const checkbox = cloned.querySelector('[type="checkbox"]');
				if (checkbox) {
					BX.Dom.attr(checkbox, 'disabled', null);
					BX.Dom.attr(checkbox, 'data-disabled', null);
				}
				return new BX.Grid.Row(this, cloned);
			},
			/**
			 * @private
			 * @return {{}[]}
			 */
			getRowEditorValue(withTemplate) {
				this.rows = null;
				return this.getRows().getSelected(withTemplate).map(row => {
					return row.getEditorValue();
				});
			},
			/**
			 * @private
			 * @return {HTMLElement|HTMLBodyElement}
			 */
			getRowEditorActionPanel() {
				if (!this.rowEditorActionPanel) {
					this.rowEditorActionPanel = BX.Dom.create({
						tag: 'div',
						props: {
							className: 'main-ui-grid-row-editor-actions-panel'
						},
						children: [BX.Dom.create({
							tag: 'span',
							props: {
								className: 'ui-btn ui-btn-success'
							},
							text: this.arParams.SAVE_BUTTON_LABEL,
							events: {
								click: this.saveRows.bind(this)
							}
						}), BX.Dom.create({
							tag: 'span',
							props: {
								className: 'ui-btn ui-btn-link'
							},
							text: this.arParams.CANCEL_BUTTON_LABEL,
							events: {
								click: this.hideRowsEditor.bind(this)
							}
						})]
					});
				}
				return this.rowEditorActionPanel;
			},
			/**
			 * @private
			 */
			showRowEditorActionsPanel() {
				const panel = this.getRowEditorActionPanel();
				BX.Dom.append(panel, this.actionPanel.getPanel());
			},
			/**
			 * @private
			 */
			hideRowEditorActionsPanel() {
				BX.Dom.remove(this.getRowEditorActionPanel());
			},
			/**
			 * @return {BX.Grid.Row}
			 */
			prependRowEditor() {
				return this.addRowEditor('prepend');
			},
			/**
			 * @return {BX.Grid.Row}
			 */
			appendRowEditor() {
				return this.addRowEditor('append');
			},
			/**
			 * @return {BX.Grid.Row}
			 */
			addRowEditor(direction = 'prepend') {
				BX.Dom.style(this.getTable(), 'min-height', null);
				const templateRow = this.getTemplateRow();
				this.editableRows.push(templateRow);
				if (direction === 'prepend') {
					templateRow.prependTo(this.getBody());
				} else {
					templateRow.appendTo(this.getBody());
				}
				templateRow.show();
				templateRow.select();
				templateRow.edit();
				this.getRows().reset();
				if (this.getParam('ALLOW_ROWS_SORT')) {
					this.rowsSortable.reinit();
				}
				if (this.getParam('ALLOW_COLUMNS_SORT')) {
					this.colsSortable.reinit();
				}
				this.hideEmptyStub();
				return templateRow;
			},
			hideRowsEditor() {
				this.editableRows.forEach(row => {
					BX.Dom.remove(row.getNode());
				});
				this.editableRows = [];
			},
			saveRows() {
				const value = this.getRowEditorValue(true);
				this.emitAsync('onAddRowsAsync', {
					rows: value
				}).then(result => {
					result.forEach((rowData, rowIndex) => {
						const row = this.editableRows[rowIndex];
						if (row) {
							row.editCancel();
							row.unselect();
							row.makeCountable();
							row.setId(rowData.id);
							row.setActions(rowData.actions);
							row.setCellsContent(rowData.columns);
						}
					});
					this.bindOnRowEvents();
					this.updateCounterDisplayed();
					this.updateCounterSelected();
					this.editableRows = [];
				});
			},
			getRealtime() {
				return this.cache.remember('realtime', () => {
					return new BX.Grid.Realtime({
						grid: this
					});
				});
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * Updates grid
		 * @param {BX.Main.grid} parent
		 * @constructor
		 */
		BX.Grid.Updater = function (parent) {
			this.parent = parent;
		};

		/**
		 * Gets parent object
		 * @return {?BX.Main.grid}
		 */
		BX.Grid.Updater.prototype.getParent = function () {
			return this.parent;
		};

		/**
		 * Updates head rows
		 * @param {?HTMLTableRowElement[]} rows
		 */
		BX.Grid.Updater.prototype.updateHeadRows = function (rows) {
			let headers;
			if (BX.type.isArray(rows) && rows.length > 0) {
				headers = this.getParent().getHeaders();
				headers.forEach(header => {
					header = BX.cleanNode(header);
					rows.forEach(row => {
						if (BX.type.isDomNode(row)) {
							header.appendChild(BX.clone(row));
						}
					});
				});
			}
		};

		/**
		 * Appends head rows
		 * @param {?HTMLTableRowElement[]} rows
		 */
		BX.Grid.Updater.prototype.appendHeadRows = function (rows) {
			let headers;
			if (BX.type.isArray(rows) && rows.length > 0) {
				headers = this.getParent().getHeaders();
				headers.forEach(header => {
					rows.forEach(row => {
						if (BX.type.isDomNode(row)) {
							header.appendChild(BX.clone(row));
						}
					});
				});
			}
		};

		/**
		 * Prepends head rows
		 * @param {?HTMLTableRowElement[]} rows
		 */
		BX.Grid.Updater.prototype.prependHeadRows = function (rows) {
			let headers;
			if (BX.type.isArray(rows) && rows.length > 0) {
				headers = this.getParent().getHeaders();
				headers.forEach(header => {
					header = BX.cleanNode(header);
					rows.forEach(row => {
						if (BX.type.isDomNode(row)) {
							header.prepend(BX.clone(row));
						}
					});
				});
			}
		};

		/**
		 * Updates body row by row id
		 * @param {?string|number} id
		 * @param {HTMLTableRowElement} row
		 */
		BX.Grid.Updater.prototype.updateBodyRowById = function (id, row) {
			if ((BX.type.isNumber(id) || BX.type.isNotEmptyString(id)) && BX.type.isDomNode(row)) {
				const currentRow = this.getParent().getRows().getById(id);
				if (currentRow) {
					const currentNode = currentRow.getNode();
					BX.insertAfter(row, currentNode);
					BX.remove(currentNode);
				}
			}
		};

		/**
		 * Updates all body rows.
		 * @param {?HTMLTableRowElement[]} rows
		 */
		BX.Grid.Updater.prototype.updateBodyRows = function (rows) {
			if (BX.type.isArray(rows)) {
				const body = this.getParent().getBody();
				body.innerHTML = '';
				rows.forEach(current => {
					Boolean(current) && body.appendChild(current);
				});
			}
		};

		/**
		 * Appends body rows.
		 * @param {?HTMLTableRowElement[]} rows
		 */
		BX.Grid.Updater.prototype.appendBodyRows = function (rows) {
			let body;
			if (BX.type.isArray(rows)) {
				body = this.getParent().getBody();
				rows.forEach(current => {
					if (BX.type.isDomNode(current)) {
						body.appendChild(current);
					}
				});
			}
		};

		/**
		 * Prepends body rows
		 * @param {?HTMLTableRowElement[]} rows
		 */
		BX.Grid.Updater.prototype.prependBodyRows = function (rows) {
			let body;
			if (BX.type.isArray(rows)) {
				body = this.getParent().getBody();
				rows.forEach(current => {
					if (BX.type.isDomNode(current)) {
						BX.prepend(body, current);
					}
				});
			}
		};

		/**
		 * Updates table footer rows.
		 * @param {?HTMLTableRowElement[]} rows
		 */
		BX.Grid.Updater.prototype.updateFootRows = function (rows) {
			let foot;
			if (BX.type.isArray(rows)) {
				foot = BX.cleanNode(this.getParent().getFoot());
				rows.forEach(current => {
					if (BX.type.isDomNode(current)) {
						foot.appendChild(current);
					}
				});
			}
		};

		/**
		 * Updates total rows counter
		 * @param {?HTMLElement} counter
		 */
		BX.Grid.Updater.prototype.updateCounterTotal = function (counter) {
			let counterCell;
			if (BX.type.isDomNode(counter)) {
				counterCell = BX.cleanNode(this.getParent().getCounterTotal());
				counterCell.appendChild(counter);
			}
		};

		/**
		 * Updates grid pagination
		 * @param {?HTMLElement} pagination
		 */
		BX.Grid.Updater.prototype.updatePagination = function (pagination) {
			const paginationCell = this.getParent().getPagination().getContainer();
			if (paginationCell) {
				paginationCell.innerHTML = '';
				if (BX.type.isDomNode(pagination)) {
					paginationCell.appendChild(pagination);
				}
			}
		};

		/**
		 * Updates more button
		 * @param {?HTMLElement} button
		 */
		BX.Grid.Updater.prototype.updateMoreButton = function (button) {
			if (BX.type.isDomNode(button)) {
				const buttonParent = BX.Grid.Utils.closestParent(this.getParent().getMoreButton().getNode());
				buttonParent.innerHTML = '';
				buttonParent.appendChild(button);
			}
		};

		/**
		 * Updates group actions panel
		 * @param {HTMLElement} panel
		 */
		BX.Grid.Updater.prototype.updateGroupActions = function (panel) {
			const GroupActions = this.parent.getActionsPanel();
			if (Boolean(GroupActions) && BX.type.isDomNode(panel)) {
				const panelNode = GroupActions.getPanel();
				const panelChild = BX.firstChild(panel);

				// An outdated response carries an already emptied panel: keeping the live one
				// is better than leaving the grid without group actions until a page reload.
				if (BX.type.isDomNode(panelNode) && BX.type.isDomNode(panelChild)) {
					panelNode.innerHTML = '';
					panelNode.appendChild(panelChild);
				}
			}
		};

		/**
		 * Updates a grid container
		 * @param {?HTMLElement} container
		 */
		BX.Grid.Updater.prototype.updateContainer = function (container) {
			if (BX.Type.isDomNode(container)) {
				this.getParent().getContainer().className = container.className;
			}
		};
	})();

	(function () {

		BX.Reflection.namespace('BX.Grid');
		BX.Grid.ImageField = function (parent, options) {
			this.parent = parent;
			this.options = options;
			this.cache = new BX.Cache.MemoryCache();
		};
		BX.Grid.ImageField.prototype = {
			getPreview() {
				return this.cache.remember('preview', () => {
					return BX.create('img', {
						props: {
							className: 'main-grid-image-editor-preview'
						},
						attrs: {
							src: this.options.VALUE
						}
					});
				});
			},
			getFileInput() {
				return this.cache.remember('fileInput', () => {
					return BX.create('input', {
						props: {
							className: 'main-grid-image-editor-file-input'
						},
						attrs: {
							type: 'file',
							accept: 'image/*',
							name: this.options.NAME
						},
						events: {
							change: function (event) {
								const reader = new FileReader();
								reader.onload = function (event) {
									this.getPreview().src = event.currentTarget.result;
								}.bind(this);
								reader.readAsDataURL(event.target.files[0]);
								BX.Dom.remove(this.getFakeField());
								BX.Dom.append(this.getFileInput(), this.getLayout());
								BX.Dom.removeClass(this.getRemoveButton(), 'ui-btn-disabled');
								this.getRemoveButton().disabled = false;
								BX.Dom.style(this.getPreview(), null);
							}.bind(this)
						}
					});
				});
			},
			getUploadButton() {
				return this.cache.remember('uploadButton', () => {
					return BX.create('button', {
						props: {
							className: 'ui-btn ui-btn-xs'
						},
						text: this.parent.getParam('MAIN_UI_GRID_IMAGE_EDITOR_BUTTON_EDIT'),
						events: {
							click: function (event) {
								event.preventDefault();
								this.getFileInput().click();
							}.bind(this)
						}
					});
				});
			},
			getRemoveButton() {
				return this.cache.remember('removeButton', () => {
					return BX.create('button', {
						props: {
							className: 'ui-btn ui-btn-xs ui-btn-danger'
						},
						events: {
							click: function (event) {
								event.preventDefault();
								BX.Dom.append(this.getFakeField(), this.getLayout());
								BX.Dom.remove(this.getFileInput());
								BX.Dom.addClass(this.getRemoveButton(), 'ui-btn-disabled');
								// The class only greys the button out: without the attribute it keeps
								// its tab stop and still fires on Enter.
								this.getRemoveButton().disabled = true;
								BX.Dom.style(this.getPreview(), {
									opacity: 0.4
								});
							}.bind(this)
						},
						text: this.parent.getParam('MAIN_UI_GRID_IMAGE_EDITOR_BUTTON_REMOVE')
					});
				});
			},
			getFakeField() {
				return this.cache.remember('deleted', () => {
					return BX.create('input', {
						props: {
							className: 'main-grid-image-editor-fake-file-input'
						},
						attrs: {
							type: 'hidden',
							name: this.options.NAME,
							value: 'null'
						}
					});
				});
			},
			getLayout() {
				return this.cache.remember('layout', () => {
					return BX.create('div', {
						props: {
							className: 'main-grid-image-editor main-grid-editor'
						},
						attrs: {
							name: this.options.NAME
						},
						children: [BX.create('div', {
							props: {
								className: 'main-grid-image-editor-left'
							},
							children: [this.getPreview()]
						}), BX.create('div', {
							props: {
								className: 'main-grid-image-editor-right'
							},
							children: [this.getUploadButton(), this.getRemoveButton()]
						}), this.getFileInput()]
					});
				});
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * BX.Grid.InlineEditor
		 * @param {BX.Main.grid} parent
		 * @param {Object} types
		 * @constructor
		 */
		BX.Grid.InlineEditor = function (parent, types) {
			this.parent = null;
			this.types = null;
			this.isDropdownChangeEventSubscribed = false;
			this.init(parent, types);
		};
		BX.Grid.InlineEditor.prototype = {
			init(parent, types) {
				this.parent = parent;
				try {
					this.types = eval(types);
				} catch {
					this.types = null;
				}
			},
			createContainer() {
				return BX.create('div', {
					props: {
						className: this.parent.settings.get('classEditorContainer')
					}
				});
			},
			createTextarea(editObject, height) {
				return BX.create('textarea', {
					props: {
						className: [this.parent.settings.get('classEditor'), this.parent.settings.get('classEditorTextarea')].join(' ')
					},
					attrs: {
						name: editObject.NAME,
						style: `height:${height}px`
					},
					html: editObject.VALUE || ''
				});
			},
			createInput(editObject) {
				let className = this.parent.settings.get('classEditorText');
				const attrs = {
					value: editObject.VALUE !== undefined && editObject.VALUE !== null ? BX.util.htmlspecialcharsback(editObject.VALUE) : '',
					name: editObject.NAME !== undefined && editObject.NAME !== null ? editObject.NAME : ''
				};
				if (editObject.TYPE === this.types.CHECKBOX) {
					className = this.parent.settings.get('classEditorCheckbox');
					attrs.type = 'checkbox';
					attrs.checked = attrs.value == 'Y';
				}
				if (editObject.TYPE === this.types.DATE) {
					className = [className, this.parent.settings.get('classEditorDate')].join(' ');
				}
				if (editObject.TYPE === this.types.NUMBER) {
					className = [className, this.parent.settings.get('classEditorNumber')].join(' ');
					attrs.type = 'number';
				}
				if (editObject.TYPE === this.types.RANGE) {
					className = [className, this.parent.settings.get('classEditorRange')].join(' ');
					attrs.type = 'range';
					if (BX.type.isPlainObject(editObject.DATA)) {
						attrs.min = editObject.DATA.MIN || '0';
						attrs.max = editObject.DATA.MAX || 99999;
						attrs.step = editObject.DATA.STEP || '';
					}
				}
				if (BX.type.isNotEmptyString(editObject.PLACEHOLDER)) {
					attrs.placeholder = BX.util.htmlspecialchars(editObject.PLACEHOLDER);
				}
				if (editObject.DISABLED) {
					attrs.disabled = true;
				}
				className = [this.parent.settings.get('classEditor'), className].join(' ');
				return BX.create('input', {
					props: {
						className,
						id: `${editObject.NAME}_control`
					},
					attrs
				});
			},
			createCustom(editObject) {
				let className = this.parent.settings.get('classEditorCustom');
				className = [this.parent.settings.get('classEditor'), className].join(' ');
				return BX.create('div', {
					props: {
						className
					},
					attrs: {
						'data-name': editObject.NAME
					},
					html: editObject.VALUE || ''
				});
			},
			createMoney(editObject) {
				const value = editObject.VALUE;
				const fieldChildren = [];
				const priceObject = value.PRICE || {};
				priceObject.PLACEHOLDER = editObject.PLACEHOLDER || '';
				fieldChildren.push(this.createMoneyPrice(priceObject));
				if (BX.type.isArray(editObject.CURRENCY_LIST) && editObject.CURRENCY_LIST.length > 0) {
					const currencyObject = value.CURRENCY || {};
					currencyObject.DATA = {
						ITEMS: editObject.CURRENCY_LIST
					};
					currencyObject.HTML_ENTITY = editObject.HTML_ENTITY || false;
					fieldChildren.push(this.createMoneyCurrency(currencyObject));
				}
				if (BX.type.isNotEmptyObject(value.HIDDEN)) {
					for (const fieldName in value.HIDDEN) {
						if (value.HIDDEN.hasOwnProperty(fieldName) && BX.type.isNotEmptyString(fieldName)) {
							const hidden = this.createInput({
								NAME: fieldName,
								VALUE: value.HIDDEN[fieldName],
								TYPE: this.types.TEXT
							});
							hidden.type = 'hidden';
							fieldChildren.push(hidden);
						}
					}
				}
				let className = this.parent.settings.get('classEditorMoney');
				className = [this.parent.settings.get('classEditor'), className].join(' ');
				const attrs = value.ATTRIBUTES || {};
				attrs['data-name'] = editObject.NAME;
				return BX.create('div', {
					props: {
						className
					},
					attrs,
					children: fieldChildren
				});
			},
			createMoneyPrice(priceObject) {
				priceObject.TYPE = this.types.NUMBER;
				const priceInput = this.createInput(priceObject);
				priceInput.classList.add('main-grid-editor-money-price');
				main_core.Event.bind(priceInput, 'change', event => {
					const fieldNode = event.target.parentNode;
					const currencyDropdown = fieldNode.querySelector('.main-grid-editor-money-currency');
					const eventData = {
						field: fieldNode,
						values: {
							price: event.target.value || '',
							currency: currencyDropdown.dataset.value || ''
						}
					};
					main_core_events.EventEmitter.emit('Grid.MoneyField::change', eventData);
				});
				return priceInput;
			},
			createMoneyCurrency(currencyObject) {
				const currencyBlock = this.createDropdown(currencyObject);
				currencyBlock.dataset.menuOffsetLeft = 15;
				currencyBlock.dataset.menuMaxHeight = 200;
				currencyBlock.classList.add('main-grid-editor-money-currency');
				if (currencyObject.DISABLED === true) {
					currencyBlock.classList.remove('main-dropdown');
					currencyBlock.dataset.disabled = true;
				}
				if (!this.isDropdownChangeEventSubscribed) {
					this.isDropdownChangeEventSubscribed = true;
					main_core_events.EventEmitter.subscribe('Dropdown::change', event => {
						const [controlId] = event.getData();
						if (!BX.type.isNotEmptyString(controlId)) {
							return;
						}
						const dropdownObject = BX.Main.dropdownManager.getById(controlId);
						if (dropdownObject.dropdown && dropdownObject.dropdown.classList.contains('main-grid-editor-money-currency')) {
							const fieldNode = dropdownObject.dropdown.parentNode;
							const priceField = fieldNode.querySelector('.main-grid-editor-money-price');
							const eventData = {
								field: fieldNode,
								values: {
									price: priceField.value || '',
									currency: dropdownObject.dropdown.dataset.value || ''
								}
							};
							main_core_events.EventEmitter.emit('Grid.MoneyField::change', eventData);
						}
					});
				}
				return currencyBlock;
			},
			createOutput(editObject) {
				return BX.create('output', {
					props: {
						className: this.parent.settings.get('classEditorOutput') || ''
					},
					attrs: {
						for: `${editObject.NAME}_control`
					},
					text: editObject.VALUE || ''
				});
			},
			getDropdownValueItemByValue(items, value) {
				return this.findDropdownValueItemByValue(items, value) ?? items[0];
			},
			findDropdownValueItemByValue(items, value) {
				const preparedValue = String(value);
				for (const current of items) {
					if ('VALUE' in current && String(current.VALUE) === preparedValue) {
						return current;
					}
					if ('ITEMS' in current) {
						const nestedItem = this.findDropdownValueItemByValue(current.ITEMS, value);
						if (nestedItem) {
							return nestedItem;
						}
					}
				}
				return null;
			},
			isDropdownEmptyValue(value) {
				return value === false || BX.Type.isNil(value) || BX.Type.isString(value) && value === '';
			},
			getDropdownEmptyValueCaption(editObject) {
				if (BX.Type.isPlainObject(editObject.DATA) && BX.Type.isString(editObject.DATA.EMPTY_VALUE_CAPTION)) {
					return editObject.DATA.EMPTY_VALUE_CAPTION;
				}
				return null;
			},
			getDropdownEmptyValueName(emptyValueCaption, isHtmlEntity) {
				return isHtmlEntity ? BX.util.htmlspecialchars(emptyValueCaption) : emptyValueCaption;
			},
			prepareDropdownItems(items, emptyValueCaption, isHtmlEntity) {
				return items.map(item => {
					const preparedItem = {
						...item
					};
					const hasSubItems = 'ITEMS' in preparedItem;
					if (hasSubItems) {
						preparedItem.ITEMS = this.prepareDropdownItems(preparedItem.ITEMS, emptyValueCaption, isHtmlEntity);
					}
					if (!hasSubItems && BX.Type.isString(emptyValueCaption) && this.isDropdownEmptyValue(preparedItem.VALUE)) {
						preparedItem.VALUE = '';
						preparedItem.NAME = this.getDropdownEmptyValueName(emptyValueCaption, isHtmlEntity);
					}
					return preparedItem;
				});
			},
			createDropdown(editObject) {
				const isHtmlEntity = 'HTML_ENTITY' in editObject && editObject.HTML_ENTITY === true;
				const emptyValueCaption = this.getDropdownEmptyValueCaption(editObject);
				const isEmptyValueCaptionSelected = BX.Type.isString(emptyValueCaption) && this.isDropdownEmptyValue(editObject.VALUE);
				const items = this.prepareDropdownItems(editObject.DATA.ITEMS, emptyValueCaption, isHtmlEntity);
				const value = isEmptyValueCaptionSelected ? '' : editObject.VALUE;
				const valueItem = this.getDropdownValueItemByValue(items, value);
				const valueItemName = valueItem.NAME;
				const attrs = {
					name: editObject.NAME,
					tabindex: '0',
					role: 'button',
					'aria-haspopup': 'menu',
					'aria-expanded': 'false',
					'data-items': JSON.stringify(items),
					'data-value': valueItem.VALUE,
					'data-html-entity': editObject.HTML_ENTITY
				};
				return BX.create('div', {
					props: {
						className: [this.parent.settings.get('classEditor'), 'main-dropdown main-grid-editor-dropdown'].join(' '),
						id: `${editObject.NAME}_control`
					},
					attrs,
					children: [BX.create('span', {
						props: {
							className: 'main-dropdown-inner'
						},
						html: isHtmlEntity ? valueItemName : null,
						text: isHtmlEntity ? null : valueItemName
					})]
				});
			},
			createMultiselect(editObject) {
				const selectedValues = [];
				const squares = (() => {
					if (BX.Type.isArrayFilled(editObject.VALUE)) {
						return editObject.VALUE.map(value => {
							const item = this.getDropdownValueItemByValue(editObject.DATA.ITEMS, value);
							selectedValues.push(item);
							const itemName = item.HTML ?? BX.util.htmlspecialchars(item.NAME);
							const renderedItem = BX.Tag.render`
							<span class="main-ui-square">
								<span class="main-ui-square-item">${itemName}</span>
								<span class="main-ui-item-icon main-ui-square-delete"></span>
							</span>
						`;
							BX.Dom.attr(renderedItem, 'data-item', item);
							return renderedItem;
						});
					}
					return [];
				})();
				const layout = BX.Tag.render`
				<div
					class="main-grid-editor main-ui-control main-ui-multi-select"
					name="${BX.Text.encode(editObject.NAME)}"
					id="${`${BX.Text.encode(editObject.NAME)}_control`}"
				>
					<span class="main-ui-square-container">${squares}</span>
					<span class="main-ui-hide main-ui-control-value-delete">
						<span class="main-ui-control-value-delete-item"></span>
					</span>
					<span class="main-ui-square-search">
						<input type="text" class="main-ui-square-search-item">
					</span>
				</div>
			`;
				BX.Dom.attr(layout, {
					'data-params': {
						isMulti: true
					},
					'data-items': editObject.DATA.ITEMS,
					'data-value': selectedValues
				});
				return layout;
			},
			validateEditObject(editObject) {
				return BX.type.isPlainObject(editObject) && 'TYPE' in editObject && 'NAME' in editObject && 'VALUE' in editObject && (!('items' in editObject) || BX.type.isArray(editObject.items) && editObject.items.length);
			},
			initCalendar(event) {
				BX.calendar({
					node: event.target,
					field: event.target
				});
			},
			bindOnRangeChange(control, output) {
				function bubble(control, output) {
					BX.html(output, control.value);
					const value = parseFloat(control.value);
					const max = parseFloat(control.getAttribute('max'));
					const min = parseFloat(control.getAttribute('min'));
					const thumbWidth = 16;
					const range = max - min;
					const position = (value - min) / range * 100;
					const positionOffset = Math.round(thumbWidth * position / 100) - thumbWidth / 2;
					output.style.left = `${position}%`;
					output.style.marginLeft = `${-positionOffset}px`;
				}
				setTimeout(() => {
					bubble(control, output);
				}, 0);
				BX.bind(control, 'input', () => {
					bubble(control, output);
				});
			},
			createImageEditor(editObject) {
				return new BX.Grid.ImageField(this.parent, editObject).getLayout();
			},
			getEditor(editObject, height) {
				let control;
				let span;
				const container = this.createContainer();
				if (this.validateEditObject(editObject)) {
					editObject.VALUE = editObject.VALUE === null ? '' : editObject.VALUE;
					switch (editObject.TYPE) {
						case this.types.TEXT:
							{
								control = this.createInput(editObject);
								BX.bind(control, 'click', event => {
									event.stopPropagation();
								});
								BX.bind(control, 'keydown', BX.delegate(this._onControlKeydown, this));
								break;
							}
						case this.types.DATE:
							{
								control = this.createInput(editObject);
								BX.bind(control, 'click', this.initCalendar);
								BX.bind(control, 'click', event => {
									event.stopPropagation();
								});
								BX.bind(control, 'keydown', BX.delegate(this._onControlKeydown, this));
								break;
							}
						case this.types.NUMBER:
							{
								control = this.createInput(editObject);
								BX.bind(control, 'click', event => {
									event.stopPropagation();
								});
								BX.bind(control, 'keydown', BX.delegate(this._onControlKeydown, this));
								break;
							}
						case this.types.RANGE:
							{
								control = this.createInput(editObject);
								span = this.createOutput(editObject);
								this.bindOnRangeChange(control, span);
								BX.bind(control, 'click', event => {
									event.stopPropagation();
								});
								BX.bind(control, 'keydown', BX.delegate(this._onControlKeydown, this));
								break;
							}
						case this.types.CHECKBOX:
							{
								control = this.createInput(editObject);
								BX.bind(control, 'click', event => {
									event.stopPropagation();
								});
								BX.bind(control, 'keydown', BX.delegate(this._onControlKeydown, this));
								break;
							}
						case this.types.TEXTAREA:
							{
								control = this.createTextarea(editObject, height);
								BX.bind(control, 'click', event => {
									event.stopPropagation();
								});
								BX.bind(control, 'keydown', BX.delegate(this._onControlKeydown, this));
								break;
							}
						case this.types.DROPDOWN:
							{
								control = this.createDropdown(editObject);
								break;
							}
						case this.types.MULTISELECT:
							{
								control = this.createMultiselect(editObject);
								break;
							}
						case this.types.IMAGE:
							{
								control = this.createImageEditor(editObject);
								break;
							}
						case this.types.MONEY:
							{
								control = this.createMoney(editObject);
								BX.bind(control, 'keydown', BX.delegate(this._onControlKeydown, this));
								break;
							}
						case this.types.CUSTOM:
							{
								control = this.createCustom(editObject);
								requestAnimationFrame(() => {
									const html = editObject.HTML || editObject.VALUE || null;
									if (html) {
										const res = BX.processHTML(html);
										res.SCRIPT.forEach(item => {
											if (item.isInternal && item.JS) {
												BX.evalGlobal(item.JS);
											}
										});
									}
								});
								BX.bind(control, 'click', event => {
									event.stopPropagation();
								});
								BX.bind(control, 'keydown', BX.delegate(this._onControlKeydown, this));
								break;
							}
					}
				}
				if (BX.type.isDomNode(span)) {
					container.appendChild(span);
				}
				if (BX.type.isDomNode(control)) {
					container.appendChild(control);
				}
				return container;
			},
			_onControlKeydown(event) {
				if (event.code === 'Enter') {
					event.preventDefault();
					const saveButton = BX.Grid.Utils.getBySelector(this.parent.getContainer(), '#grid_save_button > button', true);
					if (saveButton) {
						BX.fireEvent(saveButton, 'click');
					}
				}
				if (event.code === 'Escape') {
					this._cancelEditOnEscape(event);
				}
			},
			/**
			 * Cancels the edit mode the same way the cancel button of the action panel does and returns
			 * the focus to the cell the editor was opened in. The event is stopped only when the edit was
			 * actually cancelled, so Escape still reaches a popup the grid may live in.
			 */
			_cancelEditOnEscape(event) {
				const cell = event.target.closest('.main-grid-cell');
				const cancelButton = BX.Grid.Utils.getBySelector(this.parent.getContainer(), '#grid_cancel_button > button', true);
				if (!cancelButton) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				BX.fireEvent(cancelButton, 'click');
				if (BX.Type.isDomNode(cell)) {
					// The cell is focusable just long enough to take the focus back: a tabindex left
					// behind would turn every edited cell into a permanent stop for assistive tech.
					BX.Dom.attr(cell, 'tabindex', '-1');
					cell.focus();
					BX.bind(cell, 'blur', function onBlur() {
						BX.unbind(cell, 'blur', onBlur);
						BX.Dom.attr(cell, 'tabindex', null);
					});
				}
			}
		};
	})();

	/**
	 * @memberOf BX.Grid
	 */
	class Label {
		static Color = {
			DEFAULT: 'ui-label-default',
			DANGER: 'ui-label-danger',
			SUCCESS: 'ui-label-success',
			WARNING: 'ui-label-warning',
			PRIMARY: 'ui-label-primary',
			SECONDARY: 'ui-label-secondary',
			LIGHTGREEN: 'ui-label-lightgreen',
			LIGHTBLUE: 'ui-label-lightblue',
			LIGHT: 'ui-label-light'
		};
		static RemoveButtonType = {
			INSIDE: 'main-grid-tag-remove-inside',
			OUTSIDE: 'main-grid-tag-remove-outside'
		};
	}
	const namespace$3 = main_core.Reflection.namespace('BX.Grid');
	namespace$3.Label = Label;

	(function () {

		BX.namespace('BX.Grid');
		BX.Grid.Loader = function (parent) {
			this.parent = null;
			this.container = null;
			this.windowHeight = null;
			this.tbodyPos = null;
			this.headerPos = null;
			this.lastPosTop = null;
			this.lastBottomPos = null;
			this.table = null;
			this.loader = null;
			this.adjustLoaderOffset = this.adjustLoaderOffset.bind(this);
			this.init(parent);
		};
		BX.Grid.Loader.prototype = {
			init(parent) {
				this.parent = parent;
				this.table = this.parent.getTable();
				this.loader = new BX.Loader({
					target: this.getContainer()
				});
			},
			adjustLoaderOffset() {
				this.windowHeight = BX.height(window);
				this.tbodyPos = BX.pos(this.table.tBodies[0]);
				this.headerPos = BX.pos(this.table.tHead);
				let scrollY = window.scrollY;
				if (this.parent.isIE()) {
					scrollY = document.documentElement.scrollTop;
				}
				let bottomPos = scrollY + this.windowHeight - this.tbodyPos.top;
				let posTop = scrollY - this.tbodyPos.top;
				if (bottomPos > this.tbodyPos.bottom - this.tbodyPos.top) {
					bottomPos = this.tbodyPos.bottom - this.tbodyPos.top;
				}
				if (posTop < this.headerPos.height) {
					posTop = this.headerPos.height;
				} else {
					bottomPos -= posTop;
					bottomPos += this.headerPos.height;
				}
				requestAnimationFrame(() => {
					if (posTop !== this.lastPosTop) {
						this.getContainer().style.transform = `translate3d(0px, ${posTop}px, 0)`;
					}
					if (bottomPos !== this.lastBottomPos) {
						this.getContainer().style.height = `${bottomPos}px`;
					}
					this.lastPosTop = posTop;
					this.lastBottomPos = bottomPos;
				});
			},
			getContainer() {
				if (!this.container) {
					this.container = BX.Grid.Utils.getByClass(this.parent.getContainer(), this.parent.settings.get('classLoader'), true);
				}
				return this.container;
			},
			show() {
				if (!this.loader.isShown()) {
					this.adjustLoaderOffset();
					this.getContainer().style.display = 'block';
					this.getContainer().style.opacity = '1';
					this.getContainer().style.visibility = 'visible';
					const rowsCount = this.parent.getRows().getCountDisplayed();
					if (rowsCount > 0 && rowsCount <= 2) {
						this.loader.setOptions({
							size: 60
						});
						this.loader.show();
					} else {
						this.loader.setOptions({
							size: 110
						});
						this.loader.show();
					}
				}
			},
			hide() {
				if (this.loader.isShown()) {
					this.adjustLoaderOffset();
					this.loader.hide().then(() => {
						this.getContainer().style.display = 'none';
					});
				}
			}
		};
	})();

	(function () {

		BX.namespace('BX.Main');

		/**
		 * Works with grid instances
		 * @type {{data: Array, push: BX.Main.gridManager.push, getById: BX.Main.gridManager.getById}}
		 */

		if (BX.Main.gridManager) {
			return;
		}
		BX.Main.gridManager = {
			data: [],
			push(id, instance) {
				if (BX.type.isNotEmptyString(id) && instance) {
					const object = {
						id,
						instance,
						old: null
					};
					if (this.getById(id) === null) {
						this.data.push(object);
					} else {
						this.data[0] = object;
					}
				}
			},
			getById(id) {
				const result = this.data.filter(current => {
					return current.id === id || current.id.replace('main_grid_', '') === id;
				});
				return result.length === 1 ? result[0] : null;
			},
			getInstanceById(id) {
				const result = this.getById(id);
				return BX.type.isPlainObject(result) ? result.instance : null;
			},
			reload(id, url) {
				const instance = this.getInstanceById(id);
				if (instance) {
					instance.reload(url);
				}
			},
			getDataIndex(id) {
				let result = null;
				this.data.forEach((item, index) => {
					if (item.id === id) {
						result = index;
					}
				});
				return result;
			},
			destroy(id) {
				if (BX.type.isNotEmptyString(id)) {
					const grid = this.getInstanceById(id);
					if (grid instanceof BX.Main.grid) {
						grid.destroy();
						const index = this.getDataIndex(id);
						if (index !== null) {
							delete this.data[index];
						}
					}
				}
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * Works with message
		 * @param {BX.Main.grid} parent
		 * @param {object} types - Types of message
		 * @constructor
		 */
		BX.Grid.Message = function (parent, types) {
			this.parent = null;
			this.types = null;
			this.messages = null;
			this.popup = null;
			this.init(parent, types);
		};
		BX.Grid.Message.prototype = {
			/**
			 * @private
			 * @param {BX.Main.grid} parent
			 * @param {object} types
			 */
			init(parent, types) {
				this.parent = parent;
				this.types = types;
				this.show();
				BX.addCustomEvent('BX.Main.grid:paramsUpdated', BX.proxy(this.onUpdated, this));
			},
			/**
			 * @private
			 */
			onUpdated() {
				this.show();
			},
			/**
			 * Gets data for messages
			 * @return {object[]}
			 */
			getData() {
				return this.parent.arParams.MESSAGES;
			},
			/**
			 * Checks is need show message
			 * @return {boolean}
			 */
			isNeedShow() {
				return this.getData().length > 0;
			},
			/**
			 * Show message
			 */
			show() {
				if (this.isNeedShow()) {
					this.getPopup().setContent(this.getContent());
					this.getPopup().show();
				}
			},
			/**
			 * Gets content for message popup
			 * @return {?HTMLElement}
			 */
			getContent() {
				const data = this.getData();
				let content = null;
				if (BX.type.isArray(data) && data.length > 0) {
					const messagesDecl = {
						block: 'main-grid-messages',
						content: []
					};
					data.forEach(message => {
						const messageDecl = {
							block: 'main-grid-message',
							mix: `main-grid-message-${message.TYPE.toLowerCase()}`,
							content: []
						};
						if (BX.type.isNotEmptyString(message.TITLE)) {
							messageDecl.content.push({
								block: 'main-grid-message-title',
								content: BX.create('div', {
									html: message.TITLE
								}).innerText
							});
						}
						if (BX.type.isNotEmptyString(message.TEXT)) {
							messageDecl.content.push({
								block: 'main-grid-message-text',
								content: BX.create('div', {
									html: message.TEXT
								}).innerText
							});
						}
						messagesDecl.content.push(messageDecl);
					});
					content = BX.decl(messagesDecl);
				}
				return content;
			},
			/**
			 * Gets popup of message
			 * @return {BX.PopupWindow}
			 */
			getPopup() {
				if (this.popup === null) {
					this.popup = new BX.PopupWindow(this.getPopupId(), null, {
						autoHide: true,
						overlay: 0.3,
						minWidth: 400,
						maxWidth: 800,
						contentNoPaddings: true,
						closeByEsc: true,
						buttons: [new BX.PopupWindowButton({
							text: this.parent.getParam('CLOSE'),
							className: 'webform-small-button-blue webform-small-button',
							events: {
								click() {
									this.popupWindow.close();
								}
							}
						})]
					});
				}
				return this.popup;
			},
			/**
			 * Gets popup id
			 * @return {string}
			 */
			getPopupId() {
				return `${this.parent.getContainerId()}-main-grid-message`;
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');
		BX.Grid.observer = {
			handlers: [],
			add(node, event, handler, context) {
				BX.bind(node, event, context ? BX.proxy(handler, context) : handler);
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');
		BX.Grid.Pagesize = function (parent) {
			this.parent = null;
			this.init(parent);
		};
		BX.Grid.Pagesize.prototype = {
			init(parent) {
				this.parent = parent;
				BX.addCustomEvent('Dropdown::change', BX.proxy(this.onChange, this));
			},
			destroy() {
				BX.removeCustomEvent('Dropdown::change', BX.proxy(this.onChange, this));
			},
			onChange(id, event, item, dataValue, value) {
				const self = this;
				if (id === `${this.parent.getContainerId()}_${this.parent.settings.get('pageSizeId')}` && value >= 0) {
					this.parent.tableFade();
					this.parent.getUserOptions().setPageSize(value, () => {
						self.parent.reloadTable();
						BX.onCustomEvent(self.parent.getContainer(), 'Grid::pageSizeChanged', [self.parent]);
					});
				}
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * BX.Grid.Pagination
		 * @param {BX.Main.grid} parent
		 * @constructor
		 */
		BX.Grid.Pagination = function (parent) {
			this.parent = null;
			this.container = null;
			this.links = null;
			this.init(parent);
		};
		BX.Grid.Pagination.prototype = {
			init(parent) {
				this.parent = parent;
			},
			getParent() {
				return this.parent;
			},
			getContainer() {
				if (!this.container) {
					this.container = BX.Grid.Utils.getByClass(this.getParent().getContainer(), this.getParent().settings.get('classPagination'), true);
				}
				return this.container;
			},
			getLinks() {
				const self = this;
				const result = BX.Grid.Utils.getByTag(this.getContainer(), 'a');
				this.links = [];
				if (result) {
					this.links = result.map(current => {
						return new BX.Grid.Element(current, self.getParent());
					});
				}
				return this.links;
			},
			getLink(node) {
				let result = null;
				let filter;
				if (BX.type.isDomNode(node)) {
					filter = this.getLinks().filter(current => {
						return node === current.getNode();
					});
					if (filter.length > 0) {
						result = filter[0];
					}
				}
				return result;
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * BX.Grid.PinHeader
		 * @param {BX.Main.grid} parent
		 * @constructor
		 */
		BX.Grid.PinHeader = function (parent) {
			this.parent = null;
			this.table = null;
			this.header = null;
			this.container = null;
			this.parentNodeResizeObserver = null;
			this.scrollContainer = undefined;
			this.scrollFrame = null;
			const adminPanel = this.getAdminPanel();
			if (adminPanel) {
				this.mo = new MutationObserver(this.onAdminPanelMutation.bind(this));
				this.mo.observe(document.documentElement, {
					attributes: true
				});
			}
			this.init(parent);
		};
		BX.Grid.PinHeader.cloneCounter = 0;
		BX.Grid.PinHeader.prototype = {
			init(parent) {
				this.parent = parent;
				this.rect = BX.pos(this.parent.getHead());
				this.gridRect = BX.pos(this.parent.getTable());
				let workArea = BX.Grid.Utils.getBySelector(document, '#workarea-content', true);
				if (!workArea) {
					workArea = this.parent.getContainer().parentNode;
					workArea = workArea ? workArea.parentNode : workArea;
				}
				if (workArea) {
					this.parentNodeResizeObserver = new BX.ResizeObserver(BX.proxy(this.refreshRect, this));
					this.parentNodeResizeObserver.observe(workArea);
				}
				this.create(true);

				// `capture`, because a scroll event of an element does not bubble: without it
				// only the document scroll would be seen, and a grid given a height of its own
				// scrolls inside itself instead of growing the page.
				document.addEventListener('scroll', BX.proxy(this._onScroll, this), BX.Grid.Utils.listenerParams({
					passive: true,
					capture: true
				}));
				document.addEventListener('resize', BX.proxy(this._onResize, this), BX.Grid.Utils.listenerParams({
					passive: true
				}));
				BX.addCustomEvent('Grid::updated', BX.proxy(this._onGridUpdate, this));
				BX.addCustomEvent('Grid::resize', BX.proxy(this._onGridUpdate, this));
				BX.bind(window, 'resize', BX.proxy(this._onGridUpdate, this));
			},
			/**
			 * `BX.Main.grid#destroy` has always called this, so a grid with a pinned header
			 * used to throw on being destroyed. Left behind, the header keeps its listeners
			 * and answers scroll events by measuring a table that is no longer on the page.
			 */
			destroy() {
				document.removeEventListener('scroll', BX.proxy(this._onScroll, this), BX.Grid.Utils.listenerParams({
					passive: true,
					capture: true
				}));
				document.removeEventListener('resize', BX.proxy(this._onResize, this), BX.Grid.Utils.listenerParams({
					passive: true
				}));
				BX.removeCustomEvent('Grid::updated', BX.proxy(this._onGridUpdate, this));
				BX.removeCustomEvent('Grid::resize', BX.proxy(this._onGridUpdate, this));
				BX.unbind(window, 'resize', BX.proxy(this._onGridUpdate, this));
				this.parentNodeResizeObserver && this.parentNodeResizeObserver.disconnect();
				this.mo && this.mo.disconnect();
				if (this.scrollFrame) {
					cancelAnimationFrame(this.scrollFrame);
					this.scrollFrame = null;
				}
				BX.remove(this.getContainer());
				this.container = null;
				this.table = null;
			},
			refreshRect() {
				this.scrollContainer = undefined;
				this.gridRect = BX.pos(this.parent.getTable());
				this.rect = BX.pos(this.parent.getHead());
			},
			_onGridUpdate() {
				const isPinned = this.isPinned();
				BX.remove(this.getContainer());
				this.create();
				isPinned && this.pin();
				this.refreshRect();
				this.adjustPosition();
				BX.onCustomEvent(window, 'Grid::headerUpdated', []);
			},
			create(async) {
				const cells = BX.Grid.Utils.getByTag(this.parent.getHead(), 'th');
				const cloneThead = BX.clone(this.parent.getHead());
				const cloneCells = BX.Grid.Utils.getByTag(cloneThead, 'th');

				// The resize handles are registered from this very clone (see Resize.getPinnedTableButtons),
				// so they stay operable for the pointer while the rest of the copy is taken out of the way.
				// The class is read defensively: `create` is reachable with a parent that carries the
				// markup but no settings, and a missing selector only means no exception is made.
				const resizeButtonClass = this.parent.settings?.get('classResizeButton');
				BX.Grid.Utils.hideFromAssistiveTech(cloneThead, resizeButtonClass ? `.${resizeButtonClass}` : undefined);

				// The clone is a copy of the head down to its ids, so without this the page would
				// carry every id of the head twice while the pinned header is on it. The counter
				// keeps the prefix unique across the clones this header goes through on updates.
				BX.Grid.Utils.makeCloneIdsUnique(cloneThead, `main-grid-pinned-${++BX.Grid.PinHeader.cloneCounter}-`);
				const resizeCloneCells = function () {
					cells.forEach((cell, index) => {
						let width = BX.width(cell);
						if (index > 0) {
							width -= parseInt(BX.style(cell, 'border-left-width'));
							width -= parseInt(BX.style(cell, 'border-right-width'));
						}
						cloneCells[index].firstElementChild && (cloneCells[index].firstElementChild.style.width = `${width}px`);
						if (cells.length - 1 > index) {
							cloneCells[index].style.width = `${width}px`;
						}
					});
				};
				async ? setTimeout(resizeCloneCells, 0) : resizeCloneCells();
				this.container = BX.decl({
					block: 'main-grid-fixed-bar',
					mix: 'main-grid-fixed-top',
					attrs: {
						style: `width: ${BX.width(this.parent.getContainer())}px`
					},
					content: {
						block: 'main-grid-table',
						tag: 'table',
						content: cloneThead
					}
				});
				this.container.hidden = true;
				this.table = null;

				// Appended after the live table on purpose: `getHead` takes the first `thead` of
				// the grid, so inserting the clone before it would make the clone the head.
				this.parent.getWrapper().appendChild(this.container);
				this.adjustHorizontalPosition();
			},
			/**
			 * The clone is a fresh node sitting at the left edge, while the table it heads keeps
			 * whatever horizontal offset the user scrolled it to. Every rebuild - "show more",
			 * sorting, a cancelled group edit - therefore has to carry that offset over, or the
			 * titles end up over the wrong columns.
			 *
			 * The fader positions the clone the same way, but only when it hears `Grid::updated`,
			 * and a rebuild does not always come with one. Placing the clone is part of building
			 * it, so the header does it itself.
			 */
			adjustHorizontalPosition() {
				const scrollContainer = this.parent.getScrollContainer();
				const fixedTable = this.getFixedTable();
				if (!scrollContainer || !fixedTable) {
					return;
				}
				BX.Grid.Utils.styleForEach([fixedTable], {
					'margin-left': `${-scrollContainer.scrollLeft}px`
				});
			},
			getContainer() {
				return this.container;
			},
			getFixedTable() {
				return this.table || (this.table = BX.Grid.Utils.getByTag(this.getContainer(), 'table', true));
			},
			getAdminPanel() {
				if (BX.Type.isUndefined(this.adminPanel)) {
					this.adminPanel = document.querySelector('.adm-header');
				}
				return this.adminPanel;
			},
			isAdminPanelPinned() {
				return BX.hasClass(document.documentElement, 'adm-header-fixed');
			},
			getPinOffset() {
				const adminPanel = this.getAdminPanel();
				if (adminPanel && this.isAdminPanelPinned()) {
					return BX.Text.toNumber(BX.style(adminPanel, 'height'));
				}
				return 0;
			},
			pin() {
				const container = this.getContainer();
				if (container) {
					container.hidden = false;
				}
				BX.onCustomEvent(window, 'Grid::headerPinned', []);
			},
			unpin() {
				const container = this.getContainer();
				if (container) {
					container.hidden = true;
				}
				BX.onCustomEvent(window, 'Grid::headerUnpinned', []);
			},
			stopPin() {
				BX.Grid.Utils.styleForEach([this.getContainer()], {
					position: 'absolute',
					top: `${this.gridRect.bottom - this.rect.height - this.gridRect.top}px`,
					'box-shadow': 'none'
				});
			},
			startPin() {
				BX.Grid.Utils.styleForEach([this.getContainer()], {
					position: 'fixed',
					top: `${this.getPinOffset()}px`,
					'box-shadow': ''
				});
			},
			isPinned() {
				return !this.getContainer().hidden;
			},
			/**
			 * Element the grid scrolls vertically inside, when the page gave the grid a height
			 * of its own instead of growing along with it. `null` when the grid scrolls with
			 * the document, which is how it has always worked.
			 *
			 * @returns {?HTMLElement}
			 */
			getScrollContainer() {
				// The lookup walks the ancestors reading their computed style, so its result is
				// kept until the layout can actually change it (`refreshRect`). Nothing but a
				// style change can change the answer, so a negative one is kept as well.
				if (this.scrollContainer !== undefined) {
					return this.scrollContainer;
				}
				this.scrollContainer = this.findScrollContainer();
				return this.scrollContainer;
			},
			/**
			 * The scroller is recognized by its `overflow-y` alone. Whether it overflows
			 * right now says nothing: content grows after the first lookup - images and
			 * fonts arrive - without resizing the scroller itself, so a cached answer that
			 * depended on the content would keep the header unpinned for good.
			 *
			 * @returns {?HTMLElement}
			 */
			findScrollContainer() {
				const wrapper = this.parent.getWrapper();
				let node = this.parent.getTable().parentElement;
				while (node && wrapper && wrapper.contains(node)) {
					const overflowY = BX.style(node, 'overflow-y');
					if (overflowY === 'auto' || overflowY === 'scroll') {
						return node;
					}
					node = node.parentElement;
				}
				return null;
			},
			/**
			 * Pinning inside the grid's own scroller: the header sticks to its top edge and
			 * lets go once the table has been scrolled past it. Viewport coordinates rather
			 * than document ones - in this mode the document does not move at all.
			 *
			 * @param {HTMLElement} scrollContainer
			 */
			pinInsideScrollContainer(scrollContainer) {
				// The pinned administrative panel covers the top of the viewport, so it is the
				// lowest coordinate the header may take - not an addition to the scroller's own
				// top, which is a viewport coordinate already.
				const top = Math.max(scrollContainer.getBoundingClientRect().top, this.getPinOffset());
				const headRect = this.parent.getHead().getBoundingClientRect();
				const tableRect = this.parent.getTable().getBoundingClientRect();
				if (tableRect.bottom <= top + headRect.height) {
					BX.Grid.Utils.styleForEach([this.getContainer()], {
						'border-top-left-radius': '',
						'border-top-right-radius': ''
					});
					this.stopPin();
					return;
				}
				BX.Grid.Utils.styleForEach([this.getContainer()], {
					position: 'fixed',
					top: `${top}px`,
					'box-shadow': '',
					// The bar is `fixed`, so the rounded top corners of the scroller do not clip
					// it: square corners of the header would stick out over the rounded ones.
					'border-top-left-radius': BX.style(scrollContainer, 'border-top-left-radius'),
					'border-top-right-radius': BX.style(scrollContainer, 'border-top-right-radius')
				});
				if (headRect.top < top) {
					!this.isPinned() && this.pin();
				} else {
					this.isPinned() && this.unpin();
				}
			},
			_onScroll(event) {
				// Scrolling something that does not hold this grid - a popup list, another
				// grid - says nothing about this header, and `capture` brings all of it here.
				const target = event ? event.target : null;
				if (target && BX.Type.isFunction(target.contains) && !target.contains(this.parent.getTable())) {
					return;
				}

				// Scroll fires more often than the browser paints: measuring and positioning
				// the header once per frame is enough, and the frame is dropped on `destroy`.
				if (this.scrollFrame) {
					return;
				}
				this.scrollFrame = requestAnimationFrame(() => {
					this.scrollFrame = null;
					this.adjustPosition();
				});
			},
			adjustPosition() {
				if (!this.getContainer()) {
					return;
				}
				const scrollContainer = this.getScrollContainer();
				if (scrollContainer) {
					this.pinInsideScrollContainer(scrollContainer);
					return;
				}
				let scrollY = 0;
				if (this.scrollRect) {
					scrollY = this.scrollRect.scrollTop;
				} else if (document.scrollingElement) {
					this.scrollRect = document.scrollingElement;
				} else if (document.documentElement.scrollTop > 0) {
					this.scrollRect = document.documentElement;
				} else if (document.body.scrollTop > 0) {
					this.scrollRect = document.body;
				}
				if (this.gridRect.bottom > scrollY + this.rect.height) {
					this.startPin();
					const offset = this.getPinOffset();
					if (this.rect.top - offset <= scrollY) {
						!this.isPinned() && this.pin();
					} else {
						this.isPinned() && this.unpin();
					}
				} else {
					this.stopPin();
				}
			},
			onAdminPanelMutation() {
				this._onScroll();
			},
			_onResize() {
				this.rect = BX.pos(this.parent.getHead());
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * BX.Grid.PinPanel
		 * @param {BX.Main.grid} parent
		 * @constructor
		 */
		BX.Grid.PinPanel = function (parent) {
			this.parent = null;
			this.panel = null;
			this.isSelected = null;
			this.offset = null;
			this.animationDuration = null;
			this.pinned = false;
			this.init(parent);
		};
		BX.Grid.PinPanel.prototype = {
			init(parent) {
				this.parent = parent;
				this.offset = 10;
				this.animationDuration = 200;
				this.panel = this.getPanel();
				this.bindOnRowsEvents();
			},
			destroy() {
				this.unbindOnRowsEvents();
			},
			bindOnRowsEvents() {
				BX.addCustomEvent('Grid::thereSelectedRows', BX.proxy(this._onThereSelectedRows, this));
				BX.addCustomEvent('Grid::allRowsSelected', BX.proxy(this._onThereSelectedRows, this));
				BX.addCustomEvent('Grid::noSelectedRows', BX.proxy(this._onNoSelectedRows, this));
				BX.addCustomEvent('Grid::allRowsUnselected', BX.proxy(this._onNoSelectedRows, this));
				BX.addCustomEvent('Grid::updated', BX.proxy(this._onNoSelectedRows, this));
			},
			unbindOnRowsEvents() {
				BX.removeCustomEvent('Grid::thereSelectedRows', BX.proxy(this._onThereSelectedRows, this));
				BX.removeCustomEvent('Grid::allRowsSelected', BX.proxy(this._onThereSelectedRows, this));
				BX.removeCustomEvent('Grid::noSelectedRows', BX.proxy(this._onNoSelectedRows, this));
				BX.removeCustomEvent('Grid::allRowsUnselected', BX.proxy(this._onNoSelectedRows, this));
				BX.removeCustomEvent('Grid::updated', BX.proxy(this._onNoSelectedRows, this));
			},
			bindOnWindowEvents() {
				BX.bind(window, 'resize', BX.proxy(this._onResize, this));
				document.addEventListener('scroll', BX.proxy(this._onScroll, this), BX.Grid.Utils.listenerParams({
					passive: true
				}));
			},
			unbindOnWindowEvents() {
				BX.unbind(window, 'resize', BX.proxy(this._onResize, this));
				document.removeEventListener('scroll', BX.proxy(this._onScroll, this), BX.Grid.Utils.listenerParams({
					passive: true
				}));
			},
			getPanel() {
				this.panel = this.panel || this.parent.getActionsPanel().getPanel();
				return this.panel;
			},
			getScrollBottom() {
				return BX.scrollTop(window) + this.getWindowHeight();
			},
			getPanelRect() {
				if (!BX.type.isPlainObject(this.panelRect)) {
					this.panelRect = BX.pos(this.getPanel());
				}
				return this.panelRect;
			},
			getPanelPrevBottom() {
				const prev = BX.previousSibling(this.getPanel());
				return BX.pos(prev).bottom + parseFloat(BX.style(prev, 'margin-bottom'));
			},
			getWindowHeight() {
				this.windowHeight = this.windowHeight || BX.height(window);
				return this.windowHeight;
			},
			pinPanel(withAnimation) {
				const panel = this.getPanel();
				const width = BX.width(this.getPanel().parentNode);
				const height = BX.height(this.getPanel().parentNode);
				const bodyRect = BX.pos(this.parent.getBody());
				const offset = this.getStartDiffPanelPosition();
				panel.parentNode.style.setProperty('height', `${height}px`);
				panel.style.setProperty('transform', `translateY(${offset}px)`);
				panel.classList.add('main-grid-fixed-bottom');
				panel.style.setProperty('width', `${width}px`);
				panel.style.removeProperty('position');
				panel.style.removeProperty('top');
				requestAnimationFrame(() => {
					if (withAnimation !== false) {
						panel.style.setProperty('transition', 'transform 200ms ease');
					}
					panel.style.setProperty('transform', 'translateY(0)');
				});
				if (this.isNeedPinAbsolute() && !this.absolutePin) {
					this.absolutePin = true;
					panel.style.removeProperty('transition');
					panel.style.setProperty('position', 'absolute');
					panel.style.setProperty('top', `${bodyRect.top}px`);
				}
				if (!this.isNeedPinAbsolute() && this.absolutePin) {
					this.absolutePin = false;
				}
				this.adjustPanelPosition();
				this.pinned = true;
			},
			unpinPanel(withAnimation) {
				const panel = this.getPanel();
				const panelRect = BX.pos(panel);
				const parentRect = BX.pos(panel.parentNode);
				const offset = Math.abs(panelRect.bottom - parentRect.bottom);
				if (withAnimation !== false) {
					panel.style.setProperty('transition', 'transform 200ms ease');
				}
				const translateOffset = offset < panelRect.height ? `${offset}px` : '100%';
				panel.style.setProperty('transform', `translateY(${translateOffset})`);
				const delay = function (cb, delay) {
					if (withAnimation !== false) {
						return setTimeout(cb, delay);
					}
					cb();
				};
				delay(() => {
					panel.parentNode.style.removeProperty('height');
					panel.classList.remove('main-grid-fixed-bottom');
					panel.style.removeProperty('transition');
					panel.style.removeProperty('transform');
					panel.style.removeProperty('width');
					panel.style.removeProperty('position');
					panel.style.removeProperty('top');
				}, withAnimation === false ? 0 : 200);
				this.pinned = false;
			},
			isSelectedRows() {
				return this.isSelected;
			},
			isNeedPinAbsolute() {
				return BX.pos(this.parent.getBody()).top + this.getPanelRect().height >= this.getScrollBottom();
			},
			isNeedPin() {
				return this.getScrollBottom() - this.getPanelRect().height <= this.getPanelPrevBottom();
			},
			adjustPanelPosition() {
				const scrollX = window.pageXOffset;
				this.lastScrollX = this.lastScrollX === null ? scrollX : this.lastScrollX;
				BX.Grid.Utils.requestAnimationFrame(BX.proxy(function () {
					if (scrollX !== this.lastScrollX) {
						const panelPos = this.getPanelRect();
						BX.style(this.getPanel(), 'left', `${panelPos.left - scrollX}px`);
					}
				}, this));
				this.lastScrollX = scrollX;
			},
			pinController(withAnimation) {
				if (this.getPanel()) {
					if (!this.isPinned() && this.isNeedPin() && this.isSelectedRows()) {
						return this.pinPanel(withAnimation);
					}
					if (this.isPinned() && !this.isNeedPin() || !this.isSelectedRows()) {
						this.unpinPanel(withAnimation);
					}
				}
			},
			getEndDiffPanelPosition() {
				const panelPos = BX.pos(this.getPanel());
				const prevPanelPos = BX.pos(BX.previousSibling(this.getPanel()));
				const scrollTop = BX.scrollTop(window);
				const scrollBottom = scrollTop + BX.height(window);
				let diff = panelPos.height + this.offset;
				const prevPanelBottom = prevPanelPos.bottom + parseFloat(BX.style(this.getPanel(), 'margin-top'));
				if (prevPanelBottom < scrollBottom && prevPanelBottom + panelPos.height > scrollBottom) {
					diff = Math.abs(scrollBottom - (prevPanelBottom + panelPos.height));
				}
				return diff;
			},
			getStartDiffPanelPosition() {
				const panelPos = BX.pos(this.getPanel());
				const scrollTop = BX.scrollTop(window);
				const scrollBottom = scrollTop + BX.height(window);
				let diff = panelPos.height;
				if (panelPos.bottom > scrollBottom && panelPos.top < scrollBottom) {
					diff = panelPos.bottom - scrollBottom;
				}
				return diff;
			},
			isPinned() {
				return this.pinned;
			},
			_onThereSelectedRows() {
				this.bindOnWindowEvents();
				this.isSelected = true;
				if (this.lastIsSelected) {
					this.pinController();
				} else {
					this.lastIsSelected = true;
					this.pinController();
				}
			},
			_onNoSelectedRows() {
				this.unbindOnWindowEvents();
				this.isSelected = false;
				this.pinController();
				this.lastIsSelected = false;
			},
			_onScroll() {
				this.pinController(false);
			},
			_onResize() {
				this.windowHeight = BX.height(window);
				this.panel = this.parent.getActionsPanel().getPanel();
				this.panelRect = this.getPanel().getBoundingClientRect();
				this.pinController(false);
			}
		};
	})();

	/**
	 * @memberOf BX.Grid
	 */
	class Realtime extends main_core_events.EventEmitter {
		constructor(options) {
			super();
			this.setEventNamespace('BX.Grid.Realtime');
			this.options = {
				...options
			};
		}
		addRow(options) {
			const {
				grid
			} = this.options;
			const row = grid.getTemplateRow();
			row.makeCountable();
			grid.hideEmptyStub();
			if (main_core.Type.isNumber(options.id) || main_core.Type.isStringFilled(options.id)) {
				row.setId(options.id);
			} else {
				throw new ReferenceError('id is not number or string');
			}
			if (main_core.Type.isArrayFilled(options.actions)) {
				row.setActions(options.actions);
			}
			if (main_core.Type.isPlainObject(options.columns)) {
				row.setCellsContent(options.columns);
			}
			if (main_core.Type.isPlainObject(options.cellActions)) {
				row.setCellActions(options.cellActions);
			}
			if (main_core.Type.isPlainObject(options.counters)) {
				const preparedCounters = Object.entries(options.counters).reduce((acc, [columnId, counter]) => {
					if (main_core.Type.isPlainObject(counter)) {
						acc[columnId] = {
							...counter,
							isDouble: counter.isDouble ?? false,
							secondaryColor: counter.secondaryColor,
							animation: main_core.Text.toBoolean(counter.animation)
						};
					}
					return acc;
				}, {});
				row.setCounters(preparedCounters);
			}
			if (options.prepend === true) {
				row.prependTo(grid.getBody());
			} else if (options.append === true) {
				row.appendTo(grid.getBody());
			} else if (main_core.Type.isNumber(options.insertBefore) || main_core.Type.isStringFilled(options.insertBefore)) {
				const targetRow = grid.getRows().getById(options.insertBefore);
				if (targetRow) {
					BX.Dom.insertBefore(row.getNode(), targetRow.getNode());
				}
			} else if (main_core.Type.isNumber(options.insertAfter) || main_core.Type.isStringFilled(options.insertAfter)) {
				const targetRow = grid.getRows().getById(options.insertAfter);
				if (targetRow) {
					BX.Dom.insertAfter(row.getNode(), targetRow.getNode());
				}
			} else {
				throw new ReferenceError('prepend, append, insertBefore or insertAfter not filled');
			}
			row.show();
			if (options.animation !== false) {
				row.enableAbsolutePosition();
				const movedElements = grid.getRows().getSourceBodyChild().filter(currentRow => {
					return currentRow.rowIndex > row.getIndex();
				});
				const fakeRowNode = document.createElement('tr');
				main_core.Dom.style(fakeRowNode, {
					height: '0px',
					transition: '200ms height linear'
				});
				main_core.Dom.append(fakeRowNode, grid.getBody());
				const offset = row.getHeight();
				main_core.Dom.style(fakeRowNode, 'height', `${offset}px`);
				movedElements.forEach(element => {
					main_core.Dom.style(element, {
						transition: '200ms transform linear',
						transform: `translateY(${offset}px) translateZ(0)`
					});
				});
				main_core.Dom.addClass(row.getNode(), 'main-ui-grid-show-new-row');
				main_core.Event.bind(row.getNode(), 'animationend', event => {
					if (event.animationName === 'showNewRow') {
						movedElements.forEach(element => {
							main_core.Dom.style(element, {
								transition: null,
								transform: null
							});
						});
						main_core.Dom.remove(fakeRowNode);
						row.disableAbsolutePosition();
						main_core.Dom.removeClass(row.getNode(), 'main-ui-grid-show-new-row');
					}
				});
			}
			grid.getRows().reset();
			grid.bindOnRowEvents();
			grid.updateCounterDisplayed();
			grid.announceUpdated(grid.updateCounterSelected());
			if (grid.getParam('ALLOW_ROWS_SORT')) {
				grid.rowsSortable.reinit();
			}
			if (grid.getParam('ALLOW_COLUMNS_SORT')) {
				grid.colsSortable.reinit();
			}
		}
		showStub(options = {}) {
			const tr = document.createElement('tr');
			main_core.Dom.addClass(tr, 'main-grid-row main-grid-row-empty main-grid-row-body');
			const td = document.createElement('td');
			main_core.Dom.addClass(td, 'main-grid-cell main-grid-cell-center');
			const colspan = this.options.grid.getRows().getHeadFirstChild().getCells().length;
			main_core.Dom.attr(td, 'colspan', colspan);
			const content = (() => {
				if (main_core.Type.isPlainObject(options.content)) {
					const result = [];
					if (main_core.Type.isStringFilled(options.content.title)) {
						result.push(main_core.Tag.render`
							<div class="main-grid-empty-block-title">
								${options.content.title}
							</div>
						`);
					}
					if (main_core.Type.isStringFilled(options.content.description)) {
						result.push(main_core.Tag.render`
							<div class="main-grid-empty-block-description">
								${options.content.description}
							</div>
						`);
					}
					return result;
				}
				if (main_core.Type.isStringFilled(options.content) || main_core.Type.isDomNode(options.content)) {
					return options.content;
				}
				return [main_core.Tag.render`<div class="main-grid-empty-image"></div>`, main_core.Tag.render`<div class="main-grid-empty-text">${this.options.grid.getParam('EMPTY_STUB_TEXT')}</div>`];
			})();
			const container = main_core.Tag.render`
			<div class="main-grid-empty-block">
				<div class="main-grid-empty-inner">
					${content}
				</div>
			</div>
		`;
			main_core.Dom.append(container, td);
			main_core.Dom.append(td, tr);
			const oldStub = this.options.grid.getBody().querySelector('.main-grid-row-empty');
			if (oldStub) {
				main_core.Dom.remove(oldStub);
			}
			main_core.Dom.append(tr, this.options.grid.getBody());
			this.options.grid.getRows().getBodyChild().forEach(row => {
				row.hide();
			});
			this.options.grid.adjustEmptyTable(this.options.grid.getRows().getSourceBodyChild());
		}
	}
	const namespace$2 = main_core.Reflection.namespace('BX.Grid');
	namespace$2.Realtime = Realtime;

	(function () {

		BX.namespace('BX.Grid');
		BX.Grid.Resize = function (parent) {
			this.parent = null;
			this.lastRegisterButtons = null;
			this.init(parent);
		};
		BX.Grid.Resize.prototype = {
			init(parent) {
				this.parent = parent;
				BX.addCustomEvent(window, 'Grid::updated', BX.proxy(this.registerTableButtons, this));
				BX.addCustomEvent(window, 'Grid::headerUpdated', BX.proxy(this.registerPinnedTableButtons, this));
				this.registerTableButtons();
				this.registerPinnedTableButtons();
			},
			destroy() {
				BX.removeCustomEvent(window, 'Grid::updated', BX.proxy(this.registerTableButtons, this));
				BX.removeCustomEvent(window, 'Grid::headerUpdated', BX.proxy(this.registerPinnedTableButtons, this));
				BX.type.isArray(this.lastRegisterButtons) && this.lastRegisterButtons.forEach(jsDD.unregisterObject);
				(this.getButtons() || []).forEach(jsDD.unregisterObject);
			},
			registerTableButtons() {
				(this.getButtons() || []).forEach(this.register, this);
				this.registerPinnedTableButtons();
			},
			register(item) {
				if (BX.type.isDomNode(item)) {
					item.onbxdragstart = BX.delegate(this._onDragStart, this);
					item.onbxdragstop = BX.delegate(this._onDragEnd, this);
					item.onbxdrag = BX.delegate(this._onDrag, this);
					jsDD.registerObject(item);
				}
			},
			registerPinnedTableButtons() {
				if (this.parent.getParam('ALLOW_PIN_HEADER')) {
					const pinnedTableButtons = this.getPinnedTableButtons();
					if (BX.type.isArray(this.lastRegisterButtons) && this.lastRegisterButtons.length > 0) {
						this.lastRegisterButtons.forEach(jsDD.unregisterObject);
					}
					this.lastRegisterButtons = pinnedTableButtons;
					(this.getPinnedTableButtons() || []).forEach(this.register, this);
				}
			},
			getButtons() {
				return BX.Grid.Utils.getByClass(this.parent.getRows().getHeadFirstChild().getNode(), this.parent.settings.get('classResizeButton'));
			},
			getPinnedTableButtons() {
				return BX.Grid.Utils.getByClass(this.parent.getPinHeader().getFixedTable(), this.parent.settings.get('classResizeButton'));
			},
			_onDragStart() {
				const cell = BX.findParent(jsDD.current_node, {
					className: this.parent.settings.get('classHeadCell')
				});
				const cells = this.parent.getRows().getHeadFirstChild().getCells();
				const cellsKeys = Object.keys(cells);
				let cellContainer;
				this.__overlay = BX.create('div', {
					props: {
						className: 'main-grid-cell-overlay'
					}
				});
				BX.append(this.__overlay, cell);
				this.__resizeCell = cell.cellIndex;
				this.resizeColumnName = cell.dataset.name;
				cellsKeys.forEach(key => {
					if (!BX.hasClass(cells[key], 'main-grid-special-empty')) {
						let width = BX.width(cells[key]);
						if (key > 0) {
							width -= parseInt(BX.style(cells[key], 'border-left-width'));
							width -= parseInt(BX.style(cells[key], 'border-right-width'));
						}
						BX.width(cells[key], width);
						cellContainer = BX.firstChild(cells[key]);
						BX.width(cellContainer, width);
					}
				});
			},
			_onDrag(x) {
				const table = this.parent.getTable();
				const fixedTable = this.parent.getParam('ALLOW_PIN_HEADER') ? this.parent.getPinHeader().getFixedTable() : null;
				const cell = table.rows[0].cells[this.__resizeCell];
				let fixedCell;
				let fixedCellContainer;
				const cpos = BX.pos(cell);
				const cellAttrWidth = parseFloat(cell.style.width);
				let sX;
				x -= cpos.left;
				sX = x;
				if (cpos.width > cellAttrWidth) {
					x = cpos.width;
				}
				x = sX > x ? sX : x;
				x = Math.max(x, 80);
				if (x !== cpos.width) {
					const headCells = this.parent.getAllRows()[0].children;

					// A right-fixed column is matched by its distance from the end of the row:
					// the leading service cells differ from row to row.
					const column = cell.classList.contains('main-grid-fixed-column-right') ? this.parent.getColumnCellsByRightOffset(headCells.length - 1 - this.__resizeCell) : this.parent.getColumnByIndex(this.__resizeCell);

					// Resize current column
					column.forEach(item => {
						item.style.width = `${x}px`;
						item.style.minWidth = `${x}px`;
						item.style.maxWidth = `${x}px`;

						// A ROW_LAYOUT body cell holds the content container itself, which keeps
						// its side margins within the cell only at its automatic width.
						const isBodyContainer = BX.Dom.hasClass(item.parentElement, 'main-grid-row-body') && BX.Dom.hasClass(item.firstElementChild, this.parent.settings.get('classCellContainer'));
						if (!isBodyContainer) {
							BX.Dom.style(item.firstElementChild, 'width', `${x}px`);
						}
					});

					// A fixed column is taken out of the table layout, and its placeholder
					// holds the width in place of it - left and right pinned alike.
					column.forEach(item => {
						const placeholder = item.nextElementSibling;
						if (placeholder && placeholder.classList.contains('main-grid-fixed-column-placeholder')) {
							placeholder.style.width = `${x}px`;
							placeholder.style.minWidth = `${x}px`;
							placeholder.style.maxWidth = `${x}px`;
						}
					});
					this.parent.adjustFixedColumnsPosition();
					this.parent.adjustFadePosition(this.parent.getFadeOffset());
					if (BX.type.isDomNode(fixedTable) && BX.type.isDomNode(fixedTable.rows[0])) {
						fixedCell = fixedTable.rows[0].cells[this.__resizeCell];
						fixedCellContainer = BX.firstChild(fixedCell);
						fixedCellContainer.style.width = `${x}px`;
						fixedCellContainer.style.minWidth = `${x}px`;
						fixedCell.style.width = `${x}px`;
						fixedCell.style.minWidth = `${x}px`;
					}
				}
				BX.onCustomEvent(window, 'Grid::columnResize', []);
			},
			_onDragEnd() {
				this.saveSizes();
				const cell = BX.findParent(jsDD.current_node, {
					className: this.parent.settings.get('classHeadCell')
				});
				const overlay = cell.querySelector('.main-grid-cell-overlay');
				if (overlay) {
					BX.Dom.remove(overlay);
				}
			},
			getColumnSizes() {
				const cells = this.parent.getRows().getHeadFirstChild().getCells();
				const columns = {};
				let name;
				[].forEach.call(cells, current => {
					name = BX.data(current, 'name');
					if (BX.type.isNotEmptyString(name)) {
						columns[name] = BX.width(current);
					}
				}, this);
				return columns;
			},
			saveSizes() {
				const resized = BX.type.isNotEmptyString(this.resizeColumnName) ? [this.resizeColumnName] : [];
				this.parent.getUserOptions().setColumnSizes(this.getColumnSizes(), 1, resized);
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * BX.Grid.Row
		 * @param {BX.Main.Grid} parent
		 * @param {HtmlElement} node
		 * @constructor
		 */
		BX.Grid.Row = function (parent, node) {
			this.node = null;
			this.checkbox = null;
			this.sort = null;
			this.actions = null;
			this.settings = null;
			this.index = null;
			this.actionsButton = null;
			this.parent = null;
			this.depth = null;
			this.parentId = null;
			this.editData = null;
			this.custom = null;
			this.onElementClick = this.onElementClick.bind(this);
			this.init(parent, node);
			this.initElementsEvents();
		};

		// noinspection JSUnusedGlobalSymbols,JSUnusedGlobalSymbols
		BX.Grid.Row.prototype = {
			init(parent, node) {
				if (BX.type.isDomNode(node)) {
					this.node = node;
					this.parent = parent;
					this.settings = new BX.Grid.Settings();
					this.bindNodes = [];
					if (this.isBodyChild()) {
						this.bindNodes = [].slice.call(this.node.parentNode.querySelectorAll(`tr[data-bind="${this.getId()}"]`));
						if (this.bindNodes.length > 0) {
							this.node.addEventListener('mouseover', this.onMouseOver.bind(this));
							this.node.addEventListener('mouseleave', this.onMouseLeave.bind(this));
							this.bindNodes.forEach(function (row) {
								row.addEventListener('mouseover', this.onMouseOver.bind(this));
								row.addEventListener('mouseleave', this.onMouseLeave.bind(this));
								row.addEventListener('click', () => {
									if (this.isSelected()) {
										this.unselect();
									} else {
										this.select();
									}
								});
							}, this);
						}
					}
					if (this.parent.getParam('ALLOW_CONTEXT_MENU')) {
						BX.bind(this.getNode(), 'contextmenu', BX.delegate(this._onRightClick, this));
					}
				}
			},
			onMouseOver() {
				this.node.classList.add('main-grid-row-over');
				this.bindNodes.forEach(row => {
					row.classList.add('main-grid-row-over');
				});
			},
			onMouseLeave() {
				this.node.classList.remove('main-grid-row-over');
				this.bindNodes.forEach(row => {
					row.classList.remove('main-grid-row-over');
				});
			},
			isCustom() {
				if (this.custom === null) {
					this.custom = BX.hasClass(this.getNode(), this.parent.settings.get('classRowCustom'));
				}
				return this.custom;
			},
			_onRightClick(event) {
				event.preventDefault();
				if (!this.isHeadChild()) {
					this.showActionsMenu(event);
				}
			},
			getDefaultAction() {
				return BX.data(this.getNode(), 'default-action');
			},
			getEditorValue() {
				const self = this;
				const cells = this.getCells();
				const values = {};
				let cellValues;
				[].forEach.call(cells, current => {
					cellValues = self.getCellEditorValue(current);
					if (BX.type.isArray(cellValues)) {
						cellValues.forEach(cellValue => {
							values[cellValue.NAME] = cellValue.VALUE === undefined ? '' : cellValue.VALUE;
							if (cellValue.hasOwnProperty('RAW_NAME') && cellValue.hasOwnProperty('RAW_VALUE')) {
								values[`${cellValue.NAME}_custom`] = values[`${cellValue.NAME}_custom`] || {};
								values[`${cellValue.NAME}_custom`][cellValue.RAW_NAME] = values[`${cellValue.NAME}_custom`][cellValue.RAW_NAME] || cellValue.RAW_VALUE;
							}
						});
					} else if (cellValues) {
						values[cellValues.NAME] = cellValues.VALUE === undefined ? '' : cellValues.VALUE;
					}
				});
				return values;
			},
			/**
			 * @deprecated
			 * @use this.getEditorValue()
			 */
			editGetValues() {
				return this.getEditorValue();
			},
			getCellEditorValue(cell) {
				const editor = BX.Grid.Utils.getByClass(cell, this.parent.settings.get('classEditor'), true);
				let result = null;
				if (BX.type.isDomNode(editor)) {
					if (BX.hasClass(editor, 'main-grid-editor-checkbox')) {
						result = {
							NAME: editor.getAttribute('name'),
							VALUE: editor.checked ? 'Y' : 'N'
						};
					} else if (BX.hasClass(editor, 'main-grid-editor-custom')) {
						result = this.getCustomValue(editor);
					} else if (BX.hasClass(editor, 'main-grid-editor-money')) {
						result = this.getMoneyValue(editor);
					} else if (BX.hasClass(editor, 'main-ui-multi-select')) {
						result = this.getMultiSelectValues(editor);
					} else {
						result = this.getImageValue(editor);
					}
				}
				return result;
			},
			isEdit() {
				return BX.hasClass(this.getNode(), 'main-grid-row-edit');
			},
			hide() {
				BX.addClass(this.getNode(), this.parent.settings.get('classHide'));
			},
			show() {
				BX.Dom.attr(this.getNode(), 'hidden', null);
				BX.removeClass(this.getNode(), this.parent.settings.get('classHide'));
			},
			isShown() {
				return !BX.hasClass(this.getNode(), this.parent.settings.get('classHide'));
			},
			isNotCount() {
				return BX.hasClass(this.getNode(), this.parent.settings.get('classNotCount'));
			},
			getContentContainer(target) {
				if (BX.Type.isDomNode(target)) {
					const cell = target.closest('.main-grid-cell');
					if (BX.Type.isDomNode(cell)) {
						return cell.querySelector('.main-grid-cell-content');
					}
				}
				return target;
			},
			getContent(cell) {
				const container = this.getContentContainer(cell);
				let content;
				if (BX.type.isDomNode(container)) {
					content = BX.html(container);
				}
				return content;
			},
			getMoneyValue(editor) {
				const result = [];
				const filteredValue = {
					PRICE: {},
					CURRENCY: {},
					HIDDEN: {}
				};
				const fieldName = editor.getAttribute('data-name');
				const inputs = [].slice.call(editor.querySelectorAll('input'));
				inputs.forEach(element => {
					result.push({
						NAME: fieldName,
						RAW_NAME: element.name,
						RAW_VALUE: element.value || '',
						VALUE: element.value || ''
					});
					if (element.classList.contains('main-grid-editor-money-price')) {
						filteredValue.PRICE = {
							NAME: element.name,
							VALUE: element.value
						};
					} else if (element.type === ' hidden') {
						filteredValue.HIDDEN[element.name] = element.value;
					}
				});
				const currencySelector = editor.querySelector('.main-grid-editor-dropdown');
				if (currencySelector) {
					const currencyFieldName = currencySelector.getAttribute('name');
					if (BX.type.isNotEmptyString(currencyFieldName)) {
						result.push({
							NAME: fieldName,
							RAW_NAME: currencyFieldName,
							RAW_VALUE: currencySelector.dataset.value || '',
							VALUE: currencySelector.dataset.value || ''
						});
						filteredValue.CURRENCY = {
							NAME: currencyFieldName,
							VALUE: currencySelector.dataset.value
						};
					}
				}
				result.push({
					NAME: fieldName,
					VALUE: filteredValue
				});
				return result;
			},
			getCustomValue(editor) {
				const map = new Map();
				const name = editor.getAttribute('data-name');
				const inputs = [].slice.call(editor.querySelectorAll('input, select, textarea'));
				inputs.forEach(element => {
					if (element.name === '') {
						return;
					}
					if (element.hasAttribute('data-ignore-field')) {
						return;
					}
					let resultObject = {
						NAME: name,
						RAW_NAME: element.name,
						RAW_VALUE: element.value,
						VALUE: element.value
					};
					switch (element.tagName) {
						case 'SELECT':
							{
								const selectValues = element.multiple ? [...element.selectedOptions].map(option => option.value) : [element.value];
								if (this.isMultipleCustomValue(element.name)) {
									resultObject = this.collectMultipleCustomValue(map, resultObject, selectValues);
								} else if (element.multiple) {
									resultObject.RAW_VALUE = selectValues;
									resultObject.VALUE = [...selectValues];
								}
								map.set(element.name, resultObject);
								break;
							}
						case 'INPUT':
							switch (element.type.toUpperCase()) {
								case 'RADIO':
								case 'CHECKBOX':
									if (element.checked) {
										if (this.isMultipleCustomValue(element.name)) {
											resultObject = this.collectMultipleCustomValue(map, resultObject, [element.value]);
										}
										map.set(element.name, resultObject);
									}
									break;
								case 'FILE':
									if (this.isMultipleCustomValue(element.name)) {
										const files = [...element.files];
										if (files.length === 0) {
											// Consumers detect a file field by the name of an emptied uploader input
											if (!map.has(element.name)) {
												resultObject.RAW_VALUE = undefined;
												resultObject.VALUE = undefined;
												map.set(element.name, resultObject);
											}
											break;
										}
										resultObject = this.collectMultipleCustomValue(map, resultObject, files);
									} else {
										resultObject.RAW_VALUE = element.files[0];
										resultObject.VALUE = element.files[0];
									}
									map.set(element.name, resultObject);
									break;
								default:
									if (this.isMultipleCustomValue(element.name)) {
										resultObject = this.collectMultipleCustomValue(map, resultObject, [element.value]);
									}
									map.set(element.name, resultObject);
							}
							break;
						default:
							if (this.isMultipleCustomValue(element.name)) {
								resultObject = this.collectMultipleCustomValue(map, resultObject, [element.value]);
							}
							map.set(element.name, resultObject);
							break;
					}
				});
				const result = [];
				map.forEach(value => {
					result.push(value);
				});
				return result;
			},
			/**
			 * Appends the values of one input to the entry its array name already holds,
			 * so that every input of a multiple property is kept instead of the last one.
			 * Empty strings are dropped: markup of a multiple property carries a reset input
			 * of its own, and an empty option of a select stands for no value at all.
			 */
			collectMultipleCustomValue(map, resultObject, values) {
				const filtered = values.filter(value => value !== '');
				const collected = map.get(resultObject.RAW_NAME);
				if (collected === undefined || !Array.isArray(collected.VALUE)) {
					return {
						...resultObject,
						RAW_VALUE: [...filtered],
						VALUE: [...filtered]
					};
				}
				collected.RAW_VALUE.push(...filtered);
				collected.VALUE.push(...filtered);
				return collected;
			},
			isMultipleCustomValue(elementName) {
				return elementName.length > 2 && elementName.lastIndexOf('[]') === elementName.length - 2;
			},
			getImageValue(editor) {
				let result = null;
				if (BX.hasClass(editor, 'main-grid-image-editor')) {
					const input = editor.querySelector('.main-grid-image-editor-file-input');
					if (input) {
						result = {
							NAME: input.name,
							VALUE: input.files[0]
						};
					} else {
						const fakeInput = editor.querySelector('.main-grid-image-editor-fake-file-input');
						if (fakeInput) {
							result = {
								NAME: fakeInput.name,
								VALUE: fakeInput.value
							};
						}
					}
				} else if (editor.value) {
					result = {
						NAME: editor.getAttribute('name'),
						VALUE: editor.value
					};
				} else {
					result = {
						NAME: editor.getAttribute('name'),
						VALUE: BX.data(editor, 'value')
					};
				}
				return result;
			},
			getMultiSelectValues(editor) {
				const value = JSON.parse(BX.data(editor, 'value'));
				return {
					NAME: editor.getAttribute('name'),
					VALUE: main_core.Type.isArrayFilled(value) ? value : ''
				};
			},
			/**
			 * @param {HTMLTableCellElement} cell
			 * @return {?HTMLElement}
			 */
			getEditorContainer(cell) {
				return BX.Grid.Utils.getByClass(cell, this.parent.settings.get('classEditorContainer'), true);
			},
			/**
			 * @return {HTMLElement}
			 */
			getCollapseButton() {
				if (!this.collapseButton) {
					this.collapseButton = BX.Grid.Utils.getByClass(this.getNode(), this.parent.settings.get('classCollapseButton'), true);
				}
				return this.collapseButton;
			},
			stateLoad() {
				BX.addClass(this.getNode(), this.parent.settings.get('classRowStateLoad'));
			},
			stateUnload() {
				BX.removeClass(this.getNode(), this.parent.settings.get('classRowStateLoad'));
			},
			stateExpand() {
				BX.addClass(this.getNode(), this.parent.settings.get('classRowStateExpand'));
			},
			stateCollapse() {
				BX.removeClass(this.getNode(), this.parent.settings.get('classRowStateExpand'));
			},
			getParentId() {
				if (this.parentId === null) {
					this.parentId = BX.data(this.getNode(), 'parent-id');
					if (typeof this.parentId !== 'undefined' && this.parentId !== null) {
						this.parentId = this.parentId.toString();
					}
				}
				return this.parentId;
			},
			/**
			 * @return {DOMStringMap}
			 */
			getDataset() {
				return this.getNode().dataset;
			},
			/**
			 * Gets row depth level
			 * @return {?number}
			 */
			getDepth() {
				if (this.depth === null) {
					this.depth = BX.data(this.getNode(), 'depth');
				}
				return this.depth;
			},
			/**
			 * Set row depth
			 * @param {number} depth
			 */
			setDepth(depth) {
				depth = parseInt(depth);
				if (BX.type.isNumber(depth)) {
					const depthOffset = depth - parseInt(this.getDepth());
					const Rows = this.parent.getRows();
					this.getDataset().depth = depth;
					this.getShiftCells().forEach(cell => {
						BX.data(cell, 'depth', depth);
						BX.style(cell, 'padding-left', `${depth * 20}px`);
					});
					Rows.getRowsByParentId(this.getId(), true).forEach(row => {
						const childDepth = parseInt(depthOffset) + parseInt(row.getDepth());
						row.getDataset().depth = childDepth;
						row.getShiftCells().forEach(cell => {
							BX.data(cell, 'depth', childDepth);
							BX.style(cell, 'padding-left', `${childDepth * 20}px`);
						});
					});
				}
			},
			/**
			 * Sets parent id
			 * @param {string|number} id
			 */
			setParentId(id) {
				this.getDataset().parentId = id;
			},
			/**
			 * @return {HTMLTableRowElement}
			 */
			getShiftCells() {
				return BX.Grid.Utils.getBySelector(this.getNode(), 'td[data-shift="true"]');
			},
			showChildRows() {
				this.showDirectChildRows();
				this.parent.updateCounterDisplayed();
				this.parent.updateCounterSelected();
				this.parent.adjustCheckAllCheckboxes();
				this.parent.adjustRows();
			},
			showDirectChildRows() {
				this.getDirectChildren().forEach(row => {
					row.show();
					if (row.isExpand()) {
						row.showDirectChildRows();
					}
				});
			},
			/**
			 * @return {BX.Grid.Row[]}
			 */
			getChildren() {
				const functionName = this.isCustom() ? 'getRowsByGroupId' : 'getRowsByParentId';
				const id = this.isCustom() ? this.getGroupId() : this.getId();
				return this.parent.getRows()[functionName](id, true);
			},
			/**
			 * Gets rows directly nested into this one
			 * @return {BX.Grid.Row[]}
			 */
			getDirectChildren() {
				if (this.isCustom()) {
					return this.parent.getRows().getTopLevelRowsByGroupId(this.getGroupId());
				}
				return this.parent.getRows().getRowsByParentId(this.getId());
			},
			hideChildRows() {
				this.getChildren().forEach(row => {
					row.hide();
				});
				this.parent.updateCounterDisplayed();
				this.parent.updateCounterSelected();
				this.parent.adjustCheckAllCheckboxes();
				this.parent.adjustRows();
			},
			isChildsLoaded() {
				if (!BX.type.isBoolean(this.childsLoaded)) {
					this.childsLoaded = this.isCustom() || BX.data(this.getNode(), 'child-loaded') === 'true';
				}
				return this.childsLoaded;
			},
			expand() {
				const self = this;
				this.stateExpand();
				if (this.isChildsLoaded()) {
					this.showChildRows();
				} else {
					this.stateLoad();
					this.loadChildRows(rows => {
						rows.reverse().forEach(current => {
							BX.insertAfter(current, self.getNode());
						});
						self.parent.getRows().reset();
						self.parent.bindOnRowEvents();
						if (self.parent.getParam('ALLOW_ROWS_SORT')) {
							self.parent.getRowsSortable().reinit();
						}
						if (self.parent.getParam('ALLOW_COLUMNS_SORT')) {
							self.parent.getColsSortable().reinit();
						}
						self.stateUnload();
						BX.data(self.getNode(), 'child-loaded', 'true');
						self.parent.updateCounterDisplayed();
						self.parent.updateCounterSelected();
						self.parent.adjustCheckAllCheckboxes();
					});
				}
			},
			collapse() {
				this.stateCollapse();
				this.hideChildRows();
			},
			isExpand() {
				return BX.hasClass(this.getNode(), this.parent.settings.get('classRowStateExpand'));
			},
			toggleChildRows() {
				if (this.isExpand()) {
					this.collapse();
				} else {
					this.expand();
				}
			},
			loadChildRows(callback) {
				if (BX.type.isFunction(callback)) {
					const self = this;
					let depth = parseInt(this.getDepth());
					const action = this.parent.getUserOptions().getAction('GRID_GET_CHILD_ROWS');
					depth = BX.type.isNumber(depth) ? depth + 1 : 1;
					this.parent.getData().request('', 'POST', {
						action,
						parent_id: this.getId(),
						depth
					}, null, function () {
						const rows = this.getRowsByParentId(self.getId());
						callback.apply(null, [rows]);
					});
				}
			},
			update(data, url, callback) {
				data = data || '';
				const action = this.parent.getUserOptions().getAction('GRID_UPDATE_ROW');
				const depth = this.getDepth();
				const id = this.getId();
				const parentId = this.getParentId();
				const rowData = {
					id,
					parentId,
					action,
					depth,
					data
				};
				const self = this;
				this.stateLoad();
				this.parent.getData().request(url, 'POST', rowData, null, function () {
					const bodyRows = this.getBodyRows();
					self.parent.getUpdater().updateBodyRows(bodyRows);
					self.stateUnload();
					self.parent.getRows().reset();
					self.parent.getUpdater().updateFootRows(this.getFootRows());
					self.parent.getUpdater().updatePagination(this.getPagination());
					self.parent.getUpdater().updateMoreButton(this.getMoreButton());
					self.parent.getUpdater().updateCounterTotal(this.getCounterTotal());
					self.parent.bindOnRowEvents();
					self.parent.adjustEmptyTable(bodyRows);
					self.parent.bindOnMoreButtonEvents();
					self.parent.bindOnClickPaginationLinks();
					self.parent.updateCounterDisplayed();
					self.parent.updateCounterSelected();
					if (self.parent.getParam('ALLOW_COLUMNS_SORT')) {
						self.parent.colsSortable.reinit();
					}
					if (self.parent.getParam('ALLOW_ROWS_SORT')) {
						self.parent.rowsSortable.reinit();
					}
					BX.onCustomEvent(window, 'Grid::rowUpdated', [{
						id,
						data,
						grid: self.parent,
						response: this
					}]);
					BX.onCustomEvent(window, 'Grid::updated', [self.parent]);
					if (BX.type.isFunction(callback)) {
						callback({
							id,
							data,
							grid: self.parent,
							response: this
						});
					}
				});
			},
			remove(data, url, callback) {
				data = data || '';
				const action = this.parent.getUserOptions().getAction('GRID_DELETE_ROW');
				const depth = this.getDepth();
				const id = this.getId();
				const parentId = this.getParentId();
				const rowData = {
					id,
					parentId,
					action,
					depth,
					data
				};
				const self = this;
				this.stateLoad();
				this.parent.getData().request(url, 'POST', rowData, null, function () {
					const bodyRows = this.getBodyRows();
					self.parent.getUpdater().updateBodyRows(bodyRows);
					self.stateUnload();
					self.parent.getRows().reset();
					self.parent.getUpdater().updateFootRows(this.getFootRows());
					self.parent.getUpdater().updatePagination(this.getPagination());
					self.parent.getUpdater().updateMoreButton(this.getMoreButton());
					self.parent.getUpdater().updateCounterTotal(this.getCounterTotal());
					self.parent.bindOnRowEvents();
					self.parent.adjustEmptyTable(bodyRows);
					self.parent.bindOnMoreButtonEvents();
					self.parent.bindOnClickPaginationLinks();
					self.parent.updateCounterDisplayed();
					self.parent.updateCounterSelected();
					if (self.parent.getParam('ALLOW_COLUMNS_SORT')) {
						self.parent.colsSortable.reinit();
					}
					if (self.parent.getParam('ALLOW_ROWS_SORT')) {
						self.parent.rowsSortable.reinit();
					}
					BX.onCustomEvent(window, 'Grid::rowRemoved', [{
						id,
						data,
						grid: self.parent,
						response: this
					}]);
					BX.onCustomEvent(window, 'Grid::updated', [self.parent]);
					if (BX.type.isFunction(callback)) {
						callback({
							id,
							data,
							grid: self.parent,
							response: this
						});
					}
				});
			},
			editCancel() {
				const cells = this.getCells();
				const self = this;
				let editorContainer;
				[].forEach.call(cells, current => {
					editorContainer = self.getEditorContainer(current);
					if (BX.type.isDomNode(editorContainer)) {
						BX.remove(self.getEditorContainer(current));
						BX.show(self.getContentContainer(current));
					}
				});
				BX.removeClass(this.getNode(), 'main-grid-row-edit');
			},
			getCellByIndex(index) {
				return this.getCells()[index];
			},
			getEditDataByCellIndex(index) {
				return eval(BX.data(this.getCellByIndex(index), 'edit'));
			},
			getCellNameByCellIndex(index) {
				return BX.data(this.getCellByIndex(index), 'name');
			},
			resetEditData() {
				this.editData = null;
			},
			setEditData(editData) {
				this.editData = editData;
			},
			getEditData() {
				if (this.editData === null) {
					const editableData = this.parent.getParam('EDITABLE_DATA');
					const rowId = this.getId();
					if (BX.type.isPlainObject(editableData) && rowId in editableData) {
						this.editData = editableData[rowId];
					} else {
						this.editData = {};
					}
				}
				return this.editData;
			},
			getCellEditDataByCellIndex(cellIndex) {
				const editData = this.getEditData();
				let result = null;
				cellIndex = parseInt(cellIndex);
				if (BX.type.isNumber(cellIndex) && BX.type.isPlainObject(editData)) {
					const columnEditData = this.parent.getRows().getHeadFirstChild().getEditDataByCellIndex(cellIndex);
					if (BX.type.isPlainObject(columnEditData)) {
						result = columnEditData;
						result.VALUE = editData[columnEditData.NAME];
					}
				}
				return result;
			},
			edit() {
				const cells = this.getCells();
				const self = this;
				let editObject;
				let editor;
				let height;
				let contentContainer;
				[].forEach.call(cells, (current, index) => {
					if (current.dataset.editable === 'true') {
						try {
							editObject = self.getCellEditDataByCellIndex(index);
						} catch (err) {
							throw new Error(err);
						}
						if (self.parent.getEditor().validateEditObject(editObject)) {
							contentContainer = self.getContentContainer(current);
							height = BX.height(contentContainer);
							editor = self.parent.getEditor().getEditor(editObject, height);
							if (!self.getEditorContainer(current) && BX.type.isDomNode(editor)) {
								current.appendChild(editor);
								BX.hide(contentContainer);
							}
						}
					}
				});
				BX.addClass(this.getNode(), 'main-grid-row-edit');
			},
			setDraggable(value) {
				if (value) {
					BX.removeClass(this.getNode(), this.parent.settings.get('classDisableDrag'));
					this.parent.getRowsSortable().register(this.getNode());
				} else {
					BX.addClass(this.getNode(), this.parent.settings.get('classDisableDrag'));
					this.parent.getRowsSortable().unregister(this.getNode());
				}
			},
			isDraggable() {
				return !BX.hasClass(this.getNode(), this.parent.settings.get('classDisableDrag'));
			},
			getNode() {
				return this.node;
			},
			getIndex() {
				return this.getNode().rowIndex;
			},
			getId() {
				return String(BX.data(this.getNode(), 'id'));
			},
			getGroupId() {
				const groupId = BX.data(this.getNode(), 'group-id');

				// The grid does not emit data-group-id itself: a list where only part of the rows
				// are grouped is an ordinary shape, and such a row simply has no group.
				return main_core.Type.isNil(groupId) ? null : groupId.toString();
			},
			getObserver() {
				return BX.Grid.observer;
			},
			getCheckbox() {
				if (!this.checkbox) {
					this.checkbox = BX.Grid.Utils.getByClass(this.getNode(), this.settings.get('classRowCheckbox'), true);
				}
				return this.checkbox;
			},
			hasActionsButton() {
				return BX.Type.isDomNode(this.getActionsButton());
			},
			getActionsMenu() {
				if (!this.actionsMenu && this.hasActionsButton()) {
					const buttonRect = this.getActionsButton().getBoundingClientRect();
					this.actionsMenu = BX.PopupMenu.create(`main-grid-actions-menu-${this.getId()}`, this.getActionsButton(), this.getMenuItems(), {
						autoHide: true,
						offsetTop: -(buttonRect.height / 2 + 26),
						offsetLeft: 30,
						angle: {
							position: 'left',
							offset: buttonRect.height / 2 - 8
						},
						events: {
							onPopupClose: BX.delegate(this._onCloseMenu, this),
							onPopupShow: BX.delegate(this._onPopupShow, this)
						}
					});
					BX.addCustomEvent('Grid::updated', () => {
						if (this.actionsMenu) {
							this.actionsMenu.destroy();
							this.actionsMenu = null;
						}
					});
					BX.bind(this.actionsMenu.popupWindow.popupContainer, 'click', BX.delegate(function (event) {
						const actionsMenu = this.getActionsMenu();
						if (actionsMenu) {
							const target = BX.getEventTarget(event);
							const item = BX.findParent(target, {
								className: 'menu-popup-item'
							}, 10);
							if (!item || !item.dataset.preventCloseContextMenu) {
								actionsMenu.close();
							}
						}
					}, this));
				}
				return this.actionsMenu;
			},
			_onCloseMenu() {
				const button = this.getActionsButton();
				if (button) {
					button.setAttribute('aria-expanded', 'false');
				}
			},
			_onPopupShow(popupMenu) {
				const button = this.getActionsButton();
				popupMenu.setBindElement(button);
				if (button) {
					button.setAttribute('aria-expanded', 'true');
				}
			},
			actionsMenuIsShown() {
				return this.getActionsMenu().popupWindow.isShown();
			},
			showActionsMenu(event) {
				BX.fireEvent(document.body, 'click');
				this.getActionsMenu().popupWindow.show();
				if (event) {
					this.getActionsMenu().popupWindow.popupContainer.style.top = `${event.pageY - 25 + BX.PopupWindow.getOption('offsetTop')}px`;
					this.getActionsMenu().popupWindow.popupContainer.style.left = `${event.pageX + 20 + BX.PopupWindow.getOption('offsetLeft')}px`;
				}
			},
			closeActionsMenu() {
				if (this.actionsMenu && this.actionsMenu.popupWindow) {
					this.actionsMenu.popupWindow.close();
				}
			},
			getMenuItems() {
				return this.getActions() || [];
			},
			getActions() {
				try {
					this.actions = this.actions || eval(BX.data(this.getActionsButton(), this.settings.get('dataActionsKey')));
				} catch {
					this.actions = null;
				}
				return this.actions;
			},
			getActionsButton() {
				if (!this.actionsButton) {
					this.actionsButton = BX.Grid.Utils.getByClass(this.getNode(), this.settings.get('classRowActionButton'), true);
				}
				return this.actionsButton;
			},
			initSelect() {
				if (this.isSelected() && !BX.hasClass(this.getNode(), this.settings.get('classCheckedRow'))) {
					BX.addClass(this.getNode(), this.settings.get('classCheckedRow'));
				}
			},
			getParentNode() {
				let result;
				try {
					result = this.getNode().parentNode;
				} catch {
					result = null;
				}
				return result;
			},
			getParentNodeName() {
				let result;
				try {
					result = this.getParentNode().nodeName;
				} catch {
					result = null;
				}
				return result;
			},
			isSelectable() {
				return !this.isEdit() || this.parent.getParam('ALLOW_EDIT_SELECTION');
			},
			select() {
				let checkbox;
				if (this.isSelectable() && (this.parent.getParam('ADVANCED_EDIT_MODE') || !this.parent.getRows().hasEditable())) {
					checkbox = this.getCheckbox();
					if (checkbox && !BX.data(checkbox, 'disabled')) {
						BX.addClass(this.getNode(), this.settings.get('classCheckedRow'));
						this.bindNodes.forEach(function (row) {
							BX.addClass(row, this.settings.get('classCheckedRow'));
						}, this);
						checkbox.checked = true;
					}
				}
			},
			unselect() {
				if (this.isSelectable()) {
					BX.removeClass(this.getNode(), this.settings.get('classCheckedRow'));
					this.bindNodes.forEach(function (row) {
						BX.removeClass(row, this.settings.get('classCheckedRow'));
					}, this);
					if (this.getCheckbox()) {
						this.getCheckbox().checked = false;
					}
				}
			},
			getCells() {
				return this.getNode().cells;
			},
			isSelected() {
				return this.getCheckbox() && this.getCheckbox().checked || BX.hasClass(this.getNode(), this.settings.get('classCheckedRow'));
			},
			isHeadChild() {
				return this.getParentNodeName() === 'THEAD' && BX.hasClass(this.getNode(), this.settings.get('classHeadRow'));
			},
			isBodyChild() {
				return BX.hasClass(this.getNode(), this.settings.get('classBodyRow')) && !BX.hasClass(this.getNode(), this.settings.get('classEmptyRows'));
			},
			isFootChild() {
				return this.getParentNodeName() === 'TFOOT' && BX.hasClass(this.getNode(), this.settings.get('classFootRow'));
			},
			prependTo(target) {
				BX.Dom.prepend(this.getNode(), target);
			},
			appendTo(target) {
				BX.Dom.append(this.getNode(), target);
			},
			setId(id) {
				BX.Dom.attr(this.getNode(), 'data-id', id);
			},
			/**
			 * Names the actions button after the row, the way the template does. The title of the
			 * default action lives on the server only, so a row built by the script is named by its
			 * id; a page cached before the phrase existed falls back to that id alone.
			 */
			getActionsLabel() {
				const phrase = BX.message('interface_grid_row_actions');
				const id = String(this.getId());
				return BX.Type.isStringFilled(phrase) ? phrase.replace('#ROW#', id) : id;
			},
			setActions(actions) {
				const actionCell = this.getNode().querySelector('.main-grid-cell-action');
				if (actionCell) {
					let actionButton = actionCell.querySelector('.main-grid-row-action-button');
					if (!actionButton) {
						// The same markup the template renders: a row that got its actions from the
						// script must reach the keyboard the way a rendered one does.
						actionButton = BX.Dom.create({
							tag: 'button',
							attrs: {
								type: 'button',
								'aria-label': this.getActionsLabel(),
								'aria-haspopup': 'menu',
								'aria-expanded': 'false'
							},
							props: {
								className: 'main-grid-row-action-button'
							}
						});
						const container = this.getContentContainer(actionCell);
						BX.Dom.append(actionButton, container);
					}
					BX.Dom.attr(actionButton, {
						'data-actions': actions
					});
					this.actions = actions;
					if (this.actionsMenu) {
						this.actionsMenu.destroy();
						this.actionsMenu = null;
					}
				}
			},
			makeCountable() {
				BX.Dom.removeClass(this.getNode(), 'main-grid-not-count');
			},
			makeNotCountable() {
				BX.Dom.addClass(this.getNode(), 'main-grid-not-count');
			},
			getColumnOptions(columnId) {
				const columns = this.parent.getParam('COLUMNS_ALL');
				if (BX.Type.isPlainObject(columns) && Reflect.has(columns, columnId)) {
					return columns[columnId];
				}
				return null;
			},
			setCellsContent(content) {
				const headRow = this.parent.getRows().getHeadFirstChild();
				[...this.getCells()].forEach((cell, cellIndex) => {
					const cellName = headRow.getCellNameByCellIndex(cellIndex);
					if (Reflect.has(content, cellName)) {
						const columnOptions = this.getColumnOptions(cellName);
						const container = this.getContentContainer(cell);
						const cellContent = content[cellName];
						if (columnOptions.type === 'labels' && BX.Type.isArray(cellContent)) {
							const labels = cellContent.map(labelOptions => {
								const label = BX.Tag.render`
								<span class="ui-label ${labelOptions.color}"></span>
							`;
								if (labelOptions.light !== true) {
									BX.Dom.addClass(label, 'ui-label-fill');
								}
								if (BX.Type.isPlainObject(labelOptions.events)) {
									if (Reflect.has(labelOptions.events, 'click')) {
										BX.Dom.addClass(label, 'ui-label-link');
									}
									this.bindOnEvents(label, labelOptions.events);
								}
								const labelContent = (() => {
									if (BX.Type.isStringFilled(labelOptions.html)) {
										return labelOptions.html;
									}
									return labelOptions.text;
								})();
								const inner = BX.Tag.render`
								<span class="ui-label-inner">${labelContent}</span>
							`;
								BX.Dom.append(inner, label);
								if (BX.Type.isPlainObject(labelOptions.removeButton)) {
									// The same markup the template renders: a label redrawn by the script
									// keeps the remove control a named, focusable button.
									const removeLabel = BX.message('interface_grid_label_remove') || '';
									const button = (() => {
										if (labelOptions.removeButton.type === BX.Grid.Label.RemoveButtonType.INSIDE) {
											return BX.Tag.render`
											<button type="button" class="ui-label-icon" aria-label="${removeLabel}"></button>
										`;
										}
										return BX.Tag.render`
										<button
											type="button"
											class="main-grid-label-remove-button ${labelOptions.removeButton.type}"
											aria-label="${removeLabel}"
										></button>
									`;
									})();
									if (BX.Type.isPlainObject(labelOptions.removeButton.events)) {
										this.bindOnEvents(button, labelOptions.removeButton.events);
									}
									BX.Dom.append(button, label);
								}
								return label;
							});
							const labelsContainer = BX.Tag.render`
							<div class="main-grid-labels">${labels}</div>
						`;
							BX.Dom.clean(container);
							const oldLabelsContainer = container.querySelector('.main-grid-labels');
							if (BX.Type.isDomNode(oldLabelsContainer)) {
								BX.Dom.replace(oldLabelsContainer, labelsContainer);
							} else {
								BX.Dom.append(labelsContainer, container);
							}
						} else if (columnOptions.type === 'tags' && BX.Type.isPlainObject(cellContent)) {
							const tags = cellContent.items.map(tagOptions => {
								const tag = BX.Tag.render`
								<span class="main-grid-tag"></span>
							`;
								this.bindOnEvents(tag, tagOptions.events);
								if (tagOptions.active === true) {
									BX.Dom.addClass(tag, 'main-grid-tag-active');
								}
								const tagContent = (() => {
									if (BX.Type.isStringFilled(tagOptions.html)) {
										return tagOptions.html;
									}
									return BX.Text.encode(tagOptions.text);
								})();
								const tagInner = BX.Tag.render`
								<span class="main-grid-tag-inner">${tagContent}</span>
							`;
								BX.Dom.append(tagInner, tag);
								if (tagOptions.active === true) {
									const removeButton = BX.Tag.render`
									<span class="main-grid-tag-remove"></span>
								`;
									BX.Dom.append(removeButton, tag);
									if (BX.Type.isPlainObject(tagOptions.removeButton)) {
										this.bindOnEvents(removeButton, tagOptions.removeButton.events);
									}
								}
								return tag;
							});
							const tagsContainer = BX.Tag.render`
							<span class="main-grid-tags">${tags}</span>
						`;
							if (BX.Type.isPlainObject(cellContent.addButton)) {
								const addButton = BX.Tag.render`
								<span class="main-grid-tag-add"></span>
							`;
								this.bindOnEvents(addButton, cellContent.addButton.events);
								BX.Dom.append(addButton, tagsContainer);
							}
							const oldTagsContainer = container.querySelector('.main-grid-tags');
							if (BX.Type.isDomNode(oldTagsContainer)) {
								BX.Dom.replace(oldTagsContainer, tagsContainer);
							} else {
								BX.Dom.append(tagsContainer, container);
							}
						} else if (BX.Type.isDomNode(cellContent)) {
							BX.Dom.append(cellContent, container);
						} else {
							BX.Runtime.html(container, cellContent);
						}
					}
				});
			},
			getCellById(id) {
				const headRow = this.parent.getRows().getHeadFirstChild();
				return [...this.getCells()].find((cell, index) => {
					return headRow.getCellNameByCellIndex(index) === id;
				});
			},
			isTemplate() {
				return this.isBodyChild() && /^template_\d$/.test(this.getId());
			},
			enableAbsolutePosition() {
				const headCells = [...this.parent.getRows().getHeadFirstChild().getCells()];
				const cellsWidth = headCells.map(cell => {
					return BX.Dom.style(cell, 'width');
				});
				const cells = this.getCells();
				cellsWidth.forEach((width, index) => {
					BX.Dom.style(cells[index], 'width', width);
				});
				BX.Dom.style(this.getNode(), 'position', 'absolute');
			},
			disableAbsolutePosition() {
				BX.Dom.style(this.getNode(), 'position', null);
			},
			getHeight() {
				return BX.Text.toNumber(BX.Dom.style(this.getNode(), 'height'));
			},
			setCellActions(cellActions) {
				Object.entries(cellActions).forEach(([cellId, actions]) => {
					const cell = this.getCellById(cellId);
					if (cell) {
						const inner = cell.querySelector('.main-grid-cell-inner');
						if (inner) {
							const container = (() => {
								const currentContainer = inner.querySelector('.main-grid-cell-content-actions');
								if (currentContainer) {
									BX.Dom.clean(currentContainer);
									return currentContainer;
								}
								const newContainer = BX.Tag.render`
								<div class="main-grid-cell-content-actions"></div>
							`;
								BX.Dom.append(newContainer, inner);
								return newContainer;
							})();
							if (BX.Type.isArrayFilled(actions)) {
								actions.forEach(action => {
									const actionClass = (() => {
										if (BX.Type.isArrayFilled(action.class)) {
											return action.class.join(' ');
										}
										return action.class;
									})();
									const button = BX.Tag.render`
									<span class="main-grid-cell-content-action ${actionClass}"></span>
								`;
									if (BX.Type.isPlainObject(action.events)) {
										this.bindOnEvents(button, action.events);
									}
									if (BX.Type.isPlainObject(action.attributes)) {
										BX.Dom.attr(button, action.attributes);
									}
									BX.Dom.append(button, container);
								});
							}
						}
					}
				});
			},
			/**
			 * @private
			 */
			initElementsEvents() {
				const buttons = [...this.getNode().querySelectorAll('.main-grid-cell [data-events]')];
				if (BX.Type.isArrayFilled(buttons)) {
					buttons.forEach(button => {
						const events = eval(BX.Dom.attr(button, 'data-events'));
						if (BX.Type.isPlainObject(events)) {
							BX.Dom.attr(button, 'data-events', null);
							this.bindOnEvents(button, events);
						}
					});
				}
			},
			/**
			 * @private
			 * @param event
			 */
			onElementClick(event) {
				event.stopPropagation();
			},
			/**
			 * @private
			 */
			bindOnEvents(button, events) {
				if (BX.Type.isDomNode(button) && BX.Type.isPlainObject(events)) {
					BX.Event.bind(button, 'click', this.onElementClick.bind(this));
					const target = (() => {
						const selector = BX.Dom.attr(button, 'data-target');
						if (selector) {
							return button.closest(selector);
						}
						return button;
					})();
					const event = new BX.Event.BaseEvent({
						data: {
							button,
							target,
							row: this
						}
					});
					event.setTarget(target);
					Object.entries(events).forEach(([eventName, handler]) => {
						const preparedHandler = eval(handler);
						BX.Event.bind(button, eventName, preparedHandler.bind(null, event));
					});
				}
			},
			setCounters(counters) {
				if (BX.Type.isPlainObject(counters)) {
					Object.entries(counters).forEach(([columnId, counter]) => {
						const cell = this.getCellById(columnId);
						if (BX.Type.isDomNode(cell)) {
							const cellInner = cell.querySelector('.main-grid-cell-inner');
							const counterContainer = (() => {
								const container = cell.querySelector('.main-grid-cell-counter');
								if (BX.Type.isDomNode(container)) {
									return container;
								}
								return BX.Tag.render`
								<span class="main-grid-cell-counter"></span>
							`;
							})();
							const uiCounter = (() => {
								const currentCounter = counterContainer.querySelector('.ui-counter');
								if (BX.Type.isDomNode(currentCounter)) {
									return currentCounter;
								}
								const newCounter = BX.Tag.render`
								<span class="ui-counter"></span>
							`;
								BX.Dom.append(newCounter, counterContainer);
								return newCounter;
							})();
							if (BX.Type.isPlainObject(counter.events)) {
								this.bindOnEvents(uiCounter, counter.events);
							}
							const counterInner = (() => {
								const currentInner = uiCounter.querySelector('.ui-counter-inner');
								if (BX.Type.isDomNode(currentInner)) {
									return currentInner;
								}
								const newInner = BX.Tag.render`
								<span class="ui-counter-inner"></span>
							`;
								BX.Dom.append(newInner, uiCounter);
								return newInner;
							})();
							if (counter.isDouble) {
								const counterDoubleContainer = (() => {
									const currentDoubleContainer = uiCounter.querySelector('.ui-counter-secondary');
									if (BX.Type.isDomNode(currentDoubleContainer)) {
										return currentDoubleContainer;
									}
									const newDoubleContainer = BX.Tag.render`
									<span class="ui-counter-secondary"></span>
								`;
									BX.Dom.append(newDoubleContainer, uiCounter);
									return newDoubleContainer;
								})();
								if (BX.Type.isStringFilled(counter.secondaryColor)) {
									Object.values(BX.Grid.Counters.Color).forEach(secondaryColor => {
										BX.Dom.removeClass(counterDoubleContainer, secondaryColor);
									});
									BX.Dom.addClass(counterDoubleContainer, counter.secondaryColor);
								}
							}
							if (BX.Type.isStringFilled(counter.type)) {
								Object.values(BX.Grid.Counters.Type).forEach(type => {
									BX.Dom.removeClass(counterContainer, `main-grid-cell-counter-${type}`);
								});
								BX.Dom.addClass(counterContainer, `main-grid-cell-counter-${counter.type}`);
							}
							if (BX.Type.isStringFilled(counter.color)) {
								Object.values(BX.Grid.Counters.Color).forEach(color => {
									BX.Dom.removeClass(uiCounter, color);
								});
								BX.Dom.addClass(uiCounter, counter.color);
							}
							if (BX.Type.isStringFilled(counter.size)) {
								Object.values(BX.Grid.Counters.Size).forEach(size => {
									BX.Dom.removeClass(uiCounter, size);
								});
								BX.Dom.addClass(uiCounter, counter.size);
							}
							if (BX.Type.isStringFilled(counter.class)) {
								BX.Dom.addClass(uiCounter, counter.class);
							}
							if (BX.Type.isStringFilled(counter.value) || BX.Type.isNumber(counter.value)) {
								const currentValue = BX.Text.toNumber(counterInner.innerText);
								const value = BX.Text.toNumber(counter.value);
								if (value > 0) {
									if (value < 100) {
										counterInner.innerText = counter.value;
									} else {
										counterInner.innerText = '99+';
									}
									if (counter.animation !== false) {
										if (value !== currentValue) {
											if (value > currentValue) {
												BX.Dom.addClass(counterInner, 'ui-counter-plus');
											} else {
												BX.Dom.addClass(counterInner, 'ui-counter-minus');
											}
										}
										BX.Event.bindOnce(counterInner, 'animationend', event => {
											if (event.animationName === 'uiCounterPlus' || event.animationName === 'uiCounterMinus') {
												BX.Dom.removeClass(counterInner, ['ui-counter-plus', 'ui-counter-minus']);
											}
										});
									}
								}
							}
							if (counter.type === BX.Grid.Counters.Type.RIGHT) {
								BX.Dom.append(counterContainer, cellInner);
							} else {
								BX.Dom.prepend(counterContainer, cellInner);
							}

							// The container reserves the cell space, so only the counter goes at zero.
							if (BX.Text.toNumber(counter.value) <= 0) {
								BX.remove(uiCounter);
							}
						}
					});
				}
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * BX.Grid.Rows
		 * @param {BX.Main.grid} parent
		 * @constructor
		 */
		BX.Grid.Rows = function (parent) {
			this.parent = null;
			this.rows = null;
			this.headChild = null;
			this.bodyChild = null;
			this.footChild = null;
			this.init(parent);
		};
		BX.Grid.Rows.prototype = {
			init: function (parent) {
				this.parent = parent;
			},
			reset: function () {
				this.rows = null;
				this.headChild = null;
				this.bodyChild = null;
				this.footChild = null;
			},
			enableDragAndDrop: function () {
				this.parent.arParams["ALLOW_ROWS_SORT"] = true;
				if (!(this.parent.getRowsSortable() instanceof BX.Grid.RowsSortable)) {
					this.parent.rowsSortable = new BX.Grid.RowsSortable(this.parent);
				}
			},
			disableDragAndDrop: function () {
				this.parent.arParams["ALLOW_ROWS_SORT"] = false;
				if (this.parent.getRowsSortable() instanceof BX.Grid.RowsSortable) {
					this.parent.getRowsSortable().destroy();
					this.parent.rowsSortable = null;
				}
			},
			getFootLastChild: function () {
				return this.getLast(this.getFootChild());
			},
			getFootFirstChild: function () {
				return this.getFirst(this.getFootChild());
			},
			getBodyLastChild: function () {
				return this.getLast(this.getBodyChild());
			},
			getBodyFirstChild: function () {
				return this.getFirst(this.getBodyChild());
			},
			getHeadLastChild: function () {
				return this.getLast(this.getHeadChild());
			},
			getHeadFirstChild: function () {
				return this.getFirst(this.getHeadChild());
			},
			getEditSelectedValues: function (withTemplate) {
				var selectedRows = this.getSelected(withTemplate);
				var values = {};
				selectedRows.forEach(function (current) {
					values[current.getId()] = current.editGetValues();
				});
				return values;
			},
			getSelectedIds: function (withTemplate) {
				return this.getSelected(withTemplate).map(function (current) {
					return current.getId();
				});
			},
			initSelected: function () {
				var selected = this.getSelected();
				if (BX.type.isArray(selected) && selected.length) {
					selected.forEach(function (row) {
						row.initSelect();
					});
					this.parent.enableActionsPanel();
				}
			},
			editSelected: function () {
				this.getSelected().forEach(function (current) {
					current.edit();
				});
				BX.onCustomEvent(window, 'Grid::thereEditedRows', []);
			},
			editSelectedCancel: function (withTemplate) {
				this.getSelected(withTemplate).forEach(function (current) {
					current.editCancel();
				});
				BX.onCustomEvent(window, 'Grid::noEditedRows', []);
			},
			isSelected: function () {
				return this.getBodyChild().some(function (current) {
					return current.isShown() && current.isSelected();
				});
			},
			isAllSelected: function () {
				return !this.getBodyChild().filter(function (current) {
					return !!current.getCheckbox() && current.getCheckbox().disabled !== true;
				}).some(function (current) {
					return !current.isSelected();
				});
			},
			getParent: function () {
				return this.parent;
			},
			getCountSelected: function () {
				var result;
				try {
					result = this.getSelected().filter(function (row) {
						return !row.isNotCount() && row.isShown();
					}).length;
				} catch (err) {
					result = 0;
				}
				return result;
			},
			getCountDisplayed: function () {
				var result;
				try {
					result = this.getBodyChild().filter(function (row) {
						return row.isShown() && !row.isNotCount();
					}).length;
				} catch (err) {
					result = 0;
				}
				return result;
			},
			addRows: function (rows) {
				var body = BX.findChild(this.getParent().getTable(), {
					tag: 'TBODY'
				}, true, false);
				rows.forEach(function (current) {
					body.appendChild(current);
				});
			},
			/**
			 * Gets all rows of table
			 * @return {BX.Grid.Row[]}
			 */
			getRows: function () {
				var result;
				var self = this;
				if (!this.rows) {
					result = [].slice.call(this.getParent().getTable().querySelectorAll('tr[data-id], thead > tr'));
					this.rows = result.map(function (current) {
						return new BX.Grid.Row(self.parent, current);
					});
				}
				return this.rows;
			},
			/**
			 * Gets selected rows
			 * @return {BX.Grid.Row[]}
			 */
			getSelected: function (withTemplate) {
				return this.getBodyChild(withTemplate).filter(function (current) {
					return current.isShown() && current.isSelected();
				});
			},
			normalizeNode: function (node) {
				if (!BX.hasClass(node, this.getParent().settings.get('classBodyRow'))) {
					node = BX.findParent(node, {
						className: this.getParent().settings.get('classBodyRow')
					}, true, false);
				}
				return node;
			},
			/**
			 * Gets BX.Grid.Row by id
			 * @param {string|number} id
			 * @return {?BX.Grid.Row}
			 */
			getById: function (id) {
				return this.getBodyChild().find(function (current) {
					return String(current.getId()) === String(id);
				}) || null;
			},
			/**
			 * Gets BX.Grid.Row for tr node
			 * @param {HTMLTableRowElement} node
			 * @return {?BX.Grid.Row}
			 */
			get: function (node) {
				if (BX.Type.isDomNode(node)) {
					const rowNode = node.closest('.main-grid-row');
					if (BX.Type.isDomNode(rowNode)) {
						const rowInstance = this.getRows().find(row => {
							return row.getNode() === rowNode;
						});
						if (rowInstance) {
							return rowInstance;
						}
					}
				}
				return null;
			},
			/** @static @method getLast */
			getLast: function (array) {
				var result;
				try {
					result = array[array.length - 1];
				} catch (err) {
					result = null;
				}
				return result;
			},
			/** @static @method getFirst */
			getFirst: function (array) {
				var result;
				try {
					result = array[0];
				} catch (err) {
					result = null;
				}
				return result;
			},
			getHeadChild: function () {
				this.headChild = this.headChild || this.getRows().filter(function (current) {
					return current.isHeadChild();
				});
				return this.headChild;
			},
			/**
			 * Gets child rows of tbody
			 * @return {BX.Grid.Row[]}
			 */
			getBodyChild: function (withTemplates) {
				return this.getRows().filter(function (current) {
					return current.isBodyChild() && (!current.isTemplate() || withTemplates);
				});
			},
			getFootChild: function () {
				this.footChild = this.footChild || this.getRows().filter(function (current) {
					return current.isFootChild();
				});
				return this.footChild;
			},
			selectAll: function () {
				this.getRows().map(function (current) {
					current.isShown() && current.select();
				});
			},
			unselectAll: function () {
				this.getRows().map(function (current) {
					current.unselect();
				});
			},
			/**
			 * Gets row by rowIndex
			 * @param {number} rowIndex
			 * @return {?BX.Grid.Row}
			 */
			getByIndex: function (rowIndex) {
				var filter = this.getBodyChild().filter(function (item) {
					return item;
				}).filter(function (item) {
					return item.getNode().rowIndex === rowIndex;
				});
				return filter.length ? filter[0] : null;
			},
			/**
			 * Gets child rows
			 * @param {number|string} parentId
			 * @param {boolean} [recursive]
			 * @return {BX.Grid.Row[]}
			 */
			getRowsByParentId: function (parentId, recursive) {
				var result = [];
				var self = this;
				if (!parentId) {
					return result;
				}
				parentId = parentId.toString();
				function getByParentId(parentId) {
					self.getBodyChild().forEach(function (row) {
						if (row.getParentId() === parentId) {
							result.push(row);
							recursive && getByParentId(row.getId());
						}
					}, self);
				}
				getByParentId(parentId);
				return result;
			},
			getRowsByGroupId: function (groupId) {
				var result = [];
				var self = this;
				if (!groupId) {
					return result;
				}
				groupId = groupId.toString();
				function getByParentId(groupId) {
					self.getBodyChild().forEach(function (row) {
						if (row.isCustom()) {
							return;
						}
						var rowGroupId = row.getGroupId();
						if (rowGroupId !== null && rowGroupId === groupId) {
							result.push(row);
						}
					}, self);
				}
				getByParentId(groupId);
				return result;
			},
			/**
			 * Gets rows of a group which have no parent row inside the same group
			 * @param {number|string} groupId
			 * @return {BX.Grid.Row[]}
			 */
			getTopLevelRowsByGroupId: function (groupId) {
				var groupRows = this.getRowsByGroupId(groupId);
				var ids = groupRows.map(function (row) {
					return row.getId();
				});
				return groupRows.filter(function (row) {
					return ids.indexOf(row.getParentId()) === -1;
				});
			},
			getExpandedRows: function () {
				return this.getRows().filter(function (row) {
					return row.isExpand();
				});
			},
			getIdsExpandedRows: function () {
				return this.getExpandedRows().map(function (row) {
					return row.getId();
				});
			},
			getIdsCollapsedGroups: function () {
				return this.getRows().filter(function (row) {
					return row.isCustom() && !row.isExpand();
				}).map(function (row) {
					return row.getId();
				});
			},
			/**
			 * @return {HTMLElement[]}
			 */
			getSourceRows: function () {
				return BX.Grid.Utils.getBySelector(this.getParent().getTable(), ['.main-grid-header > tr', '.main-grid-header + tbody > tr'].join(', '));
			},
			/**
			 * @return {HTMLElement[]}
			 */
			getSourceBodyChild: function () {
				return this.getSourceRows().filter(function (current) {
					return BX.Grid.Utils.closestParent(current).nodeName === 'TBODY';
				});
			},
			/**
			 * @return {HTMLElement[]}
			 */
			getSourceHeadChild: function () {
				return this.getSourceRows().filter(function (current) {
					return BX.Grid.Utils.closestParent(current).nodeName === 'THEAD';
				});
			},
			/**
			 * @return {HTMLElement[]}
			 */
			getSourceFootChild: function () {
				return this.getSourceRows().filter(function (current) {
					return BX.Grid.Utils.closestParent(current).nodeName === 'TFOOT';
				});
			},
			hasEditable: function () {
				return this.getBodyChild().some(function (current) {
					return current.isEdit();
				});
			},
			insertAfter: function (currentId, targetId) {
				const currentRow = this.getById(currentId);
				const targetRow = this.getById(targetId);
				if (currentRow && targetRow) {
					BX.Dom.insertAfter(currentRow.getNode(), targetRow.getNode());
					this.reset();
				}
			},
			insertBefore: function (currentId, targetId) {
				const currentRow = this.getById(currentId);
				const targetRow = this.getById(targetId);
				if (currentRow && targetRow) {
					BX.Dom.insertBefore(currentRow.getNode(), targetRow.getNode());
					this.reset();
				}
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');
		BX.Grid.RowDragEvent = function (eventName) {
			this.allowMoveRow = true;
			this.allowInsertBeforeTarget = true;
			this.dragItem = null;
			this.targetItem = null;
			this.eventName = eventName || '';
			this.errorMessage = '';
		};
		BX.Grid.RowDragEvent.prototype = {
			allowMove() {
				this.allowMoveRow = true;
				this.errorMessage = '';
			},
			allowInsertBefore() {
				this.allowInsertBeforeTarget = true;
			},
			disallowMove(errorMessage) {
				this.allowMoveRow = false;
				this.errorMessage = errorMessage || '';
			},
			disallowInsertBefore() {
				this.allowInsertBeforeTarget = false;
			},
			getDragItem() {
				return this.dragItem;
			},
			getTargetItem() {
				return this.targetItem;
			},
			getEventName() {
				return this.eventName;
			},
			setDragItem(item) {
				return this.dragItem = item;
			},
			setTargetItem(item) {
				return this.targetItem = item;
			},
			setEventName(name) {
				return this.eventName = name;
			},
			isAllowedMove() {
				return this.allowMoveRow;
			},
			isAllowedInsertBefore() {
				return this.allowInsertBeforeTarget;
			},
			getErrorMessage() {
				return this.errorMessage;
			}
		};
		BX.Grid.RowsSortable = function (parent) {
			this.parent = null;
			this.list = null;
			this.setDefaultProps();
			this.init(parent);
		};
		BX.Grid.RowsSortable.prototype = {
			init(parent) {
				this.parent = parent;
				this.list = this.getList();
				this.prepareListItems();
				jsDD.Enable();
				if (!this.inited) {
					this.inited = true;
					this.onscrollDebounceHandler = BX.debounce(this._onWindowScroll, 300, this);
					if (!this.parent.getParam('ALLOW_ROWS_SORT_IN_EDIT_MODE', false)) {
						BX.addCustomEvent('Grid::thereEditedRows', BX.proxy(this.disable, this));
						BX.addCustomEvent('Grid::noEditedRows', BX.proxy(this.enable, this));
					}
					document.addEventListener('scroll', this.onscrollDebounceHandler, BX.Grid.Utils.listenerParams({
						passive: true
					}));
				}
			},
			destroy() {
				if (!this.parent.getParam('ALLOW_ROWS_SORT_IN_EDIT_MODE', false)) {
					BX.removeCustomEvent('Grid::thereEditedRows', BX.proxy(this.disable, this));
					BX.removeCustomEvent('Grid::noEditedRows', BX.proxy(this.enable, this));
				}
				document.removeEventListener('scroll', this.onscrollDebounceHandler, BX.Grid.Utils.listenerParams({
					passive: true
				}));
				this.unregisterObjects();
			},
			_onWindowScroll() {
				this.windowScrollTop = BX.scrollTop(window);
				this.rowsRectList = null;
			},
			disable() {
				this.unregisterObjects();
			},
			enable() {
				this.reinit();
			},
			reinit() {
				this.unregisterObjects();
				this.setDefaultProps();
				this.init(this.parent);
			},
			getList() {
				return this.parent.getRows().getSourceBodyChild();
			},
			unregisterObjects() {
				this.list.forEach(this.unregister, this);
			},
			prepareListItems() {
				this.list.forEach(this.register, this);
			},
			register(row) {
				const Rows = this.parent.getRows();
				const rowInstance = Rows.get(row);
				if (rowInstance && rowInstance.isDraggable()) {
					row.onbxdragstart = BX.delegate(this._onDragStart, this);
					row.onbxdrag = BX.delegate(this._onDrag, this);
					row.onbxdragstop = BX.delegate(this._onDragEnd, this);
					jsDD.registerObject(row);
				}
			},
			unregister(row) {
				jsDD.unregisterObject(row);
			},
			getIndex(item) {
				return BX.Grid.Utils.getIndex(this.list, item);
			},
			calcOffset() {
				let offset = this.dragRect.height;
				if (this.additionalDragItems.length > 0) {
					this.additionalDragItems.forEach(row => {
						offset += row.clientHeight;
					});
				}
				return offset;
			},
			getTheadCells(sourceCells) {
				return [].map.call(sourceCells, (cell, index) => {
					return {
						block: '',
						tag: 'th',
						attrs: {
							style: `width: ${BX.width(sourceCells[index])}px;`
						}
					};
				});
			},
			createFake() {
				const content = [];
				this.cloneDragItem = BX.clone(this.dragItem);
				this.cloneDragAdditionalDragItems = [];
				this.cloneDragAdditionalDragItemRows = [];
				const theadCellsDecl = this.getTheadCells(this.dragItem.cells);
				content.push(this.cloneDragItem);
				this.additionalDragItems.forEach(function (row) {
					const cloneRow = BX.clone(row);
					content.push(cloneRow);
					this.cloneDragAdditionalDragItems.push(cloneRow);
					this.cloneDragAdditionalDragItemRows.push(new BX.Grid.Row(this.parent, cloneRow));
				}, this);
				const tableWidth = BX.width(this.parent.getTable());
				this.fake = BX.decl({
					block: 'main-grid-fake-container',
					attrs: {
						style: `position: absolute; top: ${this.getDragStartRect().top}px; width: ${tableWidth}px`
					},
					content: {
						block: 'main-grid-table',
						mix: 'main-grid-table-fake',
						tag: 'table',
						attrs: {
							style: `width: ${tableWidth}px`
						},
						content: [{
							block: 'main-grid-header',
							tag: 'thead',
							content: {
								block: 'main-grid-row-head',
								tag: 'tr',
								content: theadCellsDecl
							}
						}, {
							block: '',
							tag: 'tbody',
							content
						}]
					}
				});
				BX.insertAfter(this.fake, this.parent.getTable());
				this.cloneDragItem = new BX.Grid.Row(this.parent, this.cloneDragItem);
				return this.fake;
			},
			getDragStartRect() {
				return BX.pos(this.dragItem, this.parent.getTable());
			},
			_onDragStart() {
				this.moved = false;
				this.dragItem = jsDD.current_node;
				this.targetItem = this.dragItem;
				this.additionalDragItems = this.getAdditionalDragItems(this.dragItem);
				this.dragIndex = this.getIndex(this.dragItem);
				this.dragRect = this.getRowRect(this.dragItem, this.dragIndex);
				this.offset = this.calcOffset();
				this.dragStartOffset = jsDD.start_y - this.dragRect.top;
				this.dragEvent = new BX.Grid.RowDragEvent();
				this.dragEvent.setEventName('BX.Main.grid:rowDragStart');
				this.dragEvent.setDragItem(this.dragItem);
				this.dragEvent.setTargetItem(this.targetItem);
				this.dragEvent.allowInsertBefore();
				const dragRow = this.parent.getRows().get(this.dragItem);
				this.startDragDepth = dragRow.getDepth();
				this.startDragParentId = dragRow.getParentId();
				this.createFake();
				BX.addClass(this.parent.getContainer(), this.parent.settings.get('classOnDrag'));
				BX.addClass(this.dragItem, this.parent.settings.get('classDragActive'));
				BX.onCustomEvent(window, 'BX.Main.grid:rowDragStart', [this.dragEvent, this.parent]);
			},
			getAdditionalDragItems(dragItem) {
				const Rows = this.parent.getRows();
				return Rows.getRowsByParentId(Rows.get(dragItem).getId(), true).map(row => {
					return row.getNode();
				});
			},
			/**
			 * @param {?HTMLElement} row
			 * @param {int} offset
			 * @param {?int} [transition] css transition-duration in ms
			 */
			moveRow(row, offset, transition) {
				if (row) {
					const transitionDuration = BX.type.isNumber(transition) ? transition : 300;
					row.style.transition = `${transitionDuration}ms`;
					row.style.transform = `translate3d(0px, ${offset}px, 0px)`;
				}
			},
			getDragOffset() {
				return jsDD.y - this.dragRect.top - this.dragStartOffset;
			},
			getWindowScrollTop() {
				if (this.windowScrollTop === null) {
					this.windowScrollTop = BX.scrollTop(window);
				}
				return this.windowScrollTop;
			},
			getSortOffset() {
				return jsDD.y;
			},
			getRowRect(row, index) {
				if (!this.rowsRectList) {
					this.rowsRectList = {};
					this.list.forEach(function (current, i) {
						this.rowsRectList[i] = current.getBoundingClientRect();
					}, this);
				}
				return this.rowsRectList[index];
			},
			getRowCenter(row, index) {
				const rect = this.getRowRect(row, index);
				return rect.top + this.getWindowScrollTop() + rect.height / 2;
			},
			isDragToBottom(row, index) {
				const rowCenter = this.getRowCenter(row, index);
				const sortOffset = this.getSortOffset();
				return index > this.dragIndex && rowCenter < sortOffset;
			},
			isMovedToBottom(row) {
				return row.style.transform === `translate3d(0px, ${-this.offset}px, 0px)`;
			},
			isDragToTop(row, index) {
				const rowCenter = this.getRowCenter(row, index);
				const sortOffset = this.getSortOffset();
				return index < this.dragIndex && rowCenter > sortOffset;
			},
			isMovedToTop(row) {
				return row.style.transform === `translate3d(0px, ${this.offset}px, 0px)`;
			},
			isDragToBack(row, index) {
				const rowCenter = this.getRowCenter(row, index);
				const dragIndex = this.dragIndex;
				const y = jsDD.y;
				return index > dragIndex && y < rowCenter || index < dragIndex && y > rowCenter;
			},
			isMoved(row) {
				return row.style.transform !== 'translate3d(0px, 0px, 0px)' && row.style.transform !== '';
			},
			_onDrag() {
				const dragTransitionDuration = 0;
				const defaultOffset = 0;
				this.moveRow(this.dragItem, this.getDragOffset(), dragTransitionDuration);
				this.moveRow(this.fake, this.getDragOffset(), dragTransitionDuration);
				BX.Grid.Utils.styleForEach(this.additionalDragItems, {
					transition: `${dragTransitionDuration}ms`,
					transform: `translate3d(0px, ${this.getDragOffset()}px, 0px)`
				});
				this.list.forEach(function (current, index) {
					if (Boolean(current) && current !== this.dragItem && !this.additionalDragItems.includes(current)) {
						if (this.isDragToTop(current, index) && !this.isMovedToTop(current)) {
							this.targetItem = current;
							this.moveRow(current, this.offset);
							this.dragEvent.setEventName('BX.Main.grid:rowDragMove');
							this.dragEvent.setTargetItem(this.targetItem);
							BX.onCustomEvent(window, 'BX.Main.grid:rowDragMove', [this.dragEvent, this.parent]);
							this.checkError(this.dragEvent);
							this.updateProperties(this.dragItem, this.targetItem);
							this.isDragetToTop = true;
							this.moved = true;
						}
						if (this.isDragToBottom(current, index) && !this.isMovedToBottom(current)) {
							this.targetItem = this.findNextVisible(this.list, index);
							this.moveRow(current, -this.offset);
							this.dragEvent.setEventName('BX.Main.grid:rowDragMove');
							this.dragEvent.setTargetItem(this.targetItem);
							BX.onCustomEvent(window, 'BX.Main.grid:rowDragMove', [this.dragEvent, this.parent]);
							this.checkError(this.dragEvent);
							this.updateProperties(this.dragItem, this.targetItem);
							this.isDragetToTop = false;
							if (this.targetItem) {
								this.moved = true;
							}
						}
						if (this.isDragToBack(current, index) && this.isMoved(current)) {
							this.moveRow(current, defaultOffset);
							this.targetItem = current;
							if (this.isDragetToTop) {
								this.targetItem = this.findNextVisible(this.list, index);
							}
							this.moved = true;
							this.dragEvent.setEventName('BX.Main.grid:rowDragMove');
							this.dragEvent.setTargetItem(this.targetItem);
							BX.onCustomEvent(window, 'BX.Main.grid:rowDragMove', [this.dragEvent, this.parent]);
							this.checkError(this.dragEvent);
							this.updateProperties(this.dragItem, this.targetItem);
						}
					}
				}, this);
			},
			createError(target, message) {
				const error = BX.decl({
					block: 'main-grid-error',
					content: message || ''
				});
				Boolean(target) && target.appendChild(error);
				setTimeout(() => {
					BX.addClass(error, 'main-grid-error-show');
				}, 0);
				return error;
			},
			checkError(event) {
				if (!event.isAllowedMove() && !this.error) {
					this.error = this.createError(this.fake, event.getErrorMessage());
				}
				if (event.isAllowedMove() && this.error) {
					BX.remove(this.error);
					this.error = null;
				}
			},
			findNextVisible(list, index) {
				let result = null;
				const Rows = this.parent.getRows();
				list.forEach((item, currentIndex) => {
					if (!result && currentIndex > index) {
						const row = Rows.get(item);
						if (row && row.isShown()) {
							result = item;
						}
					}
				});
				return result;
			},
			/**
			 * Updates row properties
			 * @param {?HTMLTableRowElement} dragItem
			 * @param {?HTMLTableRowElement} targetItem
			 */
			updateProperties(dragItem, targetItem) {
				const Rows = this.parent.getRows();
				const dragRow = Rows.get(dragItem);
				let depth = 0;
				let parentId = 0;
				if (targetItem) {
					const targetRow = Rows.get(targetItem);
					depth = targetRow.getDepth();
					parentId = targetRow.getParentId();
				}
				dragRow.setDepth(depth);
				dragRow.setParentId(parentId);
				this.cloneDragItem.setDepth(depth);
				this.cloneDragAdditionalDragItemRows.forEach(function (row, index) {
					row.setDepth(BX.data(this.additionalDragItems[index], 'depth'));
				}, this);
			},
			resetDragProperties() {
				const dragRow = this.parent.getRows().get(this.dragItem);
				dragRow.setDepth(this.startDragDepth);
				dragRow.setParentId(this.startDragParentId);
			},
			_onDragOver() {},
			_onDragLeave() {},
			_onDragEnd() {
				BX.onCustomEvent(window, 'BX.Main.grid:rowDragEnd', [this.dragEvent, this.parent]);
				BX.removeClass(this.parent.getContainer(), this.parent.settings.get('classOnDrag'));
				BX.removeClass(this.dragItem, this.parent.settings.get('classDragActive'));
				BX.Grid.Utils.styleForEach(this.list, {
					transition: '',
					transform: ''
				});
				if (this.dragEvent.isAllowedMove()) {
					this.sortRows(this.dragItem, this.targetItem);
					this.sortAdditionalDragItems(this.dragItem, this.additionalDragItems);
					this.list = this.getList();
					this.parent.getRows().reset();
					const dragItem = this.parent.getRows().get(this.dragItem);
					const ids = this.parent.getRows().getBodyChild().map(row => {
						return row.getId();
					});
					if (this.parent.getParam('ALLOW_ROWS_SORT_INSTANT_SAVE', true)) {
						this.saveRowsSort(ids);
					}
					BX.onCustomEvent(window, 'Grid::rowMoved', [ids, dragItem, this.parent]);
				} else {
					this.resetDragProperties();
				}
				BX.remove(this.fake);
				this.setDefaultProps();
			},
			sortAdditionalDragItems(dragItem, additional) {
				additional.reduce((prev, current) => {
					Boolean(current) && BX.insertAfter(current, prev);
					return current;
				}, dragItem);
			},
			sortRows(current, target) {
				if (target) {
					target.parentNode.insertBefore(current, target);
				} else if (this.moved) {
					current.parentNode.appendChild(current);
				}
			},
			saveRowsSort(rows) {
				const data = {
					ids: rows,
					action: this.parent.getUserOptions().getAction('GRID_SAVE_ROWS_SORT')
				};
				this.parent.getData().request(null, 'POST', data);
			},
			setDefaultProps() {
				this.moved = false;
				this.dragItem = null;
				this.targetItem = null;
				this.dragRect = null;
				this.dragIndex = null;
				this.offset = null;
				this.realX = null;
				this.realY = null;
				this.dragStartOffset = null;
				this.windowScrollTop = null;
				this.rowsRectList = null;
				this.error = false;
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * BX.Grid.Settings
		 * @constructor
		 */
		BX.Grid.Settings = function () {
			this.settings = {};
			this.defaultSettings = {
				classContainer: 'main-grid',
				classWrapper: 'main-grid-wrapper',
				classTable: 'main-grid-table',
				classScrollContainer: 'main-grid-container',
				classFadeContainer: 'main-grid-fade',
				classFadeContainerRight: 'main-grid-fade-right',
				classFadeContainerLeft: 'main-grid-fade-left',
				classNavPanel: 'main-grid-nav-panel',
				classActionPanel: 'main-grid-action-panel',
				classCursor: 'main-grid-cursor',
				classRowCustom: 'main-grid-row-custom',
				classMoreButton: 'main-grid-more-btn',
				classRow: 'main-grid-row',
				classHeadRow: 'main-grid-row-head',
				classBodyRow: 'main-grid-row-body',
				classFootRow: 'main-grid-row-foot',
				classDataRows: 'main-grid-row-data',
				classPanels: 'main-grid-bottom-panels',
				classCellHeadContainer: 'main-grid-cell-head-container',
				classCellHeadOndrag: 'main-grid-cell-head-ondrag',
				classEmptyRows: 'main-grid-row-empty',
				classEmptyBlock: 'main-grid-empty-block',
				classCheckAllCheckboxes: 'main-grid-check-all',
				classCheckedRow: 'main-grid-row-checked',
				classRowCheckbox: 'main-grid-row-checkbox',
				classPagination: 'main-grid-panel-cell-pagination',
				classActionCol: 'main-grid-cell-action',
				classCounterDisplayed: 'main-grid-counter-displayed',
				classCounterSelected: 'main-grid-counter-selected',
				classCounterTotal: 'main-grid-panel-total',
				classTableFade: 'main-grid-table-fade',
				classDragActive: 'main-grid-on-row-drag',
				classResizeButton: 'main-grid-resize-button',
				classOnDrag: 'main-grid-ondrag',
				classDisableDrag: 'main-grid-row-drag-disabled',
				classPanelCellContent: 'main-grid-panel-content',
				classCollapseButton: 'main-grid-plus-button',
				classRowStateLoad: 'main-grid-load-row',
				classRowStateExpand: 'main-grid-row-expand',
				classHeaderSortable: 'main-grid-col-sortable',
				classHeaderNoSortable: 'main-grid-col-no-sortable',
				classCellStatic: 'main-grid-cell-static',
				classHeadCell: 'main-grid-cell-head',
				classPageSize: 'main-grid-panel-select-pagesize',
				classGroupEditButton: 'main-grid-control-panel-action-edit',
				classGroupDeleteButton: 'main-grid-control-panel-action-remove',
				classGroupActionsDisabled: 'main-grid-control-panel-action-icon-disable',
				classPanelButton: 'ui-btn',
				classPanelApplyButton: 'main-grid-control-panel-apply-button',
				classPanelCheckbox: 'main-grid-panel-checkbox',
				classEditor: 'main-grid-editor',
				classEditorContainer: 'main-grid-editor-container',
				classEditorText: 'main-grid-editor-text',
				classEditorDate: 'main-grid-editor-date',
				classEditorNumber: 'main-grid-editor-number',
				classEditorRange: 'main-grid-editor-range',
				classEditorCheckbox: 'main-grid-editor-checkbox',
				classEditorTextarea: 'main-grid-editor-textarea',
				classEditorCustom: 'main-grid-editor-custom',
				classEditorMoney: 'main-grid-editor-money',
				classCellContainer: 'main-grid-cell-content',
				classEditorOutput: 'main-grid-editor-output',
				classSettingsWindow: 'main-grid-settings-window',
				classSettingsWindowColumn: 'main-grid-settings-window-list-item',
				classSettingsWindowColumnLabel: 'main-grid-settings-window-list-item-label',
				classSettingsWindowColumnEditState: 'main-grid-settings-window-list-item-edit',
				classSettingsWindowColumnEditInput: 'main-grid-settings-window-list-item-edit-input',
				classSettingsWindowColumnEditButton: 'main-grid-settings-window-list-item-edit-button',
				classSettingsWindowColumnCheckbox: 'main-grid-settings-window-list-item-checkbox',
				classSettingsWindowShow: 'main-grid-settings-window-show',
				classSettingsWindowSelectAll: 'main-grid-settings-window-select-all',
				classSettingsWindowUnselectAll: 'main-grid-settings-window-unselect-all',
				classSettingsWindowSearchSectionsWrapper: 'main-grid-settings-window-search-section-wrapper',
				classSettingsWindowSearchActiveSectionIcon: 'main-grid-settings-window-search-section-item-icon-active',
				classSettingsWindowSearchSectionInput: 'main-grid-settings-window-search-section-input',
				classSettingsWindowSearchSectionItemHidden: 'main-grid-settings-window-list-item-hidden',
				classSettingsWindowSearchSectionItemVisible: 'main-grid-settings-window-list-item-visible',
				classSettingsButton: 'main-grid-interface-settings-icon',
				classSettingsButtonActive: 'main-grid-interface-settings-icon-active',
				classSettingsWindowClose: 'main-grid-settings-window-actions-item-close',
				classSettingsWindowReset: 'main-grid-settings-window-actions-item-reset',
				classSettingsWindowColumnChecked: 'main-grid-settings-window-list-item-checked',
				classShowAnimation: 'main-grid-show-popup-animation',
				classCloseAnimation: 'main-grid-close-popup-animation',
				classLoader: 'main-grid-loader-container',
				classLoaderShow: 'main-grid-show-loader',
				classLoaderHide: 'main-grid-hide-loader',
				classRowError: 'main-grid-error',
				loaderHideAnimationName: 'hideLoader',
				classHide: 'main-grid-hide',
				classEar: 'main-grid-ear',
				classEarLeft: 'main-grid-ear-left',
				classEarRight: 'main-grid-ear-right',
				classNotCount: 'main-grid-not-count',
				classCounter: 'main-grid-panel-counter',
				classForAllCounterEnabled: 'main-grid-panel-counter-for-all-enable',
				classLoad: 'load',
				classRowActionButton: 'main-grid-row-action-button',
				classDropdown: 'main-dropdown',
				classPanelControl: 'main-grid-panel-control',
				classPanelControlContainer: 'main-grid-panel-control-container',
				classForAllCheckbox: 'main-grid-for-all-checkbox',
				classDisable: 'main-grid-disable',
				dataActionsKey: 'actions',
				updateActionMore: 'more',
				classShow: 'show',
				classGridShow: 'main-grid-show',
				updateActionPagination: 'pagination',
				updateActionSort: 'sort',
				ajaxIdDataProp: 'ajaxid',
				pageSizeId: 'grid_page_size',
				sortableRows: true,
				sortableColumns: true,
				animationDuration: 300
			};
			this.prepare();
		};
		BX.Grid.Settings.prototype = {
			prepare() {
				this.settings = this.defaultSettings;
			},
			getDefault() {
				return this.defaultSettings;
			},
			get(name) {
				let result;
				try {
					result = this.getDefault()[name];
				} catch {
					result = null;
				}
				return result;
			},
			getList() {
				return this.getDefault();
			}
		};
	})();

	/**
	 * Column titles the user renamed in the settings window are stored in the grid user
	 * options, keyed by column id. A column the user never renamed keeps the name it
	 * comes with.
	 */
	function getColumnTitle(column, customNames) {
		const {
			id,
			name
		} = column;
		if (BX.Type.isPlainObject(customNames) && id in customNames) {
			return customNames[id];
		}
		return name;
	}

	/**
	 * The name the user just typed, written straight into the table head. The reload that follows
	 * the save brings the head from the server, but it is served by another process, which can
	 * still hold the options this save has replaced - and then the head keeps the old name until
	 * the page is reloaded by hand.
	 *
	 * Only the text is replaced: the title also carries the hint node, which has to stay.
	 */
	function setColumnHeaderTitle(headerCell, title) {
		const titleNode = headerCell?.querySelector('.main-grid-head-title');
		if (!titleNode) {
			return;
		}
		const textNode = [...titleNode.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
		if (textNode) {
			textNode.nodeValue = title;
			return;
		}
		titleNode.prepend(document.createTextNode(title));
	}

	const namespace$1 = main_core.Reflection.namespace('BX.Grid.SettingsWindow');
	const SAVE_FOR_ALL = 'forAll';
	const SAVE_FOR_ME = 'forMe';
	class CheckboxList {
		params = {};
		options = {};
		stickyColumns = new Set();
		popup = null;
		popupItems = null;
		constructor(params) {
			this.params = params;
			this.grid = params.grid;
			this.parent = params.parent;
			this.options = this.grid.arParams.CHECKBOX_LIST_OPTIONS;
			this.useSearch = Boolean(this.grid.arParams.ENABLE_FIELDS_SEARCH);
			this.useSectioning = main_core.Type.isArrayFilled(this.options.sections);
			this.isForAllValue = false;
		}
		getPopup() {
			if (!this.popup) {
				this.createPopup();
			}
			return this.popup;
		}
		createPopup() {
			if (this.popup) {
				return;
			}
			const {
				useSearch,
				useSectioning,
				params: {
					title,
					placeholder,
					emptyStateTitle,
					emptyStateDescription,
					allSectionsDisabledTitle
				}
			} = this;
			const context = {
				parentType: 'grid'
			};
			this.popup = new ui_dialogs_checkboxList.CheckboxList({
				context,
				popupOptions: {
					width: 1100
				},
				columnCount: 4,
				lang: {
					title,
					placeholder,
					emptyStateTitle,
					emptyStateDescription,
					allSectionsDisabledTitle
				},
				sections: this.getSections(),
				categories: this.getCategories(),
				options: this.getOptions(),
				events: {
					onApply: event => this.onApply(event),
					onDefault: event => this.onDefault(event)
				},
				params: {
					useSearch,
					useSectioning,
					destroyPopupAfterClose: false,
					closeAfterApply: false,
					isEditableOptionsTitle: true
				},
				customFooterElements: this.getCustomFooterElements()
			});
		}
		getSections() {
			const sections = this.options.sections ?? [];
			const result = [];
			sections.forEach(section => {
				const {
					id,
					name,
					selected
				} = section;
				result.push({
					key: id,
					title: name,
					value: selected
				});
			});
			return result;
		}
		getCategories() {
			const categories = this.options.categories ?? [];
			const result = [];
			if (categories.length === 0) {
				this.getSections().forEach(section => {
					const {
						key,
						title
					} = section;
					result.push({
						key,
						title,
						sectionKey: key
					});
				});
				return result;
			}
			categories.forEach(category => {
				const {
					title,
					sectionKey,
					key
				} = category;
				result.push({
					title,
					sectionKey,
					key
				});
			});
			return result;
		}
		getOptions() {
			const options = this.options;
			const columns = options.columns ?? [];
			const columnsWithSections = options.columnsWithSections ?? [];
			const result = [];
			const customNames = this.grid.getUserOptions().getCurrentOptions()?.custom_names ?? {};
			if (this.useSectioning) {
				for (const sectionName in columnsWithSections) {
					columnsWithSections[sectionName].forEach(column => {
						const {
							id,
							default: defaultValue
						} = column;
						result.push({
							title: main_core.Text.decode(getColumnTitle(column, customNames)),
							value: this.isChecked(id),
							categoryKey: sectionName,
							defaultValue,
							id
						});
						this.prepareColumnParams(column);
					});
				}
				return result;
			}
			columns.forEach(column => {
				const {
					id,
					default: defaultValue
				} = column;
				result.push({
					title: main_core.Text.decode(getColumnTitle(column, customNames)),
					value: this.isChecked(id),
					defaultValue,
					id
				});
				this.prepareColumnParams(column);
			});
			return result;
		}
		isChecked(fieldName) {
			const checked = this.options.checked ?? [];
			return checked.includes(fieldName);
		}
		prepareColumnParams(column) {
			const {
				sticked,
				id
			} = column;
			if (sticked) {
				this.stickyColumns.add(id);
			}
		}
		getCustomFooterElements() {
			if (this.isAdmin()) {
				const {
					arParams: params,
					containerId
				} = this.parent;
				return [{
					type: 'textToggle',
					id: `${containerId}-${SAVE_FOR_ALL}`,
					title: params.SETTINGS_FOR_LABEL,
					dataItems: [{
						value: SAVE_FOR_ME,
						label: params.SETTINGS_FOR_FOR_ME_LABEL
					}, {
						value: SAVE_FOR_ALL,
						label: params.SETTINGS_FOR_FOR_ALL_LABEL
					}],
					// eslint-disable-next-line no-return-assign
					onClick: value => {
						this.isForAllValue = value === SAVE_FOR_ALL;
					}
				}];
			}
			return [];
		}
		getMainPopup() {
			return this.getPopup().getPopup();
		}
		show() {
			this.popup.show();
		}
		getStickedColumns() {
			const {
				ALLOW_STICKED_COLUMNS: isStickyColumnsAllowed,
				HAS_STICKED_COLUMNS: hasStickyColumns
			} = this.parent.arParams;
			if (isStickyColumnsAllowed && hasStickyColumns) {
				return this.stickyColumns.values();
			}
			return [];
		}
		onApply(event) {
			const {
				fields: columns,
				data
			} = event.data;
			if (this.isForAll()) {
				const params = {
					CONFIRM: true,
					CONFIRM_MESSAGE: this.grid.getParam('SETTINGS_FOR_ALL_CONFIRM_MESSAGE')
				};
				this.grid.confirmDialog(params, () => this.saveColumnsAndHidePopup(columns, data));
			} else {
				this.saveColumnsAndHidePopup(columns, data);
			}
		}
		saveColumnsAndHidePopup(columns, data) {
			this.saveColumns(columns, data);
			this.popup.hide();
		}
		prepareOrderedColumnsList(newColumns) {
			if (main_core.Type.isArray(newColumns)) {
				const currentOptions = this.grid.getUserOptions().getCurrentOptions();
				const currentColumns = currentOptions?.columns?.split?.(',');
				if (main_core.Type.isArray(currentColumns)) {
					const filteredColumns = currentColumns.filter(column => {
						return newColumns.includes(column);
					});
					const newAddedColumns = newColumns.filter(column => {
						return !filteredColumns.includes(column);
					});
					return [...filteredColumns, ...newAddedColumns];
				}
			}
			return newColumns;
		}
		saveColumns(columns, data) {
			const options = this.grid.getUserOptions();
			const columnNames = this.getColumnNames(data);
			const stickyColumns = this.getStickedColumns();
			const orderedColumns = this.prepareOrderedColumnsList(columns);
			const batch = [{
				action: options.getAction('GRID_SET_COLUMNS'),
				columns: orderedColumns.join(',')
			}, {
				action: options.getAction('SET_CUSTOM_NAMES'),
				custom_names: columnNames
			}, {
				action: options.getAction('GRID_SET_STICKED_COLUMNS'),
				stickedColumns: stickyColumns
			}];
			if (this.isForAll()) {
				batch.push({
					action: options.getAction('GRID_SAVE_SETTINGS'),
					view_id: 'default',
					set_default_settings: 'Y',
					delete_user_settings: 'Y'
				});
			}
			options.batch(batch, () => {
				// After the reload, not before: it replaces the whole head with the server's markup.
				this.grid.reloadTable(null, null, () => this.applyColumnNamesToHead(columnNames));
			});
		}
		applyColumnNamesToHead(columnNames) {
			const columns = this.options.columns ?? [];
			columns.forEach(column => {
				const {
					id
				} = column;
				const title = id in columnNames ? columnNames[id] : column.name;
				setColumnHeaderTitle(this.grid.getColumnHeaderCellByName(id), main_core.Text.decode(title));
			});
		}
		getColumnNames(data) {
			const options = this.options;
			const columns = options.columns ?? [];
			const names = {};
			const {
				titles
			} = data;
			if (!main_core.Type.isObjectLike(titles)) {
				return {};
			}
			columns.forEach(column => {
				const id = column.id;
				if (main_core.Type.isStringFilled(titles[id]) && titles[id] !== column.name) {
					names[id] = titles[id];
				} else if (main_core.Type.isStringFilled(this.parent.arParams.DEFAULT_COLUMNS[id].name) && this.parent.arParams.DEFAULT_COLUMNS[id].name !== column.name) {
					names[id] = column.name;
				}
			});
			return names;
		}
		onDefault(event) {
			const params = {
				CONFIRM: true,
				CONFIRM_MESSAGE: this.grid.arParams.CONFIRM_RESET_MESSAGE
			};
			this.grid.confirmDialog(params, () => {
				this.grid.getUserOptions().reset(this.isForAll(), () => {
					this.reset();
					this.grid.reloadTable(null, null, () => {
						this.popup.options.forEach(item => {
							this.grid.gridSettings.select(item.id, item.defaultValue === true);
						});
					});
				});
			});
			event.preventDefault();
			return event;
		}

		/**
		 * Options are built once from the server payload, so a column moved in the grid has to be
		 * moved here too; the popup is dropped to be rebuilt with the new order on the next show.
		 *
		 * @param {string[]} [columns] - showed column ids in the order chosen by the user
		 */
		sortItems(columns) {
			if (!main_core.Type.isArrayFilled(columns)) {
				return;
			}
			this.options.columns = this.sortColumns(this.options.columns, columns);
			const columnsWithSections = this.options.columnsWithSections;
			if (main_core.Type.isObjectLike(columnsWithSections)) {
				Object.keys(columnsWithSections).forEach(sectionName => {
					columnsWithSections[sectionName] = this.sortColumns(columnsWithSections[sectionName], columns);
				});
			}
			if (this.popup) {
				this.popup.options = this.getOptions();
			}
		}

		/**
		 * Puts showed columns into the full list in the user order, keeping hidden ones at their
		 * own places — the same way the grid table itself is ordered. A repeated id keeps its last
		 * place, as the grid table does with such a column.
		 */
		sortColumns(columns, showedColumns) {
			if (!main_core.Type.isArrayFilled(columns)) {
				return columns;
			}
			const byId = new Map(columns.map(column => [String(column.id), column]));
			const order = new Set();
			showedColumns.forEach(columnId => {
				const id = String(columnId);
				if (byId.has(id)) {
					order.delete(id);
					order.add(id);
				}
			});
			const userOrder = [...order];
			if (userOrder.length === 0) {
				return columns;
			}
			let userOrderIndex = 0;
			return columns.map(column => {
				return userOrder.includes(String(column.id)) ? byId.get(userOrder[userOrderIndex++]) : column;
			});
		}
		reset() {
			if (!this.popup) {
				return;
			}
			this.options.checked = [];
			this.popup.options.filter(item => item.defaultValue).forEach(item => {
				this.options.checked.push(item.id);
			});
			this.close();
		}
		getSelectedColumns() {
			return this.getPopup().getSelectedOptions();
		}
		close() {
			this.popup?.destroy();
		}
		destroy() {
			this.popup?.destroy();
			this.popup = null;
		}
		isForAll() {
			return this.isForAllValue;
		}
		isAdmin() {
			return Boolean(this.parent.arParams.IS_ADMIN ?? false);
		}
		getPopupItems() {
			return this.options.columns;
		}
		getItems() {
			return this.getPopup().getOptions();
		}
		select(id, value = true) {
			// to maintain backward compatibility without creating dependencies on ui within the ticket #187991
			// @todo remove later
			if (this.getPopup()?.selectOption?.length === 1 && value === false) {
				return;
			}
			this.getPopup().selectOption(id, value);
		}
		saveColumnsByNames(columns, callback) {
			this.getItems().filter(item => columns.includes(item.id)).forEach(item => this.select(item.id));
			this.getPopup().apply();
			if (main_core.Type.isFunction(callback)) {
				callback();
			}
		}
	}
	namespace$1.CheckboxList = CheckboxList;

	/* eslint-disable */

	(function () {

		BX.namespace('BX.Grid.SettingsWindow');

		/**
		 * @param {BX.Main.grid} parent
		 * @param {HTMLElement} node
		 * @constructor
		 */
		BX.Grid.SettingsWindow.Column = function (parent, node) {
			this.node = null;
			this.label = null;
			this.checkbox = null;
			this.editButton = null;
			this.settings = null;
			this.parent = null;
			this.default = null;
			this.defaultTitle = null;
			this.state = null;
			this.lastTitle = null;
			this.init(parent, node);
		};
		BX.Grid.SettingsWindow.Column.inited = {};
		BX.Grid.SettingsWindow.Column.prototype = {
			init: function (parent, node) {
				this.parent = parent;
				this.node = node;
				try {
					this.lastTitle = node.querySelector("label").innerText.trim();
				} catch (err) {}
				this.updateState();
				if (!BX.Grid.SettingsWindow.Column.inited[this.getId()]) {
					BX.Grid.SettingsWindow.Column.inited[this.getId()] = true;
					BX.bind(this.getEditButton(), 'click', BX.proxy(this.onEditButtonClick, this));
					BX.bind(this.getStickyButton(), 'click', BX.proxy(this.onStickyButtonClick, this));
				}
			},
			getStickyButton: function () {
				return this.node.querySelector(".main-grid-settings-window-list-item-sticky-button");
			},
			isSticked: function () {
				return this.node.classList.contains("main-grid-settings-window-list-item-sticked");
			},
			onStickyButtonClick: function () {
				if (this.isSticked()) {
					this.unstick();
				} else {
					this.stick();
				}
			},
			stick: function () {
				this.node.classList.add("main-grid-settings-window-list-item-sticked");
			},
			unstick: function () {
				this.node.classList.remove("main-grid-settings-window-list-item-sticked");
			},
			onEditButtonClick: function (event) {
				event.stopPropagation();
				this.isEditEnabled() ? this.disableEdit() : this.enableEdit();
			},
			/**
			 * @private
			 * @param {object} state
			 * @property {boolean} state.selected
			 * @property {title} state.title
			 */
			setState: function (state) {
				this.state = state;
			},
			/**
			 * Gets state of column
			 * @return {object}
			 */
			getState: function () {
				return this.state;
			},
			/**
			 * Updates default state
			 */
			updateState: function () {
				this.setState({
					selected: this.isSelected(),
					sticked: this.isSticked(),
					title: this.getTitle()
				});
			},
			/**
			 * Restores last state
			 */
			restoreState: function () {
				var state = this.getState();
				state.selected ? this.select() : this.unselect();
				state.sticked ? this.stick() : this.unstick();
				this.setTitle(state.title);
			},
			/**
			 * Gets column id
			 * @return {string}
			 */
			getId: function () {
				return this.getNode().dataset.name;
			},
			/**
			 * Gets column title
			 * @return {string}
			 */
			getTitle: function () {
				return this.getLabel().innerText;
			},
			/**
			 * Sets column title
			 * @param {string} title
			 */
			setTitle: function (title) {
				this.getLabel().innerText = !!title && title !== "undefined" ? title : this.getDefaultTitle();
			},
			/**
			 * @return {boolean}
			 */
			isEdited: function () {
				return this.getTitle() !== this.getDefaultTitle();
			},
			/**
			 * Gets column settings
			 * @return {?object}
			 */
			getSettings: function () {
				if (this.settings === null) {
					var columns = this.parent.getParam('DEFAULT_COLUMNS');
					this.settings = this.getId() in columns ? columns[this.getId()] : {};
				}
				return this.settings;
			},
			/**
			 * Checks column is default
			 * @return {boolean}
			 */
			isDefault: function () {
				if (this.default === null) {
					var settings = this.getSettings();
					this.default = 'default' in settings ? settings.default : false;
				}
				return this.default;
			},
			/**
			 * Restore column to default state
			 */
			restore: function () {
				this.isDefault() ? this.select() : this.unselect();
				this.setTitle(this.getDefaultTitle());
				this.node.dataset.stickedDefault === "true" ? this.stick() : this.unstick();
				this.disableEdit();
				this.updateState();
			},
			/**
			 * Gets default column title
			 * @return {?string}
			 */
			getDefaultTitle: function () {
				if (this.defaultTitle === null) {
					var settings = this.getSettings();
					this.defaultTitle = 'name' in settings ? settings.name : this.lastTitle;
				}
				return this.defaultTitle;
			},
			/**
			 * Gets column node
			 * @return {?HTMLElement}
			 */
			getNode: function () {
				return this.node;
			},
			/**
			 * Gets column label node
			 * @return {?HTMLLabelElement}
			 */
			getLabel: function () {
				if (this.label === null) {
					this.label = BX.Grid.Utils.getByTag(this.getNode(), 'label', true);
					BX.Event.bind(this.label, 'paste', this.onLabelPaste.bind(this));
					BX.Event.bind(this.label, 'keydown', this.onLabelKeydown.bind(this));
				}
				return this.label;
			},
			onLabelPaste: function (event) {
				event.preventDefault();
				if (event.clipboardData && event.clipboardData.getData) {
					var sourceText = event.clipboardData.getData("text/plain");
					var encodedText = BX.Text.encode(sourceText);
					var formattedHtml = encodedText.trim().replace(new RegExp('\t', 'g'), " ").replace(new RegExp('\n', 'g'), " ").replace(/ +(?= )/g, '');
					document.execCommand("insertHTML", false, formattedHtml);
				}
			},
			onLabelKeydown: function (event) {
				if (event.keyCode === 13) {
					event.preventDefault();
				}
			},
			/**
			 * Gets column checkbox node
			 * @return {?HTMLInputElement}
			 */
			getCheckbox: function () {
				if (this.checkbox === null) {
					this.checkbox = BX.Grid.Utils.getBySelector(this.getNode(), 'input[type="checkbox"]', true);
				}
				return this.checkbox;
			},
			/**
			 * Gets edit button
			 * @return {?HTMLElement}
			 */
			getEditButton: function () {
				if (this.editButton === null) {
					this.editButton = BX.Grid.Utils.getByClass(this.getNode(), this.parent.settings.get('classSettingsWindowColumnEditButton'), true);
				}
				return this.editButton;
			},
			/**
			 * Enables edit mode
			 */
			enableEdit: function () {
				this.getLabel().contentEditable = true;
				this.getCheckbox().disabled = true;
				this.adjustCaret();
			},
			/**
			 * Disables edit mode
			 */
			disableEdit: function () {
				this.getLabel().contentEditable = false;
				this.getCheckbox().disabled = false;
			},
			/**
			 * Checks is edit enabled
			 * @return {boolean}
			 */
			isEditEnabled: function () {
				return this.getLabel().isContentEditable;
			},
			/**
			 * Checks column is active
			 * @return {boolean}
			 */
			isSelected: function () {
				return this.getCheckbox().checked;
			},
			/**
			 * Selects column
			 */
			select: function () {
				this.getCheckbox().checked = true;
			},
			/**
			 * Unselects column
			 */
			unselect: function () {
				this.getCheckbox().checked = false;
			},
			/**
			 * @private
			 */
			adjustCaret: function () {
				var range = document.createRange();
				var selection = window.getSelection();
				var elementTextLength = this.getLabel().innerText.length;
				var textNodes = this.getLabel().childNodes;
				var lastTextNode = textNodes[textNodes.length - 1];
				range.setStart(lastTextNode, elementTextLength);
				range.setEnd(lastTextNode, elementTextLength);
				range.collapse(true);
				selection.removeAllRanges();
				selection.addRange(range);
				BX.fireEvent(this.getNode(), 'focus');
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid.SettingsWindow');

		/**
		 * @param {BX.Main.grid} parent
		 * @constructor
		 */
		BX.Grid.SettingsWindow.Manager = function (parent) {
			this.parent = null;
			this.fieldsSettingsInstance = null;
			this.popupStateTracked = false;
			this.init(parent);
		};
		BX.Grid.SettingsWindow.Manager.prototype = {
			init(parent) {
				this.parent = parent;

				// BX.proxy returns a new function every call, so the handlers have to be kept to be
				// unbound later: passing a fresh proxy to unbind left them in place.
				this.boundContainerClick = BX.proxy(this._onContainerClick, this);
				this.boundColumnMoved = BX.proxy(this._onColumnMoved, this);
				BX.bind(this.parent.getContainer(), 'click', this.boundContainerClick);
				BX.addCustomEvent(window, 'Grid::columnMoved', this.boundColumnMoved);
			},
			destroy() {
				BX.unbind(this.parent.getContainer(), 'click', this.boundContainerClick);
				BX.removeCustomEvent(window, 'Grid::columnMoved', this.boundColumnMoved);

				// getPopup() builds the window when there is none, so asking it here used to raise
				// one on a grid whose settings were never opened, only to take it down again.
				if (this.fieldsSettingsInstance) {
					this.fieldsSettingsInstance.destroy();
					this.fieldsSettingsInstance = null;
				}
			},
			_onContainerClick(event) {
				if (BX.hasClass(event.target, this.parent.settings.get('classSettingsButton'))) {
					this._onSettingsButtonClick(event);
				}
			},
			_onSettingsButtonClick() {
				this.getFieldsSettingsInstance().then(fieldsSettingsInstance => {
					this.fieldsSettingsInstance = fieldsSettingsInstance;
					this.trackPopupState(fieldsSettingsInstance);
					this.fieldsSettingsInstance.show();
					BX.onCustomEvent(window, 'BX.Grid.SettingsWindow:show', [this.fieldsSettingsInstance]);
				});
			},
			/**
			 * Keeps `aria-expanded` of the settings button in step with the dialog: a screen reader
			 * has to hear the state change, not only the initial collapsed one. The dialog closes on
			 * its own too (Esc, the close icon, an applied change), so the state is read from the
			 * popup rather than from the click.
			 *
			 * @param {Object} fieldsSettingsInstance
			 */
			trackPopupState(fieldsSettingsInstance) {
				if (this.popupStateTracked) {
					return;
				}
				const popup = fieldsSettingsInstance.getMainPopup?.();
				if (!popup?.subscribe) {
					return;
				}
				this.popupStateTracked = true;
				popup.subscribe('onShow', () => this.setButtonExpanded(true));
				popup.subscribe('onAfterClose', () => this.setButtonExpanded(false));
				popup.subscribe('onDestroy', () => this.setButtonExpanded(false));
			},
			setButtonExpanded(expanded) {
				const button = this.getSettingsButton();
				if (button) {
					button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
				}
			},
			getSettingsButton() {
				// The head of the grid itself: the pinned copy of it carries a button of its own.
				const head = this.parent.getHead();
				return head ? head.querySelector(`.${this.parent.settings.get('classSettingsButton')}`) : null;
			},
			getFieldsSettingsInstance() {
				if (this.fieldsSettingsInstance) {
					return Promise.resolve(this.fieldsSettingsInstance);
				}
				return new Promise(resolve => {
					const fieldsSettingsInstance = this.createFieldsSettingsInstance();
					resolve(fieldsSettingsInstance);
				});
			},
			createFieldsSettingsInstance() {
				let fieldsSettingsInstance = null;
				const {
					parent
				} = this;
				const params = {
					grid: parent,
					parent,
					isUseLazyLoadColumns: this.useLazyLoadColumns(),
					title: this.getPopupTitle(),
					placeholder: parent.getParam('SETTINGS_FIELD_SEARCH_PLACEHOLDER'),
					emptyStateTitle: parent.getParam('SETTINGS_FIELD_SEARCH_EMPTY_STATE_TITLE'),
					emptyStateDescription: parent.getParam('SETTINGS_FIELD_SEARCH_EMPTY_STATE_DESCRIPTION'),
					allSectionsDisabledTitle: parent.getParam('SETTINGS_FIELD_SEARCH_ALL_SECTIONS_DISABLED')
				};
				if (this.useCheckboxList()) {
					fieldsSettingsInstance = new BX.Grid.SettingsWindow.CheckboxList(params);
				} else {
					fieldsSettingsInstance = new BX.Grid.SettingsWindow.Popup(params);
				}
				fieldsSettingsInstance.createPopup();
				BX.onCustomEvent(window, 'BX.Grid.SettingsWindow:init', [fieldsSettingsInstance]);
				return fieldsSettingsInstance;
			},
			useCheckboxList() {
				return Boolean(this.parent.getParam('USE_CHECKBOX_LIST_FOR_SETTINGS_POPUP')) && main_core.Type.isFunction(BX.UI?.CheckboxList);
			},
			useLazyLoadColumns() {
				return Boolean(this.parent.getParam('LAZY_LOAD'));
			},
			_onColumnMoved(grid, columns) {
				this.sortItems(columns);
				this.reset();
			},
			sortItems(columns) {
				this.getPopup().sortItems(columns);
			},
			reset() {
				this.getPopup().reset();
			},
			getSelectedColumns() {
				return this.getPopup().getSelectedColumns();
			},
			getPopup() {
				if (this.fieldsSettingsInstance === null) {
					this.fieldsSettingsInstance = this.createFieldsSettingsInstance();
				}
				return this.fieldsSettingsInstance;
			},
			getPopupTitle() {
				const customSettingsTitle = this.parent.getParam('SETTINGS_WINDOW_TITLE');
				const settingsTitle = this.parent.getParam('SETTINGS_TITLE');
				const tmpDiv = main_core.Tag.render`<div></div>`;
				if (main_core.Type.isStringFilled(customSettingsTitle)) {
					tmpDiv.innerHTML = `<span>${settingsTitle} &laquo;${customSettingsTitle}&raquo;</span>`;
					return tmpDiv.firstChild.innerText;
				}
				const gridsCount = BX.Main.gridManager.data.length;
				if (gridsCount === 1) {
					const getTitleFromNodeById = nodeId => {
						const node = document.getElementById(nodeId);
						return main_core.Type.isDomNode(node) && main_core.Type.isStringFilled(node.innerText) ? main_core.Text.encode(node.innerText) : '';
					};
					const pageTitle = getTitleFromNodeById('pagetitle');
					const pageTitleBtnWrapper = getTitleFromNodeById('pagetitle_btn_wrapper');
					const fullTitle = `${pageTitle} ${pageTitleBtnWrapper}`.trim();
					tmpDiv.innerHTML = `<span>${settingsTitle} &laquo;${fullTitle}&raquo;</span>`;
					return tmpDiv.firstChild.innerText;
				}
				return settingsTitle;
			},
			getShowedColumns() {
				const result = [];
				const cells = this.parent.getRows().getHeadFirstChild().getCells();
				[].slice.call(cells).forEach(column => {
					if ('name' in column.dataset) {
						result.push(column.dataset.name);
					}
				});
				return result;
			},
			getItems() {
				return this.getPopup().getItems();
			},
			saveColumns(columns, callback) {
				this.getPopup().saveColumnsByNames(columns, callback);
			},
			select(name, value = true) {
				this.getPopup().select(name, value);
			}
		};
	})();

	const namespace = main_core.Reflection.namespace('BX.Grid.SettingsWindow');
	class Popup {
		options = {};
		items = null;
		popupItems = null;
		popup = null;
		filterSectionsSearchInput = null;
		filterSections = null;
		allColumns = null;
		applyButton = null;
		resetButton = null;
		cancelButton = null;
		selectAllButton = null;
		unselectAllButton = null;
		constructor(options) {
			this.options = options;
			this.grid = options.grid;
			this.parent = options.parent;
		}
		getPopup() {
			if (!this.popup) {
				this.createPopup();
			}
			return this.popup;
		}
		createPopup() {
			if (this.popup) {
				return;
			}
			const leftIndentFromWindow = 20;
			const rightIndentFromWindow = 20;
			const popupWidth = document.body.offsetWidth > 1000 ? 1000 : document.body.offsetWidth - leftIndentFromWindow - rightIndentFromWindow;
			const {
				title: titleBar
			} = this.options;
			this.popup = new main_popup.Popup(this.getPopupId(), null, {
				titleBar,
				ariaLabel: titleBar,
				focusTrap: true,
				autoHide: false,
				overlay: 0.6,
				width: popupWidth,
				closeIcon: true,
				closeByEsc: true,
				contentNoPaddings: true,
				content: this.getSourceContent(),
				events: {
					onPopupClose: this.onPopupClose.bind(this)
				}
			});
			this.getItems().forEach(item => {
				main_core.Event.bind(item.getNode(), 'click', this.onItemClick.bind(this));
				main_core.Event.bind(item.getNode(), 'animationend', this.onAnimationEnd.bind(this, item.getNode()));
			});
			main_core.Event.bind(this.getResetButton(), 'click', this.onResetButtonClick.bind(this));
			main_core.Event.bind(this.getApplyButton(), 'click', this.onApplyButtonClick.bind(this));
			main_core.Event.bind(this.getCancelButton(), 'click', this.popup.close.bind(this.popup));
			main_core.Event.bind(this.getSelectAllButton(), 'click', this.onSelectAll.bind(this));
			main_core.Event.bind(this.getUnselectAllButton(), 'click', this.onUnselectAll.bind(this));
			if (main_core.Type.isObjectLike(this.grid.arParams.COLUMNS_ALL_WITH_SECTIONS) && Object.keys(this.grid.arParams.COLUMNS_ALL_WITH_SECTIONS).length > 0) {
				this.prepareFilterSections();
			}
			if (this.grid.arParams.ENABLE_FIELDS_SEARCH) {
				this.prepareFilterSectionsSearchInput();
			}
		}
		getMainPopup() {
			return this.getPopup();
		}
		show() {
			this.popup.show();
		}
		close() {
			this.onPopupClose();
		}

		/**
		 * The popup is registered by an id built from the grid id, so a node left in the document
		 * makes the next `new Popup()` with that id fail as a duplicate, and the window that comes
		 * up after it answers no clicks. Closing alone does not remove the node - the variant of
		 * this window built on a checkbox list destroys its popup for the same reason.
		 */
		destroy() {
			this.popup?.destroy();
			this.popup = null;
		}
		onPopupClose() {
			this.emitSaveEvent();
			this.restoreLastColumns();
			this.disableAllColumnsLabelEdit();
			this.adjustActionButtonsState();
		}
		emitSaveEvent() {
			main_core_events.EventEmitter.emit(window, 'BX.Grid.SettingsWindow:close', [this, this.parent]);
		}
		restoreLastColumns() {
			this.getItems().forEach(current => current.restoreState());
		}
		disableAllColumnsLabelEdit() {
			this.getItems().forEach(column => column.disableEdit());
		}
		getPopupId() {
			return `${this.grid.getContainerId()}-grid-settings-window`;
		}
		getSourceContent() {
			const classSettingsWindow = this.grid.settings.get('classSettingsWindow');
			const sourceContent = this.grid.getContainer().querySelector(`.${classSettingsWindow}`);

			// Closed, the node sits inline in the form at zero height: visually gone, but its controls
			// keep their place in the tab order ahead of the table. It is marked inert in the markup
			// and comes back to the keyboard only here, on its way into the popup.
			sourceContent?.removeAttribute('inert');
			if (!this.options.isUseLazyLoadColumns) {
				return sourceContent;
			}
			const contentList = sourceContent.querySelector('.main-grid-settings-window-list');
			contentList.innerHTML = '';
			const loader = new main_loader.Loader({
				target: contentList
			});
			void loader.show();
			this.fetchColumns().then(response => {
				response.forEach(columnOptions => {
					this.prepareColumnOptions(columnOptions);
					main_core.Dom.append(this.createColumnElement(columnOptions), contentList);
				});
				this.hideAndDestroyLoader();
				this.reset();
				this.getItems().forEach(item => {
					main_core.Event.bind(item.getNode(), 'click', this.onItemClick);
				});
				const fixedFooter = main_core.Tag.render`
					<div class="main-grid-popup-window-buttons-wrapper"></div>
				`;
				main_core.Dom.append(sourceContent.querySelector('.popup-window-buttons'), fixedFooter);
				requestAnimationFrame(() => {
					main_core.Dom.style(fixedFooter, {
						width: `${this.getPopupContainer().clientWidth}px`
					});
					main_core.Dom.append(fixedFooter, this.getPopupContainer());
				});
			}).catch(err => {
				console.error(err);
			});
			return sourceContent;
		}
		fetchColumns() {
			// @todo replace to vanilla Promise
			const promise = new BX.Promise();
			const lazyLoadParams = this.grid.getParam('LAZY_LOAD');
			const gridId = this.grid.getId();
			if (main_core.Type.isPlainObject(lazyLoadParams)) {
				const {
					CONTROLLER: controller,
					GET_LIST: url
				} = lazyLoadParams;
				if (main_core.Type.isNil(controller)) {
					main_core.ajax({
						url,
						method: 'GET',
						dataType: 'json',
						onsuccess: promise.fulfill.bind(promise)
					});
				} else {
					main_core.ajax.runAction(`${controller}.getColumnsList`, {
						method: 'GET',
						data: {
							gridId
						}
					}).then(promise.fulfill.bind(promise));
				}
			}
			return promise;
		}
		prepareColumnOptions(options) {
			if (!main_core.Type.isPlainObject(options)) {
				return;
			}
			const customNames = this.grid.getUserOptions().getCurrentOptions().custom_names;
			if (main_core.Type.isPlainObject(customNames) && options.id in customNames) {
				// eslint-disable-next-line no-param-reassign
				options.name = customNames[options.id];
			}
			if (this.grid.getColumnHeaderCellByName(options.id)) {
				// eslint-disable-next-line no-param-reassign
				options.selected = true;
			}
		}
		createColumnElement(options) {
			const checkboxId = `${options.id}-checkbox`;
			const checkedClass = options.selected ? ' checked' : '';
			return main_core.Tag.render`
			<div data-name=${options.id} class='main-grid-settings-window-list-item'>
				<input
					id='${checkboxId}'
					type='checkbox'
					class='main-grid-settings-window-list-item-checkbox${checkedClass})'
				>
				<label
					for='${checkboxId}'
					class='main-grid-settings-window-list-item-label'
				>
					${options.name}
				</label>
				<button
					type='button'
					class='main-grid-settings-window-list-item-edit-button'
					aria-label='${main_core.Loc.getMessage('interface_grid_column_rename') ?? ''}'
				></button>
			</div>
		`;
		}
		hideAndDestroyLoader(loader) {
			void loader.hide().then(() => loader.destroy());
		}
		onItemClick() {
			this.adjustActionButtonsState();
		}
		onAnimationEnd(node) {
			const display = main_core.Dom.hasClass(node, this.grid.settings.get('classSettingsWindowSearchSectionItemHidden')) ? 'none' : 'inline-block';
			main_core.Dom.style(node, {
				display
			});
		}
		adjustActionButtonsState() {
			if (this.getSelectedColumns().length > 0) {
				this.enableActions();
				return;
			}
			this.disableActions();
		}
		getSelectedColumns() {
			const columns = [];
			this.getItems().forEach(column => {
				if (column.isSelected()) {
					columns.push(column.getId());
				}
			});
			return columns;
		}
		getItems() {
			if (this.items === null) {
				const {
					grid
				} = this;
				const items = this.getPopupItems();
				this.items = [...items].map(current => {
					return new BX.Grid.SettingsWindow.Column(grid, current);
				});
			}
			return this.items;
		}
		getPopupItems() {
			if (!this.popupItems) {
				const popupContainer = this.getPopupContentContainer();
				const selector = this.grid.settings.get('classSettingsWindowColumn');
				this.popupItems = popupContainer.getElementsByClassName(selector);
			}
			return this.popupItems;
		}
		enableActions() {
			const applyButton = this.getApplyButton();
			if (applyButton) {
				main_core.Dom.removeClass(applyButton, this.grid.settings.get('classDisable'));
			}
		}
		prepareFilterSectionsSearchInput() {
			const input = this.getFilterSectionsSearchInput();
			main_core.Event.bind(input, 'input', this.onFilterSectionSearchInput.bind(this));
			main_core.Event.bind(input.previousElementSibling, 'click', this.onFilterSectionSearchInputClear.bind(this));
		}
		getFilterSectionsSearchInput() {
			if (!this.filterSectionsSearchInput) {
				const selector = this.grid.settings.get('classSettingsWindowSearchSectionInput');
				this.filterSectionsSearchInput = this.getPopupContentContainer().querySelector(`.${selector}`);
			}
			return this.filterSectionsSearchInput;
		}
		onFilterSectionSearchInput() {
			let search = this.filterSectionsSearchInput.value;
			if (search.length > 0) {
				search = search.toLowerCase();
			}
			this.items.forEach(item => {
				const title = item.lastTitle.toLowerCase();
				const node = item.getNode();
				if (search.length > 0 && !title.includes(search)) {
					main_core.Dom.removeClass(node, this.grid.settings.get('classSettingsWindowSearchSectionItemVisible'));
					main_core.Dom.addClass(node, this.grid.settings.get('classSettingsWindowSearchSectionItemHidden'));
				} else {
					main_core.Dom.removeClass(node, this.grid.settings.get('classSettingsWindowSearchSectionItemHidden'));
					main_core.Dom.addClass(node, this.grid.settings.get('classSettingsWindowSearchSectionItemVisible'));
					main_core.Dom.style(node, {
						display: 'inline-block'
					});
				}
			});
		}
		onFilterSectionSearchInputClear() {
			this.filterSectionsSearchInput.value = '';
			this.onFilterSectionSearchInput();
		}
		getResetButton() {
			if (this.resetButton === null) {
				this.resetButton = this.getButtonById(this.getResetButtonId());
			}
			return this.resetButton;
		}
		getResetButtonId() {
			return `${this.grid.getContainerId()}-grid-settings-reset-button`;
		}
		onResetButtonClick() {
			const params = {
				CONFIRM: true,
				CONFIRM_MESSAGE: this.grid.arParams.CONFIRM_RESET_MESSAGE
			};
			this.grid.confirmDialog(params, () => {
				this.enableWait(this.getApplyButton());
				this.grid.getUserOptions().reset(this.isForAll(), () => {
					this.grid.reloadTable(null, null, () => {
						this.restoreColumns();
						this.disableWait(this.getApplyButton());
						this.popup.close();
					});
				});
			});
		}
		restoreColumns() {
			this.getItems().forEach(column => column.restore());
			this.sortItems();
			this.reset();
		}

		/**
		 * @param {string[]} [columns] - showed column ids in the order chosen by the user; the popup
		 *   list itself is used when omitted, which only holds before the list has been reordered.
		 */
		sortItems(columns) {
			const movedColumns = main_core.Type.isArrayFilled(columns);
			const showedColumns = movedColumns ? columns : this.getShowedColumns();
			const allColumns = {};
			this.getAllColumns().forEach(name => {
				allColumns[name] = name;
			});
			let counter = 0;
			Object.keys(allColumns).forEach(name => {
				const isShowed = movedColumns ? showedColumns.includes(name) : this.isShowedColumn(name);
				if (isShowed) {
					allColumns[name] = showedColumns[counter];
					counter++;
				}
				const current = this.getColumnByName(allColumns[name]);
				if (current) {
					main_core.Dom.append(current, current.parentNode);
				}
			});
		}
		getShowedColumns() {
			return this.parent.gridSettings.getSelectedColumns();
		}
		getColumnByName(name) {
			return BX.Grid.Utils.getBySelector(this.getPopupContainer(), `.${this.grid.settings.get('classSettingsWindowColumn')}[data-name="${name}"]`, true);
		}
		isShowedColumn(columnName) {
			return this.getSelectedColumns().includes(columnName);
		}
		getAllColumns() {
			if (!this.allColumns) {
				this.allColumns = this.getItems().map(column => column.getId());
			}
			return this.allColumns;
		}
		reset() {
			this.popupItems = null;
			this.allColumns = null;
			this.items = null;
		}
		getApplyButton() {
			if (this.applyButton === null) {
				this.applyButton = this.getButtonById(this.getApplyButtonId());
			}
			return this.applyButton;
		}
		getApplyButtonId() {
			return `${this.grid.getContainerId()}-grid-settings-apply-button`;
		}
		onApplyButtonClick() {
			const params = {
				CONFIRM: this.isForAll(),
				CONFIRM_MESSAGE: this.grid.getParam('SETTINGS_FOR_ALL_CONFIRM_MESSAGE')
			};
			this.grid.confirmDialog(params, () => this.onApplyConfirmDialogButton(), () => this.unselectForAllCheckbox());
		}
		onApplyConfirmDialogButton() {
			this.enableWait(this.getApplyButton());
			this.saveColumns(this.getSelectedColumns(), () => {
				this.popup.close();
				this.disableWait(this.getApplyButton());
				this.unselectForAllCheckbox();
			});
			this.emitSaveEvent();
		}
		enableWait(buttonNode) {
			main_core.Dom.addClass(buttonNode, 'ui-btn-wait');
			main_core.Dom.removeClass(buttonNode, 'popup-window-button');
		}
		disableWait(buttonNode) {
			main_core.Dom.removeClass(buttonNode, 'ui-btn-wait');
			main_core.Dom.addClass(buttonNode, 'popup-window-button');
		}
		saveColumns(columns, callback) {
			const options = this.grid.getUserOptions();
			const columnNames = this.getColumnNames();
			const stickyColumns = this.getStickedColumns();
			const batch = [{
				action: options.getAction('GRID_SET_COLUMNS'),
				columns: columns.join(',')
			}, {
				action: options.getAction('SET_CUSTOM_NAMES'),
				custom_names: columnNames
			}, {
				action: options.getAction('GRID_SET_STICKED_COLUMNS'),
				stickedColumns: stickyColumns
			}];
			if (this.isForAll()) {
				batch.push({
					action: options.getAction('GRID_SAVE_SETTINGS'),
					view_id: 'default',
					set_default_settings: 'Y',
					delete_user_settings: 'Y'
				});
			}
			options.batch(batch, () => this.grid.reloadTable(null, null, callback));
			this.updateColumnsState();
		}
		getColumnNames() {
			const names = {};
			this.getItems().forEach(column => {
				if (column.isEdited()) {
					names[column.getId()] = column.getTitle();
				}
			});
			return names;
		}
		getStickedColumns() {
			return this.getItems().reduce((accumulator, item) => {
				if (item.isSticked()) {
					accumulator.push(item.getId());
				}
				return accumulator;
			}, []);
		}
		updateColumnsState() {
			this.getItems().forEach(current => current.updateState());
		}
		isForAll() {
			const checkbox = this.getForAllCheckbox();
			return checkbox && Boolean(checkbox.checked);
		}
		unselectForAllCheckbox() {
			const checkbox = this.getForAllCheckbox();
			if (checkbox) {
				checkbox.checked = null;
			}
		}
		getForAllCheckbox() {
			return this.getPopupContainer().querySelector('.main-grid-settings-window-for-all-checkbox');
		}
		getPopupContainer() {
			return this.getPopup().getPopupContainer();
		}
		getPopupContentContainer() {
			return this.getPopup().getContentContainer();
		}

		/**
		 * The ids of these buttons are built from the grid id, but the document can hold nodes of
		 * another grid, and of a window left over from an earlier one: looking a button up across
		 * the whole document found a foreign or a stale node, and the handler went there instead of
		 * to the button of this window. The popup takes the markup out of the grid container and
		 * holds it by the time these getters run, so the search stays inside the popup at hand -
		 * as the neighbouring getters of the select-all links already do.
		 */
		getButtonById(id) {
			return this.getPopupContentContainer()?.querySelector(`#${CSS.escape(id)}`) ?? null;
		}
		getCancelButton() {
			if (this.cancelButton === null) {
				this.cancelButton = this.getButtonById(this.getCancelButtonId());
			}
			return this.cancelButton;
		}
		getCancelButtonId() {
			return `${this.grid.getContainerId()}-grid-settings-cancel-button`;
		}
		getSelectAllButton() {
			if (!this.selectAllButton) {
				const selector = this.grid.settings.get('classSettingsWindowSelectAll');
				this.selectAllButton = this.getPopupContentContainer().querySelector(`.${selector}`);
			}
			return this.selectAllButton;
		}
		onSelectAll() {
			this.selectAll();
			this.enableActions();
		}
		selectAll() {
			this.getItems().forEach(column => column.select());
		}
		getUnselectAllButton() {
			if (!this.unselectAllButton) {
				const selector = this.grid.settings.get('classSettingsWindowUnselectAll');
				this.unselectAllButton = this.getPopupContentContainer().querySelector(`.${selector}`);
			}
			return this.unselectAllButton;
		}
		onUnselectAll() {
			this.unselectAll();
			this.disableActions();
		}
		disableActions() {
			const applyButton = this.getApplyButton();
			if (applyButton) {
				main_core.Dom.addClass(applyButton, this.grid.settings.get('classDisable'));
			}
		}
		unselectAll() {
			this.getItems().forEach(column => column.unselect());
		}
		prepareFilterSections() {
			const filterSections = this.getFilterSections();
			for (const item of filterSections) {
				main_core.Event.bind(item, 'click', this.onFilterSectionClick.bind(this, item));
			}
		}
		getFilterSections() {
			if (!this.filterSections) {
				const selector = this.grid.settings.get('classSettingsWindowSearchSectionsWrapper');
				const wrapper = this.getPopupContentContainer().querySelector(`.${selector}`);
				this.filterSections = wrapper.children ?? new HTMLCollection();
			}
			return this.filterSections;
		}
		onFilterSectionClick(item) {
			const activeClass = this.grid.settings.get('classSettingsWindowSearchActiveSectionIcon');
			const sectionId = item.dataset?.uiGridFilterSectionButton;
			const section = document.querySelector(`[data-ui-grid-filter-section='${sectionId}']`);
			if (main_core.Dom.hasClass(item.firstChild, activeClass)) {
				main_core.Dom.removeClass(item.firstChild, activeClass);
				main_core.Dom.hide(section);
				item.setAttribute('aria-pressed', 'false');
			} else {
				main_core.Dom.addClass(item.firstChild, activeClass);
				main_core.Dom.show(section);
				item.setAttribute('aria-pressed', 'true');
			}
		}
		select(id, value = true) {
			const column = this.getItems().find(item => item.getId() === id);
			if (value) {
				column?.select();
			} else {
				column?.unselect();
			}
		}
		saveColumnsByNames(columns, callback) {
			this.saveColumns(columns, callback);
		}
	}
	namespace.Popup = Popup;

	(function () {

		BX.namespace('BX.Grid');

		/**
		 * BX.Grid.UserOptions
		 * @param {BX.Main.grid} parent
		 * @param {Object} userOptions
		 * @param {Object} userOptionsActions
		 * @param {String} url
		 * @constructor
		 */
		BX.Grid.UserOptions = function (parent, userOptions, userOptionsActions, url) {
			this.options = null;
			this.actions = null;
			this.parent = null;
			this.url = null;
			this.init(parent, userOptions, userOptionsActions, url);
		};
		BX.Grid.UserOptions.prototype = {
			init(parent, userOptions, userOptionsActions, url) {
				this.url = url;
				this.parent = parent;
				try {
					this.options = eval(userOptions);
				} catch {
					console.warn('BX.Grid.UserOptions.init: Failed parse user options json string');
				}
				try {
					this.actions = eval(userOptionsActions);
				} catch {
					console.warn('BX.Grid.UserOptions.init: Failed parse user options actions json string');
				}
			},
			getCurrentViewName() {
				const options = this.getOptions();
				return 'current_view' in options ? options.current_view : null;
			},
			getViewsList() {
				const options = this.getOptions();
				return 'views' in options ? options.views : {};
			},
			getCurrentOptions() {
				const name = this.getCurrentViewName();
				const views = this.getViewsList();
				let result = null;
				if (name in views) {
					result = views[name];
				}
				if (!BX.type.isPlainObject(result)) {
					result = {};
				}
				return result;
			},
			getUrl(action) {
				return BX.util.add_url_param(this.url, {
					GRID_ID: this.parent.getContainerId(),
					bxajaxid: this.parent.getAjaxId(),
					action
				});
			},
			getOptions() {
				return this.options || {};
			},
			getActions() {
				return this.actions;
			},
			getAction(name) {
				let action = null;
				try {
					action = this.getActions()[name];
				} catch {
					action = null;
				}
				return action;
			},
			update(newOptions) {
				this.options = newOptions;
			},
			setColumns(columns, callback) {
				const options = this.getCurrentOptions();
				if (BX.type.isPlainObject(options)) {
					options.columns = columns.join(',');
					this.save(this.getAction('GRID_SET_COLUMNS'), {
						columns: options.columns
					}, callback);
				}
				return this;
			},
			setColumnsNames(columns, callback) {
				const options = {
					view_id: 'default'
				};
				if (BX.type.isPlainObject(options)) {
					options.custom_names = columns;
					this.save(this.getAction('SET_CUSTOM_NAMES'), options, callback);
				}
				return this;
			},
			setColumnSizes(sizes, expand, resized = []) {
				this.save(this.getAction('GRID_SET_COLUMN_SIZES'), {
					sizes,
					expand,
					resized
				});
			},
			reset(forAll, callback) {
				let data = {};
				if (forAll) {
					data = {
						view_id: 'default',
						set_default_settings: 'Y',
						delete_user_settings: 'Y',
						view_settings: this.getCurrentOptions()
					};
				}
				this.save(this.getAction('GRID_RESET'), data, callback);
			},
			setSort(by, order, callback) {
				if (by && order) {
					this.save(this.getAction('GRID_SET_SORT'), {
						by,
						order
					}, callback);
				}
				return this;
			},
			setPageSize(pageSize, callback) {
				if (BX.type.isNumber(parseInt(pageSize))) {
					this.save(this.getAction('GRID_SET_PAGE_SIZE'), {
						pageSize
					}, callback);
				}
			},
			setExpandedRows(ids, callback) {
				BX.type.isArray(ids) && this.save(this.getAction('GRID_SET_EXPANDED_ROWS'), {
					ids
				}, callback);
			},
			setCollapsedGroups(ids, callback) {
				BX.type.isArray(ids) && this.save(this.getAction('GRID_SET_COLLAPSED_GROUPS'), {
					ids
				}, callback);
			},
			resetExpandedRows() {
				this.save(this.getAction('GRID_RESET_EXPANDED_ROWS'), {});
			},
			saveForAll(callback) {
				this.save(this.getAction('GRID_SAVE_SETTINGS'), {
					view_id: 'default',
					set_default_settings: 'Y',
					delete_user_settings: 'Y',
					view_settings: this.getCurrentOptions()
				}, callback);
			},
			batch(data, callback) {
				this.save(this.getAction('GRID_SAVE_BATH'), {
					bath: data
				}, callback);
			},
			save(action, data, callback) {
				const self = this;
				BX.ajax.post(this.getUrl(action), data, res => {
					try {
						res = JSON.parse(res);
						if (!res.error) {
							self.update(res);
							if (BX.type.isFunction(callback)) {
								callback(res);
							}
							BX.onCustomEvent(self.parent.getContainer(), 'Grid::optionsChanged', [self.parent]);
						}
					} catch {}
				});
			}
		};
	})();

	(function () {

		BX.namespace('BX.Grid');
		BX.Grid.Utils = {
			/**
			 * Prepares url for ajax request
			 * @param {string} url
			 * @param {string} ajaxId Bitrix ajax id
			 * @returns {string} Prepares ajax url with ajax id
			 */
			ajaxUrl(url, ajaxId) {
				return this.addUrlParams(url, {
					bxajaxid: ajaxId
				});
			},
			addUrlParams(url, params) {
				return BX.util.add_url_param(url, params);
			},
			/**
			 * Moves array item currentIndex to newIndex
			 * @param {array} array
			 * @param {int} currentIndex
			 * @param {int} newIndex
			 * @returns {*}
			 */
			arrayMove(array, currentIndex, newIndex) {
				if (newIndex >= array.length) {
					let k = newIndex - array.length;
					while (k-- + 1) {
						array.push(undefined);
					}
				}
				array.splice(newIndex, 0, array.splice(currentIndex, 1)[0]);
				return array;
			},
			/**
			 * Gets item index in array or HTMLCollection
			 * @param {array|HTMLCollection} collection
			 * @param {*} item
			 * @returns {number}
			 */
			getIndex(collection, item) {
				return [].indexOf.call(collection || [], item);
			},
			/**
			 * Gets nextElementSibling
			 * @param {Element} currentItem
			 * @returns {Element|null}
			 */
			getNext(currentItem) {
				if (currentItem) {
					return currentItem.nextElementSibling || null;
				}
			},
			/**
			 * Gets previousElementSibling
			 * @param {Element} currentItem
			 * @returns {Element|null}
			 */
			getPrev(currentItem) {
				if (currentItem) {
					return currentItem.previousElementSibling || null;
				}
			},
			/**
			 * Gets closest parent element of node
			 * @param {Node} item
			 * @param {string} [className]
			 * @returns {*|null|Node}
			 */
			closestParent(item, className) {
				if (item) {
					if (!className) {
						return item.parentNode || null;
					}
					return BX.findParent(item, {
						className
					});
				}
			},
			/**
			 * Gets closest childs of node
			 * @param item
			 * @returns {Array|null}
			 */
			closestChilds(item) {
				if (item) {
					return item.children || null;
				}
			},
			/**
			 * Sorts collection
			 * @param current
			 * @param target
			 */
			collectionSort(current, target) {
				let root;
				let collection;
				let collectionLength;
				let currentIndex;
				let targetIndex;
				if (current && target && current !== target && current.parentNode === target.parentNode) {
					root = this.closestParent(target);
					collection = this.closestChilds(root);
					collectionLength = collection.length;
					currentIndex = this.getIndex(collection, current);
					targetIndex = this.getIndex(collection, target);
					if (collectionLength === targetIndex) {
						root.appendChild(target);
					}
					if (currentIndex > targetIndex) {
						root.insertBefore(current, target);
					}
					if (currentIndex < targetIndex && collectionLength !== targetIndex) {
						root.insertBefore(current, this.getNext(target));
					}
				}
			},
			/**
			 * Gets table collumn
			 * @param table
			 * @param cell
			 * @returns {Array}
			 */
			getColumn(table, cell) {
				const currentIndex = this.getIndex(this.closestChilds(this.closestParent(cell)), cell);
				const column = [];
				[].forEach.call(table.rows, current => {
					column.push(current.cells[currentIndex]);
				});
				return column;
			},
			/**
			 * Sets style properties and values for each item in collection
			 * @param {HTMLElement[]|HTMLCollection} collection
			 * @param {object} properties
			 */
			styleForEach(collection, properties) {
				properties = BX.type.isPlainObject(properties) ? properties : null;
				const keys = Object.keys(properties);
				[].forEach.call(collection || [], current => {
					keys.forEach(propKey => {
						BX.style(current, propKey, properties[propKey]);
					});
				});
			},
			requestAnimationFrame() {
				const raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function (callback) {
					window.setTimeout(callback, 1000 / 60);
				};
				raf.apply(window, arguments);
			},
			/**
			 * Gets elements by class name
			 * @param rootElement
			 * @param className
			 * @param first
			 * @returns {Array|null}
			 */
			getByClass(rootElement, className, first) {
				let result = [];
				if (className) {
					result = rootElement ? rootElement.getElementsByClassName(className) : [];
					if (first) {
						result = result.length > 0 ? result[0] : null;
					} else {
						result = [].slice.call(result);
					}
				}
				return result;
			},
			getByTag(rootElement, tag, first) {
				let result = [];
				if (tag) {
					result = rootElement ? rootElement.getElementsByTagName(tag) : [];
					if (first) {
						result = result.length > 0 ? result[0] : null;
					} else {
						result = [].slice.call(result);
					}
				}
				return result;
			},
			getBySelector(rootElement, selector, first) {
				let result = [];
				if (selector) {
					if (first) {
						result = rootElement ? rootElement.querySelector(selector) : null;
					} else {
						result = rootElement ? rootElement.querySelectorAll(selector) : [];
						result = [].slice.call(result);
					}
				}
				return result;
			},
			/**
			 * Takes a node out of the accessibility tree: assistive technology and the Tab order
			 * skip it. For decorative clones of live markup — the controls of the copy would
			 * otherwise be announced and focusable twice. Ids of a clone are not this method's
			 * business: `makeCloneIdsUnique` renames them and keeps the references inside the
			 * clone pointing at the renamed ones.
			 *
			 * `inert` does the whole job at once, so it is used whenever the copy is purely
			 * decorative. It is dropped only when `keepPointerSelector` names controls the user
			 * still drags — `inert` swallows the pointer events of the entire subtree, and the
			 * resize handles of the pinned header are registered from the clone itself. Without
			 * `inert` the same state is assembled by hand and the named controls get the pointer
			 * back.
			 *
			 * @param {Element} node
			 * @param {string} [keepPointerSelector] controls left operable for the pointer
			 * @returns {Element}
			 */
			hideFromAssistiveTech(node, keepPointerSelector) {
				if (!node) {
					return node;
				}
				const hidden = node;
				hidden.setAttribute('aria-hidden', 'true');
				BX.style(hidden, 'pointer-events', 'none');
				if (!keepPointerSelector) {
					hidden.inert = true;
				}
				hidden.querySelectorAll('button, input, select, textarea, a[href], [tabindex]').forEach(element => {
					element.setAttribute('tabindex', '-1');
				});
				hidden.querySelectorAll('button, input, select, textarea').forEach(element => {
					element.setAttribute('disabled', 'disabled');
				});
				if (keepPointerSelector) {
					hidden.querySelectorAll(keepPointerSelector).forEach(element => {
						BX.style(element, 'pointer-events', 'auto');
						element.removeAttribute('disabled');
					});
				}
				return hidden;
			},
			/**
			 * Rewrites the ids of a cloned subtree so that the clone does not repeat the ids of
			 * the markup it was cloned from. Attributes pointing at a renamed id - `for` of a
			 * label, the aria references - are repointed at the new one, so a control keeps
			 * working inside the clone; references to an id the clone does not carry are left
			 * alone, because they point outside of it.
			 *
			 * @param {Element} clone
			 * @param {string} prefix
			 */
			makeCloneIdsUnique(clone, prefix) {
				if (!clone) {
					return;
				}
				const referenceAttributes = ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns'];
				const renamed = new Map();

				// The root of the clone carries an id of its own as readily as its descendants,
				// and `querySelectorAll` does not return it.
				[clone, ...this.getBySelector(clone, '[id]')].forEach(node => {
					if (!node.id) {
						return;
					}
					const uniqueId = `${prefix}${node.id}`;
					renamed.set(node.id, uniqueId);
					BX.Dom.attr(node, 'id', uniqueId);
				});
				if (renamed.size === 0) {
					return;
				}
				const referenceSelector = referenceAttributes.map(name => `[${name}]`).join(',');
				[clone, ...this.getBySelector(clone, referenceSelector)].forEach(node => {
					referenceAttributes.forEach(name => {
						const value = node.getAttribute(name);
						if (value === null) {
							return;
						}

						// An aria reference may list several ids, so each one is looked up on its own.
						const rewritten = value.split(/\s+/).map(id => renamed.get(id) || id).join(' ');
						if (rewritten !== value) {
							BX.Dom.attr(node, name, rewritten);
						}
					});
				});
			},
			listenerParams(params) {
				try {
					window.addEventListener('test', null, params);
				} catch {
					params = false;
				}
				return params;
			}
		};
	})();

})(BX, BX.UI, BX.Event, BX.UI, BX, BX.Main);
//# sourceMappingURL=script.js.map
