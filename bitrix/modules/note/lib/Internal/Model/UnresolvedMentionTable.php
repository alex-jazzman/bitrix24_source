<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Model;

use Bitrix\Main\ORM\Data\DataManager;
use Bitrix\Main\ORM\Data\Internal\DeleteByFilterTrait;
use Bitrix\Main\ORM\Fields\IntegerField;
use Bitrix\Main\ORM\Fields\StringField;

/**
 * Class UnresolvedMentionTable
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_UnresolvedMention_Query query()
 * @method static EO_UnresolvedMention_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_UnresolvedMention_Result getById($id)
 * @method static EO_UnresolvedMention_Result getList(array $parameters = [])
 * @method static EO_UnresolvedMention_Entity getEntity()
 * @method static \Bitrix\Note\Internal\Model\EO_UnresolvedMention createObject($setDefaultValues = true)
 * @method static \Bitrix\Note\Internal\Model\EO_UnresolvedMention_Collection createCollection()
 * @method static \Bitrix\Note\Internal\Model\EO_UnresolvedMention wakeUpObject($row)
 * @method static \Bitrix\Note\Internal\Model\EO_UnresolvedMention_Collection wakeUpCollection($rows)
 */
class UnresolvedMentionTable extends DataManager
{
	use DeleteByFilterTrait;

	public static function getTableName(): string
	{
		return 'b_note_unresolved_mention';
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
				'DOCUMENT_ID',
				[
					'required' => true,
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
		];
	}
}
