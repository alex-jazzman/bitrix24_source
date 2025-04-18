<?php

namespace Bitrix\Crm\Security\EntityPermission;

use Bitrix\Crm\Service\UserPermissions;

class MyCompany
{
	private UserPermissions $userPermissions;

	public function __construct(UserPermissions $userPermissions)
	{
		$this->userPermissions = $userPermissions;
	}
	public function canSearch(): bool
	{
		return $this->canReadBaseFields();
	}

	public function canReadBaseFields(?int $myCompanyId = null): bool
	{
		$baseEntityTypeIds = [
			\CCrmOwnerType::Company,
			\CCrmOwnerType::SmartInvoice,
			\CCrmOwnerType::SmartDocument,
			\CCrmOwnerType::SmartB2eDocument,
		];

		foreach ($baseEntityTypeIds as $baseEntityTypeId)
		{
			if ($this->userPermissions->entityType()->canReadItems($baseEntityTypeId))
			{
				return true;
			}
		}

		return false;
	}

	public function canRead(): bool
	{
		return $this->userPermissions->isCrmAdmin();
	}

	public function canAdd(): bool
	{
		return $this->userPermissions->isCrmAdmin();
	}

	public function canUpdate(): bool
	{
		return $this->userPermissions->isCrmAdmin();
	}

	public function canDelete(): bool
	{
		return $this->userPermissions->isCrmAdmin();
	}

	public function canAddByOwnerEntity(int $ownerEntityTypeId, ?int $ownerEntityId = null): bool
	{
		if (in_array($ownerEntityTypeId, [\CCrmOwnerType::SmartDocument, \CCrmOwnerType::SmartB2eDocument], true))
		{
			return $this->userPermissions->entityType()->canAddItems($ownerEntityTypeId);
		}

		return $this->canAdd();
	}

	public function canUpdateByOwnerEntity(int $ownerEntityTypeId, ?int $ownerEntityId = null): bool
	{
		if (in_array($ownerEntityTypeId, [\CCrmOwnerType::SmartDocument, \CCrmOwnerType::SmartB2eDocument], true))
		{
			return $this->userPermissions->item()->canUpdate($ownerEntityTypeId, $ownerEntityId);
		}

		return $this->canUpdate();
	}
}
