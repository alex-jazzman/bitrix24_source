import { EventEmitter } from 'main.core.events';

import { ComposeFormEvent, type ComposeFormChangedPayload } from '../../const/event';
import { type ComposeEditorAdapter } from '../../infrastructure/adapter/editor/types';
import {
	type PrepareTemplateResponse,
	type RecordTemplateUsageResponse,
	type TemplateReferenceDto,
} from '../../infrastructure/service/template/types';
import { type ComposeState, type PreparedTemplate } from '../../model/compose/types';

export type TemplateApplyDecision = 'insert' | 'replace' | 'cancel';

export type TemplateApplicationResult =
	| { status: 'needsDecision', template: PreparedTemplate }
	| { status: 'applied' }
	| { status: 'cancelled' }
	| { status: 'failed', reason: 'editor' };

export type TemplateApplicationApi = {
	prepare(reference: TemplateReferenceDto): Promise<PrepareTemplateResponse>,
	recordUsage(reference: TemplateReferenceDto): Promise<RecordTemplateUsageResponse>,
};

export type TemplateApplicationParams = {
	api: TemplateApplicationApi,
	editor: ComposeEditorAdapter,
	state: ComposeState,
	formId: string,
};

/** Prepares once, then checks the current compose rather than the state it had before the request. */
export async function prepareTemplateApplication(
	params: TemplateApplicationParams,
	reference: TemplateReferenceDto,
): Promise<TemplateApplicationResult>
{
	const { api, editor, state } = params;
	state.templates.prepared = null;
	const { template } = await api.prepare(reference);
	state.templates.prepared = template;

	if (editor.hasUserContent() || state.subject.trim() !== '')
	{
		return { status: 'needsDecision', template };
	}

	return applyPrepared(params, template, 'replace');
}

export async function completeTemplateApplication(
	params: TemplateApplicationParams,
	decision: TemplateApplyDecision,
): Promise<TemplateApplicationResult>
{
	const { state } = params;
	const template = state.templates.prepared;
	if (decision === 'cancel' || !template)
	{
		state.templates.prepared = null;

		return { status: 'cancelled' };
	}

	return applyPrepared(params, template, decision);
}

async function applyPrepared(
	params: TemplateApplicationParams,
	template: PreparedTemplate,
	decision: Exclude<TemplateApplyDecision, 'cancel'>,
): Promise<TemplateApplicationResult>
{
	const { api, editor, formId, state } = params;
	const isApplied = decision === 'insert'
		? editor.insertHtmlAtCaret(template.bodyHtml)
		: editor.replaceUserContent(template.bodyHtml);
	if (!isApplied)
	{
		return { status: 'failed', reason: 'editor' };
	}

	if (decision === 'replace')
	{
		state.subject = template.subject;
	}
	state.templates.prepared = null;

	const payload: ComposeFormChangedPayload = { formId, reason: 'template' };
	EventEmitter.emit(ComposeFormEvent.Changed, payload);

	/*
	 * The letter already carries the template, and nothing in the form reads the answer of the history
	 * write, so the scenario does not hold the menu open for a round trip of it.
	 */
	void api.recordUsage(template.reference).catch((): void => {});

	return { status: 'applied' };
}
