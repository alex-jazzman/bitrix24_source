<?php

namespace Bitrix\Crm\Integration\AI\Function\UserField\Dto\CreateUserFieldParameters;

use Bitrix\Crm\Dto\Caster;
use Bitrix\Crm\Dto\Validator\RequiredField;
use Bitrix\Crm\Integration\AI\Function\UserField\Dto\CreateUserFieldParameters;
use Bitrix\Crm\UserField\Dto\EnumerationItem;

class CreateEnumerationParameters extends CreateUserFieldParameters
{
	public array $enumerationList;

	protected bool $isCollectPropertiesFromParent = true;

	public function getCastByPropertyName(string $propertyName): ?Caster
	{
		return match ($propertyName) {
			'enumerationList' => new Caster\CollectionCaster(new Caster\ObjectCaster(EnumerationItem::class)),
			default => null,
		};
	}

	protected function getValidators(array $fields): array
	{
		return [
			...parent::getValidators($fields),
			new RequiredField($this, 'enumerationList'),
		];
	}
}
