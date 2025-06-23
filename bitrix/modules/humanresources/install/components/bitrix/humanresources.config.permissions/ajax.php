<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\HumanResources\Access\StructureAccessController;
use Bitrix\HumanResources\Access\StructureActionDictionary;
use Bitrix\HumanResources\Enum\Access\RoleCategory;
use Bitrix\HumanResources\Service\Container;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Engine\CurrentUser;

if (!Bitrix\Main\Loader::includeModule('humanresources'))
{
	return;
}

class HumanResourcesConfigPermissionsAjaxController extends \Bitrix\Main\Engine\Controller
{
	/**
	 * @param list<array{id: string, type: string, title: string, accessRights: array, accessCodes?: array}> $userGroups
	 * @param array|null $deletedUserGroups
	 *
	 * @return array|null
	 */
	public function savePermissionsAction(array $userGroups, ?array $deletedUserGroups = null, ?array $parameters = []): ?array
	{
		if (!\Bitrix\HumanResources\Config\Storage::canUsePermissionConfig())
		{
			return [];
		}

		if (!isset($parameters['category']) || !$this->isSupportedRoleCategory((string)$parameters['category']))
		{
			return null;
		}

		$action = $parameters['category'] === RoleCategory::Department->value
			? StructureActionDictionary::ACTION_USERS_ACCESS_EDIT
			: StructureActionDictionary::ACTION_TEAM_ACCESS_EDIT
		;

		if (
			empty($userGroups)
			|| !check_bitrix_sessid()
			|| !StructureAccessController::can(CurrentUser::get()->getId(), $action)
		)
		{
			return null;
		}

		try
		{
			$permissionService = Container::getAccessRolePermissionService();
			$category = \Bitrix\HumanResources\Enum\Access\RoleCategory::tryFrom(
				$parameters['category'] ?? ''
			) ?? \Bitrix\HumanResources\Enum\Access\RoleCategory::Department;
			$permissionService->setCategory($category);

			$permissionService->saveRolePermissions($userGroups);

			Container::getAccessRoleRelationService()->saveRoleRelation($userGroups);
			if (is_array($deletedUserGroups))
			{
				$this->deleteUserGroups($deletedUserGroups);
			}

			return [
				'USER_GROUPS' => $permissionService->getUserGroups(),
			];
		}
		catch (\Exception)
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(
				Loc::getMessage('HUMAN_RESOURCES_CONFIG_PERMISSIONS_DB_ERROR') ?? ''
			);
		}

		return null;
	}

	public function loadAction(?array $parameters): array
	{
		if (!StructureAccessController::can(CurrentUser::get()->getId(), StructureActionDictionary::ACTION_USERS_ACCESS_EDIT))
		{
			return [];
		}
		$permissionService = Container::getAccessRolePermissionService();
		$category = \Bitrix\HumanResources\Enum\Access\RoleCategory::tryFrom(
				$parameters['category'] ?? ''
			) ?? \Bitrix\HumanResources\Enum\Access\RoleCategory::Department;
		$permissionService->setCategory($category);

		return [
			'USER_GROUPS' => $permissionService->getUserGroups(),
			'ACCESS_RIGHTS' => $permissionService->getAccessRights(),
		];
	}

	private function deleteUserGroups(array $deletedUserGroups): void
	{
		$deletedUserGroups = array_filter($deletedUserGroups, is_numeric(...));
		$deletedUserGroups = array_map(static fn($groupId) => (int)$groupId, $deletedUserGroups);
		if (empty($deletedUserGroups))
		{
			return;
		}

		Container::getAccessRolePermissionService()->deleteRoles($deletedUserGroups);
	}

	private function isSupportedRoleCategory(string $category): bool
	{
		return in_array($category, [
			RoleCategory::Department->value,
			RoleCategory::Team->value,
		], true);
	}
}