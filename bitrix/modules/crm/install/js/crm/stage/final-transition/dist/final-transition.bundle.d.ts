/* eslint-disable */
type FinalTransitionOptions = {
	currentStage: FinalTransitionStageData;
	successStage: FinalTransitionStageData;
	failureStages: FinalTransitionStageData[];
	entityTitle: string;
	entityTextContext?: BX.Crm.Stage.EntityTextContext;
	onMoveToStage: (statusId: string, context: FinalTransitionContext) => Promise<FinalTransitionStageData>;
	onUndo: (previousStatusId: string, targetStatusId: string) => Promise<FinalTransitionStageData>;
	isMoveCancelled?: (error: unknown) => boolean;
	canMoveToStage?: (statusId: string) => boolean;
	onMovePermissionDenied?: () => void;
	onClose?: () => void;
	successButton?: BX.UI.Button;
	onSuccessButtonShow?: (complete: () => void) => void;
	onSuccessButtonHide?: () => void;
	analytics?: Record<string, unknown>;
};

type FinalTransitionStageData = {
	id?: string | number | null;
	statusId?: string | null;
	entityId?: string | null;
	name?: string | null;
	sort?: number | string | null;
	color?: string | null;
	semantics?: string | null;
	categoryId?: number | string | null;
	description?: string | null;
	stagesToMove?: string[] | null;
	allowMoveToAnyStage?: boolean | null;
	[key: string]: unknown;
};

type FinalTransitionContext = {
	outcome: FinalTransitionOutcome;
	previousStatusId: string;
	targetStage: FinalTransitionStageData;
	failureStage: FinalTransitionStageData | null;
	analytics: Record<string, unknown>;
};

type FinalTransitionOutcome = 'success' | 'failure';

declare namespace BX.Crm.Stage {
	class FinalTransition {
		static open(options: FinalTransitionOptions): FinalTransition;
		constructor(options: FinalTransitionOptions);
		open(): void;
		close(): void;
	}
}
