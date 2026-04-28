/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/sticker
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/sticker', (require, exports, module) => {
	const { SafeImage } = require('layout/ui/safe-image');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerView');

	/**
	 * @class StickerView
	 * @typedef {LayoutComponent<StickerViewProps, StickerViewState>} StickerView
	 */
	class StickerView extends LayoutComponent
	{
		/**
		 * @type {Partial<StickerViewProps>}
		 */
		static defaultProps = {
			ref: () => {},
		};

		/**
		 * @param {StickerViewProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				isUploading: this.props.isUploading,
				uploadProgress: 0,
			};
		}

		render()
		{
			return View(
				{
					style: {
						...this.#getContainerStyle(),
					},
					onClick: () => {
						const data = this.#getStickerClickData();
						logger.log('onClick', data);
						this.props.onClick(data, this.ref);
					},
					onLongClick: () => {
						const data = this.#getStickerClickData();
						logger.log('onLongClick', data);
						this.props.onLongClick(data, this.ref);
					},
					ref: (ref) => {
						this.ref = ref;
					},
				},
				SafeImage({
					withShimmer: true,
					uri: this.props.uri,
					wrapperStyle: {
						width: 72,
						height: 72,
						borderRadius: 6,
					},
					style: {
						width: 72,
						height: 72,
						borderRadius: 4,
					},
					resizeMode: 'contain',
					clickable: false,
				}),
			);
		}

		#getContainerStyle()
		{
			return {
				width: 82,
				height: 82,
				paddingLeft: 5,
				paddingRight: 5,
				paddingTop: 5,
				paddingBottom: 5,
				justifyContent: 'center',
				alignItems: 'center',
			};
		}

		/**
		 * @return {StickerViewClickData}
		 */
		#getStickerClickData()
		{
			return {
				id: this.props.id,
				packId: this.props.packId,
				packType: this.props.packType,
			};
		}
	}

	module.exports = { StickerView };
});
