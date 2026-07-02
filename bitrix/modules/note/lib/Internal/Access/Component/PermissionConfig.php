<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Component;

use Bitrix\Main\Localization\Loc;
use Bitrix\Note\Internal\Access\Component\PermissionConfig\RoleMembersInfo;
use Bitrix\Note\Internal\Access\Permission\PermissionDictionary;
use Bitrix\Note\Internal\Access\Role\RoleDictionary;
use Bitrix\Note\Internal\Access\Role\RoleUtil;
use Bitrix\Note\Internal\Model\Access\PermissionTable;

final class PermissionConfig
{
	public const SECTION_MAIN_RIGHTS = 'SECTION_RIGHTS_MAIN';

	public function getAccessRights(): array
	{
		$result = [];
		foreach ($this->getSections() as $sectionCode => $permissions)
		{
			$rights = [];
			foreach ($permissions as $permissionId)
			{
				$rights[] = PermissionDictionary::getPermission($permissionId);
			}

			$result[] = [
				'sectionCode' => $sectionCode,
				'sectionTitle' => Loc::getMessage("NOTE_CONFIG_PERMISSION_{$sectionCode}"),
				'rights' => $rights,
			];
		}

		return $result;
	}

	public function getUserGroups(): array
	{
		$members = $this->getRoleMembersMap();
		$accessRights = $this->getRoleAccessRightsMap();

		$roles = [];
		foreach (RoleUtil::getRoles() as $row)
		{
			$roleId = (int)$row['ID'];
			$name = (string)$row['NAME'];

			$roles[] = [
				'id' => $roleId,
				'title' => RoleDictionary::getRoleName($name) ?? $name,
				'accessRights' => $accessRights[$roleId] ?? [],
				'members' => $members[$roleId] ?? [],
			];
		}

		return $roles;
	}

	private function getSections(): array
	{
		return [
			self::SECTION_MAIN_RIGHTS => [
				PermissionDictionary::NOTE_ACCESS,
				PermissionDictionary::NOTE_EDIT_PERMISSIONS,
				PermissionDictionary::NOTE_CREATE_COLLECTIONS,
				PermissionDictionary::NOTE_IMPORT,
			],
		];
	}

	private function getRoleMembersMap(): array
	{
		return (new RoleMembersInfo())->getMemberInfos();
	}

	private function getRoleAccessRightsMap(): array
	{
		$result = [];
		$items = PermissionTable::getList([
			'select' => ['ROLE_ID', 'PERMISSION_ID', 'VALUE'],
		])->fetchCollection();

		foreach ($items as $item)
		{
			$roleId = (int)$item->getRoleId();
			$permissionId = (string)$item->getPermissionId();
			if (PermissionDictionary::isCollectionPermission($permissionId))
			{
				continue;
			}

			$result[$roleId][] = [
				'id' => $permissionId,
				'value' => (int)$item->getValue(),
			];
		}

		return $result;
	}
}
