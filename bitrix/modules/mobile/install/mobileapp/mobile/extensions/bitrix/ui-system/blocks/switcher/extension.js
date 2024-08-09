/**
 * @module ui-system/blocks/switcher
 */
jn.define('ui-system/blocks/switcher', (require, exports, module) => {
	const { transition, parallel } = require('animation');
	const { SwitcherMode } = require('ui-system/blocks/switcher/src/mode-enum');
	const { SwitcherSize } = require('ui-system/blocks/switcher/src/size-enum');

	/**
	 * class Switcher
	 */
	class Switcher extends LayoutComponent
	{
		/**
		 * @param props
		 * @param {string} props.testId
		 * @param {boolean} [props.useState=true]
		 * @param {SwitcherMode} [props.mode=SwitcherMode.SOLID]
		 * @param {object} [props.trackColor]
		 * @param {object} [props.thumbColor]
		 * @param {function} [props.onClick]
		 */
		constructor(props)
		{
			super(props);

			this.thumbRef = null;
			this.trackRef = null;
			this.animateInProgress = false;

			this.#initializeState(props);
		}

		shouldComponentUpdate(nextProps, nextState)
		{
			const { checked, useState } = this.props;

			const shouldUpdate = !useState && nextProps.checked === checked;

			return Boolean(nextProps.force) || shouldUpdate;
		}

		componentWillReceiveProps(props)
		{
			this.#initializeState(props);
			this.#animateToggle();
		}

		#initializeState(props = {})
		{
			const { checked } = props;

			this.state = {
				checked: Boolean(checked),
			};
		}

		#animateToggle()
		{
			const { disabled } = this.props;

			const { checked: wasChecked } = this.state;

			if (disabled)
			{
				return Promise.resolve();
			}

			return new Promise((resolve) => {
				const animate = parallel(
					transition(this.thumbRef, {
						duration: 200,
						left: this.#getThumbPosition(),
						...this.getThumbColor(wasChecked),
					}),
					transition(this.trackRef, {
						duration: 200,
						...this.getTrackColor(wasChecked),
					}),
				);

				this.animateInProgress = true;
				animate()
					.then(() => {
						this.animateInProgress = false;
						resolve();
					})
					.catch((err) => {
						console.error(err);
						this.animateInProgress = false;
						resolve();
					});
			});
		}

		render()
		{
			const { style } = this.props;

			return View(
				{
					testId: this.#getTestId(),
					style: {
						alignItems: 'flex-start',
						...style,
					},
					onClick: this.handleOnClick,
				},
				View(
					{
						ref: (ref) => {
							this.trackRef = ref;
						},
						style: this.getTrackStyle(),
					},
					View(
						{
							ref: (ref) => {
								this.thumbRef = ref;
							},
							style: this.getThumbStyle(),
						},
					),
				),
			);
		}

		handleOnClick = async () => {
			const { onClick, useState = true, disabled } = this.props;

			if (disabled || this.animateInProgress)
			{
				return;
			}

			if (useState)
			{
				await this.toggleChecked();
			}

			if (onClick)
			{
				const { checked } = this.state;

				onClick(checked);
			}
		};

		toggleChecked()
		{
			const { checked } = this.state;

			return new Promise((resolve) => {
				this.setState({ checked: !checked }, () => {
					this.#animateToggle()
						.then(resolve)
						.catch(resolve);
				});
			});
		}

		getThumbColor(checked)
		{
			const { thumbColor = {} } = this.props;

			const color = {
				...this.#getMode().getThumbColor(),
				...thumbColor,
			};

			return color[checked];
		}

		getTrackColor(checked)
		{
			const { trackColor = {} } = this.props;

			const color = {
				...this.#getMode().getTrackStyle(),
				...trackColor,
			};

			return color[checked];
		}

		getTrackStyle()
		{
			const { disabled } = this.props;
			const { checked } = this.state;

			return {
				...this.getTrackColor(checked),
				...this.#getSize().getTrackStyle(disabled),
			};
		}

		getThumbStyle()
		{
			const { disabled } = this.props;
			const { checked } = this.state;

			return {
				position: 'absolute',
				left: this.#getThumbPosition(),
				...this.getThumbColor(checked),
				...this.#getSize().getThumbStyle({ checked, disabled }),
			};
		}

		#getSize()
		{
			const { compact = false, size } = this.props;

			if (compact)
			{
				return SwitcherSize.S;
			}

			return SwitcherSize.resolve(size, SwitcherSize.M);
		}

		#getMode()
		{
			const { disabled, mode = SwitcherMode.SOLID } = this.props;

			return disabled ? mode.getDisabled() : mode;
		}

		#getThumbPosition()
		{
			const { checked } = this.state;

			return this.#getSize().getThumbPosition(checked);
		}

		#getTestId()
		{
			const { testId } = this.props;
			const { checked } = this.state;
			const prefix = checked ? '' : 'un';

			return `${testId}_${prefix}selected`;
		}
	}

	Switcher.defaultProps = {
		compact: false,
		useState: true,
		trackColor: {},
		thumbColor: {},
		onClick: null,
	};

	Switcher.propTypes = {
		useState: PropTypes.bool,
		testId: PropTypes.string.isRequired,
		mode: PropTypes.object,
		trackColor: PropTypes.object,
		thumbColor: PropTypes.object,
		onClick: PropTypes.func,
	};

	module.exports = {
		SwitcherMode,
		SwitcherSize,
		Switcher: (props) => new Switcher(props),
	};
});
