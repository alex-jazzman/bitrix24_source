import { Text } from 'main.core';
import './callout-hint.css';

export type CalloutHintVariant = 'ai-update' | 'attribution' | 'step';

type CreateCalloutHintParams = {
	variant: CalloutHintVariant,
	title: string,
	description: string,
};

const HINT_MAX_WIDTH = 479;

export function createCalloutHint(params: CreateCalloutHintParams): Object
{
	const title = Text.encode(params.title);
	const description = Text.encode(params.description);

	return {
		html: `
			<div class="crm-call-assessment-v2-callout-hint__body">
				<div class="crm-call-assessment-v2-callout-hint__icon" aria-hidden="true"></div>
				<div class="crm-call-assessment-v2-callout-hint__text">
					<div class="crm-call-assessment-v2-callout-hint__title">${title}</div>
					<div class="crm-call-assessment-v2-callout-hint__desc">${description}</div>
				</div>
			</div>
		`,
		popupOptions: {
			className: `crm-call-assessment-v2-callout-hint --variant-${params.variant}`,
			maxWidth: HINT_MAX_WIDTH,
		},
	};
}
