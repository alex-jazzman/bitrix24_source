<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Access\Group\Permission;

use Attribute;
use Bitrix\Main\Loader;
use Bitrix\Socialnetwork\Permission\GroupAccessController;
use Bitrix\Socialnetwork\Permission\GroupDictionary;
use Bitrix\Tasks\V2\Access\Adapter\GroupModelAdapter;
use Bitrix\Tasks\V2\Access\AttributeAccessInterface;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Context\Context;

#[Attribute(Attribute::TARGET_PARAMETER)]
class Read implements AttributeAccessInterface
{
	public function check(Entity\EntityInterface $entity, Context $context): bool
	{
		if (!Loader::includeModule('socialnetwork'))
		{
			return false;
		}

		$accessController = GroupAccessController::getInstance($context->getUserId());

		$adapter = new GroupModelAdapter($entity);
		$model = $adapter->transform();

		return $accessController->check(GroupDictionary::VIEW, $model);
	}
}