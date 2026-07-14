<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Model;

use Bitrix\Main;
use Bitrix\Note\Internal\Access\PortalAdmin;
use Bitrix\Note\Internal\Access\Permission\PermissionDictionary;
use Bitrix\Note\Internal\Model\Access\PermissionTable;
use Bitrix\Note\Internal\Model\Access\RoleRelationTable;

final class UserAccessItem extends Main\Access\User\UserModel
{
	private ?array $permissions = null;

	public function isAdmin(): bool
	{
		return PortalAdmin::isAdmin($this->userId);
	}

	public function getRoles(): array
	{
		if ($this->roles !== null)
		{
			return $this->roles;
		}

		$this->roles = [];
		if ($this->userId <= 0 || empty($this->getAccessCodes()))
		{
			return $this->roles;
		}

		$items = RoleRelationTable::query()
			->addSelect('ROLE_ID')
			->whereIn('RELATION', $this->getAccessCodes())
			->exec()
			->fetchCollection()
		;

		$this->roles = array_unique(array_map(fn($item) => $item->getRoleId(), $items->getAll()));

		return $this->roles;
	}

	public function getPermission(string $permissionId): ?int
	{
		$permissions = $this->getPermissions();
		$value = $permissions[$permissionId] ?? null;

		if (is_array($value))
		{
			return isset($value[0]) ? (int)$value[0] : null;
		}

		return $value !== null ? (int)$value : null;
	}

	public function getPermissionMulti(string $permissionId): ?array
	{
		if ($this->isAdmin())
		{
			return [PermissionDictionary::COLLECTION_LEVEL_MANAGE];
		}

		$permissions = $this->getPermissions();
		$value = $permissions[$permissionId] ?? null;

		return is_array($value) ? $value : null;
	}

	private function getPermissions(): array
	{
		if ($this->permissions !== null)
		{
			return $this->permissions;
		}

		$this->permissions = [];
		$roles = $this->getRoles();
		if (empty($roles))
		{
			return $this->permissions;
		}

		$permissionCollection = PermissionTable::query()
			->addSelect('PERMISSION_ID')
			->addSelect('VALUE')
			->whereIn('ROLE_ID', $roles)
			->exec()
			->fetchCollection()
		;

		foreach ($permissionCollection as $item)
		{
			$permissionId = (string)$item->getPermissionId();
			$value = (int)$item->getValue();
			$description = PermissionDictionary::getPermission($permissionId);

			if (($description['type'] ?? null) === PermissionDictionary::TYPE_DEPENDENT_VARIABLES)
			{
				$this->permissions[$permissionId] = $this->permissions[$permissionId] ?? [];
				if (!in_array($value, $this->permissions[$permissionId], true))
				{
					$this->permissions[$permissionId][] = $value;
				}
			}
			else
			{
				$this->permissions[$permissionId] = max(
					(int)($this->permissions[$permissionId] ?? PermissionDictionary::VALUE_NO),
					$value,
				);
			}
		}

		return $this->permissions;
	}
}
