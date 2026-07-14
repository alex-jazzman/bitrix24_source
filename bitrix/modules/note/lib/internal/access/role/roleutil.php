<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Role;

use Bitrix\Main;
use Bitrix\Main\Application;
use Bitrix\Note\Internal\Model\Access\PermissionTable;
use Bitrix\Note\Internal\Model\Access\RoleRelationTable;
use Bitrix\Note\Internal\Model\Access\RoleTable;

final class RoleUtil extends Main\Access\Role\RoleUtil
{
	protected static function getRoleTableClass(): string
	{
		return RoleTable::class;
	}

	protected static function getRoleRelationTableClass(): string
	{
		return RoleRelationTable::class;
	}

	protected static function getPermissionTableClass(): string
	{
		return PermissionTable::class;
	}

	protected static function getRoleDictionaryClass(): ?string
	{
		return RoleDictionary::class;
	}

	public static function insertPermissions(array $valuesData): void
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
			'select' => ['ID', 'ROLE_ID', 'PERMISSION_ID'],
			'filter' => [
				'=ROLE_ID' => $roleIds,
				'=PERMISSION_ID' => $permissionIds,
			],
		])->fetchCollection();

		$existingByKey = [];
		foreach ($existingItems as $item)
		{
			$key = (int)$item->getRoleId() . ':' . (string)$item->getPermissionId();
			$existingByKey[$key] = (int)$item->getId();
		}

		$connection = Application::getConnection();
		$helper = $connection->getSqlHelper();
		$tableName = PermissionTable::getTableName();

		foreach ($normalized as $key => $row)
		{
			if (isset($existingByKey[$key]))
			{
				PermissionTable::update($existingByKey[$key], ['VALUE' => $row['VALUE']]);

				continue;
			}

			[$columns, $values] = $helper->prepareInsert($tableName, $row);
			$connection->query(
				'INSERT INTO ' . $helper->quote($tableName) . ' (' . $columns . ') VALUES (' . $values . ')'
			);
		}
	}
}
