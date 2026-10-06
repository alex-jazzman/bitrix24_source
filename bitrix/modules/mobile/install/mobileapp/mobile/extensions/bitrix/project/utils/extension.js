/**
 * @bxjs_lang_path extension.php
 */
(() => {
	const require = (extension) => jn.require(extension);
	const { CollabAccessService } = require('collab/service/access');
	const { getFeatureRestriction, tariffPlanRestrictionsReady } = require('tariff-plan-restriction');
	const { qrauth } = require('qrauth/utils');
	const { showToast } = require('toast');
	const { NotifyManager } = require('notify-manager');
	const { Loc } = require('loc');
	const { RequestExecutor } = require('rest');
	const { Color } = require('tokens');
	const { AvatarAccentType, AvatarShape } = require('ui-system/blocks/avatar');
	const { guid } = require('utils/guid');
	const { withCurrentDomain } = require('utils/url');

	const pathToExtension = '/bitrix/mobileapp/mobile/extensions/bitrix/project/utils';
	const projectCache = new Map();
	const extensionData = jnExtensionData.get('project/utils');
	const projectKeys = new Set([
		'ID',
		'NAME',
		'OPENED',
		'NUMBER_OF_MEMBERS',
		'AVATAR',
		'AVATAR_TYPE',
		'AVATAR_TYPES',
		'ADDITIONAL_DATA',
		'TYPE',
		'DIALOG_ID',
		'COLOR',
	]);

	class WorkgroupUtil
	{
		static get tabNames()
		{
			return {
				tasks: 'tasks',
				news: 'news',
				disk: 'disk',
				calendar: 'calendar',
			};
		}

		static getTabsItems(additionalData, item)
		{
			const availableFeatures = additionalData.availableFeatures || [];
			const projectNewsPathTemplate = additionalData.projectNewsPathTemplate || `${env.siteDir}mobile/log/?group_id=#group_id#`;
			const siteId = additionalData.siteId || env.siteId;
			const siteDir = additionalData.siteDir || env.siteDir;
			const guid = additionalData.guid || WorkgroupUtil.createGuid();
			const { analyticsLabel = {} } = additionalData;

			const tabs = [];

			const isTasksMobileInstalled = BX.prop.getBoolean(extensionData, 'isTasksMobileInstalled', false);

			if (availableFeatures.includes('tasks') && isTasksMobileInstalled)
			{
				tabs.push(
					WorkgroupUtil.getTasksTab({
						siteId,
						siteDir,
						guid,
						item,
						analyticsLabel: {
							c_section: 'tasks',
							...analyticsLabel,
						},
						currentUserId: env.userId,
					}),
				);
			}

			if (availableFeatures.includes('blog'))
			{
				tabs.push(
					WorkgroupUtil.getNewsTab({
						newsWebPath: projectNewsPathTemplate.replace('#group_id#', item.id),
						item,
					}),
				);
			}

			if (availableFeatures.includes('files'))
			{
				tabs.push(WorkgroupUtil.getDiskTab({ item }));
			}

			if (availableFeatures.includes('calendar'))
			{
				tabs.push(
					WorkgroupUtil.getCalendarTab({ item }),
				);
			}

			return tabs;
		}

		static getNewsTab({ newsWebPath, item })
		{
			return {
				id: WorkgroupUtil.tabNames.news,
				title: BX.message('MOBILE_PROJECT_TAB_NEWS2'),
				component: {
					name: 'JSStackComponent',
					componentCode: `web: ${newsWebPath}`,
					rootWidget: {
						name: 'web',
						settings: {
							page: {
								preload: false,
								url: newsWebPath,
								useSearchBar: true,
							},
							titleParams: WorkgroupUtil.getProjectTitleParams(
								item,
								WorkgroupUtil.getSubtitle(item.params.membersCount),
							),
							cache: false,
						},
					},
				},
			};
		}

		static getTasksTab(params)
		{
			const item = params.item;
			const guid = params.guid || WorkgroupUtil.createGuid();
			const siteId = params.siteId || env.siteId;
			const siteDir = params.siteDir || env.siteDir;
			const currentUserId = params.currentUserId || env.userId;

			return {
				id: WorkgroupUtil.tabNames.tasks,
				title: BX.message('MOBILE_PROJECT_TAB_TASKS'),
				component: {
					name: 'JSStackComponent',
					componentCode: 'tasks.dashboard',
					canOpenInDefault: true,
					scriptPath: availableComponents['tasks:tasks.dashboard'].publicUrl,
					rootWidget: {
						name: 'layout',
						settings: {
							objectName: 'layout',
							useSearch: true,
							useLargeTitleMode: true,
							titleParams: WorkgroupUtil.getProjectTitleParams(
								item,
								WorkgroupUtil.getSubtitle(item.params.membersCount),
							),
						},
					},
					params: {
						COMPONENT_CODE: 'tasks.dashboard',
						GROUP_ID: item.id,
						USER_ID: currentUserId,
						DATA: {
							groupId: item.id,
							groupName: item.title,
							groupImageUrl: (item.params.avatar || ''),
							groupOpened: item.params.opened,
							relationInitiatedByType: (item.params.initiatedByType || ''),
							relationRole: (item.params.role || ''),
							ownerId: currentUserId,
							getProjectData: (item.params.getProjectData || false),
						},
						IS_TABS_MODE: true,
						TABS_GUID: guid,
						SITE_ID: siteId,
						SITE_DIR: siteDir,
						LANGUAGE_ID: env.languageId,
						PATH_TO_TASK_ADD: `${siteDir}mobile/tasks/snmrouter/?routePage=#action#&TASK_ID=#taskId#`,
						ANALYTICS_LABEL: params.analyticsLabel,
						isScrum: item.params?.isScrum,
					},
				},
			};
		}

		static getDiskTab(params)
		{
			const item = params.item;

			return {
				id: WorkgroupUtil.tabNames.disk,
				title: BX.message('MOBILE_PROJECT_TAB_DRIVE_MSGVER_1'),
				component: {
					name: 'JSStackComponent',
					componentCode: 'disk.tabs.group',
					scriptPath: availableComponents['disk:disk.tabs.group'].publicUrl,
					canOpenInDefault: false,
					rootWidget: {
						name: 'layout',
						settings: {
							objectName: 'layout',
							useSearch: true,
							useLargeTitleMode: true,
							titleParams: WorkgroupUtil.getProjectTitleParams(
								item,
								WorkgroupUtil.getSubtitle(item.params.membersCount),
							),
						},
					},
					params: {
						GROUP_ID: item.id,
					},
				},
			};
		}

		static getCalendarTab({ item })
		{
			const isCalendarMobileAvailable = BX.prop.getBoolean(extensionData, 'isCalendarMobileAvailable', false);

			if (isCalendarMobileAvailable)
			{
				return {
					id: WorkgroupUtil.tabNames.calendar,
					title: BX.message('MOBILE_PROJECT_TAB_CALENDAR'),
					component: {
						name: 'JSStackComponent',
						componentCode: 'calendar:calendar.event.list',
						scriptPath: availableComponents['calendar:calendar.event.list'].publicUrl,
						rootWidget: {
							name: 'layout',
							settings: {
								objectName: 'layout',
								titleParams: WorkgroupUtil.getProjectTitleParams(
									item,
									WorkgroupUtil.getSubtitle(item.params.membersCount),
								),
							},
						},
						params: {
							CAL_TYPE: 'group',
							OWNER_ID: item.id,
							VIEW_MODE: 'tabs',
						},
					},
				};
			}

			return {
				id: WorkgroupUtil.tabNames.calendar,
				title: BX.message('MOBILE_PROJECT_TAB_CALENDAR'),
				selectable: false,
			};
		}

		static isExternalTab(tabs, tabId)
		{
			return tabs.some((tab) => (
				tab.id === tabId
				&& tab.selectable === false
			));
		}

		static isCalendarTabExternal(tabs)
		{
			return WorkgroupUtil.isExternalTab(tabs, WorkgroupUtil.tabNames.calendar);
		}

		static createGuid()
		{
			return guid();
		}

		static getSubtitle(membersCount)
		{
			if (membersCount > 0)
			{
				const pluralForm = Loc.getPluralForm(membersCount);

				return BX.message(`MOBILE_PROJECT_TAB_MEMBERS_${pluralForm}`).replace('#NUM#', membersCount);
			}

			return '';
		}

		static getTitleAvatarUrl(data)
		{
			return data.AVATAR || null;
		}

		static getProjectTitleAvatarParams(itemParams = {})
		{
			const hasCollabers = WorkgroupUtil.resolveProjectHasCollabers(itemParams);
			const accentType = hasCollabers ? AvatarAccentType.GREEN : AvatarAccentType.BLUE;
			const accentColor = hasCollabers ? Color.accentMainSuccess : Color.accentMainPrimary;

			return {
				accentType: accentType.value,
				accentColor: accentColor.toHex(),
				type: AvatarShape.HEXAGON.value,
			};
		}

		static getProjectTitleAvatarPlaceholderParams(itemParams = {})
		{
			return {
				type: 'auto',
				backgroundColor: WorkgroupUtil.getProjectTitleAvatarPlaceholderBackgroundColor(itemParams),
				letters: {
					fontSize: 12,
				},
			};
		}

		static getProjectTitleAvatarPlaceholderBackgroundColor(itemParams = {})
		{
			const color = BX.prop.getString(
				itemParams,
				'color',
				BX.prop.getString(itemParams, 'COLOR', ''),
			);

			if (color)
			{
				return color;
			}

			const hasCollabers = WorkgroupUtil.resolveProjectHasCollabers(itemParams);

			return hasCollabers
				? Color.collabAccentPrimary.toHex()
				: Color.accentMainPrimary.toHex()
			;
		}

		static getProjectTitleParams(item, subtitle = '')
		{
			const avatarUri = item.params.avatar ? withCurrentDomain(item.params.avatar) : null;

			return {
				text: item.title,
				detailText: subtitle,
				type: 'common',
				imageUrl: avatarUri,
				avatar: {
					uri: avatarUri,
					title: item.title,
					polygonAngle: 30,
					radius: 0,
					backBorderWidth: 2,
					backColor: Color.baseWhiteFixed.toHex(),
					hideOutline: false,
					placeholder: WorkgroupUtil.getProjectTitleAvatarPlaceholderParams(item.params),
					...WorkgroupUtil.getProjectTitleAvatarParams(item.params),
				},
				userLargeTitleMode: true,
			};
		}

		static resolveProjectHasCollabers(itemParams = {}, hasCollabers = undefined)
		{
			if (typeof hasCollabers === 'boolean')
			{
				return hasCollabers;
			}

			return BX.prop.getBoolean(
				itemParams,
				'hasCollabers',
				BX.prop.getBoolean(itemParams, 'HAS_COLLABERS', false),
			);
		}

		static getGroupData(groupId)
		{
			return new Promise((resolve, reject) => {
				(new RequestExecutor('socialnetwork.api.workgroup.get', {
					params: {
						groupId,
						select: [
							'AVATAR',
						],
					},
				}))
					.call()
					.then(
						(response) => resolve(response.result),
						(response) => reject(response),
					)
				;
			});
		}

		static updateTasksCounter(value)
		{
			BX.postComponentEvent('background:updateTasksCounter', [{
				title: BX.message('MOBILE_PROJECT_TAB_TASKS'),
				counter: Number(value),
				label: (value > 0 ? String(value) : ''),
			}]);
		}

		static async onTabSelectedCalendar(groupId, url)
		{
			qrauth.open({
				redirectUrl: url || '',
				showHint: true,
				title: BX.message('MOBILE_PROJECT_TAB_CALENDAR_QR_TITLE'),
				analyticsSection: 'project',
			});
		}

		static async openProject(item, initialParams = {})
		{
			const preparedProject = await WorkgroupUtil.prepareProjectOpen(item, initialParams);

			if (!preparedProject)
			{
				return;
			}

			WorkgroupUtil.openComponent(preparedProject.item, preparedProject.params);
		}

		static async prepareProjectOpen(item, initialParams = {})
		{
			const params = {
				projectId: initialParams.projectId
					? Number(initialParams.projectId)
					: Number(item?.id) || 0,
				siteId: initialParams.siteId || null,
				siteDir: initialParams.siteDir || null,
				newsPathTemplate: initialParams.newsPathTemplate || '',
				calendarWebPathTemplate: initialParams.calendarWebPathTemplate || '',
				currentUserId: initialParams.currentUserId || env.userId,
				hasCollabers: initialParams.hasCollabers,
				color: initialParams.color || '',
				analyticsLabel: {
					c_section: 'project',
				},
			};

			if (params.projectId <= 0)
			{
				return null;
			}

			await tariffPlanRestrictionsReady();
			const { isRestricted, showRestriction } = getFeatureRestriction('socialnetwork_projects_groups');
			if (isRestricted())
			{
				showRestriction({ showInComponent: true });

				return null;
			}

			const isCollabToolEnabled = await CollabAccessService.checkAccess();

			if (item?.type === 'collab' && !isCollabToolEnabled)
			{
				CollabAccessService.openAccessDeniedBox();

				return null;
			}

			if (item?.params)
			{
				return {
					item: {
						...item,
						params: {
							...item.params,
							hasCollabers: WorkgroupUtil.resolveProjectHasCollabers(
								item.params,
								params.hasCollabers,
							),
							color: params.color || BX.prop.getString(
								item.params,
								'color',
								BX.prop.getString(item.params, 'COLOR', ''),
							),
						},
					},
					params,
				};
			}

			void NotifyManager.showLoadingIndicator();

			try
			{
				const result = await WorkgroupUtil.getProjectData(params);
				const data = result.data || null;
				if (!data)
				{
					WorkgroupUtil.showProjectErrorToast();

					return null;
				}

				if (data.TYPE === 'collab' && !isCollabToolEnabled)
				{
					CollabAccessService.openAccessDeniedBox();

					return null;
				}

				params.newsPathTemplate = (data.ADDITIONAL_DATA.projectNewsPathTemplate || '');
				params.calendarWebPathTemplate = (data.ADDITIONAL_DATA.projectCalendarWebPathTemplate || '');

				const hasCollabers = WorkgroupUtil.resolveProjectHasCollabers(
					data.ADDITIONAL_DATA,
					params.hasCollabers,
				);

				return {
					item: {
						id: params.projectId,
						title: (data.NAME || item?.title || ''),
						params: {
							avatar: WorkgroupUtil.getTitleAvatarUrl(data),
							initiatedByType: data.ADDITIONAL_DATA.INITIATED_BY_TYPE,
							features: data.ADDITIONAL_DATA.FEATURES,
							membersCount: parseInt(data.NUMBER_OF_MEMBERS || 0, 10),
							role: data.ADDITIONAL_DATA.ROLE,
							opened: (data.OPENED || 'N'),
							isCollab: data.TYPE === 'collab',
							hasCollabers,
							color: params.color || '',
							dialogId: data.DIALOG_ID,
							isScrum: data.TYPE === 'scrum',
						},
					},
					params,
				};
			}
			catch
			{
				WorkgroupUtil.showProjectErrorToast();

				return null;
			}
			finally
			{
				NotifyManager.hideLoadingIndicatorWithoutFallback();
			}
		}

		static showProjectErrorToast()
		{
			showToast({ message: BX.message('MOBILE_PROJECT_NO_PROJECT_ERROR') });
		}

		static openComponent(item, params)
		{
			const {
				siteId,
				siteDir,
				newsPathTemplate,
				calendarWebPathTemplate,
				currentUserId,
				analyticsLabel,
			} = params;

			const subtitle = WorkgroupUtil.getSubtitle(item.params.membersCount);
			const guid = WorkgroupUtil.createGuid();
			const tabs = WorkgroupUtil.getTabsItems(
				{
					siteId,
					siteDir,
					guid,
					availableFeatures: item.params.features,
					projectNewsPathTemplate: (newsPathTemplate || ''),
					analyticsLabel,
				},
				item,
			);
			const isCalendarTabExternal = WorkgroupUtil.isCalendarTabExternal(tabs);

			PageManager.openComponent('JSStackComponent', {
				scriptPath: availableComponents['project.tabs'].publicUrl,
				componentCode: 'project.tabs',
				canOpenInDefault: true,
				params: {
					id: item.id,
					subtitle,
					item,
					calendarWebPathTemplate: (calendarWebPathTemplate || ''),
					currentUserId: (currentUserId || env.userId),
					isCalendarTabExternal,
					siteId,
					guid,
				},
				title: item.title,
				rootWidget: {
					name: 'tabs',
					settings: {
						objectName: 'tabs',
						titleParams: WorkgroupUtil.getProjectTitleParams(item, subtitle),
						grabTitle: false,
						tabs: {
							items: tabs,
						},
					},
				},
			});
		}

		static getProjectData(params)
		{
			const {
				projectId,
				siteId,
				siteDir,
			} = params;

			return new Promise((resolve, reject) => {
				if (projectCache.has(projectId))
				{
					resolve({
						data: projectCache.get(projectId),
					});
				}
				else
				{
					BX.ajax.runAction('socialnetwork.api.workgroup.get', {
						data: {
							params: {
								groupId: projectId,
								mode: 'mobile',
								select: ['AVATAR', 'AVATAR_TYPES'],
								shouldSelectHasCollabers: 'Y',
								shouldEnsureHasCollabers: 'Y',
								features: [
									'tasks',
									'blog',
									'files',
									'calendar',
								],
								mandatoryFeatures: ['blog'],
								siteId,
								siteDir,
							},
						},
					}).then((response) => {
						if (!response.data)
						{
							response.data = {};
						}

						for (const key in response.data)
						{
							if (!projectKeys.has(key))
							{
								delete response.data[key];
							}
						}

						projectCache.set(projectId, response.data);

						return {
							data: response.data,
						};
					}).then((result) => {
						const data = result.data;

						BX.ajax.runAction('mobile.option.get', {
							data: {
								params: {
									name: [
										'projectNewsPathTemplate',
										'projectCalendarWebPathTemplate',
									],
									siteId,
									siteDir,
								},
							},
						}).then((result) => {
							const optionData = result.data;
							data.ADDITIONAL_DATA.projectNewsPathTemplate = optionData.projectNewsPathTemplate;
							data.ADDITIONAL_DATA.projectCalendarWebPathTemplate = optionData.projectCalendarWebPathTemplate;

							resolve({
								data,
							});
						}).catch(() => {
							reject({
								errors: result.errors,
							});
						});
					}).catch((response) => {
						reject({
							errors: result.errors,
						});
					});
				}
			});
		}

	}

	this.WorkgroupUtil = WorkgroupUtil;

	/**
	 * @module project/utils
	 */
	jn.define('project/utils', (require, exports, module) => {
		module.exports = { WorkgroupUtil };
	});
})();
