<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Access\Deadline\Permission;

use Attribute;
use Bitrix\Tasks\Access\ActionDictionary;
use Bitrix\Tasks\Access\TaskAccessController;
use Bitrix\Tasks\V2\Access\Adapter\TaskModelAdapter;
use Bitrix\Tasks\V2\Access\AttributeAccessInterface;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Context\Context;

#[Attribute(Attribute::TARGET_PARAMETER)]
class Update implements AttributeAccessInterface
{
	public function check(Entity\EntityInterface $entity, Context $context): bool
	{
		$accessController = TaskAccessController::getInstance($context->getUserId());

		$adapter = new TaskModelAdapter($entity);
		$before = $adapter->create();

		return $accessController->check(ActionDictionary::ACTION_TASK_DEADLINE, $before);
	}
}