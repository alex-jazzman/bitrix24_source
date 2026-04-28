/**
 * @module animation/components/blink-view
 */
jn.define('animation/components/blink-view', (require, exports, module) => {
	const { isObjectLike } = require('utils/object');

	/**
	 * @class BlinkView
	 *
	 * @param {object} props
	 * @param {*} [props.data]
	 * @param {function(*): *} [props.slot]
	 * @param {object} [props.style]
	 * @param {string} [props.highlightColor]
	 * @param {object} [props.animation]
	 * @param {number} [props.animation.delay=0]
	 * @param {number} [props.animation.fadeOutDuration=200]
	 * @param {number} [props.animation.fadeInDuration=300]
	 * @param {number} [props.animation.highlightDuration=800]
	 */
	class BlinkView extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.containerRef = null;

			this.state = this.buildState(props);
		}

		buildState(props)
		{
			return {
				hidden: false,
				highlighted: false,
				data: props.data,
			};
		}

		componentWillReceiveProps(props)
		{
			this.state = this.buildState(props);
		}

		get animation()
		{
			const settings = isObjectLike(this.props.animation) ? this.props.animation : {};
			const optional = (value, defaultValue) => (typeof value === 'undefined' ? defaultValue : value);

			return {
				delay: optional(settings.delay, 0),
				fadeOutDuration: optional(settings.fadeOutDuration, 200),
				fadeInDuration: optional(settings.fadeInDuration, 300),
				highlightDuration: optional(settings.highlightDuration, 800),
			};
		}

		render()
		{
			return View(
				{
					ref: (ref) => {
						this.containerRef = ref;
					},
					style: {
						opacity: this.state.hidden ? 0 : 1,
						...this.props.style,
					},
				},
				this.renderSlot(),
				this.#renderHighlight(),
			);
		}

		#renderHighlight()
		{
			const { highlightColor } = this.props;
			if (!highlightColor || !this.state.highlighted)
			{
				return null;
			}

			return View({
				ref: (ref) => {
					this.highlightRef = ref;
				},
				style: {
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: highlightColor,
				},
			});
		}

		renderSlot()
		{
			if (this.props.slot)
			{
				return this.props.slot(this.state.data);
			}

			return null;
		}

		/**
		 * @public
		 * @param {*} data
		 * @returns {Promise}
		 */
		blink(data)
		{
			if (!this.containerRef)
			{
				return Promise.resolve();
			}

			if (this.props.highlightColor)
			{
				return this.#blinkWithHighlight();
			}

			const blinkData = typeof data === 'undefined' ? this.state.data : data;
			const fadeOut = () => new Promise((resolve) => {
				this.containerRef.animate({
					delay: this.animation.delay,
					duration: this.animation.fadeOutDuration,
					opacity: 0,
				}, resolve);
			});

			const fadeIn = () => new Promise((resolve) => {
				this.containerRef.animate({
					duration: this.animation.fadeInDuration,
					opacity: 1,
				}, resolve);
			});

			return Promise.resolve()
				.then(() => fadeOut())
				.then(() => this.#promiseState({ blinkData, hidden: true }))
				.then(() => fadeIn())
				.then(() => this.#promiseState({ hidden: false }));
		}

		#blinkWithHighlight()
		{
			const fadeOutHighlight = () => new Promise((resolve) => {
				this.highlightRef?.animate({
					duration: this.animation.highlightDuration,
					opacity: 0,
				}, resolve);
			});

			return this.#promiseState({ highlighted: true })
				.then(() => fadeOutHighlight())
				.then(() => this.#promiseState({ highlighted: false }));
		}

		#promiseState(nextState)
		{
			return new Promise((resolve) => {
				this.setState(nextState, resolve);
			});
		}
	}

	module.exports = { BlinkView };
});
