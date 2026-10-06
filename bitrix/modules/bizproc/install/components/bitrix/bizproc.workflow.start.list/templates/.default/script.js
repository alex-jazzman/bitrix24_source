/* eslint-disable */
(function (main_core, ui_alerts, bizproc_a11y, bizproc_workflow_starter) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Bizproc.Component');
	class WorkflowStartList {
		#documents = new Map();
		#signedDocumentType;
		#signedDocumentId;
		#counters = new Map();
		#canEdit;
		#bizprocEditorUrl;
		#bizprocNewEditorUrl;
		static NEW_TEMPLATE_TYPE = 'nodes';
		#gridSubscription = null;
		constructor(options) {
			if (!main_core.Type.isPlainObject(options)) {
				return;
			}
			this.gridId = options.gridId;
			this.errorsContainerDiv = options.errorsContainerDiv;
			this.#canEdit = options.canEdit;
			this.#bizprocEditorUrl = options.bizprocEditorUrl;
			this.#bizprocNewEditorUrl = options.bizprocNewEditorUrl;
			if (main_core.Type.isArray(options.documentConfigs)) {
				options.documentConfigs.forEach(documentConfig => {
					if (!main_core.Type.isStringFilled(documentConfig?.documentTypeKey)) {
						return;
					}
					this.#documents.set(documentConfig.documentTypeKey, documentConfig);
				});
			}
			if (main_core.Type.isStringFilled(options.signedDocumentType)) {
				this.#signedDocumentType = options.signedDocumentType;
			}
			if (main_core.Type.isStringFilled(options.signedDocumentId)) {
				this.#signedDocumentId = options.signedDocumentId;
			}
		}
		init() {
			BX.UI.Hint.init(document);
			if (this.getGrid()) {
				BX.Bizproc.Component.WorkflowStartList.colorPinnedRows(this.getGrid());
			}
			this.#applyGridA11y();
			this.subscribeGridEvents();
		}
		subscribeGridEvents() {
			this.unsubscribeGridEvents();
			this.#gridSubscription = bizproc_a11y.subscribeGridUpdated(this.gridId, () => this.#onAfterGridUpdated());
		}
		unsubscribeGridEvents() {
			this.#gridSubscription?.destroy();
			this.#gridSubscription = null;
		}
		destroy() {
			this.unsubscribeGridEvents();
		}
		#applyGridA11y() {
			const container = this.getGrid()?.getContainer();
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			bizproc_a11y.enhanceGrid(container, {
				gridId: this.gridId,
				rowActionsLabel: main_core.Loc.getMessage('BIZPROC_CMP_TMP_WORKKFLOW_START_LIST_ROW_ACTIONS_LABEL'),
				columnLabels: {
					PIN: main_core.Loc.getMessage('BIZPROC_CMP_TMP_WORKKFLOW_START_LIST_PIN_COLUMN_LABEL')
				},
				toggles: [{
					selector: '.main-grid-cell-content-action-pin',
					label: main_core.Loc.getMessage('BIZPROC_CMP_TMP_WORKKFLOW_START_LIST_PIN_LABEL'),
					// the helper falls back to the same class value when the grid is not loaded yet
					activeClass: BX.Grid?.CellActionState?.ACTIVE
				}]
			});
		}
		editTemplate(event, templateId, templateType, documentTypeKeys = [], preferredDocumentTypeKey = null) {
			const documentConfig = this.resolveEditDocumentConfig(documentTypeKeys, preferredDocumentTypeKey);
			if (!documentConfig) {
				return;
			}
			if (!documentConfig.canEdit) {
				this.showNoPermissionsHint(event.target);
				return;
			}
			if (!main_core.Type.isStringFilled(documentConfig.editorUrl)) {
				this.showNoEditorHint(event.target);
				return;
			}
			this.openBizprocEditor(templateId, templateType, documentConfig.editorUrl);
		}
		showAngleHint(node, text) {
			if (this.hintTimeout) {
				clearTimeout(this.hintTimeout);
			}
			this.popupHint = BX.UI.Hint.createInstance({
				popupParameters: {
					width: 334,
					height: 104,
					closeByEsc: true,
					autoHide: true,
					angle: {
						offset: main_core.Dom.getPosition(node).width / 2
					},
					bindOptions: {
						position: 'top'
					}
				}
			});
			this.popupHint.close = function () {
				this.hide();
			};
			this.popupHint.show(node, text);
			this.hintTimeout = setTimeout(this.hideHint.bind(this), 5000);
		}
		hideHint() {
			if (this.hintTimeout) {
				clearTimeout(this.hintTimeout);
				this.hintTimeout = null;
			}
			if (this.popupHint) {
				this.popupHint.close();
			}
			this.popupHint = null;
		}
		showNoPermissionsHint(node) {
			this.showAngleHint(node, main_core.Loc.getMessage('BIZPROC_CMP_WORKKFLOW_START_LIST_START_RIGHTS_ERROR'));
		}
		showNoEditorHint(node) {
			this.showAngleHint(node, main_core.Loc.getMessage('BIZPROC_CMP_WORKKFLOW_START_LIST_START_MODULE_ERROR'));
		}
		static changePin(templateId, gridId, event) {
			const eventData = event.getData();
			const button = eventData.button;
			if (main_core.Dom.hasClass(button, BX.Grid.CellActionState.ACTIVE)) {
				BX.Bizproc.Component.WorkflowStartList.action('unpin', templateId, gridId);
				main_core.Dom.removeClass(button, BX.Grid.CellActionState.ACTIVE);
				main_core.Dom.attr(button, 'aria-pressed', 'false');
				bizproc_a11y.announce(main_core.Loc.getMessage('BIZPROC_CMP_TMP_WORKKFLOW_START_LIST_UNPINNED'));
			} else {
				BX.Bizproc.Component.WorkflowStartList.action('pin', templateId, gridId);
				main_core.Dom.addClass(button, BX.Grid.CellActionState.ACTIVE);
				main_core.Dom.attr(button, 'aria-pressed', 'true');
				bizproc_a11y.announce(main_core.Loc.getMessage('BIZPROC_CMP_TMP_WORKKFLOW_START_LIST_PINNED'));
			}
			const grid = BX.Main.gridManager.getInstanceById(gridId);
			if (grid) {
				BX.Bizproc.Component.WorkflowStartList.colorPinnedRows(grid);
			}
		}
		static action(action, templateId, gridId) {
			const component = 'bitrix:bizproc.workflow.start.list';
			BX.ajax.runComponentAction(component, action, {
				mode: 'class',
				data: {
					templateId
				}
			}).then(response => {
				const instance = BX.Bizproc.Component.WorkflowStartList.Instance;
				if (instance) {
					instance.reloadGrid();
					return;
				}
				const grid = BX.Main.gridManager.getInstanceById(gridId);
				if (grid) {
					grid.reload();
				}
			});
		}
		showErrors(errors) {
			this.errorsContainerDiv.style.margin = '10px';
			errors.forEach(error => {
				const alert = new ui_alerts.Alert({
					text: error.message,
					color: ui_alerts.AlertColor.DANGER,
					closeBtn: true,
					animated: true
				});
				alert.renderTo(this.errorsContainerDiv);
			});
		}
		reloadGrid() {
			const grid = this.getGrid();
			if (!grid) {
				return;
			}
			const data = this.getGridReloadData();
			if (Object.keys(data).length > 0) {
				grid.reloadTable('POST', data);
				return;
			}
			grid.reload();
		}
		getGrid() {
			if (this.gridId) {
				return BX.Main.gridManager && BX.Main.gridManager.getInstanceById(this.gridId);
			}
			return null;
		}
		getGridReloadData() {
			const signedDocuments = this.resolveDocumentConfigs().filter(documentConfig => {
				return main_core.Type.isStringFilled(documentConfig.signedDocumentType) && main_core.Type.isStringFilled(documentConfig.signedDocumentId);
			}).map(documentConfig => ({
				signedDocumentType: documentConfig.signedDocumentType,
				signedDocumentId: documentConfig.signedDocumentId
			}));
			if (main_core.Type.isArrayFilled(signedDocuments)) {
				return {
					signedDocuments
				};
			}
			if (this.#signedDocumentType && this.#signedDocumentId) {
				return {
					signedDocumentType: this.#signedDocumentType,
					signedDocumentId: this.#signedDocumentId
				};
			}
			return {};
		}
		startWorkflow(event, templateId, triggerType, documentTypeKeys = [], preferredDocumentTypeKey = null) {
			event.preventDefault();
			const id = main_core.Text.toNumber(templateId);
			if (id <= 0) {
				return;
			}
			const documentConfig = this.resolveSingleDocumentConfig(documentTypeKeys, preferredDocumentTypeKey);
			if (!documentConfig) {
				return;
			}
			const afterSuccessStart = () => {
				const slider = BX.SidePanel.Instance.getSliderByWindow(window);
				if (slider) {
					slider.close();
					return;
				}
				if (!this.#counters.has(templateId)) {
					this.#counters.set(templateId, 0);
				}
				this.#counters.set(templateId, this.#counters.get(templateId) + 1);
				this.reloadGrid();
			};
			bizproc_workflow_starter.Starter.singleStart({
				signedDocumentId: documentConfig.signedDocumentId,
				signedDocumentType: documentConfig.signedDocumentType,
				templateId: id,
				triggerType
			}, afterSuccessStart);
		}
		#onAfterGridUpdated() {
			if (this.getGrid()) {
				BX.UI.Hint.init(this.getGrid().getContainer());
				BX.Bizproc.Component.WorkflowStartList.colorPinnedRows(this.getGrid());
			}
			this.#applyGridA11y();
			bizproc_a11y.announce(main_core.Loc.getMessage('BIZPROC_CMP_TMP_WORKKFLOW_START_LIST_GRID_UPDATED'));
			this.#counters.forEach((value, key) => {
				const counter = document.querySelector(`[data-role="template-${key}-counter"]`);
				if (main_core.Type.isElementNode(counter)) {
					main_core.Dom.clean(counter);
					main_core.Dom.append(this.#renderStartedByMeNow(key), counter);
				}
			});
		}
		static colorPinnedRows(grid) {
			grid.getRows().getRows().forEach(row => {
				const node = row.getNode();
				if (main_core.Type.isElementNode(node.querySelector('.main-grid-cell-content-action-pin.main-grid-cell-content-action-active'))) {
					main_core.Dom.addClass(node, 'bizproc-workflow-start-list-item-pinned');
				} else {
					main_core.Dom.removeClass(node, 'bizproc-workflow-start-list-item-pinned');
				}
			});
		}
		#renderStartedByMeNow(templateId) {
			let message = main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_TMP_WORKKFLOW_START_LIST_START_COUNTER', {
				'#COUNTER#': this.#counters.get(templateId)
			}));
			message = message.replace('[bold]', '<span class="bizproc-workflow-start-list-column-start-counter">');
			message = message.replace('[/bold]', '</span>');
			return main_core.Tag.render`<div class="ui-typography-text-xs">${message}</div>`;
		}
		resolveDocumentConfigs(documentTypeKeys = []) {
			const documentConfigs = [];
			if (main_core.Type.isArrayFilled(documentTypeKeys)) {
				documentTypeKeys.forEach(documentTypeKey => {
					const documentConfig = this.#documents.get(documentTypeKey);
					if (documentConfig) {
						documentConfigs.push(documentConfig);
					}
				});
				return documentConfigs;
			}
			if (this.#documents.size > 0) {
				return Array.from(this.#documents.values());
			}
			if (this.#signedDocumentType && this.#signedDocumentId) {
				documentConfigs.push({
					documentTypeKey: '',
					editorUrl: this.#bizprocEditorUrl,
					canEdit: this.#canEdit,
					signedDocumentType: this.#signedDocumentType,
					signedDocumentId: this.#signedDocumentId
				});
			}
			return documentConfigs;
		}
		resolveSingleDocumentConfig(documentTypeKeys = [], preferredDocumentTypeKey = null) {
			if (main_core.Type.isStringFilled(preferredDocumentTypeKey)) {
				const preferredDocumentConfig = this.#documents.get(preferredDocumentTypeKey);
				if (preferredDocumentConfig) {
					return preferredDocumentConfig;
				}
			}
			const documentConfigs = this.resolveDocumentConfigs(documentTypeKeys);
			return documentConfigs.length === 1 ? documentConfigs[0] : null;
		}
		resolveEditDocumentConfig(documentTypeKeys = [], preferredDocumentTypeKey = null) {
			if (main_core.Type.isStringFilled(preferredDocumentTypeKey)) {
				const preferredDocumentConfig = this.#documents.get(preferredDocumentTypeKey);
				if (preferredDocumentConfig) {
					return preferredDocumentConfig;
				}
			}
			const documentConfigs = this.resolveDocumentConfigs(documentTypeKeys);
			if (documentConfigs.length === 0) {
				return null;
			}
			if (documentConfigs.length === 1) {
				return documentConfigs[0];
			}
			const commonEditorUrl = this.getCommonEditorUrl(documentConfigs);
			if (!main_core.Type.isStringFilled(commonEditorUrl)) {
				return null;
			}
			return {
				...documentConfigs[0],
				editorUrl: commonEditorUrl,
				canEdit: documentConfigs.some(documentConfig => documentConfig.canEdit === true)
			};
		}
		getCommonEditorUrl(documentConfigs) {
			const editorUrls = documentConfigs.map(documentConfig => documentConfig.editorUrl).filter(editorUrl => main_core.Type.isStringFilled(editorUrl));
			if (editorUrls.length !== documentConfigs.length) {
				return '';
			}
			return new Set(editorUrls).size === 1 ? editorUrls[0] : '';
		}
		openBizprocEditor(templateId, templateType, editorUrl) {
			const resolvedEditorUrl = main_core.Type.isStringFilled(editorUrl) ? editorUrl : this.#bizprocEditorUrl;
			if (templateType === WorkflowStartList.NEW_TEMPLATE_TYPE) {
				top.window.location.href = this.#bizprocNewEditorUrl.replace('#ID#', templateId);
			} else {
				top.window.location.href = resolvedEditorUrl.replace('#ID#', templateId);
			}
		}
	}
	namespace.WorkflowStartList = WorkflowStartList;

})(BX, BX.UI, BX.Bizproc.A11y, BX.Bizproc.Workflow);
//# sourceMappingURL=script.js.map
