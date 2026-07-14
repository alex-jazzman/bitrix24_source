/* eslint-disable */
(function (exports, main_core, bizproc_automation) {
	'use strict';

	class TasksGetInfoActivityRenderer {
		#form = null;
		#options = null;
		#documentType = null;
		#document = null;
		#filterFieldsContainer = null;
		#filteringFieldsPrefix = '';
		#filterFields = [];
		#conditionGroup = null;
		#conditionGroupSelector = null;
		getControlRenderers() {
			return {
				filterFields: field => {
					this.#options = main_core.Type.isPlainObject(field.property.Options) ? field.property.Options : {};
					this.#options.headCaption = field.property.Name || '';
					return main_core.Tag.render`
					<div data-role="bpa-tgi-filter-fields-container"></div>
				`;
				}
			};
		}
		afterFormRender(form) {
			this.#form = form;
			if (!main_core.Type.isPlainObject(this.#options)) {
				return;
			}
			this.#documentType = this.#options.documentType;
			this.#filteringFieldsPrefix = this.#options.filteringFieldsPrefix;
			this.#filterFields = main_core.Type.isArray(this.#options.filterFieldsMap) ? this.#options.filterFieldsMap : [];
			this.#document = new bizproc_automation.Document({
				rawDocumentType: this.#documentType,
				documentFields: this.#filterFields,
				title: 'document'
			});
			this.#initAutomationContext();
			this.#filterFieldsContainer = form.querySelector('[data-role="bpa-tgi-filter-fields-container"]');
			this.#conditionGroup = new bizproc_automation.ConditionGroup(this.#options.conditions);
			this.#renderFilterFields();
		}
		#initAutomationContext() {
			try {
				bizproc_automation.getGlobalContext().document.setFields(this.#filterFields);
			} catch {
				bizproc_automation.setGlobalContext(new bizproc_automation.Context({
					document: this.#document
				}));
			}
		}
		#renderFilterFields() {
			if (main_core.Type.isNil(this.#filterFieldsContainer) || main_core.Type.isNil(this.#conditionGroup)) {
				return;
			}
			this.#conditionGroupSelector = new bizproc_automation.ConditionGroupSelector(this.#conditionGroup, {
				fields: this.#filterFields,
				fieldPrefix: this.#filteringFieldsPrefix,
				caption: {
					head: this.#options.headCaption,
					collapsed: this.#options.collapsedCaption
				},
				isExpanded: true
			});
			main_core.Dom.clean(this.#filterFieldsContainer);
			main_core.Dom.append(this.#conditionGroupSelector.createNode(), this.#filterFieldsContainer);
		}
		destroy() {}
	}

	exports.TasksGetInfoActivityRenderer = TasksGetInfoActivityRenderer;

})(this.window = this.window || {}, BX, BX.Bizproc.Automation);
//# sourceMappingURL=renderer.js.map
