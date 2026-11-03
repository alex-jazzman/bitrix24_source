import { isNavigationFailure } from 'ui.vue3.router';
import { Type } from 'main.core';

export const NAVIGATION_TIMEOUT_MS = 15000;

export function normalizeHash(hash)
{
	const value = Type.isString(hash) ? hash.trim() : '';
	if (value === '' || value === '#')
	{
		return '';
	}

	return value.startsWith('#') ? value : `#${value}`;
}

export class DocumentLinkNavigation
{
	#resolver;
	#chooseFullContext;
	#push;
	#notifyUnavailable;
	#reportViewed;
	#isNavigationFailure;
	#timeoutMs;
	#latestAttemptId = 0;
	#activeAttempt = null;
	#prepared = null;

	constructor(options)
	{
		this.#resolver = options.resolver;
		this.#chooseFullContext = options.chooseFullContext;
		this.#push = options.push;
		this.#notifyUnavailable = options.notifyUnavailable;
		this.#reportViewed = options.reportViewed;
		this.#isNavigationFailure = options.isNavigationFailure ?? isNavigationFailure;
		this.#timeoutMs = Type.isNumber(options.timeoutMs) && Number.isFinite(options.timeoutMs)
			? Math.max(0, Number(options.timeoutMs))
			: NAVIGATION_TIMEOUT_MS
		;
	}

	async openInternalDocument(target)
	{
		const documentId = Number(target?.id);
		if (!Number.isInteger(documentId) || documentId <= 0)
		{
			return 'rejected';
		}

		const hash = normalizeHash(target?.hash);
		const attempt = this.#beginAttempt(documentId, hash);
		const outcome = await this.#resolve(attempt);

		if (outcome.status === 'cancelled')
		{
			return 'stale';
		}

		if (outcome.status === 'timeout')
		{
			this.#notifyUnavailable();

			return 'rejected';
		}

		if (attempt.id !== this.#latestAttemptId)
		{
			return 'stale';
		}

		if (outcome.status === 'error' || outcome.result.status !== 'ready')
		{
			this.#notifyUnavailable();
			this.#cancelAttemptIfCurrent(attempt.id);

			return 'rejected';
		}

		if (!this.#activeAttempt || this.#activeAttempt.id !== attempt.id)
		{
			return 'stale';
		}

		this.#activeAttempt.phase = 'navigating';
		this.#prepared = {
			attemptId: attempt.id,
			documentId,
			hash,
			result: outcome.result,
		};

		let navigationResult = null;
		try
		{
			navigationResult = await this.#push({
				name: 'document',
				params: { id: documentId },
				...(hash === '' ? {} : { hash }),
			});
		}
		catch
		{
			this.#cancelAttemptIfCurrent(attempt.id);

			return 'rejected';
		}

		if (this.#isNavigationFailure(navigationResult))
		{
			this.#cancelAttemptIfCurrent(attempt.id);

			return 'rejected';
		}

		if (attempt.id !== this.#latestAttemptId)
		{
			return 'stale';
		}

		this.#reportViewed();
		this.#clearAttempt(attempt.id);

		return 'opened';
	}

	onRouteAfterEach(to, failure = null)
	{
		const attempt = this.#activeAttempt;
		if (
			!failure
			&& attempt?.phase === 'navigating'
			&& Number(to?.params?.id) === attempt.documentId
			&& normalizeHash(to?.hash) === attempt.hash
		)
		{
			return { kind: 'own_navigation', attemptId: attempt.id };
		}

		this.cancelActiveAttempt();

		return { kind: 'foreign_or_failed_navigation', attemptId: null };
	}

	finalizeRouteSync(attemptId)
	{
		if (attemptId !== null && this.#prepared?.attemptId === attemptId)
		{
			this.#prepared = null;
		}
	}

	consumePrepared(documentId, hash)
	{
		const prepared = this.#prepared;
		if (
			!prepared
			|| prepared.attemptId !== this.#latestAttemptId
			|| prepared.documentId !== Number(documentId)
			|| prepared.hash !== normalizeHash(hash)
		)
		{
			return null;
		}

		this.#prepared = null;

		return prepared.result;
	}

	cancelActiveAttempt()
	{
		this.#latestAttemptId += 1;
		this.#settleActiveAttempt({ status: 'cancelled' });
		this.#activeAttempt = null;
		this.#prepared = null;
	}

	#beginAttempt(documentId, hash)
	{
		this.cancelActiveAttempt();
		const attempt = {
			id: ++this.#latestAttemptId,
			documentId,
			hash,
			phase: 'resolving',
			timer: null,
			settle: null,
		};
		this.#activeAttempt = attempt;

		return attempt;
	}

	#resolve(attempt)
	{
		return new Promise((resolve) => {
			const activeAttempt = this.#activeAttempt;
			if (!activeAttempt || activeAttempt.id !== attempt.id)
			{
				resolve({ status: 'cancelled' });

				return;
			}

			activeAttempt.settle = resolve;
			activeAttempt.timer = setTimeout(() => {
				if (this.#activeAttempt?.id !== attempt.id)
				{
					return;
				}

				this.#settleActiveAttempt({ status: 'timeout' });
				this.#latestAttemptId += 1;
				this.#activeAttempt = null;
				this.#prepared = null;
			}, this.#timeoutMs);

			void this.#resolver
				.resolve(attempt.documentId, {
					fullContext: Boolean(this.#chooseFullContext(attempt.documentId)),
				})
				.then(
					(result) => this.#settleAttempt(attempt.id, { status: 'resolved', result }),
					() => this.#settleAttempt(attempt.id, { status: 'error' }),
				)
			;
		});
	}

	#settleAttempt(attemptId, outcome)
	{
		if (this.#activeAttempt?.id === attemptId)
		{
			this.#settleActiveAttempt(outcome);
		}
	}

	#settleActiveAttempt(outcome)
	{
		const attempt = this.#activeAttempt;
		if (!attempt)
		{
			return;
		}

		if (attempt.timer !== null)
		{
			clearTimeout(attempt.timer);
			attempt.timer = null;
		}

		const settle = attempt.settle;
		attempt.settle = null;
		settle?.(outcome);
	}

	#cancelAttemptIfCurrent(attemptId)
	{
		if (this.#activeAttempt?.id === attemptId)
		{
			this.cancelActiveAttempt();
		}
	}

	#clearAttempt(attemptId)
	{
		if (this.#activeAttempt?.id === attemptId)
		{
			this.#settleActiveAttempt({ status: 'cancelled' });
			this.#activeAttempt = null;
		}

		if (this.#prepared?.attemptId === attemptId)
		{
			this.#prepared = null;
		}
	}
}
