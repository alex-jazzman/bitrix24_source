<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Trait;

use Bitrix\Main\Engine\Controller;
use Bitrix\Tasks\V2\Controller\Prefilter\AttributePrefilterInterface;
use ReflectionClass;
use ReflectionMethod;

trait AttributePrefilterTrait
{
	use ActionTrait;

	public function configureActionsViaAttributes(Controller $controller): array
	{
		$reflector = new ReflectionClass($controller);
		$methods = $reflector->getMethods(ReflectionMethod::IS_PUBLIC);

		$target = strtolower($this->getControllerAction($controller));

		foreach ($methods as $methodReflector)
		{
			$name = strtolower($methodReflector->getName());
			if ($name === $target)
			{
				$actionName = substr($name, 0, -6);

				$attributeReflectors = $methodReflector->getAttributes();
				$map = [];
				foreach ($attributeReflectors as $attributeReflector)
				{
					$attribute = $attributeReflector->newInstance();
					if (!$attribute instanceof AttributePrefilterInterface)
					{
						continue;
					}

					$map[$actionName]['+prefilters'][] = $attribute->getPrefilter();
				}

				return $map;
			}

		}

		return [];
	}
}