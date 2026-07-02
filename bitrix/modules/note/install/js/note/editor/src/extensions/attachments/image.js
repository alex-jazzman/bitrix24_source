import { FileAssetNodeFactory } from './base';
import { ImageAttachmentNodeViewComponent } from '../../components/nodes/image-card';

export const ImageAttachment = FileAssetNodeFactory.createNode({
	name: 'imageAttachment',
	dataType: 'imageAttachment',
	className: 'note-editor-image-attachment',
	defaultNameMessage: 'NOTE_EDITOR_FILE_ATTACHMENT_UNTITLED',
	defaultTypeMessage: 'NOTE_EDITOR_FILE_ATTACHMENT_TYPE_IMAGE',
	nodeViewComponent: ImageAttachmentNodeViewComponent,
});
