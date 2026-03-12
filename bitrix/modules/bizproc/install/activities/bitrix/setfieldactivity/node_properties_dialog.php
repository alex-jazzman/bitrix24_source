<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\Localization\Loc::loadMessages(__DIR__ . '/properties_dialog.php');

/** @var \Bitrix\Bizproc\Activity\PropertiesDialog $dialog */
/** @var bool $canSetModifiedBy */
/** @var mixed $modifiedBy */
$mergeMultipleFields = $dialog->getMap()['MergeMultipleFields'];

// Generate unique ID prefix for this form instance to avoid collisions
$uniqueId = 'bpsfa_' . substr(md5(uniqid('', true)), 0, 8);
?>

<?= $javascriptFunctions ?>
	<script>
		(function() {
			'use strict';

			if (typeof BX === 'undefined') {
				throw new Error('BX is not defined');
			}

			BX.namespace('BX.Bizproc.Activity');

			/**
			 * SetFieldActivity Properties Dialog Controller
			 * @class
			 */
			BX.Bizproc.Activity.SetFieldPropertiesDialog = function(options) {
				this.formId = options.formId;
				this.formName = options.formName;
				this.objFields = options.objFields || window.objFields || {};
				this.popupWindow = options.popupWindow || null;

				// State
				this.state = {
					counter: -1,
					newfieldCounter: -1,
					currentType: null
				};

				// DOM cache
				this.elements = {};

				// Event handlers storage for cleanup
				this.eventHandlers = [];

				// Messages
				this.messages = {
					emptyName: options.messages.emptyName || '',
					emptyCode: options.messages.emptyCode || '',
					wrongCode: options.messages.wrongCode || '',
					deleteText: options.messages.deleteText || ''
				};

				this.init();
			};

			BX.Bizproc.Activity.SetFieldPropertiesDialog.prototype = {

				/**
				 * Initialize dialog
				 */
				init: function() {
					this.cacheElements();
					this.bindEvents();
					this.initializeFormState();
				},

				/**
				 * Cache DOM elements for performance
				 */
				cacheElements: function() {
					var self = this;
					var elementsToCache = [
						'addrow_table', 'list_form', 'edit_form', 'container',
						'add_btn', 'create_btn', 'save_btn', 'cancel_btn',
						'fld_name', 'fld_code', 'fld_type', 'fld_multiple',
						'fld_required', 'fld_options',
						'tr_pbria_options', 'td_fri_options', 'td_fri_options_promt'
					];

					elementsToCache.forEach(function(id) {
						self.elements[id] = self.getElement(id);
					});
				},

				/**
				 * Get element by local ID with error handling
				 * @param {string} id - Element ID suffix
				 * @returns {HTMLElement|null}
				 */
				getElement: function(id) {
					return document.getElementById(this.formId + '_' + id);
				},

				/**
				 * Bind all event handlers
				 */
				bindEvents: function() {
					var self = this;

					// Use event delegation for dynamically created elements
					this.addEventHandler(document, 'click', function(e) {
						self.handleDocumentClick(e);
					});

					// Bind static buttons
					this.bindButton('add_btn', function(e) {
						e.preventDefault();
						self.addCondition('', '');
					});

					this.bindButton('create_btn', function(e) {
						e.preventDefault();
						self.toggleCreateFieldForm(true);
					});

					this.bindButton('save_btn', function(e) {
						e.preventDefault();
						self.saveNewField();
					});

					this.bindButton('cancel_btn', function(e) {
						e.preventDefault();
						self.toggleCreateFieldForm(false);
					});

					// Bind field type selector
					if (this.elements.fld_type) {
						this.addEventHandler(this.elements.fld_type, 'change', function() {
							self.handleFieldTypeChange(this.value);
						});
					}
				},

				/**
				 * Bind button with error handling
				 * @param {string} elementKey - Key in elements cache
				 * @param {Function} handler - Click handler
				 */
				bindButton: function(elementKey, handler) {
					if (this.elements[elementKey]) {
						this.addEventHandler(this.elements[elementKey], 'click', handler);
					}
				},

				/**
				 * Add event handler and store reference for cleanup
				 * @param {HTMLElement} element - Target element
				 * @param {string} event - Event name
				 * @param {Function} handler - Event handler
				 */
				addEventHandler: function(element, event, handler) {
					if (!element) return;

					BX.bind(element, event, handler);
					this.eventHandlers.push({
						element: element,
						event: event,
						handler: handler
					});
				},

				/**
				 * Handle clicks on dynamically created elements
				 * @param {Event} e - Click event
				 */
				handleDocumentClick: function(e) {
					var target = e.target || e.srcElement;

					// Handle delete link
					if (target && target.className && target.className.indexOf(this.formId + '_delete_link') !== -1) {
						e.preventDefault();
						var counter = target.getAttribute('data-counter');
						if (counter) {
							this.deleteCondition(counter);
						}
						return false;
					}
				},

				/**
				 * Add field condition row
				 * @param {string} field - Field code
				 * @param {*} val - Field value
				 */
				addCondition: function(field, val) {
					var table = this.elements.addrow_table;
					if (!table) {
						return;
					}

					this.state.counter++;
					var rowId = this.state.counter;

					var row = this.createConditionRow(rowId, field, val);
					table.appendChild(row);

					this.loadFieldInputControl(rowId, field || this.getDefaultField(), val);
				},

				/**
				 * Create condition row element
				 * @param {number} rowId - Row counter
				 * @param {string} field - Field code
				 * @param {*} val - Field value
				 * @returns {HTMLElement}
				 */
				createConditionRow: function(rowId, field, val) {
					var self = this;
					var row = BX.create('TR', {
						attrs: { id: this.formId + '_delete_row_' + rowId }
					});

					// Field selector cell
					var selectorCell = BX.create('TD');
					var select = this.createFieldSelector(rowId, field);
					selectorCell.appendChild(select);
					row.appendChild(selectorCell);

					// Equals sign cell
					row.appendChild(BX.create('TD', { html: '=' }));

					// Value input cell
					var valueCell = BX.create('TD', {
						attrs: { id: this.formId + '_td_document_value_' + rowId }
					});
					valueCell.appendChild(BX.create('INPUT', {
						attrs: {
							type: 'text',
							id: this.formId + '_input_' + field,
							name: field,
							value: val || ''
						}
					}));
					row.appendChild(valueCell);

					// Delete button cell
					var deleteCell = BX.create('TD', { attrs: { align: 'right' } });
					deleteCell.appendChild(BX.create('A', {
						attrs: {
							href: '#',
							'data-counter': rowId,
							'class': this.formId + '_delete_link'
						},
						text: this.messages.deleteText
					}));
					row.appendChild(deleteCell);

					return row;
				},

				/**
				 * Create field selector element
				 * @param {number} rowId - Row counter
				 * @param {string} selectedField - Selected field code
				 * @returns {HTMLElement}
				 */
				createFieldSelector: function(rowId, selectedField) {
					var self = this;
					var select = BX.create('SELECT', {
						attrs: {
							id: this.formId + '_document_field_' + rowId,
							name: 'document_field_' + rowId,
							'data-counter': rowId
						},
						events: {
							change: function() {
								var fieldCode = this.value;
								self.loadFieldInputControl(rowId, fieldCode, null);
							}
						}
					});

					var selectedIndex = 0;
					var index = 0;

					for (var key in this.objFields.arDocumentFields) {
						if (!this.objFields.arDocumentFields.hasOwnProperty(key)) continue;

						var option = BX.create('OPTION', {
							attrs: { value: key },
							text: this.objFields.arDocumentFields[key]['Name']
						});

						if (selectedField && key === selectedField) {
							selectedIndex = index;
						}

						select.appendChild(option);
						index++;
					}

					select.selectedIndex = selectedIndex;
					return select;
				},

				/**
				 * Get default field code
				 * @returns {string}
				 */
				getDefaultField: function() {
					for (var key in this.objFields.arDocumentFields) {
						if (this.objFields.arDocumentFields.hasOwnProperty(key)) {
							return key;
						}
					}
					return '';
				},

				/**
				 * Load field input control via AJAX
				 * @param {number} rowId - Row counter
				 * @param {string} fieldCode - Field code
				 * @param {*} value - Field value
				 */
				loadFieldInputControl: function(rowId, fieldCode, value) {
					var self = this;

					if (!this.objFields.arDocumentFields[fieldCode]) {
						return;
					}

					BX.showWait();

					try {
						this.objFields.GetFieldInputControl(
							this.objFields.arDocumentFields[fieldCode],
							value,
							{ Field: fieldCode, Form: this.formName },
							function(html) {
								self.renderFieldInputControl(rowId, html);
								BX.closeWait();
							},
							true
						);
					} catch (e) {
						console.error('Error loading field input control:', e);
						BX.closeWait();
					}
				},

				/**
				 * Render field input control HTML
				 * @param {number} rowId - Row counter
				 * @param {string} html - HTML content
				 */
				renderFieldInputControl: function(rowId, html) {
					var targetEl = this.getElement('td_document_value_' + rowId);
					if (!targetEl) {
						return;
					}

					if (html === undefined || html === null) {
						targetEl.innerHTML = '';
					} else {
						targetEl.innerHTML = html;

						// Reinitialize selectors if available
						if (typeof BX.Bizproc !== 'undefined' && typeof BX.Bizproc.Selector !== 'undefined') {
							BX.Bizproc.Selector.initSelectors(targetEl);
						}
					}
				},

				/**
				 * Delete condition row
				 * @param {number} rowId - Row counter
				 */
				deleteCondition: function(rowId) {
					var row = document.getElementById(this.formId + '_delete_row_' + rowId);
					if (row && row.parentNode) {
						row.parentNode.removeChild(row);
					}
				},

				/**
				 * Toggle create field form
				 * @param {boolean} show - Show or hide
				 */
				toggleCreateFieldForm: function(show) {
					var editForm = this.elements.edit_form;
					var listForm = this.elements.list_form;

					if (!editForm || !listForm) {
						return;
					}

					if (this.popupWindow && this.popupWindow.btnSave && this.popupWindow.btnCancel) {
						this.popupWindow.btnSave.btn.disabled = show;
						this.popupWindow.btnCancel.btn.disabled = show;
					}

					if (show) {
						listForm.style.display = 'none';

						this.setTableRowDisplayValue(editForm)
						this.initializeNewFieldForm();
					} else {
						editForm.style.display = 'none';

						this.setTableRowDisplayValue(listForm)
					}
				},

				/**
				 * Set proper display value for table row (cross-browser)
				 * @param {HTMLElement} element
				 * @returns {string}
				 */
				setTableRowDisplayValue: function(element) {
					try {
						element.style.display = 'table-row';
					} catch (e) {
						element.style.display = 'inline';
					}
				},

				/**
				 * Initialize new field form with default values
				 */
				initializeNewFieldForm: function() {
					// Get first field type as default
					var defaultType = null;
					for (var type in this.objFields.arFieldTypes) {
						if (this.objFields.arFieldTypes.hasOwnProperty(type)) {
							defaultType = type;
							break;
						}
					}

					if (defaultType) {
						this.state.currentType = {
							Type: defaultType,
							Options: null,
							Required: 'N',
							Multiple: 'N'
						};
						this.updateFieldTypeOptions(this.state.currentType);
					}
				},

				/**
				 * Handle field type change
				 * @param {string} newType - New field type
				 */
				handleFieldTypeChange: function(newType) {
					if (this.state.currentType) {
						this.state.currentType.Type = newType;
						this.updateFieldTypeOptions(this.state.currentType);
					}
				},

				/**
				 * Update field type options UI
				 * @param {Object} typeConfig - Type configuration
				 */
				updateFieldTypeOptions: function(typeConfig) {
					var self = this;

					if (!this.objFields.arFieldTypes[typeConfig.Type]) {
						return;
					}

					var isComplex = this.objFields.arFieldTypes[typeConfig.Type].Complex === 'Y';

					if (isComplex) {
						BX.showWait();

						try {
							// Register callback for type switching
							var callbackName = this.formId + '_switchSubTypeControl';
							window[callbackName] = function(value) {
								self.state.currentType.Options = value;
							};

							this.objFields.GetFieldInputControl4Type(
								typeConfig,
								null,
								{ Field: 'fri_default', Form: this.formName },
								callbackName,
								function(html, promptText) {
									self.renderTypeOptions(html, promptText);
									BX.closeWait();
								}
							);
						} catch (e) {
							console.error('Error loading field type options:', e);
							BX.closeWait();
						}
					} else {
						this.hideTypeOptions();
					}
				},

				/**
				 * Render type options HTML
				 * @param {string} html - Options HTML
				 * @param {string} promptText - Prompt text
				 */
				renderTypeOptions: function(html, promptText) {
					var optionsRow = this.elements.tr_pbria_options;
					var optionsCell = this.elements.td_fri_options;
					var promptCell = this.elements.td_fri_options_promt;

					if (html === undefined || html === null) {
						this.hideTypeOptions();
					} else {
						if (optionsRow) optionsRow.style.display = '';
						if (optionsCell) optionsCell.innerHTML = html;

						if (promptCell) {
							var prompt = promptText || '<?= GetMessage("BPSFA_PD_F_MULT") ?>';
							promptCell.innerHTML = BX.util.htmlspecialchars(prompt) + ':';
						}
					}
				},

				/**
				 * Hide type options section
				 */
				hideTypeOptions: function() {
					if (this.elements.tr_pbria_options) {
						this.elements.tr_pbria_options.style.display = 'none';
					}
				},

				/**
				 * Save new field
				 */
				saveNewField: function() {
					var fieldData = this.collectFieldData();

					if (!this.validateFieldData(fieldData)) {
						return;
					}

					this.createField(fieldData);
					this.clearFieldForm();
					this.toggleCreateFieldForm(false);
					this.addCondition(fieldData.code, '');
				},

				/**
				 * Collect field data from form
				 * @returns {Object}
				 */
				collectFieldData: function() {
					return {
						name: this.elements.fld_name ? this.elements.fld_name.value : '',
						code: this.elements.fld_code ? this.elements.fld_code.value.replace(/\W+/g, '') : '',
						type: this.elements.fld_type ? this.elements.fld_type.value : '',
						multiple: this.elements.fld_multiple ? (this.elements.fld_multiple.checked ? 'Y' : 'N') : 'N',
						required: this.elements.fld_required ? (this.elements.fld_required.checked ? 'Y' : 'N') : 'N',
						options: this.state.currentType ? this.state.currentType.Options : null
					};
				},

				/**
				 * Validate field data
				 * @param {Object} data - Field data
				 * @returns {boolean}
				 */
				validateFieldData: function(data) {
					if (!data.name.trim()) {
						alert(this.messages.emptyName);
						if (this.elements.fld_name) this.elements.fld_name.focus();
						return false;
					}

					if (!data.code.trim()) {
						alert(this.messages.emptyCode);
						if (this.elements.fld_code) this.elements.fld_code.focus();
						return false;
					}

					if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(data.code)) {
						alert(this.messages.wrongCode);
						if (this.elements.fld_code) this.elements.fld_code.focus();
						return false;
					}

					return true;
				},

				/**
				 * Create new field in document
				 * @param {Object} data - Field data
				 */
				createField: function(data) {
					if (typeof this.objFields.AddField === 'function') {
						this.objFields.AddField(
							data.code,
							data.name,
							data.type,
							data.multiple,
							data.options
						);
					}

					// Update existing selectors
					this.updateFieldSelectors(data.name, data.code);

					// Add hidden inputs for submission
					this.addFieldHiddenInputs(data);
				},

				/**
				 * Update all field selectors with new field
				 * @param {string} name - Field name
				 * @param {string} code - Field code
				 */
				updateFieldSelectors: function(name, code) {
					for (var i = 0; i <= this.state.counter; i++) {
						var select = document.getElementById(this.formId + '_document_field_' + i);
						if (select) {
							var option = BX.create('OPTION', {
								attrs: { value: code },
								text: name
							});
							select.appendChild(option);
						}
					}
				},

				/**
				 * Add hidden inputs for new field
				 * @param {Object} data - Field data
				 */
				addFieldHiddenInputs: function(data) {
					this.state.newfieldCounter++;
					var container = this.elements.container;
					if (!container) return;

					var index = this.state.newfieldCounter;
					var hiddens = [
						{ name: 'new_field_name[' + index + ']', value: data.name },
						{ name: 'new_field_code[' + index + ']', value: data.code },
						{ name: 'new_field_type[' + index + ']', value: data.type },
						{ name: 'new_field_mult[' + index + ']', value: data.multiple },
						{ name: 'new_field_req[' + index + ']', value: data.required }
					];

					hiddens.forEach(function(input) {
						container.appendChild(BX.create('INPUT', {
							attrs: {
								type: 'hidden',
								name: input.name,
								value: input.value
							}
						}));
					});

					// Add options if present
					if (data.options) {
						var optionsHtml = this.objectToHiddenInputs(data.options, 'new_field_options[' + index + ']');
						container.innerHTML += optionsHtml;
					}
				},

				/**
				 * Convert object to hidden inputs HTML
				 * @param {*} obj - Object to convert
				 * @param {string} name - Input name prefix
				 * @returns {string}
				 */
				objectToHiddenInputs: function(obj, name) {
					if (typeof obj !== 'object' || obj === null) {
						return '<input type="hidden" name="' + BX.util.htmlspecialchars(name) +
							'" value="' + BX.util.htmlspecialchars(String(obj)) + '">';
					}

					var html = '';
					for (var key in obj) {
						if (obj.hasOwnProperty(key)) {
							html += this.objectToHiddenInputs(
								obj[key],
								name + '[' + encodeURIComponent(key) + ']'
							);
						}
					}
					return html;
				},

				/**
				 * Clear field creation form
				 */
				clearFieldForm: function() {
					var elements = [
						{ el: this.elements.fld_name, type: 'value', value: '' },
						{ el: this.elements.fld_code, type: 'value', value: '' },
						{ el: this.elements.fld_type, type: 'selectedIndex', value: -1 },
						{ el: this.elements.fld_multiple, type: 'checked', value: false },
						{ el: this.elements.fld_required, type: 'checked', value: false },
						{ el: this.elements.fld_options, type: 'value', value: '' }
					];

					elements.forEach(function(item) {
						if (item.el) {
							item.el[item.type] = item.value;
						}
					});
				},

				/**
				 * Initialize form display state
				 */
				initializeFormState: function() {
					if (this.elements.edit_form) {
						this.elements.edit_form.style.display = 'none';
					}
					if (this.elements.list_form) {
						this.setTableRowDisplayValue(this.elements.list_form);
					}
				},

				/**
				 * Cleanup - remove event handlers
				 */
				destroy: function() {
					this.eventHandlers.forEach(function(item) {
						if (item.element && item.handler) {
							BX.unbind(item.element, item.event, item.handler);
						}
					});
					this.eventHandlers = [];

					// Remove global callback
					var callbackName = this.formId + '_switchSubTypeControl';
					if (window[callbackName]) {
						delete window[callbackName];
					}
				}
			};

			// Initialize dialog instance
			var formId = '<?= CUtil::JSEscape($uniqueId) ?>';
			var dialogInstance = new BX.Bizproc.Activity.SetFieldPropertiesDialog({
				formId: formId,
				formName: '<?= CUtil::JSEscape($formName) ?>',
				objFields: window.objFields,
				popupWindow: <?= isset($popupWindow) ? $popupWindow->jsPopup : 'null' ?>,
				messages: {
					emptyName: '<?= GetMessageJS("BPSFA_PD_EMPTY_NAME") ?>',
					emptyCode: '<?= GetMessageJS("BPSFA_PD_EMPTY_CODE") ?>',
					wrongCode: '<?= GetMessageJS("BPSFA_PD_WRONG_CODE") ?>',
					deleteText: '<?= GetMessageJS("BPSFA_PD_DELETE") ?>'
				}
			});

			// Store instance globally for debugging and external access
			if (!window.BX.Bizproc.Activity.instances) {
				window.BX.Bizproc.Activity.instances = {};
			}
			window.BX.Bizproc.Activity.instances[formId] = dialogInstance;

			// Initialize conditions when DOM is ready
			BX.ready(function() {
				BX.showWait();
				<?php
				foreach ($arCurrentValues as $fieldKey => $documentFieldValue)
				{
				if (!array_key_exists($fieldKey, $arDocumentFields))
					continue;
				?>
				dialogInstance.addCondition('<?= CUtil::JSEscape($fieldKey) ?>', <?= CUtil::PhpToJSObject($documentFieldValue) ?>);
				<?php
				}

				if (count($arCurrentValues) <= 0)
				{
				?>dialogInstance.addCondition('', '');<?php
				}
				?>
				BX.closeWait();
			});

			// Backward compatibility: expose old global functions as facade
			// This ensures existing integrations continue to work
			(function setupBackwardCompatibility() {
				var formPrefix = formId + '_';

				// Legacy global functions that delegate to instance
				window[formPrefix + 'BWFVCChangeFieldType'] = function(ind, field, value) {
					dialogInstance.loadFieldInputControl(ind, field, value);
				};

				window[formPrefix + 'BWFVCAddCondition'] = function(field, val) {
					dialogInstance.addCondition(field, val);
				};

				window[formPrefix + 'BWFVCDeleteCondition'] = function(ind) {
					dialogInstance.deleteCondition(ind);
				};

				window[formPrefix + 'BWFVCCreateField'] = function(show) {
					dialogInstance.toggleCreateFieldForm(show);
				};

				window[formPrefix + 'BWFVCCreateFieldSave'] = function() {
					dialogInstance.saveNewField();
				};

				window[formPrefix + 'BWFVCCreateFieldSwitchType'] = function(newType) {
					dialogInstance.handleFieldTypeChange(newType);
				};
			})();

		})();
	</script>

	<tr id="<?= htmlspecialcharsbx($uniqueId) ?>_list_form" style="display:block">
		<td colspan="2">
			<table width="100%" border="0" cellpadding="2" cellspacing="2" id="<?= htmlspecialcharsbx($uniqueId) ?>_addrow_table">
			</table>
			<a href="#" id="<?= htmlspecialcharsbx($uniqueId) ?>_add_btn"><?= GetMessage("BPSFA_PD_ADD") ?></a>
			<a href="#" id="<?= htmlspecialcharsbx($uniqueId) ?>_create_btn"><?= GetMessage("BPSFA_PD_CREATE") ?></a>
			<span id="<?= htmlspecialcharsbx($uniqueId) ?>_container"></span>
		</td>
	</tr>

	<tr id="<?= htmlspecialcharsbx($uniqueId) ?>_edit_form" style="display:none">
		<td colspan="2">
			<table width="100%" class="adm-detail-content-table edit-table">
				<tr>
					<td align="right" width="40%" class="adm-detail-content-cell-l"></td>
					<td width="60%" class="adm-detail-content-cell-r"><b><?= GetMessage("BPSFA_PD_FIELD") ?></b></td>
				</tr>
				<tr>
					<td align="right" width="40%" class="adm-detail-content-cell-l"><span class="adm-required-field"><?= GetMessage("BPSFA_PD_F_NAME") ?>:</span></td>
					<td width="60%" class="adm-detail-content-cell-r">
						<input type="text" name="fld_name" id="<?= htmlspecialcharsbx($uniqueId) ?>_fld_name" value="" />
					</td>
				</tr>
				<tr>
					<td align="right" width="40%" class="adm-detail-content-cell-l"><span class="adm-required-field"><?= GetMessage("BPSFA_PD_F_CODE") ?>:</span></td>
					<td width="60%" class="adm-detail-content-cell-r">
						<input type="text" name="fld_code" id="<?= htmlspecialcharsbx($uniqueId) ?>_fld_code" value="" />
					</td>
				</tr>
				<tr>
					<td align="right" width="40%" class="adm-detail-content-cell-l"><span class="adm-required-field"><?= GetMessage("BPSFA_PD_F_TYPE") ?>:</span></td>
					<td width="60%" class="adm-detail-content-cell-r">
						<select name="fld_type" id="<?= htmlspecialcharsbx($uniqueId) ?>_fld_type">
							<?php
							foreach ($arFieldTypes as $key => $value)
							{
								?><option value="<?= htmlspecialcharsbx($key) ?>"><?= htmlspecialcharsbx($value["Name"]) ?></option><?php
							}
							?>
						</select>
						<span id="WFSAdditionalTypeInfo"></span>
					</td>
				</tr>
				<tr id="<?= htmlspecialcharsbx($uniqueId) ?>_tr_pbria_options" style="display:none">
					<td align="right" width="40%" id="<?= htmlspecialcharsbx($uniqueId) ?>_td_fri_options_promt" class="adm-detail-content-cell-l"><?= GetMessage("BPSFA_PD_F_MULT") ?>:</td>
					<td width="60%" id="<?= htmlspecialcharsbx($uniqueId) ?>_td_fri_options" class="adm-detail-content-cell-r"></td>
				</tr>
				<tr>
					<td align="right" width="40%" class="adm-detail-content-cell-l"><?= GetMessage("BPSFA_PD_F_MULT") ?>:</td>
					<td width="60%" class="adm-detail-content-cell-r">
						<input type="checkbox" name="fld_multiple" id="<?= htmlspecialcharsbx($uniqueId) ?>_fld_multiple" value="Y" />
					</td>
				</tr>
				<tr>
					<td align="right" width="40%" class="adm-detail-content-cell-l"><?= GetMessage("BPSFA_PD_F_REQ") ?>:</td>
					<td width="60%" class="adm-detail-content-cell-r">
						<input type="checkbox" name="fld_required" id="<?= htmlspecialcharsbx($uniqueId) ?>_fld_required" value="Y" />
					</td>
				</tr>
				<tr id="<?= htmlspecialcharsbx($uniqueId) ?>_tr_fld_options" style="display:none">
					<td align="right" width="40%" class="adm-detail-content-cell-l"><?= GetMessage("BPSFA_PD_F_LIST") ?>:</td>
					<td width="60%" class="adm-detail-content-cell-r">
						<textarea name="fld_options" id="<?= htmlspecialcharsbx($uniqueId) ?>_fld_options" rows="3" cols="30"></textarea>
					</td>
				</tr>
				<tr>
					<td align="right" width="40%" class="adm-detail-content-cell-l"></td>
					<td width="60%" class="adm-detail-content-cell-r">
						<input type="button" id="<?= htmlspecialcharsbx($uniqueId) ?>_save_btn" value="<?= GetMessage("BPSFA_PD_SAVE") ?>" title="<?= GetMessage("BPSFA_PD_SAVE_HINT") ?>" />
						<input type="button" id="<?= htmlspecialcharsbx($uniqueId) ?>_cancel_btn" value="<?= GetMessage("BPSFA_PD_CANCEL") ?>" title="<?= GetMessage("BPSFA_PD_CANCEL_HINT") ?>" />
					</td>
				</tr>
			</table>
		</td>
	</tr>

	<tr>
		<td align="right" width="40%" class="adm-detail-content-cell-l"><?=htmlspecialcharsbx($mergeMultipleFields['Name'])?>:</td>
		<td width="60%" class="adm-detail-content-cell-r">
			<?=CBPDocument::ShowParameterField("bool", $mergeMultipleFields['FieldName'], $dialog->getCurrentValue($mergeMultipleFields))?>
		</td>
	</tr>
<?php if ($canSetModifiedBy):?>
	<tr>
		<td align="right" width="40%" class="adm-detail-content-cell-l"><?= GetMessage("BPSFA_PD_MODIFIED_BY") ?>:</td>
		<td width="60%" class="adm-detail-content-cell-r"><?=CBPDocument::ShowParameterField("user", 'modified_by', $modifiedByString, ['rows'=>'1'])?>
		</td>
	</tr>
<?php endif;?>