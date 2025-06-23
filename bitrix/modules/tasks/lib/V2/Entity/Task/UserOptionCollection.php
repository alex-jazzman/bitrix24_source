<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Entity\Task;

use Bitrix\Tasks\V2\Entity\AbstractEntityCollection;

/**
 * @method array getCodeList()
 * @method null|UserOption findOne(array $conditions)
 */
class UserOptionCollection extends AbstractEntityCollection
{
	protected static function getEntityClass(): string
	{
		return UserOption::class;
	}
}