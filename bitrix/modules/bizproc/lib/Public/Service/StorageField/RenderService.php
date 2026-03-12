<?php

namespace Bitrix\Bizproc\Public\Service\StorageField;

use Bitrix\Bizproc\Internal\Entity\StorageField\StorageField;
use Bitrix\Bizproc\Internal\Service\StorageField\Factory;

class RenderService
{
	public function render(StorageField $field, mixed $value): ?string
	{
		$fieldTypeClass = Factory::getFieldTypeClass($field->getType());
		if ($fieldTypeClass)
		{
			$type = new $fieldTypeClass($field, $value);

			return $type->renderView();
		}

		return null;
	}
}
