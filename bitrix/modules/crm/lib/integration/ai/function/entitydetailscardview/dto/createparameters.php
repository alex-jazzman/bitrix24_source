<?php

namespace Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Dto;

use Bitrix\Crm\Dto\Caster;
use Bitrix\Crm\Dto\Dto;
use Bitrix\Crm\Dto\Validator\DefinedCategoryIdentifier;
use Bitrix\Crm\Dto\Validator\NotEmptyField;
use Bitrix\Crm\Dto\Validator\RequiredField;
use Bitrix\Crm\Dto\Validator\ScalarCollectionField;
use Bitrix\Crm\Integration\AI\Function\EntityDetailsCardView\Dto\Configuration\Section;

final class CreateParameters extends Dto
{
	public int $entityTypeId;
	public ?int $categoryId = null;

	public string $title;
	public array $sections;

	public array $userIds = [];
	public bool $common = true;
	public bool $forceSetToUsers = false;

	public function getCastByPropertyName(string $propertyName): ?Caster
	{
		return match ($propertyName) {
			'sections' => new Caster\CollectionCaster(new Caster\ObjectCaster(Section::class)),
			'userIds' => new Caster\CollectionCaster(new Caster\IntCaster()),
			default => null,
		};
	}

	protected function getValidators(array $fields): array
	{
		return [
			new DefinedCategoryIdentifier($this, 'entityTypeId', 'categoryId'),

			new RequiredField($this, 'title'),
			new NotEmptyField($this, 'title'),

			new RequiredField($this,'sections'),
			new NotEmptyField($this, 'sections'),

			new ScalarCollectionField($this, 'userIds'),
		];
	}

	public function toArraySections(): array
	{
		return array_map(static fn (Section $section) => $section->toArray(), $this->sections);
	}
}
