<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Error;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Note\Internal\Access\AccessController;
use Bitrix\Note\Internal\Access\ActionDictionary;
use Bitrix\Note\Internal\Access\Component\PermissionConfig;
use Bitrix\Note\Internal\Access\Permission\PermissionDictionary;
use Bitrix\Note\Internal\Access\Service\RolePermissionService;

if (!Loader::includeModule('note'))
{
	return;
}

class NoteConfigPermissionsAjaxController extends Controller
{
	/**
	 * @param array[] $userGroups
	 * @param string[] $deletedUserGroups
	 * @param array $parameters
	 * @param array[] $accessRights
	 *
	 * @return null|array{USER_GROUPS: array, ACCESS_RIGHTS: array}
	 */
	public function savePermissionsAction(
		array $userGroups = [],
		array $deletedUserGroups = [],
		array $parameters = [],
		array $accessRights = [],
	): ?array
	{
		if (!$this->checkAccessOrAddError())
		{
			return null;
		}

		$service = new RolePermissionService();
		foreach ($deletedUserGroups as $deletedRole)
		{
			$service->deleteRole((int)$deletedRole);
		}

		$savePermissionsResult = $service->saveRolePermissions($userGroups);
		if (!$savePermissionsResult->isSuccess())
		{
			$this->errorCollection->add($savePermissionsResult->getErrors());

			return null;
		}

		PermissionDictionary::clearCollectionPermissionsCache();

		return $this->loadData();
	}

	/**
	 * @return null|array{USER_GROUPS: array, ACCESS_RIGHTS: array}
	 */
	public function loadAction(): ?array
	{
		if (!$this->checkAccessOrAddError())
		{
			return null;
		}

		return $this->loadData();
	}

	/**
	 * @return array{USER_GROUPS: array, ACCESS_RIGHTS: array}
	 */
	private function loadData(): array
	{
		$configPermissions = new PermissionConfig();

		return [
			'USER_GROUPS' => $configPermissions->getUserGroups(),
			'ACCESS_RIGHTS' => $configPermissions->getAccessRights(),
		];
	}

	private function checkAccessOrAddError(): bool
	{
		if ($this->checkAccessPermissions())
		{
			return true;
		}

		$this->errorCollection[] = new Error(Loc::getMessage('NOTE_CONFIG_PERMISSIONS_ACCESS_DENIED'));

		return false;
	}

	private function checkAccessPermissions(): bool
	{
		return AccessController::getCurrent()->check(ActionDictionary::ACTION_NOTE_EDIT_PERMISSIONS);
	}

}
