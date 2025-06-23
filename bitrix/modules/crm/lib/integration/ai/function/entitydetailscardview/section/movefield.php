<?php

namespace Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Section;

use Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Dto\Section\AbstractParameters;
use Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Dto\Section\MoveFieldParameters;
use Bitrix\Crm\Integration\UI\EntityEditor\Configuration;
use Bitrix\Crm\Result;

final class MoveField extends AbstractFunction
{
	/**
	 * @param MoveFieldParameters $parameters
	 * @param Configuration $configuration
	 * @return Result
	 */
	protected function doInvoke(AbstractParameters $parameters, Configuration $configuration): Result
	{
		$targetSection = $configuration->getSection($parameters->sectionName);
		if ($targetSection === null)
		{
			return Result::fail('Section to which the field needs to be moved was not found');
		}

		$targetElement = null;
		foreach ($configuration->getSections() as $section)
		{
			$targetElement = $section->getElement($parameters->fieldName);
			if ($targetElement !== null)
			{
				$section->removeElement($targetElement->getName());

				break;
			}
		}

		$targetElement ??= new Configuration\Element(name: $parameters->fieldName, isShowAlways: true);
		$targetSection->addElement($targetElement);

		$configuration->save();

		return Result::success();
	}

	protected function parseParameters(array $args): MoveFieldParameters
	{
		return new MoveFieldParameters($args);
	}
}
