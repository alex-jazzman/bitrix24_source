<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Model;

use Bitrix\Main\ORM\Data\DataManager;
use Bitrix\Main\ORM\Data\Internal\DeleteByFilterTrait;
use Bitrix\Main\ORM\Fields\DatetimeField;
use Bitrix\Main\ORM\Fields\IntegerField;
use Bitrix\Main\ORM\Fields\Relations\Reference;
use Bitrix\Main\ORM\Fields\TextField;
use Bitrix\Main\Type\DateTime;

/**
 * Class DocumentUpdateTable
 *
 * Fields:
 * <ul>
 * <li> ID int mandatory
 * <li> DOCUMENT_ID int mandatory
 * <li> USER_ID int mandatory
 * <li> PATCH text mandatory
 * <li> CREATED_AT datetime mandatory
 * </ul>
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_DocumentUpdate_Query query()
 * @method static EO_DocumentUpdate_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_DocumentUpdate_Result getById($id)
 * @method static EO_DocumentUpdate_Result getList(array $parameters = [])
 * @method static EO_DocumentUpdate_Entity getEntity()
 * @method static \Bitrix\Note\Internal\Model\DocumentUpdate createObject($setDefaultValues = true)
 * @method static \Bitrix\Note\Internal\Model\EO_DocumentUpdate_Collection createCollection()
 * @method static \Bitrix\Note\Internal\Model\DocumentUpdate wakeUpObject($row)
 * @method static \Bitrix\Note\Internal\Model\EO_DocumentUpdate_Collection wakeUpCollection($rows)
 */
class DocumentUpdateTable extends DataManager
{
	use DeleteByFilterTrait;
	public static function getTableName()
	{
		return 'b_note_document_updates';
	}

	public static function getObjectClass(): string
	{
		return DocumentUpdate::class;
	}

	public static function getMap()
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
			new IntegerField(
				'USER_ID',
				[
					'required' => true,
				],
			),
			new TextField(
				'PATCH',
				[
					'required' => true,
				],
			),
			new DatetimeField(
				'CREATED_AT',
				[
					'required' => true,
					'default_value' => static fn() => new DateTime(),
				],
			),
			new Reference(
				'DOCUMENT',
				DocumentTable::class,
				['=this.DOCUMENT_ID' => 'ref.ID'],
				['join_type' => 'LEFT'],
			),
		];
	}
}
