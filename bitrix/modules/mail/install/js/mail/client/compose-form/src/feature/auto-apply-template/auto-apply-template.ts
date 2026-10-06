import { Scenario } from '../../const';
import { completeTemplateApplication, type TemplateApplicationParams } from '../apply-template/apply-template';
import { type DraftRestoreResult } from '../draft-integration/draft-integration';
import { loadRecentTemplates } from '../load-recent-templates/load-recent-templates';
import { type ComposeEditorAdapter, type EditorUnsubscribe } from '../../infrastructure/adapter/editor/types';
import { TemplateApi } from '../../infrastructure/service/template/template';
import { type ComposeState } from '../../model/compose/types';

type AutoApplyTemplateParams = Omit<TemplateApplicationParams, 'api'> & {
	api?: TemplateApplicationParams['api'],
	draftRestore: Promise<DraftRestoreResult>,
	loadRecent?: (state: ComposeState) => Promise<void>,
};

type ResolvedAutoApplyTemplateParams = AutoApplyTemplateParams & {
	api: TemplateApplicationParams['api'],
};

export class AutoApplyTemplate
{
	#params: ResolvedAutoApplyTemplateParams;
	#active = true;
	#unsubscribeReady: EditorUnsubscribe = (): void => {};
	#unsubscribeInput: EditorUnsubscribe = (): void => {};
	#userInput = false;

	constructor(params: AutoApplyTemplateParams)
	{
		this.#params = { ...params, api: params.api ?? TemplateApi };
	}

	async start(): Promise<void>
	{
		const { api, editor, loadRecent, state } = this.#params;
		if (state.scenario !== Scenario.New || !state.features.templates)
		{
			this.#finish('skipped');

			return;
		}

		const inputSubscriptions = [
			editor.subscribeContentChange(this.markUserInput),
			editor.subscribeFileAdd(this.markUserInput),
			editor.subscribeFileRemove(this.markUserInput),
		];
		this.#unsubscribeInput = (): void => {
			inputSubscriptions.forEach((unsubscribe: EditorUnsubscribe): void => unsubscribe());
		};

		state.templates.autoApply.status = 'pending';
		const [draftRestore] = await Promise.all([this.#params.draftRestore, this.#waitForEditor(editor)]);
		if (!this.#active || draftRestore.restored)
		{
			this.#finish('skipped');

			return;
		}

		await (loadRecent ?? loadRecentTemplates)(state);
		const candidate = state.templates.autoApply.candidate;
		if (
			!this.#active
			|| !state.templates.rememberLast
			|| !candidate
			|| this.#userInput
			|| !this.#isComposeClean()
		)
		{
			this.#finish('skipped');

			return;
		}

		try
		{
			const { template } = await api.prepare(candidate);
			if (!this.#active || !state.templates.rememberLast || this.#userInput || !this.#isComposeClean())
			{
				this.#finish('skipped');

				return;
			}

			state.templates.prepared = template;
			const result = await completeTemplateApplication(this.#params, 'replace');
			this.#finish(this.#active && result.status === 'applied' ? 'applied' : 'skipped');
		}
		catch
		{
			this.#finish(this.#active ? 'failed' : 'skipped');
		}
	}

	destroy(): void
	{
		this.#active = false;
		this.#unsubscribeReady();
		this.#unsubscribeInput();
	}

	markUserInput = (): void => {
		this.#userInput = true;
	};

	#finish(status: ComposeState['templates']['autoApply']['status']): void
	{
		this.#params.state.templates.autoApply.status = status;
		this.#unsubscribeReady();
		this.#unsubscribeReady = (): void => {};
		this.#unsubscribeInput();
		this.#unsubscribeInput = (): void => {};
	}

	#isComposeClean(): boolean
	{
		return this.#params.state.subject.trim() === '' && !this.#params.editor.hasUserContent();
	}

	#waitForEditor(editor: ComposeEditorAdapter): Promise<void>
	{
		return new Promise((resolve): void => {
			this.#unsubscribeReady = editor.subscribeReady((): void => {
				this.#unsubscribeReady();
				this.#unsubscribeReady = (): void => {};
				resolve();
			});
		});
	}
}
