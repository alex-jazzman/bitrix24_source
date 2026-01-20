import { Reflection } from 'main.core';
import { sendData } from 'ui.analytics';
import { Dictionary } from 'crm.integration.analytics';
import type { AnalyticsOptions } from 'ui.analytics';

const NAMESPACE = Reflection.namespace('BX.CRM.Kanban.Analytics');

export default class StageLabels
{
	#createStageLabel: AnalyticsOptions;
	#renameStageLabel: AnalyticsOptions;
	#deleteStageLabel: AnalyticsOptions;
	#updateStageLabel: AnalyticsOptions;

	constructor(options: {
		createStageLabel: AnalyticsOptions,
		renameStageLabel: AnalyticsOptions,
		deleteStageLabel: AnalyticsOptions,
		updateStageLabel: AnalyticsOptions,
	})
	{
		this.#createStageLabel = options.createStageLabel;
		this.#renameStageLabel = options.renameStageLabel;
		this.#deleteStageLabel = options.deleteStageLabel;
		this.#updateStageLabel = options.updateStageLabel;
	}

	sendCreateSuccess(): void
	{
		this.#createStageLabel.status = Dictionary.STATUS_SUCCESS;
		sendData(this.#createStageLabel);
	}

	sendCreateFailure(): void
	{
		this.#createStageLabel.status = Dictionary.STATUS_ERROR;
		sendData(this.#createStageLabel);
	}

	sendRenameSuccess(): void
	{
		this.#renameStageLabel.status = Dictionary.STATUS_SUCCESS;
		sendData(this.#renameStageLabel);
	}

	sendRenameFailure(): void
	{
		this.#renameStageLabel.status = Dictionary.STATUS_ERROR;
		sendData(this.#renameStageLabel);
	}

	sendDeleteSuccess(): void
	{
		this.#deleteStageLabel.status = Dictionary.STATUS_SUCCESS;
		sendData(this.#deleteStageLabel);
	}

	sendDeleteFailure(): void
	{
		this.#deleteStageLabel.status = Dictionary.STATUS_ERROR;
		sendData(this.#deleteStageLabel);
	}

	sendUpdateSuccess(): void
	{
		this.#updateStageLabel.status = Dictionary.STATUS_SUCCESS;
		sendData(this.#updateStageLabel);
	}

	sendUpdateFailure(): void
	{
		this.#updateStageLabel.status = Dictionary.STATUS_ERROR;
		sendData(this.#updateStageLabel);
	}
}

NAMESPACE.StageLabels = StageLabels;
