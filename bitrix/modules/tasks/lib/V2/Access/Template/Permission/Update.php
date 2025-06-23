<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Access\Template\Permission;

use Attribute;
use Bitrix\Tasks\Access\ActionDictionary;
use Bitrix\Tasks\Access\TemplateAccessController;
use Bitrix\Tasks\V2\Access\Adapter\TemplateModelAdapter;
use Bitrix\Tasks\V2\Access\AttributeAccessInterface;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Context\Context;

#[Attribute(Attribute::TARGET_PARAMETER)]
class Update implements AttributeAccessInterface
{
	public function check(Entity\EntityInterface $entity, Context $context): bool
	{
		$accessController = TemplateAccessController::getInstance($context->getUserId());

		$adapter = new TemplateModelAdapter($entity);
		$before = $adapter->create();
		$after = $adapter->transform();

		return $accessController->check(ActionDictionary::ACTION_TEMPLATE_SAVE, $before, $after);
	}
}
