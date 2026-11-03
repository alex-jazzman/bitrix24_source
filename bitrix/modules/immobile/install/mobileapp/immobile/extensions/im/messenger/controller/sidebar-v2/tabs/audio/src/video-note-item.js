/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio/src/video-note-item
 */

jn.define('im/messenger/controller/sidebar-v2/tabs/audio/src/video-note-item', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Text4 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { SafeImage } = require('layout/ui/safe-image');
	const { createTestIdGenerator } = require('utils/test');

	const { FileStatus } = require('im/messenger/const');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ListItem } = require('im/messenger/controller/sidebar-v2/ui/layout/list-item');
	const { fileActionMenu } = require('im/messenger/controller/sidebar-v2/tabs/files/action-menu');
	const { Owner } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/ui/owner');
	const { TitleDate } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/ui/title-date');
	const {
		isVideoNoteProcessing,
		hasVideoNotePreview,
	} = require('im/messenger/controller/sidebar-v2/tabs/audio/src/row-state');

	// FileStatus.error is left out on purpose: a failed upload is not being processed, and the
	// tab has no phrase of its own for it, so such a record keeps the plain row.
	const PROCESSING_STATUSES = [FileStatus.upload, FileStatus.progress, FileStatus.wait];

	const PREVIEW_SIZE = 40;

	const previewStyle = {
		width: PREVIEW_SIZE,
		height: PREVIEW_SIZE,
		borderRadius: PREVIEW_SIZE / 2,
	};

	/**
	 * Row of a video note in the "Audio" tab. Playback is not offered here: a tap goes to the
	 * message, the same way the action menu of the tab does it.
	 *
	 * @extends {LayoutComponent<VideoNoteItemProps>}
	 */
	class VideoNoteItem extends LayoutComponent
	{
		/**
		 * @param {VideoNoteItemProps} props
		 */
		constructor(props)
		{
			super(props);

			/** @type {MessengerCoreStore} */
			this.store = serviceLocator.get('core').getStore();
			this.fileModel = this.store.getters['filesModel/getById'](props.fileId);
			this.getTestId = createTestIdGenerator({
				prefix: `sidebar-tab-audio-video-note-item-${props.fileId}`,
			});
		}

		render()
		{
			return new ListItem({
				testId: this.getTestId(),
				title: this.createTitle,
				subtitle: () => Owner(
					this.fileModel?.authorId,
					this.fileModel?.authorName,
					this.getTestId(),
				),
				onClick: this.goToMessage,
				leftIcon: this.createPreview,
				onShowMenu: this.showActionMenu,
			});
		}

		createTitle = () => {
			if (isVideoNoteProcessing(this.fileModel, PROCESSING_STATUSES))
			{
				return Text4({
					text: Loc.getMessage('IMMOBILE_SIDEBAR_V2_TAB_AUDIO_VIDEO_NOTE_PROCESSING'),
					color: Color.base3,
					numberOfLines: 1,
					ellipsize: 'end',
					testId: this.getTestId('processing'),
				});
			}

			return TitleDate(this.fileModel?.date, this.getTestId());
		};

		createPreview = () => {
			if (!hasVideoNotePreview(this.fileModel))
			{
				return this.createTypeIcon();
			}

			return SafeImage({
				testId: this.getTestId('preview'),
				uri: this.fileModel.urlPreview,
				resizeMode: 'cover',
				withShimmer: true,
				wrapperStyle: previewStyle,
				style: previewStyle,
				renderPlaceholder: this.createTypeIcon,
			});
		};

		createTypeIcon = () => {
			return View(
				{
					testId: this.getTestId('type-icon'),
					style: {
						...previewStyle,
						backgroundColor: Color.accentMainPrimaryalt.toHex(),
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				IconView({
					icon: Icon.SOLID_VIDEO_RECORD,
					size: PREVIEW_SIZE / 2 + 4,
					color: Color.baseWhiteFixed,
				}),
			);
		};

		goToMessage = () => {
			const { messageId, widgetNavigator } = this.props;

			void widgetNavigator.backToChatMessage(Number(messageId));
		};

		showActionMenu = ({ ref: target }) => {
			const { fileId, messageId, dialogId, widgetNavigator } = this.props;

			void fileActionMenu({
				testId: this.getTestId(),
				fileId,
				dialogId,
				messageId,
				widgetNavigator,
			}).show(target);
		};
	}

	module.exports = {
		VideoNoteItem,
	};
});
