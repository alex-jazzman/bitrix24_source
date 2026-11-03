import { Type } from 'main.core';
import { type Button } from 'ui.buttons';
import { type EntityTextContext } from 'crm.stage.entity-text';

export type FinalTransitionStageData = {
	id?: string | number | null,
	statusId?: string | null,
	entityId?: string | null,
	name?: string | null,
	sort?: number | string | null,
	color?: string | null,
	semantics?: string | null,
	categoryId?: number | string | null,
	description?: string | null,
	stagesToMove?: string[] | null,
	allowMoveToAnyStage?: boolean | null,
	[key: string]: unknown,
};

export type FinalTransitionOutcome = 'success' | 'failure';

export type FinalTransitionContext = {
	outcome: FinalTransitionOutcome,
	previousStatusId: string,
	targetStage: FinalTransitionStageData,
	failureStage: FinalTransitionStageData | null,
	analytics: Record<string, unknown>,
};

export type FinalTransitionOptions = {
	currentStage: FinalTransitionStageData,
	successStage: FinalTransitionStageData,
	failureStages: FinalTransitionStageData[],
	entityTitle: string,
	entityTextContext?: EntityTextContext,
	onMoveToStage: (statusId: string, context: FinalTransitionContext) => Promise<FinalTransitionStageData>,
	onUndo: (previousStatusId: string, targetStatusId: string) => Promise<FinalTransitionStageData>,
	isMoveCancelled?: (error: unknown) => boolean,
	canMoveToStage?: (statusId: string) => boolean,
	onMovePermissionDenied?: () => void,
	onClose?: () => void,
	successButton?: Button,
	onSuccessButtonShow?: (complete: () => void) => void,
	onSuccessButtonHide?: () => void,
	analytics?: Record<string, unknown>,
};

export class FinalTransitionModel
{
	#currentStage: FinalTransitionStageData;
	#successStage: FinalTransitionStageData;
	#failureStages: FinalTransitionStageData[];
	#entityTitle: string;
	#entityTextContext: EntityTextContext;
	#onMoveToStage: (statusId: string, context: FinalTransitionContext) => Promise<FinalTransitionStageData>;
	#onUndo: (previousStatusId: string, targetStatusId: string) => Promise<FinalTransitionStageData>;
	#isMoveCancelled: (error: unknown) => boolean;
	#canMoveToStage: (statusId: string) => boolean;
	#onMovePermissionDenied: () => void;
	#analytics: Record<string, unknown>;
	#undoTargetStatusId = '';
	#isUndoing = false;

	constructor(options: FinalTransitionOptions)
	{
		this.#currentStage = FinalTransitionModel.cloneStage(options.currentStage);
		this.#successStage = FinalTransitionModel.cloneStage(options.successStage);
		this.#failureStages = Type.isArray(options.failureStages)
			? options.failureStages.map((stage) => FinalTransitionModel.cloneStage(stage))
			: []
		;
		this.#entityTitle = Type.isStringFilled(options.entityTitle) ? options.entityTitle : '';
		this.#entityTextContext = Type.isPlainObject(options.entityTextContext) ? { ...options.entityTextContext } : {};
		this.#onMoveToStage = options.onMoveToStage;
		this.#onUndo = options.onUndo;
		this.#isMoveCancelled = Type.isFunction(options.isMoveCancelled) ? options.isMoveCancelled : () => false;
		this.#canMoveToStage = Type.isFunction(options.canMoveToStage) ? options.canMoveToStage : () => true;
		this.#onMovePermissionDenied = Type.isFunction(options.onMovePermissionDenied)
			? options.onMovePermissionDenied
			: () => {}
		;
		this.#analytics = Type.isPlainObject(options.analytics) ? { ...options.analytics } : {};
	}

	getEntityTitle(): string
	{
		return this.#entityTitle;
	}

	getEntityTextContext(): EntityTextContext
	{
		return { ...this.#entityTextContext };
	}

	getSuccessButtonText(fallback: string): string
	{
		const name = FinalTransitionModel.getName(this.getConfiguredSuccessStage()).trim();

		return name === '' ? fallback : name;
	}

	getFailureButtonText(fallback: string): string
	{
		const failureStages = this.getAllFailureStages();
		if (failureStages.length !== 1)
		{
			return fallback;
		}

		const name = FinalTransitionModel.getName(failureStages[0]).trim();

		return name === '' ? fallback : name;
	}

	getSuccessStage(): FinalTransitionStageData | null
	{
		const statusId = FinalTransitionModel.getStatusId(this.#successStage);

		return statusId === '' || !this.#canMoveToStage(statusId)
			? null
			: FinalTransitionModel.cloneStage(this.#successStage)
		;
	}

	getConfiguredSuccessStage(): FinalTransitionStageData
	{
		return FinalTransitionModel.cloneStage(this.#successStage);
	}

	getFailureStages(): FinalTransitionStageData[]
	{
		return this.#failureStages
			.filter((stage) => {
				const statusId = FinalTransitionModel.getStatusId(stage);

				return statusId !== '' && this.#canMoveToStage(statusId);
			})
			.map((stage) => FinalTransitionModel.cloneStage(stage))
		;
	}

	getAllFailureStages(): FinalTransitionStageData[]
	{
		return this.#failureStages
			.filter((stage) => FinalTransitionModel.getStatusId(stage) !== '')
			.map((stage) => FinalTransitionModel.cloneStage(stage))
		;
	}

	canMoveToStage(statusId: string): boolean
	{
		return statusId !== '' && this.#canMoveToStage(statusId);
	}

	notifyMovePermissionDenied(): void
	{
		this.#onMovePermissionDenied();
	}

	hasFailureStages(): boolean
	{
		return this.getFailureStages().length > 0;
	}

	createMoveContext(stage: FinalTransitionStageData, outcome: FinalTransitionOutcome): FinalTransitionContext
	{
		const targetStage = FinalTransitionModel.cloneStage(stage);

		return {
			outcome,
			previousStatusId: FinalTransitionModel.getStatusId(this.#currentStage),
			targetStage,
			failureStage: outcome === 'failure' ? FinalTransitionModel.cloneStage(targetStage) : null,
			analytics: { ...this.#analytics },
		};
	}

	async moveToStage(stage: FinalTransitionStageData, context: FinalTransitionContext): Promise<FinalTransitionStageData>
	{
		const statusId = FinalTransitionModel.getStatusId(stage);
		if (!this.canMoveToStage(statusId))
		{
			throw new Error('Stage transition is not permitted');
		}

		const updatedStage = await this.#onMoveToStage(statusId, context);
		this.#currentStage = FinalTransitionModel.cloneStage(updatedStage);
		this.#undoTargetStatusId = FinalTransitionModel.getStatusId(this.#currentStage);

		return this.#currentStage;
	}

	async undo(previousStatusId: string): Promise<FinalTransitionStageData>
	{
		if (this.#isUndoing || this.#undoTargetStatusId === '')
		{
			throw new Error('Undo is unavailable');
		}

		this.#isUndoing = true;
		try
		{
			const updatedStage = await this.#onUndo(previousStatusId, this.#undoTargetStatusId);
			this.#currentStage = FinalTransitionModel.cloneStage(updatedStage);
			this.#undoTargetStatusId = '';
		}
		finally
		{
			this.#isUndoing = false;
		}

		return this.#currentStage;
	}

	isMoveCancelled(error: unknown): boolean
	{
		return this.#isMoveCancelled(error);
	}

	static getStatusId(stage: FinalTransitionStageData | null): string
	{
		if (!Type.isPlainObject(stage))
		{
			return '';
		}

		return Type.isStringFilled(stage.statusId) ? stage.statusId : '';
	}

	static getName(stage: FinalTransitionStageData | null): string
	{
		if (!Type.isPlainObject(stage))
		{
			return '';
		}

		return Type.isString(stage.name) ? stage.name : '';
	}

	static getColor(stage: FinalTransitionStageData | null): string
	{
		if (!Type.isPlainObject(stage) || !Type.isStringFilled(stage.color))
		{
			return 'd3d7dc';
		}

		const color = stage.color.replace('#', '');

		return /^[\da-f]{3,6}$/i.test(color) ? color : 'd3d7dc';
	}

	static getDescription(stage: FinalTransitionStageData | null): string
	{
		if (!Type.isPlainObject(stage))
		{
			return '';
		}

		return Type.isString(stage.description) ? stage.description : '';
	}

	static cloneStage(stage: FinalTransitionStageData | null): FinalTransitionStageData
	{
		return Type.isPlainObject(stage) ? { ...stage } : {};
	}
}
