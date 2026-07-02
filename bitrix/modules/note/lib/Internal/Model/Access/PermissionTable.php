<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Model\Access;

use Bitrix\Main\Access\Permission\AccessPermissionTable;

/**
 * Class PermissionTable
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_Permission_Query query()
 * @method static EO_Permission_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_Permission_Result getById($id)
 * @method static EO_Permission_Result getList(array $parameters = [])
 * @method static EO_Permission_Entity getEntity()
 * @method static \Bitrix\Note\Internal\Model\Access\EO_Permission createObject($setDefaultValues = true)
 * @method static \Bitrix\Note\Internal\Model\Access\EO_Permission_Collection createCollection()
 * @method static \Bitrix\Note\Internal\Model\Access\EO_Permission wakeUpObject($row)
 * @method static \Bitrix\Note\Internal\Model\Access\EO_Permission_Collection wakeUpCollection($rows)
 */
final class PermissionTable extends AccessPermissionTable
{
	public static function getTableName(): string
	{
		return 'b_note_permission';
	}
}
