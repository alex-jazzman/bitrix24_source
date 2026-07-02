/**
 * @module mail/message-grid/navigation/src/filter-controller
 */
jn.define('mail/message-grid/navigation/src/filter-controller', (require, exports, module) => {
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const { MessageGridFilter } = require('mail/message-grid/navigation/src/filter');

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
			});

			return { shouldReload: true };
		}

		handleFolderSelection(folder)
		{
			this.#applyUpdates({ folderPath: folder.path, virtualFolderKey: null });

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
				tabId: MessageGridFilter.tabType.allIncome,
			});

			return { shouldReload: true };
		}

		handleTabSelection({ tabId, currentFolder, inboxFolder, outcomeFolder })
		{
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
