/**
 * @module im/messenger/const/ai-task
 */
jn.define('im/messenger/const/ai-task', (require, exports, module) => {
	const AiTasksStatusType = {
		search: 'search',
		taskCreationStarted: 'taskCreationStarted',
		taskCreationCompleted: 'taskCreationCompleted',
		resultCreationStarted: 'resultCreationStarted',
		resultCreationCompleted: 'resultCreationCompleted',
		notFound: 'notFound',
		animationInterrupted: 'animationInterrupted',
	};

	/**
	 * @desc Role of a message inside a single AI-task indication operation. The anchor role marks the
	 * message carrying the status row - the latest one with the frame, not necessarily the anchor of the
	 * operation: the rest of the set gets the same frame without text and icon, because the native side
	 * draws every frame it receives and gives no aggregating surface for the whole set.
	 */
	class AiTaskIndicationRole
	{
		static anchor = 'anchor';
		static member = 'member';

		/**
		 * @desc Whether the message is drawn by the message-level indication at all. The role is written
		 * by the indication manager only, so its absence tells the per-bubble track of a voice message
		 * apart from an operation of the new one.
		 * @param {string} [role]
		 * @return {boolean}
		 */
		static isIndicationRole(role)
		{
			return role === AiTaskIndicationRole.anchor || role === AiTaskIndicationRole.member;
		}
	}

	/**
	 * @desc Indication statuses that have no counterpart in the AutoTaskStatus pull event: the first
	 * frame is raised locally on tap, and switching the indication off is a frame of its own, because
	 * the native field carries no state flag. Server-driven frames are keyed by AiTasksStatusType.
	 */
	const AiTaskIndicationStatus = {
		preparing: 'preparing',
		off: 'off',
	};

	module.exports = { AiTasksStatusType, AiTaskIndicationRole, AiTaskIndicationStatus };
});
