<?php

namespace Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Section;

use Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Dto\Section\AbstractParameters;
use Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Dto\Section\DeleteParameters;
use Bitrix\Crm\Integration\UI\EntityEditor\Configuration;
use Bitrix\Crm\Result;

final class Delete extends AbstractFunction
{
	/**
	 * @param DeleteParameters $parameters
	 * @param Configuration $configuration
	 * @return Result
	 */
	protected function doInvoke(AbstractParameters $parameters, Configuration $configuration): Result
	{
		if ($configuration->getSection($parameters->name) === null)
		{
			return Result::fail('Section not found');
		}

		$configuration->removeSection($parameters->name);
		if (empty($configuration->getSections()))
		{
			return Result::fail('Last section cannot be deleted');
		}

		$configuration->save();

		return Result::success();
	}

	protected function parseParameters(array $args): DeleteParameters
	{
		return new DeleteParameters($args);
	}
}
