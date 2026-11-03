/**
 * @module im/messenger/controller/vote/result/src/percent
 */
jn.define('im/messenger/controller/vote/result/src/percent', (require, exports, module) => {
	/**
	 * Share of the votes cast for an answer. A question with no votes yet has no share,
	 * and dividing by its counter would print NaN.
	 *
	 * @param {number} votedCounter
	 * @param {number} questionVotedCounter
	 * @return {number}
	 */
	const calculateVotedPercent = (votedCounter, questionVotedCounter) => (
		questionVotedCounter > 0
			? Math.round(votedCounter / questionVotedCounter * 100)
			: 0
	);

	module.exports = { calculateVotedPercent };
});
