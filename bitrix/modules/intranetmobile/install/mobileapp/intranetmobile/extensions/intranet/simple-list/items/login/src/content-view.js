/**
 * @module intranet/simple-list/items/login/src/content-view
 */
jn.define('intranet/simple-list/items/login/src/content-view', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Moment } = require('utils/date');
	const { longDate, dayMonth, shortTime } = require('utils/date/formats');
	const { FriendlyDate } = require('layout/ui/friendly-date');
	const { Indent, Color, Component, Corner } = require('tokens');
	const { Text2, Text4, Text5 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');

	const { Loc } = require('loc');

	const { DeviceType } = require('intranet/simple-list/items/login/src/device-type-enum');
	const { DevicePlatform } = require('intranet/simple-list/items/login/src/device-platform-enum');

	const IMAGE_SIZE = 40;

	/**
	 * @class LoginContentView
	 */
	class LoginContentView extends PureComponent
	{
		/**
		 * @param {LoginItemModel} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				context: this,
			});
		}

		get address()
		{
			return this.props.address ?? Loc.getMessage('M_INTRANET_LOGIN_ITEM_CITY_UNKNOWN');
		}

		get ip()
		{
			return this.props.ip ?? null;
		}

		get deviceType()
		{
			const { deviceType } = this.props;

			if (!deviceType || !DeviceType[deviceType])
			{
				return DeviceType.UNKNOWN;
			}

			return DeviceType[deviceType];
		}

		get devicePlatform()
		{
			const { devicePlatform } = this.props;

			if (!devicePlatform || !DevicePlatform[devicePlatform.toUpperCase()])
			{
				return DevicePlatform.UNKNOWN;
			}

			return DevicePlatform[devicePlatform.toUpperCase()];
		}

		get isFirst()
		{
			return this.props.isFirst ?? false;
		}

		get showSeparator()
		{
			return !this.isCurrent;
		}

		get isCurrent()
		{
			return this.props.isCurrent ?? false;
		}

		get browser()
		{
			return this.props.browser ?? null;
		}

		get loginMomentTs()
		{
			return this.props.loginDate ? this.props.loginDate * 1000 : null;
		}

		render()
		{
			return View(
				{
					testId: this.props.testId,
				},
				this.renderSectionHeader(),
				View(
					{
						testId: this.getTestId(this.props.id),
						style: {
							marginHorizontal: Component.paddingLr.toNumber(),
							paddingHorizontal: Indent.M.toNumber(),
							backgroundColor: this.isCurrent ? Color.accentSoftBlue3.toHex() : null,
							borderRadius: this.isCurrent ? Corner.M.toNumber() : null,
						},
					},
					View(
						{
							style: {
								flexDirection: 'row',
								alignItems: 'center',
								paddingVertical: Indent.XL2.toNumber(),
							},
						},
						this.renderImage(),
						this.renderContent(),
					),
					this.renderSeparator(),
				),
			);
		}

		renderSectionHeader()
		{
			if (!this.isCurrent && !this.isFirst)
			{
				return null;
			}

			const text = this.isCurrent
				? Loc.getMessage('M_INTRANET_LOGIN_ITEM_CURRENT')
				: Loc.getMessage('M_INTRANET_LOGIN_ITEM_OTHER');

			return View(
				{
					style: {
						paddingVertical: Indent.L.toNumber(),
						paddingHorizontal: Indent.XL3.toNumber(),
					},
				},
				Text4({
					text,
				}),
			);
		}

		renderImage()
		{
			return Image({
				testId: this.getTestId(`image-${this.props.id}`),
				style: {
					alignSelf: 'center',
					width: IMAGE_SIZE,
					height: IMAGE_SIZE,
					marginRight: Indent.XL.toNumber(),
				},
				resizeMode: 'contain',
				uri: this.devicePlatform.getImageUrl(),
			});
		}

		renderContent()
		{
			return View(
				{
					style: {
						flex: 1,
						flexDirection: 'column',
					},
					testId: this.getTestId(`content-${this.props.id}`),
				},
				this.renderTitle(),
				this.renderSubtitle(),
			);
		}

		renderTitle()
		{
			const title = this.getTitleText();
			if (!title)
			{
				return null;
			}

			return Text2({
				testId: this.getTestId(`title-${this.props.id}`),
				text: title,
				numberOfLines: 2,
				ellipsize: 'end',
				color: Color.base1,
			});
		}

		renderSubtitle()
		{
			const subtitle = this.getSubtitleText();
			if (!subtitle)
			{
				return null;
			}

			return View(
				{
					style: {
						marginTop: Indent.XS2.toNumber(),
					},
				},
				Text5({
					testId: this.getTestId(`subtitle-${this.props.id}`),
					text: subtitle,
					color: Color.base3,
					numberOfLines: 2,
					ellipsize: 'end',
				}),
			);
		}

		renderSeparator()
		{
			if (!this.showSeparator)
			{
				return null;
			}

			const offsetLeft = IMAGE_SIZE + (Indent.XL.toNumber() * 2);

			return View({
				style: {
					height: 1,
					backgroundColor: Color.bgSeparatorSecondary.toHex(),
					marginLeft: offsetLeft,
				},
			});
		}

		getTitleText()
		{
			if (DeviceType.UNKNOWN.equal(this.deviceType))
			{
				return DeviceType.UNKNOWN.getPhrase();
			}

			const parts = [this.deviceType.getPhrase()];

			if (this.devicePlatform !== DevicePlatform.UNKNOWN)
			{
				parts.push(this.devicePlatform.getName());
			}

			parts.push(this.browser);

			return this.createText(parts);
		}

		getSubtitleText()
		{
			const parts = [
				this.getDateText(),
				this.address,
				this.ip,
			];

			return this.createText(parts);
		}

		getDateText()
		{
			if (!this.loginMomentTs)
			{
				return null;
			}

			const moment = new Moment(this.loginMomentTs);
			const dateFormat = moment.inThisYear ? dayMonth() : longDate();

			const friendlyDate = new FriendlyDate({
				moment,
				defaultFormat: dateFormat,
			});

			return this.createText(
				[friendlyDate.makeText(moment), moment.format(shortTime)],
				' ',
			);
		}

		createText(parts, separator = ', ')
		{
			return parts.filter(Boolean).join(separator);
		}
	}

	module.exports = { LoginContentView };
});
