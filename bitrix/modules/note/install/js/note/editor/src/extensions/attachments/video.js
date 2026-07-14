import { FileAssetNodeFactory } from './base';
import { VideoAttachmentNodeViewComponent } from '../../components/nodes/video-attachment';

export const Video = FileAssetNodeFactory.createNode({
	name: 'video',
	dataType: 'videoAttachment',
	className: 'note-editor-video-attachment',
	assetType: 'video',
	defaultNameMessage: 'NOTE_EDITOR_FILE_ATTACHMENT_UNTITLED',
	defaultTypeMessage: 'NOTE_EDITOR_FILE_ATTACHMENT_TYPE_VIDEO',
	nodeViewComponent: VideoAttachmentNodeViewComponent,
	commandName: 'setVideo',
	parseHTMLTags: [
		'div[data-type="videoAttachment"]',
		'video[src]',
	],
	extraAttrs: {
		src: {
			default: null,
		},
		controls: {
			default: true,
		},
	},
});
