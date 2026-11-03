/**
 * @module tab-presets/managed/src/managed/tab-presets-navigation
 */
jn.define('tab-presets/managed/src/managed/tab-presets-navigation', (require, exports, module) => {
	const {
		getPresetInfoImagePath,
		preloadPresetInfoImage,
	} = require('tab-presets/managed/src/managed/utils');
	const { PresetInfo } = require('tab-presets/managed/src/managed/preset-info');
	const { Icon } = require('ui-system/blocks/icon');
	const { Loc } = require('loc');
	const { requireLazy } = require('require-lazy');
	const {
		PresetBottomMenuAnalytics,
		PresetBottomMenuAnalyticsEvent,
		PresetBottomMenuAnalyticsRole,
		PresetBottomMenuAnalyticsType,
	} = require('tab-presets');

	/**
	 * @param {OpenPresetInfoScreenParams} params
	 * @return {Promise<void>}
	 */
	async function openPresetInfoScreen(params)
	{
		const {
			parentWidget,
			testId,
			presetId,
			title,
			tabsDescription,
			isSelected,
			preset,
			tabs,
			onPresetSelected,
		} = params;
		const normalizedTabsDescription = getPresetTabsDescription({
			tabs: preset?.tabs ?? {},
			tabsDescription,
			tabItems: tabs?.list ?? {},
		});
		const tabsIcons = getPresetTabsIcons(normalizedTabsDescription, tabs?.list ?? {});
		const layoutWidget = await parentWidget
			.openWidget('layout', {
				titleParams: {
					text: title,
				},
				backdrop: {
					mediumPositionPercent: 100,
				},
			})
			.catch(console.error)
		;

		if (!layoutWidget)
		{
			return;
		}
		await preloadPresetInfoImage(presetId).catch(console.error);

		layoutWidget.showComponent(new PresetInfo({
			tabsDescription: normalizedTabsDescription,
			presetTitle: title,
			presetImagePath: getPresetInfoImagePath(presetId),
			isPresetSelected: isSelected,
			tabsIcons,
			parentWidget: layoutWidget,
			testId: `${testId}_preset_${presetId}_info`,
			onPresetSelected,
		}));

		setCloseButton(layoutWidget);
		expandWidget(layoutWidget);
	}

	/**
	 * @param {OpenManagedPresetEditorParams} params
	 * @return {Promise<void>}
	 */
	async function openManagedPresetEditor(params)
	{
		const {
			parentWidget,
			preset = null,
			getEditorContext,
			onSave,
			onInstallSelf,
			onSetMainTool,
			onOpenRecipientPicker,
		} = params;
		const { ManagedPresetEditor } = await loadEditorsExtension();
		if (!ManagedPresetEditor)
		{
			return;
		}
		const { tabs, capabilities } = getEditorContext();

		const title = preset
			? Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_EDIT_TITLE')
			: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_CREATE_TITLE');
		const layoutWidget = await openEditorWidget(parentWidget, title);
		if (!layoutWidget)
		{
			return;
		}

		PresetBottomMenuAnalytics.send({
			event: preset
				? PresetBottomMenuAnalyticsEvent.EDIT_PRESET
				: PresetBottomMenuAnalyticsEvent.ADD_PRESET,
			type: PresetBottomMenuAnalyticsType.CUSTOM_MANAGER,
			role: PresetBottomMenuAnalyticsRole.MANAGER,
		});

		const editor = new ManagedPresetEditor({
			tabs,
			preset,
			parentWidget: layoutWidget,
			canAssign: preset?.isAssignable ?? capabilities?.canManage === true,
			canSetMainTool: capabilities?.canSetPortalDefault === true,
			assignmentSelectorOptions: capabilities?.assignmentSelectorOptions,
			onSave,
			onInstallSelf,
			onSetMainTool,
			onOpenRecipientPicker,
		});
		layoutWidget.showComponent(editor);
		setEditorBackButton(layoutWidget, editor);
		expandWidget(layoutWidget);
	}

	/**
	 * @param {OpenStockPresetEditorParams} params
	 * @return {Promise<void>}
	 */
	async function openStockPresetEditor(params)
	{
		const {
			parentWidget,
			preset,
			getEditorContext,
			onInstallSelf,
			onSetMainTool,
			onOpenRecipientPicker,
		} = params;
		const { StockPresetEditor } = await loadEditorsExtension();
		if (!StockPresetEditor)
		{
			return;
		}
		const { tabs, capabilities } = getEditorContext();

		const layoutWidget = await openEditorWidget(parentWidget, preset.title);
		if (!layoutWidget)
		{
			return;
		}

		const editor = new StockPresetEditor({
			tabs,
			preset,
			parentWidget: layoutWidget,
			assignmentSelectorOptions: capabilities?.assignmentSelectorOptions,
			onInstallSelf,
			onSetMainTool,
			onOpenRecipientPicker,
		});
		layoutWidget.showComponent(editor);
		setEditorBackButton(layoutWidget, editor);
		expandWidget(layoutWidget);
	}

	/**
	 * @param {OpenRecipientPickerParams} params
	 * @return {Promise<void>}
	 */
	async function openRecipientPicker(params)
	{
		const { parentWidget, preset, getEditorContext } = params;
		const { RecipientPicker } = await loadEditorsExtension();
		if (!RecipientPicker)
		{
			return;
		}
		const { capabilities } = getEditorContext();

		await RecipientPicker.open({
			preset,
			parentWidget,
			assignmentSelectorOptions: capabilities?.assignmentSelectorOptions,
			selectedRecipients: preset.selectedRecipients,
			onSave: preset.onRecipientsSelected,
		}).catch(console.error);
	}

	/**
	 * @param {GetPresetTabsDescriptionParams} params
	 * @return {Record<string, string>}
	 */
	function getPresetTabsDescription({ tabs = {}, tabsDescription = {}, tabItems })
	{
		if (Object.keys(tabsDescription).length > 0)
		{
			return tabsDescription;
		}

		return Object.fromEntries(
			Object.entries(tabs).sort((a, b) => a[1] - b[1]).map(([tabName]) => {
				const tabData = tabItems[tabName] ?? {};
				const description = tabData.description
					?? tabData.title
					?? tabData.shortTitle
					?? tabData.name
					?? tabName;

				return [tabName, description];
			}),
		);
	}

	/**
	 * @param {Record<string, string>} tabsDescription
	 * @param {Record<string, TabPresetTab>} tabItems
	 * @return {Record<string, string>}
	 */
	function getPresetTabsIcons(tabsDescription, tabItems)
	{
		return Object.fromEntries(
			Object.keys(tabsDescription).map((tabName) => {
				return [tabName, tabItems[tabName]?.iconId ?? tabName];
			}),
		);
	}

	/**
	 * @return {Promise<TabPresetsEditorsExtension>}
	 */
	async function loadEditorsExtension()
	{
		const extension = await requireLazy('tab-presets/managed/editors');

		return extension ?? {};
	}

	/**
	 * @param {TabPresetLayoutWidget} parentWidget
	 * @param {string} title
	 * @return {Promise<TabPresetLayoutWidget | undefined>}
	 */
	async function openEditorWidget(parentWidget, title)
	{
		return parentWidget
			.openWidget('layout', {
				titleParams: {
					text: title,
				},
				backdrop: {
					mediumPositionPercent: 100,
				},
			})
			.catch(console.error)
		;
	}

	/**
	 * @param {TabPresetLayoutWidget} layoutWidget
	 * @return {void}
	 */
	function setCloseButton(layoutWidget)
	{
		layoutWidget.setLeftButtons([
			{
				type: Icon.ARROW_TO_THE_LEFT_SIZE_M.getIconName(),
				callback: () => layoutWidget.close(),
			},
		]);
	}

	/**
	 * @param {TabPresetLayoutWidget} layoutWidget
	 * @param {ITabPresetEditor} editor
	 * @return {void}
	 */
	function setEditorBackButton(layoutWidget, editor)
	{
		layoutWidget.setLeftButtons([
			{
				type: Icon.ARROW_TO_THE_LEFT_SIZE_M.getIconName(),
				callback: () => {
					if (!editor.handleBackButton())
					{
						layoutWidget.close();
					}
				},
			},
		]);
	}

	/**
	 * @param {TabPresetLayoutWidget} layoutWidget
	 * @return {void}
	 */
	function expandWidget(layoutWidget)
	{
		setTimeout(() => layoutWidget.expandBottomSheet(), 50);
		layoutWidget.on('opened', () => layoutWidget.expandBottomSheet());
	}

	module.exports = {
		openPresetInfoScreen,
		openManagedPresetEditor,
		openStockPresetEditor,
		openRecipientPicker,
	};
});
