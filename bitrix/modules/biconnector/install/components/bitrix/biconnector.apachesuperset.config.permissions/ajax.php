<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Access\AccessController;
use Bitrix\BIConnector\Access\ActionDictionary;
use Bitrix\BIConnector\Access\Component\PermissionConfig;
use Bitrix\BIConnector\Access\Permission\PermissionDictionary;
use Bitrix\BIConnector\Access\Service\DashboardGroupService;
use Bitrix\BIConnector\Access\Service\RolePermissionService;
use Bitrix\BIConnector\Access\TableGroup\TableGroupTable;
use Bitrix\BIConnector\Analytics\AnalyticsManager;
use Bitrix\BIConnector\Internal\Integration\Im\DashboardDiscussionChatAccessSyncScheduler;
use Bitrix\BIConnector\Superset\ActionFilter\BIConstructorAccess;
use Bitrix\BIConnector\Superset\Error\UserFacingError;
use Bitrix\Bitrix24\Feature;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Result;

if (!Bitrix\Main\Loader::includeModule('biconnector'))
{
	return;
}

class ApacheSupersetConfigPermissionsAjaxController extends \Bitrix\Main\Engine\Controller
{
	protected function getDefaultPreFilters(): array
	{
		return [
			...parent::getDefaultPreFilters(),
			new BIConstructorAccess(),
		];
	}

	/**
	 * @param array[] $userGroups
	 * @param string[] $deletedUserGroups
	 * @param array $parameters
	 * @param array $accessRights For groups like G1 need to save dashboards and scopes.
	 * @param string[] $deletedAccessRights Groups taken off the matrix, of both axes
	 *
	 * @return null|array{'USER_GROUPS' => array[]}
	 */
	public function savePermissionsAction(
		array $userGroups = [],
		array $deletedUserGroups = [],
		array $parameters = [],
		array $accessRights = [],
		array $deletedAccessRights = []
	): ?array
	{
		if (!$this->checkEditPermissions())
		{
			$errorMessage = Loc::getMessage('BICONNECTOR_APACHESUPERSET_CONFIG_PERMISSIONS_ACCESS_DENIED');
			$this->errorCollection[] = new UserFacingError($errorMessage);

			return null;
		}

		if (!empty($deletedUserGroups))
		{
			$deleteResult = $this->deleteRoles($deletedUserGroups);
			if (!$deleteResult->isSuccess())
			{
				$this->errorCollection[] = $deleteResult->getError();

				return null;
			}
		}

		$deletedGroupPermissionIdList = array_filter($deletedAccessRights, function ($deletedAccessRight) {
			return PermissionDictionary::isDashboardGroupPermission($deletedAccessRight);
		});
		if (!empty($deletedGroupPermissionIdList))
		{
			$groupIdList = [];
			foreach ($deletedGroupPermissionIdList as $groupId)
			{
				if (str_contains($groupId, 'new'))
				{
					continue;
				}

				$groupIdList[] = PermissionDictionary::getDashboardGroupIdFromPermission($groupId);
			}
			$deleteResult = DashboardGroupService::deleteGroupList($groupIdList);
			if (!$deleteResult->isSuccess())
			{
				$this->errorCollection[] = $deleteResult->getError();

				return null;
			}
		}

		$deletedTableGroupPermissionIdList = array_filter($deletedAccessRights, function ($deletedAccessRight) {
			return PermissionDictionary::isTableGroupPermission($deletedAccessRight);
		});
		$deletedTableGroupIdList = [];
		if (!empty($deletedTableGroupPermissionIdList))
		{
			$tableGroupIdList = [];
			foreach ($deletedTableGroupPermissionIdList as $permissionId)
			{
				if (str_contains($permissionId, 'new'))
				{
					continue;
				}

				$tableGroupIdList[] = PermissionDictionary::getTableGroupIdFromPermission($permissionId);
			}

			// the deletion itself is done by the save: it has to see the composition of this very
			// request, or a table moved out of the removed group would still hold the removal back
			$deletedTableGroupIdList = $this->filterCustomTableGroups($tableGroupIdList);
		}

		$savePermissionsResult = (new RolePermissionService())
			->saveRolePermissions($userGroups, $accessRights, $deletedTableGroupIdList)
		;
		if (!$savePermissionsResult->isSuccess())
		{
			foreach ($savePermissionsResult->getErrors() as $error)
			{
				$this->errorCollection[] = $error;
			}

			return null;
		}

		PermissionDictionary::clearGroupPermissions();

		(new DashboardDiscussionChatAccessSyncScheduler())->scheduleAll();

		AnalyticsManager::sendSavePermissionsAnalytics(AnalyticsManager::GROUP_PERMISSION_SECTION);

		return $this->loadData();
	}

	/**
	 * Keeps the ids of custom groups and drops the rest, the way the report axis does it inside
	 * DashboardGroupService::deleteGroupList(): a system group the matrix never offers to delete and
	 * a group somebody has already deleted are no reason to refuse the whole save.
	 *
	 * @param int[] $tableGroupIdList
	 *
	 * @return int[]
	 */
	private function filterCustomTableGroups(array $tableGroupIdList): array
	{
		if (empty($tableGroupIdList))
		{
			return [];
		}

		$rows = TableGroupTable::getList([
			'select' => ['ID'],
			'filter' => [
				'@ID' => $tableGroupIdList,
				'=TYPE' => TableGroupTable::GROUP_TYPE_CUSTOM,
			],
		])->fetchAll();

		return array_map('intval', array_column($rows, 'ID'));
	}

	/**
	 * @param string[] $deletedRoles
	 *
	 * @return Result
	 */
	public function deleteRoles(array $deletedRoles): Result
	{
		$result = new Result();
		foreach ($deletedRoles as $deletedRole)
		{
			try
			{
				(new RolePermissionService())->deleteRole((int)$deletedRole);
			}
			catch (\Bitrix\Main\DB\SqlQueryException)
			{
				$errorMessage = Loc::getMessage('BICONNECTOR_APACHESUPERSET_CONFIG_ROLE_DELETE_DB_ERROR');
				$result->addError(new UserFacingError($errorMessage));

				return $result;
			}
		}

		return $result;
	}

	/**
	 *
	 * @return null | array
	 */
	public function loadAction(): ?array
	{
		if (!$this->checkEditPermissions())
		{
			$errorMessage = Loc::getMessage('BICONNECTOR_APACHESUPERSET_CONFIG_PERMISSIONS_ACCESS_DENIED');
			$this->errorCollection[] = new UserFacingError($errorMessage);

			return null;
		}

		return $this->loadData();
	}

	/**
	 * @return array
	 */
	private function loadData(): array
	{
		$configPermissions = new PermissionConfig();

		return [
			'USER_GROUPS' => $configPermissions->getUserGroups(),
			'ACCESS_RIGHTS' => $configPermissions->getAccessRights(),
		];
	}

	private function checkEditPermissions(): bool
	{
		if (Loader::includeModule('bitrix24') && !Feature::isFeatureEnabled('bi_constructor_rights'))
		{
			return false;
		}

		return AccessController::getCurrent()->check(ActionDictionary::ACTION_BIC_SETTINGS_EDIT_RIGHTS);
	}
}
