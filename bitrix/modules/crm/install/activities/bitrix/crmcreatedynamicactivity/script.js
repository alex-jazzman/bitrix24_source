/* eslint-disable */
(function (main_core) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Activity');
	class CrmCreateDynamicActivity {
		fieldsMapContainer = undefined;
		entityTypeIdSelect = undefined;
		currentValues = {};
		renderedProperties = {};
		entitiesFieldsContainers = new Map();
		constructor(options) {
			this.fieldsMapContainer = document.getElementById('fields-map-container');
			if (main_core.Type.isPlainObject(options)) {
				this.isRobot = options.isRobot;
				const form = document.forms[options.formName];
				if (!main_core.Type.isNil(form)) {
					this.entityTypeIdSelect = form['dynamic_type_id'];
				}
				this.entitiesFieldsMap = options.entitiesFieldsMap;
				if (main_core.Type.isPlainObject(options.currentValues)) {
					this.currentValues = options.currentValues;
				}
			}
		}
		get currentEntityTypeId() {
			if (!this.entityTypeIdSelect) {
				return 0;
			}
			return parseInt(this.entityTypeIdSelect.value, 10);
		}
		getBindFieldId() {
			return `${this.currentEntityTypeId}_BindToCurrentElement`;
		}
		init() {
			if (this.entityTypeIdSelect) {
				this.render();
				main_core.Event.bind(this.entityTypeIdSelect, 'change', this.onEntityTypeIdChange.bind(this));
			}
		}
		onEntityTypeIdChange() {
			main_core.Dom.clean(this.fieldsMapContainer);
			this.currentValues = {};
			this.render();
		}
		render() {
			if (Object.hasOwn(this.entitiesFieldsMap, this.currentEntityTypeId)) {
				const {
					fieldsMap
				} = this.entitiesFieldsMap[this.currentEntityTypeId];
				this.loadRenderedFields();
				for (const fieldId of Object.keys(fieldsMap)) {
					main_core.Dom.append(this.renderProperty(fieldId), this.fieldsMapContainer);
				}
			}
		}
		loadRenderedFields() {
			const {
				documentType,
				fieldsMap
			} = this.entitiesFieldsMap[this.currentEntityTypeId];
			if (main_core.Type.isFunction(BX.Bizproc.FieldType.renderControlCollection)) {
				this.renderedProperties = BX.Bizproc.FieldType.renderControlCollection(documentType, Object.entries(fieldsMap).map(([fieldId, field]) => ({
					property: field,
					fieldName: field.FieldName,
					value: this.currentValues[fieldId],
					controlId: fieldId
				})), this.isRobot ? 'public' : 'designer');
			}
		}
		renderProperty(fieldId) {
			if (this.getBindFieldId() === fieldId) {
				return this.isRobot ? this.renderRobotBindField() : '';
			}
			return this.isRobot ? this.renderRobotProperty(fieldId) : this.renderDesignerProperty(fieldId);
		}
		renderRobotBindField() {
			const {
				fieldsMap
			} = this.entitiesFieldsMap[this.currentEntityTypeId];
			const bindField = fieldsMap[this.getBindFieldId()];
			const bindFieldValue = Object.hasOwn(this.currentValues, this.getBindFieldId()) && (this.currentValues[this.getBindFieldId()] === 'Y' || this.currentValues[this.getBindFieldId()] === true);
			return main_core.Tag.render`
			<div class="bizproc-automation-popup-settings">
				<div class="bizproc-automation-popup-checkbox-item">
					<input type="hidden" name="${main_core.Text.encode(bindField.FieldName)}" value="N">
					<label class="bizproc-automation-popup-chk-label">
						<input
							type="checkbox"
							name="${main_core.Text.encode(bindField.FieldName)}"
							value="Y"
							class="bizproc-automation-popup-chk"
							${bindFieldValue ? 'checked' : ''}
						>
						${main_core.Text.encode(bindField.Name)}
					</label>
				</div>
			</div>
		`;
		}
		renderRobotProperty(fieldId) {
			const {
				documentType,
				fieldsMap
			} = this.entitiesFieldsMap[this.currentEntityTypeId];
			const property = fieldsMap[fieldId];
			const fallback = () => BX.Bizproc.FieldType.renderControlPublic(documentType, property, property.FieldName, this.currentValues[fieldId]);
			return main_core.Tag.render`
			<div class="bizproc-automation-popup-settings">
				<span class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete">
					${main_core.Text.encode(property.Name)}:
				</span>
				${main_core.Type.isDomNode(this.renderedProperties[fieldId]) ? this.renderedProperties[fieldId] : fallback()}
			</div>
		`;
		}
		renderDesignerProperty(fieldId) {
			const {
				documentType,
				fieldsMap
			} = this.entitiesFieldsMap[this.currentEntityTypeId];
			const property = fieldsMap[fieldId];
			const fallback = () => BX.Bizproc.FieldType.renderControlDesigner(documentType, property, property.FieldName, this.currentValues[fieldId]);
			return main_core.Tag.render`
			<tr>
				<td class="adm-detail-content-cell-l" align="right" width="40%">${main_core.Text.encode(property.Name)}:</td>
				<td class="adm-detail-content-cell-r" width="60%">
					${main_core.Type.isDomNode(this.renderedProperties[fieldId]) ? this.renderedProperties[fieldId] : fallback()}
				</td>
			</tr>
		`;
		}
	}
	namespace.CrmCreateDynamicActivity = CrmCreateDynamicActivity;

})(BX);
//# sourceMappingURL=script.js.map
