/* eslint-disable */
type StageDescriptionTooltipSuspension = {
	release: () => void;
};

type StageDescriptionTooltipShowOptions = {
	bindElement: HTMLElement;
	focusElement?: HTMLElement;
	name: string;
	description: string;
	showName: boolean;
};

type DescriptionFormatter = {
	format: (options: {
		source: string;
	}) => Node | null;
};

declare namespace BX.Crm.Stage {
	const stageDescriptionTooltipCoordinator: {
		suspend: () => import("./active-tooltip-registry").StageDescriptionTooltipSuspension;
	};

	class StageDescriptionTooltip {
		show(options: StageDescriptionTooltipShowOptions): void;
		hide(): void;
		hideImmediately(): void;
	}

	function getStageDescriptionTooltipContent(options: Omit<StageDescriptionTooltipShowOptions, 'bindElement'>, descriptionFormatter?: DescriptionFormatter): string;
}
