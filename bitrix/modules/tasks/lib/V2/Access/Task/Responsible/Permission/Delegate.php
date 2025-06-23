<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Access\Task\Responsible\Permission;

use Attribute;
use Bitrix\Tasks\Access\ActionDictionary;
use Bitrix\Tasks\V2\Access\AttributeAccessInterface;
use Bitrix\Tasks\V2\Access\Factory\AccessControllerTrait;
use Bitrix\Tasks\V2\Access\Factory\Type;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Internals\Context\Context;
use Bitrix\Tasks\V2\Entity;

#[Attribute(Attribute::TARGET_PARAMETER)]
class Delegate implements AttributeAccessInterface
{
	use AccessControllerTrait;

	public function check(Entity\EntityInterface $entity, Context $context): bool
	{
		$accessController = $this->getAccessController(Type::Task, $context);
		$adapter = $this->getAdapter($entity);

		$before = $adapter->create();
		$current = Container::getInstance()->getTaskRepository()->getById($entity->getId());
		if ($current === null)
		{
			return false;
		}

		$after = $adapter->transform($current);

		return $accessController->check(ActionDictionary::ACTION_TASK_DELEGATE, $before, $after);
	}
}