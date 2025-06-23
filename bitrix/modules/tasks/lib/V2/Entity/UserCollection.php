<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Entity;

/**
 * @method null|User findOne(array $conditions)
 * @method null|User findOneById(int $id, string $idKey = 'id')
 * @method UserCollection findAll(array $conditions)
 * @method UserCollection findAllByIds(array $ids, string $idKey = 'id')
 */
class UserCollection extends AbstractEntityCollection
{
	protected static function getEntityClass(): string
	{
		return User::class;
	}
}