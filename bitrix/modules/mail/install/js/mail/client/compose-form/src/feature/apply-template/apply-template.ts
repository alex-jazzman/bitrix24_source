import { EventEmitter } from 'main.core.events';
import { nextTick } from 'ui.vue3';

import { ComposeFormEvent, type ComposeFormChangedPayload } from '../../const/event';
import { type ComposeEditorAdapter } from '../../infrastructure/adapter/editor/types';
import { toPreparedTemplate } from '../../infrastructure/service/template/prepared-template';
import {
	type PrepareTemplateResponse,
	type RecordTemplateUsageResponse,
	type TemplateReferenceDto,
} from '../../infrastructure/service/template/types';
import { type ComposeState, type PreparedTemplate } from '../../model/compose/types';
import { invalidateSubjectGeneration } from '../generate-subject/generate-subject';

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
	isCurrent?: () => boolean,
};

/** Prepares once, then checks the current compose rather than the state it had before the request. */
export async function prepareTemplateApplication(
	params: TemplateApplicationParams,
	reference: TemplateReferenceDto,
): Promise<TemplateApplicationResult>
{
	const { api, editor, state } = params;
	state.templates.prepared = null;
	const { template: preparedTemplate } = await api.prepare(reference);
	state.templates.prepared = toPreparedTemplate(preparedTemplate);
	const template = state.templates.prepared;

	if (editor.hasUserContent() || state.subject.trim() !== '')
	{
		return { status: 'needsDecision', template };
	}

	return applyPrepared(params, template, 'replace', true);
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
	requireCleanCompose: boolean = false,
): Promise<TemplateApplicationResult>
{
	const { api, editor, formId, state } = params;
	const subject = state.subject;
	let addedFileIds: string[] = [];
	if (!isApplicationCurrent(params, template))
	{
		cancelApplication(params, template, addedFileIds);

		return { status: 'cancelled' };
	}

	if (template.attachments?.length > 0)
	{
		try
		{
			const result = await editor.addFiles(template.attachments);
			if (result === null)
			{
				return { status: 'failed', reason: 'editor' };
			}

			addedFileIds = result;
		}
		catch
		{
			return { status: 'failed', reason: 'editor' };
		}
	}

	if (!isApplicationCurrent(params, template))
	{
		cancelApplication(params, template, addedFileIds);

		return { status: 'cancelled' };
	}

	if (requireCleanCompose && (editor.hasUserContent() || state.subject.trim() !== ''))
	{
		removeAddedFiles(editor, addedFileIds);

		return { status: 'needsDecision', template };
	}

	const isApplied = decision === 'insert'
		? editor.insertHtmlAtCaret(template.bodyHtml)
		: editor.replaceUserContent(template.bodyHtml);
	if (!isApplied)
	{
		removeAddedFiles(editor, addedFileIds);
		state.subject = subject;

		return { status: 'failed', reason: 'editor' };
	}

	// The letter the request was built from is gone. A programmatic write of the body raises no `input`
	// event, so the cancel the editor reports for a typed letter never comes and is made here instead.
	invalidateSubjectGeneration(state);

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

	await nextTick();

	return { status: 'applied' };
}

function isApplicationCurrent(params: TemplateApplicationParams, template: PreparedTemplate): boolean
{
	return params.state.templates.prepared === template && (params.isCurrent?.() ?? true);
}

function cancelApplication(
	params: TemplateApplicationParams,
	template: PreparedTemplate,
	addedFileIds: string[],
): void
{
	const { editor, state } = params;
	removeAddedFiles(editor, addedFileIds);
	if (state.templates.prepared === template)
	{
		state.templates.prepared = null;
	}
}

function removeAddedFiles(editor: ComposeEditorAdapter, addedFileIds: string[]): void
{
	addedFileIds.forEach((fileId: string): void => {
		editor.removeFile(fileId);
	});
}
