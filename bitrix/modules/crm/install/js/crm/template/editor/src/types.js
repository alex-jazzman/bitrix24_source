import { type FilledPlaceholder as MessageServiceFilledPlaceholder } from 'messageservice.template.editor';

export type FilledPlaceholder = MessageServiceFilledPlaceholder & {
	ENTITY_CATEGORY_ID: string,
	ENTITY_TYPE_ID: string,
	TEMPLATE_ID: string,
};
