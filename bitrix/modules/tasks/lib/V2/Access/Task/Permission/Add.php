<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Access\Task\Permission;

use Attribute;
use Bitrix\Tasks\Access\ActionDictionary;
use Bitrix\Tasks\V2\Access\AccessUserErrorInterface;
use Bitrix\Tasks\V2\Access\AccessUserErrorTrait;
use Bitrix\Tasks\V2\Access\AttributeAccessInterface;
use Bitrix\Tasks\V2\Access\Factory\AccessControllerTrait;
use Bitrix\Tasks\V2\Access\Factory\Type;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Context\Context;

#[Attribute(Attribute::TARGET_PARAMETER)]
class Add implements AttributeAccessInterface, AccessUserErrorInterface
{
	use AccessControllerTrait;
	use AccessUserErrorTrait;

	public function check(Entity\EntityInterface $entity, Context $context): bool
	{
		$accessController = $this->getAccessController(Type::Task, $context);
		$adapter = $this->getAdapter($entity);

		$model = $adapter->transform();

		$result = $accessController->check(ActionDictionary::ACTION_TASK_SAVE, null, $model);
		if (!$result)
		{
			$this->resolveUserError($accessController);
		}

		return $result;
	}
}