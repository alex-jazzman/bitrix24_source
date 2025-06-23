<?php

namespace Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Section;

use Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Dto\Section\AbstractParameters;
use Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Dto\Section\CreateParameters;
use Bitrix\Crm\Integration\UI\EntityEditor\Configuration;
use Bitrix\Crm\Integration\UI\EntityEditor\Configuration\Section;
use Bitrix\Crm\Result;

final class Create extends AbstractFunction
{
	/**
	 * @param CreateParameters $parameters
	 * @param Configuration $configuration
	 * @return Result
	 */
	protected function doInvoke(AbstractParameters $parameters, Configuration $configuration): Result
	{
		$sectionData = $parameters->section->toArray();
		/** @var Section $newSection */
		$newSection = Section::fromArray($sectionData);

		if ($configuration->getSection($newSection->getName()) !== null)
		{
			return Result::fail('Created section name must be unique');
		}

		$fieldNames = array_keys($newSection->getElements());
		$configuration
			->removeElements($fieldNames)
			->addSection($newSection)
			->save();

		return Result::success();
	}

	protected function parseParameters(array $args): CreateParameters
	{
		return new CreateParameters($args);
	}
}
