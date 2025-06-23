<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Access\Flow\Permission;

use Attribute;
use Bitrix\Tasks\Flow\Access\FlowAccessController;
use Bitrix\Tasks\Flow\Access\FlowAction;
use Bitrix\Tasks\V2\Access\AttributeAccessInterface;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Context\Context;

#[Attribute(Attribute::TARGET_PARAMETER)]
class Read implements AttributeAccessInterface
{
	public function check(Entity\EntityInterface $entity, Context $context): bool
	{
		return FlowAccessController::can($context->getUserId(), FlowAction::READ, $entity->getId());
	}
}
