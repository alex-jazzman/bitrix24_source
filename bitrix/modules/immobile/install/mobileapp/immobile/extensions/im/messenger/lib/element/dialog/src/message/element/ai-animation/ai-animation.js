/**
 * @module im/messenger/lib/element/dialog/message/element/ai-animation/ai-animation
 */
jn.define('im/messenger/lib/element/dialog/message/element/ai-animation/ai-animation', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Loc } = require('im/messenger/loc');
	const {
		AiTasksStatusType,
		AiTaskIndicationRole,
		AiTaskIndicationStatus,
	} = require('im/messenger/const');

	/**
	 * @desc Status row of the message with the anchor role, one entry per operation status.
	 * Color subfields are left out on purpose: the palette belongs to the native side,
	 * exactly as it does for the per-bubble animation of a voice message.
	 * @type {Object<string, {text: string, iconName: string}>}
	 */
	const AnchorFrameByStatus = {
		[AiTaskIndicationStatus.preparing]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AI_TASK_STATUS_PREPARING'),
			iconName: Icon.AI_STARS.getIconName(),
		},
		[AiTasksStatusType.search]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AI_TASK_STATUS_CREATING'),
			iconName: Icon.AI_STARS.getIconName(),
		},
		[AiTasksStatusType.taskCreationStarted]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AI_TASK_STATUS_PROCESSING'),
			iconName: Icon.AI_STARS.getIconName(),
		},
		[AiTasksStatusType.taskCreationCompleted]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AI_TASK_STATUS_DONE'),
			iconName: Icon.CIRCLE_CHECK.getIconName(),
		},
		[AiTasksStatusType.resultCreationStarted]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AI_TASK_ADD_RESULT_TEXT'),
			iconName: Icon.AI_STARS.getIconName(),
		},
		[AiTasksStatusType.resultCreationCompleted]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AI_TASK_ADD_RESULT_COMPLETE_TEXT'),
			iconName: Icon.CIRCLE_CHECK.getIconName(),
		},
		[AiTasksStatusType.notFound]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AI_TASK_STATUS_ERROR'),
			iconName: Icon.ALERT_ACCENT.getIconName(),
		},
	};

	/**
	 * @desc Task creation splits in two outcomes: the pull event marks the result as partial when the
	 * task was made out of a part of the selected messages only.
	 * @type {{text: string, iconName: string}}
	 */
	const PartialTaskCreationFrame = {
		text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AI_TASK_STATUS_PARTIAL'),
		iconName: Icon.AI_PROCESS.getIconName(),
	};

	/**
	 * @class AiAnimation
	 * @desc Builds the message-level aiAnimation field out of the AI-task indication state kept in
	 * visualState. A pure function of the message model: no store, no locator, no timers - the
	 * lifecycle of the operation belongs to the indication manager of the dialog.
	 */
	class AiAnimation
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @return {AiAnimationMessageData|null} field value, or null when the message carries no indication
		 */
		static createByMessageModel(modelMessage)
		{
			const visualState = modelMessage?.visualState;
			const role = visualState?.aiTaskRole;

			// The role is written by the indication manager only, so its absence tells the old
			// per-bubble track of a voice message apart from an operation of the new one.
			if (!AiTaskIndicationRole.isIndicationRole(role))
			{
				return null;
			}

			// The field has no state subfield, so a frame with the animation off is the only way
			// to take a running indication down.
			if (visualState.aiTaskStatus === AiTaskIndicationStatus.off)
			{
				return { animate: false };
			}

			const frame = AiAnimation.#getAnchorFrame(visualState.aiTaskStatus, Boolean(visualState.aiTaskPartial));
			if (!frame)
			{
				return null;
			}

			// One status row per operation: a member of the set gets the glow alone.
			if (role === AiTaskIndicationRole.member)
			{
				return { animate: true };
			}

			return {
				text: frame.text,
				iconName: frame.iconName,
				animate: true,
			};
		}

		/**
		 * @param {string} [status]
		 * @param {boolean} isPartial
		 * @return {{text: string, iconName: string}|null} null for a status the client does not know
		 */
		static #getAnchorFrame(status, isPartial)
		{
			if (status === AiTasksStatusType.taskCreationCompleted && isPartial)
			{
				return PartialTaskCreationFrame;
			}

			if (!Object.prototype.hasOwnProperty.call(AnchorFrameByStatus, status))
			{
				return null;
			}

			return AnchorFrameByStatus[status];
		}
	}

	module.exports = { AiAnimation };
});
