declare module 'mail/templates' {
	export type MailTemplateReference = { source: string; id: number };
	export type MailTemplateApplyDecision = 'insert' | 'replace' | 'cancel';

	export class TemplateNavigator {
		constructor(options?: object);
		open(options: {
			session: object;
			managePath?: string;
			emailFrom?: string;
			onSelect: (reference: MailTemplateReference) => void;
			onReturnFocus?: () => void;
		}): Promise<object>;
	}

	export function showTemplateApplyDialog(): Promise<MailTemplateApplyDecision>;
}
