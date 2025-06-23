<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Access\Factory;

use Bitrix\Main\Access\AccessibleController;
use Bitrix\Main\ArgumentException;
use Bitrix\Tasks\V2\Access\Adapter\EntityModelAdapterInterface;
use Bitrix\Tasks\V2\Entity\EntityInterface;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Internals\Context\Context;

trait AccessControllerTrait
{
	public function getAccessController(Type $type, Context $context): AccessibleController
	{
		$factory = Container::getInstance()->getAccessControllerFactory();
		$accessController = $factory->create($type, $context->getUserId());
		if ($accessController === null)
		{
			throw new ArgumentException(parameter: 'type');
		}

		return $accessController;
	}

	public function getAdapter(EntityInterface $entity): EntityModelAdapterInterface
	{
		$factory = Container::getInstance()->getAccessControllerFactory();
		$adapter = $factory->createAdapter($entity);
		if ($adapter === null)
		{
			throw new ArgumentException(parameter: 'entity');
		}

		return $adapter;
	}
}