/* eslint-disable no-await-in-loop */
/**
 * @module im/messenger/lib/dev/menu/recent-snippets
 */
jn.define('im/messenger/lib/dev/menu/src/recent-snippets', (require, exports, module) => {
	/* globals tabs */
	const AppTheme = require('apptheme');
	const { Alert } = require('alert');
	const { CheckBox } = require('im/messenger/lib/ui/base/checkbox');

	class RecentSnippets extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.state = {
				// Folder/Chat creation state
				folderCount: 10,
				chatCount: 5,
				minDelayAfterSetItemsMs: 500,
				isProcessing: false,
				addRightButton: true,

				// Recent update section state
				updateTabsPercent: 10,
				updateChatsPercent: 10,
				updateIntervalMs: 1000,
				isUpdating: false,
			};
			this.updateIntervalId = null;
			this.updateCount = 0;

			// Input refs
			this.folderCountRef = null;
			this.chatCountRef = null;
			this.minDelayAfterSetItemsMsRef = null;
			this.updateTabsPercentRef = null;
			this.updateChatsPercentRef = null;
			this.updateIntervalMsRef = null;
		}

		componentWillUnmount()
		{
			this.stopRecentUpdates();
		}

		stopRecentUpdates()
		{
			if (this.updateIntervalId)
			{
				clearInterval(this.updateIntervalId);
				this.updateIntervalId = null;
			}
			this.updateCount = 0;
			if (this.state.isUpdating)
			{
				this.setState({ isUpdating: false });
			}
		}

		blurAllInputs()
		{
			this.folderCountRef?.blur?.({ hideKeyboard: true });
			this.chatCountRef?.blur?.({ hideKeyboard: true });
			this.minDelayAfterSetItemsMsRef?.blur?.({ hideKeyboard: true });
			this.updateTabsPercentRef?.blur?.({ hideKeyboard: true });
			this.updateChatsPercentRef?.blur?.({ hideKeyboard: true });
			this.updateIntervalMsRef?.blur?.({ hideKeyboard: true });
		}

		render()
		{
			return ScrollView(
				{
					style:
						{
							flex: 1,
							flexDirection: 'column',
							alignItems: 'center',
						},
				},
				View(
					{
						onClick: () => {
							this.blurAllInputs();
						},
					},
					View(
						{
							style: {
								backgroundColor: '#f7f7f7',
								borderRadius: 8,
								borderWidth: 1,
								borderColor: '#e0e0e0',
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.07,
								shadowRadius: 4,
								marginBottom: 24,
								padding: 16,
							},
						},
						Text({ text: 'Folders Create', style: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 } }),
						Text({ text: 'folderCount:' }),
						TextInput({
							style: { borderWidth: 1, borderColor: '#ccc', marginBottom: 8, padding: 4, borderRadius: 4 },
							placeholder: 'folderCount',
							value: String(this.state.folderCount),
							onChangeText: (text) => this.setState({ folderCount: Number(text) }),
							keyboardType: 'numeric',
							ref: (ref) => {
								this.folderCountRef = ref;
							},
							onBlur: () => {
								this.folderCountRef?.blur?.({ hideKeyboard: true });
							},
						}),
						Text({ text: 'chatCount:' }),
						TextInput({
							style: { borderWidth: 1, borderColor: '#ccc', marginBottom: 8, padding: 4, borderRadius: 4 },
							placeholder: 'chatCount',
							value: String(this.state.chatCount),
							onChangeText: (text) => this.setState({ chatCount: Number(text) }),
							keyboardType: 'numeric',
							ref: (ref) => {
								this.chatCountRef = ref;
							},
							onBlur: () => {
								this.chatCountRef?.blur?.({ hideKeyboard: true });
							},
						}),
						Text({ text: 'minDelayAfterSetItemsMs:' }),
						TextInput({
							style: { borderWidth: 1, borderColor: '#ccc', marginBottom: 16, padding: 4, borderRadius: 4 },
							placeholder: 'minDelayAfterSetItemsMs',
							value: String(this.state.minDelayAfterSetItemsMs),
							onChangeText: (text) => this.setState({ minDelayAfterSetItemsMs: Number(text) }),
							keyboardType: 'numeric',
							ref: (ref) => {
								this.minDelayAfterSetItemsMsRef = ref;
							},
							onBlur: () => {
								this.minDelayAfterSetItemsMsRef?.blur?.({ hideKeyboard: true });
							},
						}),
						View(
							{ style: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 } },
							new CheckBox({
								checked: this.state.addRightButton,
								onClick: () => this.setState({ addRightButton: !this.state.addRightButton }),
							}),
							Text({ text: 'Add right button (settings)', style: { marginLeft: 8 } }),
						),
						Button({
							style: {
								backgroundColor: AppTheme.colors.accentMainSuccess,
								marginBottom: 10,
							},
							text: this.state.isProcessing ? 'Processing...' : 'Add Folders/Chats',
							disabled: this.state.isProcessing,
							onClick: () => this.handleAdd(),
						}),
						Button({
							style: {
								backgroundColor: AppTheme.colors.accentMainAlert,
							},
							text: this.state.isProcessing ? 'Processing...' : 'Remove Folders',
							disabled: this.state.isProcessing,
							onClick: () => this.handleRemove(),
						}),
					),
					// Recent Update Section
					View(
						{
							style: {
								borderTopWidth: 1,
								borderTopColor: '#e0e0e0',
								backgroundColor: '#f7f7f7',
								borderRadius: 8,
								borderWidth: 1,
								borderColor: '#e0e0e0',
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.07,
								shadowRadius: 4,
								padding: 16,
							},
						},
						Text({ text: 'Recent Update', style: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 } }),
						Text({ text: 'Tabs to update (%):' }),
						TextInput({
							style: { borderWidth: 1, borderColor: '#ccc', marginBottom: 8, padding: 4, borderRadius: 4 },
							placeholder: 'Tabs percent',
							value: String(this.state.updateTabsPercent),
							onChangeText: (text) => this.setState({ updateTabsPercent: Number(text) }),
							keyboardType: 'numeric',
							editable: !this.state.isUpdating,
							ref: (ref) => {
								this.updateTabsPercentRef = ref;
							},
							onBlur: () => {
								this.updateTabsPercentRef?.blur?.({ hideKeyboard: true });
							},
						}),
						Text({ text: 'Chats to update (%):' }),
						TextInput({
							style: { borderWidth: 1, borderColor: '#ccc', marginBottom: 8, padding: 4, borderRadius: 4 },
							placeholder: 'Chats percent',
							value: String(this.state.updateChatsPercent),
							onChangeText: (text) => this.setState({ updateChatsPercent: Number(text) }),
							keyboardType: 'numeric',
							editable: !this.state.isUpdating,
							ref: (ref) => {
								this.updateChatsPercentRef = ref;
							},
							onBlur: () => {
								this.updateChatsPercentRef?.blur?.({ hideKeyboard: true });
							},
						}),
						Text({ text: 'Update interval (ms):' }),
						TextInput({
							style: { borderWidth: 1, borderColor: '#ccc', marginBottom: 16, padding: 4, borderRadius: 4 },
							placeholder: 'Interval ms',
							value: String(this.state.updateIntervalMs),
							onChangeText: (text) => this.setState({ updateIntervalMs: Number(text) }),
							keyboardType: 'numeric',
							editable: !this.state.isUpdating,
							ref: (ref) => {
								this.updateIntervalMsRef = ref;
							},
							onBlur: () => {
								this.updateIntervalMsRef?.blur?.({ hideKeyboard: true });
							},
						}),
						View(
							{ style: { flexDirection: 'row', justifyContent: 'space-between' } },
							Button({
								style: {
									backgroundColor: this.state.isUpdating ? '#cccccc' : AppTheme.colors.accentMainSuccess,
									flex: 1,
									marginRight: 8,
								},
								text: 'Start Update',
								disabled: this.state.isUpdating,
								onClick: () => this.startRecentUpdates(),
							}),
							Button({
								style: {
									backgroundColor: this.state.isUpdating ? AppTheme.colors.accentMainAlert : '#cccccc',
									flex: 1,
									marginLeft: 8,
								},
								text: 'Stop Update',
								disabled: !this.state.isUpdating,
								onClick: () => this.stopRecentUpdates(),
							}),
						),
					),
				),
			);
		}

		async handleAdd()
		{
			if (this.state.isProcessing)
			{
				return;
			}
			this.setState({ isProcessing: true });
			try
			{
				await addFoldersAndChats({
					folderCount: this.state.folderCount,
					chatCount: this.state.chatCount,
					minDelayAfterSetItemsMs: this.state.minDelayAfterSetItemsMs,
					addRightButton: this.state.addRightButton,
				});
				Alert.alert('Success', 'Folders and chats added!');
			}
			catch (error)
			{
				console.error(error);
				Alert.alert('Error', 'Failed to add folders/chats');
			}
			this.setState({ isProcessing: false });
		}

		async handleRemove()
		{
			if (this.state.isProcessing)
			{
				return;
			}
			this.setState({ isProcessing: true });
			try
			{
				await removeAllFolderTabs();
				Alert.alert('Success', 'Folders removed!');
			}
			catch (error)
			{
				console.error(error);
				Alert.alert('Error', 'Failed to remove folders');
			}
			this.setState({ isProcessing: false });
		}

		startRecentUpdates()
		{
			if (this.state.isUpdating)
			{
				return;
			}
			const tabsWidget = tabs;
			if (!tabsWidget || !tabsWidget.nestedWidgets)
			{
				Alert.alert('Error', 'Tabs widget not found');

				return;
			}
			const widgets = tabsWidget.nestedWidgets();
			const folderTabIds = Object.keys(widgets)
				.filter((id) => id.startsWith('folder-test-'))
				.sort((a, b) => {
					const aNum = Number(a.replace('folder-test-', ''));
					const bNum = Number(b.replace('folder-test-', ''));

					return aNum - bNum;
				});
			if (folderTabIds.length === 0)
			{
				Alert.alert('Error', 'No test folders found');

				return;
			}

			const tabsPercent = Math.max(1, Math.floor(folderTabIds.length * this.state.updateTabsPercent / 100));
			const tabsToUpdate = folderTabIds.slice(0, tabsPercent);

			const updateInterval = Number(this.state.updateIntervalMs) || 1000;
			const chatsPercent = Number(this.state.updateChatsPercent) || 10;

			this.updateCount = 0;
			this.setState({ isUpdating: true }, () => {
				Alert.alert('Recent Update', 'Recent update started with current settings.');
				console.log(`🟢 Start: update recent in tabs: ${tabsToUpdate}`);
			});

			this.updateIntervalId = setInterval(() => {
				this.updateCount += 1;
				tabsToUpdate.forEach((tabId) => {
					const widget = widgets[tabId];
					if (!widget || typeof widget.updateItems !== 'function')
					{
						return;
					}

					const chatCount = (this.state.chatCount || 1);
					const chatsToUpdateNum = Math.max(1, Math.floor(chatCount * chatsPercent / 100));
					const itemsToUpdate = [];
					for (let i = 0; i < chatsToUpdateNum; i++)
					{
						const tabNumber = Number(tabId.replace('folder-test-', ''));
						const chatId = `chat${tabNumber}_${i + 1}`;
						itemsToUpdate.push({
							filter: { id: chatId },
							element: {
								subtitle: `Updated #${this.updateCount}`,
							},
						});
					}

					widget.updateItems(itemsToUpdate);
				});
			}, updateInterval);
		}
	}

	/**
	 * @returns {Object}
	 */
	function createSettingsButton()
	{
		return {
			id: 'settings',
			type: 'settings',
			iconName: 'settings',
			callback: () => {
				if (window.messengerDebug && typeof window.messengerDebug.showDeveloperMenu === 'function')
				{
					window.messengerDebug.showDeveloperMenu();
				}
			},
		};
	}

	/**
	 * @desc Add folders and chats
	 * @param {Object} params
	 * @param {number} params.folderCount
	 * @param {number} params.chatCount
	 * @param {number} params.minDelayAfterSetItemsMs
	 * @param {boolean} params.addRightButton
	 * @returns {Promise<void>}
	 */
	async function addFoldersAndChats({
		folderCount = 50,
		chatCount = 50,
		minDelayAfterSetItemsMs = 500,
		addRightButton = true,
	} = {})
	{
		const MAX_RETRIES = 3;

		// check tabs available
		const tabsWidget = tabs;
		if (!tabsWidget)
		{
			throw new Error('tabsWidget not found');
		}

		// check existing folder-test tabs and determine start index
		let maxIndex = 0;
		const widgets = tabsWidget.nestedWidgets ? tabsWidget.nestedWidgets() : {};
		const existingFolderTabIds = Object.keys(widgets)
			.filter((id) => /^folder-test-\d+$/.test(id));
		existingFolderTabIds.forEach((id) => {
			const match = id.match(/^folder-test-(\d+)$/);
			if (match)
			{
				const num = parseInt(match[1], 10);
				if (num > maxIndex)
				{
					maxIndex = num;
				}
			}
		});

		console.log(`⚠️ Existing test folders in nestedWidgets. Max index: ${maxIndex}. Found ids:`, existingFolderTabIds);
		// create folder array
		const folders = [];
		for (let i = 0; i < folderCount; i++)
		{
			const tabIndex = maxIndex + i + 1;
			folders.push({
				id: `folder-test-${tabIndex}`,
				title: `My folder ${tabIndex}`,
				counter: 0,
				active: false,
				widget: {
					name: 'chat.recent',
					code: `folder-test-${tabIndex}`,
				},
			});
		}

		function findItemAsync(widget, chatId)
		{
			return new Promise((resolve) => {
				if (!widget || !widget.findItem)
				{
					resolve(null);

					return;
				}

				try
				{
					widget.findItem({ id: chatId }, (item) => {
						resolve(item);
					});
				}
				catch
				{
					resolve(null);
				}
			});
		}

		async function waitForWidget(tabId, maxTries = 20, delay = 200)
		{
			for (let i = 0; i < maxTries; i++)
			{
				const widgetArray = tabsWidget.nestedWidgets();
				if (widgetArray && widgetArray[tabId])
				{
					return widgetArray[tabId];
				}
				await new Promise((resolve) => {
					setTimeout(resolve, delay);
				});
			}

			return null;
		}

		function delay(ms)
		{
			return new Promise((resolve) => {
				setTimeout(resolve, ms);
			});
		}

		console.log('🟢 Start: adding tabs...');
		let tabsAdded = false;
		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++)
		{
			try
			{
				await tabsWidget.addItems(folders);
				tabsAdded = true;
				console.log(`✅ All ${folders.length} tabs added.`);
				break;
			}
			catch (error)
			{
				console.error(`❌ Error adding tabs (attempt ${attempt}):`, error);
				if (attempt === MAX_RETRIES)
				{
					console.error(`⏭️ Aborting after ${MAX_RETRIES} failed attempts.`);
				}
				else
				{
					await delay(500 * attempt);
				}
			}
		}

		if (!tabsAdded)
		{
			throw new Error('Tabs not added');
		}

		let widgetsReady = false;
		for (let i = 0; i < folderCount; i++)
		{
			const widgets = tabsWidget.nestedWidgets();

			const folderTabsHas = Object.keys(widgets)?.filter((tab) => tab.startsWith('folder-test'));
			console.log(`⚠️ Checking new tabs in nestedWidgets, total: ${(folderTabsHas.length - maxIndex)}`);
			if ((folderTabsHas.length - maxIndex) >= folders.length)
			{
				widgetsReady = true;
				break;
			}
			console.log(`⏳ Waiting for nestedWidgets initialization... (${i + 1}/${folderCount})`);
			await delay(300);
		}

		if (!widgetsReady)
		{
			console.warn('⚠️ [addFoldersAndChats] nestedWidgets not fully initialized, aborting further execution');
			throw new Error('nestedWidgets not ready');
		}

		await delay(300);

		for (const [i, folder] of folders.entries())
		{
			let tabActivated = false;
			console.log(`➡️ (${i + 1}/${folders.length}) Switching to tab "${folder.title}"...`);
			for (let attempt = 1; attempt <= MAX_RETRIES; attempt++)
			{
				try
				{
					await tabsWidget.setActiveItem(folder.id);
					tabActivated = true;
					console.log(`✅ Tab "${folder.title}" set as active.`);
					break;
				}
				catch (error)
				{
					console.error(
						`❌ Error activating tab "${folder.title}" (attempt ${attempt}):`,
						error,
					);
					if (attempt === MAX_RETRIES)
					{
						console.error(`⏭️ Skipping tab "${folder.title}" after ${MAX_RETRIES} failed attempts.`);
					}
					else
					{
						await delay(500 * attempt);
					}
				}
			}

			if (!tabActivated)
			{
				continue;
			}

			const widget = await waitForWidget(folder.id);
			if (!widget)
			{
				console.error(`❌ Failed to get widget for tab "${folder.title}". Skipping.`);
				continue;
			}

			// Add right button if enabled
			if (addRightButton && typeof widget.setRightButtons === 'function')
			{
				try
				{
					widget.setRightButtons([createSettingsButton()]);
					console.log(`⚙️ Right button added for "${folder.title}"`);
				}
				catch (error)
				{
					console.error(`❌ Error adding right button for "${folder.title}":`, error);
				}
			}

			const chats = generateChats(chatCount, i);
			let chatsAdded = false;
			const setItemsStart = Date.now();
			for (let attempt = 1; attempt <= MAX_RETRIES; attempt++)
			{
				try
				{
					console.log(`💬 Adding ${chats.length} chats to "${folder.title}" (attempt ${attempt})...`);
					await widget.setItems(chats);
					chatsAdded = true;
					console.log(`✅ Chats successfully added to "${folder.title}".`);
					break;
				}
				catch (error)
				{
					console.error(
						`❌ Error adding chats to "${folder.title}" (attempt ${attempt}):`,
						error,
					);
					if (attempt === MAX_RETRIES)
					{
						console.error(`⏭️ Skipping chats for "${folder.title}" after ${MAX_RETRIES} failed attempts.`);
					}
					else
					{
						await delay(500 * attempt);
					}
				}
			}

			if (!chatsAdded)
			{
				continue;
			}

			const elapsed = Date.now() - setItemsStart;
			if (elapsed < minDelayAfterSetItemsMs)
			{
				await delay(minDelayAfterSetItemsMs - elapsed);
			}

			const chatId = `chat${i + 1}_1`;
			const item = await findItemAsync(widget, chatId);
			if (item)
			{
				console.log(`🟢 Chat "${chatId}" successfully found in "${folder.title}".`);
			}
			else
			{
				console.error(`🔴 Chat "${chatId}" not found in "${folder.title}" after adding!`);
			}
		}
		console.log('🏁 Script finished.');
	}

	function generateChats(chatCount, folderIndex)
	{
		const chats = [];
		for (let j = 0; j < chatCount; j++)
		{
			chats.push({
				actions: [
					{ title: 'Mute', identifier: 'mute', iconName: 'notification_off', color: '#909090' },
					{ title: 'Hide', iconName: 'box_with_lid', identifier: 'hide', color: '#FF5752' },
					{
						title: 'Pin',
						identifier: 'pin',
						color: '#1F86FF',
						iconName: 'pin',
						direction: 'leftToRight',
					},
					{
						title: 'Mark as unread',
						iconName: 'chats_with_check',
						identifier: 'unread',
						color: '#1BCE7B',
						direction: 'leftToRight',
					},
				],
				avatar: {
					accentType: 'blue',
					backBorderWidth: 0,
					backColor: '#ffffff',
					hideOutline: true,
					placeholder: { type: 'auto', backgroundColor: '#3e99ce', letters: { fontSize: 20 } },
					polygonAngle: 30,
					radius: 8,
					title: `chat-${folderIndex + 1}-${j + 1}`,
					type: 'circle',
					uri: null,
				},
				backgroundColor: '',
				color: '#3e99ce',
				counterTestId: null,
				date: Date.now() / 1000,
				displayedDate: 'Tue',
				id: `chat${folderIndex + 1}_${j + 1}`,
				imageUrl: null,
				isSuperEllipseIcon: false,
				menuMode: 'dialog',
				messageCount: 0,
				params: {
					model: {},
					options: {},
					id: `chat${folderIndex + 1}_${j + 1}`,
					type: undefined,
					useLetterImage: true,
				},
				sectionCode: 'general',
				sortValues: { order: Date.now() / 1000 },
				styles: {
					title: {
						font: { fontStyle: 'semibold', color: '#333333', useColor: true },
						additionalImage: {},
						showBBCode: true,
					},
					subtitle: { showBBCode: true, image: { name: 'reply', sizeMultiplier: 0.7 } },
					avatar: {},
					date: { image: { sizeMultiplier: 0.7, url: '', name: 'double_check', tintColor: '#1F86FF' } },
					counter: { backgroundColor: '#1F86FF' },
				},
				subtitle: `Chat ${j + 1} in folder ${folderIndex + 1}`,
				title: `Chat ${j + 1}`,
				unread: false,
			});
		}

		return chats;
	}

	async function removeAllFolderTabs()
	{
		const tabsWidget = tabs;
		if (!tabsWidget)
		{
			throw new Error('tabsWidget not found');
		}

		const widgets = tabsWidget.nestedWidgets ? tabsWidget.nestedWidgets() : {};
		const folderTabIds = Object.keys(widgets).filter((id) => id.startsWith('folder-test-'));
		if (folderTabIds.length === 0)
		{
			console.log('ℹ️ [removeAllFolderTabs] No tabs with id starting with "folder-test-".');

			return;
		}

		try
		{
			console.log('trying remove tabs id:', folderTabIds);
			const result = await tabsWidget.removeItems(folderTabIds);
			if (result)
			{
				console.log('tabsWidget.removeItems result:', result);
			}
		}
		catch (error)
		{
			console.error('tabsWidget.removeItems catch:', error);
			throw new Error('Tabs not removed');
		}
	}

	module.exports = { RecentSnippets };
});
