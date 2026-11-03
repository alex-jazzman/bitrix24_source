import './stage-description-tooltip.css';

import { activeTooltipRegistry } from './active-tooltip-registry';

export const stageDescriptionTooltipCoordinator = {
	suspend: () => activeTooltipRegistry.suspend(),
};
export type { StageDescriptionTooltipSuspension } from './active-tooltip-registry';
export {
	StageDescriptionTooltip,
	getStageDescriptionTooltipContent,
} from './stage-description-tooltip';
export type { StageDescriptionTooltipShowOptions } from './stage-description-tooltip';
