<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Model;

use Bitrix\Main\ORM\Data\DataManager;
use Bitrix\Main\ORM\Data\Internal\DeleteByFilterTrait;
use Bitrix\Main\ORM\Fields\DatetimeField;
use Bitrix\Main\ORM\Fields\IntegerField;
use Bitrix\Main\ORM\Fields\StringField;
use Bitrix\Main\Type\DateTime;

/**
 * Class CollectionAccessTable
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_CollectionAccess_Query query()
 * @method static EO_CollectionAccess_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_CollectionAccess_Result getById($id)
 * @method static EO_CollectionAccess_Result getList(array $parameters = [])
 * @method static EO_CollectionAccess_Entity getEntity()
 * @method static \Bitrix\Note\Internal\Model\EO_CollectionAccess createObject($setDefaultValues = true)
 * @method static \Bitrix\Note\Internal\Model\EO_CollectionAccess_Collection createCollection()
 * @method static \Bitrix\Note\Internal\Model\EO_CollectionAccess wakeUpObject($row)
 * @method static \Bitrix\Note\Internal\Model\EO_CollectionAccess_Collection wakeUpCollection($rows)
 */
class CollectionAccessTable extends DataManager
{
	use DeleteByFilterTrait;

	public static function getTableName(): string
	{
		return 'b_note_collection_access';
	}

	public static function getMap(): array
	{
		return [
			new IntegerField('ID', [
				'primary' => true,
				'autocomplete' => true,
			]),
			new IntegerField('COLLECTION_ID', [
				'required' => true,
			]),
			new StringField('SUBJECT_CODE', [
				'required' => true,
			]),
			new IntegerField('LEVEL', [
				'required' => true,
			]),
			new IntegerField('CREATED_BY', [
				'required' => true,
			]),
			new DatetimeField('CREATED_AT', [
				'required' => true,
				'default_value' => static fn() => new DateTime(),
			]),
		];
	}
}
