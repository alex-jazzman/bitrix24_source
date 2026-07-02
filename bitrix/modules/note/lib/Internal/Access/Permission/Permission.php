<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Permission;

use Bitrix\Note\Internal\Access\AccessController;
use Bitrix\Note\Internal\Access\ActionDictionary;

final class Permission extends \Bitrix\UI\AccessRights\V2\Permission
{
	public function canUpdate(): bool
	{
		return AccessController::getInstance($this->userId)->check(ActionDictionary::ACTION_NOTE_ACCESS);
	}
}
