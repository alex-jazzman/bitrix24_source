<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Component\PermissionConfig;

use Bitrix\Main\Access\AccessCode;
use Bitrix\Main\UI\AccessRights\DataProvider;
use Bitrix\Main\UI\AccessRights\Entity\User;
use Bitrix\Note\Internal\Model\Access\RoleRelationTable;

final class RoleMembersInfo
{
	/**
	 * @return array [roleId => [accessCode => metaData]]
	 */
	public function getMemberInfos(): array
	{
		$result = [];

		$rows = RoleRelationTable::getList([
			'select' => ['ROLE_ID', 'RELATION'],
		]);

		foreach ($rows as $row)
		{
			$roleId = (int)$row['ROLE_ID'];
			$accessCode = (string)$row['RELATION'];
			$result[$roleId][$accessCode] = true;
		}

		return $this->fillMembersInfo($result);
	}

	private function fillMembersInfo(array $rolesAccessCodes): array
	{
		$this->preloadProviderUserModels($rolesAccessCodes);

		$provider = new DataProvider();
		foreach ($rolesAccessCodes as $roleId => $accessCodes)
		{
			foreach ($accessCodes as $accessCode => $value)
			{
				$accessCodeObject = new AccessCode($accessCode);
				$entity = $provider->getEntity(
					$accessCodeObject->getEntityType(),
					$accessCodeObject->getEntityId(),
				);

				$rolesAccessCodes[$roleId][$accessCode] = $entity?->getMetaData() ?? [
					'id' => $accessCode,
					'type' => null,
					'name' => $accessCode,
					'avatar' => null,
				];
			}
		}

		return $rolesAccessCodes;
	}

	private function preloadProviderUserModels(array $rolesAccessCodes): void
	{
		$userIds = [];
		foreach ($rolesAccessCodes as $accessCodes)
		{
			foreach (array_keys($accessCodes) as $accessCode)
			{
				$accessCodeObject = new AccessCode($accessCode);
				if ($accessCodeObject->getEntityType() === AccessCode::TYPE_USER)
				{
					$userIds[] = $accessCodeObject->getEntityId();
				}
			}
		}

		if (!empty($userIds))
		{
			User::preLoadModels([
				'=ID' => $userIds,
			]);
		}
	}
}
