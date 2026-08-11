<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Service;

use Bitrix\Main\Access\AccessCode;
use Bitrix\Main\Application;
use Bitrix\Main\Error;
use Bitrix\Main\Loader;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Access\Permission\PermissionDictionary;
use Bitrix\Note\Internal\Access\Role\RoleUtil;
use Bitrix\Note\Internal\Model\Access\PermissionTable;
use Bitrix\Note\Internal\Model\Access\RoleRelationTable;
use Bitrix\Note\Internal\Model\Access\RoleTable;

final class RolePermissionService
{
	public function saveRolePermissions(array $permissionSettings): Result
	{
		$result = new Result();
		$query = [];
		$roles = [];

		$connection = Application::getConnection();
		$connection->startTransaction();
		try
		{
			foreach ($permissionSettings as &$setting)
			{
				$roleId = (int)($setting['id'] ?? 0);
				$roleTitle = trim((string)($setting['title'] ?? ''));
				$saveRoleResult = $this->saveRole($roleTitle, $roleId > 0 ? $roleId : null);
				if (!$saveRoleResult->isSuccess())
				{
					$result->addErrors($saveRoleResult->getErrors());
					$connection->rollbackTransaction();

					return $result;
				}

				$roleId = (int)$saveRoleResult->getData()['id'];
				$setting['id'] = $roleId;
				$roles[] = $roleId;

				foreach (($setting['accessRights'] ?? []) as $permission)
				{
					$query[] = [
						'ROLE_ID' => $roleId,
						'PERMISSION_ID' => (string)$permission['id'],
						'VALUE' => (int)$permission['value'],
					];
				}
			}
			unset($setting);

			if (!empty($roles))
			{
				PermissionTable::deleteList(['=ROLE_ID' => $roles]);
				RoleUtil::insertPermissions($query);
				$this->saveRoleRelations($permissionSettings);
				$this->invalidateLeftMenuCache();
			}

			$connection->commitTransaction();
		}
		catch (\Throwable $e)
		{
			$connection->rollbackTransaction();
			$result->addError(new Error($e->getMessage()));
		}

		PermissionDictionary::clearCollectionPermissionsCache();

		return $result;
	}

	public function saveRole(string $name, ?int $roleId = null): Result
	{
		$result = new Result();
		if ($name === '')
		{
			$result->addError(new Error('Role name is required.'));

			return $result;
		}

		if ($roleId)
		{
			$saveResult = RoleTable::update($roleId, ['NAME' => $name]);
		}
		else
		{
			$saveResult = RoleTable::add(['NAME' => $name]);
		}

		if (!$saveResult->isSuccess())
		{
			$result->addErrors($saveResult->getErrors());

			return $result;
		}

		$result->setData(['id' => (int)$saveResult->getId()]);

		return $result;
	}

	public function deleteRole(int $roleId): Result
	{
		$result = new Result();
		$connection = Application::getConnection();
		$connection->startTransaction();

		try
		{
			PermissionTable::deleteList(['=ROLE_ID' => $roleId]);
			RoleRelationTable::deleteList(['=ROLE_ID' => $roleId]);
			RoleTable::delete($roleId);

			$connection->commitTransaction();
			$this->invalidateLeftMenuCache();
		}
		catch (\Throwable $e)
		{
			$connection->rollbackTransaction();
			$result->addError(new Error($e->getMessage()));
		}

		return $result;
	}

	private function saveRoleRelations(array $settings): void
	{
		foreach ($settings as $setting)
		{
			$roleId = (int)($setting['id'] ?? 0);
			if ($roleId <= 0)
			{
				continue;
			}

			(new RoleUtil($roleId))->updateRoleRelations($this->extractAccessCodes($setting));
		}
	}

	private function extractAccessCodes(array $setting): array
	{
		$result = [];

		$accessCodes = $setting['accessCodes'] ?? [];
		if (is_array($accessCodes))
		{
			foreach ($accessCodes as $accessCode => $type)
			{
				if (!is_string($accessCode))
				{
					continue;
				}

				$accessCode = trim($accessCode);
				if (!AccessCode::isValid($accessCode))
				{
					continue;
				}

				$result[$accessCode] = is_string($type) ? $type : '';
			}
		}

		if (!empty($result))
		{
			return $result;
		}

		$members = $setting['members'] ?? [];
		if (!is_array($members))
		{
			return $result;
		}

		foreach ($members as $accessCode => $member)
		{
			if (!is_string($accessCode))
			{
				continue;
			}

			$accessCode = trim($accessCode);
			if (!AccessCode::isValid($accessCode))
			{
				continue;
			}

			$type = '';
			if (is_array($member) && is_string($member['type'] ?? null))
			{
				$type = $member['type'];
			}

			$result[$accessCode] = $type;
		}

		return $result;
	}

	private function invalidateLeftMenuCache(): void
	{
		if (Loader::includeModule('intranet') && class_exists('\CIntranetUtils'))
		{
			\CIntranetUtils::clearMenuCache();
		}
	}

}
