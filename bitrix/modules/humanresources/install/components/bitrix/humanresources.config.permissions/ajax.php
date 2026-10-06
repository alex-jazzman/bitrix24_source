<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\HumanResources\Access\Permission\PermissionDictionary;
use Bitrix\HumanResources\Enum\Access\RoleCategory;
use Bitrix\HumanResources\Service\Container;
use Bitrix\HumanResources\Internals\Service\Container as InternalsContainer;
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;

if (!Bitrix\Main\Loader::includeModule('humanresources'))
{
	return;
}

class HumanResourcesConfigPermissionsAjaxController extends \Bitrix\Main\Engine\Controller
{
	/**
	 * @param list<array{id: string, type: string, title: string, accessRights: array, accessCodes?: array}> $userGroups
	 * @param array|null $deletedUserGroups
	 * @param array|null $parameters
	 *
	 * @return array|null
	 */
	public function savePermissionsAction(array $userGroups = [], ?array $deletedUserGroups = null, ?array $parameters = []): array
	{
		$category = RoleCategory::tryFrom($parameters['category'] ?? '');

		if (!$category)
		{
			return [];
		}

		$accessService = InternalsContainer::getAccessService();
		if (!$accessService->checkAccessToEditPermissions($category))
		{
			$this->addError(new Main\Error('Access denied', 'ACCESS_DENIED'));

			return [];
		}

		try
		{
			$permissionService = Container::getAccessRolePermissionService();
			$permissionService->setCategory($category);
			$deletedRoleIds = $this->normalizeDeletedUserGroups($deletedUserGroups);
			$permissionService->validateRolesCanBeDeleted($deletedRoleIds);

			if (!empty($userGroups))
			{
				$allowedPermissionIds = $this->getAllowedPermissionIds($category);
				if (!$this->validatePermissionsBelongToCategory($userGroups, $allowedPermissionIds))
				{
					$this->addError(new Main\Error('Invalid permissions for category', 'INVALID_PERMISSIONS'));

					return [];
				}

				$permissionService->saveRolePermissions($userGroups);
				Container::getAccessRoleRelationService()->saveRoleRelation($userGroups);
			}

			if (!empty($deletedRoleIds))
			{
				$permissionService->deleteRoles($deletedRoleIds);
			}

			return [
				'USER_GROUPS' => $permissionService->getUserGroups(),
			];
		}
		catch (\DomainException $exception)
		{
			$this->addError(new Main\Error($exception->getMessage(), 'ROLE_DOMAIN_ERROR'));
		}
		catch (\Exception)
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(
				Loc::getMessage('HUMAN_RESOURCES_CONFIG_PERMISSIONS_DB_ERROR') ?? '',
			);
		}

		return [];
	}

	public function loadAction(?array $parameters): array
	{
		$category = RoleCategory::tryFrom($parameters['category'] ?? '');

		if (!$category)
		{
			return [];
		}

		$accessService = InternalsContainer::getAccessService();
		if (!$accessService->checkAccessToEditPermissions($category))
		{
			$this->addError(new Main\Error('Access denied', 'ACCESS_DENIED'));

			return [];
		}

		$permissionService = Container::getAccessRolePermissionService();
		$permissionService->setCategory($category);

		return [
			'USER_GROUPS' => $permissionService->getUserGroups(),
			'ACCESS_RIGHTS' => $permissionService->getAccessRights(),
		];
	}

	/**
	 * @return list<string>
	 */
	private function getAllowedPermissionIds(RoleCategory $category): array
	{
		return match ($category)
		{
			RoleCategory::Department => PermissionDictionary::getDepartmentCategoryPermissionIds(),
			RoleCategory::Team => PermissionDictionary::getTeamCategoryPermissionIds(),
		};
	}

	private function validatePermissionsBelongToCategory(array $userGroups, array $allowedPermissionIds): bool
	{
		$allowedMap = array_flip($allowedPermissionIds);

		foreach ($userGroups as $group)
		{
			if (!isset($group['accessRights']) || !is_array($group['accessRights']))
			{
				continue;
			}

			foreach ($group['accessRights'] as $right)
			{
				if (!isset($right['id']))
				{
					continue;
				}

				if (!isset($allowedMap[(string)$right['id']]))
				{
					return false;
				}
			}
		}

		return true;
	}

	private function normalizeDeletedUserGroups(?array $deletedUserGroups): array
	{
		if (!is_array($deletedUserGroups))
		{
			return [];
		}

		$deletedUserGroups = array_filter($deletedUserGroups, is_numeric(...));
		$deletedUserGroups = array_map(static fn($groupId) => (int)$groupId, $deletedUserGroups);

		return array_values(array_unique($deletedUserGroups));
	}
}
