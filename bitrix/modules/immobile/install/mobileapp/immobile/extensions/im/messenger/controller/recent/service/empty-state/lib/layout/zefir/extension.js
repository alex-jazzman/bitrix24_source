/**
 * @module im/messenger/controller/recent/service/empty-state/lib/layout/zefir
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/layout/zefir', (require, exports, module) => {
	const { Color, Component, Indent, } = require('tokens');
	const { H3, Text3 } = require('ui-system/typography');

	const { MessengerIcon } = require('im/messenger/assets/icon');

	const arrowSvg = `<svg width="75" height="82" viewBox="0 0 75 82" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.520154 32.2043C0.0356607 32.4694 -0.142182 33.0771 0.122931 33.5616C0.388043 34.0461 0.995719 34.2239 1.48021 33.9588L1.00018 33.0815L0.520154 32.2043ZM69.327 62.9981C69.8233 63.2403 70.422 63.0342 70.6642 62.5378L74.6104 54.4491C74.8526 53.9527 74.6465 53.354 74.1501 53.1119C73.6538 52.8697 73.0551 53.0758 72.8129 53.5722L69.3052 60.7621L62.1152 57.2544C61.6188 57.0122 61.0201 57.2183 60.778 57.7147C60.5358 58.211 60.7419 58.8097 61.2383 59.0519L69.327 62.9981ZM45.3806 27.4729L45.8965 26.6162V26.6162L45.3806 27.4729ZM1.00018 33.0815C1.48021 33.9588 1.4801 33.9589 1.4801 33.9589C1.48024 33.9588 1.48034 33.9587 1.48062 33.9586C1.48118 33.9583 1.48217 33.9577 1.48358 33.957C1.4864 33.9554 1.49092 33.953 1.49711 33.9496C1.50949 33.9429 1.52857 33.9326 1.5542 33.9188C1.60545 33.8913 1.68288 33.8501 1.78526 33.7963C1.99003 33.6887 2.29457 33.531 2.68912 33.333C3.47834 32.9371 4.62703 32.3806 6.05725 31.7423C8.91975 30.4649 12.8996 28.8647 17.3755 27.5683C26.4051 24.953 37.1284 23.6705 44.8647 28.3295L45.3806 27.4729L45.8965 26.6162C37.3846 21.4901 25.9177 23.0119 16.8191 25.6472C12.2309 26.9762 8.16223 28.6128 5.24219 29.916C3.78113 30.568 2.60505 31.1377 1.79233 31.5454C1.3859 31.7493 1.07017 31.9127 0.854917 32.0258C0.747285 32.0824 0.664759 32.1264 0.608561 32.1565C0.580462 32.1716 0.558944 32.1832 0.544158 32.1912C0.536766 32.1952 0.531056 32.1983 0.527049 32.2005C0.525046 32.2016 0.523468 32.2025 0.522318 32.2031C0.521743 32.2034 0.521202 32.2037 0.520914 32.2039C0.52048 32.2041 0.520154 32.2043 1.00018 33.0815ZM45.3806 27.4729L44.8647 28.3295C52.4965 32.9256 58.4878 41.3906 62.5951 48.8214C64.6394 52.5199 66.1981 55.9273 67.2454 58.4095C67.7689 59.6501 68.1639 60.6581 68.4275 61.3541C68.5592 61.702 68.6581 61.9719 68.7236 62.1537C68.7564 62.2446 68.7809 62.3134 68.7969 62.3591C68.8049 62.3819 68.8109 62.3988 68.8147 62.4099C68.8166 62.4154 68.818 62.4194 68.8189 62.4219C68.8193 62.4231 68.8196 62.424 68.8198 62.4245C68.8199 62.4247 68.8199 62.4248 68.8199 62.4249C68.8199 62.4249 68.8199 62.4248 69.7655 62.0993C70.711 61.7739 70.7109 61.7736 70.7108 61.7732C70.7107 61.7729 70.7105 61.7724 70.7103 61.7719C70.71 61.7709 70.7095 61.7695 70.7089 61.7676C70.7076 61.764 70.7058 61.7589 70.7035 61.7523C70.6989 61.7391 70.6922 61.7198 70.6834 61.6947C70.6657 61.6446 70.6396 61.571 70.6051 61.4754C70.5361 61.284 70.4336 61.0042 70.2979 60.6458C70.0265 59.9291 69.6222 58.8978 69.0881 57.632C68.0205 55.1016 66.4316 51.6281 64.3455 47.8539C60.1918 40.3391 53.9907 31.4908 45.8965 26.6162L45.3806 27.4729Z" fill="#ADD3FF"/></svg>`;

	/**
	 * @typedef {LayoutComponent<ZefirWelcomeScreenProps, ZefirWelcomeScreenState>} ZefirWelcomeScreen
	 * @class ZefirWelcomeScreen
	 */
	class ZefirWelcomeScreen extends LayoutComponent
	{
		/** @type {Partial<ZefirWelcomeScreenProps>} */
		static defaultProps = {
			showArrow: true,
		};

		/**
		 * @param {ZefirWelcomeScreenProps} props
		 */
		constructor(props)
		{
			super(props);
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
						flexDirection: 'column',
						alignItems: 'center',
						backgroundColor: Color.bgContentPrimary.toHex(),
					}
				},
				this.#renderStatusBlock(),
				View({
					style: { flex: 1, },
				}),
				this.props.showArrow && this.#renderArrow(),
			)
		}

		#renderStatusBlock()
		{
			return View(
				{
					style: {
						paddingBottom: Component.areaPaddingB.toNumber(),
						flex: 2,
						justifyContent: 'flex-end',
					}
				},
				View(
					{
						style: {
							paddingHorizontal: Component.paddingLr.toNumber(),
						}
					},
					View(
						{
							style: {
								paddingLeft: 64,
								paddingRight: 63,
							}
						},
						Image({
							style: {
								width: 212,
								height: 212,
								alignSelf: 'center',
							},
							uri: MessengerIcon.getByType(this.props.iconType)
						}),
					),
					View(
						{
							style: {
								marginTop: 6,
							}
						},
						View(
							{},
							H3({
								style: {
									alignSelf: 'center',
									textAlign: 'center',
								},
								text: this.props.title,
							}),
						),
						View(
							{
								style: {
									marginTop: Indent.L.toNumber(),
								}
							},
							Text3({
								style: {
									alignSelf: 'center',
									textAlign: 'center',
									color: Color.base2.toHex(),
								},
								text: this.props.description,
							}),
						),
					),
				),
			);
		}

		#renderArrow()
		{
			return View(
				{
					style: {
						position: 'absolute',
						bottom: 82,
						right: 72,
					},
				},
				Image({
					style: {
						width: 75,
						height: 82,
					},
					svg: {
						content: arrowSvg,
					}
				})
			)
		}
	}

	module.exports = { ZefirWelcomeScreen };
});
