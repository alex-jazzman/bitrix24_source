/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core_events, main_core, crm_entityEditor_field_requisite_autocomplete) {
	'use strict';

	class EntityEditorRequisiteAutocomplete extends BX.UI.EntityEditorField {
		constructor() {
			super();
			this._autocomplete = null;
			this._autocompleteData = null;
		}
		doInitialize() {
			let params = this._schemeElement.getData();
			let enabled = BX.prop.getBoolean(params, "enabled", false);
			this._autocomplete = crm_entityEditor_field_requisite_autocomplete.RequisiteAutocompleteField.create(this.getName(), {
				placeholderText: BX.prop.getString(params, "placeholder", ""),
				enabled: enabled,
				featureRestrictionCallback: BX.prop.getString(params, "featureRestrictionCallback", ''),
				searchAction: 'crm.requisite.entity.search',
				feedbackFormParams: BX.prop.getObject(params, "feedback_form", {}),
				showFeedbackLink: !enabled,
				clientResolverPlacementParams: BX.prop.getObject(params, "clientResolverPlacementParams", null)
			});
			this._autocomplete.subscribe('onSelectValue', this.onSelectAutocompleteValue.bind(this));
			this._autocomplete.subscribe('onClear', this.onClearAutocompleteValue.bind(this));
			this._autocomplete.subscribe('onInstallDefaultApp', this.onInstallDefaultApp.bind(this));
			main_core_events.EventEmitter.subscribe("BX.Crm.RequisiteAutocomplete:onAfterInstallDefaultApp", this.onInstallDefaultAppGlobal.bind(this));
		}
		createTitleMarker() {
			if (this._mode === BX.UI.EntityEditorMode.view) {
				return null;
			}
			let restrictionCallback = BX.prop.getString(this._schemeElement.getData(), "featureRestrictionCallback", '');
			if (restrictionCallback === '') {
				return super.createTitleMarker();
			}
			let lockIcon = main_core.Tag.render` <span class="tariff-lock"></span>`;
			lockIcon.setAttribute('onclick', restrictionCallback);
			return lockIcon;
		}
		layout(options) {
			if (this._hasLayout) {
				return;
			}
			if (this._mode === BX.UI.EntityEditorMode.view) {
				if (!this._wrapper) {
					this._wrapper = BX.create("div");
				}
			} else {
				this.ensureWrapperCreated({
					classNames: ["ui-entity-editor-field-text"]
				});
				this.adjustWrapper();
			}
			if (!this.isNeedToDisplay()) {
				this.registerLayout(options);
				this._hasLayout = true;
				return;
			}
			if (this.isDragEnabled()) {
				main_core.Dom.append(this.createDragButton(), this._wrapper);
			}
			main_core.Dom.append(this.createTitleNode(this.getTitle()), this._wrapper);
			if (this._mode === BX.UI.EntityEditorMode.edit) {
				let autocompleteContainer = main_core.Tag.render`<div class="ui-entity-editor-content-block"></div>`;
				this._autocomplete.layout(autocompleteContainer);
				this.updateAutocompleteState();
				main_core.Dom.append(autocompleteContainer, this._wrapper);
			}
			if (this.isContextMenuEnabled()) {
				this._wrapper.appendChild(this.createContextMenuButton());
			}
			if (this.isDragEnabled()) {
				this.initializeDragDropAbilities();
			}
			this.registerLayout(options);
			this._hasLayout = true;
		}
		isNeedToDisplay() {
			return super.isNeedToDisplay() && this._mode === BX.UI.EntityEditorMode.edit;
		}
		updateAutocompleteState() {
			let autocompleteState = null;
			try {
				autocompleteState = JSON.parse(this.getValue());
			} catch (e) {}
			this._autocomplete.setState(autocompleteState);
			this._autocomplete.setContext(this.getAutocompleteContext());
		}
		setUserFieldValue(fieldName, fieldValue) {
			if (this._editor) {
				const allowedFieldTypes = ["string", "double", "boolean", "datetime"];
				const control = this._editor.getControlByIdRecursive(fieldName);
				const fieldType = control.getFieldType();
				if (control instanceof BX.UI.EntityEditorUserField && allowedFieldTypes.indexOf(fieldType) >= 0) {
					let fieldNode;
					let valueControl;
					switch (fieldType) {
						case "string":
							if (main_core.Type.isStringFilled(fieldValue)) {
								fieldNode = control.getFieldNode();
								if (main_core.Type.isDomNode(fieldNode)) {
									valueControl = fieldNode.querySelector(`input[type=\"text\"][name=\"${fieldName}\"]`);
									if (valueControl) {
										valueControl.value = fieldValue;
									}
								}
							}
							break;
						case "double":
							let numberValue;
							numberValue = "" + fieldValue;
							if (/^[\-+]?\d*[.,]?\d+?$/.test(numberValue)) {
								fieldNode = control.getFieldNode();
								if (main_core.Type.isDomNode(fieldNode)) {
									valueControl = fieldNode.querySelector(`input[type=\"text\"][name=\"${fieldName}\"]`);
									if (valueControl) {
										valueControl.value = numberValue;
									}
								}
							}
							break;
						case "boolean":
							fieldNode = control.getFieldNode();
							if (main_core.Type.isDomNode(fieldNode)) {
								valueControl = fieldNode.querySelector(`input[type=\"checkbox\"][name=\"${fieldName}\"]`);
								if (valueControl) {
									let booleanValue = !!(main_core.Type.isNumber(fieldValue) ? fieldValue : parseInt(fieldValue));
									valueControl.value = booleanValue ? 1 : 0;
									valueControl.checked = booleanValue;
								}
							}
							break;
						case "datetime":
							fieldNode = control.getFieldNode();
							if (main_core.Type.isDomNode(fieldNode) && main_core.Type.isStringFilled(fieldValue)) {
								let datetimeValue = fieldValue;
								valueControl = fieldNode.querySelector(`input[type=\"text\"][name=\"${fieldName}\"]`);
								if (valueControl) {
									valueControl.value = datetimeValue;
									BX.fireEvent(valueControl, 'change');
								}
							}
							break;
					}
				}
			}
		}
		onSelectAutocompleteValue(event) {
			this._autocompleteData = event.getData();
			if (main_core.Type.isPlainObject(this._autocompleteData["fields"])) {
				const fields = this._autocompleteData["fields"];
				for (let fieldName in fields) {
					if (main_core.Type.isString(fieldName) && fieldName.length > 3 && fieldName.substr(0, 3) === "UF_" && fields.hasOwnProperty(fieldName)) {
						this.setUserFieldValue(fieldName, fields[fieldName]);
						delete fields[fieldName];
					}
				}
			}
			this.markAsChanged();
		}
		onClearAutocompleteValue(event) {
			this._autocomplete.setCurrentItem(null);
			this._autocompleteData = null;
		}
		onInstallDefaultApp() {
			BX.onGlobalCustomEvent("BX.Crm.RequisiteAutocomplete:onAfterInstallDefaultApp");
		}
		onInstallDefaultAppGlobal() {
			const data = this._schemeElement.getData();
			if (main_core.Type.isPlainObject(data) && Object.hasOwn(data, "clientResolverPlacementParams") && main_core.Type.isPlainObject(data["clientResolverPlacementParams"])) {
				const countryId = BX.prop.getInteger(data["clientResolverPlacementParams"], "countryId", 0);
				if (countryId > 0) {
					BX.ajax.runAction('crm.requisite.schemedata.getRequisiteAutocompleteSchemeData', {
						data: {
							"countryId": countryId
						}
					}).then(data => {
						if (main_core.Type.isPlainObject(data) && Object.hasOwn(data, "data") && main_core.Type.isPlainObject(data["data"])) {
							this._schemeElement.setData(data["data"]);
							if (this._autocomplete) {
								if (main_core.Type.isStringFilled(data["data"]["placeholder"])) {
									this._autocomplete.setPlaceholderText(data["data"]["placeholder"]);
								}
								if (main_core.Type.isPlainObject(data["data"]["clientResolverPlacementParams"])) {
									this._autocomplete.setClientResolverPlacementParams(data["data"]["clientResolverPlacementParams"]);
								}
							}
						}
					});
				}
			}
		}
		getAutocompleteData() {
			return this._autocompleteData;
		}
		getAutocompleteContext() {
			const result = {
				'typeId': 'ITIN',
				'presetId': 0
			};
			const control = this._editor.getControlById('PRESET_ID');
			if (control) {
				result.presetId = control.getValue();
			} else {
				const editorContext = this._editor.getContext();
				if (Object.hasOwn(editorContext, "resolverProperty") && main_core.Type.isPlainObject(editorContext["resolverProperty"])) {
					const property = editorContext["resolverProperty"];
					const schemeData = this._schemeElement.getData();
					if (Object.hasOwn(property, "VALUE") && main_core.Type.isStringFilled(property["VALUE"]) && Object.hasOwn(schemeData, "presetId")) {
						const presetId = parseInt(schemeData["presetId"]);
						if (!isNaN(presetId)) {
							result.typeId = property["VALUE"];
							result.presetId = presetId;
						}
					}
				}
			}
			return result;
		}
		static create(id, settings) {
			let self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		static onInitializeEditorControlFactory(event) {
			let data = event.getData();
			if (data[0]) {
				data[0].methods["requisite_autocomplete"] = (type, controlId, settings) => {
					if (type === "requisite_autocomplete") {
						return EntityEditorRequisiteAutocomplete.create(controlId, settings);
					}
					return null;
				};
			}
			event.setData(data);
		}
	}
	main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorControlFactory:onInitialize', EntityEditorRequisiteAutocomplete.onInitializeEditorControlFactory);

	exports.EntityEditorRequisiteAutocomplete = EntityEditorRequisiteAutocomplete;

})(this.BX.Crm = this.BX.Crm || {}, BX.Event, BX, BX.Crm);
//# sourceMappingURL=requisite-autocomplete.bundle.js.map
