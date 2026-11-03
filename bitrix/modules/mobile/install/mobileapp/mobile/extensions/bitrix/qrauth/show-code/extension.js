/**
 * @module qrauth/show-code
 */
jn.define('qrauth/show-code', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Loc } = require('loc');
	const { Color, Component, Indent } = require('tokens');
	const { BottomSheet } = require('bottom-sheet');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Text4, Text6 } = require('ui-system/typography/text');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');
	const { Tourist } = require('tourist');
	const { createTestIdGenerator } = require('utils/test');
	const { withCurrentDomain } = require('utils/url');
	const { QrLoginCodeSheet } = require('qrauth/show-code/src/code-sheet');

	const INSTRUCTION_SHOWN_EVENT = 'qr_login_instruction_shown';
	const TOURIST_READY_TIMEOUT = 1500;
	const SHEET_HEIGHT = 540;
	const ILLUSTRATION_ASPECT_RATIO = 375 / 250;
	const STEP_BADGE_SIZE = 22;
	const IMAGES_PATH = '/bitrix/mobileapp/mobile/extensions/bitrix/qrauth/show-code/images';
	const STEP_MESSAGE_IDS = [
		'M_QRAUTH_SHOW_CODE_STEP_OPEN_CAMERA',
		'M_QRAUTH_SHOW_CODE_STEP_SCAN',
		'M_QRAUTH_SHOW_CODE_STEP_WAIT',
	];

	/**
	 * @typedef {object} QrLoginInstructionSheetProps
	 * @property {PageManager} [layoutWidget]
	 *
	 * @class QrLoginInstructionSheet
	 */
	class QrLoginInstructionSheet extends LayoutComponent
	{
		/**
		 * @param {{ parentWidget?: PageManager, title?: string }} [params]
		 * @return {Promise<PageManager>}
		 */
		static open({ parentWidget = PageManager, title } = {})
		{
			return new BottomSheet({
				titleParams: {
					text: title ?? Loc.getMessage('M_QRAUTH_SHOW_CODE_TITLE'),
					type: 'dialog',
				},
				component: (layoutWidget) => new QrLoginInstructionSheet({ layoutWidget }),
			})
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgContentPrimary.toHex())
				.setNavigationBarColor(Color.bgContentPrimary.toHex())
				.setMediumPositionHeight(SHEET_HEIGHT, true)
				.open();
		}

		/**
		 * @param {QrLoginInstructionSheetProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'qrauth-instruction',
			});
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					withScroll: true,
					footer: this.#renderFooter(),
					safeArea: {
						bottom: true,
					},
				},
				AreaList(
					{
						withScroll: false,
					},
					this.#renderSteps(),
					this.#renderIllustration(),
				),
			);
		}

		#renderIllustration()
		{
			return Area(
				{
					excludePaddingSide: {
						horizontal: true,
						bottom: true,
					},
				},
				Image({
					testId: this.getTestId('illustration'),
					resizeMode: 'contain',
					style: QrLoginInstructionSheet.#getIllustrationStyle(),
					uri: QrLoginInstructionSheet.#getIllustrationUri(),
				}),
			);
		}

		static #getIllustrationStyle()
		{
			const width = device.screen.width;

			return {
				width,
				height: Math.round(width / ILLUSTRATION_ASPECT_RATIO),
			};
		}

		#renderSteps()
		{
			return Area(
				{
					testId: this.getTestId('steps'),
					isFirst: true,
				},
				...STEP_MESSAGE_IDS.map((messageId, index) => this.#renderStep(messageId, index)),
			);
		}

		#renderStep(messageId, index)
		{
			const stepNumber = index + 1;

			return View(
				{
					testId: this.getTestId(`step-${stepNumber}`),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginTop: index === 0 ? 0 : Indent.XL3.toNumber(),
					},
				},
				this.#renderStepBadge(stepNumber),
				Text4({
					text: Loc.getMessage(messageId),
					color: Color.base2,
					style: {
						flexShrink: 1,
					},
				}),
			);
		}

		#renderStepBadge(stepNumber)
		{
			return View(
				{
					style: {
						width: STEP_BADGE_SIZE,
						height: STEP_BADGE_SIZE,
						alignItems: 'center',
						justifyContent: 'center',
						marginRight: Indent.XL.toNumber(),
						borderRadius: Component.elementAccentCorner.toNumber(),
						backgroundColor: Color.accentSoftBlue2.toHex(),
					},
				},
				Text6({
					text: String(stepNumber),
					color: Color.base2,
				}),
			);
		}

		#renderFooter()
		{
			return BoxFooter(
				{
					safeArea: true,
				},
				Button({
					testId: this.getTestId('scan-button'),
					text: Loc.getMessage('M_QRAUTH_SHOW_CODE_SCAN_BUTTON'),
					size: ButtonSize.L,
					stretched: true,
					onClick: this.#openCodeSheet,
				}),
			);
		}

		#openCodeSheet = () => {
			const { layoutWidget } = this.props;

			void QrLoginCodeSheet.open({
				parentWidget: layoutWidget ?? PageManager,
				onLoginOnNewDevice: () => layoutWidget?.close(),
			});
		};

		/**
		 * @return {string}
		 */
		static #getIllustrationUri()
		{
			return withCurrentDomain(`${IMAGES_PATH}/${AppTheme.id}/instruction.png`);
		}
	}

	/**
	 * @param {number} timeout
	 * @return {Promise<never>}
	 */
	const rejectAfter = (timeout) => new Promise((resolve, reject) => {
		setTimeout(() => reject(new Error(`tourist state is not ready in ${timeout}ms`)), timeout);
	});

	const rememberInstructionShown = () => {
		try
		{
			void Tourist.remember(INSTRUCTION_SHOWN_EVENT);
		}
		catch (error)
		{
			console.error('QR login: cannot remember shown instruction', error);
		}
	};

	/**
	 * @return {Promise<boolean>}
	 */
	const isInstructionNeeded = async () => {
		try
		{
			await Promise.race([Tourist.ready(), rejectAfter(TOURIST_READY_TIMEOUT)]);

			return Tourist.rememberFirstTime(INSTRUCTION_SHOWN_EVENT);
		}
		catch (error)
		{
			console.error('QR login: cannot read tourist state, falling back to instruction', error);
			rememberInstructionShown();

			return true;
		}
	};

	/**
	 * @param {{ parentWidget?: PageManager, title?: string }} [params]
	 * @return {Promise<PageManager>}
	 */
	const openQrLogin = async ({ parentWidget = PageManager, title } = {}) => {
		if (await isInstructionNeeded())
		{
			return QrLoginInstructionSheet.open({ parentWidget, title });
		}

		return QrLoginCodeSheet.open({ parentWidget });
	};

	module.exports = { QrLoginInstructionSheet, openQrLogin };
});
