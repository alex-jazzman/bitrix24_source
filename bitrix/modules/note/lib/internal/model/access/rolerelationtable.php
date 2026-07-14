<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Model\Access;

use Bitrix\Main\Access\Role\AccessRoleRelationTable;

/**
 * Class RoleRelationTable
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_RoleRelation_Query query()
 * @method static EO_RoleRelation_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_RoleRelation_Result getById($id)
 * @method static EO_RoleRelation_Result getList(array $parameters = [])
 * @method static EO_RoleRelation_Entity getEntity()
 * @method static \Bitrix\Note\Internal\Model\Access\EO_RoleRelation createObject($setDefaultValues = true)
 * @method static \Bitrix\Note\Internal\Model\Access\EO_RoleRelation_Collection createCollection()
 * @method static \Bitrix\Note\Internal\Model\Access\EO_RoleRelation wakeUpObject($row)
 * @method static \Bitrix\Note\Internal\Model\Access\EO_RoleRelation_Collection wakeUpCollection($rows)
 */
final class RoleRelationTable extends AccessRoleRelationTable
{
	public static function getTableName(): string
	{
		return 'b_note_role_relation';
	}
}
