/**
 * @module layout/socialnetwork/project-v2/create/src/view/project-notifications-settings
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/project-notifications-settings', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Card, CardDesign, CardCorner } = require('ui-system/layout/card');
	const { SettingSelector, SettingMode } = require('ui-system/blocks/setting-selector');
	const { Text4, Text5 } = require('ui-system/typography/text');
	const { Color, Component, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const {
		normalizeNotificationCatalog,
	} = require('layout/socialnetwork/project-v2/create/src/helpers/project-create-settings');
	const {
		createProjectSettingsCloseGuard,
	} = require('layout/socialnetwork/project-v2/create/src/helpers/project-settings-close-guard');

	const BORDER_RADIUS = 12;
	const BANNER_IMAGE_SIZE = 54;
	const SEPARATOR_LEFT_OFFSET = Component.paddingLr.toNumber();

	const cloneNotificationCatalog = (catalog) => {
		const normalizedCatalog = normalizeNotificationCatalog(catalog);

		return normalizedCatalog ? JSON.parse(JSON.stringify(normalizedCatalog)) : null;
	};

	const renderBannerImage = (testId) => Image({
		testId,
		uri: makeLibraryImagePath('notification-settings.png', 'projects-v2'),
		resizeMode: 'contain',
		style: {
			width: BANNER_IMAGE_SIZE,
			height: BANNER_IMAGE_SIZE,
		},
	});

	class ProjectNotificationsSettings extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'project-notifications-settings',
				context: this,
			});

			this.notificationCatalog = cloneNotificationCatalog(props.notifications);
			this.initialNotificationCatalog = cloneNotificationCatalog(props.notifications);
			this.closeGuard = null;
		}

		componentDidMount()
		{
			this.closeGuard = createProjectSettingsCloseGuard({
				layoutWidget: this.props.layoutWidget,
				preventLayoutWidget: this.props.rootLayoutWidget ?? this.props.layoutWidget,
				releasePreventDismiss: false,
				initialFields: this.#getFields(this.initialNotificationCatalog),
				getCurrentFields: () => this.#getFields(this.notificationCatalog),
				onSaveAndClose: this.#close,
				onDiscardAndClose: this.#rollbackAndClose,
			});
		}

		render()
		{
			const groups = this.notificationCatalog?.groups ?? [];

			return Box(
				{
					testId: this.getTestId(),
					resizableByKeyboard: true,
				},
				AreaList(
					{
						testId: this.getTestId('area-list'),
						resizableByKeyboard: true,
						showsVerticalScrollIndicator: true,
					},
					Area(
						{
							isFirst: true,
						},
						this.#renderBanner(),
					),
					...groups.map((group) => this.#renderGroup(group)),
				),
			);
		}

		#getFields = (notifications) => ({
			notifications: cloneNotificationCatalog(notifications),
		});

		#close = () => {
			this.props.layoutWidget?.close();
		};

		#rollbackAndClose = () => {
			this.props.onChange?.(this.#getFields(this.initialNotificationCatalog));
			this.props.layoutWidget?.close();
		};

		#renderBanner()
		{
			return Card(
				{
					testId: this.getTestId('banner'),
					design: CardDesign.ACCENT,
					corner: CardCorner.XL,
				},
				View(
					{
						testId: this.getTestId('banner-header'),
						style: {
							flexDirection: 'row',
							alignItems: 'flex-start',
							marginBottom: Indent.M.toNumber(),
						},
					},
					Text4({
						testId: this.getTestId('banner-title'),
						text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_NOTIFICATIONS_BANNER_TITLE'),
						color: Color.base2,
						style: {
							flex: 1,
							marginRight: Indent.M.toNumber(),
						},
					}),
					renderBannerImage(this.getTestId('banner-image')),
				),
				Text5({
					testId: this.getTestId('banner-description'),
					text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_NOTIFICATIONS_BANNER_DESCRIPTION'),
					color: Color.base3,
				}),
			);
		}

		#renderGroup(group)
		{
			return Area(
				{},
				Text4({
					testId: this.getTestId(`${group.id}-title`),
					text: group.label,
					color: Color.base3,
					accent: true,
					style: {
						marginHorizontal: Component.paddingLr.toNumber(),
						marginBottom: Indent.M.toNumber(),
					},
				}),
				View(
					{
						testId: this.getTestId(`${group.id}-card`),
						style: {
							width: '100%',
							borderRadius: BORDER_RADIUS,
							borderWidth: 1,
							borderColor: Color.bgSeparatorPrimary.toHex(),
							backgroundColor: Color.bgContentPrimary.toHex(),
							overflow: 'hidden',
						},
					},
					...group.types.map((item, index) => this.#renderNotificationItem({
						group,
						item,
						isLast: index === group.types.length - 1,
					})),
				),
			);
		}

		#renderNotificationItem({ group, item, isLast })
		{
			return View(
				{
					testId: this.getTestId(`${group.id}-${item.id}-row`),
				},
				SettingSelector({
					testId: this.getTestId(`${group.id}-${item.id}`),
					title: item.label,
					mode: SettingMode.TOGGLE,
					checked: item.counterEnabled === true,
					divider: false,
					style: {
						paddingHorizontal: Component.paddingLr.toNumber(),
						paddingVertical: Indent.XL.toNumber(),
					},
					onClick: (checked) => this.#onNotificationToggle(item.id, checked),
				}),
				!isLast && View({
					style: {
						position: 'absolute',
						left: SEPARATOR_LEFT_OFFSET,
						right: 0,
						bottom: 0,
						height: 1,
						backgroundColor: Color.bgSeparatorSecondary.toHex(),
					},
				}),
			);
		}

		#onNotificationToggle = (id, checked) => {
			if (!this.notificationCatalog)
			{
				return;
			}

			this.notificationCatalog = {
				groups: this.notificationCatalog.groups.map((group) => ({
					...group,
					types: group.types.map((type) => ({
						...type,
						counterEnabled: type.id === id ? checked : type.counterEnabled,
					})),
				})),
			};

			this.props.onChange?.({
				notifications: cloneNotificationCatalog(this.notificationCatalog),
			});
			this.closeGuard?.update();
		};
	}

	module.exports = {
		ProjectNotificationsSettings: (props) => new ProjectNotificationsSettings(props),
	};
});
