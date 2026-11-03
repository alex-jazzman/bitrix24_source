/**
 * @module layout/ui/qr-code-frame/src/code-frame
 */
jn.define('layout/ui/qr-code-frame/src/code-frame', (require, exports, module) => {
	const { Color } = require('tokens');

	const CONTAINER_SIZE = 245;
	const QR_SIZE = 229;
	const QR_BORDER_RADIUS = 24;
	const OUTER_BORDER_RADIUS = QR_BORDER_RADIUS + ((CONTAINER_SIZE - QR_SIZE) / 2);

	const QR_CODE_BORDER_GRADIENT = {
		start: '#75E4BD',
		middle: '#2CAAF5',
		end: '#0B83FF',
		angle: 65,
	};

	/**
	 * @typedef {Object} QrCodeFrameProps
	 * @property {string} testId
	 * @property {string|null} [qrCodeSvg]
	 * @property {boolean} [hasError]
	 * @property {Object|null} [borderGradient]
	 * @property {function|null} [renderError]
	 *
	 * @class QrCodeFrame
	 * @param {QrCodeFrameProps} props
	 */
	class QrCodeFrame extends LayoutComponent
	{
		render()
		{
			const { hasError, qrCodeSvg } = this.props;

			if (hasError)
			{
				return this.#renderError();
			}

			if (qrCodeSvg)
			{
				return this.#renderCode(qrCodeSvg);
			}

			return this.#renderShimmer();
		}

		#getTestId(suffix)
		{
			const { testId } = this.props;

			return [testId, suffix].filter(Boolean).join('-');
		}

		#renderError()
		{
			const { renderError } = this.props;

			return renderError ? renderError() : this.#renderFrame(null);
		}

		#renderCode(qrCodeSvg)
		{
			return this.#renderFrame(View({
				testId: this.#getTestId('code'),
				style: {
					alignSelf: 'center',
					width: QR_SIZE,
					height: QR_SIZE,
					borderRadius: QR_BORDER_RADIUS,
					backgroundImageSvg: qrCodeSvg,
					backgroundPosition: 'center',
					backgroundResizeMode: 'stretch',
				},
			}));
		}

		#renderFrame(content)
		{
			const { borderGradient } = this.props;

			return View(
				{
					testId: this.#getTestId('code-frame'),
					style: {
						backgroundColorGradient: borderGradient ?? {},
						width: CONTAINER_SIZE,
						height: CONTAINER_SIZE,
						borderRadius: OUTER_BORDER_RADIUS,
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				content,
			);
		}

		#renderShimmer()
		{
			return View(
				{
					style: {
						width: CONTAINER_SIZE,
						height: CONTAINER_SIZE,
						alignSelf: 'center',
					},
				},
				ShimmerView(
					{
						animating: true,
					},
					View({
						testId: this.#getTestId('code-shimmer'),
						style: {
							backgroundColor: Color.base6.toHex(),
							width: CONTAINER_SIZE,
							height: CONTAINER_SIZE,
							borderRadius: QR_BORDER_RADIUS,
						},
					}),
				),
			);
		}
	}

	module.exports = {
		/**
		 * @param {QrCodeFrameProps} props
		 * @returns {QrCodeFrame}
		 */
		QrCodeFrame: (props) => new QrCodeFrame(props),
		QR_CODE_BORDER_GRADIENT,
	};
});
