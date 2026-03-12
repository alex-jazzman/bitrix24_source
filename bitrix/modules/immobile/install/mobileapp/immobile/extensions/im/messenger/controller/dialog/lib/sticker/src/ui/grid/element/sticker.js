/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/sticker
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/sticker', (require, exports, module) => {
	const { SafeImage } = require('layout/ui/safe-image');

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
						this.props.onClick(this.props.id, this.ref);
					},
					onLongClick: () => this.props.onLongClick(this.props.id, this.ref),
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
	}

	module.exports = { StickerView };
});
