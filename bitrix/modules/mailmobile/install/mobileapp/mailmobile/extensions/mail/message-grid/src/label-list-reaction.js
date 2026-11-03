/**
 * @module mail/message-grid/src/label-list-reaction
 */
jn.define('mail/message-grid/src/label-list-reaction', (require, exports, module) => {
	/**
	 * What the list in the label mode does with a row whose label binding has just changed. Kept apart
	 * from the controller: the decision needs neither the store nor the list adapter behind it.
	 *
	 * @returns {'none'|'hide'|'restore'}
	 */
	const resolveLabelListReaction = ({ currentLabelId, changedLabelId, assigned, wasHidden }) => {
		if (Number(changedLabelId) !== Number(currentLabelId))
		{
			return 'none';
		}

		if (!assigned)
		{
			return 'hide';
		}

		return wasHidden ? 'restore' : 'none';
	};

	module.exports = { resolveLabelListReaction };
});
