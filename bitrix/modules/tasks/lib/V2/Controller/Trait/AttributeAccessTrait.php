<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Trait;

use Bitrix\Main\Engine\Controller;
use Bitrix\Tasks\V2\Access\AccessUserErrorInterface;
use Bitrix\Tasks\V2\Access\AttributeAccessInterface;
use Bitrix\Tasks\V2\Entity\EntityInterface;
use Bitrix\Tasks\V2\Internals\Context\ContextTrait;
use ReflectionMethod;

trait AttributeAccessTrait
{
	use ActionTrait;
	use AccessErrorTrait;
	use ContextTrait;

	protected function getWithAccess(Controller $controller, string $parameterName, EntityInterface $entity): ?EntityInterface
	{
			$accessAttributes = $this->getArgumentAccessAttributes($controller, $parameterName);
			foreach ($accessAttributes as $accessAttribute)
			{
				/** @var AttributeAccessInterface $accessAttribute */
				if (!$accessAttribute->check($entity, $this->getContext()))
				{
					if ($accessAttribute instanceof AccessUserErrorInterface)
					{
						return $this->buildForbiddenResponse($accessAttribute->getUserError());
					}

					return $this->buildForbiddenResponse();
				}
			}

			return $entity;
	}

	protected function getArgumentAccessAttributes(Controller $controller, string $parameterName): array
	{
		$action = $this->getControllerAction($controller);
		$reflector = new ReflectionMethod($controller, $action);

		$args = $reflector->getParameters();

		$accessAttributes = [];
		foreach ($args as $arg)
		{
			if ($arg->getName() === $parameterName)
			{
				$attributes = $arg->getAttributes();
				foreach ($attributes as $attribute)
				{
					$instance = $attribute->newInstance();
					if ($instance instanceof AttributeAccessInterface)
					{
						$accessAttributes[] = $instance;
					}
				}
			}
		}

		return $accessAttributes;
	}
}
