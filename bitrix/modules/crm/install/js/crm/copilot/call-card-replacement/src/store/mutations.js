/* eslint no-param-reassign: off */
import type { ApplicationState } from '../store';
import type { CallAssessmentSelector } from 'crm.copilot.call-assessment-selector';
import type { ReplacementOptions } from '../app';
import { Type } from 'main.core';
import { prepareCallAssessment, prepareCriteria } from './functions';

export default {
	initializeApplicationState(state: ApplicationState, options: ReplacementOptions): void
	{
		if (!Type.isStringFilled(options.callId))
		{
			throw new TypeError('options.callId must be filled');
		}

		const callAssessment = options.callAssessment ?? {};

		state.callId = options.callId;
		state.assessment = prepareCallAssessment(callAssessment);
		state.hasAvailableSelectorItems = options.hasAvailableSelectorItems ?? true;
		state.isCallScoringV2Enabled = Boolean(options.isCallScoringV2Enabled);
		state.criteria = prepareCriteria(callAssessment?.criteria);
	},

	setCallAssessmentFromSelector(state: ApplicationState, selector: CallAssessmentSelector): void
	{
		const item = selector.getCurrentCallAssessmentItem();
		if (item === null)
		{
			return;
		}

		state.assessment = prepareCallAssessment(item);
		state.criteria = prepareCriteria(item?.criteria);
	},

	setCallAssessment(state: ApplicationState, assessment: Object): void
	{
		state.assessment = prepareCallAssessment(assessment);
		state.criteria = prepareCriteria(assessment?.criteria);
	},
};
