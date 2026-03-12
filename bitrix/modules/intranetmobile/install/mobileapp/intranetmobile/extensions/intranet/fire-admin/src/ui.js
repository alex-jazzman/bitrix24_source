/**
 * @module intranet/fire-admin/src/ui
 */
jn.define('intranet/fire-admin/src/ui', (require, exports, module) => {
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { BBCodeText, Text3, H3 } = require('ui-system/typography');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { ButtonSize, ButtonDesign, Button } = require('ui-system/form/buttons/button');
	const { Card, CardDesign, CardCorner } = require('ui-system/layout/card');
	const { Color, Indent } = require('tokens');
	const { ConfirmationStrategy } = require('intranet/fire-admin/src/strategy');
	const { connect } = require('statemanager/redux/connect');
	const { createTestIdGenerator } = require('utils/test');
	const { fetchUsersIfNotLoaded } = require('statemanager/redux/slices/users/thunk');
	const { Line } = require('utils/skeleton');
	const { makeLibraryImagePath } = require('ui-system/blocks/status-block');
	const { PropTypes } = require('utils/validation');
	const { selectById } = require('statemanager/redux/slices/users/selector');
	const { StringInput, InputSize, InputMode, InputDesign } = require('ui-system/form/inputs/string');
	const { Type } = require('type');
	const { UserProfile } = require('user-profile');

	class FireAdminConfirmation extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.inputRef = null;
			this.scrollViewRef = null;

			this.getTestId = createTestIdGenerator({
				prefix: 'fire-admin-drawer',
			});

			this.state = {
				confirmWord: '',
				wasSubmitted: false,
			};

			this.wasValidInputBefore = false;
		}

		componentDidMount()
		{
			const { initiatorFullName, initiatorId, fetchNextAdmin } = this.props;

			if (!initiatorFullName && initiatorId)
			{
				fetchNextAdmin(initiatorId);
			}
		}

		/**
		 * @returns {Number}
		 */
		get currentAdminId()
		{
			const { currentAdminId } = this.props;

			return currentAdminId;
		}

		/**
		 * @returns {string|null}
		 */
		get currentAdminName()
		{
			const { currentAdminFullName = null } = this.props;

			return currentAdminFullName;
		}

		/**
		 * @returns {Number}
		 */
		get initiatorId()
		{
			const { initiatorId } = this.props;

			return initiatorId;
		}

		/**
		 * @returns {string|null}
		 */
		get initiatorName()
		{
			const { initiatorFullName = null } = this.props;

			return initiatorFullName;
		}

		/**
		 * @returns {ConfirmationStrategy}
		 */
		get strategy()
		{
			const { strategy } = this.props;

			return strategy;
		}

		/**
		 * @returns {Boolean}
		 */
		get hasInputError()
		{
			const { confirmWord } = this.state;

			return Type.isStringFilled(confirmWord) && !this.strategy.validateInput(confirmWord);
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId('container'),
					resizableByKeyboard: false,
					footer: this.#renderFooter(),
					withScroll: true,
					scrollProps: {
						ref: this.#bindScrollViewRef,
					},
				},
				AreaList(
					{
						testId: this.getTestId('area-list'),
						withScroll: false,
					},
					Area(
						{
							testId: this.getTestId('area'),
							style: {
								alignItems: 'center',
								justifyContent: 'center',
							},
						},
						this.#renderImage(),
						this.#renderTitle(),
						this.#renderHint(),
						this.#renderDescription(),
						this.#renderConsentInstruction(),
						this.#renderInput(),
					),
				),
			);
		}

		#bindScrollViewRef = (ref) => {
			this.scrollViewRef = ref;
		};

		#renderImage()
		{
			const imageUri = makeLibraryImagePath('sad_marshmallow_with_profile_block.png', 'empty-states', 'intranet');

			return Image({
				testId: this.getTestId('image'),
				resizeMode: 'contain',
				uri: imageUri,
				style: {
					width: 186,
					height: 153,
				},
			});
		}

		#renderTitle()
		{
			return H3({
				testId: this.getTestId('title'),
				text: this.strategy.getTitle(),
				style: {
					alignSelf: 'center',
					textAlign: 'center',
					marginTop: Indent.XL3.toNumber(),
				},
			});
		}

		#renderHint()
		{
			const hintText = this.strategy.getHint(
				this.initiatorId,
				this.initiatorName,
				this.currentAdminId,
				this.currentAdminName,
			);

			return Card(
				{
					testId: this.getTestId('hint-card'),
					design: CardDesign.ALERT,
					corner: CardCorner.M,
					style: {
						alignSelf: 'stretch',
						justifyContent: 'center',
						backgroundColor: Color.accentSoftRed2.toHex(),
						marginTop: Indent.XL4.toNumber(),
						minHeight: 129,
					},
				},
				hintText && BBCodeText({
					style: {
						color: Color.base1.toHex(),
					},
					testId: this.getTestId('hint-text'),
					value: hintText,
					onUserClick: this.#onUserClick,
				}),
				!hintText && this.#renderShimmer(),
			);
		}

		#renderShimmer()
		{
			const radius = 10;
			const height = 21;
			const margin = Indent.XS.toNumber();

			return View(
				{},
				Line('100%', height, margin, margin, radius),
				Line('100%', height, margin, margin, radius),
				Line('100%', height, margin, margin, radius),
				Line('70%', height, margin, margin, radius),
			);
		}

		#renderDescription()
		{
			return Text3({
				testId: this.getTestId('description'),
				text: this.strategy.getDescription(),
				style: {
					alignSelf: 'stretch',
					marginTop: Indent.XL2.toNumber(),
				},
			});
		}

		#renderConsentInstruction()
		{
			const instructionText = this.strategy.getInstruction();

			return Text3({
				testId: this.getTestId('consent-instruction'),
				text: instructionText,
				style: {
					alignSelf: 'stretch',
					marginTop: Indent.L.toNumber(),
					paddingBottom: Indent.XL.toNumber(),
				},
			});
		}

		#renderInput()
		{
			const { confirmWord } = this.state;
			if (!this.strategy.hasInput())
			{
				return null;
			}

			const placeholder = this.strategy.getConfirmWord();

			return StringInput({
				forwardRef: this.#bindInputRef,
				testId: this.getTestId('input'),
				size: InputSize.L,
				value: confirmWord,
				error: this.hasInputError,
				errorText: this.hasInputError ? this.strategy.getInputErrorText() : '',
				placeholder,
				design: InputDesign.LIGHT_GREY,
				mode: InputMode.STROKE,
				onSubmit: this.#onInputSubmit,
				onFocus: this.#onInputFocus,
				onChange: this.#onInputChange,
			});
		}

		#renderFooter()
		{
			const { confirmWord } = this.state;
			const { layoutWidget, messageId } = this.props;

			return BoxFooter(
				{
					testId: this.getTestId('footer'),
					keyboardButton: {
						text: this.strategy.getAcceptButtonText(),
						disabled: this.strategy.hasInput() && !this.strategy.validateInput(confirmWord),
						testId: this.getTestId('fire-admin-keyboard-accept-button'),
						onClick: this.strategy.executeAcceptCallback({
							layoutWidget,
							messageId,
							currentAdminId: this.currentAdminId,
							initiatorId: this.initiatorId,
						}),
					},
				},
				Button(
					{
						design: ButtonDesign.FILLED,
						size: ButtonSize.L,
						text: this.strategy.getAcceptButtonText(),
						stretched: true,
						onClick: this.strategy.executeAcceptCallback({
							layoutWidget,
							messageId,
							currentAdminId: this.currentAdminId,
							initiatorId: this.initiatorId,
						}),
						testId: this.getTestId('fire-admin-accept-button'),
						disabled: this.strategy.hasInput() && !this.strategy.validateInput(confirmWord),
					},
				),
				Button(
					{
						design: ButtonDesign.PLAN_ACCENT,
						size: ButtonSize.L,
						text: this.strategy.getCancelButtonText(),
						stretched: true,
						onClick: this.strategy.executeCancelCallback({
							layoutWidget,
							messageId,
							currentAdminId: this.currentAdminId,
							initiatorId: this.initiatorId,
						}),
						style: {
							marginTop: Indent.L.toNumber(),
						},
						testId: this.getTestId('fire-admin-cancel-button'),
					},
				),
			);
		}

		#onUserClick({ userId })
		{
			void UserProfile.open({
				ownerId: userId,
			});
		}

		#bindInputRef = (ref) => {
			this.inputRef = ref;
		};

		#onInputSubmit = (params) => {
			if (this.strategy.validateInput(params.text))
			{
				this.inputRef.blur({ hideKeyboard: true });
			}

			this.setState({ confirmWord: params.text, wasSubmitted: true });
		};

		#onInputFocus = () => {
			this.scrollToEnd();
		};

		scrollToEnd()
		{
			// Delay is needed to wait for keyboard animation to finish
			setTimeout(() => {
				this.scrollViewRef?.scrollToEnd(true);
			}, 200);
		}

		#onInputChange = (text = '') => {
			if (this.wasValidInputBefore)
			{
				this.wasValidInputBefore = false;
				this.setState({ confirmWord: text });
			}

			this.#resetErrorOnInputClear(text);

			if (this.strategy.validateInput(text))
			{
				this.wasValidInputBefore = true;
				this.setState({ confirmWord: text });
			}
		};

		#resetErrorOnInputClear(text)
		{
			const trimmedInputValue = text.trim();
			const isEmptyInput = !Type.isStringFilled(trimmedInputValue);

			if (isEmptyInput && this.hasInputError)
			{
				this.setState({ confirmWord: '' });
			}
		}
	}

	const mapStateToProps = (state, ownProps) => {
		const initiatorId = Number(ownProps.initiatorId);
		const user = selectById(state, initiatorId);

		if (!user)
		{
			return {
				initiatorId,
			};
		}

		const {
			id,
			fullName,
		} = user;

		return {
			initiatorId: id,
			initiatorFullName: fullName,
		};
	};

	const mapDispatchToProps = (dispatch) => ({
		fetchNextAdmin: (initiatorId, adminId) => {
			dispatch(fetchUsersIfNotLoaded({ userIds: [Number(initiatorId, adminId)] }));
		},
	});

	FireAdminConfirmation.propTypes = {
		currentAdminId: PropTypes.number.isRequired,
		strategy: PropTypes.instanceOf(ConfirmationStrategy).isRequired,
		initiatorId: PropTypes.number.isRequired,
		fullName: PropTypes.string,
		layoutWidget: PropTypes.object,
	};

	module.exports = {
		FireAdminConfirmation: connect(mapStateToProps, mapDispatchToProps)(FireAdminConfirmation),
	};
});
