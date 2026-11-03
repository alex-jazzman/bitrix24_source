/**
 * @module tab-presets/managed/editors/src/preset-managed/managed-preset-editor-content
 */
jn.define('tab-presets/managed/editors/src/preset-managed/managed-preset-editor-content', (require, exports, module) => {
	const { getIcon } = require('tab-presets/managed');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { ButtonSize, Button } = require('ui-system/form/buttons/button');
	const {
		ChipButton,
		ChipButtonMode,
		ChipButtonDesign,
		ChipButtonSize,
	} = require('ui-system/blocks/chips/chip-button');
	const { SettingSelector, SettingMode } = require('ui-system/blocks/setting-selector');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { StringInput, InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/string');
	const { Text3, Text4, Text7 } = require('ui-system/typography/text');
	const { Color, Indent, Component } = require('tokens');
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Ellipsize } = require('utils/enums/style');
	const { RecipientList } = require('tab-presets/managed/editors/src/preset-managed/recipient-list');
	const {
		ManagedPresetConfigError,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-config-error');

	const MAX_DRAG_ITEMS = 4;

	/**
	 * @param {ManagedPresetEditorContentProps} props
	 */
	const ManagedPresetEditorContent = (props) => Box(
		{
			testId: props.testId,
			resizableByKeyboard: true,
			safeArea: {
				bottom: true,
			},
			footer: renderBoxFooter(props),
			backgroundColor: Color.bgContentPrimary,
		},
		AreaList(
			{
				style: {
					flex: 1,
				},
				withScroll: true,
				testId: `${props.testId}-area-list`,
			},
			renderTitleArea(props),
			renderMenuSettingsArea(props),
			renderMainToolArea(props),
			renderInstallArea(props),
		),
	);

	/**
	 * @param {ManagedPresetEditorContentProps} props
	 */
	const renderTitleArea = (props) => Area(
		{
			isFirst: true,
			excludePaddingSide: {
				bottom: true,
			},
		},
		View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'center',
				},
				testId: `${props.testId}-title-area-content`,
			},
			Image({
				testId: `${props.testId}-title-graphic`,
				resizeMode: 'contain',
				uri: makeLibraryImagePath('menu-pluse.webp', 'graphic'),
				style: {
					width: 80,
					height: 80,
					marginRight: Indent.XL.toNumber(),
				},
			}),
			View(
				{
					style: {
						flex: 1,
					},
				},
				StringInput({
					testId: `${props.testId}-title-input`,
					size: InputSize.L,
					value: props.title,
					error: Boolean(props.titleError),
					errorText: props.titleError,
					placeholder: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_TITLE_PLACEHOLDER'),
					onChange: props.onTitleChange,
					design: InputDesign.LIGHT_GREY,
					mode: InputMode.STROKE,
				}),
			),
		),
	);

	/**
	 * @param {ManagedPresetEditorContentProps} props
	 */
	const renderMenuSettingsArea = (props) => Area(
		{
			testId: `${props.testId}-menu-settings-area`,
		},
		View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: Indent.M.toNumber(),
				},
				testId: `${props.testId}-menu-settings-header`,
			},
			Text3({
				text: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_MENU_SETTINGS_TITLE'),
				accent: true,
				testId: `${props.testId}-menu-settings-title`,
			}),
			ChipButton({
				testId: `${props.testId}-menu-settings-configure`,
				text: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_CONFIGURE'),
				size: ChipButtonSize.M,
				design: ChipButtonDesign.PRIMARY,
				mode: ChipButtonMode.OUTLINE,
				onClick: props.onConfigure,
			}),
		),
		ManagedPresetConfigError({ testId: props.testId, error: props.configError }),
		renderTabbarPreview(props),
	);

	/**
	 * @param {ManagedPresetEditorContentProps} props
	 */
	const renderMainToolArea = (props) => {
		if (!props.canSetMainTool)
		{
			return null;
		}

		return Area(
			{
				testId: `${props.testId}-main-tool-area`,
				divider: true,
			},
			SettingSelector({
				testId: `${props.testId}-main-tool`,
				title: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_MAIN_TOOL'),
				subtitle: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_MAIN_TOOL_HINT'),
				checked: props.mainTool,
				locked: props.mainToolLocked,
				mode: SettingMode.TOGGLE,
				onClick: props.onMainToolChange,
			}),
		);
	};

	/**
	 * @param {ManagedPresetEditorContentProps} props
	 */
	const renderInstallArea = (props) => Area(
		{
			testId: `${props.testId}-install-area`,
			excludePaddingSide: {
				horizontal: true,
			},
		},
		Text3({
			text: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_INSTALL_TITLE'),
			accent: true,
			testId: `${props.testId}-install-title`,
			style: {
				marginHorizontal: Component.areaPaddingLr.toNumber(),
				marginBottom: Indent.XL3.toNumber(),
			},
		}),
		View(
			{
				style: {
					marginHorizontal: Component.areaPaddingLr.toNumber(),
				},
			},
			Card(
				{
					testId: `${props.testId}-install-self-card`,
					border: props.canSetMainTool || props.canAssign,
					excludePaddingSide: {
						all: true,
					},
				},
				SettingSelector({
					testId: `${props.testId}-install-self`,
					title: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_INSTALL_SELF'),
					checked: props.selfAssign,
					mode: SettingMode.TOGGLE,
					onClick: props.onSelfAssignChange,
					style: {
						paddingHorizontal: Indent.XL2.toNumber(),
						paddingVertical: Indent.XL.toNumber(),
					},
				}),
			),
		),
		renderAddEmployeeRow(props),
		renderRecipientList(props),
	);

	/**
	 * @param {ManagedPresetEditorContentProps} props
	 */
	const renderAddEmployeeRow = (props) => {
		if (!props.canAssign)
		{
			return null;
		}

		return View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'center',
					paddingTop: Indent.XL2.toNumber(),
					paddingHorizontal: Component.areaPaddingLr.toNumber(),
				},
				testId: `${props.testId}-add-employee-row`,
				onClick: props.onOpenRecipientPicker,
			},
			View(
				{
					style: {
						width: 40,
						height: 40,
						borderRadius: 20,
						alignItems: 'center',
						justifyContent: 'center',
						marginRight: Indent.XL.toNumber(),
						backgroundColor: Color.accentSoftBlue2.toHex(),
					},
					testId: `${props.testId}-add-employee-icon-bg`,
				},
				IconView({
					icon: Icon.PLUS,
					color: Color.accentMainPrimary,
					size: 24,
					testId: `${props.testId}-add-employee-icon`,
				}),
			),
			Text4({
				text: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_ADD_EMPLOYEE'),
				color: Color.base1,
				testId: `${props.testId}-add-employee-title`,
				style: {
					flexShrink: 1,
				},
			}),
		);
	};

	/**
	 * @param {ManagedPresetEditorContentProps} props
	 */
	const renderRecipientList = (props) => {
		if (!props.canAssign)
		{
			return null;
		}

		return RecipientList({
			items: props.selectedRecipients,
			testId: props.testId,
			paddingLeft: Component.areaPaddingLr.toNumber(),
			paddingRight: Component.areaPaddingLr.toNumber(),
		});
	};

	/**
	 * @param {ManagedPresetEditorContentProps} props
	 */
	const renderTabbarPreview = (props) => Card(
		{
			border: true,
			accent: true,
			design: CardDesign.PRIMARY,
			testId: `${props.testId}-tabbar-preview`,
			onClick: props.onConfigure,
		},
		View(
			{
				style: {
					flexDirection: 'row',
					justifyContent: 'space-between',
					paddingVertical: Indent.XS.toNumber(),
				},
			},
			...props.activeItems.slice(0, MAX_DRAG_ITEMS + 1).map((item) => renderTabbarPreviewItem(props, item)),
		),
	);

	/**
	 * @param {ManagedPresetEditorContentProps} props
	 * @param {ManagedPresetMenuItem} item
	 */
	const renderTabbarPreviewItem = (props, item) => View(
		{
			style: {
				flex: 1,
				alignItems: 'center',
			},
			testId: `${props.testId}-tabbar-preview-${item.key}`,
		},
		item.isAvatarEnabled
			? Avatar({
				id: env.userId,
				size: 28,
				withRedux: true,
				uri: item.imageUrl,
				name: item.title,
				testId: `${props.testId}-tabbar-preview-${item.key}-avatar`,
			})
			: IconView({
				testId: `${props.testId}-tabbar-preview-${item.key}-icon`,
				size: 28,
				color: Color.base4,
				solid: false,
				icon: getIcon(item.iconId) || getIcon(item.key),
			}),
		Text7({
			style: {
				marginTop: Indent.XS2.toNumber(),
			},
			text: item.title,
			color: Color.base4,
			numberOfLines: 1,
			ellipsize: Ellipsize.END.getValue(),
			testId: `${props.testId}-tabbar-preview-${item.key}-title`,
		}),
	);

	/**
	 * @param {ManagedPresetEditorContentProps} props
	 */
	const renderBoxFooter = (props) => {
		const button = {
			testId: `${props.testId}-button-save`,
			size: ButtonSize.L,
			text: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_SAVE'),
			onClick: props.onSave,
			stretched: true,
		};

		return BoxFooter(
			{
				testId: `${props.testId}-box-footer`,
				style: {
					width: '100%',
				},
				keyboardButton: button,
			},
			Button(button),
		);
	};

	module.exports = { ManagedPresetEditorContent };
});
