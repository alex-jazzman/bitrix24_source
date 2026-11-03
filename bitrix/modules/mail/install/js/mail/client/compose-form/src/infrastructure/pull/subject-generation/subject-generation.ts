import { Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { applySubjectJobFailure, applySubjectJobResult } from '../../../feature/generate-subject/generate-subject';
import { type ComposeState } from '../../../model/compose/types';
import { type AjaxError } from '../../service/compose/types';

/** Channel the PULL client re-emits the events of the `ai` module on. */
const PullEvent = 'onPullEvent-ai';

/** The two endings of a queued job, `ai/lib/QueueJob.php:32-33`. */
const JobDoneCommand = 'onQueueJobExecute';
const JobFailedCommand = 'onQueueJobFail';

type PullEventPayload = BaseEvent;

/** Payload of the job event by the surface the form reads, `ai/lib/QueueJob.php:746-762`. */
type JobParams = {
	hash?: unknown,
	error?: unknown,
	data?: unknown,
};

/**
 * The deferred result of the subject generation, for one open form. The channel of the `ai` module carries
 * the jobs of the whole page, so the handler takes only the two commands of a queued job and only an event
 * that names a hash; anything else passes by in silence.
 *
 * The subscription belongs to the form and not to the extension: the state of a form is handed to its
 * application through `provide` and is nowhere global, so a handler loaded with the bundle would have no
 * form to write the subject into. `ComposeForm` starts this subscription and takes it down, and a second
 * open form gets a subscription of its own with a state of its own.
 *
 * The handler writes nothing into the state: the result is handed over to the scenario, which owns every
 * ending of the request. A form the generation is not offered on asks for no job and subscribes to nothing.
 */
export function subscribeSubjectGeneration(state: ComposeState): () => void
{
	if (!state.subjectGeneration.available)
	{
		return (): void => {};
	}

	const handler = (event: PullEventPayload): void => {
		handleJobEvent(state, event);
	};

	EventEmitter.subscribe(PullEvent, handler);

	return (): void => {
		EventEmitter.unsubscribe(PullEvent, handler);
	};
}

function handleJobEvent(state: ComposeState, event: PullEventPayload): void
{
	const [command, payload] = event.getData() as [string, unknown];
	if (command !== JobDoneCommand && command !== JobFailedCommand)
	{
		return;
	}

	if (!Type.isObject(payload))
	{
		return;
	}

	const params = payload as JobParams;
	const hash = typeof params.hash === 'string' ? params.hash : '';
	if (hash === '')
	{
		return;
	}

	// Whose job the hash names is decided by the scenario and not here: the hash of a request in flight is
	// not known yet, and an event of that very moment is the one that must not be thrown away.
	// A job carrying an error ended in a refusal whichever command announced it.
	const error = readError(params);
	if (command === JobFailedCommand || error !== null)
	{
		applySubjectJobFailure(state, hash, error);

		return;
	}

	applySubjectJobResult(state, hash, readResult(params));
}

function readError(params: JobParams): AjaxError | null
{
	if (!Type.isObject(params.error))
	{
		return null;
	}

	const error = params.error as { code?: unknown, message?: unknown };
	const code = typeof error.code === 'string' || typeof error.code === 'number' ? error.code : undefined;

	return { code, message: typeof error.message === 'string' ? error.message : '' };
}

function readResult(params: JobParams): string
{
	if (!Type.isObject(params.data))
	{
		return '';
	}

	const result = (params.data as { result?: unknown }).result;

	return typeof result === 'string' ? result : '';
}
