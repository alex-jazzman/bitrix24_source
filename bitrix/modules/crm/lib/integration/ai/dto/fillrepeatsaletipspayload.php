<?php

namespace Bitrix\Crm\Integration\AI\Dto;

use Bitrix\Crm\Dto\Dto;
use Bitrix\Crm\Dto\Validator\NotEmptyField;

final class FillRepeatSaleTipsPayload extends Dto
{
	public string $tips;
	
	protected function getValidators(array $fields): array
	{
		return [
			new NotEmptyField($this, 'tips'),
		];
	}
}
