<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Model;

use Bitrix\Main\ORM\Data\DataManager;
use Bitrix\Main\ORM\Fields\IntegerField;
use Bitrix\Main\ORM\Fields\StringField;

/**
 * Class ImportSessionTable
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_ImportSession_Query query()
 * @method static EO_ImportSession_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_ImportSession_Result getById($id)
 * @method static EO_ImportSession_Result getList(array $parameters = [])
 * @method static EO_ImportSession_Entity getEntity()
 * @method static \Bitrix\Note\Internal\Model\EO_ImportSession createObject($setDefaultValues = true)
 * @method static \Bitrix\Note\Internal\Model\EO_ImportSession_Collection createCollection()
 * @method static \Bitrix\Note\Internal\Model\EO_ImportSession wakeUpObject($row)
 * @method static \Bitrix\Note\Internal\Model\EO_ImportSession_Collection wakeUpCollection($rows)
 */
class ImportSessionTable extends DataManager
{
	public static function getTableName(): string
	{
		return 'b_note_import_session';
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
			new IntegerField(
				'CREATED_BY',
				[
					'required' => true,
				],
			),
			new StringField(
				'STATUS',
				[
					'required' => true,
					'default_value' => 'connecting',
				],
			),
		];
	}
}
