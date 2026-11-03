/**
 * @module more-menu/block/company/specialists/src/invite-box
 */
jn.define('more-menu/block/company/specialists/src/invite-box', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { isValidEmail } = require('utils/email');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { BottomSheet } = require('bottom-sheet');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { showToast } = require('toast');
	const { ajaxAlertErrorHandler } = require('error');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { StringInput, InputSize, InputMode, InputDesign } = require('ui-system/form/inputs/string');
	const { Text5 } = require('ui-system/typography/text');

	const SEND_INVITATION_ACTION = 'intranet.v2.Integrator.Invitation.send';

	const BOX_HEIGHT = 290;

	const NOT_PARTNER_ERROR_CODES = new Set([
		'INTEGRATOR_ERROR_NOT_PARTNER',
		'INTEGRATOR_ERROR_NOT_INTEGRATOR',
		'INTEGRATOR_ERROR_OTHER_NOT_INTEGRATOR',
	]);

	class SpecialistsInviteBox extends LayoutComponent
	{
		/**
		 * @public
		 * @param {{ layout?: object, isRenamed?: boolean, onSuccess?: Function }} [options]
		 * @return {Promise}
		 */
		static open({ layout, isRenamed = false, onSuccess } = {})
		{
			return new BottomSheet({
				titleParams: {
					type: 'dialog',
					text: Loc.getMessage(
						isRenamed
							? 'MORE_MENU_COMPANY_SPECIALISTS_INVITE_TITLE_RENAMED'
							: 'MORE_MENU_COMPANY_SPECIALISTS_INVITE_TITLE',
					),
				},
				component: (widget) => new SpecialistsInviteBox({
					layoutWidget: widget,
					isRenamed,
					onSuccess,
				}),
			})
				.setParentWidget(layout ?? PageManager)
				.setBackgroundColor(Color.bgSecondary.toHex())
				.setNavigationBarColor(Color.bgSecondary.toHex())
				.disableOnlyMediumPosition()
				.setMediumPositionHeight(BOX_HEIGHT)
				.enableResizeContent()
				.enableAdoptHeightByKeyboard()
				.open();
		}

		/**
		 * @param {{ layoutWidget: object, isRenamed?: boolean, onSuccess?: Function }} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				email: '',
				isEmailValid: false,
				error: false,
				errorText: null,
				isSending: false,
			};

			this.getTestId = createTestIdGenerator({
				prefix: 'specialists-invite-box',
				context: this,
			});
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					backgroundColor: Color.bgSecondary,
					safeArea: { bottom: true },
					resizableByKeyboard: true,
					footer: this.#renderFooter(),
				},
				Area(
					{
						testId: this.getTestId('area'),
						isFirst: true,
						excludePaddingSide: {
							bottom: true,
						},
					},
					this.#renderEmailLabel(),
					this.#renderEmailInput(),
					this.state.error ? this.#renderError() : this.#renderHint(),
				),
			);
		}

		#renderEmailLabel()
		{
			return Text5({
				testId: this.getTestId('email-label'),
				text: this.#phrase('MORE_MENU_COMPANY_SPECIALISTS_INVITE_EMAIL_LABEL'),
				color: Color.base3,
			});
		}

		#renderEmailInput()
		{
			const { email, error } = this.state;

			return StringInput({
				testId: this.getTestId('email'),
				value: email,
				focus: true,
				keyboardType: 'email-address',
				autoCapitalize: 'none',
				placeholder: 'name@company.ru',
				size: InputSize.L,
				design: InputDesign.GREY,
				mode: InputMode.STROKE,
				leftContent: Icon.MAIL,
				error,
				onChange: this.#handleEmailChange,
				style: {
					marginBottom: Indent.XS.toNumber(),
				},
			});
		}

		#renderError()
		{
			return Card(
				{
					testId: this.getTestId('error-card'),
					design: CardDesign.ALERT,
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
					},
				},
				IconView({
					testId: this.getTestId('error-icon'),
					icon: Icon.INFO_CIRCLE,
					color: Color.accentMainAlert,
					size: 24,
					style: {
						marginRight: Indent.M.toNumber(),
					},
				}),
				Text5({
					testId: this.getTestId('error-text'),
					text: this.state.errorText,
					color: Color.base2,
					numberOfLines: 3,
					ellipsize: 'end',
					style: {
						flexShrink: 2,
					},
				}),
			);
		}

		#renderHint()
		{
			return Card(
				{
					testId: this.getTestId('hint-card'),
					design: CardDesign.ACCENT,
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
					},
				},
				IconView({
					testId: this.getTestId('hint-icon'),
					icon: Icon.INFO_CIRCLE,
					color: Color.accentMainPrimary,
					size: 24,
					style: {
						marginRight: Indent.M.toNumber(),
					},
				}),
				Text5({
					testId: this.getTestId('hint'),
					text: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_INVITE_HINT'),
					color: Color.base2,
					style: {
						flexShrink: 2,
					},
				}),
			);
		}

		#renderFooter()
		{
			const { isSending, isEmailValid, error } = this.state;
			const isDisabled = !isEmailValid || error || isSending;
			const text = Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_INVITE_BUTTON');

			return BoxFooter(
				{
					testId: this.getTestId('footer'),
					keyboardButton: {
						testId: this.getTestId('submit-keyboard'),
						text,
						disabled: isDisabled,
						loading: isSending,
						onClick: this.#sendInvitation,
					},
				},
				Button({
					testId: this.getTestId('submit'),
					text,
					design: ButtonDesign.FILLED,
					size: ButtonSize.L,
					stretched: true,
					disabled: isDisabled,
					loading: isSending,
					onClick: this.#sendInvitation,
				}),
			);
		}

		/**
		 * While typing we never surface a validation error: we only recompute the
		 * background format check that gates the submit button, and clear any
		 * previous server error on the first change.
		 */
		#handleEmailChange = (email) => {
			this.setState({
				email,
				isEmailValid: isValidEmail(email),
				error: false,
				errorText: null,
			});
		};

		#sendInvitation = () => {
			if (!this.state.isEmailValid || this.state.error || this.state.isSending)
			{
				return;
			}

			this.setState({ isSending: true });

			void new RunActionExecutor(SEND_INVITATION_ACTION, { integratorEmail: this.state.email })
				.setHandler((response) => this.#handleResponse(response))
				.call()
			;
		};

		#handleResponse(response)
		{
			const { status, errors } = response ?? {};

			if (status === 'success')
			{
				this.#handleSuccess();

				return;
			}

			const notPartnerError = SpecialistsInviteBox.getNotPartnerError(errors);
			if (notPartnerError)
			{
				this.setState({
					isSending: false,
					error: true,
					errorText: notPartnerError.message,
				});

				return;
			}

			this.setState({ isSending: false });
			void ajaxAlertErrorHandler(response ?? {});
		}

		#handleSuccess()
		{
			this.props.layoutWidget?.close();
			showToast({ message: Loc.getMessage('MORE_MENU_COMPANY_SPECIALISTS_INVITE_SUCCESS') });
			this.props.onSuccess?.();
		}

		/**
		 * @param {string} baseKey
		 * @return {string}
		 */
		#phrase(baseKey)
		{
			const key = this.props.isRenamed ? `${baseKey}_RENAMED` : baseKey;

			return Loc.getMessage(key);
		}

		/**
		 * Picks the "not an integrator/partner" error that must be shown inside the
		 * email field instead of a generic alert. Branching is by error code only.
		 *
		 * @param {Array<{ code: string, message: string }>} [errors]
		 * @return {{ code: string, message: string }|null}
		 */
		static getNotPartnerError(errors)
		{
			if (!Array.isArray(errors))
			{
				return null;
			}

			return errors.find((error) => NOT_PARTNER_ERROR_CODES.has(error?.code)) ?? null;
		}
	}

	SpecialistsInviteBox.propTypes = {
		layoutWidget: PropTypes.object,
		isRenamed: PropTypes.bool,
		onSuccess: PropTypes.func,
	};

	module.exports = { SpecialistsInviteBox };
});
