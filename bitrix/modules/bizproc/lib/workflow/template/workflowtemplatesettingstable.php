<?php

namespace Bitrix\Bizproc\Workflow\Template;

use Bitrix\Main\ORM;
use Bitrix\Main\ORM\Data\DataManager;
use Bitrix\Main\ORM\Fields\StringField;
use Bitrix\Main\ORM\Fields\Validators\LengthValidator;

/**
 * Class WorkflowTemplateSettingsTable
 *
 * DO NOT WRITE ANYTHING BELOW THIS
 *
 * <<< ORMENTITYANNOTATION
 * @method static EO_WorkflowTemplateSettings_Query query()
 * @method static EO_WorkflowTemplateSettings_Result getByPrimary($primary, array $parameters = [])
 * @method static EO_WorkflowTemplateSettings_Result getById($id)
 * @method static EO_WorkflowTemplateSettings_Result getList(array $parameters = [])
 * @method static EO_WorkflowTemplateSettings_Entity getEntity()
 * @method static \Bitrix\Bizproc\Workflow\Template\EO_WorkflowTemplateSettings createObject($setDefaultValues = true)
 * @method static \Bitrix\Bizproc\Workflow\Template\EO_WorkflowTemplateSettings_Collection createCollection()
 * @method static \Bitrix\Bizproc\Workflow\Template\EO_WorkflowTemplateSettings wakeUpObject($row)
 * @method static \Bitrix\Bizproc\Workflow\Template\EO_WorkflowTemplateSettings_Collection wakeUpCollection($rows)
 */
class WorkflowTemplateSettingsTable extends DataManager
{
	const SHOW_CATEGORY_PREFIX = 'SHOW_CATEGORY_ID_';

	public static function getTableName(): string
	{
		return 'b_bp_workflow_template_settings';
	}

	public static function getMap(): array
	{
		return [
			(new ORM\Fields\IntegerField('ID'))
				->configurePrimary()
				->configureAutocomplete()
			,
			(new ORM\Fields\IntegerField('TEMPLATE_ID'))
				->configureRequired()
			,
			(new ORM\Fields\StringField('NAME'))
				->configureRequired()
				->addValidator(new LengthValidator(null, 255))
			,
			(new ORM\Fields\StringField('VALUE')),
			new ORM\Fields\Relations\Reference(
				'TEMPLATE',
				Entity\WorkflowTemplateTable::class,
				ORM\Query\Join::on('this.TEMPLATE_ID', 'ref.ID')
			),
		];
	}

	public static function deleteSettingsByFilter(array $filter): void
	{
		$result = static::getList([
			'filter' => $filter,
			'select' => ['ID']
		]);
		while ($row = $result->fetch())
		{
			static::delete($row['ID']);
		}
	}

	public static function addMultiSettings(array $rows): void
	{
		if (!empty($rows))
		{
			static::addMulti($rows, true);
		}
	}
}
