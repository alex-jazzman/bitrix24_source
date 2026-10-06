import {
	completeTemplateApplication,
	prepareTemplateApplication,
	type TemplateApplyDecision,
	type TemplateApplicationResult,
} from '../apply-template/apply-template';
import { type ComposeEditorAdapter } from '../../infrastructure/adapter/editor/types';
import { TemplateApi } from '../../infrastructure/service/template/template';
import { type ComposeState, type TemplateReference } from '../../model/compose/types';

type CompleteSelectedTemplateParams = {
	state: ComposeState,
	editor: ComposeEditorAdapter,
	formId: string,
};

export type TemplatePreparationController = {
	select(reference: TemplateReference): void,
	retry(): void,
	destroy(): void,
};

type TemplatePreparationControllerParams = CompleteSelectedTemplateParams & {
	onPendingChange: (isPending: boolean) => void,
	onResult: (result: TemplateApplicationResult) => void,
	onError: () => void,
};

class StalePreparationError extends Error
{}

export function createTemplatePreparationController(
	params: TemplatePreparationControllerParams,
): TemplatePreparationController
{
	let sequence = 0;
	let lastReference: TemplateReference | null = null;

	const select = (reference: TemplateReference): void => {
		lastReference = reference;
		const requestSequence = ++sequence;
		params.onPendingChange(true);
		void prepareTemplateApplication({
			api: {
				prepare: async (selectedReference) => {
					const response = await TemplateApi.prepare(selectedReference);
					if (sequence !== requestSequence)
					{
						throw new StalePreparationError();
					}

					return response;
				},
				recordUsage: TemplateApi.recordUsage,
			},
			editor: params.editor,
			state: params.state,
			formId: params.formId,
		}, reference).then(
			(result): void => {
				if (sequence === requestSequence)
				{
					params.onResult(result);
				}
			},
			(error): void => {
				if (sequence === requestSequence && !(error instanceof StalePreparationError))
				{
					params.onError();
				}
			},
		).finally((): void => {
			if (sequence === requestSequence)
			{
				params.onPendingChange(false);
			}
		});
	};

	return {
		select,
		retry(): void
		{
			if (lastReference)
			{
				select(lastReference);
			}
		},
		destroy(): void
		{
			sequence += 1;
		},
	};
}

export function completeSelectedTemplate(
	params: CompleteSelectedTemplateParams,
	decision: TemplateApplyDecision,
): Promise<TemplateApplicationResult>
{
	return completeTemplateApplication({ ...params, api: TemplateApi }, decision);
}
