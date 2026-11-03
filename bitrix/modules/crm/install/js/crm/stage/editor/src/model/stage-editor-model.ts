import { Type } from 'main.core';
import { getDefaultStageColor, normalizeStageColor } from 'crm.stage.color';

export type StageEditorStageData = {
	id?: string | number | null,
	statusId?: string | null,
	entityId?: string | null,
	name?: string | null,
	sort?: number | string | null,
	color?: string | null,
	semantics?: string | null,
	categoryId?: number | string | null,
	description?: string | null,
	type?: string | null,
	TYPE?: string | null,
	[key: string]: unknown,
};

export type StageEditorSavePayload = StageEditorStageData & {
	name: string,
	color: string,
	description: string,
};

export type StageEditorChangedField = 'name' | 'color' | 'description';

export class StageEditorModel
{
	#initialStage: StageEditorStageData;
	#stage: StageEditorStageData;

	constructor(stage: StageEditorStageData)
	{
		this.#initialStage = StageEditorModel.cloneStage(stage);
		this.#stage = StageEditorModel.cloneStage(stage);
		this.#stage.color = normalizeStageColor(this.#stage.color, getDefaultStageColor());
		this.#stage.description = this.getDescription();
	}

	getSnapshot(): StageEditorStageData
	{
		return StageEditorModel.cloneStage(this.#initialStage);
	}

	getStage(): StageEditorStageData
	{
		return StageEditorModel.cloneStage(this.#stage);
	}

	getSavePayload(): StageEditorSavePayload
	{
		return {
			...this.getStage(),
			name: this.getName(),
			color: this.getColor(),
			description: this.getDescription(),
		};
	}

	getName(): string
	{
		return Type.isString(this.#stage.name) ? this.#stage.name : '';
	}

	setName(name: string): void
	{
		this.#stage.name = Type.isString(name) ? name : '';
	}

	isNameValid(fallbackName = ''): boolean
	{
		return this.getName().trim() !== '' || Type.isStringFilled(fallbackName);
	}

	normalizeName(fallbackName: string): void
	{
		if (this.getName().trim() === '' && Type.isStringFilled(fallbackName))
		{
			this.setName(fallbackName);
		}
	}

	getColor(): string
	{
		return normalizeStageColor(this.#stage.color, getDefaultStageColor());
	}

	setColor(color: string): void
	{
		this.#stage.color = normalizeStageColor(color, this.getColor());
	}

	getDescription(): string
	{
		return Type.isString(this.#stage.description) ? this.#stage.description : '';
	}

	setDescription(description: string): void
	{
		this.#stage.description = Type.isString(description) ? description : '';
	}

	static cloneStage(stage: StageEditorStageData): StageEditorStageData
	{
		return Type.isPlainObject(stage) ? { ...stage } : {};
	}
}
