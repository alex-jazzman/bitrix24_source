/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/uploading
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/uploading', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { SafeImage } = require('layout/ui/safe-image');
	const { IconView, Icon } = require('ui-system/blocks/icon');

	const { AsyncQueue, createPromiseWithResolvers } = require('im/messenger/lib/utils');

	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const {
		StickerEventType,
		UploadStatus,
	} = require('im/messenger/controller/dialog/lib/sticker/src/const');

	/**
	 * @class UploadingStickerView
	 * @typedef {LayoutComponent<UploadingStickerViewProps, UploadingStickerViewState>} UploadingStickerView
	 */
	class UploadingStickerView extends LayoutComponent
	{
		/**
		 * @param {UploadingStickerViewProps} props
		 */
		constructor(props)
		{
			super(props);
			this.state = {
				progress: 0,
				uploadStatus: UploadStatus.progress,
			};
			this.progressRef = null;
			this.ref = null;
			this.operationQueue = new AsyncQueue();
		}

		componentDidMount()
		{
			super.componentDidMount();
			emitter.on(StickerEventType.uploader.setProgress, this.#setProgressHandler);
			emitter.on(StickerEventType.uploader.complete, this.#completeHandler);
			emitter.on(StickerEventType.uploader.error, this.#errorHandler);
		}

		componentWillUnmount()
		{
			super.componentWillUnmount();
			emitter.off(StickerEventType.uploader.setProgress, this.#setProgressHandler);
			emitter.off(StickerEventType.uploader.complete, this.#completeHandler);
			emitter.off(StickerEventType.uploader.error, this.#errorHandler);
		}

		render()
		{
			const { uploadStatus, progress } = this.props.getUploadProgress(this.props.id);
			this.state.uploadStatus = uploadStatus;
			this.state.progress = progress;

			return View(
				{
					style: {
						...this.#getContainerStyle(),
					},
					onClick: this.clickHandler,
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
						opacity: this.state.uploadStatus === UploadStatus.complete ? 1 : 0.6,
					},
					resizeMode: 'contain',
					clickable: false,
				}),
				this.#renderUploadProcess(),
			);
		}

		#renderUploadProcess()
		{
			if (this.state.uploadStatus === UploadStatus.complete)
			{
				return null;
			}

			return ProgressView(
				{
					style: {
						width: 28,
						height: 28,
						borderRadius: 14,
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: Color.base7.toHex(),
						position: 'absolute',
					},
					params: {
						type: 'circle',
						currentPercent: this.state.uploadStatus === UploadStatus.progress
							? this.state.progress
							: 100,
						color: this.state.uploadStatus === UploadStatus.progress
							? Color.accentMainPrimaryalt.toHex()
							: Color.accentSoftRed1.toHex(),
					},
					ref: (ref) => {
						this.progressRef = ref;
					},
				},
				View(
					{
						style: {
							position: 'absolute',
							width: 24,
							height: 24,
							borderRadius: 12,
							backgroundColor: Color.base8.toHex(),
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					IconView(
						{
							style: {
								width: 18,
								height: 18,
							},
							size: 8,
							color: Color.base2,
							icon: this.state.uploadStatus === UploadStatus.progress
								? Icon.CROSS
								: Icon.REFRESH,
						},
					),
				),
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

		clickHandler = () => {
			if (this.state.uploadStatus === UploadStatus.progress)
			{
				this.props.onUploadCancelClick(this.props.id);

				return;
			}

			if (this.state.uploadStatus === UploadStatus.error)
			{
				this.setState(
					{
						uploadStatus: UploadStatus.progress,
						progress: 0,
					},
					() => {
						this.props.onRetryUpload(this.props.id);
					},
				);

				return;
			}

			if (this.state.uploadStatus === UploadStatus.complete)
			{
				this.props.onClick(this.props.id, this.ref);
			}
		};

		#setProgressHandler = (id, percent) => {
			if (id !== this.props.id)
			{
				return;
			}

			this.operationQueue.enqueue(() => {
				const { promise, resolve } = createPromiseWithResolvers();

				this.progressRef.setProgress(percent, { duration: 0, style: 'easeInOut' }, resolve);

				return promise;
			});
		};

		#completeHandler = (id) => {
			if (id !== this.props.id)
			{
				return;
			}

			this.operationQueue.enqueue(() => {
				const { promise, resolve } = createPromiseWithResolvers();

				this.setState({ uploadStatus: UploadStatus.complete }, resolve);

				return promise;
			});
		};

		#errorHandler = (id) => {
			if (id !== this.props.id)
			{
				return;
			}

			this.operationQueue.enqueue(() => {
				const { promise, resolve } = createPromiseWithResolvers();

				this.setState({ uploadStatus: UploadStatus.complete }, () => {
					this.setState({ uploadStatus: UploadStatus.error }, resolve);
				});

				return promise;
			});
		};
	}

	module.exports = { UploadingStickerView };
});
