<?php
namespace Bitrix\Landing\Internals;

use \Bitrix\Main\Localization\Loc;
use \Bitrix\Main\Entity;

Loc::loadMessages(__FILE__);

/**
 * Class UpdateBlockTable
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_UpdateBlock_Query query()
 * @method static EO_UpdateBlock_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_UpdateBlock_Result getById($id)
 * @method static EO_UpdateBlock_Result getList(array $parameters = [])
 * @method static EO_UpdateBlock_Entity getEntity()
 * @method static \Bitrix\Landing\Internals\EO_UpdateBlock createObject($setDefaultValues = true)
 * @method static \Bitrix\Landing\Internals\EO_UpdateBlock_Collection createCollection()
 * @method static \Bitrix\Landing\Internals\EO_UpdateBlock wakeUpObject($row)
 * @method static \Bitrix\Landing\Internals\EO_UpdateBlock_Collection wakeUpCollection($rows)
 */
class UpdateBlockTable extends Entity\DataManager
{
	/**
	 * Returns DB table name for entity.
	 * @return string
	 */
	public static function getTableName()
	{
		return 'b_landing_update_block';
	}

	/**
	 * Returns entity map definition.
	 * @return array
	 */
	public static function getMap()
	{
		return array(
			'ID' => new Entity\IntegerField('ID', array(
				'primary' => true,
				'autocomplete' => true,
				'title' => 'ID'
			)),
			'CODE' => new Entity\StringField('CODE', array(
				'title' => Loc::getMessage('LANDING_TABLE_FIELD_BLOCK_CODE'),
				'required' => true
			)),
			'LAST_BLOCK_ID' => new Entity\IntegerField('LAST_BLOCK_ID', array(
				'title' => Loc::getMessage('LANDING_TABLE_FIELD_LAST_BLOCK_ID'),
				'required' => true,
				'default_value' => 0
			)),
			'PARAMS' => new Entity\StringField('PARAMS', array(
				'title' => Loc::getMessage('LANDING_TABLE_FIELD_BLOCK_PARAMS'),
				'serialized' => true
			)),
			'CREATED_BY_ID' => new Entity\IntegerField('CREATED_BY_ID', array(
				'title' => Loc::getMessage('LANDING_TABLE_FIELD_CREATED_BY_ID'),
				'required' => true
			)),
			'MODIFIED_BY_ID' => new Entity\IntegerField('MODIFIED_BY_ID', array(
				'title' => Loc::getMessage('LANDING_TABLE_FIELD_MODIFIED_BY_ID'),
				'required' => true
			)),
			'DATE_CREATE' => new Entity\DatetimeField('DATE_CREATE', array(
				'title' => Loc::getMessage('LANDING_TABLE_FIELD_DATE_CREATE'),
				'required' => true
			)),
			'DATE_MODIFY' => new Entity\DatetimeField('DATE_MODIFY', array(
				'title' => Loc::getMessage('LANDING_TABLE_FIELD_DATE_MODIFY'),
				'required' => true
			))
		);
	}
}