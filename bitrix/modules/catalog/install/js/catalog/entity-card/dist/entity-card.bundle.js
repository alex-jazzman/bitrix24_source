/* eslint-disable */
this.BX = this.BX || {};
this.BX.Catalog = this.BX.Catalog || {};
(function (exports, main_core, main_core_events, ui_entityEditor, ui_notification, ui_feedback_form, ui_hint, ui_designTokens, ui_fonts_opensans, translit, main_popup, catalog_toolAvailabilityManager) {
	'use strict';

	class IblockSectionField extends BX.UI.EntityEditorField {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			this.innerWrapper = null;
		}
		getContentWrapper() {
			return this.innerWrapper;
		}
		layout(options = {}) {
			if (this._hasLayout) {
				return;
			}
			this.ensureWrapperCreated({
				classNames: ['catalog-entity-editor-content-block-field-iblock-section']
			});
			this.adjustWrapper();
			if (this.isNeedToDisplay()) {
				this._wrapper.appendChild(this.createTitleNode(this.getTitle()));
				if (this._mode === BX.UI.EntityEditorMode.edit) {
					this.drawEditMode();
				} else {
					this.drawViewMode();
				}
				if (this.isContextMenuEnabled()) {
					this._wrapper.appendChild(this.createContextMenuButton());
				}
			}
			this.registerLayout(options);
			this._hasLayout = true;
		}
		drawEditMode() {
			this.defaultInput = main_core.Tag.render`<input type="hidden" name="${this.getName()}[]" value="0">`;
			this._wrapper.appendChild(this.defaultInput);
			this.innerWrapper = main_core.Tag.render`<div class="ui-entity-editor-content-block"></div>`;
			this._wrapper.appendChild(this.innerWrapper);
			main_core.ajax.runComponentAction('bitrix:catalog.productcard.iblocksectionfield', 'lazyLoad', {
				mode: 'ajax',
				data: {
					iblockId: this.getIblockId(),
					productId: this.getProductId(),
					selectedSectionIds: this.getValue()
				}
			}).then(this.renderFromResponse.bind(this)).catch(response => {
				throw new Error(response.errors.join("\n"));
			});
		}
		renderFromResponse(response) {
			if (!this._wrapper) {
				return;
			}
			main_core.Runtime.html(this.innerWrapper, response.data.html, {
				callback: this.initEntitySelector.bind(this)
			});
		}
		initEntitySelector() {
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'Item:onSelect', this.markAsChanged.bind(this));
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'Item:onDeselect', this.markAsChanged.bind(this));
		}
		changeDisplay(node, isShow) {
			if (!node) {
				return;
			}
			node.style.display = isShow ? '' : 'none';
		}
		markAsChanged(event) {
			super.markAsChanged();
			main_core_events.EventEmitter.emit(this.getEditor(), 'IblockSectionField:onChange', [this, ...event.getData()]);
		}
		drawViewMode() {
			if (this.hasNoSections()) {
				this.innerWrapper = main_core.Tag.render`
				<div class="ui-entity-editor-content-block">
					${main_core.Loc.getMessage("CATALOG_ENTITY_CARD_EMPTY_SECTION")}
				</div>
			`;
				main_core.Dom.addClass(this._wrapper, 'ui-entity-editor-content-block-click-empty');
			} else {
				const content = [];
				this.getSections().forEach(section => {
					// ui-tile-selector-item-%type%
					let picture = '';
					if (main_core.Type.isStringFilled(section.PICTURE)) {
						picture = main_core.Tag.render`<span class="ui-tile-selector-item-picture" style="background-image: url('${main_core.Text.encode(section.PICTURE)}');"></span>`;
					}
					content.push(main_core.Tag.render`
					<span class="ui-tile-selector-item ui-tile-selector-item-readonly-yes">
						${picture}
						<span data-role="tile-item-name">${main_core.Text.encode(section.NAME)}</span>
					</span>
				`);
				});
				this.innerWrapper = main_core.Tag.render`
				<div class="ui-entity-editor-content-block">
					<span class="ui-tile-selector-selector-wrap readonly">
						${content}
					</span>
				</div>`;
			}
			this._wrapper.appendChild(this.innerWrapper);
		}
		getSections() {
			return this._model.getField('IBLOCK_SECTION_DATA', {});
		}
		getIblockId() {
			return this._model.getField('IBLOCK_ID', 0);
		}
		getProductId() {
			return this._model.getField('ID', 0);
		}
		hasNoSections() {
			const sectionIds = this.getValue();
			return sectionIds.length === 0 || sectionIds.length === 1 && (sectionIds.includes('0') || sectionIds.includes(0));
		}
		doClearLayout(options) {
			if (this.defaultInput) {
				main_core.Dom.clean(this.defaultInput);
				this.defaultInput = null;
			}
			if (this.innerWrapper) {
				main_core.Dom.clean(this.innerWrapper);
				this.innerWrapper = null;
			}
			this._hasLayout = false;
		}
		getModeSwitchType(mode) {
			let result = BX.UI.EntityEditorModeSwitchType.common;
			if (mode === BX.UI.EntityEditorMode.edit) {
				result |= BX.UI.EntityEditorModeSwitchType.button | BX.UI.EntityEditorModeSwitchType.content;
			}
			return result;
		}
	}

	class NameCodeField extends BX.UI.EntityEditorMultiText {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			this.isShownSymbolicCode = this.getSchemeShowCodeState() === 'true';
			this.allowToGenerateCode = this._editor.isNew();
		}
		getSchemeShowCodeState() {
			return BX.prop.get(this.getSchemeElement()._options, 'showCode');
		}
		setSchemeShowCodeState(state) {
			this.getSchemeElement()._options['showCode'] = state;
		}
		getValue = function () {
			return BX.UI.EntityEditorBoolean.superclass.getValue.apply(this);
		};
		hasContentToDisplay = function () {
			return true;
		};
		doPrepareContextMenuItems = function (menuItems) {
			if (this.isShownSymbolicCode) {
				menuItems.push({
					value: 'hide_symbolic_code',
					text: main_core.Loc.getMessage('CATALOG_ENTITY_CARD_HIDE_SYMBOLIC_CODE')
				});
			} else {
				menuItems.push({
					value: 'show_symbolic_code',
					text: main_core.Loc.getMessage('CATALOG_ENTITY_CARD_SHOW_SYMBOLIC_CODE')
				});
			}
		};
		processContextMenuCommand(e, command) {
			super.processContextMenuCommand(e, command);
			const codeContainerElement = document.getElementById('code_container');
			const nameCodeMarkerElement = document.getElementById('name_code_marker');
			if (command === 'hide_symbolic_code') {
				this.isShownSymbolicCode = false;
				this.allowToGenerateCode = this._editor.isNew();
				if (this._mode === BX.UI.EntityEditorMode.edit) {
					const codeTextElement = document.getElementById('code_text');
					const codeStateButtonElement = document.getElementById('code_state_button');
					codeTextElement.readOnly = this.allowToGenerateCode;
					if (this.allowToGenerateCode) {
						codeTextElement.className = 'ui-ctl-element ui-ctl-element-symbol-code-input-disabled';
						codeStateButtonElement.className = 'ui-ctl-before ui-ctl-icon-chain';
					} else {
						codeTextElement.className = 'ui-ctl-element';
						codeStateButtonElement.className = 'ui-ctl-before ui-ctl-icon-unchain';
					}
					codeContainerElement.className = 'name-code-container name-code-container-hidden';
					main_core.Dom.removeClass(this._innerWrapper, 'ui-entity-editor-content-block--code');
					main_core.Dom.addClass(this._innerWrapper, 'ui-entity-editor-content-block--no-code');
					nameCodeMarkerElement.style.display = 'inline';
				} else {
					this.refreshLayout();
				}
				this.setSchemeShowCodeState(false);
				this._parent.processChildControlSchemeChange(this);
			} else if (command === 'show_symbolic_code') {
				this.isShownSymbolicCode = true;
				if (this._mode === BX.UI.EntityEditorMode.edit) {
					codeContainerElement.className = 'name-code-container';
					main_core.Dom.removeClass(this._innerWrapper, 'ui-entity-editor-content-block--no-code');
					main_core.Dom.addClass(this._innerWrapper, 'ui-entity-editor-content-block--code');
					nameCodeMarkerElement.style.display = 'none';
				} else {
					this.refreshLayout();
				}
				this.setSchemeShowCodeState(true);
				this._parent.processChildControlSchemeChange(this);
			}
		}
		createTitleMarker() {
			if (this._mode === BX.UI.EntityEditorMode.view) {
				return null;
			}
			const display = this.isShownSymbolicCode ? 'none' : 'inline';
			if (this._mode === BX.UI.EntityEditorMode.edit) {
				return main_core.Tag.render`<span id="name_code_marker" style="color: rgb(255, 0, 0); display: ${display};">*</span>`;
			}
		}
		layout(options) {
			if (this._hasLayout) {
				return;
			}
			this.ensureWrapperCreated({
				classNames: ['ui-entity-editor-field-multitext']
			});
			this.adjustWrapper();
			if (!this.isNeedToDisplay()) {
				this.registerLayout(options);
				this._hasLayout = true;
				return;
			}
			const title = this.getTitle();
			const values = this.getValue();
			this._inputValue = values;
			this._innerWrapper = null;
			if (this.isDragEnabled()) {
				main_core.Dom.append(this.createDragButton(), this._wrapper);
			}
			main_core.Dom.append(this.createTitleNode(title), this._wrapper);
			if (this._mode === BX.UI.EntityEditorMode.edit) {
				this._inputContainer = main_core.Tag.render`<div></div>`;
				for (let valueKey in values) {
					main_core.Dom.append(this.createSingleInput(values[valueKey], valueKey), this._inputContainer);
				}
				this._innerWrapper = main_core.Tag.render`<div class="ui-entity-editor-content-block">${this._inputContainer}</div>`;
				if (this.isShownSymbolicCode) {
					main_core.Dom.addClass(this._innerWrapper, 'ui-entity-editor-content-block--code');
				} else {
					main_core.Dom.addClass(this._innerWrapper, 'ui-entity-editor-content-block--no-code');
				}
			} else {
				this._innerWrapper = main_core.Tag.render`
				<div class="ui-entity-editor-content-block">${this.getViewInnerLayout()}</div>
			`;
			}
			main_core.Dom.append(this._innerWrapper, this._wrapper);
			if (this.isContextMenuEnabled()) {
				main_core.Dom.append(this.createContextMenuButton(), this._wrapper);
			}
			if (this.isDragEnabled()) {
				this.initializeDragDropAbilities();
			}
			this.registerLayout(options);
			this._hasLayout = true;
		}
		validate(result) {
			if (this._mode !== BX.UI.EntityEditorMode.edit) {
				throw 'BX.UI.EntityEditorMultiText. Invalid validation context';
			}
			if (!this.isEditable()) {
				return true;
			}
			this.clearError();
			if (this.hasValidators()) {
				return this.executeValidators(result);
			}
			let isEmptyField = false;
			if (this._inputContainer) {
				const nameTextElement = document.getElementById('name_text');
				if (BX.util.trim(nameTextElement.value) === '') {
					isEmptyField = true;
					main_core.Dom.addClass(nameTextElement.parentNode, "ui-ctl-danger");
				} else {
					main_core.Dom.removeClass(nameTextElement.parentNode, "ui-ctl-danger");
				}
			}
			const isValid = !this.isRequired() || !isEmptyField;
			if (!isValid) {
				result.addError(BX.UI.EntityValidationError.create({
					field: this
				}));
				this.showRequiredFieldError(this._input);
			}
			return isValid;
		}
		showError(error, anchor) {
			if (!this._errorContainer) {
				this._errorContainer = main_core.Tag.render`<div class="ui-entity-editor-field-error-text"></div>`;
			}
			this._errorContainer.innerHTML = BX.util.htmlspecialchars(error);
			if (this._wrapper) {
				main_core.Dom.append(this._errorContainer, this._wrapper);
			}
			this._hasError = true;
		}
		createSingleInput(value, name) {
			const inputWrapper = main_core.Tag.render`
			<div id="${name.toLowerCase()}_container"></div>
		`;
			const inputContainer = main_core.Tag.render`
			<div class="ui-ctl ui-ctl-w100 ui-ctl-textbox"></div>
		`;
			let input;
			if (this.getLineCount() > 1) {
				input = main_core.Tag.render`
				<textarea
					class="ui-ctl-element ui-entity-editor-field-textarea"
					name="${name}"
					id="${name.toLowerCase() + '_text'}"
					rows="${this.getLineCount()}">${BX.util.htmlspecialchars(value) || ''}</textarea>
			`;
			} else {
				input = main_core.Tag.render`
				<input
					class="ui-ctl-element"
					name="${name}"
					id="${name.toLowerCase() + '_text'}"
					type="text"
					value="${BX.util.htmlspecialchars(value) || ''}"/>
			`;
			}
			main_core.Event.bind(input, 'input', this.#onInputHandler.bind(this, name));
			if (name === 'CODE') {
				if (!this.isShownSymbolicCode) {
					main_core.Dom.addClass(inputWrapper, 'name-code-container-hidden');
				}
				if (this.allowToGenerateCode === true) {
					main_core.Dom.addClass(input, 'ui-ctl-element-symbol-code-input-disabled');
					main_core.Dom.attr(input, 'readonly', this.allowToGenerateCode);
				}
				main_core.Dom.addClass(inputContainer, 'ui-ctl-ext-before-icon');
				main_core.Dom.addClass(inputWrapper, 'name-code-container');
				const chainState = this.allowToGenerateCode ? 'chain' : 'unchain';
				const button = main_core.Tag.render`
				<button name="${name}" class="ui-ctl-before ui-ctl-icon-${chainState}" id="code_state_button"></button>
			`;
				main_core.Event.bind(button, 'click', this.#onCodeStateButtonClick.bind(this));
				main_core.Dom.append(button, inputContainer);
			}
			const label = this.#creatLabelForEditMode(name);
			main_core.Dom.append(label, inputWrapper);
			main_core.Dom.append(input, inputContainer);
			main_core.Dom.append(inputContainer, inputWrapper);
			return inputWrapper;
		}
		#creatLabelForEditMode(name) {
			const label = main_core.Tag.render`<label class="ui-entity-editor-block-title"></label>`;
			let labelText;
			if (name === 'CODE') {
				labelText = main_core.Tag.render`<span>${main_core.Loc.getMessage('CATALOG_ENTITY_CARD_SYMBOLIC_CODE')}</span>`;
				main_core.Dom.append(labelText, label);
				main_core.Dom.append(this.#getHintNode(), label);
			} else {
				labelText = main_core.Tag.render`
				<span>
					${main_core.Loc.getMessage('CATALOG_ENTITY_CARD_NAME')}
					<span style="color: rgb(255, 0, 0);">*</span>
				</span>
			`;
				main_core.Dom.append(labelText, label);
			}
			return label;
		}
		#onInputHandler(name) {
			this._changeHandler();
			if (this.allowToGenerateCode && name === 'NAME') {
				const codeTextElement = document.getElementById('code_text');
				const nameTextElement = document.getElementById('name_text');
				codeTextElement.value = BX.translit(nameTextElement.value, null);
			}
		}
		#getHintNode() {
			return BX.UI.Hint.createNode(main_core.Loc.getMessage('CATALOG_ENTITY_CARD_SYMBOLIC_CODE_HINT'));
		}
		#onCodeStateButtonClick() {
			const codeTextElement = document.getElementById('code_text');
			const nameTextElement = document.getElementById('name_text');
			const codeStateButtonElement = document.getElementById('code_state_button');
			this.allowToGenerateCode = !this.allowToGenerateCode;
			codeTextElement.readOnly = this.allowToGenerateCode;
			if (this.allowToGenerateCode) {
				codeTextElement.className = 'ui-ctl-element ui-ctl-element-symbol-code-input-disabled';
				codeStateButtonElement.className = 'ui-ctl-before ui-ctl-icon-chain';
				codeTextElement.value = BX.translit(nameTextElement.value, null);
			} else {
				codeTextElement.className = 'ui-ctl-element';
				codeStateButtonElement.className = 'ui-ctl-before ui-ctl-icon-unchain';
				const nameTextElement = document.getElementById('name_text');
				const newValue = BX.translit(nameTextElement.value, null);
				if (codeTextElement.value !== newValue) {
					this.markAsChanged();
				}
				codeTextElement.value = newValue;
			}
		}
		getViewInnerLayout() {
			const textValue = main_core.Tag.render`
			<div class="ui-entity-editor-content-block-text"></div>
		`;
			const values = this.getValue();
			if (!this.isShownSymbolicCode) {
				main_core.Dom.append(main_core.Tag.render`<p>${BX.util.htmlspecialchars(values.NAME)}</p>`, textValue);
				return textValue;
			}
			main_core.Dom.append(main_core.Tag.render`
			<div class="ui-entity-editor-symbol-code-label">
				${main_core.Loc.getMessage('CATALOG_ENTITY_CARD_NAME')}
			</div>
		`, textValue);
			main_core.Dom.append(main_core.Tag.render`<p>${BX.util.htmlspecialchars(values.NAME)}</p>`, textValue);
			main_core.Dom.addClass(textValue, 'ui-entity-editor-symbol-code');
			const codeValue = values.CODE === '' ? main_core.Loc.getMessage('UI_ENTITY_EDITOR_FIELD_EMPTY') : values.CODE;
			const chainClass = this.allowToGenerateCode ? 'ui-entity-editor-symbol-code-value-chain' : 'ui-entity-editor-symbol-code-value-unchain';
			main_core.Dom.append(main_core.Tag.render`
			<div class="ui-entity-editor-symbol-code-box">
				<div class="ui-entity-editor-symbol-code-label">
					${main_core.Loc.getMessage('CATALOG_ENTITY_CARD_SYMBOLIC_CODE')}
				</div>
				<div class="ui-entity-editor-symbol-code-value ${chainClass}">
					${BX.util.htmlspecialchars(codeValue)}
				</div>
			</div>
		`, textValue);
			return textValue;
		}
	}

	class FieldsFactory {
		constructor() {
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorControlFactory:onInitialize', event => {
				const [, eventArgs] = event.getCompatData();
				eventArgs.methods['entityCard'] = this.factory.bind(this);
			});
		}
		factory(type, controlId, settings) {
			if (type === 'iblock_section') {
				return new IblockSectionField(controlId, settings);
			} else if (type === 'name-code') {
				return new NameCodeField(controlId, settings);
			}
			return null;
		}
	}

	const PROPERTY_PREFIX = 'PROPERTY_';
	const PROPERTY_BLOCK_NAME = 'properties';
	class IblockSectionController extends BX.UI.EntityEditorController {
		onChangeHandler = this.handleChange.bind(this);
		constructor(id, settings = {}) {
			super();
			this.initialize(id, settings);
			this.isRequesting = false;
			this.clearServiceFields();
			main_core_events.EventEmitter.subscribe(this._editor, 'IblockSectionField:onChange', this.onChangeHandler);
		}
		clearServiceFields() {
			this.lastDataHash = null;
			this.initialElements = null;
			this.deletedControls = {};
			this.deletedAvailableSchemes = {};
		}
		handleChange(event) {
			const newData = event.getData();
			newData.shift();
			const newDataHash = JSON.stringify(newData);
			if (this.lastDataHash === null || this.lastDataHash !== newDataHash) {
				this.lastDataHash = newDataHash;
				clearTimeout(this.timeout);
				this.timeout = setTimeout(() => {
					this.refreshLinkedProperties(newData);
				}, 50);
			}
		}
		refreshLinkedProperties(sectionIds) {
			if (this.isRequesting) {
				return;
			}
			this.isRequesting = true;
			main_core.ajax.runComponentAction(this._editor._settings.ajaxData.COMPONENT_NAME, 'refreshLinkedProperties', {
				mode: 'class',
				signedParameters: this._editor._settings.ajaxData.SIGNED_PARAMETERS,
				data: {
					sectionIds
				}
			}).then(response => {
				const allCurrentProperties = this.getAllCurrentProperties();
				if (this.initialElements === null) {
					this.initialElements = [...allCurrentProperties];
				}
				response.data.ENTITY_FIELDS.forEach(property => {
					if (!allCurrentProperties.includes(property.name)) {
						this.addProperty(property, {
							layout: {
								forceDisplay: true
							},
							mode: BX.UI.EntityEditorMode.edit
						});
					}
				});
				const newProperties = response.data.ENTITY_FIELDS.map(el => el.name);
				allCurrentProperties.forEach(name => {
					if (!newProperties.includes(name)) {
						this.removeProperty(name);
					}
				});
				this._editor.commitSchemeChanges();
				this.isRequesting = false;
			}).catch(response => {
				this.isRequesting = false;
			});
		}
		getAllCurrentProperties() {
			const activeProperties = this._editor.getAllControls().filter(el => el.getName().indexOf(PROPERTY_PREFIX) === 0).map(el => el.getName());
			const hiddenProperties = this._editor.getAvailableSchemeElements().filter(el => el.getName().indexOf(PROPERTY_PREFIX) === 0).map(el => el.getName());
			return [...activeProperties, ...hiddenProperties];
		}
		addProperty(property, options = {}) {
			if (property.name in this.deletedControls) {
				this.restoreDeletedProperty(this.deletedControls[property.name], options);
			} else if (property.name in this.deletedAvailableSchemes) {
				this.restoreDeletedAvailableProperty(this.deletedAvailableSchemes[property.name], options);
			} else {
				this.createProperty(property, options);
			}
		}
		restoreDeletedProperty(control, options = {}) {
			const mode = options.mode || control._mode;
			control._mode = mode;
			control.getParent().addChild(control, {
				...options,
				enableSaving: false
			});
			if (mode === BX.UI.EntityEditorMode.edit) {
				this._editor.registerActiveControl(control);
			} else if (mode === BX.UI.EntityEditorMode.view) {
				this._editor.unregisterActiveControl(control);
			}
		}
		restoreDeletedAvailableProperty(schemeElement, options = {}) {
			this._editor.addAvailableSchemeElement(schemeElement);
		}
		createProperty(property, options = {}) {
			const propertyBlockScheme = this._editor.getSchemeElementByName(PROPERTY_BLOCK_NAME);
			const schemeElement = BX.UI.EntitySchemeElement.create(property);
			propertyBlockScheme._elements.push(schemeElement);
			const mode = options.mode || BX.UI.EntityEditorMode.edit;
			const control = this._editor.createControl(schemeElement.getType(), schemeElement.getName(), {
				schemeElement: schemeElement,
				model: this._model,
				parent: this,
				mode: mode
			});
			if (!control) {
				return;
			}
			const propertyBlockControl = this._editor.getControlById(PROPERTY_BLOCK_NAME);
			propertyBlockControl.addChild(control, {
				...options,
				enableSaving: false
			});
			return control;
		}
		removeProperty(name) {
			const control = this._editor.getControlByIdRecursive(name);
			if (control) {
				this.deletedControls[control.getName()] = control;
				control.getParent().removeChild(control, {
					enableSaving: false
				});
				this._editor.removeAvailableSchemeElement(control.getSchemeElement());
				this._editor.unregisterActiveControl(control);
			} else {
				const schemeElement = this._editor.getAvailableSchemeElementByName(name);
				if (schemeElement) {
					this.deletedAvailableSchemes[schemeElement.getName()] = schemeElement;
					this._editor.removeAvailableSchemeElement(schemeElement);
				}
			}
		}
		rollback() {
			super.rollback();
			if (this.initialElements === null) {
				return;
			}
			const allCurrentProperties = this.getAllCurrentProperties();
			allCurrentProperties.forEach(element => {
				if (!this.initialElements.includes(element)) {
					this.removeProperty(element);
				}
			});
			this.initialElements.forEach(element => {
				if (!allCurrentProperties.includes(element)) {
					this.addProperty({
						name: element
					}, {
						layout: {
							forceDisplay: false
						},
						mode: BX.UI.EntityEditorMode.view
					});
				}
			});
			this._editor.commitSchemeChanges();
			this.clearServiceFields();
		}
	}

	class GridStore {
		editedRowsIndexes = [];
		constructor(gridId) {
			this.gridId = gridId;
			main_core_events.EventEmitter.subscribe('onItemIsAdded', this.#onFileIsAddedHandler.bind(this));
			main_core_events.EventEmitter.subscribe('onFileIsDeleted', this.#onFileIsDeletedHandler.bind(this));
		}
		getGrid() {
			return BX.Main.gridManager.getInstanceById(this.gridId);
		}
		#onFileIsAddedHandler(event) {
			const file = event.getCompatData()[0];
			const isFileUploaded = file instanceof File;
			const uploader = event.getCompatData()[2];
			if (uploader && main_core.Type.isDomNode(uploader.fileInput) && isFileUploaded) {
				const isFileUploaderInGrid = this.getGrid().getContainer().contains(uploader.fileInput);
				if (isFileUploaderInGrid) {
					this.#showFileNotification();
				}
			}
		}
		#onFileIsDeletedHandler(event) {
			const uploader = event.getCompatData()[2];
			if (uploader && main_core.Type.isDomNode(uploader.fileInput)) {
				const isFileUploaderInGrid = this.getGrid().getContainer().contains(uploader.fileInput);
				if (isFileUploaderInGrid) {
					this.#showFileNotification();
				}
			}
		}
		#showFileNotification() {
			BX.UI.Notification.Center.notify({
				id: 'fileCloseNotification',
				blinkOnUpdate: false,
				content: main_core.Loc.getMessage('CATALOG_ENTITY_CARD_FILE_CLOSE_NOTIFICATION_2'),
				position: 'top-right',
				width: 'auto',
				autoHideDelay: 5000
			});
		}
		saveEditedRows() {
			this.editedRowsIndexes = [];
			this.getGrid().getRows().getBodyChild().forEach(row => {
				if (row.isEdit()) {
					this.editedRowsIndexes.push(row.getNode().rowIndex);
				}
			});
		}
		loadEditedRows() {
			const rows = this.getGrid().getRows();
			this.editedRowsIndexes.forEach(index => {
				const row = rows.getByIndex(index);
				if (row) {
					//row.edit(); not used, because for child listeners need fire event
					BX.fireEvent(row.getNode(), 'click');
				}
			});
		}
		#getSupportedAjaxFields() {
			const params = this.getGrid().getParam('SUPPORTED_AJAX_FIELDS');
			if (main_core.Type.isArray(params)) {
				return params;
			}
			return [];
		}
		getEditedRowsFields() {
			const result = {};
			const fillCellValue = function (result, name, editData, value) {
				if (main_core.Type.isPlainObject(editData) && editData.TYPE === 'MONEY') {
					if (main_core.Type.isArray(value)) {
						value.forEach(item => {
							if (item.RAW_NAME === undefined && item.NAME === name) {
								result[name] = item.VALUE;
							}
						});
					} else {
						console.error('Error value type for `MONEY` column', value);
					}
				} else if (main_core.Type.isPlainObject(value)) {
					result[name] = value.VALUE ?? '';
				} else if (main_core.Type.isArray(value)) {
					result[name] = [];
					value.forEach(item => {
						if (main_core.Type.isPlainObject(item)) {
							result[name].push(item.VALUE);
						} else {
							result[name].push(item);
						}
					});
				} else {
					result[name] = value;
				}
			};
			const rows = this.getGrid().getRows();
			const headRow = rows.getHeadFirstChild();
			const supportedAjaxFields = this.#getSupportedAjaxFields();
			rows.getBodyChild().filter(row => row.isEdit()).forEach(row => {
				const values = {};
				Array.prototype.forEach.call(row.getCells(), (cell, index) => {
					const cellName = headRow.getCellNameByCellIndex(index);
					if (!cellName) {
						return;
					}
					if (supportedAjaxFields.length > 0 && !supportedAjaxFields.includes(cellName)) {
						return;
					}
					const cellValues = row.getCellEditorValue(cell);
					const cellEditData = headRow.getCellEditDataByCellIndex(index);
					fillCellValue(values, cellName, cellEditData, cellValues);
				});
				result[row.getId()] = values;
			});
			return result;
		}
	}

	class VariationGridController extends BX.UI.EntityEditorController {
		areaHeight = null;
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
		}
		doInitialize() {
			super.doInitialize();
			main_core_events.EventEmitter.subscribe('Grid::thereEditedRows', this.markAsChangedHandler.bind(this));
			main_core_events.EventEmitter.subscribe('Grid::noEditedRows', this.checkEditorToolbar.bind(this));
			main_core_events.EventEmitter.subscribe('Grid::updated', this.onGridUpdated.bind(this));
			main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.onBeforeGridRequest.bind(this));
			main_core_events.EventEmitter.subscribe('onAjaxSuccess', this.ajaxSuccessHandler.bind(this));
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorIncludedArea:onBeforeLoad', this.onBeforeIncludedAreaLoaded.bind(this));
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorIncludedArea:onAfterLoad', this.onAfterIncludedAreaLoaded.bind(this));
			main_core_events.EventEmitter.subscribe("BX.UI.EntityEditor:onNothingChanged", this.onNothingChanged.bind(this));
			this.subscribeToFormSubmit();
			this.gridStore = new GridStore(this.getGridId());
		}
		onBeforeIncludedAreaLoaded(event) {
			if (main_core.Type.isNumber(this.areaHeight)) {
				main_core.Dom.style(this.getVariationGridLoader(), 'height', this.areaHeight + 'px');
			}
		}
		onAfterIncludedAreaLoaded(event) {
			main_core.Dom.style(this.getVariationGridLoader(), 'height', '');
			this.areaHeight = null;
		}
		onNothingChanged(event) {
			this.rollback();
		}
		getVariationGridLoader() {
			const control = this.getGridControl();
			if (control) {
				const wrapper = control.getWrapper();
				if (wrapper) {
					return wrapper.querySelector('.ui-entity-editor-included-area-container-loader');
				}
			}
			return null;
		}
		rollback() {
			super.rollback();
			this.checkEditorToolbar();
			this.unsubscribeGridEvents();
			BX.Main.gridManager.destroy(this.getGridId());
		}
		onAfterSave() {
			if (this.isChanged() || this._editor.isChanged()) {
				this.setGridControlCache(null);
				main_core_events.EventEmitter.emit('onAfterVariationGridSave', {
					gridId: this.getGridId()
				});
			}
			BX.Main.gridManager.destroy(this.getGridId());
			this.subscribeToFormSubmit();
			super.onAfterSave();
		}
		setGridControlCache(html) {
			const control = this.getGridControl();
			if (control) {
				control._loadedHtml = html;
			}
		}
		onBeforeSubmit() {
			this.unsubscribeGridEvents();
		}

		/**
		 * @returns {BX.Catalog.VariationGrid|null}
		 */
		getVariationGridComponent() {
			return main_core.Reflection.getClass('BX.Catalog.VariationGrid.Instance');
		}
		unsubscribeGridEvents() {
			const gridComponent = this.getVariationGridComponent();
			if (gridComponent) {
				gridComponent.destroy();
			}
			const popup = this.getGrid()?.getSettingsWindow()?.getPopup();
			if (popup) {
				main_core_events.EventEmitter.emit(this.getGrid().getSettingsWindow().getPopup(), 'onDestroy');
			}
			main_core_events.EventEmitter.unsubscribeAll('BX.Main.grid:paramsUpdated');
		}
		ajaxSuccessHandler(event) {
			const [, xhrData] = event.getCompatData();
			if (xhrData.url.indexOf(this.getReloadUrl()) === 0) {
				this.setGridControlCache(null);
			}
		}

		// ajax form initializes every "save" action
		subscribeToFormSubmit() {
			main_core_events.EventEmitter.subscribe(this._editor._ajaxForm, 'onBeforeSubmit', this.onBeforeSubmitForm.bind(this));
		}
		markAsChangedHandler() {
			if (!this._editor.isNew()) {
				this.markAsChanged();
			}
		}
		checkEditorToolbar() {
			this._isChanged = false;
			if (this._editor.getActiveControlCount() > 0) {
				this._editor.showToolPanel();
			} else {
				this._editor.hideToolPanel();
			}
			if (this._editor._toolPanel) {
				this._editor._toolPanel.clearErrors();
			}
		}
		getGridControl() {
			return this._editor.getControlById('variation_grid');
		}
		onGridUpdated(event) {
			const [grid] = event.getCompatData();
			this.checkEditorToolbar();
			if (grid.getId() === this.getGrid()?.getId()) {
				setTimeout(() => {
					this.gridStore.loadEditedRows();
				}, 0 // delay for re-render grid
				);
			}
		}
		onBeforeGridRequest(event) {
			const [grid, eventArgs] = event.getCompatData();
			if (!grid || !grid.parent || grid.parent.getId() !== this.getGridId()) {
				return;
			}
			let url = eventArgs.url;
			if (url) {
				const params = new main_core.Uri(url).getQueryParams();
				url = new main_core.Uri(this.getReloadUrl());
				if (params) {
					for (const key in params) {
						if (Object.hasOwnProperty.call(params, key)) {
							url.setQueryParam(key, params[key]);
						}
					}
				}
				url = url.toString();
			} else {
				url = this.getReloadUrl();
			}
			this.gridStore.saveEditedRows();
			eventArgs.sessid = BX.bitrix_sessid();
			eventArgs.method = 'POST';
			eventArgs.url = url;
			eventArgs.data = {
				...eventArgs.data,
				rows: this.gridStore.getEditedRowsFields(),
				signedParameters: this.getSignedParameters()
			};
			this.unsubscribeGridEvents();
		}
		getReloadUrl() {
			return this.getConfigStringParam('reloadUrl', '');
		}
		getSignedParameters() {
			return this.getConfigStringParam('signedParameters', '');
		}
		getGridId() {
			return this.getConfigStringParam('gridId', '');
		}
		getGrid() {
			if (!main_core.Reflection.getClass('BX.Main.gridManager.getInstanceById')) {
				return null;
			}
			return BX.Main.gridManager.getInstanceById(this.getGridId());
		}
		onBeforeSubmitForm(event) {
			const [, eventArgs] = event.getCompatData();
			const grid = this.getGrid();
			if (!grid) {
				return;
			}
			const skuGridName = this.getGridId();
			const skuGridData = grid.getRows().getEditSelectedValues();
			const copyItemsMap = grid.getParam('COPY_ITEMS_MAP', {});

			// replace sku custom properties edit data names with original names
			for (let id in skuGridData) {
				if (!skuGridData.hasOwnProperty(id)) {
					continue;
				}
				for (let name in skuGridData[id]) {
					if (!skuGridData[id].hasOwnProperty(name)) {
						continue;
					}
					if (name.includes('SKU_GRID_CATALOG_GROUP') || name.includes('SKU_GRID_PURCHASING')) {
						for (let priceField in skuGridData[id][name]) {
							if (skuGridData[id][name].hasOwnProperty(priceField)) {
								skuGridData[id][priceField] = skuGridData[id][name][priceField];
							}
						}
					} else if (name.includes('[EDIT_HTML]')) {
						let newName = name.replace('[EDIT_HTML]', '');

						// lookup for a custom file fields
						if (newName.endsWith('_custom')) {
							if ('bxu_files[]' in skuGridData[id][name]) {
								skuGridData[id][name].isFile = true;
								delete skuGridData[id][name]['bxu_files[]'];
							}
							if (skuGridData[id][name].isFile) {
								for (let fieldName in skuGridData[id][name]) {
									if (skuGridData[id][name].hasOwnProperty(fieldName)) {
										// check for new files like "MORE_PHOTO_n1[name]"(multiple) or "DETAIL_PICTURE[name]"(single)
										let newFilesRegExp = new RegExp(/([0-9A-Za-z_]+?(_n\d+)*)\[([A-Za-z_]+)\]/);
										if (newFilesRegExp.test(fieldName)) {
											let fileCounter, fileSetting;
											[, fileCounter,, fileSetting] = fieldName.match(newFilesRegExp);
											if (fileCounter && fileSetting) {
												skuGridData[id][name][fileCounter] = skuGridData[id][name][fileCounter] || {};
												skuGridData[id][name][fileCounter][fileSetting] = skuGridData[id][name][fieldName];
												delete skuGridData[id][name][fieldName];
											}
										}
									}
								}
							}
						}
						skuGridData[id][newName] = skuGridData[id][name];
						delete skuGridData[id][name];
					}
				}
				if (!main_core.Type.isNil(copyItemsMap[id])) {
					skuGridData[id]['COPY_SKU_ID'] = copyItemsMap[id];
				}
			}
			if (!main_core.Type.isPlainObject(eventArgs.options)) {
				eventArgs.options = {};
			}
			if (!main_core.Type.isPlainObject(eventArgs.options.data)) {
				eventArgs.options.data = {};
			}
			eventArgs.options.data[skuGridName] = skuGridData;
			this.areaHeight = this.getGridControl().getWrapper().offsetHeight;
		}
	}

	class VariationLinkController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			main_core_events.EventEmitter.subscribe('onChangeVariationLink', this.markAsChanged.bind(this));
		}
		rollback() {
			super.rollback();
			if (this._isChanged) {
				this._isChanged = false;
			}
		}
	}

	class GoogleMapController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			main_core_events.EventEmitter.subscribe('onAddGoogleMapPoint', this.markAsChanged.bind(this));
		}
		rollback() {
			super.rollback();
			if (this._isChanged) {
				this._isChanged = false;
			}
		}
	}

	class EmployeeController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			main_core_events.EventEmitter.subscribe('onChangeEmployee', this.markAsChanged.bind(this));
		}
		rollback() {
			super.rollback();
			if (this._isChanged) {
				this._isChanged = false;
			}
		}
	}

	class UserController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			main_core_events.EventEmitter.subscribe('onChangeUser', this.markAsChanged.bind(this));
		}
		rollback() {
			super.rollback();
			if (this._isChanged) {
				this._isChanged = false;
			}
		}
	}

	class IblockElementController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			main_core_events.EventEmitter.subscribe('onChangeIblockElement', this.markAsChanged.bind(this));
		}
		rollback() {
			super.rollback();
			if (this._isChanged) {
				this._isChanged = false;
			}
		}
	}

	class BindingToCrmElementController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
		}
		rollback() {
			super.rollback();
			if (this._isChanged) {
				this._isChanged = false;
			}
			main_core_events.EventEmitter.unsubscribeAll('BX.Main.User.SelectorController::open');
		}
		onBeforeSubmit() {
			super.onBeforeSubmit();
			main_core_events.EventEmitter.unsubscribeAll('BX.Main.User.SelectorController::open');
		}
	}

	class FieldConfiguratorController extends BX.UI.EntityEditorController {
		fieldAddHandler = this.handleFieldAdd.bind(this);
		fieldUpdateHandler = this.handleFieldUpdate.bind(this);
		propertySavedHandler = this.handlePropertySaved.bind(this);
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			main_core_events.EventEmitter.subscribe(this._editor, 'BX.UI.EntityEditor:onFieldCreate', this.fieldAddHandler);
			main_core_events.EventEmitter.subscribe(this._editor, 'BX.UI.EntityEditor:onFieldModify', this.fieldUpdateHandler);

			// global events
			top.BX.Event.EventEmitter.subscribe('IblockPropertyDetails:saved', this.propertySavedHandler);
		}
		handlePropertySaved(event) {
			const [property] = event.getData();
			const propertyId = parseInt(property.id);
			main_core.ajax.runComponentAction(this._editor._settings.ajaxData.COMPONENT_NAME, 'load', {
				mode: 'class',
				signedParameters: this._editor._settings.ajaxData.SIGNED_PARAMETERS
			}).then(response => {
				if (main_core.Type.isArray(response.data.ENTITY_FIELDS)) {
					const schemeField = response.data.ENTITY_FIELDS.find(item => parseInt(item.propertyId) === propertyId);
					if (schemeField) {
						this._editor.addAvailableSchemeElement(BX.UI.EntitySchemeElement.create(schemeField));
					}
				}
			}).catch(response => {
				console.error('Cannot reload scheme', response);
			});
		}
		handleFieldAdd(event) {
			const [section, eventArgs] = event.getCompatData();
			const fields = this.getFieldsForm(eventArgs);
			main_core.ajax.runComponentAction(this._editor._settings.ajaxData.COMPONENT_NAME, 'addProperty', {
				mode: 'class',
				signedParameters: this._editor._settings.ajaxData.SIGNED_PARAMETERS,
				data: fields
			}).then(response => {
				const property = response.data.PROPERTY_FIELDS;
				if (!property) {
					return;
				}
				const additionalValues = response.data.ADDITIONAL_VALUES;
				if (additionalValues) {
					const model = this._editor._model;
					for (const [key, value] of Object.entries(additionalValues)) {
						model.setField(key, value);
					}
				}
				let mode = BX.UI.EntityEditorMode.view;
				if (section instanceof BX.UI.EntityEditorSection) {
					mode = section.getMode();
				}
				const control = this.createProperty(property, section.getName(), {
					layout: {
						notifyIfNotDisplayed: true,
						forceDisplay: eventArgs.showAlways
					},
					mode
				});
				control.toggleOptionFlag(eventArgs.showAlways);
				this._editor.saveSchemeChanges();
				this.isRequesting = false;
			}).catch(response => {
				this.isRequesting = false;
			});
		}

		/* eslint-disable max-lines-per-function */
		handleFieldUpdate(event) {
			const [section, eventArgs] = event.getCompatData();
			if (!(eventArgs.field instanceof BX.UI.EntityEditorControl)) {
				return;
			}
			const currentField = eventArgs.field;
			eventArgs.CODE = currentField.getId();
			const fields = this.getFieldsForm(eventArgs);
			const schemeElement = currentField.getSchemeElement();
			schemeElement._isRequired = eventArgs.mandatory;
			main_core.ajax.runComponentAction(this._editor._settings.ajaxData.COMPONENT_NAME, 'updateProperty', {
				mode: 'class',
				signedParameters: this._editor._settings.ajaxData.SIGNED_PARAMETERS,
				data: fields
			}).then(response => {
				const property = response?.data?.PROPERTY_FIELDS;
				if (currentField instanceof BX.UI.EntityEditorDatetime || currentField instanceof BX.UI.EntityEditorMultiDatetime) {
					const schemeElementData = currentField.getSchemeElement().getData();
					const propertyData = property?.data;
					if (propertyData) {
						schemeElementData.enableTime = propertyData.enableTime;
						schemeElementData.dateViewFormat = propertyData.dateViewFormat;
						currentField.refreshLayout();
					}
				}
				if (currentField instanceof BX.UI.EntityEditorCustom) {
					currentField.refreshLayout();
				}
				let newType = null;
				let schemeElement = null;
				const moneyFieldUpdate = this.prepareMoneyFieldUpdate(currentField, property, section.getModel(), eventArgs.multiple);
				if (moneyFieldUpdate) {
					newType = moneyFieldUpdate.type;
					schemeElement = moneyFieldUpdate.schemeElement;
				} else if (eventArgs.multiple === true) {
					if (currentField instanceof BX.UI.EntityEditorText) {
						newType = 'multitext';
					} else if (currentField instanceof BX.UI.EntityEditorList) {
						newType = 'multilist';
					} else if (currentField instanceof BX.UI.EntityEditorDatetime) {
						newType = 'multidatetime';
					} else if (currentField instanceof BX.UI.EntityEditorNumber) {
						newType = 'multinumber';
					}
				} else if (currentField instanceof BX.UI.EntityEditorMultiList) {
					newType = 'list';
				} else if (currentField instanceof BX.UI.EntityEditorMultiDatetime) {
					newType = 'datetime';
				} else if (currentField instanceof BX.UI.EntityEditorMultiNumber) {
					newType = 'number';
				} else if (currentField instanceof BX.UI.EntityEditorMultiText) {
					newType = 'text';
				}
				schemeElement ??= currentField.getSchemeElement();
				if ((currentField instanceof BX.UI.EntityEditorList || currentField instanceof BX.UI.EntityEditorMultiList) && property) {
					schemeElement = BX.UI.EntitySchemeElement.create(property);
					newType = property.type;
				}
				if (newType) {
					const index = section.getChildIndex(currentField);
					const newControl = this._editor.createControl(newType, eventArgs.CODE, {
						schemeElement,
						model: section._model,
						parent: section,
						mode: section.getMode()
					});
					section.addChild(newControl, {
						index,
						layout: {
							forceDisplay: true
						},
						enableSaving: false
					});
					currentField._schemeElement = null;
					section.removeChild(currentField, {
						enableSaving: false
					});
				}
				this.isRequesting = false;
			}).catch(response => {
				this.isRequesting = false;
			});
		}
		/* eslint-enable */

		prepareMoneyFieldUpdate(currentField, property, model, isMultiple) {
			const isMoneyField = currentField instanceof BX.UI.EntityEditorMoney || currentField instanceof BX.UI.EntityEditorMultiMoney;
			if (!property || !isMoneyField) {
				return null;
			}
			const currentIsMultiple = currentField instanceof BX.UI.EntityEditorMultiMoney;
			if (currentIsMultiple === isMultiple) {
				return null;
			}
			const schemeElement = BX.UI.EntitySchemeElement.create(property);
			const type = schemeElement.getType();
			if (type !== 'money' && type !== 'multimoney') {
				return null;
			}
			const data = schemeElement.getData();
			const fieldNames = [schemeElement.getName(), data.amount, data.currency?.name ?? data.currencyCode, data.formatted, data.formattedWithCurrency];
			for (const fieldName of fieldNames) {
				if (!fieldName || !model.hasField(fieldName)) {
					continue;
				}
				const currentValue = model.getField(fieldName);
				const nextValue = this.normalizeMoneyModelValue(currentValue, type);
				model.setField(fieldName, nextValue, {
					enableNotification: false
				});
			}
			return {
				type,
				schemeElement
			};
		}
		normalizeMoneyModelValue(value, type) {
			if (type === 'money' && main_core.Type.isArray(value)) {
				return value[0] ?? '';
			}
			if (type === 'multimoney' && !main_core.Type.isArray(value)) {
				return main_core.Type.isNil(value) || value === '' ? [] : [value];
			}
			return value;
		}
		getFieldsForm(fields) {
			const form = new FormData();
			const formatted = {
				NAME: fields.label,
				MULTIPLE: fields.multiple ? 'Y' : 'N',
				IS_REQUIRED: fields.mandatory ? 'Y' : 'N',
				IS_PUBLIC: fields.isPublic ? 'Y' : 'N',
				PROPERTY_TYPE: 'S',
				CODE: fields.CODE || ''
			};
			switch (fields.typeId) {
				case 'integer':
				case 'double':
					formatted.PROPERTY_TYPE = 'N';
					break;
				case 'list':
				case 'multilist':
					formatted.PROPERTY_TYPE = 'L';
					(fields.enumeration || []).forEach((enumItem, key) => {
						form.append(this.getFormFieldName(`VALUES][${key}][SORT`), enumItem.SORT);
						form.append(this.getFormFieldName(`VALUES][${key}][VALUE`), enumItem.VALUE);
						form.append(this.getFormFieldName(`VALUES][${key}][ID`), enumItem.ID);
					});
					break;
				case 'directory':
					formatted.USER_TYPE = 'directory';
					(fields.enumeration || []).forEach((enumItem, key) => {
						form.append(this.getFormFieldName(`VALUES][${key}][SORT`), enumItem.SORT);
						form.append(this.getFormFieldName(`VALUES][${key}][VALUE`), enumItem.VALUE.value);
						form.append(this.getFormFieldName(`VALUES][${key}][XML_ID`), enumItem.XML_ID);
						form.append(this.getFormFieldName(`VALUES][${key}][FILE_ID`), enumItem.FILE_ID);
						form.append(`FILES[${enumItem.SORT}]`, enumItem.VALUE.file);
					});
					break;
				case 'boolean':
					formatted.PROPERTY_TYPE = 'L';
					form.append(this.getFormFieldName('VALUES][0][VALUE'), 'Y');
					formatted.LIST_TYPE = 'C';
					break;
				case 'money':
					formatted.USER_TYPE = 'Money';
					break;
				case 'address':
					formatted.USER_TYPE = 'map_google';
					break;
				case 'datetime':
				case 'multidatetime':
					formatted.USER_TYPE = fields.enableTime === true ? 'DateTime' : 'Date';
					break;
				case 'file':
					formatted.USER_TYPE = 'DiskFile';
					break;
				case 'custom':
					formatted.USER_TYPE = fields.userType;
					break;
			}
			for (const [key, item] of Object.entries(formatted)) {
				form.append(this.getFormFieldName(key), item);
			}
			return form;
		}
		getFormFieldName(name) {
			return `fields[${name}]`;
		}
		createProperty(property, sectionName, options = {}) {
			const sectionSchemeElement = this._editor.getSchemeElementByName(sectionName);
			if (!sectionSchemeElement) {
				return;
			}
			const schemeElement = BX.UI.EntitySchemeElement.create(property);
			sectionSchemeElement._elements.push(schemeElement);
			const mode = options.mode || BX.UI.EntityEditorMode.edit;
			const control = this._editor.createControl(schemeElement.getType(), schemeElement.getName(), {
				schemeElement,
				model: this._model,
				parent: this,
				mode
			});
			if (!control) {
				return;
			}
			const sectionControl = this._editor.getControlById(sectionName);
			sectionControl.addChild(control, {
				...options,
				enableSaving: false
			});
			return control;
		}
	}

	class ProductServiceGridController extends BX.UI.EntityEditorController {
		areaHeight = null;
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
		}
		doInitialize() {
			super.doInitialize();
			main_core_events.EventEmitter.subscribe('Grid::thereEditedRows', this.markAsChangedHandler.bind(this));
			main_core_events.EventEmitter.subscribe('Grid::noEditedRows', this.checkEditorToolbar.bind(this));
			main_core_events.EventEmitter.subscribe('Grid::updated', this.onGridUpdated.bind(this));
			main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.onBeforeGridRequest.bind(this));
			main_core_events.EventEmitter.subscribe('onAjaxSuccess', this.ajaxSuccessHandler.bind(this));
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorIncludedArea:onBeforeLoad', this.onBeforeIncludedAreaLoaded.bind(this));
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorIncludedArea:onAfterLoad', this.onAfterIncludedAreaLoaded.bind(this));
			main_core_events.EventEmitter.subscribe("BX.UI.EntityEditor:onNothingChanged", this.onNothingChanged.bind(this));
			this.subscribeToFormSubmit();
			this.gridStore = new GridStore(this.getGridId());
		}
		onBeforeIncludedAreaLoaded(event) {
			if (main_core.Type.isNumber(this.areaHeight)) {
				main_core.Dom.style(this.getProductServiceGridLoader(), 'height', this.areaHeight + 'px');
			}
		}
		onAfterIncludedAreaLoaded(event) {
			main_core.Dom.style(this.getProductServiceGridLoader(), 'height', '');
			this.areaHeight = null;
		}
		onNothingChanged(event) {
			this.rollback();
		}
		getProductServiceGridLoader() {
			const control = this.getGridControl();
			if (control) {
				const wrapper = control.getWrapper();
				if (wrapper) {
					return wrapper.querySelector('.ui-entity-editor-included-area-container-loader');
				}
			}
			return null;
		}
		rollback() {
			super.rollback();
			this.checkEditorToolbar();
			this.unsubscribeGridEvents();
			BX.Main.gridManager.destroy(this.getGridId());
		}
		onAfterSave() {
			if (this.isChanged() || this._editor.isChanged()) {
				this.setGridControlCache(null);
				main_core_events.EventEmitter.emit('onAfterProducServiceGridSave', {
					gridId: this.getGridId()
				});
			}
			BX.Main.gridManager.destroy(this.getGridId());
			this.subscribeToFormSubmit();
			super.onAfterSave();
		}
		setGridControlCache(html) {
			const control = this.getGridControl();
			if (control) {
				control._loadedHtml = html;
			}
		}
		onBeforeSubmit() {
			this.unsubscribeGridEvents();
		}

		/**
		 * @returns {BX.Catalog.ProductServiceGrid|null}
		 */
		getVariationGridComponent() {
			return main_core.Reflection.getClass('BX.Catalog.ProductServiceGrid.Instance');
		}
		unsubscribeGridEvents() {
			const gridComponent = this.getVariationGridComponent();
			if (gridComponent) {
				gridComponent.destroy();
			}
			const popup = this.getGrid()?.getSettingsWindow()?.getPopup();
			if (popup) {
				main_core_events.EventEmitter.emit(this.getGrid().getSettingsWindow().getPopup(), 'onDestroy');
			}
			main_core_events.EventEmitter.unsubscribeAll('BX.Main.grid:paramsUpdated');
		}
		ajaxSuccessHandler(event) {
			const [, xhrData] = event.getCompatData();
			if (xhrData.url.indexOf(this.getReloadUrl()) === 0) {
				this.setGridControlCache(null);
			}
		}

		// ajax form initializes every "save" action
		subscribeToFormSubmit() {
			main_core_events.EventEmitter.subscribe(this._editor._ajaxForm, 'onBeforeSubmit', this.onBeforeSubmitForm.bind(this));
		}
		markAsChangedHandler() {
			if (!this._editor.isNew()) {
				this.markAsChanged();
			}
		}
		checkEditorToolbar() {
			this._isChanged = false;
			if (this._editor.getActiveControlCount() > 0) {
				this._editor.showToolPanel();
			} else {
				this._editor.hideToolPanel();
			}
			if (this._editor._toolPanel) {
				this._editor._toolPanel.clearErrors();
			}
		}
		getGridControl() {
			return this._editor.getControlById('service_grid');
		}
		onGridUpdated(event) {
			const [grid] = event.getCompatData();
			this.checkEditorToolbar();
			if (grid.getId() === this.getGrid().getId()) {
				setTimeout(() => {
					this.gridStore.loadEditedRows();
				}, 0 // delay for re-render grid
				);
			}
		}
		onBeforeGridRequest(event) {
			const [grid, eventArgs] = event.getCompatData();
			if (!grid || !grid.parent || grid.parent.getId() !== this.getGridId()) {
				return;
			}
			this.gridStore.saveEditedRows();
			eventArgs.sessid = BX.bitrix_sessid();
			eventArgs.method = 'POST';
			eventArgs.url = this.getReloadUrl();
			eventArgs.data = {
				...eventArgs.data,
				rows: this.gridStore.getEditedRowsFields(),
				signedParameters: this.getSignedParameters()
			};
			this.unsubscribeGridEvents();
		}
		getReloadUrl() {
			return this.getConfigStringParam('reloadUrl', '');
		}
		getSignedParameters() {
			return this.getConfigStringParam('signedParameters', '');
		}
		getGridId() {
			return this.getConfigStringParam('gridId', '');
		}
		getGrid() {
			if (!main_core.Reflection.getClass('BX.Main.gridManager.getInstanceById')) {
				return null;
			}
			return BX.Main.gridManager.getInstanceById(this.getGridId());
		}
		onBeforeSubmitForm(event) {
			const [, eventArgs] = event.getCompatData();
			const grid = this.getGrid();
			if (!grid) {
				return;
			}
			const skuGridName = this.getGridId();
			const skuGridData = grid.getRows().getEditSelectedValues();
			const copyItemsMap = grid.getParam('COPY_ITEMS_MAP', {});

			// replace sku custom properties edit data names with original names
			for (let id in skuGridData) {
				if (!skuGridData.hasOwnProperty(id)) {
					continue;
				}
				for (let name in skuGridData[id]) {
					if (!skuGridData[id].hasOwnProperty(name)) {
						continue;
					}
					if (name.includes('SKU_GRID_CATALOG_GROUP') || name.includes('SKU_GRID_PURCHASING')) {
						for (let priceField in skuGridData[id][name]) {
							if (skuGridData[id][name].hasOwnProperty(priceField)) {
								skuGridData[id][priceField] = skuGridData[id][name][priceField];
							}
						}
					} else if (name.includes('[EDIT_HTML]')) {
						let newName = name.replace('[EDIT_HTML]', '');

						// lookup for a custom file fields
						if (newName.endsWith('_custom')) {
							if ('bxu_files[]' in skuGridData[id][name]) {
								skuGridData[id][name].isFile = true;
								delete skuGridData[id][name]['bxu_files[]'];
							}
							if (skuGridData[id][name].isFile) {
								for (let fieldName in skuGridData[id][name]) {
									if (skuGridData[id][name].hasOwnProperty(fieldName)) {
										// check for new files like "MORE_PHOTO_n1[name]"(multiple) or "DETAIL_PICTURE[name]"(single)
										let newFilesRegExp = new RegExp(/([0-9A-Za-z_]+?(_n\d+)*)\[([A-Za-z_]+)\]/);
										if (newFilesRegExp.test(fieldName)) {
											let fileCounter, fileSetting;
											[, fileCounter,, fileSetting] = fieldName.match(newFilesRegExp);
											if (fileCounter && fileSetting) {
												skuGridData[id][name][fileCounter] = skuGridData[id][name][fileCounter] || {};
												skuGridData[id][name][fileCounter][fileSetting] = skuGridData[id][name][fieldName];
												delete skuGridData[id][name][fieldName];
											}
										}
									}
								}
							}
						}
						skuGridData[id][newName] = skuGridData[id][name];
						delete skuGridData[id][name];
					}
				}
				if (!main_core.Type.isNil(copyItemsMap[id])) {
					skuGridData[id]['COPY_SKU_ID'] = copyItemsMap[id];
				}
			}
			if (!main_core.Type.isPlainObject(eventArgs.options)) {
				eventArgs.options = {};
			}
			if (!main_core.Type.isPlainObject(eventArgs.options.data)) {
				eventArgs.options.data = {};
			}
			eventArgs.options.data[skuGridName] = skuGridData;
			this.areaHeight = this.getGridControl().getWrapper().offsetHeight;
		}
	}

	class FileController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			main_core_events.EventEmitter.subscribe('Catalog.File.Input:onRemove', this.markAsChanged.bind(this));
			main_core_events.EventEmitter.subscribe('Catalog.File.Input:onUploadComplete', this.markAsChanged.bind(this));
		}
		rollback() {
			super.rollback();
			if (this._isChanged) {
				this._isChanged = false;
			}
		}
	}

	class ControllersFactory {
		constructor() {
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorControllerFactory:onInitialize', event => {
				const [, eventArgs] = event.getCompatData();
				eventArgs.methods.entityCard = this.factory.bind(this);
			});
		}
		factory(type, controlId, settings) {
			if (type === 'field_configurator') {
				return new FieldConfiguratorController(controlId, settings);
			}
			if (type === 'iblock_section') {
				return new IblockSectionController(controlId, settings);
			}
			if (type === 'iblock_element') {
				return new IblockElementController(controlId, settings);
			}
			if (type === 'variation_grid') {
				return new VariationGridController(controlId, settings);
			}
			if (type === 'variation_link') {
				return new VariationLinkController(controlId, settings);
			}
			if (type === 'google_map') {
				return new GoogleMapController(controlId, settings);
			}
			if (type === 'employee') {
				return new EmployeeController(controlId, settings);
			}
			if (type === 'user') {
				return new UserController(controlId, settings);
			}
			if (type === 'binding_to_crm_element') {
				return new BindingToCrmElementController(controlId, settings);
			}
			if (type === 'service_grid') {
				return new ProductServiceGridController(controlId, settings);
			}
			if (type === 'file') {
				return new FileController(controlId, settings);
			}
			return null;
		}
	}

	class IblockDirectoryFieldItem extends BX.UI.EntityEditorUserFieldListItem {
		fileChanged = false;
		static create(id, settings) {
			const self = new this();
			self.initialize(id, settings);
			return self;
		}
		layout() {
			if (this._hasLayout) {
				return;
			}
			this._wrapper = main_core.Tag.render`
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100 ui-ctl-row"></div>
			`;
			this._fileInput = main_core.Tag.render`
				<input class="input-image-hidden" value="${BX.prop.getString(this._data, 'FILE_ID', '')}" type="file" accept="image/*">
			`;
			main_core.Event.bind(this._fileInput, 'change', this.onFileLoaderChange.bind(this));
			const link = BX.prop.getString(this._data, 'IMAGE_SRC', '');
			this._wrapper.appendChild(main_core.Tag.render`
			<label class="catalog-dictionary-item ${link === '' ? 'catalog-dictionary-item-empty' : ''}">
				<img src="${link}" alt="">
				${this._fileInput}
			</label>
			`);
			const labelText = main_core.Text.encode(BX.prop.getString(this._data, 'TEXT', ''));
			this._labelInput = main_core.Tag.render`
				<input 
					class="ui-ctl-element" 
					value="${labelText}"
					placeholder="${BX.message('CATALOG_ENTITY_CARD_NEW_FIELD_ITEM_PLACEHOLDER')}"
				>
			`;
			this._wrapper.appendChild(this._labelInput);
			const deleteButton = main_core.Tag.render`
				<div class="ui-entity-editor-content-remove-block"></div>
			`;
			main_core.Event.bind(deleteButton, 'click', this.onDeleteButtonClick.bind(this));
			this._wrapper.appendChild(deleteButton);
			var anchor = BX.prop.getElementNode(this._settings, 'anchor');
			if (anchor) {
				this._container.insertBefore(this._wrapper, anchor);
			} else {
				this._container.appendChild(this._wrapper);
			}
			this._hasLayout = true;
		}
		onFileLoaderChange(event) {
			const input = event.target;
			if (input.files && input.files[0]) {
				const reader = new FileReader();
				reader.onload = function (e) {
					input.parentNode.querySelector('img').src = e.target.result;
				};
				this.fileChanged = true;
				reader.readAsDataURL(input.files[0]);
				input.parentNode.classList.remove('catalog-dictionary-item-empty');
			}
		}
		isFileChanged() {
			return this.fileChanged;
		}
		prepareData() {
			const textValue = this._labelInput ? BX.util.trim(this._labelInput.value) : '';
			const fileValue = this._fileInput && this._fileInput.files && this._fileInput.files[0] ? this._fileInput.files[0] : {};
			const data = {
				'VALUE': {
					value: textValue,
					file: fileValue
				},
				'XML_ID': '',
				'FILE_ID': ''
			};
			const xmlId = BX.prop.getString(this._data, 'ID', '');
			if (BX.type.isNotEmptyString(xmlId)) {
				data['XML_ID'] = xmlId;
				data['FILE_ID'] = BX.prop.getString(this._data, 'FILE_ID', '');
			}
			return data;
		}
	}

	class IblockFieldConfigurator extends BX.UI.EntityEditorFieldConfigurator {
		static create(id, settings) {
			const self = new this();
			self.initialize(id, settings);
			return self;
		}
		constructor() {
			super();
			this._enumItems = [];
		}
		layoutInternal() {
			main_core.Dom.append(this.getInputContainer(), this._wrapper);
			if (this._typeId === "list" || this._typeId === "multilist" || this._typeId === "directory") {
				main_core.Dom.append(main_core.Tag.render`<hr class="ui-entity-editor-line">`, this._wrapper);
				if (BX.prop.get(this._field?.getSchemeElement().getData(), 'isConfigurable', null) !== false) {
					main_core.Dom.append(this.getEnumerationContainer(), this._wrapper);
				}
			}
			main_core.Dom.append(this.getOptionContainer(), this._wrapper);
			main_core.Dom.append(this.getErrorContainer(), this._wrapper);
			main_core.Dom.append(main_core.Tag.render`<hr class="ui-entity-editor-line">`, this._wrapper);
			main_core.Dom.append(this.getButtonContainer(), this._wrapper);
		}
		getOptionContainer() {
			const isNew = this._field === null;
			this._optionWrapper = main_core.Tag.render`
			<div class="ui-entity-editor-content-block"></div>
		`;
			if (this._typeId === "datetime" || this._typeId === "multidatetime") {
				this._isTimeEnabledCheckBox = this.getIsTimeEnabledCheckBox();
			}
			if (this._typeId !== "boolean" && this._enableMandatoryControl) {
				this._isRequiredCheckBox = this.getIsRequiredCheckBox();
			}
			if (this.isAllowedMultipleCheckBox()) {
				this._isMultipleCheckBox = this.getMultipleCheckBox();
			}
			this._isPublic = this.getIsPublicCheckBox();

			//region Show Always
			this._showAlwaysCheckBox = this.createOption({
				caption: main_core.Loc.getMessage('UI_ENTITY_EDITOR_SHOW_ALWAYS'),
				helpUrl: 'https://helpdesk.bitrix24.ru/open/7046149/',
				helpCode: '9627471'
			});
			this._showAlwaysCheckBox.checked = isNew ? BX.prop.getBoolean(this._settings, 'showAlways', true) : this._field.checkOptionFlag(BX.UI.EntityEditorControlOptions.showAlways);
			if (!this.isAllowedShowAlwaysCheckBox()) {
				main_core.Dom.style(this._showAlwaysCheckBox.closest('div.ui-ctl-checkbox'), 'display', 'none');
			}
			//endregion

			return this._optionWrapper;
		}
		isAllowedMultipleCheckBox() {
			if (BX.prop.get(this?._field?.getSchemeElement()?._settings, 'allowedMultiple', true) === false) {
				return false;
			}
			if (this._typeId === 'boolean') {
				return false;
			}
			const isEnabledOfferTree = this?._field?.getSchemeElement()?._settings?.isEnabledOfferTree;
			const isMultiple = this?._field?.getSchemeElement()?._settings?.multiple;
			return !isEnabledOfferTree || isMultiple;
		}
		isAllowedShowAlwaysCheckBox() {
			return true;
		}
		getInputTitle() {
			const manager = this._editor.getUserFieldManager();
			return this._field ? this._field.getTitle() : manager.getDefaultFieldLabel(this._typeId);
		}
		getErrorContainer() {
			this._errorContainer = main_core.Tag.render`
			<div class="ui-entity-editor-content-block"></div>
		`;
			return this._errorContainer;
		}
		getEnumerationContainer() {
			const enumWrapper = main_core.Tag.render`
			<div class="ui-entity-editor-content-block">
				<div class="ui-entity-editor-block-title">
					<span class="ui-entity-editor-block-title-text">${main_core.Loc.getMessage("UI_ENTITY_EDITOR_UF_ENUM_ITEMS")}</span>
				</div>
			</div>
		`;
			this._enumItemContainer = main_core.Tag.render`
				<div class="ui-entity-editor-content-block"></div>
			`;
			main_core.Dom.append(this._enumItemContainer, enumWrapper);
			const addButton = main_core.Tag.render`
				<div class="ui-entity-card-content-add-field">
					${main_core.Loc.getMessage("UI_ENTITY_EDITOR_ADD")}
				</div>
			`;
			main_core.Event.bind(addButton, "click", this.onEnumerationItemAddButtonClick.bind(this));
			main_core.Dom.append(main_core.Tag.render`
				<div class="ui-entity-editor-content-block-add-field">
					${addButton}
				</div>
			`, enumWrapper);
			if (this._field) {
				this._field.getItems().forEach(enumFields => {
					if (enumFields.VALUE !== '') {
						this.createEnumerationItem({
							VALUE: enumFields.NAME,
							FILE_ID: enumFields.IMAGE || null,
							IMAGE_SRC: enumFields.IMAGE_SRC || '',
							TEXT: enumFields.TEXT || '',
							ID: enumFields.VALUE
						});
					}
				});
			}
			const lastItem = this.createEnumerationItem();
			this._draggable = new BX.UI.DragAndDrop.Draggable({
				container: this._enumItemContainer,
				draggable: '.ui-ctl-row',
				dragElement: '.ui-ctl-row-draggable',
				type: BX.UI.DragAndDrop.Draggable.CLONE
			});
			lastItem.focus();
			this.initItemClickHandlers();
			return enumWrapper;
		}
		onEnumerationItemAddButtonClick() {
			this.unbindItemClickHandlers();
			this.createEnumerationItem().focus();
			this.bindLastItemClickHandler();
		}
		onEnumerationItemClick() {
			this.unbindItemClickHandlers();
			this.createEnumerationItem();
			this.bindLastItemClickHandler();
		}
		initItemClickHandlers() {
			this.unbindItemClickHandlers();
			this.bindLastItemClickHandler();
		}
		unbindItemClickHandlers() {
			this._enumItems.forEach(item => main_core.Event.unbindAll(item._labelInput, 'click'));
		}
		bindLastItemClickHandler() {
			const lastItem = this._enumItems[this._enumItems.length - 1];
			if (lastItem) {
				main_core.Event.bindOnce(lastItem._labelInput, 'click', this.onEnumerationItemClick.bind(this));
			}
		}
		createEnumerationItem(data) {
			let item = null;
			if (this._typeId === 'directory') {
				item = IblockDirectoryFieldItem.create("", {
					configurator: this,
					container: this._enumItemContainer,
					data: data
				});
			} else {
				item = BX.UI.EntityEditorUserFieldListItem.create("", {
					configurator: this,
					container: this._enumItemContainer,
					data: data
				});
			}
			this._enumItems.push(item);
			item.layout();
			return item;
		}
		removeEnumerationItem(item) {
			for (let i = 0, length = this._enumItems.length; i < length; i++) {
				if (this._enumItems[i] === item) {
					this._enumItems[i].clearLayout();
					this._enumItems.splice(i, 1);
					this.initItemClickHandlers();
					break;
				}
			}
		}
		prepareSaveParams(e) {
			const params = super.prepareSaveParams(this, arguments);
			if (this._typeId === 'list' || this._typeId === 'multilist') {
				params['enumeration'] = [];
				const hashes = [];
				this._enumItems.forEach(enumItem => {
					if (!(enumItem instanceof BX.UI.EntityEditorUserFieldListItem)) {
						return;
					}
					const enumData = enumItem.prepareData();
					if (!enumData) {
						return;
					}
					const hash = BX.util.hashCode(enumData['VALUE']);
					if (BX.util.in_array(hash, hashes)) {
						return;
					}
					hashes.push(hash);
					if (main_core.Type.isNil(enumData['ID'])) {
						enumData['ID'] = main_core.Text.getRandom();
					}
					let sortIndex = -1;
					if (this._draggable) {
						sortIndex = this._draggable.getElementIndex(enumItem.getDraggableContainer());
					}
					sortIndex = sortIndex >= 0 ? sortIndex : params['enumeration'].length;
					enumData["SORT"] = (main_core.Text.toNumber(sortIndex) + 1) * 100;
					params['enumeration'].push(enumData);
				});
			}
			if (this._typeId === 'directory') {
				params['enumeration'] = [];
				this._enumItems.forEach(enumItem => {
					if (!(enumItem instanceof IblockDirectoryFieldItem)) {
						return;
					}
					const enumData = enumItem.prepareData();
					if (!enumData) {
						return;
					}
					enumData['SORT'] = (params['enumeration'].length + 1) * 100;
					params['enumeration'].push(enumData);
				});
			} else if (this._typeId === 'datetime' || this._typeId === 'multidatetime') {
				params['enableTime'] = this._isTimeEnabledCheckBox.checked;
			}
			if (this._field) {
				if (this._isMultipleCheckBox) {
					params["multiple"] = this._isMultipleCheckBox.checked;
				}
			} else {
				if (this._typeId === "boolean") {
					params["multiple"] = false;
				} else if (this._isMultipleCheckBox) {
					params["multiple"] = this._isMultipleCheckBox.checked;
				}
			}
			if (this._isPublic) {
				params["isPublic"] = this._isPublic.checked;
			}
			if (this._typeId === 'custom') {
				params['userType'] = this._field?.getSchemeElement()?._settings?.settings['USER_TYPE'];
			}
			return params;
		}
		getMultipleCheckBox() {
			const checkBox = this.createOption({
				caption: BX.message("UI_ENTITY_EDITOR_UF_MULTIPLE_FIELD")
			});
			if (this._field instanceof BX.UI.EntityEditorMultiText || this._field instanceof BX.UI.EntityEditorMultiNumber || this._field instanceof BX.UI.EntityEditorMultiList || this._field instanceof BX.UI.EntityEditorMultiDatetime || this._field instanceof BX.UI.EntityEditorMultiMoney || this._field instanceof BX.UI.EntityEditorCustom && this._field.getSchemeElement()._settings.multiple) {
				checkBox.checked = true;
			}
			return checkBox;
		}
		onSaveButtonClick() {
			if (this._isLocked) {
				return;
			}
			if (this._mandatoryConfigurator) {
				if (this._mandatoryConfigurator.isChanged()) {
					this._mandatoryConfigurator.acceptChanges();
				}
				this._mandatoryConfigurator.close();
			}
			const params = this.prepareSaveParams();
			if (this._field instanceof BX.UI.EntityEditorCustom) {
				this._field.getSchemeElement().mergeSettings({
					multiple: params.multiple
				});
				const modes = ['edit', 'view'];
				for (let i = 0; i < modes.length; i++) {
					const htmlListName = BX.prop.getString(this._field.getSchemeElement().getData(), modes[i] + 'List', null);
					const htmlList = BX.prop.getObject(this._field.getModel().getData(), htmlListName, null);
					if (htmlList !== null) {
						const newHtml = params.multiple ? htmlList.MULTIPLE : htmlList.SINGLE;
						const htmlName = BX.prop.getString(this._field.getSchemeElement().getData(), modes[i], null);
						if (BX.prop.getString(this._field.getModel().getData(), htmlName, null) !== null) {
							this._field.getModel().setField(htmlName, newHtml);
							this._field.getModel().setInitFieldValue(htmlName, newHtml);
							if (modes[i] === 'view') {
								if (newHtml === '') {
									main_core.Dom.clean(this._field.getContentWrapper());
									main_core.Dom.append(main_core.Tag.render`
										<div class="ui-entity-editor-content-block-text">
											${main_core.Loc.getMessage("UI_ENTITY_EDITOR_FIELD_EMPTY")}							
										</div>
									`, this._field.getContentWrapper());
								} else {
									this._field.getContentWrapper().innerHTML = newHtml;
								}
							}
						}
					}
				}
			}
			this._field?.getSchemeElement()?.setDataParam('isPublic', params['isPublic']);
			BX.onCustomEvent(this, "onSave", [this, params]);
		}
		getIsRequiredCheckBox() {
			let checkBox;
			if (this._mandatoryConfigurator) {
				checkBox = this.createOption({
					caption: this._mandatoryConfigurator.getTitle() + ":",
					labelSettings: {
						props: {
							className: "ui-entity-new-field-addiction-label"
						}
					},
					containerSettings: {
						style: {
							alignItems: "center"
						}
					},
					elements: this._mandatoryConfigurator.getButton().prepareLayout()
				});
				checkBox.checked = this._field && this._field.isRequired() || this._mandatoryConfigurator.isCustomized();
				this._mandatoryConfigurator.setSwitchCheckBox(checkBox);
				this._mandatoryConfigurator.setLabel(checkBox.nextSibling);
				this._mandatoryConfigurator.setEnabled(checkBox.checked);
				this._mandatoryConfigurator.adjust();
			} else {
				checkBox = this.createOption({
					caption: main_core.Loc.getMessage("UI_ENTITY_EDITOR_UF_REQUIRED_FIELD")
				});
				checkBox.checked = this._field && this._field.isRequired();
			}
			return checkBox;
		}
		getIsTimeEnabledCheckBox() {
			const checkBox = this.createOption({
				caption: main_core.Loc.getMessage("UI_ENTITY_EDITOR_UF_ENABLE_TIME")
			});
			checkBox.checked = this._field && this._field.isTimeEnabled();
			return checkBox;
		}
		getIsPublicCheckBox() {
			const checkBox = this.createOption({
				caption: main_core.Loc.getMessage("CATALOG_ENTITY_EDITOR_IS_PUBLIC_PROPERTY")
			});
			if (!this._field) {
				checkBox.checked = true;
			} else {
				checkBox.checked = this._field.getSchemeElement() && BX.prop.get(this._field.getSchemeElement().getData(), "isPublic", true);
			}
			return checkBox;
		}
	}
	main_core.Reflection.namespace('BX.Catalog').IblockFieldConfigurator = IblockFieldConfigurator;

	class IblockFieldConfigurationManager extends BX.UI.EntityConfigurationManager {
		createFieldConfigurator(params, parent) {
			if (!BX.type.isPlainObject(params)) {
				throw "IblockFieldConfigurationManager: The 'params' argument must be object.";
			}
			return this.getSimpleFieldConfigurator(params, parent);
		}
		getSimpleFieldConfigurator(params, parent) {
			let typeId = "";
			const field = BX.prop.get(params, 'field', null);
			if (field) {
				typeId = field.getType();
				field.setVisible(false);
				if (!BX.prop.get(field.getSchemeElement().getData(), "isProductProperty", false)) {
					return this._fieldConfigurator = BX.UI.EntityEditorFieldConfigurator.create("", {
						editor: this._editor,
						schemeElement: null,
						model: parent._model,
						mode: BX.UI.EntityEditorMode.edit,
						parent: parent,
						typeId: typeId,
						field: field,
						mandatoryConfigurator: null
					});
				} else if (BX.prop.get(field.getSchemeElement().getData(), "userType", false)) {
					typeId = BX.prop.getString(field.getSchemeElement().getData(), "userType");
				}
			} else {
				typeId = BX.prop.get(params, 'typeId', BX.UI.EntityUserFieldType.string);
			}
			this._fieldConfigurator = IblockFieldConfigurator.create('', {
				editor: this._editor,
				schemeElement: null,
				model: parent._model,
				mode: BX.UI.EntityEditorMode.edit,
				parent: parent,
				typeId: typeId,
				field: field,
				mandatoryConfigurator: null
			});
			return this._fieldConfigurator;
		}
		isCreationEnabled() {
			return this._editor?.isSectionEditEnabled() && !this._editor?.isReadOnly();
		}
		getCreationPageUrl(typeId) {
			return this.creationPageUrl;
		}
		openCreationPageUrl(typeId) {
			BX.SidePanel.Instance.open(this.getCreationPageUrl(typeId), {
				width: 900,
				// corresponds to the slider settings on `iblock/install/components/bitrix/iblock.property.grid/templates/.default/script.es6.js`
				allowChangeHistory: false,
				cacheable: false
			});
		}
		setCreationPageUrl(url) {
			return this.creationPageUrl = url;
		}
		getTypeInfos() {
			var items = [];
			items.push({
				name: "string",
				title: BX.message("UI_ENTITY_EDITOR_UF_STRING_TITLE"),
				legend: BX.message("UI_ENTITY_EDITOR_UF_STRING_LEGEND")
			});
			items.push({
				name: "list",
				title: BX.message("UI_ENTITY_EDITOR_UF_ENUM_TITLE"),
				legend: BX.message("UI_ENTITY_EDITOR_UF_ENUM_LEGEND")
			});
			items.push({
				name: "datetime",
				title: BX.message("UI_ENTITY_EDITOR_UF_DATETIME_TITLE"),
				legend: BX.message("UI_ENTITY_EDITOR_UF_DATETIME_LEGEND")
			});
			items.push({
				name: "address",
				title: BX.message("UI_ENTITY_EDITOR_UF_ADDRESS_TITLE"),
				legend: BX.message("UI_ENTITY_EDITOR_UF_ADDRESS_LEGEND")
			});
			items.push({
				name: "money",
				title: BX.message("UI_ENTITY_EDITOR_UF_MONEY_TITLE"),
				legend: BX.message("UI_ENTITY_EDITOR_UF_MONEY_LEGEND")
			});
			items.push({
				name: "boolean",
				title: BX.message("UI_ENTITY_EDITOR_BOOLEAN_TITLE"),
				legend: BX.message("UI_ENTITY_EDITOR_UF_BOOLEAN_LEGEND")
			});
			items.push({
				name: "double",
				title: BX.message("UI_ENTITY_EDITOR_UF_DOUBLE_TITLE"),
				legend: BX.message("UI_ENTITY_EDITOR_UF_DOUBLE_LEGEND")
			});
			items.push({
				name: "directory",
				title: BX.message("CATALOG_ENTITY_CARD_DICTIONARY_TITLE"),
				legend: BX.message("CATALOG_ENTITY_CARD_DICTIONARY_LEGEND")
			});
			items.push({
				name: "custom",
				title: BX.message("UI_ENTITY_EDITOR_UF_CUSTOM_TITLE"),
				legend: BX.message("UI_ENTITY_EDITOR_UF_CUSTOM_LEGEND")
			});
			return items;
		}
		static create(id, settings) {
			const self = new this();
			self.initialize(id, settings);
			return self;
		}
	}

	class GridFieldConfigurator extends BX.UI.EntityEditorFieldConfigurator {
		static create(id, settings) {
			const self = new this();
			self.initialize(id, settings);
			return self;
		}

		// ToDo remove unused methods
		appendEnumerationSettings() {
			if (this._typeId === "list" || this._typeId === "multilist") {
				main_core.Dom.append(main_core.Tag.render`<hr class="ui-entity-editor-line">`, this._wrapper);
				const enumWrapper = main_core.Tag.render`
				<div class="ui-entity-editor-content-block">
					<div class="ui-entity-editor-block-title">
						<span class="ui-entity-editor-block-title-text">${BX.message("UI_ENTITY_EDITOR_UF_ENUM_ITEMS")}</span>
					</div>
				</div>
			`;
				main_core.Dom.append(enumWrapper, this._wrapper);
				this._enumItemContainer = main_core.Tag.render`
					<div class="ui-entity-editor-content-block"></div>
				`;
				main_core.Dom.append(this._enumItemContainer, enumWrapper);
				const addButton = main_core.Tag.render`
					<div class="ui-entity-card-content-add-field">
						${BX.message("UI_ENTITY_EDITOR_ADD")}
					</div>
				`;
				main_core.Event.bind(addButton, "click", this.onEnumerationItemAddButtonClick.bind(this));
				main_core.Dom.append(main_core.Tag.render`
					<div class="ui-entity-editor-content-block-add-field">
						${addButton}
					</div>
				`, enumWrapper);
				if (this._field) {
					this._field.getItems().forEach(enumFields => {
						if (enumFields.VALUE !== '') {
							this.createEnumerationItem({
								VALUE: enumFields.NAME,
								ID: enumFields.VALUE
							});
						}
					});
				}
				this.createEnumerationItem();
				this.initItemFocusHandlers();
			}
		}
		onEnumerationItemAddButtonClick() {
			this.unbindItemFocusHandlers();
			this.createEnumerationItem().focus();
			this.bindLastItemFocusHandler();
		}
		onEnumerationItemFocus() {
			this.unbindItemFocusHandlers();
			this.createEnumerationItem();
			this.bindLastItemFocusHandler();
		}
		initItemFocusHandlers() {
			this.unbindItemFocusHandlers();
			this.bindLastItemFocusHandler();
		}
		unbindItemFocusHandlers() {
			this._enumItems.forEach(item => main_core.Event.unbindAll(item._labelInput, 'focus'));
		}
		bindLastItemFocusHandler() {
			const lastItem = this._enumItems[this._enumItems.length - 1];
			if (lastItem) {
				main_core.Event.bindOnce(lastItem._labelInput, 'focus', this.onEnumerationItemFocus.bind(this));
			}
		}
		createEnumerationItem(data) {
			var item = BX.UI.EntityEditorUserFieldListItem.create("", {
				configurator: this,
				container: this._enumItemContainer,
				data: data
			});
			this._enumItems.push(item);
			item.layout();
			return item;
		}
		removeEnumerationItem(item) {
			for (var i = 0, length = this._enumItems.length; i < length; i++) {
				if (this._enumItems[i] === item) {
					this._enumItems[i].clearLayout();
					this._enumItems.splice(i, 1);
					this.initItemFocusHandlers();
					break;
				}
			}
		}
		prepareSaveParams(e) {
			const params = super.prepareSaveParams(this, arguments);
			if (this._typeId === 'list' || this._typeId === 'multilist') {
				params['enumeration'] = [];
				const hashes = [];
				this._enumItems.forEach(enumItem => {
					if (!(enumItem instanceof BX.UI.EntityEditorUserFieldListItem)) {
						return;
					}
					const enumData = enumItem.prepareData();
					if (!enumData) {
						return;
					}
					const hash = BX.util.hashCode(enumData['VALUE']);
					if (BX.util.in_array(hash, hashes)) {
						return;
					}
					hashes.push(hash);
					enumData['SORT'] = (params['enumeration'].length + 1) * 100;
					params['enumeration'].push(enumData);
				});
			} else if (this._typeId === 'datetime' || this._typeId === 'multidatetime') {
				params['enableTime'] = this._isTimeEnabledCheckBox.checked;
			}
			return params;
		}
		getMultipleCheckBox() {
			var checkBox = this.createOption({
				caption: BX.message("UI_ENTITY_EDITOR_UF_MULTIPLE_FIELD")
			});
			if (this._field instanceof BX.UI.EntityEditorMultiText || this._field instanceof BX.UI.EntityEditorMultiNumber || this._field instanceof BX.UI.EntityEditorMultiList || this._field instanceof BX.UI.EntityEditorMultiDatetime) {
				checkBox.checked = true;
			}
			return checkBox;
		}
		getIsRequiredCheckBox() {
			let checkBox = null;
			if (this._typeId !== "boolean") {
				if (this._enableMandatoryControl) {
					if (this._mandatoryConfigurator) {
						checkBox = this.createOption({
							caption: this._mandatoryConfigurator.getTitle() + ":",
							labelSettings: {
								props: {
									className: "ui-entity-new-field-addiction-label"
								}
							},
							containerSettings: {
								style: {
									alignItems: "center"
								}
							},
							elements: this._mandatoryConfigurator.getButton().prepareLayout()
						});
						checkBox.checked = this._field && this._field.isRequired() || this._mandatoryConfigurator.isCustomized();
						this._mandatoryConfigurator.setSwitchCheckBox(checkBox);
						this._mandatoryConfigurator.setLabel(checkBox.nextSibling);
						this._mandatoryConfigurator.setEnabled(checkBox.checked);
						this._mandatoryConfigurator.adjust();
					} else {
						checkBox = this.createOption({
							caption: BX.message("UI_ENTITY_EDITOR_UF_REQUIRED_FIELD")
						});
						checkBox.checked = this._field && this._field.isRequired();
					}
				}
			}
			return checkBox;
		}
		getIsTimeEnabledCheckBox() {
			var checkBox = null;
			if (this._typeId === "datetime" || this._typeId === "multidatetime") {
				checkBox = this.createOption({
					caption: BX.message("UI_ENTITY_EDITOR_UF_ENABLE_TIME")
				});
				checkBox.checked = this._field && this._field.isTimeEnabled();
			}
			return checkBox;
		}
	}

	class GridFieldConfigurationManager extends BX.UI.EntityConfigurationManager {
		createFieldConfigurator(params, parent) {
			if (!main_core.Type.isPlainObject(params)) {
				throw "GridFieldConfigurationManager: The 'params' argument must be object.";
			}
			return this.getSimpleFieldConfigurator(params, parent);
		}
		getSimpleFieldConfigurator(params, parent) {
			let typeId = "";
			const child = BX.prop.get(params, 'field', null);
			if (child) {
				typeId = child.getType();
				child.setVisible(false);
				if (!BX.prop.get(child.getSchemeElement().getData(), "isProductProperty", false)) {
					return this._fieldConfigurator = BX.UI.EntityEditorFieldConfigurator.create("", {
						editor: this._editor,
						schemeElement: null,
						model: parent._model,
						mode: BX.UI.EntityEditorMode.edit,
						parent: parent,
						typeId: typeId,
						field: child,
						mandatoryConfigurator: null
					});
				}
			} else {
				typeId = BX.prop.get(params, 'typeId', BX.UI.EntityUserFieldType.string);
			}
			this._fieldConfigurator = GridFieldConfigurator.create('', {
				editor: this._editor,
				schemeElement: null,
				model: parent._model,
				mode: BX.UI.EntityEditorMode.edit,
				parent: parent,
				typeId: typeId,
				field: child,
				mandatoryConfigurator: null
			});
			return this._fieldConfigurator;
		}
		isSelectionEnabled() {
			return false;
		}
		isCreationEnabled() {
			return false;
		}
		hasExternalForm(typeId) {
			return true;
		}
		getCreationPageUrl(typeId) {
			const filtered = this.getTypeInfos().filter(item => {
				return item.name === typeId;
			});
			if (filtered.length > 0) {
				return this.creationPageUrl.replace('#PROPERTY_TYPE#', typeId);
			}
		}
		openCreationPageUrl(typeId) {
			this.openCreationPageSlider(this.getCreationPageUrl(typeId));
		}
		openCreationPageSlider(url) {
			if (main_core.Type.isStringFilled(url)) {
				BX.SidePanel.Instance.open(url, {
					width: 550,
					allowChangeHistory: false,
					cacheable: false
				});
			}
		}
		setCreationPageUrl(url) {
			return this.creationPageUrl = url;
		}
		getTypeInfos() {
			return [{
				name: "list",
				title: BX.message("CATALOG_ENTITY_CARD_LIST_TITLE"),
				legend: BX.message("CATALOG_ENTITY_CARD_LIST_LEGEND")
			}, {
				name: "directory",
				title: BX.message("CATALOG_ENTITY_CARD_DICTIONARY_TITLE"),
				legend: BX.message("CATALOG_ENTITY_CARD_DICTIONARY_LEGEND")
			}];
		}
		static create(id, settings) {
			const self = new this();
			self.initialize(id, settings);
			return self;
		}
	}

	class LazyLoader {
		constructor(id, settings) {
			this.id = main_core.Type.isStringFilled(id) ? id : main_core.Text.getRandom();
			this.settings = main_core.Type.isObjectLike(settings) ? settings : {};
			this.container = this.settings.container;
			if (!this.container) {
				throw 'Error: Could not find container.';
			}
			this.serviceUrl = this.settings.serviceUrl || '';
			if (!main_core.Type.isStringFilled(this.serviceUrl)) {
				throw 'Error. Could not find service url.';
			}
			this.tabId = this.settings.tabId || '';
			if (!main_core.Type.isStringFilled(this.tabId)) {
				throw 'Error: Could not find tab id.';
			}
			this.params = main_core.Type.isObjectLike(this.settings.componentData) ? this.settings.componentData : {};
			this.isRequestRunning = false;
			this.loaded = false;
		}
		isLoaded() {
			return this.loaded;
		}
		load() {
			if (!this.isLoaded()) {
				this.startRequest({
					...this.params,
					...{
						'TABID': this.tabId
					}
				});
			}
		}
		startRequest(params) {
			if (this.isRequestRunning) {
				return false;
			}
			this.isRequestRunning = true;
			BX.ajax({
				url: this.serviceUrl,
				method: 'POST',
				dataType: 'html',
				data: {
					'LOADERID': this.id,
					'PARAMS': params
				},
				onsuccess: this.onRequestSuccess.bind(this),
				onfailure: this.onRequestFailure.bind(this)
			});
			return true;
		}
		onRequestSuccess(data) {
			this.isRequestRunning = false;
			this.container.innerHTML = data;
			this.loaded = true;
		}
		onRequestFailure() {
			this.isRequestRunning = false;
			this.loaded = true;
		}
	}

	class Tab {
		constructor(id, settings) {
			this.id = main_core.Type.isStringFilled(id) ? id : main_core.Text.getRandom();
			this.settings = main_core.Type.isObjectLike(settings) ? settings : {};
			this.data = main_core.Type.isObjectLike(this.settings.data) ? this.settings.data : {};
			this.manager = settings.manager || null;
			this.container = this.settings.container;
			this.menuContainer = this.settings.menuContainer;
			this.active = main_core.Type.isBoolean(this.data.active) ? this.data.active : false;
			this.enabled = main_core.Type.isBoolean(this.data.enabled) ? this.data.enabled : true;
			main_core.Event.bind(this.menuContainer.querySelector('a.catalog-entity-section-tab-link'), 'click', this.onMenuClick.bind(this));
			this.loader = null;
			if (main_core.Type.isObjectLike(this.data.loader)) {
				this.loader = new LazyLoader(this.id, {
					...this.data.loader,
					...{
						tabId: this.id,
						container: this.container
					}
				});
			}
		}
		isEnabled() {
			return this.enabled;
		}
		isActive() {
			return this.active;
		}
		setActive(active) {
			active = !!active;
			if (this.isActive() === active) {
				return;
			}
			this.active = active;
			if (this.isActive()) {
				this.showTab();
			} else {
				this.hideTab();
			}
		}
		showTab() {
			main_core.Dom.addClass(this.container, 'catalog-entity-section-tab-content-show');
			main_core.Dom.removeClass(this.container, 'catalog-entity-section-tab-content-hide');
			main_core.Dom.addClass(this.menuContainer, 'catalog-entity-section-tab-current');
			this.container.style.display = '';
			this.container.style.position = 'absolute';
			this.container.style.top = 0;
			this.container.style.left = 0;
			this.container.style.width = '100%';
			new BX.easing({
				duration: 350,
				start: {
					opacity: 0,
					translateX: 100
				},
				finish: {
					opacity: 100,
					translateX: 0
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: state => {
					this.container.style.opacity = state.opacity / 100;
					this.container.style.transform = 'translateX(' + state.translateX + '%)';
				},
				complete: () => {
					main_core.Dom.removeClass(this.container, 'catalog-entity-section-tab-content-show');
					this.container.style.cssText = '';
					main_core.Event.EventEmitter.emit(window, 'onEntityDetailsTabShow', [this]);
				}
			}).animate();
		}
		hideTab() {
			main_core.Dom.addClass(this.container, 'catalog-entity-section-tab-content-hide');
			main_core.Dom.removeClass(this.container, 'catalog-entity-section-tab-content-show');
			main_core.Dom.removeClass(this.menuContainer, 'catalog-entity-section-tab-current');
			new BX.easing({
				duration: 350,
				start: {
					opacity: 100
				},
				finish: {
					opacity: 0
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: state => {
					this.container.style.opacity = state.opacity / 100;
				},
				complete: () => {
					this.container.style.display = 'none';
					this.container.style.transform = 'translateX(100%)';
					this.container.style.opacity = 0;
				}
			}).animate();
		}
		onMenuClick(event) {
			if (this.isEnabled()) {
				if (this.loader && !this.loader.isLoaded()) {
					this.loader.load();
				}
				this.manager.selectItem(this);
			}
			event.preventDefault();
		}
	}

	class Manager {
		constructor(id, settings) {
			this.id = main_core.Type.isStringFilled(id) ? id : main_core.Text.getRandom();
			this.settings = main_core.Type.isObjectLike(settings) ? settings : {};
			this.container = this.settings.container;
			this.menuContainer = this.settings.menuContainer;
			this.items = [];
			if (main_core.Type.isArray(this.settings.data)) {
				this.settings.data.forEach(item => {
					this.items.push(new Tab(item.id, {
						manager: this,
						data: item,
						container: this.container.querySelector('[data-tab-id="' + item.id + '"]'),
						menuContainer: this.menuContainer.querySelector('[data-tab-id="' + item.id + '"]')
					}));
				});
			}
			main_core_events.EventEmitter.subscribe('BX.Catalog.EntityCard.TabManager:onOpenTab', event => {
				let tabId = event.data.tabId;
				let item = this.findItemById(tabId);
				if (item) {
					this.selectItem(item);
				}
			});
		}
		findItemById(id) {
			return this.items.find(item => item.id === id) || null;
		}
		selectItem(item) {
			main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onSelectItem', {
				tabId: item.id
			});
			this.items.forEach(current => current.setActive(current === item));
		}
	}

	let BaseCard = /*#__PURE__*/function () {
		function BaseCard(id, settings = {}) {
			babelHelpers.classCallCheck(this, BaseCard);
			this.id = main_core.Type.isStringFilled(id) ? id : main_core.Text.getRandom();
			this.entityId = main_core.Text.toInteger(settings.entityId) || 0;
			this.settings = settings;
			this.container = document.getElementById(settings.containerId);
			this.initializeTabManager();
			this.checkFadeOverlay();
		}
		return babelHelpers.createClass(BaseCard, [{
			key: "initializeTabManager",
			value: function initializeTabManager() {
				return new Manager(this.id, {
					container: document.getElementById(this.settings.tabContainerId),
					menuContainer: document.getElementById(this.settings.tabMenuContainerId),
					data: this.settings.tabs || []
				});
			}
		}, {
			key: "checkFadeOverlay",
			value: function checkFadeOverlay() {
				if (this.entityId <= 0) {
					this.overlay = main_core.Tag.render`<div class="catalog-entity-overlay"></div>`;
					main_core.Dom.append(this.overlay, this.container);
					if (window === window.top) {
						this.overlay.style.position = 'absolute';
						this.overlay.style.top = this.overlay.style.left = this.overlay.style.right = '-15px';
					}
				}
			}
		}]);
	}();

	function _callSuper(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function () { return !!t; })(); }
	let EntityCard = /*#__PURE__*/function (_BaseCard) {
		function EntityCard(id, settings = {}) {
			var _this;
			babelHelpers.classCallCheck(this, EntityCard);
			_this = _callSuper(this, EntityCard, [id, settings]);
			babelHelpers.defineProperty(_this, "stackWithOffset", null);
			_this.cardSettings = settings.cardSettings || [];
			_this.hiddenFields = settings.hiddenFields || [];
			_this.feedbackUrl = settings.feedbackUrl || '';
			_this.variationGridId = settings.variationGridId;
			_this.productStoreGridId = settings.productStoreGridId || null;
			_this.settingsButtonId = settings.settingsButtonId;
			_this.createDocumentButtonId = settings.createDocumentButtonId;
			_this.createDocumentButtonMenuPopupItems = settings.createDocumentButtonMenuPopupItems;
			_this.componentName = settings.componentName || null;
			_this.componentSignedParams = settings.componentSignedParams || null;
			_this.variationGridComponentName = (settings.variationGridComponentName || 'BX.Catalog.VariationGrid') + '.Instance';
			_this.isSimpleProduct = settings.isSimpleProduct || false;
			_this.isWithOrdersMode = settings.isWithOrdersMode || false;
			_this.isInventoryManagementUsed = settings.isInventoryManagementUsed || false;
			_this.isInventoryManagementToolEnabled = settings.isInventoryManagementToolEnabled || false;
			_this.registerFieldsFactory();
			_this.registerControllersFactory();
			_this.registerEvents();
			_this.bindCardSettingsButton();
			_this.bindCreateDocumentButtonMenu();
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', _this.onSliderMessage.bind(_this));
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorSection:onLayout', _this.onSectionLayout.bind(_this));
			main_core_events.EventEmitter.subscribe('Grid::updated', _this.onGridUpdatedHandler.bind(_this));
			return _this;
		}
		babelHelpers.inherits(EntityCard, _BaseCard);
		return babelHelpers.createClass(EntityCard, [{
			key: "getEntityType",
			value: function getEntityType() {
				return 'Entity';
			}
		}, {
			key: "getCardSetting",
			value: function getCardSetting(id) {
				return this.cardSettings.filter(item => {
					return item.id === id;
				})[0];
			}
		}, {
			key: "isCardSettingEnabled",
			value: function isCardSettingEnabled(id) {
				const settingItem = this.getCardSetting(id);
				return settingItem && settingItem.checked;
			}
		}, {
			key: "bindCardSettingsButton",
			value: function bindCardSettingsButton() {
				const settingsButton = this.getSettingsButton();
				if (settingsButton) {
					main_core.Event.bind(settingsButton.getContainer(), 'click', this.showCardSettingsPopup.bind(this));
				}
			}
		}, {
			key: "getSettingsButton",
			value: function getSettingsButton() {
				return BX.UI.ButtonManager.getByUniqid(this.settingsButtonId);
			}
		}, {
			key: "registerFieldsFactory",
			value: function registerFieldsFactory() {
				return new FieldsFactory();
			}
		}, {
			key: "onGridUpdatedHandler",
			value: function onGridUpdatedHandler(event) {
				const [grid] = event.getCompatData();
				if (grid && grid.getId() === this.getVariationGridId()) {
					this.updateSettingsCheckboxState();
				}
			}
		}, {
			key: "onSectionLayout",
			value: function onSectionLayout() {}
		}, {
			key: "getProductStoreGridId",
			value: function getProductStoreGridId() {
				return this.productStoreGridId;
			}
		}, {
			key: "getProductStoreGridComponent",
			value: function getProductStoreGridComponent() {
				return main_core.Reflection.getClass('BX.Catalog.ProductStoreGridManager.Instance');
			}
		}, {
			key: "reloadProductStoreGrid",
			value: function reloadProductStoreGrid() {
				const gridComponent = this.getProductStoreGridComponent();
				if (gridComponent) {
					if (this.getProductStoreGridId() && this.getProductStoreGridId() === gridComponent.getGridId()) {
						gridComponent.reloadGrid();
					}
				}
			}

			/**
			 * @returns {BX.Catalog.VariationGrid|BX.Catalog.ProductServiceGrid|null}
			 */
		}, {
			key: "getVariationGridComponent",
			value: function getVariationGridComponent() {
				//return Reflection.getClass('BX.Catalog.VariationGrid.Instance');
				return main_core.Reflection.getClass(this.variationGridComponentName);
			}
		}, {
			key: "reloadVariationGrid",
			value: function reloadVariationGrid() {
				const gridComponent = this.getVariationGridComponent();
				if (gridComponent) {
					gridComponent.reloadGrid();
				}
			}
		}, {
			key: "getVariationGridId",
			value: function getVariationGridId() {
				return this.variationGridId;
			}
		}, {
			key: "getVariationGrid",
			value: function getVariationGrid() {
				if (!main_core.Reflection.getClass('BX.Main.gridManager.getInstanceById')) {
					return null;
				}
				return BX.Main.gridManager.getInstanceById(this.getVariationGridId());
			}
		}, {
			key: "registerControllersFactory",
			value: function registerControllersFactory() {
				return new ControllersFactory();
			}
		}, {
			key: "registerEvents",
			value: function registerEvents() {
				main_core_events.EventEmitter.subscribe('BX.UI.EntityConfigurationManager:onInitialize', this.onConfigurationManagerInit.bind(this));
				main_core_events.EventEmitter.subscribe('BX.UI.EntityEditor:onCancel', this.removeFileHiddenInputs.bind(this));
				main_core_events.EventEmitter.subscribe('BX.UI.EntityEditor:onInit', this.onEditorInitHandler.bind(this));
				main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorAjax:onSubmit', this.onEditorAjaxSubmit.bind(this));
				main_core_events.EventEmitter.subscribe('onEntityCreate', this.onEntityCreateHandler.bind(this));
				main_core_events.EventEmitter.subscribe('onEntityUpdate', this.onEntityUpdateHandler.bind(this));
				main_core_events.EventEmitter.subscribe('onAttachFiles', this.onAttachFilesHandler.bind(this));
				main_core_events.EventEmitter.subscribe('BX.Main.Popup:onClose', this.onFileEditorCloseHandler.bind(this));
				main_core_events.EventEmitter.subscribe('onAfterVariationGridSave', this.onAfterVariationGridSave.bind(this));
			}
		}, {
			key: "onAfterVariationGridSave",
			value: function onAfterVariationGridSave(event) {
				const data = event.getData();
				if (data.gridId === this.getVariationGridId()) {
					this.reloadProductStoreGrid();
				}
			}
		}, {
			key: "onAttachFilesHandler",
			value: function onAttachFilesHandler(event) {
				const editor = this.getEditorInstance();
				if (!editor) {
					return;
				}
				const [,, uploader] = event.getCompatData();
				if (uploader && main_core.Type.isDomNode(uploader.fileInput)) {
					const parent = uploader.fileInput.closest('[data-cid]');
					if (main_core.Type.isDomNode(parent)) {
						const controlName = parent.getAttribute('data-cid');
						const control = editor.getControlByIdRecursive(controlName);
						if (control) {
							control.markAsChanged();
						}
					}
				}
			}
		}, {
			key: "onFileEditorCloseHandler",
			value: function onFileEditorCloseHandler(event) {
				const [popup] = event.getCompatData();
				if (popup && popup.getId() === 'popupFM' && popup.onApplyFlag) {
					this.showNotification(main_core.Loc.getMessage('CATALOG_ENTITY_CARD_FILE_CLOSE_NOTIFICATION_2'), {
						id: 'fileCloseNotification',
						blinkOnUpdate: false,
						autoHideDelay: 5000
					});
				}
			}
		}, {
			key: "onEditorInitHandler",
			value: function onEditorInitHandler(event) {
				const [editor, fields] = event.getCompatData();
				if (editor && !fields.entityId) {
					const control = editor.getControlByIdRecursive('NAME');
					if (control) {
						requestAnimationFrame(() => {
							control.focus();
						});
					}
				}
			}

			/**
			 * @returns {BX.UI.EntityEditor|null}
			 */
		}, {
			key: "getEditorInstance",
			value: function getEditorInstance() {
				if (main_core.Reflection.getClass('BX.UI.EntityEditor')) {
					return BX.UI.EntityEditor.getDefault();
				}
				return null;
			}
		}, {
			key: "onEditorAjaxSubmit",
			value: function onEditorAjaxSubmit(event) {
				const [fields, response] = event.getCompatData();
				const title = fields['NAME-CODE'].NAME || '';
				this.changePageTitle(title);
				if (response.data) {
					if (main_core.Type.isBoolean(response.data.IS_SIMPLE_PRODUCT)) {
						this.isSimpleProduct = response.data.IS_SIMPLE_PRODUCT;
					}
				}
				if (response.status === 'success') {
					this.removeFileHiddenInputs();
				}
			}
		}, {
			key: "onEntityCreateHandler",
			value: function onEntityCreateHandler(event) {
				const [data] = event.getCompatData();
				this.postSliderMessage('onCreate', data);
			}
		}, {
			key: "onEntityUpdateHandler",
			value: function onEntityUpdateHandler(event) {
				const [data] = event.getCompatData();
				this.postSliderMessage('onUpdate', data);
			}
		}, {
			key: "postSliderMessage",
			value: function postSliderMessage(action, fields) {
				BX.SidePanel.Instance.postMessage(window, `Catalog.${this.getEntityType()}Card::${action}`, fields);
			}
		}, {
			key: "changePageTitle",
			value: function changePageTitle(title) {
				const titleNode = document.getElementById('pagetitle');
				if (main_core.Type.isDomNode(titleNode)) {
					titleNode.innerText = title;
				}
				document.title = title;
				if (BX.getClass('BX.SidePanel.Instance.updateBrowserTitle')) {
					BX.SidePanel.Instance.updateBrowserTitle();
				}
			}
		}, {
			key: "removeFileHiddenInputs",
			value: function removeFileHiddenInputs() {
				document.querySelectorAll('form>input[type="hidden"]').forEach(input => {
					let name = input.getAttribute('name');
					let deleteInput = document.querySelector(`form>input[name="${name}_del"]`);
					if (deleteInput) {
						main_core.Dom.remove(input);
						main_core.Dom.remove(deleteInput);
					}
				});
			}
		}, {
			key: "onConfigurationManagerInit",
			value: function onConfigurationManagerInit(event) {
				const [, eventArgs] = event.getCompatData();
				if (!eventArgs.type || eventArgs.type === 'editor') {
					eventArgs.configurationFieldManager = this.initializeIblockFieldConfigurationManager(eventArgs);
				}
				if (eventArgs.id === 'variation_grid') {
					eventArgs.configurationFieldManager = this.initializeVariationPropertyConfigurationManager(eventArgs);
				}
				if (eventArgs.id === 'service_grid') {
					eventArgs.configurationFieldManager = this.initializeServicePropertyConfigurationManager(eventArgs);
				}
			}
		}, {
			key: "initializeIblockFieldConfigurationManager",
			value: function initializeIblockFieldConfigurationManager(eventArgs) {
				const configurationManager = IblockFieldConfigurationManager.create(this.id, eventArgs);
				configurationManager.setCreationPageUrl(this.settings.creationPropertyUrl);
				return configurationManager;
			}
		}, {
			key: "initializeVariationPropertyConfigurationManager",
			value: function initializeVariationPropertyConfigurationManager(eventArgs) {
				const configurationManager = GridFieldConfigurationManager.create(this.id, eventArgs);
				configurationManager.setCreationPageUrl(this.settings.creationVariationPropertyUrl);
				return configurationManager;
			}
		}, {
			key: "initializeServicePropertyConfigurationManager",
			value: function initializeServicePropertyConfigurationManager(eventArgs) {
				return GridFieldConfigurationManager.create(this.id, eventArgs);
			}
		}, {
			key: "showNotification",
			value: function showNotification(content, options) {
				options = options || {};
				if (BX.GetWindowScrollPos().scrollTop <= 10) {
					options.stack = this.getStackWithOffset();
				}
				BX.UI.Notification.Center.notify({
					content: content,
					position: 'top-right',
					width: 'auto',
					autoHideDelay: 3000,
					...options
				});
			}
		}, {
			key: "getStackWithOffset",
			value: function getStackWithOffset() {
				if (this.stackWithOffset === null) {
					this.stackWithOffset = new BX.UI.Notification.Stack(BX.mergeEx({}, BX.UI.Notification.Center.getStackDefaults(), {
						id: 'top-right-with-offset',
						position: 'top-right-with-offset',
						offsetY: 74
					}));
				}
				return this.stackWithOffset;
			}
		}, {
			key: "openFeedbackPanel",
			value: function openFeedbackPanel() {
				EntityCard.openFeedbackPanelStatic();
			}
		}, {
			key: "bindCreateDocumentButtonMenu",
			value: function bindCreateDocumentButtonMenu() {
				const createDocumentButtonMenu = this.getCreateDocumentButtonMenu();
				if (createDocumentButtonMenu) {
					main_core.Event.bind(createDocumentButtonMenu.getContainer(), 'click', this.showCreateDocumentPopup.bind(this));
				}
			}
		}, {
			key: "getCreateDocumentButtonMenu",
			value: function getCreateDocumentButtonMenu() {
				const createDocumentButton = BX.UI.ButtonManager.getByUniqid(this.createDocumentButtonId);
				if (createDocumentButton) {
					return BX.UI.ButtonManager.getByUniqid(this.createDocumentButtonId).getMenuButton();
				}
				return null;
			}
		}, {
			key: "getCreateDocumentPopup",
			value: function getCreateDocumentPopup() {
				if (!this.createDocumentPopup) {
					this.createDocumentPopup = new main_popup.Popup(this.id + '-create-document', this.getCreateDocumentButtonMenu().getContainer(), {
						autoHide: true,
						draggable: false,
						offsetLeft: 0,
						offsetTop: 0,
						angle: {
							position: 'top',
							offset: 43
						},
						noAllPaddings: true,
						bindOptions: {
							forceBindPosition: true
						},
						closeByEsc: true,
						content: this.getCreateDocumentMenuContent()
					});
				}
				return this.createDocumentPopup;
			}
		}, {
			key: "showCreateDocumentPopup",
			value: function showCreateDocumentPopup() {
				this.getCreateDocumentPopup().show();
			}
		}, {
			key: "closeCreateDocumentPopup",
			value: function closeCreateDocumentPopup() {
				this.getCreateDocumentPopup().close();
			}
		}, {
			key: "getCreateDocumentMenuContent",
			value: function getCreateDocumentMenuContent() {
				const popupWrapper = main_core.Tag.render`<div class="menu-popup"></div>`;
				const popupItemsContainer = main_core.Tag.render`<div class="menu-popup-items"></div>`;
				popupWrapper.appendChild(popupItemsContainer);
				this.createDocumentButtonMenuPopupItems.forEach(item => {
					let itemEntry = null;
					if (this.isInventoryManagementToolEnabled) {
						itemEntry = main_core.Tag.render`
					<a class="menu-popup-item menu-popup-item-no-icon" href="${item.link}">
						<span class="menu-popup-item-text">${item.text}</span>
					</a>
				`;
						main_core.Event.bind(itemEntry, 'click', event => {
							event.preventDefault();
							this.closeCreateDocumentPopup();
						});
					} else {
						itemEntry = main_core.Tag.render`
					<a class="menu-popup-item menu-popup-item-no-icon">
						<span class="menu-popup-item-text">${item.text}</span>
					</a>
				`;
						main_core.Event.bind(itemEntry, 'click', event => {
							event.preventDefault();
							EntityCard.openInventoryManagementToolDisabledSlider();
							this.closeCreateDocumentPopup();
						});
					}
					popupItemsContainer.appendChild(itemEntry);
				});
				return popupWrapper;
			}
		}, {
			key: "getCardSettingsPopup",
			value: function getCardSettingsPopup() {
				if (!this.settingsPopup) {
					this.settingsPopup = new main_popup.Popup(this.id, this.getSettingsButton().getContainer(), {
						autoHide: true,
						draggable: false,
						offsetLeft: 0,
						offsetTop: 0,
						angle: {
							position: 'top',
							offset: 43
						},
						noAllPaddings: true,
						bindOptions: {
							forceBindPosition: true
						},
						closeByEsc: true,
						content: this.prepareCardSettingsContent()
					});
				}
				return this.settingsPopup;
			}
		}, {
			key: "showCardSettingsPopup",
			value: function showCardSettingsPopup() {
				this.getCardSettingsPopup().show();
			}
		}, {
			key: "prepareCardSettingsContent",
			value: function prepareCardSettingsContent() {
				const content = main_core.Tag.render`
			<div class='ui-entity-editor-popup-create-field-list'></div>
		`;
				this.cardSettings.map(item => {
					content.append(this.getSettingItem(item));
				});
				return content;
			}
		}, {
			key: "getSettingItem",
			value: function getSettingItem(item) {
				let input = '';
				if (!item.disabledCheckbox) {
					input = main_core.Tag.render`
				<input type="checkbox">
			`;
					input.checked = item.checked;
					input.disabled = item.disabled ?? false;
					input.dataset.settingId = item.id;
				}
				const hintNode = main_core.Type.isStringFilled(item.hint) ? main_core.Tag.render`<span class="catalog-entity-setting-hint" data-hint="${item.hint}"></span>` : '';
				const setting = main_core.Tag.render`
				<label class="ui-ctl-block ui-entity-editor-popup-create-field-item ui-ctl-w100">
					<div class="ui-ctl-w10" style="text-align: center">${input}</div>
					<div class="ui-ctl-w75">
						<span class="ui-entity-editor-popup-create-field-item-title ${item.disabled ? 'catalog-entity-disabled-setting' : ''}">${item.title}${hintNode}</span>
						<span class="ui-entity-editor-popup-create-field-item-desc">${item.desc}</span>
					</div>
				</label>
			`;
				BX.UI.Hint.init(setting);
				if (item.id === 'SEO') {
					main_core.Event.bind(setting, 'click', event => {
						BX.SidePanel.Instance.open(item.url, {
							cacheable: false,
							allowChangeHistory: false,
							data: {
								'ELEMENT_ID': this.entityId
							},
							width: 1000
						});
					});
				} else {
					main_core.Event.bind(setting, 'change', this.setProductCardSetting.bind(this));
				}
				return setting;
			}
		}, {
			key: "setProductCardSetting",
			value: function setProductCardSetting(event) {
				const settingItem = this.getCardSetting(event.target.dataset.settingId);
				if (!settingItem) {
					return;
				}
				const settingEnabled = event.target.checked;
				if (settingItem.action === 'grid') {
					this.requestGridSettings(settingItem, settingEnabled);
				} else {
					this.requestCardSettings(settingItem, settingEnabled);
				}
			}
		}, {
			key: "onSliderMessage",
			value: function onSliderMessage(event) {
				const [sliderEvent] = event.getCompatData();
				if (sliderEvent.getEventId() === 'Catalog.VariationCard::onCreate' || sliderEvent.getEventId() === 'Catalog.VariationCard::onUpdate') {
					this.reloadVariationGrid();
				}
			}
		}, {
			key: "reloadGrid",
			value: function reloadGrid() {
				document.location.reload();
			}
		}, {
			key: "requestGridSettings",
			value: function requestGridSettings(setting, enabled) {
				if (!this.getVariationGrid()) ;
				const headers = [];
				const cells = this.getVariationGrid().getRows().getHeadFirstChild().getCells();
				Array.from(cells).forEach(header => {
					if ('name' in header.dataset) {
						headers.push(header.dataset.name);
					}
				});
				BX.ajax.runComponentAction(this.componentName, 'setGridSetting', {
					mode: 'class',
					data: {
						signedParameters: this.componentSignedParams,
						settingId: setting.id,
						selected: enabled,
						currentHeaders: headers
					}
				}).then(() => {
					let message = null;
					setting.checked = enabled;
					this.reloadVariationGrid();
					this.postSliderMessage('onUpdate', {});
					this.getCardSettingsPopup().close();
					if (setting.id === 'WAREHOUSE') {
						this.reloadGrid();
						message = enabled ? main_core.Loc.getMessage('CATALOG_ENTITY_CARD_WAREHOUSE_ENABLED') : main_core.Loc.getMessage('CATALOG_ENTITY_CARD_WAREHOUSE_DISABLED');
					} else {
						message = enabled ? main_core.Loc.getMessage('CATALOG_ENTITY_CARD_SETTING_ENABLED') : main_core.Loc.getMessage('CATALOG_ENTITY_CARD_SETTING_DISABLED');
						message = message.replace('#NAME#', setting.title);
					}
					this.showNotification(message, {
						category: 'popup-settings'
					});
				});
			}
		}, {
			key: "requestCardSettings",
			value: function requestCardSettings(setting, enabled) {
				BX.ajax.runComponentAction(this.componentName, 'setCardSetting', {
					mode: 'class',
					data: {
						signedParameters: this.componentSignedParams,
						settingId: setting.id,
						selected: enabled
					}
				}).then(() => {
					setting.checked = enabled;
					if (setting.id === 'CATALOG_PARAMETERS') {
						const section = this.getEditorInstance().getControlByIdRecursive('catalog_parameters');
						if (section) {
							section.refreshLayout();
						}
					}
					this.getCardSettingsPopup().close();
					let message = enabled ? main_core.Loc.getMessage('CATALOG_ENTITY_CARD_SETTING_ENABLED') : main_core.Loc.getMessage('CATALOG_ENTITY_CARD_SETTING_DISABLED');
					this.showNotification(message.replace('#NAME#', setting.title), {
						category: 'popup-settings'
					});
				});
			}
		}, {
			key: "updateSettingsCheckboxState",
			value: function updateSettingsCheckboxState() {
				const popupContainer = this.getCardSettingsPopup().getContentContainer();
				this.cardSettings.filter(item => item.action === 'grid' && main_core.Type.isArray(item.columns?.ITEMS)).forEach(item => {
					let allColumnsExist = true;
					item.columns.ITEMS.forEach(columnName => {
						if (!this.getVariationGrid().getColumnHeaderCellByName(columnName)) {
							allColumnsExist = false;
						}
					});
					const checkbox = popupContainer.querySelector('input[data-setting-id="' + item.id + '"]');
					if (main_core.Type.isDomNode(checkbox)) {
						checkbox.checked = allColumnsExist;
					}
				});
			}
		}], [{
			key: "openFeedbackPanelStatic",
			value: function openFeedbackPanelStatic() {
				BX.UI.Feedback.Form.open({
					id: 'catalog-product-card-feedback',
					forms: [{
						'id': 269,
						'lang': 'ru',
						'sec': 'mqerov',
						'zones': ['ru', 'by', 'kz']
					}, {
						'id': 347,
						'lang': 'en',
						'sec': 'lxfji8',
						'zones': ['en']
					}, {
						'id': 349,
						'lang': 'es',
						'sec': 'gdf9i1',
						'zones': ['es']
					}, {
						'id': 355,
						'lang': 'de',
						'sec': 'x8k56n',
						'zones': ['de']
					}, {
						'id': 357,
						'lang': 'ua',
						'sec': '2z19xl',
						'zones': ['ua']
					}, {
						'id': 353,
						'lang': 'com.br',
						'sec': '5cleqn',
						'zones': ['com.br']
					}]
				});
			}
		}, {
			key: "openInventoryManagementToolDisabledSlider",
			value: function openInventoryManagementToolDisabledSlider() {
				catalog_toolAvailabilityManager.ToolAvailabilityManager.openInventoryManagementToolDisabledSlider();
			}
		}]);
	}(BaseCard);

	exports.BaseCard = BaseCard;
	exports.EntityCard = EntityCard;

})(this.BX.Catalog.EntityCard = this.BX.Catalog.EntityCard || {}, BX, BX.Event, BX, BX.UI.Notification, BX.UI.Feedback, BX.UI, window, BX, BX, BX.Main, BX.Catalog);
//# sourceMappingURL=entity-card.bundle.js.map
