import { Loc } from 'main.core';

import {
	createAddStageRequest,
	createUpdateStageRequest,
	getStagePopupAnchorElement,
	toStageEditorData,
} from './stage-editor-adapter';
import { getStageOperationErrorMessage } from './stage-operation-error';

export default class StageEditorController
{
	constructor(options)
	{
		this.entityTypeId = options.entityTypeId;
		this.entityTypeName = options.entityTypeName;
		this.backend = options.backend;
		this.editorFactory = options.editorFactory;
		this.getDeleteBlockReasons = options.getDeleteBlockReasons || (() => []);
		this.createDraft = options.createDraft || (() => null);
		this.removeDraft = options.removeDraft || (() => {});
		this.onPreview = options.onPreview || (() => {});
		this.onRestore = options.onRestore || (() => {});
		this.onCreate = options.onCreate || (() => {});
		this.onUpdate = options.onUpdate || (() => {});
		this.onDelete = options.onDelete || (() => {});
		this.onOperationSuccess = options.onOperationSuccess || (() => {});
		this.onOperationFailure = options.onOperationFailure || (() => {});
		this.editor = null;
		this.column = null;
		this.previewFrameId = null;
		this.pendingPreview = null;
	}

	openEdit(column)
	{
		this.close();

		const snapshot = toStageEditorData(column);
		const canDelete = column.isRemovable() && !snapshot.system;
		this.column = column;
		column.stageEditorOpened = true;
		this.editor = this.editorFactory.open({
			stage: snapshot,
			entityTextContext: {
				entityTypeId: this.entityTypeId,
				entityTypeName: this.entityTypeName,
			},
			mode: 'edit',
			anchor: getStagePopupAnchorElement(column),
			canEdit: true,
			canDelete,
			deleteBlockReasons: canDelete ? [] : this.getDeleteBlockReasons(column),
			onChange: (payload, field) => {
				this.schedulePreview(column, payload, field);
			},
			onSave: (payload) => this.save(column, payload),
			onDelete: () => this.delete(column),
			onCancel: () => {
				this.onRestore(column, snapshot);
				this.clear(column);
			},
		});
	}

	openCreate(column)
	{
		this.close();

		const draftColumn = this.createDraft(column);
		if (!draftColumn)
		{
			return;
		}

		this.column = draftColumn;
		draftColumn.stageEditorOpened = true;
		this.editor = this.editorFactory.open({
			stage: toStageEditorData(draftColumn),
			entityTextContext: {
				entityTypeId: this.entityTypeId,
				entityTypeName: this.entityTypeName,
			},
			mode: 'create',
			anchor: getStagePopupAnchorElement(draftColumn),
			canEdit: true,
			canDelete: false,
			deleteBlockReasons: this.getDeleteBlockReasons(column),
			onChange: (payload, field) => {
				this.schedulePreview(draftColumn, payload, field);
			},
			onSave: (payload) => this.create(draftColumn, column, payload),
			onDelete: () => Promise.resolve(),
			onCancel: () => {
				this.removeDraft(draftColumn);
				this.clear(draftColumn);
			},
		});
	}

	schedulePreview(column, payload, field)
	{
		if (field === 'description')
		{
			return;
		}

		this.pendingPreview = { column, payload };
		if (this.previewFrameId !== null)
		{
			return;
		}

		this.previewFrameId = window.requestAnimationFrame(() => {
			const preview = this.pendingPreview;
			this.previewFrameId = null;
			this.pendingPreview = null;
			if (preview)
			{
				this.onPreview(preview.column, preview.payload);
			}
		});
	}

	create(draftColumn, sourceColumn, payload)
	{
		return this.backend.addStage(createAddStageRequest(sourceColumn, payload))
			.then(({ data }) => {
				const stage = data?.stage;
				if (!stage)
				{
					throw new Error(this.getFallbackErrorMessage());
				}

				this.onCreate(draftColumn, sourceColumn, stage);
				this.onOperationSuccess('create');
				this.clear(draftColumn);

				return toStageEditorData(stage);
			})
			.catch((error) => this.handleOperationFailure('create', error));
	}

	save(column, payload)
	{
		return this.backend.updateStage(createUpdateStageRequest(column, payload))
			.then(({ data }) => {
				if (!data?.success || !data.stage)
				{
					throw new Error(
						getStageOperationErrorMessage({ data }, this.getFallbackErrorMessage()),
					);
				}

				this.onUpdate(column, data.stage);
				this.onOperationSuccess('update');
				this.clear(column);

				return toStageEditorData(data.stage);
			})
			.catch((error) => this.handleOperationFailure('update', error));
	}

	delete(column)
	{
		const stage = toStageEditorData(column);

		return this.backend.removeStage({
			statusId: stage.statusId,
			stageId: stage.id,
			entityId: stage.entityId,
		}).then(() => {
			this.onDelete(column);
			this.onOperationSuccess('delete');
			this.clear(column);
		}).catch((error) => this.handleOperationFailure('delete', error));
	}

	handleOperationFailure(operation, error)
	{
		const normalizedError = this.normalizeError(error);
		this.onOperationFailure(operation, normalizedError);

		throw normalizedError;
	}

	normalizeError(error)
	{
		return new Error(
			getStageOperationErrorMessage(error, this.getFallbackErrorMessage()),
		);
	}

	getFallbackErrorMessage()
	{
		return (
			Loc.getMessage('CRM_ST_STAGE_OPERATION_ERROR')
			|| Loc.getMessage('CRM_ST_SAVE_ERROR2')
		);
	}

	close()
	{
		this.editor?.close();
	}

	isOpenedFor(column)
	{
		return this.column === column;
	}

	clear(column)
	{
		if (this.previewFrameId !== null)
		{
			window.cancelAnimationFrame(this.previewFrameId);
		}
		this.previewFrameId = null;
		this.pendingPreview = null;
		column.stageEditorOpened = false;
		if (this.column === column)
		{
			this.column = null;
			this.editor = null;
		}
	}
}
