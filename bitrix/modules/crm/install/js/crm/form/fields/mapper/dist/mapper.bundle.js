/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Form = this.BX.Crm.Form || {};
(function (exports, ui_sidepanelContent, main_core, main_core_events, landing_ui_collection_buttoncollection, landing_ui_collection_formcollection, landing_ui_panel_fieldspanel) {
	'use strict';

	class Mapper extends main_core_events.EventEmitter {
		#fields = {};
		#map = [];
		#from = {};
		#container;
		constructor(options) {
			super();
			this.#fields = options.fields;
			this.#from = options.from;
			this.setMap(options.map);
		}
		setMap(map) {
			this.#map = map;
			this.#map.forEach(item => this.#appendOutputData(item, item.outputCode));
			this.render();
			return this;
		}
		getMap() {
			return this.#map;
		}
		#getEntityNameByField(fieldName) {
			let entityNameParts = fieldName.split('_');
			let entityName = entityNameParts[0];
			if (entityName === 'DYNAMIC') {
				entityName = entityNameParts[0] + '_' + entityNameParts[1];
			}
			return entityName;
		}
		#getFieldByName(name) {
			const entityName = this.#getEntityNameByField(name);
			const entity = this.#fields[entityName];
			return entity.FIELDS.filter(field => field.name === name)[0] || null;
		}

		/*	#onClickAddAuto(item: MapItem)
			{
				item.outputCode = '';
				item.outputName = '';
				this.render();
			}*/

		#onClickChange(item) {
			const selectorOptions = {
				multiple: false,
				allowedTypes: [],
				allowedCategories: []
			};
			if (['email', 'phone'].includes(item.inputType)) {
				selectorOptions.allowedTypes = [{
					type: 'typed_string',
					entityFieldName: 'PHONE'
				}, {
					type: 'typed_string',
					entityFieldName: 'EMAIL'
				}];
				selectorOptions.allowedCategories = ['LEAD', 'CONTACT', 'COMPANY'];
			} else {
				selectorOptions.allowedTypes = ['string', 'text'];
			}
			selectorOptions.disabledFields = this.getMap().map(item => item.outputCode);
			landing_ui_panel_fieldspanel.FieldsPanel.getInstance().show(selectorOptions).then(selectedNames => {
				this.#appendOutputData(item, selectedNames[0]);
				this.render();
				this.emit('change');
			});
		}
		#appendOutputData(item, name) {
			if (!name) {
				return;
			}
			const entityName = this.#getEntityNameByField(name);
			const entity = this.#fields[entityName];
			const field = this.#getFieldByName(name);
			if (!field) {
				return;
			}
			item.outputCode = name;
			item.outputName = `${field.caption} - ${entity.CAPTION}`;
		}
		render() {
			if (!this.#container) {
				this.#container = main_core.Tag.render`<div></div>`;
			}
			this.#container.innerHTML = '';
			this.getMap().forEach(field => {
				const changeHandler = () => this.#onClickChange(field);
				const element = main_core.Tag.render`
					<div class="ui-form-row" style="background: #F5F7F8; border-radius: 12px;">
						<div class="ui-form" style="width: 100%; padding: 20px;">
							<div class="ui-form-label">
								<div class="ui-ctl-label-text">${main_core.Tag.safe`${field.inputName}`} - ${main_core.Tag.safe`${this.#from.caption}`}</div>
							</div>
							<div class="ui-form-content">
								<div class="crm-form-fields-mapper-row">
									<div
										class="crm-form-fields-mapper-row-label ${field.outputName ? '' : 'crm-form-fields-mapper-row-label-error'}"
										data-role="caption"
									>${main_core.Tag.safe`${field.outputName}` || main_core.Loc.getMessage('CRM_FORM_FIELDS_MAPPER_NOT_SELECTED')}</div>
									<div>
										<a class="ui-btn ui-btn-xs ui-btn-light-border ui-btn-round"
											onclick="${changeHandler}"
										>${main_core.Loc.getMessage('CRM_FORM_FIELDS_MAPPER_CHOOSE_FIELD')}</a>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			`;
				field.element = element;
				this.#container.appendChild(element);
			});
			return this.#container;
		}
	}

	exports.Mapper = Mapper;

})(this.BX.Crm.Form.Fields = this.BX.Crm.Form.Fields || {}, BX.UI.Sidepanel.Content, BX, BX.Event, BX.Landing.UI.Collection, BX.Landing.UI.Collection, BX.Landing.UI.Panel);
//# sourceMappingURL=mapper.bundle.js.map
