<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Model\Access;

use Bitrix\Main\Access\Role\AccessRoleTable;

/**
 * Class RoleTable
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_Role_Query query()
 * @method static EO_Role_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_Role_Result getById($id)
 * @method static EO_Role_Result getList(array $parameters = [])
 * @method static EO_Role_Entity getEntity()
 * @method static \Bitrix\Note\Internal\Model\Access\EO_Role createObject($setDefaultValues = true)
 * @method static \Bitrix\Note\Internal\Model\Access\EO_Role_Collection createCollection()
 * @method static \Bitrix\Note\Internal\Model\Access\EO_Role wakeUpObject($row)
 * @method static \Bitrix\Note\Internal\Model\Access\EO_Role_Collection wakeUpCollection($rows)
 */
final class RoleTable extends AccessRoleTable
{
	public static function getTableName(): string
	{
		return 'b_note_role';
	}
}
