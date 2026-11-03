/**
 * @module im/messenger/provider/pull/sidebar/src/pending-file
 */
jn.define('im/messenger/provider/pull/sidebar/src/pending-file', (require, exports, module) => {
	// A sidebar is marked initialized before the first page of its tabs comes back, so a pull event
	// can arrive while the chat has no file collection at all: there is nothing to dispatch into and
	// the record is lost until the sidebar is opened again. It waits here instead, and the file
	// service takes it once the page it belongs to has been stored.
	//
	// One page of a tab per chat is the whole budget: the buffer bridges a single request, not a
	// listing. On overflow the OLDEST record goes - a record older than the page boundary is served
	// by the next page, while one newer than the boundary reaches no request but a fresh first page.
	const PENDING_FILE_LIMIT = 50;

	/** @type {Map<number, SidebarFile[]>} */
	const pendingFiles = new Map();

	// the chat id comes from a pull payload on one side and from a tab on the other; a Map keyed by a
	// string on one of them and by a number on the other would just miss
	function chatKey(chatId)
	{
		return Number(chatId);
	}

	/**
	 * @desc Keeps a record no collection of the chat can take yet.
	 * @param {number} chatId
	 * @param {SidebarFile} file
	 */
	function rememberPendingFile(chatId, file)
	{
		const key = chatKey(chatId);
		const files = pendingFiles.get(key) ?? [];

		files.push(file);

		while (files.length > PENDING_FILE_LIMIT)
		{
			files.shift();
		}

		pendingFiles.set(key, files);
	}

	/**
	 * @desc Drops a record deleted before any collection took it: a deletion that came before the
	 * flush must not be undone by the flush.
	 * @param {number} chatId
	 * @param {number} fileRecordId
	 */
	function forgetPendingFile(chatId, fileRecordId)
	{
		const key = chatKey(chatId);
		const files = pendingFiles.get(key);

		if (!files)
		{
			return;
		}

		const left = files.filter((file) => file.id !== fileRecordId);

		if (left.length === 0)
		{
			pendingFiles.delete(key);

			return;
		}

		pendingFiles.set(key, left);
	}

	/**
	 * @desc Takes the records the caller can store and leaves the rest: a record may belong to a
	 * collection another tab has not loaded yet.
	 * @param {number} chatId
	 * @param {function(string): boolean} matches
	 * @return {SidebarFile[]}
	 */
	function takePendingFiles(chatId, matches)
	{
		const key = chatKey(chatId);
		const files = pendingFiles.get(key);

		if (!files)
		{
			return [];
		}

		const taken = [];
		const left = [];

		files.forEach((file) => {
			if (matches(file.subType))
			{
				taken.push(file);

				return;
			}

			left.push(file);
		});

		if (taken.length === 0)
		{
			return [];
		}

		if (left.length === 0)
		{
			pendingFiles.delete(key);
		}
		else
		{
			pendingFiles.set(key, left);
		}

		return taken;
	}

	module.exports = {
		PENDING_FILE_LIMIT,
		rememberPendingFile,
		forgetPendingFile,
		takePendingFiles,
	};
});
