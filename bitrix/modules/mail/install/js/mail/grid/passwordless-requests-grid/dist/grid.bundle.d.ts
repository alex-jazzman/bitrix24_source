/* eslint-disable */
interface BitrixGrid {
	tableFade(): void;
	tableUnfade(): void;
	reload(callback?: () => void): void;
}

type User = {
	id: number;
	name: string;
	position: string;
	avatar: {
		src: string;
	} | null | void;
	pathToProfile: string;
};

type RunActionConfig = {
	actionId: string;
	options?: Record<string, unknown>;
	params?: Record<string, unknown>;
};

declare namespace BX.Mail.PasswordlessRequestsGrid {
	class BaseField {
		private readonly fieldId;
		private readonly gridId;
		constructor(params: {
			fieldId: string;
			gridId: string;
		});
		getGridId(): string | null | undefined;
		getFieldId(): string;
		getGrid(): BitrixGrid | null;
		getFieldNode(): HTMLElement | null;
		appendToFieldNode(element: HTMLElement): void;
	}

	class EmployeeField extends BaseField {
		render(params: User): void;
	}

	class StatusField extends BaseField {
		render(params: {
			status: string;
		}): void;
	}

	class DateSentField extends BaseField {
		render(params: {
			timestamp: number | null | undefined;
		}): void;
	}

	class GridManager {
		static instances: Record<string, GridManager>;
		private readonly grid;
		constructor(gridId: string);
		static getInstance(gridId: string): GridManager;
		getGrid(): BitrixGrid | undefined;
		runAction(config: RunActionConfig): void;
	}
}
