/**
 * @module animation/animated
 */
jn.define('animation/animated', (require, exports, module) => {
	/**
	 * @class Animate
	 */
	class Animate
	{
		/**
		 * @param {number} value
		 * @return {CalculatedValue}
		 */
		static newCalculatedValue(value)
		{
			// eslint-disable-next-line no-undef
			return Animated.newCalculatedValue(value);
		}

		/**
		 * @param {number} value1
		 * @param {number} value2
		 * @return {CalculatedValue2D}
		 */
		static newCalculatedValue2D(value1, value2)
		{
			// eslint-disable-next-line no-undef
			return Animated.newCalculatedValue2D(value1, value2);
		}

		/**
		 * @param {CalculatedValue} value
		 * @param {TimingConfig} config
		 * @return {JNCalculatedAnimation}
		 */
		static timing(value, config)
		{
			// eslint-disable-next-line no-undef
			return Animated.timing(value, config);
		}

		/**
		 * Plays the animations together and reports once they have all finished.
		 * Runtimes that predate the group primitive have none of it, so a consumer that cannot afford
		 * an exception asks isParallelSupported first.
		 * @param {Array<JNCalculatedAnimation>} animations
		 * @param {{ stopTogether?: boolean }} [config]
		 * @return {JNCalculatedAnimation}
		 */
		static parallel(animations, config = {})
		{
			// eslint-disable-next-line no-undef
			return Animated.parallel(animations, config);
		}

		/**
		 * @return {boolean}
		 */
		static isParallelSupported()
		{
			// eslint-disable-next-line no-undef
			return typeof Animated.parallel === 'function';
		}

		/**
		 * @param {Array<JNCalculatedAnimation>} animations
		 * @param {StaggerConfig} config
		 * @return {JNCalculatedAnimation}
		 */
		static stagger(animations, config)
		{
			// eslint-disable-next-line no-undef
			return Animated.stagger(animations, config);
		}
	}

	module.exports = {
		Animated: Animate,
	};
});
