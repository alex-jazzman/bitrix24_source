<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Access\Task\Permission;

use Attribute;
use Bitrix\Tasks\Access\ActionDictionary;
use Bitrix\Tasks\V2\Access\AttributeAccessInterface;
use Bitrix\Tasks\V2\Access\Factory\AccessControllerTrait;
use Bitrix\Tasks\V2\Access\Factory\Type;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Context\Context;

#[Attribute(Attribute::TARGET_PARAMETER)]
class Read implements AttributeAccessInterface
{
	use AccessControllerTrait;

	public function check(Entity\EntityInterface $entity, Context $context): bool
	{
		$accessController = $this->getAccessController(Type::Task, $context);
		$adapter = $this->getAdapter($entity);

		$model = $adapter->transform();

		return $accessController->checkByItemId(ActionDictionary::ACTION_TASK_READ, $model?->getId());
	}
}