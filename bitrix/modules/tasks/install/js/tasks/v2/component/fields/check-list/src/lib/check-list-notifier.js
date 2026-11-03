import { Loc, Text, Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { UI } from 'ui.notification';
import { LiveAnnouncer } from 'ui.a11y';

import { formatPluralPhrase } from 'tasks.v2.lib.plural-phrase';

type Params = {
	content: string,
	timerValue?: number,
}

export class CheckListNotifier extends EventEmitter
{
	/**
	 * Toast for a finished add: one whole phrase per outcome, also announced politely to screen
	 * readers. Zero never reaches the plural forms: each zero boundary picks a different sentence
	 * instead of leaving a part of one out.
	 */
	static notifyItemsAdded(added: number, skipped: number): void
	{
		// Contract guard: the only caller today returns earlier, showing the all-duplicates toast itself.
		if (added === 0)
		{
			CheckListNotifier.notifyAllDuplicates();

			return;
		}

		if (skipped === 0)
		{
			CheckListNotifier.#notifyAddedOnly(added);

			return;
		}

		const content = formatPluralPhrase(
			'TASKS_V2_CHECK_LIST_ADD_RESULT_ADDED_SKIPPED',
			[added, skipped],
			{ '#added#': added, '#skipped#': skipped },
		);

		if (content !== null)
		{
			CheckListNotifier.#notifyResult(content, 'polite');

			return;
		}

		// Last resort: every shipped locale carries the key, so this only keeps the toast
		// non-empty if one of them ever loses it.
		CheckListNotifier.#notifyAddedOnly(added);
	}

	static notifyAllDuplicates(): void
	{
		CheckListNotifier.#notifyResult(
			Loc.getMessage('TASKS_V2_CHECK_LIST_ADD_RESULT_ALL_DUPLICATES'),
			'polite',
		);
	}

	/**
	 * Error toast with a "Retry" action, announced assertively. Retry renders as a non-focusable
	 * span, so screen readers are told the action can be re-triggered rather than reading the toast.
	 */
	static notifyServerError(onRetry: () => void): void
	{
		const content = Loc.getMessage('TASKS_V2_CHECK_LIST_ADD_RESULT_ERROR');

		UI.Notification.Center.notify({
			content,
			actions: [{
				title: Loc.getMessage('TASKS_V2_CHECK_LIST_ADD_RESULT_RETRY'),
				events: {
					mouseup: (event: Event, balloon: BX.UI.Notification.Balloon): void => {
						balloon.close();
						onRetry();
					},
				},
			}],
		});

		LiveAnnouncer.announce(
			Loc.getMessage('TASKS_V2_CHECK_LIST_ADD_RESULT_ERROR_ANNOUNCE'),
			'assertive',
		);
	}

	/**
	 * Panel actions in the task card body save on their own, with no closing save behind them, so
	 * a save that did not go through is announced assertively: the row keeps showing the change
	 * the server never took, and only a reload would reveal the loss.
	 */
	static notifySaveFailed(): void
	{
		CheckListNotifier.#notifyResult(Loc.getMessage('TASKS_V2_CHECK_LIST_SAVE_FAILED'), 'assertive');
	}

	static notifySaveBlockedByEmptyItem(): void
	{
		CheckListNotifier.#notifyResult(
			Loc.getMessage('TASKS_V2_CHECK_LIST_SAVE_BLOCKED_EMPTY_ITEM'),
			'assertive',
		);
	}

	static #notifyAddedOnly(added: number): void
	{
		CheckListNotifier.#notifyResult(
			Loc.getMessagePlural('TASKS_V2_CHECK_LIST_ADD_RESULT_ADDED', added, { '#added#': added }),
			'polite',
		);
	}

	static #notifyResult(content: string, politeness: string): void
	{
		UI.Notification.Center.notify({ content });

		LiveAnnouncer.announce(content, politeness);
	}

	#interval: ?number = null;
	#timerValue: number = 5;
	#counter: number = 5;
	#content: string = '';
	#completed: boolean = false;

	#balloonWithTimer: ?BX.UI.Notification.Balloon = null;

	constructor(params: Params)
	{
		super();

		this.setEventNamespace('Tasks.V2.CheckList.CheckListNotifier');

		this.#content = params.content;
		this.#timerValue = Type.isUndefined(params.timerValue) ? this.#timerValue : params.timerValue;
	}

	showBalloonWithTimer(): void
	{
		if (this.#balloonWithTimer !== null)
		{
			return;
		}

		this.#counter = this.#timerValue;

		const balloonId = `check-list-balloon-${Text.getRandom()}`;

		this.#balloonWithTimer = UI.Notification.Center.notify({
			id: balloonId,
			content: this.#getBalloonContent(),
			actions: [{
				title: Loc.getMessage('TASKS_V2_CHECK_LIST_BALLOON_CANCEL'),
				events: {
					mouseup: this.#handleCancelClick.bind(this),
				},
			}],
		});

		const handler = (baseEvent: BaseEvent) => {
			const closingBalloon = baseEvent.getTarget();
			if (closingBalloon.getId() === balloonId)
			{
				this.#handleClosingBalloon();

				EventEmitter.unsubscribe('UI.Notification.Balloon:onClose', handler);
			}
		};

		EventEmitter.subscribe('UI.Notification.Balloon:onClose', handler);

		this.#startTimer();
	}

	stopTimer(): void
	{
		if (this.#complete(true))
		{
			this.#balloonWithTimer?.close();
		}
	}

	#startTimer(): void
	{
		this.#interval = setInterval(() => {
			this.#counter--;

			this.#balloonWithTimer.update({ content: this.#getBalloonContent() });

			if (this.#counter <= 0)
			{
				this.stopTimer();
			}
		}, 1000);
	}

	#handleCancelClick()
	{
		if (this.#complete(false))
		{
			this.#balloonWithTimer?.close();
		}
	}

	#handleClosingBalloon()
	{
		this.#complete(true);
	}

	#complete(timerHasEnded: boolean): boolean
	{
		if (this.#completed)
		{
			return false;
		}

		this.#completed = true;
		clearInterval(this.#interval);
		this.#interval = null;
		this.emit('complete', timerHasEnded);

		return true;
	}

	#getBalloonContent(): string
	{
		return this.#content.replace('#countdown#', this.#counter);
	}
}
