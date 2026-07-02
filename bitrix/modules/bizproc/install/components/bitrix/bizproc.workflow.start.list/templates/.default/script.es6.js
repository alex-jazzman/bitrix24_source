import { Reflection, Type, Event, Text, Dom, Tag, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Alert, AlertColor } from 'ui.alerts';
import { Starter } from 'bizproc.workflow.starter';

import 'sidepanel';

const namespace = Reflection.namespace('BX.Bizproc.Component');

type DocumentConfig = {
	documentTypeKey: string,
	editorUrl?: string,
	canEdit?: boolean,
	signedDocumentType?: string,
	signedDocumentId?: string,
};

class WorkflowStartList
{
	gridId;
	errorsContainerDiv;

	#documents: Map = new Map();
	#signedDocumentType: string;
	#signedDocumentId: string;
	#counters: Map = new Map();

	#canEdit: boolean;
	#bizprocEditorUrl: string;
	#bizprocNewEditorUrl: string;

	static NEW_TEMPLATE_TYPE = 'nodes';

	popupHint;
	hintTimeout;

	constructor(options)
	{
		if (!Type.isPlainObject(options))
		{
			return;
		}

		this.gridId = options.gridId;
		this.errorsContainerDiv = options.errorsContainerDiv;
		this.#canEdit = options.canEdit;
		this.#bizprocEditorUrl = options.bizprocEditorUrl;
		this.#bizprocNewEditorUrl = options.bizprocNewEditorUrl;

		if (Type.isArray(options.documentConfigs))
		{
			options.documentConfigs.forEach((documentConfig) => {
				if (!Type.isStringFilled(documentConfig?.documentTypeKey))
				{
					return;
				}

				this.#documents.set(documentConfig.documentTypeKey, documentConfig);
			});
		}

		if (Type.isStringFilled(options.signedDocumentType))
		{
			this.#signedDocumentType = options.signedDocumentType;
		}

		if (Type.isStringFilled(options.signedDocumentId))
		{
			this.#signedDocumentId = options.signedDocumentId;
		}
	}

	init()
	{
		BX.UI.Hint.init(document);

		if (this.getGrid())
		{
			BX.Bizproc.Component.WorkflowStartList.colorPinnedRows(this.getGrid());
		}

		EventEmitter.subscribe('Grid::updated', this.#onAfterGridUpdated.bind(this));
	}

	editTemplate(
		event,
		templateId,
		templateType,
		documentTypeKeys: string[] = [],
		preferredDocumentTypeKey: ?string = null,
	): void
	{
		const documentConfig = this.resolveEditDocumentConfig(documentTypeKeys, preferredDocumentTypeKey);
		if (!documentConfig)
		{
			return;
		}

		if (!documentConfig.canEdit)
		{
			this.showNoPermissionsHint(event.target);

			return;
		}

		if (!Type.isStringFilled(documentConfig.editorUrl))
		{
			this.showNoEditorHint(event.target);

			return;
		}

		this.openBizprocEditor(templateId, templateType, documentConfig.editorUrl);
	}

	showAngleHint(node, text)
	{
		if (this.hintTimeout)
		{
			clearTimeout(this.hintTimeout);
		}

		this.popupHint = BX.UI.Hint.createInstance({
			popupParameters: {
				width: 334,
				height: 104,
				closeByEsc: true,
				autoHide: true,
				angle: {
					offset: Dom.getPosition(node).width / 2,
				},
				bindOptions: {
					position: 'top',
				},
			},
		});

		this.popupHint.close = function()
		{
			this.hide();
		};
		this.popupHint.show(node, text);
		this.hintTimeout = setTimeout(this.hideHint.bind(this), 5000);
	}

	hideHint()
	{
		if (this.hintTimeout)
		{
			clearTimeout(this.hintTimeout);
			this.hintTimeout = null;
		}

		if (this.popupHint)
		{
			this.popupHint.close();
		}
		this.popupHint = null;
	}

	showNoPermissionsHint(node)
	{
		this.showAngleHint(node, Loc.getMessage('BIZPROC_CMP_WORKKFLOW_START_LIST_START_RIGHTS_ERROR'));
	}

	showNoEditorHint(node): void
	{
		this.showAngleHint(node, Loc.getMessage('BIZPROC_CMP_WORKKFLOW_START_LIST_START_MODULE_ERROR'));
	}

	static changePin(templateId, gridId, event) {
		const eventData = event.getData();
		const button = eventData.button;

		if (Dom.hasClass(button, BX.Grid.CellActionState.ACTIVE))
		{
			BX.Bizproc.Component.WorkflowStartList.action('unpin', templateId, gridId);
			Dom.removeClass(button, BX.Grid.CellActionState.ACTIVE);
		}
		else
		{
			BX.Bizproc.Component.WorkflowStartList.action('pin', templateId, gridId);
			Dom.addClass(button, BX.Grid.CellActionState.ACTIVE);
		}

		const grid = BX.Main.gridManager.getInstanceById(gridId);
		if (grid)
		{
			BX.Bizproc.Component.WorkflowStartList.colorPinnedRows(grid);
		}
	}

	static action(action, templateId, gridId): void
	{
		const component = 'bitrix:bizproc.workflow.start.list';

		BX.ajax.runComponentAction(component, action, {
			mode: 'class',
			data: {
				templateId,
			},
		}).then(
			(response) => {
				const instance = BX.Bizproc.Component.WorkflowStartList.Instance;
				if (instance)
				{
					instance.reloadGrid();

					return;
				}

				const grid = BX.Main.gridManager.getInstanceById(gridId);
				if (grid)
				{
					grid.reload();
				}
			},
		);
	}

	showErrors(errors: Array<{message: string}>)
	{
		this.errorsContainerDiv.style.margin = '10px';

		errors.forEach((error) => {
			const alert = new Alert({
				text: error.message,
				color: AlertColor.DANGER,
				closeBtn: true,
				animated: true,
			});

			alert.renderTo(this.errorsContainerDiv);
		});
	}

	reloadGrid()
	{
		const grid = this.getGrid();
		if (!grid)
		{
			return;
		}

		const data = this.getGridReloadData();
		if (Object.keys(data).length > 0)
		{
			grid.reloadTable('POST', data);

			return;
		}

		grid.reload();
	}

	getGrid(): ?BX.Main.grid
	{
		if (this.gridId)
		{
			return BX.Main.gridManager && BX.Main.gridManager.getInstanceById(this.gridId);
		}

		return null;
	}

	getGridReloadData(): Object
	{
		const signedDocuments = this.resolveDocumentConfigs()
			.filter((documentConfig) => {
				return Type.isStringFilled(documentConfig.signedDocumentType)
					&& Type.isStringFilled(documentConfig.signedDocumentId)
				;
			})
			.map((documentConfig) => ({
				signedDocumentType: documentConfig.signedDocumentType,
				signedDocumentId: documentConfig.signedDocumentId,
			}))
		;

		if (Type.isArrayFilled(signedDocuments))
		{
			return { signedDocuments };
		}

		if (this.#signedDocumentType && this.#signedDocumentId)
		{
			return {
				signedDocumentType: this.#signedDocumentType,
				signedDocumentId: this.#signedDocumentId,
			};
		}

		return {};
	}

	startWorkflow(
		event: PointerEvent,
		templateId: number,
		triggerType: ?string,
		documentTypeKeys: string[] = [],
		preferredDocumentTypeKey: ?string = null,
	)
	{
		event.preventDefault();

		const id = Text.toNumber(templateId);
		if (id <= 0)
		{
			return;
		}

		const documentConfig = this.resolveSingleDocumentConfig(documentTypeKeys, preferredDocumentTypeKey);
		if (!documentConfig)
		{
			return;
		}

		const afterSuccessStart = () => {
			const slider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider)
			{
				slider.close();

				return;
			}

			if (!this.#counters.has(templateId))
			{
				this.#counters.set(templateId, 0);
			}
			this.#counters.set(templateId, this.#counters.get(templateId) + 1);

			this.reloadGrid();
		};

		Starter.singleStart({
			signedDocumentId: documentConfig.signedDocumentId,
			signedDocumentType: documentConfig.signedDocumentType,
			templateId: id,
			triggerType,
		}, afterSuccessStart);
	}

	#onAfterGridUpdated()
	{
		if (this.getGrid())
		{
			BX.UI.Hint.init(this.getGrid().getContainer());
			BX.Bizproc.Component.WorkflowStartList.colorPinnedRows(this.getGrid());
		}

		this.#counters.forEach((value, key) => {
			const counter = document.querySelector(`[data-role="template-${key}-counter"]`);
			if (Type.isElementNode(counter))
			{
				Dom.clean(counter);
				Dom.append(this.#renderStartedByMeNow(key), counter);
			}
		});
	}

	static colorPinnedRows(grid) {
		grid.getRows().getRows().forEach((row) => {
			const node = row.getNode();
			if (Type.isElementNode(node.querySelector('.main-grid-cell-content-action-pin.main-grid-cell-content-action-active')))
			{
				Dom.addClass(node, 'bizproc-workflow-start-list-item-pinned');
			}
			else
			{
				Dom.removeClass(node, 'bizproc-workflow-start-list-item-pinned');
			}
		});
	}

	#renderStartedByMeNow(templateId: number): HTMLElement
	{
		let message = Text.encode(Loc.getMessage(
			'BIZPROC_CMP_TMP_WORKKFLOW_START_LIST_START_COUNTER',
			{
				'#COUNTER#': this.#counters.get(templateId),
			},
		));

		message = message.replace('[bold]', '<span class="bizproc-workflow-start-list-column-start-counter">');
		message = message.replace('[/bold]', '</span>');

		return Tag.render`<div class="ui-typography-text-xs">${message}</div>`;
	}

	resolveDocumentConfigs(documentTypeKeys: string[] = []): DocumentConfig[]
	{
		const documentConfigs = [];

		if (Type.isArrayFilled(documentTypeKeys))
		{
			documentTypeKeys.forEach((documentTypeKey) => {
				const documentConfig = this.#documents.get(documentTypeKey);
				if (documentConfig)
				{
					documentConfigs.push(documentConfig);
				}
			});

			return documentConfigs;
		}

		if (this.#documents.size > 0)
		{
			return Array.from(this.#documents.values());
		}

		if (this.#signedDocumentType && this.#signedDocumentId)
		{
			documentConfigs.push({
				documentTypeKey: '',
				editorUrl: this.#bizprocEditorUrl,
				canEdit: this.#canEdit,
				signedDocumentType: this.#signedDocumentType,
				signedDocumentId: this.#signedDocumentId,
			});
		}

		return documentConfigs;
	}

	resolveSingleDocumentConfig(documentTypeKeys: string[] = [], preferredDocumentTypeKey: ?string = null): ?DocumentConfig
	{
		if (Type.isStringFilled(preferredDocumentTypeKey))
		{
			const preferredDocumentConfig = this.#documents.get(preferredDocumentTypeKey);
			if (preferredDocumentConfig)
			{
				return preferredDocumentConfig;
			}
		}

		const documentConfigs = this.resolveDocumentConfigs(documentTypeKeys);

		return documentConfigs.length === 1 ? documentConfigs[0] : null;
	}

	resolveEditDocumentConfig(documentTypeKeys: string[] = [], preferredDocumentTypeKey: ?string = null): ?DocumentConfig
	{
		if (Type.isStringFilled(preferredDocumentTypeKey))
		{
			const preferredDocumentConfig = this.#documents.get(preferredDocumentTypeKey);
			if (preferredDocumentConfig)
			{
				return preferredDocumentConfig;
			}
		}

		const documentConfigs = this.resolveDocumentConfigs(documentTypeKeys);
		if (documentConfigs.length === 0)
		{
			return null;
		}

		if (documentConfigs.length === 1)
		{
			return documentConfigs[0];
		}

		const commonEditorUrl = this.getCommonEditorUrl(documentConfigs);
		if (!Type.isStringFilled(commonEditorUrl))
		{
			return null;
		}

		return {
			...documentConfigs[0],
			editorUrl: commonEditorUrl,
			canEdit: documentConfigs.some((documentConfig) => documentConfig.canEdit === true),
		};
	}

	getCommonEditorUrl(documentConfigs: DocumentConfig[]): string
	{
		const editorUrls = documentConfigs
			.map((documentConfig) => documentConfig.editorUrl)
			.filter((editorUrl) => Type.isStringFilled(editorUrl))
		;

		if (editorUrls.length !== documentConfigs.length)
		{
			return '';
		}

		return (new Set(editorUrls)).size === 1 ? editorUrls[0] : '';
	}

	openBizprocEditor(templateId, templateType, editorUrl)
	{
		const resolvedEditorUrl = Type.isStringFilled(editorUrl) ? editorUrl : this.#bizprocEditorUrl;
		if (templateType === WorkflowStartList.NEW_TEMPLATE_TYPE)
		{
			top.window.location.href = this.#bizprocNewEditorUrl.replace('#ID#', templateId);
		}
		else
		{
			top.window.location.href = resolvedEditorUrl.replace('#ID#', templateId);
		}
	}
}

namespace.WorkflowStartList = WorkflowStartList;
