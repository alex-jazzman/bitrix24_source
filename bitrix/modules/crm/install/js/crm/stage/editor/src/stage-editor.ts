import { Type } from 'main.core';
import {
	stageDescriptionTooltipCoordinator,
	type StageDescriptionTooltipSuspension,
} from 'crm.stage.description-tooltip';
import { getEntityMessage, type EntityTextContext } from 'crm.stage.entity-text';

import { StageEditorPopup } from './component/stage-editor-popup';
import { StageEditorService } from './infrastructure/service/stage-editor-service';
import {
	StageEditorModel,
	type StageEditorChangedField,
	type StageEditorSavePayload,
	type StageEditorStageData,
} from './model/stage-editor-model';

export type StageEditorOptions = {
	stage: StageEditorStageData,
	mode: 'create' | 'edit',
	anchor: HTMLElement,
	canEdit?: boolean,
	canDelete: boolean,
	deleteBlockReasons: string[],
	onSave: (payload: StageEditorSavePayload) => Promise<StageEditorStageData>,
	onDelete: (stage: StageEditorStageData) => Promise<void>,
	onCancel: (snapshot: StageEditorStageData) => void,
	onChange?: (payload: StageEditorSavePayload, field: StageEditorChangedField) => void,
	entityTextContext?: EntityTextContext,
};

export class StageEditor
{
	#options: StageEditorOptions;
	#model: StageEditorModel;
	#service: StageEditorService;
	#popup: StageEditorPopup;
	#tooltipSuspension: StageDescriptionTooltipSuspension | null = null;

	static open(options: StageEditorOptions): StageEditor
	{
		const editor = new StageEditor(options);
		editor.open();

		return editor;
	}

	constructor(options: StageEditorOptions)
	{
		if (!Type.isElementNode(options.anchor))
		{
			throw new TypeError('StageEditor anchor must be an HTMLElement');
		}

		this.#options = {
			...options,
			canEdit: options.canEdit !== false,
			deleteBlockReasons: Type.isArray(options.deleteBlockReasons) ? options.deleteBlockReasons : [],
		};
		this.#model = new StageEditorModel(this.#options.stage);
		this.#service = new StageEditorService(this.#options.onSave, this.#options.onDelete);
		this.#popup = new StageEditorPopup({
			model: this.#model,
			mode: this.#options.mode,
			anchor: this.#options.anchor,
			canEdit: this.#options.canEdit === true,
			canDelete: this.#options.canDelete,
			deleteBlockReasons: this.#options.deleteBlockReasons,
			descriptionPlaceholder: getEntityMessage(
				'CRM_STAGE_EDITOR_DESCRIPTION_PLACEHOLDER',
				this.#options.entityTextContext,
			),
			onChange: this.#handleChange,
			onSave: this.#handleSave,
			onDelete: this.#handleDelete,
			onCancel: this.#handleCancel,
			onClose: this.#handleClose,
		});
	}

	open(): void
	{
		this.#tooltipSuspension ??= stageDescriptionTooltipCoordinator.suspend();

		try
		{
			this.#popup.open();
		}
		catch (error)
		{
			this.#releaseTooltipSuspension();

			throw error;
		}
	}

	close(): void
	{
		this.#popup.close();
	}

	#handleChange = (field: StageEditorChangedField): void => {
		this.#options.onChange?.(this.#model.getSavePayload(), field);
	};

	#handleSave = async (): Promise<StageEditorStageData> => {
		return this.#service.save(this.#model.getSavePayload());
	};

	#handleDelete = async (): Promise<void> => {
		await this.#service.delete(this.#model.getStage());
	};

	#handleCancel = (): void => {
		this.#options.onCancel(this.#model.getSnapshot());
	};

	#handleClose = (): void => {
		this.#releaseTooltipSuspension();
	};

	#releaseTooltipSuspension(): void
	{
		this.#tooltipSuspension?.release();
		this.#tooltipSuspension = null;
	}
}
