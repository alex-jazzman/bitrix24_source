import { FileAssetNodeFactory } from './base';
import { FileAttachmentNodeViewComponent } from '../../components/nodes/file-attachment';

export const FileAttachment = FileAssetNodeFactory.createNode({
	name: 'fileAttachment',
	dataType: 'fileAttachment',
	className: 'note-editor-file-attachment',
	assetType: 'file',
	defaultNameMessage: 'NOTE_EDITOR_FILE_ATTACHMENT_UNTITLED',
	defaultTypeMessage: 'NOTE_EDITOR_FILE_ATTACHMENT_TYPE_FILE',
	nodeViewComponent: FileAttachmentNodeViewComponent,
});
