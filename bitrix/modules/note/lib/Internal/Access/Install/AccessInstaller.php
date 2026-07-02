<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Install;

use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Access\Permission\PermissionDictionary;
use Bitrix\Note\Internal\Access\Role\RoleDictionary;
use Bitrix\Note\Internal\Access\Role\RoleUtil;
use Bitrix\Note\Internal\Model\Access\PermissionTable;
use Bitrix\Note\Internal\Model\Access\RoleTable;

final class AccessInstaller
{
	public static function install(): Result
	{
		$result = new Result();

		$adminRoleId = self::upsertRole(RoleDictionary::ROLE_ADMINISTRATOR);
		$userRoleId = self::upsertRole(RoleDictionary::ROLE_USER);

		if ($adminRoleId <= 0 || $userRoleId <= 0)
		{
			$result->addError(new Error('Unable to install note roles'));

			return $result;
		}

		self::insertMissingPermissions([
			[
				'ROLE_ID' => $adminRoleId,
				'PERMISSION_ID' => PermissionDictionary::NOTE_ACCESS,
				'VALUE' => PermissionDictionary::VALUE_YES,
			],
			[
				'ROLE_ID' => $adminRoleId,
				'PERMISSION_ID' => PermissionDictionary::NOTE_EDIT_PERMISSIONS,
				'VALUE' => PermissionDictionary::VALUE_YES,
			],
			[
				'ROLE_ID' => $adminRoleId,
				'PERMISSION_ID' => PermissionDictionary::NOTE_CREATE_COLLECTIONS,
				'VALUE' => PermissionDictionary::VALUE_YES,
			],
			[
				'ROLE_ID' => $adminRoleId,
				'PERMISSION_ID' => PermissionDictionary::NOTE_IMPORT,
				'VALUE' => PermissionDictionary::VALUE_YES,
			],
			[
				'ROLE_ID' => $userRoleId,
				'PERMISSION_ID' => PermissionDictionary::NOTE_ACCESS,
				'VALUE' => PermissionDictionary::VALUE_YES,
			],
		]);

		return $result;
	}

	private static function upsertRole(string $code): int
	{
		$name = RoleDictionary::getRoleName($code) ?? $code;
		$role = RoleTable::getList([
			'select' => ['ID'],
			'filter' => ['=NAME' => $name],
			'limit' => 1,
		])->fetchObject();

		if ($role)
		{
			return (int)$role->getId();
		}

		$addResult = RoleTable::add(['NAME' => $name]);
		if (!$addResult->isSuccess())
		{
			return 0;
		}

		return (int)$addResult->getId();
	}

	private static function insertMissingPermissions(array $valuesData): void
	{
		if (empty($valuesData))
		{
			return;
		}

		$normalized = [];
		foreach ($valuesData as $row)
		{
			$roleId = (int)($row['ROLE_ID'] ?? 0);
			$permissionId = (string)($row['PERMISSION_ID'] ?? '');
			$value = (int)($row['VALUE'] ?? 0);
			if ($roleId <= 0 || $permissionId === '')
			{
				continue;
			}

			$key = $roleId . ':' . $permissionId;
			$normalized[$key] = [
				'ROLE_ID' => $roleId,
				'PERMISSION_ID' => $permissionId,
				'VALUE' => $value,
			];
		}
		if (empty($normalized))
		{
			return;
		}

		$roleIds = array_values(array_unique(array_map(
			static fn(array $row): int => (int)$row['ROLE_ID'],
			$normalized,
		)));
		$permissionIds = array_values(array_unique(array_map(
			static fn(array $row): string => (string)$row['PERMISSION_ID'],
			$normalized,
		)));

		$existingItems = PermissionTable::getList([
			'select' => ['ROLE_ID', 'PERMISSION_ID'],
			'filter' => [
				'=ROLE_ID' => $roleIds,
				'=PERMISSION_ID' => $permissionIds,
			],
		])->fetchCollection();

		foreach ($existingItems as $item)
		{
			$key = (int)$item->getRoleId() . ':' . (string)$item->getPermissionId();
			unset($normalized[$key]);
		}

		if (empty($normalized))
		{
			return;
		}

		RoleUtil::insertPermissions(array_values($normalized));
	}
}
