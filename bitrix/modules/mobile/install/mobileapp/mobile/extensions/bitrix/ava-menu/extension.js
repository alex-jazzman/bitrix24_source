/**
 * @module ava-menu
 */
jn.define('ava-menu', (require, exports, module) => {
	const { menu } = require('native/avamenu') || {};
	const { AnalyticsEvent } = require('analytics');
	const { qrauth } = require('qrauth/utils');
	const { CheckIn } = require('ava-menu/check-in');
	const { Sign } = require('ava-menu/sign');
	const { Calendar } = require('ava-menu/calendar');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { UserProfile, fetchNewProfileFeatureEnabled } = require('user-profile');
	const { ComponentOpener } = require('whats-new/ui-manager/component-opener');
	const { throttle } = require('utils/function');
	const store = require('statemanager/redux/store');
	const { usersSelector } = require('statemanager/redux/slices/users/selector');
	const { withCurrentDomain } = require('utils/url');
	const { getBackgroundColorStyles } = require('layout/ui/user/empty-avatar');

	const entryTypes = {
		component: 'component',
		page: 'page',
		list: 'list',
	};

	const menuItemsIds = {
		calendar: 'calendar',
		checkIn: 'check_in',
		startSigning: 'start_signing',
		goToWeb: 'go_to_web',
		switchAccount: 'switch_account',
		whatsNew: 'whats_new',
	};

	const accentType = {
		collaber: 'green',
		extranet: 'orange',
	};

	const onAppStartedCallback = () => {
		AvaMenu.setUserInfo();
		CheckIn.handleItemColor();
		Sign.handleItemColor();
	};

	const onAppStartedCallbackThrottled = throttle(onAppStartedCallback, 1000);

	class AvaMenu
	{
		/**
		 * @param {string} elemId
		 * @param {string} value
		 */
		static setCounter({ elemId, value })
		{
			if (!this.isMenuExists())
			{
				return;
			}

			const items = menu.getItems();

			if (!items)
			{
				console.error('Ava-menu elements are not loaded');

				return;
			}

			const item = items.find(({ id }) => elemId === id);

			if (!item)
			{
				console.error(`Ava-menu element with id ${elemId} not found`);

				return;
			}

			if (item.counter && value && Number(item.counter) === Number(value))
			{
				return;
			}

			const totalCounter = items.reduce((acc, { counter }) => acc + (counter ? Number(counter) : 0), 0);
			const difference = Number(item.counter || 0) - Number(value || 0);
			const newTotalCounter = totalCounter - difference;

			menu.updateItem(elemId, { counter: String(value) });
			Application.setBadges({ user_avatar: String(newTotalCounter) });
		}

		static setUserInfo(params = {})
		{
			if (!this.isMenuExists())
			{
				return;
			}

			const userInfoParams = {
				...menu.getUserInfo(),
				...params,
			};

			menu.setUserInfo(userInfoParams);
		}

		static isMenuExists()
		{
			if (!menu)
			{
				console.error('Ava-menu is not supported in your app yet');

				return false;
			}

			return true;
		}

		static init()
		{
			if (!menu)
			{
				return;
			}

			const avaMenu = new AvaMenu();

			avaMenu.initEventListeners();
			avaMenu.onAppStarted();
			avaMenu.subscribeToUserStore();
		}

		static getCollabStyles()
		{
			return {};
		}

		static isCollaber()
		{
			return Boolean(env.isCollaber);
		}

		onAppStarted()
		{
			BX.onAppStarted(() => {
				onAppStartedCallbackThrottled();
			});
		}

		initEventListeners()
		{
			menu.removeAllListeners('titleTap');
			menu.removeAllListeners('itemTap');

			menu.on('titleTap', (event) => this.handleOnMenuItemTap(event, event.customData.entryParams));
			menu.on('itemTap', (event) => this.handleOnMenuItemTap(event, event.customData));
		}

		handleOnMenuItemTap(event, entryParams)
		{
			this.sendAnalytics({ hasCounter: Number(event.counter) > 0 });

			if (!this.handleById(event))
			{
				void this.handleByEntryParams(entryParams);
			}
		}

		sendAnalytics({ hasCounter })
		{
			new AnalyticsEvent({
				tool: 'intranet',
				category: 'ava_menu',
				event: 'menu_open',
				type: hasCounter ? 'with_counter' : 'no_counter',
			}).send();
		}

		handleById(event)
		{
			switch (event.id)
			{
				case menuItemsIds.switchAccount:
					Application.exit();

					return true;

				case menuItemsIds.goToWeb:
					if (Number(event.counter) > 0)
					{
						new RunActionExecutor(
							'mobile.avamenu.setShouldShowGoToWebCounter',
							{ option: 'N' },
						)
							.call(false)
						;
						AvaMenu.setCounter({
							elemId: menuItemsIds.goToWeb,
							value: '0',
						});
					}
					void qrauth.open(event.customData);

					return true;

				case menuItemsIds.startSigning:
					Sign.open();

					return true;

				case menuItemsIds.checkIn:
					CheckIn.open(event);

					return true;

				case menuItemsIds.calendar:
					return Calendar.open(event.customData);

				case menuItemsIds.whatsNew:
					ComponentOpener.open();

					return true;

				default:
					return false;
			}
		}

		handleByEntryParams = async (entryParams) => {
			switch (entryParams?.type)
			{
				case entryTypes.component:
					if (entryParams.componentCode === 'profile.view')
					{
						const isNewProfileFeatureEnabled = await fetchNewProfileFeatureEnabled();
						if (isNewProfileFeatureEnabled)
						{
							void UserProfile.open({
								openInComponent: true,
								analyticsSection: 'ava_menu',
							});

							return;
						}

						PageManager.openComponent('JSStackComponent', { canOpenInDefault: true, ...entryParams });
					}
					else
					{
						PageManager.openComponent('JSStackComponent', { canOpenInDefault: true, ...entryParams });
					}
					break;

				case entryTypes.page:
					PageManager.openPage(entryParams);
					break;

				case entryTypes.list:
					PageManager.openList(entryParams);
					break;

				default:
					break;
			}
		};

		subscribeToUserStore()
		{
			const userInfo = menu.getUserInfo();

			let prevAvatarUrl = userInfo && userInfo.imageUrl ? userInfo.imageUrl : null;
			let prevFullName = userInfo && userInfo.fullName ? userInfo.fullName : '';

			const handleChange = () => {
				const state = store.getState();
				const userId = AvaMenu.getCurrentUserId();
				if (!userId)
				{
					return;
				}

				const user = AvaMenu.getUserFromState(state, userId);
				if (!user)
				{
					return;
				}

				const avatarUrl = AvaMenu.getAvatarUri(user);
				const fullName = AvaMenu.getFullName(user);

				if (avatarUrl !== prevAvatarUrl || prevFullName !== fullName)
				{
					const info = AvaMenu.buildUserInfoFromUser(user);
					AvaMenu.setUserInfo(info);

					prevAvatarUrl = avatarUrl;
					prevFullName = fullName;
				}
			};

			return store.subscribe(handleChange);
		}

		/**
		 * @returns {number|null}
		 */
		static getCurrentUserId()
		{
			const userId = Number(env.userId);

			return Number.isFinite(userId) ? userId : null;
		}

		/**
		 * @param {object} state
		 * @param {number} userId
		 * @returns {object|null}
		 */
		static getUserFromState(state, userId)
		{
			return usersSelector.selectById(state, userId);
		}

		/**
		 * @param {object} user
		 * @returns {object|null}
		 */
		static buildUserInfoFromUser(user)
		{
			if (!user)
			{
				return null;
			}

			const uri = AvaMenu.getAvatarUri(user);
			const fullName = AvaMenu.getFullName(user);

			return {
				title: fullName,
				imageUrl: uri,
				avatar: {
					title: fullName,
					uri,
					image: uri,
					hideOutline: !(user.isCollaber || user.isExtranet),
					accentType: user.isCollaber ? accentType.collaber : (user.isExtranet ? accentType.extranet : null),
					placeholder: {
						type: 'auto',
						backgroundColor: user?.id && getBackgroundColorStyles(user?.id).backgroundColor,
					},
				},
			};
		}

		/**
		 * @param {object} user
		 * @returns {string|null}
		 */
		static getAvatarUri(user)
		{
			const avatar = user?.avatarSize100 || user?.avatarSizeOriginal || null;

			return withCurrentDomain(avatar);
		}

		/**
		 * @param {object} user
		 * @returns {string}
		 */
		static getFullName(user)
		{
			return user?.fullName
				|| [user?.lastName, user?.name].filter(Boolean).join(' ')
				|| user?.login
				|| '';
		}
	}

	module.exports = {
		AvaMenu,
		CheckIn,
		AvaMenuItemsIds: menuItemsIds,
	};
});
