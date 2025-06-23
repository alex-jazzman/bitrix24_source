<?php

namespace Bitrix\Tasks\V2\Access;

use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Context\Context;

interface AttributeAccessInterface
{
	public function check(Entity\EntityInterface $entity, Context $context): bool;
}