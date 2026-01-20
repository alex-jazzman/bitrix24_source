/**
 * @module settings-v2/ui/items/src/user-selector
 */

jn.define('settings-v2/ui/items/src/user-selector', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { NestedDepartmentSelector } = require('selector/widget/entity/tree-selectors/nested-department-selector');
	const { Type } = require('type');
	const { Card } = require('ui-system/layout/card');
	const { Text4, Text5 } = require('ui-system/typography/text');
	const { Color, Indent } = require('tokens');
	const { Icon } = require('ui-system/blocks/icon');
	const { Link, LinkDesign, LinkMode, Ellipsize } = require('ui-system/blocks/link');
	const { ElementsStack } = require('elements-stack');
	const { Avatar: UserAvatar } = require('ui-system/blocks/avatar');
	const { EventType } = require('settings-v2/const');
	const { Loc } = require('loc');
	const { showToast } = require('toast');

	const AVATAR_SIZE = 32;

	const EntityType = {
		ALL_USERS_META: 'meta-user',
		DEPARTMENT: 'department',
		USER: 'user',
	};

	const EntityId = {
		ALL_USERS: 'all-users',
	};

	class UserSelectorItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'user-selector',
				context: this,
			});

			const {
				isAllUser,
				departmentIds,
				departmentWithAllChildIds,
				userIds,
			} = props.value || {};

			this.state = {
				isAllUser,
				departmentIds,
				departmentWithAllChildIds,
				userIds,
				isVisible: props.isVisible ?? false,
			};
		}

		componentDidMount()
		{
			BX.addCustomEvent(`${EventType.changeUserSelectorIsVisible}:${this.props.id}`, this.changeIsVisible);
		}

		componentWillUnmount()
		{
			BX.removeCustomEvent(`${EventType.changeUserSelectorIsVisible}:${this.props.id}`, this.changeIsVisible);
		}

		changeIsVisible = (isVisible = false) => {
			this.setState({ isVisible });
		};

		render()
		{
			return View(
				{
					style: {
						maxHeight: this.state.isVisible ? '100%' : 0,
					},
					ref: (ref) => {
						this.ref = ref;
					},
				},
				Card(
					{
						onClick: this.openSelector,
						border: true,
						testId: this.getTestId('card'),

					},
					this.renderTitle(),
					this.renderUserList(),
					this.renderAddButton(),
				),
			);
		}

		renderTitle()
		{
			return Text5({
				text: this.props.title,
				testId: this.getTestId('text'),
				color: Color.base4,
			});
		}

		renderUserList()
		{
			return View(
				{
					style: {
						paddingVertical: Indent.XL.toNumber(),
					},
				},
				this.state.isAllUser ? this.renderAllUserLabel() : this.renderEntitiesStack(),
			);
		}

		renderAllUserLabel()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'flex-start',
					},
				},
				Avatar({
					style: {
						width: AVATAR_SIZE,
						height: AVATAR_SIZE,
					},
					hideOutline: true,
					placeholder: {
						type: 'svg',
						backgroundColor: Color.accentMainSuccess.toHex(),
						svg: {
							named: Icon.THREE_PERSONS.getIconName(),
							tintColor: Color.baseWhiteFixed.toHex(),
						},
					},
				}),
				Text4({
					text: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_USER_SELECTOR_ALL_EMPLOYEES'),
					style: {
						marginLeft: Indent.L.toNumber(),
					},
				}),
			);
		}

		renderAddButton()
		{
			return Link({
				text: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_USER_SELECTOR_ADD_BUTTON'),
				size: 5,
				accent: false,
				mode: LinkMode.PLAIN,
				design: LinkDesign.PRIMARY,
				leftIcon: Icon.PLUS,
				ellipsize: Ellipsize.END,
				onClick: this.openSelector,
			});
		}

		renderEntitiesStack()
		{
			return ElementsStack(
				{
					testId: this.getTestId('entities-stack'),
					clickable: false,
					radius: null,
					indent: null,
					restView: this.renderRestElement,
					externalIndent: 2,
					maxElements: 6,
					style: {},
				},
				...this.renderEntities(),
			);
		}

		renderEntities()
		{
			const outlineWrapper = (content) => {
				return View(
					{
						style: {
							width: AVATAR_SIZE + 4,
							height: AVATAR_SIZE + 4,
							backgroundColor: Color.bgContentPrimary.toHex(),
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 512,
						},
					},
					content,
				);
			};

			const userAvatars = Type.isArrayFilled(this.state.userIds)
				? this.state.userIds.map((userId) => outlineWrapper(this.renderUserAvatar(userId)))
				: []
			;
			const departmentAvatars = Type.isArrayFilled(this.state.departmentIds)
				? this.state.departmentIds.map(() => outlineWrapper(this.renderDepartmentAvatar()))
				: []
			;
			const departmentWithAllChildAvatars = Type.isArrayFilled(this.state.departmentWithAllChildIds)
				? this.state.departmentWithAllChildIds.map(() => outlineWrapper(this.renderDepartmentAvatar()))
				: []
			;

			return [
				...userAvatars,
				...departmentAvatars,
				...departmentWithAllChildAvatars,
			];
		}

		renderDepartmentAvatar()
		{
			return Avatar({
				style: {
					width: AVATAR_SIZE,
					height: AVATAR_SIZE,
				},
				hideOutline: true,
				placeholder: {
					type: 'svg',
					backgroundColor: Color.accentExtraAqua.toHex(),
					svg: {
						named: Icon.GROUP.getIconName(),
						tintColor: Color.baseWhiteFixed.toHex(),
					},
				},
			});
		}

		renderUserAvatar(userId)
		{
			return UserAvatar({
				id: userId,
				testId: this.getTestId('user-avatar'),
				size: 32,
				withRedux: true,
			});
		}

		renderRestElement = (restCount) => {
			const restText = restCount > 99 ? '99+' : `+${restCount}`;
			const fontSize = restText.length < 3 ? (AVATAR_SIZE / 2) : (AVATAR_SIZE / 2) - 1;

			return View(
				{
					style: {
						width: AVATAR_SIZE + 4,
						height: AVATAR_SIZE + 4,
						backgroundColor: Color.bgContentPrimary.toHex(),
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: 512,
					},
				},
				View(
					{
						style: {
							width: AVATAR_SIZE,
							height: AVATAR_SIZE,
							backgroundColor: Color.bgContentTertiary.toHex(),
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 512,
						},
					},
					Text({
						text: restText,
						color: Color.base4,
						style: {
							fontSize,
						},
					}),
				),
			);
		};

		openSelector = () => {
			const { parentWidget, title, unselectLastMessage } = this.props;

			const selector = new NestedDepartmentSelector({
				initSelectedIds: this.getPreparedSelectedIds(),
				widgetParams: {
					title,
					backdrop: {
						mediumPositionPercent: 70,
						horizontalSwipeAllowed: false,
					},
					sendButtonName: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_USER_SELECTOR_SEND_BUTTON_NAME'),
				},
				allowMultipleSelection: true,
				closeOnSelect: false,
				events: {
					onClose: this.onChange,
				},
				createOptions: {
					enableCreation: false,
				},
				selectOptions: {
					canUnselectLast: false,
					onUnselectLast: () => {
						if (unselectLastMessage)
						{
							showToast({ message: unselectLastMessage, icon: Icon.ALERT });
						}
					},
					singleEntityByType: false,
				},
				canUseRecent: true,
				provider: {
					context: 'settings-v2-user-selector',
					options: {
						useLettersForEmptyAvatar: true,
						allowFlatDepartments: true,
						allowSelectRootDepartment: true,
						addMetaUser: true,
					},
				},
			});

			selector.getSelector().show({}, parentWidget ?? PageManager)
				.catch(console.error);
		};

		getPreparedSelectedIds()
		{
			const { isAllUser, departmentIds, departmentWithAllChildIds, userIds } = this.state;

			const preparedItems = [];

			if (isAllUser)
			{
				preparedItems.push([EntityType.ALL_USERS_META, EntityId.ALL_USERS]);
			}

			if (Type.isArrayFilled(departmentIds))
			{
				departmentIds.forEach((id) => {
					preparedItems.push([EntityType.DEPARTMENT, this.addOnlyEmployeesFlag(id)]);
				});
			}

			if (Type.isArrayFilled(departmentWithAllChildIds))
			{
				departmentWithAllChildIds.forEach((id) => {
					preparedItems.push([EntityType.DEPARTMENT, id]);
				});
			}

			if (Type.isArrayFilled(userIds))
			{
				userIds.forEach((id) => {
					preparedItems.push([EntityType.USER, id]);
				});
			}

			return preparedItems;
		}

		onChange = (selectedItems) => {
			const { onChange, id, controller } = this.props;

			const departmentIds = [];
			const userIds = [];
			const departmentWithAllChildIds = [];
			let isAllUser = false;

			selectedItems.forEach((item) => {
				if (item.entityId === EntityType.ALL_USERS_META && item.id === EntityId.ALL_USERS)
				{
					isAllUser = true;

					return;
				}

				if (item.entityId === EntityType.DEPARTMENT)
				{
					if (Type.isString(item.id) && this.isOnlyEmployeesDepartment(item.id))
					{
						departmentIds.push(this.getIdFromOnlyEmployeesDepartment(item.id));

						return;
					}

					departmentWithAllChildIds.push(Number(item.id));

					return;
				}

				if (item.entityId === EntityType.USER)
				{
					userIds.push(Number(item.id));
				}
			});

			this.setState({ isAllUser, departmentIds, userIds, departmentWithAllChildIds }, () => {
				onChange?.(id, controller, { isAllUser, departmentIds, userIds, departmentWithAllChildIds });
			});
		};

		isOnlyEmployeesDepartment(departmentId)
		{
			return departmentId.endsWith(':F');
		}

		getIdFromOnlyEmployeesDepartment(departmentId)
		{
			return Number(departmentId.slice(0, -2));
		}

		addOnlyEmployeesFlag(departmentId)
		{
			return `${departmentId}:F`;
		}
	}

	module.exports = {
		UserSelectorItem,
	};
});
