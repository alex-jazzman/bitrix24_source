/**
 * @module mail/message-grid/navigation/src/filter-controller
 */
jn.define('mail/message-grid/navigation/src/filter-controller', (require, exports, module) => {
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const { MessageGridFilter } = require('mail/message-grid/navigation/src/filter');
	const { LABEL } = require('mail/folder/virtual/src/keys');

	class MessageGridFilterController
	{
		constructor({ mailboxId = null, search = null } = {})
		{
			this.search = search;
			this.filter = new MessageGridFilter({
				tabId: MessageGridFilter.tabType.allIncome,
				mailboxId: mailboxId !== 0 ? Number(mailboxId) : null,
			});
		}

		getActionParams()
		{
			return this.filter.getActionParams();
		}

		/**
		 * The label the request currently carries. The observers report the state of the store, which
		 * may already be ahead of the filter, so the caller compares the two instead of guessing the
		 * order the store notified its subscribers in.
		 *
		 * @returns {number|null}
		 */
		getLabelId()
		{
			return this.filter.getLabelId();
		}

		syncFolderPath(folderPath)
		{
			this.filter.setFolderPath(folderPath);
		}

		handleMailboxSelection(mailboxId)
		{
			this.#applyUpdates({
				folderPath: null,
				mailboxId: Number(mailboxId),
				virtualFolderKey: null,
				labelId: null,
			});

			return { shouldReload: true };
		}

		handleFolderSelection(folder)
		{
			this.#applyUpdates({ folderPath: folder.path, virtualFolderKey: null, labelId: null });

			return {
				activeTabId: this.#resolveActiveTabIdByFolder(folder),
				shouldReload: true,
			};
		}

		handleVirtualFolderSelection(virtualFolderKey)
		{
			this.#applyUpdates({
				virtualFolderKey,
				folderPath: null,
				labelId: null,
				tabId: MessageGridFilter.tabType.allIncome,
			});

			return { shouldReload: true };
		}

		handleLabelSelection(labelId)
		{
			this.#applyUpdates({
				virtualFolderKey: LABEL,
				labelId,
				folderPath: null,
				tabId: MessageGridFilter.tabType.allIncome,
			});

			return { shouldReload: true };
		}

		handleTabSelection({ tabId, currentFolder, inboxFolder, outcomeFolder })
		{
			// A label gathers messages of the whole mailbox, so the server drops the sent-folder filter
			// in this mode. Applying the tab anyway would leave the whole label under the title
			// «Отправленные», so the selection goes back to the tab of all incoming messages.
			if (tabId === MessageGridFilter.tabType.sent && !this.filter.isSentTabAvailable())
			{
				return {
					activeTabId: MessageGridFilter.tabType.allIncome,
					shouldReload: false,
				};
			}

			if (this.filter.getVirtualFolderKey() !== null)
			{
				this.#applyUpdates({ tabId });

				return { shouldReload: true };
			}

			if (
				tabId === MessageGridFilter.tabType.unread
				&& currentFolder
				&& currentFolder.type === DefaultFolderType.OUTCOME.value
				&& inboxFolder !== null
			)
			{
				this.filter.setTabId(MessageGridFilter.tabType.unread);

				return {
					folderPath: inboxFolder.path,
					shouldReload: false,
				};
			}

			if (tabId === MessageGridFilter.tabType.sent)
			{
				if (outcomeFolder !== null)
				{
					this.filter.setTabId(MessageGridFilter.tabType.allIncome);

					return {
						folderPath: outcomeFolder.path,
						shouldReload: false,
					};
				}

				return { shouldReload: false };
			}

			if (
				currentFolder
				&& currentFolder.type === DefaultFolderType.OUTCOME.value
				&& tabId === MessageGridFilter.tabType.allIncome
			)
			{
				if (inboxFolder !== null)
				{
					return {
						folderPath: inboxFolder.path,
						shouldReload: false,
					};
				}

				return { shouldReload: false };
			}

			this.#applyUpdates({ tabId });

			return { shouldReload: true };
		}

		handleSearch({ text, presetId })
		{
			this.#applyUpdates({
				searchString: text ?? '',
				presetId: this.#normalizePresetId(presetId),
			});

			return { shouldReload: true };
		}

		#resolveActiveTabIdByFolder(folder)
		{
			if (folder.type === DefaultFolderType.OUTCOME.value)
			{
				return MessageGridFilter.tabType.sent;
			}

			if (this.filter.getTabId() !== MessageGridFilter.tabType.unread)
			{
				return MessageGridFilter.tabType.allIncome;
			}

			return null;
		}

		#normalizePresetId(presetId)
		{
			const defaultPresetId = this.search?.getDefaultPresetId?.();

			return presetId && presetId !== defaultPresetId ? presetId : '';
		}

		#shouldResetPreset(updates)
		{
			return (
				Object.prototype.hasOwnProperty.call(updates, 'folderPath')
				|| Object.prototype.hasOwnProperty.call(updates, 'tabId')
				|| Object.prototype.hasOwnProperty.call(updates, 'mailboxId')
				|| Object.prototype.hasOwnProperty.call(updates, 'virtualFolderKey')
			);
		}

		#applyUpdates(updates)
		{
			if (this.#shouldResetPreset(updates))
			{
				this.#resetActivePreset();
			}

			this.filter.applyUpdates(updates);
		}

		#resetActivePreset()
		{
			if (!this.filter.getPresetId())
			{
				return;
			}

			this.filter.clearPreset();

			if (this.search)
			{
				this.search.presetId = this.search.getDefaultPresetId();
				this.search.selectedPresetBackground = null;
				this.search.searchLayoutView?.setPresetId(this.search.presetId, this.search.counterId);
			}
		}
	}

	module.exports = { MessageGridFilterController };
});
