/* eslint-disable */
(function (main_core, ui_entitySelector, bizproc_automation) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Bizproc.Activity');
	class StartWorkflowActivity {
		#templateNode;
		#templateInput;
		#templateId = null;
		#parametersNode;
		#documentType;
		#formName;
		#propertiesDialog;
		#isRobot = false;
		constructor(options) {
			if (!main_core.Type.isElementNode(options.templateNode)) {
				throw 'templateNode must be HTML Element';
			}
			this.#templateNode = options.templateNode;
			if (!main_core.Type.isElementNode(options.templateInput)) {
				throw 'templateInput must be HTML Input Element';
			}
			this.#templateInput = options.templateInput;
			if (!main_core.Type.isElementNode(options.parametersNode)) {
				throw 'parametersNode must be HTML Element';
			}
			this.#parametersNode = options.parametersNode;
			const templateId = main_core.Text.toInteger(options.templateId);
			if (templateId > 0) {
				this.#templateId = templateId;
			}
			this.#documentType = main_core.Type.isArrayFilled(options.documentType) ? options.documentType : [];
			this.#formName = main_core.Type.isStringFilled(options.formName) ? options.formName : '';
			this.#propertiesDialog = main_core.Type.isPlainObject(options.propertiesDialog) ? options.propertiesDialog : {};
			this.#isRobot = main_core.Type.isBoolean(options.isRobot) ? options.isRobot : false;
		}
		init() {
			this.#initTemplateSelector();
		}
		#initTemplateSelector() {
			const preselectedItems = [];
			if (this.#templateId) {
				preselectedItems.push(['bizproc-start-workflow-template', this.#templateId]);
			}
			const selector = new ui_entitySelector.TagSelector({
				dialogOptions: {
					entities: [{
						id: 'bizproc-start-workflow-template'
					}],
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					hideOnSelect: true,
					hideOnDeselect: false,
					clearSearchOnSelect: true,
					showAvatars: false,
					compactView: true,
					height: 300,
					preselectedItems: preselectedItems,
					events: {
						'Item:onSelect': event => {
							const {
								item: selectedItem
							} = event.getData();
							this.#getTemplateParameters(selectedItem.getId());
							this.#templateInput.value = selectedItem.getId();
						},
						'Item:onDeselect': event => {
							this.#getTemplateParameters(-1);
							this.#templateInput.value = '';
						}
					}
				},
				multiple: false,
				tagMaxWidth: 500,
				textBoxWidth: 100
			});
			selector.renderTo(this.#templateNode);
		}
		#getTemplateParameters(templateId) {
			this.#parametersNode.innerHTML = '';
			templateId = main_core.Text.toInteger(templateId);
			if (templateId <= 0) {
				return;
			}
			const requestData = {
				site_id: main_core.Loc.getMessage('SITE_ID'),
				sessid: BX.bitrix_sessid(),
				document_type: this.#documentType,
				activity: 'StartWorkflowActivity',
				template_id: templateId,
				form_name: this.#formName,
				content_type: 'html'
			};
			if (this.#isRobot === true) {
				requestData['properties_dialog'] = this.#propertiesDialog;
				requestData['isRobot'] = 'y';
			}
			main_core.ajax.post('/bitrix/tools/bizproc_activity_ajax.php', requestData, response => {
				if (response) {
					this.#parametersNode.innerHTML = response;
				}
				if (this.#isRobot && main_core.Reflection.getClass('BX.Bizproc.Automation.Designer')) {
					const dlg = bizproc_automation.Designer.getInstance().getRobotSettingsDialog();
					if (dlg && dlg.template) {
						dlg.template.initRobotSettingsControls(dlg.robot, this.#parametersNode);
					}
				}
			});
		}
	}
	namespace.StartWorkflowActivity = StartWorkflowActivity;

})(BX, BX.UI.EntitySelector, BX.Bizproc.Automation);
//# sourceMappingURL=script.js.map
