<?php

namespace Bitrix\Mobile\AppTabs;

use Bitrix\Extranet\Service\ServiceContainer;
use Bitrix\Intranet\Settings\Tools\ToolsManager;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Bitrix\Main\LoaderException;
use Bitrix\Main\Localization\Loc;
use Bitrix\Mobile\Context;
use Bitrix\Mobile\Project\Helper;
use Bitrix\Mobile\Tab\Tabable;
use Bitrix\Mobile\Tab\Tasks\ProjectsComponent;
use Bitrix\Mobile\Tab\Utils;
use Bitrix\MobileApp\Janative\Manager;
use Bitrix\Socialnetwork\Component\WorkgroupList;
use Bitrix\Socialnetwork\Helper\Feature;
use Bitrix\TasksMobile\Provider\TariffPlanRestrictionProvider;
use Bitrix\TasksMobile\Settings;
use Bitrix\Mobile\Menu\Analytics;

class Task implements Tabable
{
	private Context $context;

	/**
	 * @throws LoaderException
	 * @throws \Exception
	 */
	public function getData(): ?array
	{
		if (!$this->isAvailable())
		{
			return null;
		}

		return $this->getDataInternal();
	}

	/**
	 * @throws \Exception
	 */
	public function getMenuData(): ?array
	{
		$result = [
			'id' => $this->getId(),
			'section_code' => 'tasks',
			'title' => $this->getTitle(),
			'useLetterImage' => true,
			'color' => '#fabb3f',
			'imageUrl' => 'favorite/icon-tasks.png',
			'params' => [
				'id' => 'tasks_tabs',
				'analytics' => Analytics::tasks(),
			],
			'imageName' => $this->getIconId(),
		];

		$data = $this->getDataInternal();

		if (!empty($data['component']))
		{
			$result['params']['onclick'] = Utils::getComponentJSCode($data['component']);
			$result['params']['counter'] ='tasks_total';
		}
		elseif (!empty($data['page']))
		{
			$result['params'] = $data['page'];
			$result['params']['counter'] = 'tasks_total';
		}

		return $result;
	}

	/**
	 * @throws LoaderException
	 */
	public function isAvailable(): bool
	{
		if (!Loader::includeModule('tasks') || !Loader::includeModule('tasksmobile'))
		{
			return false;
		}

		if (Loader::includeModule('socialnetwork'))
		{
			$userActiveFeatures = \CSocNetFeatures::getActiveFeatures(SONET_ENTITY_USER, $this->context->userId);
			$socNetFeatures = \CSocNetAllowed::getAllowedFeatures();

			return (
				$this->isToolAvailable('tasks')
				&& array_key_exists('tasks', $socNetFeatures)
				&& array_key_exists('allowed', $socNetFeatures['tasks'])
				&& in_array(SONET_ENTITY_USER, $socNetFeatures['tasks']['allowed'])
				&& is_array($userActiveFeatures)
				&& in_array('tasks', $userActiveFeatures)
			);
		}

		return false;
	}

	private function isToolAvailable(string $toolId): bool
	{
		if (Loader::includeModule('intranet'))
		{
			return ToolsManager::getInstance()->checkAvailabilityByToolId($toolId);
		}

		return true;
	}

	private function getCacheId(): string
	{
		$enabledTools = [];
		$projectsListComponent = ProjectsComponent::getListComponent();

		$tools = ['projects', 'tasks', 'templates', 'scrum', 'crm_bi', 'flows'];
		foreach ($tools as $toolId)
		{
			if ($this->isToolAvailable($toolId))
			{
				$enabledTools[] = $toolId;
				if ($toolId === 'projects')
				{
					$enabledTools[] = $projectsListComponent['code'];
				}
			}
		}

		return 'tasks_tabs_' . hash('sha256', implode('_', $enabledTools));
	}

	/**
	 * @throws \Exception
	 */
	private function getDataInternal(): array
	{
		return [
			'sort' => 400,
			'cacheId' => $this->getCacheId(),
			'imageName' => $this->getIconId(),
			'badgeCode' => 'tasks',
			'id' => 'tasks',
			'component' => ($this->isCollaber() ? $this->getTasksDashboardComponent() : $this->getTabsComponent()),
		];
	}

	/**
	 * @throws \Exception
	 */
	private function getTabsComponent(): array
	{
		$projectsListComponent = ProjectsComponent::getListComponent();

		return [
			'name' => 'JSStackComponent',
			'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_HEADER'),
			'componentCode' => 'tasks.tabs',
			'scriptPath' => Manager::getComponentPath('tasks:tasks.tabs'),
			'rootWidget' => [
				'name' => 'tabs',
				'settings' => [
					'objectName' => 'tabs',
					'grabTitle' => false,
					'grabButtons' => true,
					'grabSearch' => true,
					'useLargeTitleMode' => true,
					'tabs' => [
						'items' => array_values(
							array_filter([
								$this->getTaskListTab(),
								$this->getProjectListTab($projectsListComponent),
								$this->getFlowListTab(),
								$this->getTemplateListTab(),
								$this->getScrumListTab(),
								$this->getAnalyticsTab(),
							]),
						),
					],
				],
			],
			'params' => [
				'COMPONENT_CODE' => 'tasks.tabs',
				'USER_ID' => $this->context->userId,
				'SITE_ID' => $this->context->siteId,
				'SHOW_SCRUM_LIST' => Option::get('tasksmobile', 'showScrumList', 'N') === 'Y',
				'TAB_CODES' => [
					'TASKS' => 'tasks.dashboard',
					'FLOW' => 'tasks.flow.list',
					'TEMPLATES' => 'tasks.template.list',
					'PROJECTS' => $projectsListComponent['code'],
					'SCRUM' => 'tasks.scrum.list',
					'ANALYTICS' => 'tasks.analytics',
				],
			],
		];
	}

	private function getTaskListTab(): array
	{
		return [
			'id' => 'tasks.dashboard',
			'testId' => 'tasks_list',
			'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_TAB_TASKS'),
			'component' => $this->getTasksDashboardComponent(),
		];
	}

	private function getTasksDashboardComponent(): array
	{
		return [
			'name' => 'JSStackComponent',
			'title' => (
				$this->isCollaber()
					? Loc::getMessage('TAB_TASKS_NAVIGATION_TAB_TASKS')
					: Loc::getMessage('TAB_TASKS_NAVIGATION_HEADER')
			),
			'componentCode' => 'tasks.dashboard',
			'scriptPath' => Manager::getComponentPath('tasks:tasks.dashboard'),
			'settings' => [
				'preload' => true,
			],
			'rootWidget' => [
				'name' => 'layout',
				'settings' => [
					'objectName' => 'layout',
					'useSearch' => true,
					'useLargeTitleMode' => true,
				],
			],
			'params' => [
				'COMPONENT_CODE' => 'tasks.dashboard',
				'USER_ID' => $this->context->userId,
				'SITE_ID' => $this->context->siteId,
				'SITE_DIR' => $this->context->siteDir,
				'LANGUAGE_ID' => LANGUAGE_ID,
				'PATH_TO_TASK_ADD' => "{$this->context->siteDir}mobile/tasks/snmrouter/?routePage=#action#&TASK_ID=#taskId#",
				'PROJECT_NEWS_PATH_TEMPLATE' => Helper::getProjectNewsPathTemplate([
					'siteDir' => $this->context->siteDir,
				]),
				'PROJECT_CALENDAR_WEB_PATH_TEMPLATE' => Helper::getProjectCalendarWebPathTemplate([
					'siteId' => $this->context->siteId,
					'siteDir' => $this->context->siteDir,
				]),
				'MESSAGES' => [],
				'IS_TABS_MODE' => !$this->isCollaber(),
				'IS_ROOT_COMPONENT' => $this->isCollaber(),
			],
		];
	}

	private function getProjectListTab(array $projectsListComponent): ?array
	{
		if (!$this->isToolAvailable('projects'))
		{
			return null;
		}

		$isProjectRestricted = (
			!Feature::isFeatureEnabled(Feature::PROJECTS_GROUPS)
			&& !Feature::canTurnOnTrial(Feature::PROJECTS_GROUPS)
		);
		return [
			'id' => $projectsListComponent['code'],
			'testId' => 'tasks_project',
			'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_TAB_PROJECTS'),
			'icon' => ($isProjectRestricted ? 'lock' : null),
			'selectable' => !$isProjectRestricted,
			'component' => [
				'name' => 'JSStackComponent',
				'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_HEADER'),
				'componentCode' => $projectsListComponent['code'],
				'scriptPath' => $projectsListComponent['scriptPath'],
				'rootWidget' => ProjectsComponent::getRootWidget($projectsListComponent['code']),
				'params' => [
					'COMPONENT_CODE' => $projectsListComponent['code'],
					'SITE_ID' => $this->context->siteId,
					'SITE_DIR' => $this->context->siteDir,
					'USER_ID' => $this->context->userId,
					'PROJECT_NEWS_PATH_TEMPLATE' => Helper::getProjectNewsPathTemplate([
						'siteDir' => $this->context->siteDir,
					]),
					'PROJECT_CALENDAR_WEB_PATH_TEMPLATE' => Helper::getProjectCalendarWebPathTemplate([
						'siteId' => $this->context->siteId,
						'siteDir' => $this->context->siteDir,
					]),
					'MODE' => WorkgroupList::MODE_TASKS_PROJECT,
				],
			],
		];
	}

	private function getFlowListTab(): ?array
	{
		if ($this->context->extranet || $this->context->isGuest || !Settings::getInstance()->isTaskFlowAvailable())
		{
			return null;
		}

		return [
			'id' => 'tasks.flow.list',
			'testId' => 'tasks_flow',
			'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_TAB_FLOW'),
			'component' => [
				'name' => 'JSStackComponent',
				'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_HEADER'),
				'componentCode' => 'tasks.flow.list',
				'scriptPath' => Manager::getComponentPath('tasks:tasks.flow.list'),
				'rootWidget' => [
					'name' => 'layout',
					'settings' => [
						'objectName' => 'layout',
						'useSearch' => true,
						'useLargeTitleMode' => true,
					],
				],
				'params' => [
					'COMPONENT_CODE' => 'tasks.flow.list',
					'USER_ID' => $this->context->userId,
					'SITE_ID' => $this->context->siteId,
					'SITE_DIR' => $this->context->siteDir,
					'LANGUAGE_ID' => LANGUAGE_ID,
				],
			],
		];
	}

	private function getTemplateListTab(): ?array
	{
		if (
			!$this->isToolAvailable('templates')
			|| !Manager::getAvailableComponents()['tasks:tasks.template.list']
		)
		{
			return null;
		}

		return [
			'id' => 'tasks.template.list',
			'testId' => 'tasks_template',
			'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_TAB_TEMPLATES'),
			'component' => [
				'name' => 'JSStackComponent',
				'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_HEADER'),
				'componentCode' => 'tasks.template.list',
				'scriptPath' => Manager::getComponentPath('tasks:tasks.template.list'),
				'rootWidget' => [
					'name' => 'layout',
					'settings' => [
						'objectName' => 'layout',
						'useSearch' => true,
						'useLargeTitleMode' => true,
					],
				],
				'params' => [
					'COMPONENT_CODE' => 'tasks.template.list',
				],
			],
		];
	}

	private function getScrumListTab(): ?array
	{
		if (!$this->isToolAvailable('scrum'))
		{
			return null;
		}

		return [
			'id' => 'tasks.scrum.list',
			'testId' => 'tasks_scrum',
			'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_TAB_SCRUM'),
			'component' => [
				'name' => 'JSStackComponent',
				'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_TAB_SCRUM'),
				'componentCode' => 'tasks.scrum.empty-state',
				'scriptPath' => Manager::getComponentPath('tasks:tasks.scrum.empty-state'),
				'rootWidget' => [
					'name' => 'layout',
					'settings' => [
						'objectName' => 'layout',
						'useLargeTitleMode' => true,
					],
				],
				'params' => [
					'COMPONENT_CODE' => 'tasks.scrum.empty-state',
				],
			],
		];
	}

	private function getAnalyticsTab(): ?array
	{
		if (!$this->isToolAvailable('crm_bi'))
		{
			return null;
		}

		return [
			'id' => 'tasks.analytics',
			'testId' => 'tasks_analytics',
			'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_TAB_ANALYTICS'),
			'component' => [
				'name' => 'JSStackComponent',
				'title' => Loc::getMessage('TAB_TASKS_NAVIGATION_TAB_ANALYTICS'),
				'componentCode' => 'tasks.analytics.empty-state',
				'scriptPath' => Manager::getComponentPath('tasks:tasks.analytics.empty-state'),
				'rootWidget' => [
					'name' => 'layout',
					'settings' => [
						'objectName' => 'layout',
						'useLargeTitleMode' => true,
					],
				],
				'params' => [
					'COMPONENT_CODE' => 'tasks.analytics.empty-state',
				],
			],
		];
	}

	private function isCollaber(): bool
	{
		return (
			Loader::includeModule('extranet')
			&& ServiceContainer::getInstance()->getCollaberService()->isCollaberById($this->context->userId)
		);
	}

	public function getId(): string
	{
		return 'tasks';
	}

	public function getTitle(): ?string
	{
		return Loc::getMessage('TAB_NAME_TASKS_LIST_SHORT');
	}

	public function getShortTitle(): ?string
	{
		return Loc::getMessage('TAB_NAME_TASKS_LIST_SHORT');
	}

	public function shouldShowInMenu(): bool
	{
		return $this->isToolAvailable('tasks');
	}

	public function canBeRemoved(): bool
	{
		return true;
	}

	public function canChangeSort(): bool
	{
		return true;
	}

	public function defaultSortValue(): int
	{
		return 400;
	}

	/**
	 * @param Context $context
	 * @return void
	 */
	public function setContext($context): void
	{
		$this->context = $context;
	}

	public function getIconId(): string
	{
		return 'circle_check';
	}
}
