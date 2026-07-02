<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Model;

use Bitrix\Main\ORM\Data\DataManager;
use Bitrix\Main\ORM\Data\Internal\DeleteByFilterTrait;
use Bitrix\Main\ORM\Fields\DatetimeField;
use Bitrix\Main\ORM\Fields\IntegerField;
use Bitrix\Main\Type\DateTime;

/**
 * Class DocumentFileTable
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_DocumentFile_Query query()
 * @method static EO_DocumentFile_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_DocumentFile_Result getById($id)
 * @method static EO_DocumentFile_Result getList(array $parameters = [])
 * @method static EO_DocumentFile_Entity getEntity()
 * @method static \Bitrix\Note\Internal\Model\EO_DocumentFile createObject($setDefaultValues = true)
 * @method static \Bitrix\Note\Internal\Model\EO_DocumentFile_Collection createCollection()
 * @method static \Bitrix\Note\Internal\Model\EO_DocumentFile wakeUpObject($row)
 * @method static \Bitrix\Note\Internal\Model\EO_DocumentFile_Collection wakeUpCollection($rows)
 */
class DocumentFileTable extends DataManager
{
	use DeleteByFilterTrait;

	public static function getTableName(): string
	{
		return 'b_note_document_file';
	}

	public static function getMap(): array
	{
		return [
			new IntegerField('DOCUMENT_ID', [
				'primary' => true,
				'required' => true,
			]),
			new IntegerField('FILE_ID', [
				'primary' => true,
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
