import { EventEmitter } from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';
import { FeaturePromotersRegistry } from 'ui.info-helper';

import { type ComposeScenario, Phrase, Scenario } from '../../const';
import { ComposeFormEvent, type ComposeFormChangedPayload } from '../../const/event';
import { type ComposeEditorAdapter } from '../../infrastructure/adapter/editor/types';
import { Api } from '../../infrastructure/service/compose/compose';
import {
	type AjaxError,
	type AjaxResponse,
	type GenerateSubjectRequest,
	type GenerateSubjectResponse,
	SubjectGenerationMode,
	type SubjectGenerationModeValue,
} from '../../infrastructure/service/compose/types';
import { loc } from '../../lib/loc/loc';
import { notifyPortal } from '../../lib/notification/notification';
import { type ComposeState } from '../../model/compose/types';

/** `Subject::CURRENT_SUBJECT_MAX_LENGTH`: the server keeps this much of the subject it is given to improve. */
const CurrentSubjectMaxLength = 500;

/**
 * The answer of the model is bounded by nobody on the server — `SubjectGenerator::runCompletion()` only
 * trims it — so it is bounded here, by the very length the form is allowed to send a subject back with.
 */
const GeneratedSubjectMaxLength = CurrentSubjectMaxLength;

/** The family the `ai` facade answers a spent quota with: the plain code and its suffixed variants. */
const LimitErrorCode = 'LIMIT_IS_EXCEEDED';

/**
 * The subject generation has no feature identifier of its own, and one cannot be made up: a `featureId`
 * turns into the article code `limit_v2_<id>` (`ui/lib/FeaturePromoter/Code.php`), and no such article
 * exists for it. The `ai` module names the article itself, in `customData.sliderCode` of a limit error, and
 * its own client falls back to the monthly one when the answer carries none
 * (`ai/install/js/ai/ajax-error-handler/src/ajax-error-handler.js:184`). The form repeats both, so the
 * upgrade path is the very one the portal opens for every other spent AI quota.
 */
const DefaultLimitSliderCode = 'limit_copilot_requests';

/** Tags that end a line in a letter; everything else is inline and its text is glued together. */
const LineEndingTags = 'p, div, li, tr, h1, h2, h3, h4, h5, h6, blockquote, pre, table, ul, ol, hr';

/** How long one step of the generation is waited for, the same 30 seconds the mobile application waits. */
const GenerationStepTimeout = 30_000;

export type GenerateSubjectParams = {
	editor: ComposeEditorAdapter,
	state: ComposeState,
	/**
	 * Identifier of the mounted form, the one the change of the letter is reported under. Optional for the
	 * same reason `getControlNode` is: it binds the scenario to a mounted form, and the scenario runs
	 * without one.
	 */
	formId?: string,
	/** The tariff promo binds to the control that started the generation, and that control owns its node. */
	getControlNode?: () => HTMLElement | null,
};

/**
 * What the form is waiting for: the answer of the action first, the result of a deferred job after it. The
 * request that armed the wait is kept for the check against a late answer, and so are the parameters of the
 * call: a job refused for a spent quota shows the tariff promo on the very control the generation was
 * started from.
 */
type GenerationWait = {
	requestId: number,
	timerId: ReturnType<typeof setTimeout>,
	params: GenerateSubjectParams,
};

/** The wait belongs to the form: a second open form has a state of its own and waits for a job of its own. */
const waitByForm = new WeakMap<ComposeState, GenerationWait>();

/**
 * The parameters of the request in flight, held here rather than in the closure of its promise. A promise
 * that captured them would keep the editor adapter and the Vue instance of the button alive for as long as
 * the browser keeps the connection, which outlives a form destroyed mid-request. The entry goes away on
 * every terminal transition, and the promise reads it back instead of capturing it.
 */
const callByForm = new WeakMap<ComposeState, GenerateSubjectParams>();

/** An ending of a queued job as the PULL layer hands it over: a result, or a refusal. */
type JobEvent =
	{ kind: 'result', result: string }
	| { kind: 'failure', error: AjaxError | null };

/**
 * The job events that arrived before the answer of the action named the hash of the request. Whose job an
 * event announces cannot be told until then, so the last event of every hash is kept for the length of the
 * request and read back once the hash is known: without it a job that finished faster than the action
 * answered would be dropped, and the user would wait the timeout out on a subject already generated.
 */
const earlyJobsByForm = new WeakMap<ComposeState, Map<string, JobEvent>>();

/**
 * One request of the subject generation, from the click to a terminal transition. The scenario owns the
 * whole life of that request: it cuts off an empty body before spending the quota, lets no second request
 * in while the first is alive, applies an immediate answer, tells a spent quota from a plain failure and
 * unlocks the subject field on every ending.
 *
 * An answer that carries a hash instead of a subject puts the request into a wait: the result comes with a
 * PULL event of the `ai` module. The timeout runs from the click and covers both steps: it ends the request
 * whose answer never comes as well as the wait whose event never comes.
 */
export function generateSubject(params: GenerateSubjectParams): Promise<void>
{
	const { state } = params;
	if (state.subjectGeneration.isRunning)
	{
		return Promise.resolve();
	}

	const body = readBodyForGeneration(params.editor);
	if (body === '')
	{
		// A precondition rather than a failure: nothing started, so there is nothing to finish either.
		notifyRefusal(Phrase.SubjectGenerationEmptyBody);

		return Promise.resolve();
	}

	const requestId = state.subjectGeneration.requestId + 1;
	state.subjectGeneration.requestId = requestId;
	state.subjectGeneration.isRunning = true;
	state.subjectGeneration.hash = null;
	callByForm.set(state, params);
	// `ajax.runAction` gives the call no deadline of its own: a request that never answers would leave the
	// subject field locked and empty until the form is reopened, so the wait is armed from the click on.
	armWait(params, requestId);
	// The field locks itself and the phrase of the wait is drawn over it, and neither is spoken by itself.
	LiveAnnouncer.announce(loc(Phrase.SubjectGenerationRunning), 'polite');

	return Api.generateSubject(buildRequest(state, body)).then(
		(response: AjaxResponse<GenerateSubjectResponse>): void => {
			const call = readActiveCall(state, requestId);
			if (call === null)
			{
				return;
			}

			applyAnswer(call, requestId, response.data);
		},
		(reason: unknown): void => {
			const call = readActiveCall(state, requestId);
			if (call === null)
			{
				return;
			}

			finishSubjectGeneration(state);
			reportFailure(call, readErrors(reason));
		},
	);
}

/**
 * Drops the request in flight, if there is one, so its answer is never applied. Silent on purpose: the
 * mobile application shows no notice here either. Raising the identifier rather than switching the feature
 * off is what keeps the next generation possible.
 */
export function invalidateSubjectGeneration(state: ComposeState): void
{
	if (!state.subjectGeneration.isRunning)
	{
		return;
	}

	state.subjectGeneration.requestId += 1;
	finishSubjectGeneration(state);
}

/** Called when the form goes down: a result arriving afterwards has nothing left to write into. */
export function destroySubjectGeneration(state: ComposeState): void
{
	state.subjectGeneration.requestId += 1;
	finishSubjectGeneration(state);
}

/** The single terminal transition: the timer of the generation is taken down here and nowhere else. */
export function finishSubjectGeneration(state: ComposeState): void
{
	const wait = waitByForm.get(state);
	if (wait)
	{
		clearTimeout(wait.timerId);
		waitByForm.delete(state);
	}

	callByForm.delete(state);
	earlyJobsByForm.delete(state);
	state.subjectGeneration.isRunning = false;
	state.subjectGeneration.hash = null;
}

/**
 * The parameters of the request are its own while the request is still the request of the form. A cancelled
 * call finds nothing here, and that is the whole point: its answer has no form left to write into anyway.
 */
function readActiveCall(state: ComposeState, requestId: number): GenerateSubjectParams | null
{
	return isAnswerStale(state, requestId) ? null : callByForm.get(state) ?? null;
}

/**
 * The result of a deferred job, handed over by the PULL layer: the scenario and not the handler owns every
 * ending of the request. An empty result is a failure here for the same reason it is one in the immediate
 * answer: a subject the user has already typed must not be wiped with an empty string.
 */
export function applySubjectJobResult(state: ComposeState, hash: string, result: string): void
{
	if (!isJobOfTheForm(state, hash, { kind: 'result', result }))
	{
		return;
	}

	const wait = readActiveWait(state);
	if (!wait)
	{
		return;
	}

	const subject = normalizeSubject(result);
	finishSubjectGeneration(state);
	if (subject === '')
	{
		notifyRefusal(Phrase.SubjectGenerationError);

		return;
	}

	applyGeneratedSubject(wait.params, subject);
}

/**
 * A deferred job that ended in a refusal. The quota can run out after the job was queued, so the code of the
 * event goes through the very recognition the immediate refusal goes through, promo included.
 */
export function applySubjectJobFailure(state: ComposeState, hash: string, error: AjaxError | null): void
{
	if (!isJobOfTheForm(state, hash, { kind: 'failure', error }))
	{
		return;
	}

	const wait = readActiveWait(state);
	if (!wait)
	{
		return;
	}

	finishSubjectGeneration(state);
	reportFailure(wait.params, error === null ? [] : [error]);
}

/**
 * The wait is the current one when the request that armed it is still the request of the form: the hash
 * alone would let the result of a cancelled request through if the very same job answered late.
 */
function readActiveWait(state: ComposeState): GenerationWait | null
{
	const wait = waitByForm.get(state);

	return wait && !isAnswerStale(state, wait.requestId) ? wait : null;
}

/**
 * Whether the event announces the job of this form. The channel of the `ai` module carries the jobs of the
 * whole page, and the form tells its own by the hash the action answered with — a hash it does not know
 * while the request is still in flight. An event that outran the answer is kept for `applyAnswer` to read
 * back; everything else passes by in silence.
 */
function isJobOfTheForm(state: ComposeState, hash: string, job: JobEvent): boolean
{
	if (state.subjectGeneration.hash === hash)
	{
		return true;
	}

	if (state.subjectGeneration.isRunning && state.subjectGeneration.hash === null)
	{
		const jobs = earlyJobsByForm.get(state) ?? new Map<string, JobEvent>();
		jobs.set(hash, job);
		earlyJobsByForm.set(state, jobs);
	}

	return false;
}

/** The buffer outlives no request that filled it: from the answer on the hash tells the job of the form. */
function takeEarlyJob(state: ComposeState, hash: string): JobEvent | null
{
	const job = earlyJobsByForm.get(state)?.get(hash) ?? null;
	earlyJobsByForm.delete(state);

	return job;
}

function applyEarlyJob(state: ComposeState, hash: string, job: JobEvent): void
{
	if (job.kind === 'result')
	{
		applySubjectJobResult(state, hash, job.result);

		return;
	}

	applySubjectJobFailure(state, hash, job.error);
}

/**
 * Nothing on the outside disarms the wait: neither an action that never answers nor a portal that never
 * sends the event must leave the field locked. The answer re-arms the timer instead of adding a second one,
 * so the request and the deferred job each get the whole of the timeout and one timer is alive at a time.
 */
function armWait(params: GenerateSubjectParams, requestId: number): void
{
	const { state } = params;
	const previous = waitByForm.get(state);
	if (previous)
	{
		clearTimeout(previous.timerId);
	}

	const timerId = setTimeout((): void => {
		if (isAnswerStale(state, requestId))
		{
			return;
		}

		finishSubjectGeneration(state);
		notifyRefusal(Phrase.SubjectGenerationError);
	}, GenerationStepTimeout);

	waitByForm.set(state, { requestId, timerId, params });
}

/**
 * The adapter answers with markup, and `Subject::normalizeComposedBody()` strips no tags, so a copy of
 * the body is cleaned here: the signature and the quote are cut off by the identifiers the adapter owns,
 * and the rest is turned into plain text. The quote goes because `Subject::buildMessages()` already puts
 * the source letter into the context of the model as a message of its own, and the mobile compose form
 * carries no quote in the body at all.
 */
export function readBodyForGeneration(editor: ComposeEditorAdapter): string
{
	const template = document.createElement('template');
	template.innerHTML = editor.getBody();

	for (const nodeId of [editor.bodyNodes.signature, editor.bodyNodes.quote])
	{
		template.content.getElementById(nodeId)?.remove();
	}

	return toPlainText(template.content);
}

/**
 * Exactly one of the two comes back. A ready subject is applied at once; a hash puts the request into the
 * wait for the PULL event. An answer that carries neither is a failure and not a success: without this the
 * form would wipe a subject the user has already typed with an empty string.
 */
function applyAnswer(
	params: GenerateSubjectParams,
	requestId: number,
	data: GenerateSubjectResponse | null,
): void
{
	const { state } = params;
	const subject = normalizeSubject(data?.subject ?? '');
	if (subject !== '')
	{
		applyGeneratedSubject(params, subject);
		finishSubjectGeneration(state);

		return;
	}

	const queueHash = data?.queueHash ?? '';
	if (queueHash !== '')
	{
		state.subjectGeneration.hash = queueHash;
		armWait(params, requestId);

		// The job may well have finished before the answer naming it reached the browser.
		const early = takeEarlyJob(state, queueHash);
		if (early)
		{
			applyEarlyJob(state, queueHash, early);
		}

		return;
	}

	finishSubjectGeneration(state);
	notifyRefusal(Phrase.SubjectGenerationError);
}

/**
 * The single write of a ready subject. The field takes it without a word, being neither an input of the
 * user nor a notice, while it is the very result the button was pressed for, so it is announced.
 */
function applyGeneratedSubject(params: GenerateSubjectParams, subject: string): void
{
	// A programmatic write, not an input of the user.
	params.state.subject = subject;
	notifyFormChanged(params);
	LiveAnnouncer.announce(loc(Phrase.SubjectGenerationDone), 'polite');
}

/**
 * The write goes straight into the state and raises no input event of the field, so nothing else tells the
 * draft of the form that the letter changed: a subject applied to a draft already saved and closed right
 * after would be gone on the next open. The channel is the one every other change of the form reports on.
 */
function notifyFormChanged(params: GenerateSubjectParams): void
{
	const { formId } = params;
	if (formId === undefined || formId === '')
	{
		return;
	}

	const payload: ComposeFormChangedPayload = { formId, reason: 'user' };
	EventEmitter.emit(ComposeFormEvent.Changed, payload);
}

/**
 * The single refusal of the scenario. The balloon of the portal is a plain `div` with neither a role nor a
 * live region of its own and it is gone in two seconds, so the text is announced separately. Assertive: the
 * refusal ends a wait the user is standing in, and by then the subject field has already unlocked silently.
 */
function notifyRefusal(phrase: string): void
{
	const text = loc(phrase);

	notifyPortal(text);
	LiveAnnouncer.announce(text, 'assertive');
}

/**
 * A spent quota keeps the way to an upgrade: the notice comes with the tariff promo. `MUST_AGREE_WITH_AGREEMENT`
 * and `SERVICE_IS_NOT_AVAILABLE_BY_TARIFF` are deliberately left to the plain failure, the way the mobile
 * application leaves them.
 */
function reportFailure(params: GenerateSubjectParams, errors: AjaxError[]): void
{
	if (!isLimitReached(errors))
	{
		notifyRefusal(Phrase.SubjectGenerationError);

		return;
	}

	notifyRefusal(Phrase.SubjectGenerationLimit);
	FeaturePromotersRegistry.getPromoter({
		code: resolveLimitSliderCode(errors),
		bindElement: params.getControlNode?.() ?? undefined,
	}).show();
}

/**
 * The identifier and not the running flag: by the time an answer comes the flag may have been raised again
 * by a newer request, and a stale answer would then pass for its own.
 */
function isAnswerStale(state: ComposeState, requestId: number): boolean
{
	return requestId !== state.subjectGeneration.requestId;
}

function buildRequest(state: ComposeState, body: string): GenerateSubjectRequest
{
	const request: GenerateSubjectRequest = {
		body,
		mode: resolveMode(state.scenario),
		currentSubject: normalizeCurrentSubject(state.subject),
	};

	if (state.parentMessageId !== null && state.parentMessageId > 0)
	{
		request.originalMessageId = state.parentMessageId;
	}

	return request;
}

function resolveMode(scenario: ComposeScenario): SubjectGenerationModeValue
{
	if (scenario === Scenario.Forward)
	{
		return SubjectGenerationMode.Forward;
	}

	return scenario === Scenario.Reply || scenario === Scenario.ReplyAll
		? SubjectGenerationMode.Reply
		: SubjectGenerationMode.New;
}

/** A refused action rejects with the envelope of the answer; a broken one carries no list of errors. */
function readErrors(reason: unknown): AjaxError[]
{
	const errors = (reason as Partial<AjaxResponse<unknown>> | null | undefined)?.errors;

	return Array.isArray(errors) ? errors : [];
}

function isLimitReached(errors: AjaxError[]): boolean
{
	return errors.some((error: AjaxError): boolean => isLimitCode(error.code));
}

/** The family and not a single code: the facade answers with suffixed variants as well. */
function isLimitCode(code: string | number | undefined): boolean
{
	return code === LimitErrorCode || (typeof code === 'string' && code.startsWith(`${LimitErrorCode}_`));
}

function resolveLimitSliderCode(errors: AjaxError[]): string
{
	const limitError = errors.find((error: AjaxError): boolean => isLimitCode(error.code));
	const sliderCode = (limitError?.customData as { sliderCode?: unknown } | null | undefined)?.sliderCode;

	return typeof sliderCode === 'string' && sliderCode !== '' ? sliderCode : DefaultLimitSliderCode;
}

function toPlainText(content: DocumentFragment): string
{
	for (const lineBreak of content.querySelectorAll('br'))
	{
		lineBreak.replaceWith('\n');
	}

	for (const block of content.querySelectorAll(LineEndingTags))
	{
		block.append('\n');
	}

	return (content.textContent ?? '')
		.replaceAll(/[^\S\n]+/gu, ' ')
		.replaceAll(/ ?\n ?/gu, '\n')
		.replaceAll(/\n{3,}/gu, '\n\n')
		.trim();
}

/** The subject goes into one line and within the length the form holds a subject to. */
function normalizeSubject(value: string): string
{
	return cutToLength(value.replaceAll(/\s+/gu, ' ').trim(), GeneratedSubjectMaxLength).trim();
}

/** The subject sent to be improved, cut the way `Subject::normalizeCurrentSubject()` cuts it on arrival. */
function normalizeCurrentSubject(value: string): string
{
	return cutToLength(value.trim(), CurrentSubjectMaxLength).trim();
}

/**
 * The cut never lands inside a character. `slice()` counts UTF-16 code units, and a cut between the halves
 * of a surrogate pair leaves a lone surrogate: `encodeURIComponent()` of the transport throws `URIError` on
 * one, so the request is never sent at all, and the same broken value would go into the subject field.
 *
 * The border is counted in code units while the server counts it in code points
 * (`Subject::normalizeContent()` cuts with `mb_substr()`), so a value cut here is never longer than the one
 * the server keeps: for a subject of plain letters the two are the same, and for one carrying emoji this
 * side is the stricter of the two.
 */
function cutToLength(value: string, maxLength: number): string
{
	if (value.length <= maxLength)
	{
		return value;
	}

	return value
		.slice(0, maxLength)
		// A high surrogate left without its low one is not a character at all.
		.replace(/[\uD800-\uDBFF]$/u, '')
		// A joiner left without what it joins; the emoji before it stands on its own.
		.replace(/(?:\uFE0F?\u200D)+$/u, '');
}
