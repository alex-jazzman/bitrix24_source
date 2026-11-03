/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_const, im_v2_lib_logger) {
	'use strict';

	const MILLISECONDS_IN_SECOND = 1000;
	const MINIMUM_TICK_DELAY = 1000;

	// A delay past the range setTimeout accepts is cut to it and fires at once, tick after tick.
	const MAXIMUM_TICK_DELAY = im_v2_const.CopilotSimpleReasoningStalePlanLimit * MILLISECONDS_IN_SECOND;

	// POOL-01: the server picks the phrase of a position from a fixed pool; the client uses the code as a
	// lang key, so only a code of that pool may reach the bubble.
	const REASONING_PLAN_CODE_PREFIX = 'AIASSISTANT_SIMPLE_REASONING_';

	// The server pool holds ten phrases; this is only a ceiling on the plan the client agrees to walk.
	const REASONING_PLAN_STEPS_LIMIT = 50;

	// Ceiling on startedAt: a reference point further ahead leaves the range setTimeout accepts.
	const REASONING_PLAN_FUTURE_LIMIT = 3600;

	// A loaded message brings its reasoning block in with this action, and the blocks land after the
	// message itself: a show started earlier would be overwritten by the blocks of the load.
	const LOADED_BLOCKS_ACTION = 'messages/builder/set';
	const getNowSeconds = () => Math.floor(Date.now() / MILLISECONDS_IN_SECOND);
	const getStartedAt = plan => {
		return main_core.Type.isNumber(plan?.startedAt) ? plan.startedAt : 0;
	};
	const getSteps = plan => {
		return main_core.Type.isArrayFilled(plan?.steps) ? plan.steps : [];
	};
	const getStepOffset = step => {
		return main_core.Type.isNumber(step?.offset) ? step.offset : 0;
	};

	// ALG-01: rounded down, and must match the server calculation.
	const getReasoningPlanPosition = (plan, atSeconds) => {
		const steps = getSteps(plan);
		const elapsed = atSeconds - getStartedAt(plan);
		if (elapsed < 0) {
			return 0;
		}
		let passed = 0;
		for (const step of steps) {
			if (getStepOffset(step) > elapsed) {
				break;
			}
			passed += 1;
		}
		return Math.min(passed, steps.length);
	};

	// PLAN-01: null for anything but a whole valid plan, otherwise the plan with nothing but its declared
	// fields. The single form border on the web: the message model and the show both run it.
	const prepareReasoningPlan = plan => {
		if (!main_core.Type.isPlainObject(plan) || !main_core.Type.isInteger(plan.startedAt) || !main_core.Type.isArrayFilled(plan.steps)) {
			return null;
		}
		const futureLimit = getNowSeconds() + REASONING_PLAN_FUTURE_LIMIT;
		if (plan.startedAt > futureLimit || plan.steps.length > REASONING_PLAN_STEPS_LIMIT) {
			return null;
		}

		// Offsets become timer delays: only whole, strictly growing seconds within the boundary of a plan
		// that is still played are playable. A larger one overflows the range setTimeout accepts.
		let previousOffset = -1;
		const isPlanStep = step => {
			if (!main_core.Type.isPlainObject(step) || !main_core.Type.isStringFilled(step.code) || !main_core.Type.isInteger(step.offset)) {
				return false;
			}
			if (!step.code.startsWith(REASONING_PLAN_CODE_PREFIX) || step.offset <= previousOffset) {
				return false;
			}
			if (step.offset > im_v2_const.CopilotSimpleReasoningStalePlanLimit) {
				return false;
			}
			previousOffset = step.offset;
			return true;
		};
		if (!plan.steps.every(isPlanStep)) {
			return null;
		}
		const steps = plan.steps.map(({
			code,
			offset
		}) => ({
			code,
			offset
		}));
		return {
			startedAt: plan.startedAt,
			steps
		};
	};
	const isReasoningPlanStale = (plan, atSeconds) => {
		return atSeconds - getStartedAt(plan) > im_v2_const.CopilotSimpleReasoningStalePlanLimit;
	};

	// Dwell of a position while the show loops; the last one has no next offset and reuses the previous interval.
	const getStepDuration = (steps, index) => {
		const nextStep = steps[index + 1];
		if (nextStep) {
			return getStepOffset(nextStep) - getStepOffset(steps[index]);
		}
		const previousStep = steps[index - 1];
		return previousStep ? getStepOffset(steps[index]) - getStepOffset(previousStep) : 0;
	};

	// Plays the reasoning plan of a BitrixGPT placeholder: the server owns the sequence and its intervals.
	class CopilotSimpleStatus {
		static #instance;
		#playbacks = new Map();
		static getInstance() {
			this.#instance ??= new this();
			return this.#instance;
		}
		constructor() {
			this.#watchLoadedMessages();
		}

		// The show may end inside the start itself, so the caller gets what is left running.
		start(messageId, plan) {
			this.stop(messageId);
			const playablePlan = prepareReasoningPlan(plan);
			if (!playablePlan) {
				return false;
			}
			const nowSeconds = getNowSeconds();
			if (isReasoningPlanStale(playablePlan, nowSeconds)) {
				return false;
			}

			// The position counts passed positions, so the one shown is the last of them; zero means clock lag.
			const cursor = Math.max(getReasoningPlanPosition(playablePlan, nowSeconds), 1) - 1;
			this.#playbacks.set(String(messageId), {
				plan: playablePlan,
				cursor,
				looped: false,
				timerId: null
			});
			this.#show(messageId);
			return this.#playbacks.has(String(messageId));
		}
		stop(messageId) {
			const playback = this.#playbacks.get(String(messageId));
			if (!playback) {
				return;
			}
			if (playback.timerId !== null) {
				clearTimeout(playback.timerId);
			}
			this.#playbacks.delete(String(messageId));
		}

		// The server publishes no event for a turn already running: a loaded message with a plan is the only way back.
		restore(messageId) {
			const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
			const plan = message?.[im_v2_const.CopilotSimpleReasoningPlanField];
			if (plan) {
				this.start(messageId, plan);
			}
		}
		#watchLoadedMessages() {
			// The player is a page singleton with no teardown point, so the subscription is never disposed.
			im_v2_application_core.Core.getStore().subscribeAction({
				after: action => {
					if (action.type !== LOADED_BLOCKS_ACTION) {
						return;
					}
					const rawMessages = main_core.Type.isArray(action.payload) ? action.payload : [action.payload];
					rawMessages.filter(rawMessage => Boolean(rawMessage?.block)).forEach(rawMessage => this.restore(rawMessage.id));
				}
			});
		}
		#show(messageId) {
			const playback = this.#playbacks.get(String(messageId));
			if (!playback) {
				return;
			}

			// Asked on every tick, not only at the start: this is what covers a lost terminal signal.
			if (isReasoningPlanStale(playback.plan, getNowSeconds())) {
				this.stop(messageId);
				return;
			}
			const block = this.#getReasoningBlock(messageId);
			if (!block) {
				// Nothing to repaint: a load of the blocks brings the show back, ticks until then only burn timers.
				im_v2_lib_logger.Logger.warn('CopilotSimpleStatus: no reasoning block on the message', messageId);
				this.stop(messageId);
				return;
			}
			if (!this.#dispatchStatus(messageId, block, playback.plan.steps[playback.cursor].code)) {
				// A code unresolved now stays unresolved: the block keeps what the server put on it.
				this.stop(messageId);
				return;
			}
			const delay = this.#getNextDelay(playback);
			if (delay === null) {
				this.stop(messageId);
				return;
			}
			playback.timerId = setTimeout(() => this.#advance(messageId), delay);
		}
		#advance(messageId) {
			const playback = this.#playbacks.get(String(messageId));
			if (!playback) {
				return;
			}
			const nextCursor = (playback.cursor + 1) % playback.plan.steps.length;
			playback.looped = playback.looped || nextCursor === 0;

			// A tab frozen past several positions of the first pass jumps straight to the position the plan
			// is at now, instead of repainting the block on every missed one. A loop has nothing to catch up to.
			playback.cursor = playback.looped ? nextCursor : Math.max(nextCursor, getReasoningPlanPosition(playback.plan, getNowSeconds()) - 1);
			this.#show(messageId);
		}

		// The first pass targets the absolute plan time so a late tab catches up; a loop reuses plan intervals.
		// Both are capped: the timer layer holds its own bound whatever plan reached it.
		#getNextDelay(playback) {
			const {
				plan,
				cursor,
				looped
			} = playback;
			const steps = plan.steps;
			if (steps.length < 2) {
				return null;
			}
			const nextCursor = (cursor + 1) % steps.length;
			if (looped || nextCursor === 0) {
				// A non-positive interval would reschedule with no delay, so such a plan is not looped.
				const duration = getStepDuration(steps, cursor) * MILLISECONDS_IN_SECOND;
				return duration > 0 ? Math.min(Math.max(duration, MINIMUM_TICK_DELAY), MAXIMUM_TICK_DELAY) : null;
			}
			const targetMs = (getStartedAt(plan) + getStepOffset(steps[nextCursor])) * MILLISECONDS_IN_SECOND;
			return Math.min(Math.max(0, targetMs - Date.now()), MAXIMUM_TICK_DELAY);
		}
		#getReasoningBlock(messageId) {
			return im_v2_application_core.Core.getStore().getters['messages/builder/getBlocks'](messageId).find(item => item.id === im_v2_const.AiAssistantThinkingBlockId);
		}

		// False when the code of the position resolves to no phrase: the show has nothing to put on the block.
		#dispatchStatus(messageId, block, code) {
			// The codes resolve only while im.v2.component.message-list keeps pulling the aiassistant pool
			// into BX.message through its lang_additional: this library owns no phrases and cannot ask for
			// them in rel.
			const text = main_core.Loc.getMessage(code);
			if (!main_core.Type.isStringFilled(text)) {
				im_v2_lib_logger.Logger.warn('CopilotSimpleStatus: no phrase for the plan code', code);
				return false;
			}

			// The block already carries this phrase - the server seeds the first one itself - and the
			// update would change nothing in the model while still repainting the block.
			if (block.text === text) {
				return true;
			}

			// updateBlock replaces the block as a whole, and its title comes from a phrase the client never gets.
			void im_v2_application_core.Core.getStore().dispatch('messages/builder/updateBlock', {
				messageId,
				blockId: im_v2_const.AiAssistantThinkingBlockId,
				block: {
					...block,
					text
				}
			});
			return true;
		}
	}

	exports.CopilotSimpleStatus = CopilotSimpleStatus;
	exports.getReasoningPlanPosition = getReasoningPlanPosition;
	exports.isReasoningPlanStale = isReasoningPlanStale;
	exports.prepareReasoningPlan = prepareReasoningPlan;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=copilot-simple-status.bundle.js.map
