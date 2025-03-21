<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2024 Bitrix
 */

namespace Bitrix\Main;

/**
 * @internal
 * Class UserProfileRecordTable
 * @package Bitrix\Main
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_UserProfileRecord_Query query()
 * @method static EO_UserProfileRecord_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_UserProfileRecord_Result getById($id)
 * @method static EO_UserProfileRecord_Result getList(array $parameters = [])
 * @method static EO_UserProfileRecord_Entity getEntity()
 * @method static \Bitrix\Main\EO_UserProfileRecord createObject($setDefaultValues = true)
 * @method static \Bitrix\Main\EO_UserProfileRecord_Collection createCollection()
 * @method static \Bitrix\Main\EO_UserProfileRecord wakeUpObject($row)
 * @method static \Bitrix\Main\EO_UserProfileRecord_Collection wakeUpCollection($rows)
 */
class UserProfileRecordTable extends Entity\DataManager
{
	public static function getTableName()
	{
		return 'b_user_profile_record';
	}

	public static function getMap()
	{
		return array(
			new Entity\IntegerField("ID", array(
				'primary' => true,
				'autocomplete' => true,
			)),
			new Entity\IntegerField("HISTORY_ID", array(
				'required' => true,
			)),
			new Entity\StringField("FIELD"),
			new Entity\TextField('DATA', array(
				'serialized' => true
			)),
			new Entity\ReferenceField("HISTORY",
				'\Bitrix\Main\UserProfileHistoryTable',
				array('=this.HISTORY_ID' => 'ref.ID'),
				array('join_type' => 'INNER')
			),
		);
	}

	public static function deleteByHistoryFilter($where)
	{
		if ($where == '')
		{
			throw new ArgumentException("Deleting by empty filter is not allowed, use truncate (b_user_profile_record).", "where");
		}

		$entity = static::getEntity();
		$conn = $entity->getConnection();

		$alias = ($conn instanceof DB\MysqlCommonConnection ? 'R' : '');

		$conn->queryExecute("
			DELETE {$alias} FROM b_user_profile_record R
			WHERE R.HISTORY_ID IN(
				SELECT ID FROM b_user_profile_history
				{$where}
			)
		");

		$entity->cleanCache();
	}
}
