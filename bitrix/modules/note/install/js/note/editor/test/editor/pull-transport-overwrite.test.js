import {
	PullCommand,
	LIFECYCLE_COMMANDS,
	LIFECYCLE_CALLBACK_BY_COMMAND,
} from '../../src/collaboration/pull-transport';

describe('pull-transport — documentContentOverwritten routing', () => {

	it('exposes the command constant', () => {
		assert.strictEqual(PullCommand.DOCUMENT_CONTENT_OVERWRITTEN, 'documentContentOverwritten');
	});

	it('marks the command as a lifecycle event', () => {
		assert.isTrue(LIFECYCLE_COMMANDS.has(PullCommand.DOCUMENT_CONTENT_OVERWRITTEN));
	});

	it('routes the command to the onContentOverwritten callback', () => {
		assert.strictEqual(
			LIFECYCLE_CALLBACK_BY_COMMAND[PullCommand.DOCUMENT_CONTENT_OVERWRITTEN],
			'onContentOverwritten',
		);
	});

	it('keeps existing lifecycle wiring intact (no accidental regressions)', () => {
		assert.strictEqual(LIFECYCLE_CALLBACK_BY_COMMAND[PullCommand.DOCUMENT_UPDATE], 'onDocumentUpdate');
		assert.strictEqual(LIFECYCLE_CALLBACK_BY_COMMAND[PullCommand.DOCUMENT_ARCHIVE], 'onArchive');
		assert.strictEqual(LIFECYCLE_CALLBACK_BY_COMMAND[PullCommand.DOCUMENT_DELETE], 'onDelete');
		assert.strictEqual(LIFECYCLE_CALLBACK_BY_COMMAND[PullCommand.DOCUMENT_HARD_DELETE], 'onHardDelete');
		assert.strictEqual(LIFECYCLE_CALLBACK_BY_COMMAND[PullCommand.COLLECTION_CAPABILITIES], 'onCapabilities');
	});
});
