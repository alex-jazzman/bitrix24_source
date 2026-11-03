/**
 * @module im/messenger/lib/copilot-simple-status
 */
jn.define('im/messenger/lib/copilot-simple-status', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const MILLISECONDS_IN_SECOND = 1000;

	const MINIMUM_TICK_DELAY = 1000;

	// PLAN-01: the name the server gives the plan in the params of the placeholder message. Unknown
	// params reach the model as they come, so this is also the key the plan has in the model.
	const COPILOT_SIMPLE_REASONING_PLAN_PARAM = 'COPILOT_SIMPLE_REASONING_PLAN';

	// The reasoning block the server puts on the placeholder: SendContextualStatus::THINKING_SEARCH_BLOCK_ID.
	const COPILOT_SIMPLE_REASONING_ELEMENT_ID = 'aiassistant-thinking-search';

	// ALG-01: seconds from startedAt past which a plan is no longer played. Normative and shared with
	// the server (ReasoningPlanPosition::STALE_PLAN_LIMIT).
	const STALE_PLAN_LIMIT = 900;

	// POOL-01: the server picks the phrase of a position from a fixed pool; the client uses the code
	// as a lang key, so only a code of that pool may reach the bubble.
	const REASONING_PLAN_CODE_PREFIX = 'AIASSISTANT_SIMPLE_REASONING_';

	// The server pool holds ten phrases; this is only a ceiling on the plan the client agrees to walk.
	const REASONING_PLAN_STEPS_LIMIT = 50;

	// Ceiling on startedAt: a reference point further ahead leaves the range setTimeout accepts.
	const REASONING_PLAN_FUTURE_LIMIT = 3600;

	// A delay past the range setTimeout accepts is cut to it and fires at once, tick after tick.
	const MAXIMUM_TICK_DELAY = STALE_PLAN_LIMIT * MILLISECONDS_IN_SECOND;

	/**
	 * @param {?CopilotSimpleReasoningPlan} plan
	 * @return {number}
	 */
	const getStartedAt = (plan) => (Type.isNumber(plan?.startedAt) ? plan.startedAt : 0);

	/**
	 * @param {?CopilotSimpleReasoningPlan} plan
	 * @return {Array<CopilotSimpleReasoningStep>}
	 */
	const getSteps = (plan) => (Type.isArrayFilled(plan?.steps) ? plan.steps : []);

	/**
	 * @param {?CopilotSimpleReasoningStep} step
	 * @return {number}
	 */
	const getStepOffset = (step) => (Type.isNumber(step?.offset) ? step.offset : 0);

	/**
	 * @return {number}
	 */
	const getNowSeconds = () => Math.floor(Date.now() / MILLISECONDS_IN_SECOND);

	/**
	 * ALG-01: positions of the plan fully passed by `atSeconds`, rounded down. The first position has
	 * offset zero, so only a client clock running behind the server yields zero. The position never
	 * exceeds the plan length: looping belongs to the show, not here.
	 *
	 * @param {?CopilotSimpleReasoningPlan} plan
	 * @param {number} atSeconds
	 * @return {number}
	 */
	function getReasoningPlanPosition(plan, atSeconds)
	{
		const steps = getSteps(plan);
		const elapsed = atSeconds - getStartedAt(plan);
		if (elapsed < 0)
		{
			return 0;
		}

		let passed = 0;
		for (const step of steps)
		{
			if (getStepOffset(step) > elapsed)
			{
				break;
			}

			passed += 1;
		}

		return Math.min(passed, steps.length);
	}

	/**
	 * PLAN-01: null for anything but a whole valid plan, otherwise the plan with nothing but its
	 * declared fields. The message model keeps no whitelist of params, so the plan reaches the client
	 * exactly as it came and this is the only place its form is checked. Same checks as on the web.
	 *
	 * @param {?CopilotSimpleReasoningPlan} plan
	 * @return {?CopilotSimpleReasoningPlan}
	 */
	function prepareReasoningPlan(plan)
	{
		if (!Type.isPlainObject(plan) || !Type.isInteger(plan.startedAt) || !Type.isArrayFilled(plan.steps))
		{
			return null;
		}

		const futureLimit = getNowSeconds() + REASONING_PLAN_FUTURE_LIMIT;
		if (plan.startedAt > futureLimit || plan.steps.length > REASONING_PLAN_STEPS_LIMIT)
		{
			return null;
		}

		// Offsets become timer delays: only whole, strictly growing seconds within the boundary of a plan
		// that is still played are playable. A larger one overflows the range setTimeout accepts.
		let previousOffset = -1;
		const isPlanStep = (step) => {
			if (!Type.isPlainObject(step) || !Type.isStringFilled(step.code) || !Type.isInteger(step.offset))
			{
				return false;
			}

			if (!step.code.startsWith(REASONING_PLAN_CODE_PREFIX) || step.offset <= previousOffset)
			{
				return false;
			}

			if (step.offset > STALE_PLAN_LIMIT)
			{
				return false;
			}

			previousOffset = step.offset;

			return true;
		};

		if (!plan.steps.every(isPlanStep))
		{
			return null;
		}

		return {
			startedAt: plan.startedAt,
			steps: plan.steps.map(({ code, offset }) => ({ code, offset })),
		};
	}

	/**
	 * ALG-01: a plan whose reference point is older than STALE_PLAN_LIMIT is not played.
	 *
	 * @param {?CopilotSimpleReasoningPlan} plan
	 * @param {number} atSeconds
	 * @return {boolean}
	 */
	function isReasoningPlanStale(plan, atSeconds)
	{
		return (atSeconds - getStartedAt(plan)) > STALE_PLAN_LIMIT;
	}

	/**
	 * How long a position stays on screen while the show loops. The client rolls no interval of its
	 * own, so the last position, which has no next offset, reuses the previous interval.
	 *
	 * @param {Array<CopilotSimpleReasoningStep>} steps
	 * @param {number} index
	 * @return {number}
	 */
	function getStepDuration(steps, index)
	{
		const nextStep = steps[index + 1];
		if (nextStep)
		{
			return getStepOffset(nextStep) - getStepOffset(steps[index]);
		}

		const previousStep = steps[index - 1];

		return previousStep ? getStepOffset(steps[index]) - getStepOffset(previousStep) : 0;
	}

	/**
	 * @class CopilotSimpleStatus
	 *
	 * Plays the reasoning plan of a BitrixGPT placeholder: the server owns the sequence and the
	 * intervals. One player per open chat, not one per application: the shows belong to the dialog
	 * that started them, and the same chat may be open by two dialogs at once.
	 */
	class CopilotSimpleStatus
	{
		/** @type {Map<string, CopilotSimpleStatusPlayback>} */
		#playbacks = new Map();

		constructor()
		{
			this.logger = getLoggerWithContext('copilot-simple-status', CopilotSimpleStatus);
		}

		/**
		 * @desc One playback per message: a repeated start restarts it from the position the plan is at
		 *       now instead of adding a second set of timers.
		 * @param {number|string} messageId
		 * @param {?CopilotSimpleReasoningPlan} plan
		 * @return {boolean} whether a playback is left running for this message
		 */
		start(messageId, plan)
		{
			this.stop(messageId);

			const playablePlan = prepareReasoningPlan(plan);
			if (!playablePlan)
			{
				return false;
			}

			const nowSeconds = getNowSeconds();
			if (isReasoningPlanStale(playablePlan, nowSeconds))
			{
				return false;
			}

			// The position counts passed positions, so the one on screen is the last of them. A clock
			// running behind the server yields zero, and the show still starts at the first position.
			const cursor = Math.max(getReasoningPlanPosition(playablePlan, nowSeconds), 1) - 1;

			this.#playbacks.set(String(messageId), { plan: playablePlan, cursor, looped: false, timerId: null });
			this.#show(messageId);

			// The show may have ended inside #show itself, so the answer is what is left running.
			return this.isPlaying(messageId);
		}

		/**
		 * @desc Whether a playback of this message is still running: the show also ends on its own, and
		 *       there is no event for that.
		 * @param {number|string} messageId
		 * @return {boolean}
		 */
		isPlaying(messageId)
		{
			return this.#playbacks.has(String(messageId));
		}

		/**
		 * @param {number|string} messageId
		 */
		stop(messageId)
		{
			const playback = this.#playbacks.get(String(messageId));
			if (!playback)
			{
				return;
			}

			if (playback.timerId !== null)
			{
				clearTimeout(playback.timerId);
			}

			this.#playbacks.delete(String(messageId));
		}

		/**
		 * @param {number|string} messageId
		 */
		#show(messageId)
		{
			const playback = this.#playbacks.get(String(messageId));
			if (!playback)
			{
				return;
			}

			// Asked on every tick, not only at the start: this is what covers a lost terminal signal.
			if (isReasoningPlanStale(playback.plan, getNowSeconds()))
			{
				this.stop(messageId);

				return;
			}

			const element = this.#getReasoningElement(messageId);
			if (!element)
			{
				// Nothing to repaint: the message brings its block along, so ticks would only burn timers.
				this.logger.warn('#show: no reasoning block on the message', messageId);
				this.stop(messageId);

				return;
			}

			if (!this.#updateStatus(messageId, element, playback.plan.steps[playback.cursor].code))
			{
				// A code unresolved now stays unresolved: the block keeps what the server put on it.
				this.stop(messageId);

				return;
			}

			const delay = this.#getNextDelay(playback);
			if (delay === null)
			{
				this.stop(messageId);

				return;
			}

			playback.timerId = setTimeout(() => this.#advance(messageId), delay);
		}

		/**
		 * @param {number|string} messageId
		 */
		#advance(messageId)
		{
			const playback = this.#playbacks.get(String(messageId));
			if (!playback)
			{
				return;
			}

			const nextCursor = (playback.cursor + 1) % playback.plan.steps.length;
			playback.looped = playback.looped || nextCursor === 0;

			// A client woken past several positions of the first pass jumps straight to the position the
			// plan is at now, instead of repainting the block on every missed one. A loop has nothing to
			// catch up to.
			playback.cursor = playback.looped
				? nextCursor
				: Math.max(nextCursor, getReasoningPlanPosition(playback.plan, getNowSeconds()) - 1);

			this.#show(messageId);
		}

		/**
		 * @desc Milliseconds until the next position, or null when there is nothing left to switch to.
		 *       The first pass targets the absolute plan time so a show picked up late catches up; a loop
		 *       reuses plan intervals. Both are capped: the timer layer holds its own bound.
		 * @param {CopilotSimpleStatusPlayback} playback
		 * @return {?number}
		 */
		#getNextDelay(playback)
		{
			const { plan, cursor, looped } = playback;
			const steps = plan.steps;
			if (steps.length < 2)
			{
				return null;
			}

			const nextCursor = (cursor + 1) % steps.length;
			if (looped || nextCursor === 0)
			{
				// A non-positive interval would reschedule with no delay, so such a plan is not looped.
				const duration = getStepDuration(steps, cursor) * MILLISECONDS_IN_SECOND;

				return duration > 0 ? Math.min(Math.max(duration, MINIMUM_TICK_DELAY), MAXIMUM_TICK_DELAY) : null;
			}

			const targetMs = (getStartedAt(plan) + getStepOffset(steps[nextCursor])) * MILLISECONDS_IN_SECOND;

			return Math.min(Math.max(0, targetMs - Date.now()), MAXIMUM_TICK_DELAY);
		}

		/**
		 * @param {number|string} messageId
		 * @return {?AiAssistantSearchBlockElementType}
		 */
		#getReasoningElement(messageId)
		{
			const store = serviceLocator.get('core').getStore();
			const block = store.getters['messagesModel/blockModel/getByMessageId'](messageId);

			return block?.elements?.find((item) => item.id === COPILOT_SIMPLE_REASONING_ELEMENT_ID) ?? null;
		}

		/**
		 * @desc False when the code of the position resolves to no phrase: an unresolved code would blank
		 *       the bubble the server has already filled. The native BX.message answers a missing key
		 *       with the key itself just as well as with an empty string.
		 * @param {number|string} messageId
		 * @param {AiAssistantSearchBlockElementType} element
		 * @param {string} code
		 * @return {boolean}
		 */
		#updateStatus(messageId, element, code)
		{
			const text = Loc.getMessage(code);
			if (!Type.isStringFilled(text) || text === code)
			{
				this.logger.warn('#updateStatus: no phrase for the plan code', code);

				return false;
			}

			// The block already carries this phrase, so the update would change nothing in the model while
			// still repainting it and writing the whole placeholder to the local base.
			if (element.text === text)
			{
				return true;
			}

			const store = serviceLocator.get('core').getStore();

			// The element is replaced as a whole, and its title comes from a phrase of the placeholder, so
			// a tick carries the stored element over and swaps nothing but the text. The write is not
			// awaited: a failed one is logged and the show goes on.
			store.dispatch('messagesModel/blockModel/updateElement', {
				messageId,
				elementId: element.id,
				element: { ...element, text },
				text,
			}).catch((error) => this.logger.error('#updateStatus.messagesModel/blockModel/updateElement.catch:', error));

			return true;
		}
	}

	module.exports = {
		CopilotSimpleStatus,
		COPILOT_SIMPLE_REASONING_PLAN_PARAM,
		getReasoningPlanPosition,
		isReasoningPlanStale,
		prepareReasoningPlan,
	};
});
