/**
 * @module my-company/screen/src/section/portal
 */
jn.define('my-company/screen/src/section/portal', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Feature } = require('feature');
	const { Color, Indent } = require('tokens');
	const { H2 } = require('ui-system/typography/heading');
	const { Text5 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { makeLibraryImagePath } = require('asset-manager');
	const { URL } = require('utils/url');
	const { copyToClipboard } = require('utils/copy');
	const { PropTypes } = require('utils/validation');
	const { getTextColorByTheme, applyAppearanceTextColorMode } = require('user/theme');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');

	const IMAGE_SIZE = 62;
	// The head of the screen carries no surface of its own: its texts lie on the wallpaper, and between
	// them and the first card there has to be more room than one card leaves to the next. The room is
	// taken here as padding: the area of the layout computes its own paddings over whatever style it is
	// handed, and a margin of this row is not honoured at all (both checked on a simulator).
	const HEAD_TOP_ROOM = Indent.XL2.toNumber();
	const HEAD_BOTTOM_ROOM = Indent.XL2.toNumber();
	const COPY_ICON_SIZE = 22;
	// The row of the address is as tall as its own content, and that is half of what a finger needs, so it
	// stands in a row of the minimum height with the content centred. Centring puts half of the difference
	// above the text and half below, and the row gives both halves back as negative margins: the gap up to
	// the name stays the one of the layout, the column of the texts stays as tall as what is drawn in it -
	// and the pair keeps its middle on the middle of the icon beside it - while the area that takes the tap
	// is the whole row.
	const MIN_TAP_TARGET = 44;
	const ADDRESS_ROW_LIFT = Math.round((MIN_TAP_TARGET - COPY_ICON_SIZE) / 2);
	// the address is the quieter half of the pair, and opacity says so over a color taken from the theme
	const ADDRESS_OPACITY = 0.7;

	/**
	 * The topmost section of the screen: the name of the portal and its address, drawn right on the
	 * wallpaper the native side puts under the screen. It carries no surface of its own, so the texts
	 * keep the color that wallpaper calls for rather than the one of a card.
	 *
	 * TODO: the color of these texts follows the mode the chosen bundle of the appearance publishes, the
	 *   way the wallpapers do it elsewhere - see `getTextColorByTheme()` and `appearanceTextColorMode`
	 *   below. What is not covered: a bundle whose picture is light in one part of the frame and dark in
	 *   another, and the bundles that publish no mode at all. Both leave the readability of the name and
	 *   of the address to the picture. Needs a rule of its own from the developers of the appearance:
	 *   either a mode honest for the area of the head, or a scrim under the texts.
	 *
	 * @class PortalSection
	 */
	class PortalSection extends PureComponent
	{
		/**
		 * @param props
		 * @param {MyCompanyPortal} props.portal
		 * @param {string} props.testId
		 * @param {?string} [props.appearanceTextColorMode] the mode of the color of the text the chosen
		 *   bundle of the appearance publishes, empty while the bundles are off
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});
		}

		render()
		{
			const textColor = this.#getTextColor();

			return View(
				{
					testId: this.getTestId(),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingTop: HEAD_TOP_ROOM,
						paddingBottom: HEAD_BOTTOM_ROOM,
					},
				},
				this.#renderIcon(),
				View(
					{
						style: {
							flexGrow: 2,
							flexShrink: 2,
							marginLeft: Indent.L.toNumber(),
						},
					},
					this.#renderName(textColor),
					this.#renderAddress(textColor),
				),
			);
		}

		/**
		 * The theme the color of the texts is picked by: the theme of the portal, with its identifier
		 * replaced by the mode of the chosen bundle of the appearance wherever the bundles are on. An empty
		 * mode leaves the theme as the server sent it - the first frame is drawn before the answer lands,
		 * and with the bundles off the answer stays empty for good.
		 *
		 * @return {?UserTheme}
		 */
		get currentTheme()
		{
			return applyAppearanceTextColorMode(this.props.portal.theme, this.props.appearanceTextColorMode);
		}

		/**
		 * The single color of the texts. Over the wallpaper the theme decides which color stays readable,
		 * and its identifier names exactly that: `light:*` and `dark:*` are the color of the text above the
		 * wallpaper, not the theme of the app. Without the native background the texts lie on the ordinary
		 * surface of the screen, where the ordinary token of the design system reads.
		 *
		 * @return {Color}
		 */
		#getTextColor()
		{
			return Feature.canUseWidgetBackground()
				? getTextColorByTheme(this.currentTheme)
				: Color.base1;
		}

		/**
		 * The illustration of the section is neutral to the theme, so it needs neither a pair of the
		 * themes nor a color of its own.
		 *
		 * @return {object}
		 */
		#renderIcon()
		{
			return Image({
				testId: this.getTestId('icon'),
				style: {
					width: IMAGE_SIZE,
					height: IMAGE_SIZE,
				},
				resizeMode: 'contain',
				uri: makeLibraryImagePath('my-company.png', 'my-company'),
			});
		}

		/**
		 * @param {Color} textColor
		 * @return {?object}
		 */
		#renderName(textColor)
		{
			const { name } = this.props.portal;

			if (!name)
			{
				return null;
			}

			// the name of the portal is what the screen is opened for, and a legal one rarely fits a line
			// of its own: it wraps onto a second one, and the ellipsis stays for the names longer still
			return H2({
				testId: this.getTestId('name'),
				text: name,
				color: textColor,
				numberOfLines: 2,
				ellipsize: 'end',
			});
		}

		/**
		 * The row shows the host and copies the address as the server sent it: the full address is the
		 * form that opens the portal from wherever it is pasted.
		 *
		 * @param {Color} textColor
		 * @return {?object}
		 */
		#renderAddress(textColor)
		{
			const host = URL(this.props.portal.url)?.host;

			if (!host)
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId('address'),
					onClick: this.#handleCopyAddress,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						alignSelf: 'flex-start',
						height: MIN_TAP_TARGET,
						marginTop: Indent.XS.toNumber() - ADDRESS_ROW_LIFT,
						marginBottom: -ADDRESS_ROW_LIFT,
					},
				},
				Text5({
					testId: this.getTestId('address-host'),
					text: host,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						color: textColor.toHex(ADDRESS_OPACITY),
					},
				}),
				IconView({
					testId: this.getTestId('address-copy'),
					size: COPY_ICON_SIZE,
					icon: Icon.COPY,
					color: textColor,
					style: {
						marginLeft: Indent.XS.toNumber(),
					},
				}),
			);
		}

		// the confirming toast and the branch of copying forbidden by the administrator are both inside
		// the utility, so the section only says what to copy
		#handleCopyAddress = () => {
			void copyToClipboard(
				this.props.portal.url,
				Loc.getMessage('MY_COMPANY_PORTAL_ADDRESS_COPIED'),
			);
		};
	}

	PortalSection.propTypes = {
		portal: PropTypes.shape({
			name: PropTypes.string,
			url: PropTypes.string,
			theme: PropTypes.object,
		}).isRequired,
		testId: PropTypes.string.isRequired,
		appearanceTextColorMode: PropTypes.string,
	};

	module.exports = { PortalSection };
});
