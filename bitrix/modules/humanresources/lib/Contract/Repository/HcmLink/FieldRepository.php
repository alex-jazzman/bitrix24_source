<?php

namespace Bitrix\HumanResources\Contract\Repository\HcmLink;

use Bitrix\HumanResources\Item\Collection\HcmLink\FieldCollection;
use Bitrix\HumanResources\Item\HcmLink\Field;
use Bitrix\HumanResources\Type\HcmLink\FieldEntityType;
use Bitrix\HumanResources\Type\HcmLink\FieldType;

interface FieldRepository
{
	public function save(Field $item): Field;

	public function add(Field $field): Field;

	public function update(Field $field): Field;

	public function getByCompany(int $companyId): FieldCollection;
	public function getByCompanyIdAndEntityType(int $companyId, FieldEntityType $entityType): FieldCollection;
	public function getByCompanyIdAndType(int $companyId, FieldType $type): FieldCollection;

	public function deleteByCompany(int $companyId): void;

	public function delete(int $id): void;

	public function getByUnique(int $companyId, string $code): ?Field;

	public function getById(int $id): ?Field;

	public function getByIds(array $fieldIds): FieldCollection;
}
