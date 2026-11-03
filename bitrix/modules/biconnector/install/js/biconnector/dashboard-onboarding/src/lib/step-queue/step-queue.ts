import { Loc, Type } from 'main.core';

import { StepImage, StepSide } from '../../const';
import { type TourStep } from '../../types';

export type TargetResolver = (stepId: string) => HTMLElement | null;

/**
 * Keeps only the steps whose target is really on the screen: a step nobody can point at is
 * dropped silently and does not take a number in the tour counter.
 */
export function buildStepQueue(stepIds: string[], resolveTarget: TargetResolver): TourStep[]
{
	const steps: TourStep[] = [];

	stepIds.forEach((stepId) => {
		const target = resolveTarget(stepId);
		if (!Type.isDomNode(target) || !isVisible(target))
		{
			return;
		}

		const phrasePrefix = `BICONNECTOR_DASHBOARD_ONBOARDING_STEP_${stepId.toUpperCase()}`;

		steps.push({
			id: stepId,
			target,
			title: Loc.getMessage(`${phrasePrefix}_TITLE`) ?? '',
			text: Loc.getMessage(`${phrasePrefix}_TEXT`) ?? '',
			side: StepSide[stepId],
			image: StepImage[stepId],
		});
	});

	return steps;
}

function isVisible(node: HTMLElement): boolean
{
	// A fixed target has no offsetParent in some engines, and it is on the screen all the same.
	return node.offsetParent !== null || window.getComputedStyle(node).position === 'fixed';
}
