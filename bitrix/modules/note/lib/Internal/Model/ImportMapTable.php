<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Model;

use Bitrix\Main\ORM\Data\DataManager;
use Bitrix\Main\ORM\Fields\IntegerField;
use Bitrix\Main\ORM\Fields\StringField;

/**
 * Class ImportMapTable
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_ImportMap_Query query()
 * @method static EO_ImportMap_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_ImportMap_Result getById($id)
 * @method static EO_ImportMap_Result getList(array $parameters = [])
 * @method static EO_ImportMap_Entity getEntity()
 * @method static \Bitrix\Note\Internal\Model\EO_ImportMap createObject($setDefaultValues = true)
 * @method static \Bitrix\Note\Internal\Model\EO_ImportMap_Collection createCollection()
 * @method static \Bitrix\Note\Internal\Model\EO_ImportMap wakeUpObject($row)
 * @method static \Bitrix\Note\Internal\Model\EO_ImportMap_Collection wakeUpCollection($rows)
 */
class ImportMapTable extends DataManager
{
	public static function getTableName(): string
	{
		return 'b_note_import_map';
	}

	public static function getMap(): array
	{
		return [
			new IntegerField(
				'ID',
				[
					'primary' => true,
					'autocomplete' => true,
				],
			),
			new StringField(
				'SOURCE_TYPE',
				[
					'required' => true,
				],
			),
			new StringField(
				'EXTERNAL_ID',
				[
					'required' => true,
				],
			),
			new StringField(
				'URL_ID',
			),
			new IntegerField(
				'DOCUMENT_ID',
			),
			new IntegerField(
				'COLLECTION_ID',
			),
		];
	}
}
