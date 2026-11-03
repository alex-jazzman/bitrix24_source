import { toPreparedTemplate } from '../../infrastructure/service/template/prepared-template';
import { TemplateApi } from '../../infrastructure/service/template/template';
import { type PreparedTemplate, type TemplateReference } from '../../model/compose/types';

export type TemplatePreviewController = {
	preview(reference: TemplateReference): void,
	retry(): void,
	destroy(): void,
};

export function createTemplatePreviewController(params: {
	onPendingChange: (pending: boolean) => void,
	onResult: (template: PreparedTemplate) => void,
	onError: () => void,
}): TemplatePreviewController
{
	let sequence = 0;
	let lastReference: TemplateReference | null = null;
	const preview = (reference: TemplateReference): void => {
		lastReference = reference;
		const requestSequence = ++sequence;
		params.onPendingChange(true);
		void TemplateApi.prepare(reference).then(
			(response): void => {
				if (sequence === requestSequence)
				{
					params.onResult(toPreparedTemplate(response.template));
				}
			},
			(): void => {
				if (sequence === requestSequence)
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
		preview,
		retry(): void
		{
			if (lastReference)
			{
				preview(lastReference);
			}
		},
		destroy(): void
		{
			sequence += 1;
		},
	};
}
