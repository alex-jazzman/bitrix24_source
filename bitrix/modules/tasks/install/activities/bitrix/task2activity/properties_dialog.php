<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Tasks\Flow\Control\Task\Field\FlowFieldHandler;
use Bitrix\Tasks\Flow\Distribution\FlowDistributionServicesFactory;
use Bitrix\Tasks\Flow\Distribution\FlowDistributionType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

/** @var \Bitrix\Bizproc\Activity\PropertiesDialog $dialog */

\Bitrix\Main\Page\Asset::getInstance()->addJs(getLocalPath('activities/bitrix/task2activity/script.js'));

\Bitrix\Main\UI\Extension::load([
	'ui.entity-selector',
	'tasks.entity-selector',
	'ui.design-tokens',
	'ui.design-tokens.air',
	'ui.icon-set.outline',
	'ui.a11y',
]);

\Bitrix\Main\Page\Asset::getInstance()->addCss(getLocalPath('activities/bitrix/task2activity/check-list.css'));

$currentValues = $dialog->getCurrentValues();
$map = $dialog->getMap();
$taskFieldsMap = $map['Fields']['Map'];

$documentValues = $dialog->getCurrentValue('Fields') ?? $dialog->getCurrentValues();

$getUserFieldValueControl = function (array $field, $value = null) use ($dialog)
{
	$fieldValue = $value ?? $dialog->getCurrentValue($field);

	if ($fieldValue)
	{
		if ($field['UserField']['USER_TYPE_ID'] === 'boolean')
		{
			$field['UserField']['VALUE'] = ($fieldValue == 'Y' ? 1 : 0);
		}
		else
		{
			$field['UserField']['VALUE'] = $fieldValue;
		}
		$field['UserField']['ENTITY_VALUE_ID'] = 1; //hack to not empty value
	}

	ob_start();
	$GLOBALS['APPLICATION']->IncludeComponent(
		'bitrix:system.field.edit',
		$field['UserField']['USER_TYPE']['USER_TYPE_ID'],
		[
			'bVarsFromForm' => false,
			'arUserField' => $field['UserField'],
			'form_name' => $dialog->getFormName(),
			'SITE_ID' => $dialog->getSiteId(),
		],
		null,
		['HIDE_ICONS' => 'Y'],
	);
	$controlHtml = ob_get_clean();

	if ($field['FieldName'] === 'UF_TASK_WEBDAV_FILES' || $field['FieldName'] === 'UF_CRM_TASK')
	{
		$fieldMap = [
			'FieldName' => $field['UserField']['FIELD_NAME'] . '_text',
			'Type' => \Bitrix\Bizproc\FieldType::STRING,
			'Required' => $field['Required'],
			'Multiple' => $field['Multiple'],
		];

		$fieldType = $dialog->getFieldTypeObject($fieldMap);

		$controlHtml .= $fieldType->renderControl(
			[
				'Form' => $dialog->getFormName(),
				'Field' => $fieldMap['FieldName']
			],
			is_array($fieldValue) ? array_filter($fieldValue, [CBPDocument::class, 'isExpression']) : $fieldValue,
		true,
		0
		);
	}

	return $controlHtml;
};

$renderField = function (array $field, $value = null) use ($dialog, $getUserFieldValueControl)
{
	$userFieldTypes = [
		\Bitrix\Bizproc\FieldType::STRING,
		\Bitrix\Bizproc\FieldType::DOUBLE,
		\Bitrix\Bizproc\FieldType::DATETIME,
		\Bitrix\Bizproc\FieldType::BOOL,
	];

	$controlHtml = null;
	if (
		!isset($field['UserField'])
		|| (
			in_array($field['Type'], $userFieldTypes, true)
			&& mb_substr($field['UserField']['FIELD_NAME'], 0, mb_strlen('UF_AUTO_')) === 'UF_AUTO_'
		)
	)
	{
		$controlHtml = $dialog->renderFieldControl(
			$field,
			$value ?? $dialog->getCurrentValue($field),
			true,
			\Bitrix\Bizproc\FieldType::RENDER_MODE_DESIGNER,
		);
	}

	$fieldName =
		($field['Required'] ?? null)
			? sprintf('<span class="adm-required-field">%s</span>', htmlspecialcharsbx($field['Name']))
			: htmlspecialcharsbx($field['Name'])
	;

	echo sprintf(
		'<tr><td align="right" width="40%%">%s:</td><td width="60%%">%s</td></tr>',
		$fieldName,
		$controlHtml ?? $getUserFieldValueControl($field, $value),
	);
};

$renderDocumentField = function (array $field) use ($documentValues, $renderField)
{
	// compatibility
	$textFieldValue = $documentValues["{$field['FieldName']}_text"] ?? null;
	if (isset($textFieldValue))
	{
		$documentValues[$field['FieldName']] = $textFieldValue;
	}
	// end of compatibility

	$renderField($field, $documentValues[$field['FieldName']] ?? null);
};

$checkListIndexPlaceholder = '#INDEX#';

// the ids below are referred to by aria-describedby and aria-labelledby, and by the script that raises
// the control, and a page may hold more than one settings form, so the field gets its own prefix
// instead of a fixed name
$checkListId = 'tasks-bp-check-list-' . \Bitrix\Main\Security\Random::getString(8);

/**
 * The check lists the field is drawn from, and where their grouping came from (TPL-01, rule 6).
 * Values of the template are grouped by parsing them, but a request redrawn after a rejected save is
 * grouped by the channel of row kinds it carries: parsing its text again would turn a heading the
 * user typed by hand into a real one. Both readings belong to the activity, so the dialog and the
 * saving side never tell one row from another by rules of their own.
 */
$readCheckListBlocks = static function (array $field) use ($dialog, $currentValues): array
{
	$values = $dialog->getCurrentValue($field);
	$kinds = $currentValues[CBPTask2Activity::CHECK_LIST_KINDS_FIELD] ?? null;
	// an empty value is still one check list: a block with neither a name row nor items sends no
	// rows at all, so the field looks and saves the way it did before the feature
	$empty = [['hasTitle' => false, 'title' => '', 'items' => []]];

	$blocks = isset($kinds)
		? CBPTask2Activity::readCheckListForm($values ?? [], $kinds)
		: CBPTask2Activity::parseCheckLists($values)
	;

	return $blocks ?: $empty;
};

$renderCheckListField = function (array $field) use (
	$dialog,
	$renderField,
	$readCheckListBlocks,
	$checkListIndexPlaceholder,
	$checkListId
)
{
	$singleField = $field;
	$singleField['Multiple'] = false;

	$fieldType = $dialog->getFieldTypeObject($singleField);
	if (!$fieldType)
	{
		$renderField($field);

		return;
	}

	$renderRowControl = static fn($index, $value) => $fieldType->renderControl(
		[
			'Form' => $dialog->getFormName(),
			'Field' => $field['FieldName'],
			'Index' => $index,
		],
		$value,
		true,
		\Bitrix\Bizproc\FieldType::RENDER_MODE_DESIGNER,
	);

	$maxItemLength = CBPTask2Activity::CHECK_LIST_ITEM_MAX_LENGTH;
	$maxItemsCount = CBPTask2Activity::CHECK_LIST_ITEMS_MAX_COUNT;
	$maxListsCount = CBPTask2Activity::CHECK_LISTS_MAX_COUNT;
	$lengthError = htmlspecialcharsbx(
		GetMessage('TASKS_BP_CHECK_LIST_ITEM_LENGTH_ERROR', ['#LIMIT#' => (string)$maxItemLength])
	);
	$nameLengthError = htmlspecialcharsbx(
		GetMessage('TASKS_BP_CHECK_LIST_NAME_LENGTH_ERROR', ['#LIMIT#' => (string)$maxItemLength])
	);

	// the only channel telling the server what a row is (TPL-01): the position of a row decides,
	// never its text, so every row of the field carries its kind next to its value
	$renderKind = static fn(string $kind): string => sprintf(
		'<input type="hidden" name="%s[]" value="%s">',
		htmlspecialcharsbx(CBPTask2Activity::CHECK_LIST_KINDS_FIELD),
		htmlspecialcharsbx($kind),
	);

	// what the wrapper adds around the row: the row itself belongs to the field type (TPL-02).
	// The name of the field is bound by the script instead of by a wrapping label: a label would take
	// in the selector button of the field type, and its value would be read as part of the name.
	$renderItem = static fn($index, $number, string $controlHtml): string => sprintf(
		'<div class="tasks-bp-check-list__item" data-role="tasks-check-list-item"'
		. ' data-testid="tasks-bp-check-list-item" data-index="%1$s" role="listitem">'
		. '%7$s'
		. '<div class="tasks-bp-check-list__item-control" data-testid="tasks-bp-check-list-item-input">'
		. '<span class="tasks-bp-check-list__visually-hidden" data-role="tasks-check-list-item-label"'
		. ' id="%6$s-item-label-%1$s">%2$s</span>'
		. '%3$s'
		. '</div>'
		. '<button type="button" class="tasks-bp-check-list__item-remove"'
		. ' data-role="tasks-check-list-item-remove" data-testid="tasks-bp-check-list-item-remove"'
		. ' aria-label="%4$s">'
		. '<span class="ui-icon-set --cross-m" aria-hidden="true"></span>'
		. '</button>'
		. '<div class="tasks-bp-check-list__item-error" data-role="tasks-check-list-item-error"'
		. ' data-testid="tasks-bp-check-list-item-error" role="alert"'
		. ' id="%6$s-item-error-%1$s" hidden>%5$s</div>'
		. '</div>',
		htmlspecialcharsbx((string)$index),
		htmlspecialcharsbx(GetMessage('TASKS_BP_CHECK_LIST_ITEM_LABEL', ['#NUM#' => (string)$number])),
		$controlHtml,
		htmlspecialcharsbx(GetMessage('TASKS_BP_CHECK_LIST_ITEM_DELETE', ['#NUM#' => (string)$number])),
		$lengthError,
		$checkListId,
		$renderKind(CBPTask2Activity::CHECK_LIST_ITEM_KIND),
	);

	// the row of the name is drawn by the very field type that draws a row of an item, so the name
	// gets the same naming scheme, the same escaping and the expression selector for free
	$renderName = static fn($index, $number, string $controlHtml): string => sprintf(
		'<div class="tasks-bp-check-list__name" data-role="tasks-check-list-name"'
		. ' data-testid="tasks-bp-check-list-name" data-index="%1$s">'
		. '%6$s'
		. '<div class="tasks-bp-check-list__item-control" data-testid="tasks-bp-check-list-name-input">'
		. '<span class="tasks-bp-check-list__visually-hidden" data-role="tasks-check-list-name-label"'
		. ' id="%5$s-name-label-%1$s">%2$s</span>'
		. '%3$s'
		. '</div>'
		. '<div class="tasks-bp-check-list__item-error" data-role="tasks-check-list-item-error"'
		. ' data-testid="tasks-bp-check-list-name-error" role="alert"'
		. ' id="%5$s-name-error-%1$s" hidden>%4$s</div>'
		. '</div>',
		htmlspecialcharsbx((string)$index),
		htmlspecialcharsbx(GetMessage('TASKS_BP_CHECK_LIST_NAME_LABEL', ['#NUM#' => (string)$number])),
		$controlHtml,
		$nameLengthError,
		$checkListId,
		$renderKind(CBPTask2Activity::CHECK_LIST_TITLE_KIND),
	);

	// the name of a block carries the title the user wrote, not only the position: ten blocks named
	// alike are told apart on the screen by their titles and have to be told apart by ear as well
	$blockLabel = static function ($number, string $title): string
	{
		$position = (string)GetMessage('TASKS_BP_CHECK_LIST_LABEL', ['#NUM#' => (string)$number]);
		// the title left as the control filled it in says the position again: the phrase compared
		// against is the very one that writes it, so no two phrases have to read alike
		$default = (string)Loc::getMessage('BPSA_CHECK_LIST_TITLE', ['#NUMBER#' => (string)$number]);
		if ($title === '' || $title === $default)
		{
			return $position;
		}

		return (string)GetMessage(
			'TASKS_BP_CHECK_LIST_LABEL_NAMED',
			['#NUM#' => (string)$number, '#NAME#' => $title],
		);
	};

	$renderBlock = static fn(
		$index,
		$number,
		string $title,
		string $nameHtml,
		string $itemsHtml,
		int $itemsCount
	): string => sprintf(
		'<div class="tasks-bp-check-list-block" data-role="tasks-check-list-block"'
		. ' data-testid="tasks-bp-check-list-block" data-index="%1$s" role="group" aria-label="%2$s">'
		. '<div class="tasks-bp-check-list-block__head">'
		. '<div class="tasks-bp-check-list-block__name" data-role="tasks-check-list-name-slot">%3$s</div>'
		. '<button type="button" class="tasks-bp-check-list-block__name-add"'
		. ' data-role="tasks-check-list-name-add" data-testid="tasks-bp-check-list-name-add"%4$s>%5$s</button>'
		. '<button type="button" class="tasks-bp-check-list-block__remove"'
		. ' data-role="tasks-check-list-block-remove" data-testid="tasks-bp-check-list-block-remove"'
		. ' aria-label="%6$s">'
		. '<span class="ui-icon-set --cross-m" aria-hidden="true"></span>'
		. '</button>'
		. '</div>'
		. '<div class="tasks-bp-check-list__items" data-role="tasks-check-list-items"'
		. ' data-testid="tasks-bp-check-list-items" role="list">%7$s</div>'
		. '<div class="tasks-bp-check-list__empty" data-role="tasks-check-list-empty"'
		. ' data-testid="tasks-bp-check-list-empty"%8$s>%9$s</div>'
		. '<div class="tasks-bp-check-list__footer" data-role="tasks-check-list-footer"'
		. ' data-testid="tasks-bp-check-list-footer">'
		. '<button type="button" class="tasks-bp-check-list__add" data-role="tasks-check-list-add"'
		. ' data-testid="tasks-bp-check-list-add"'
		. ' aria-describedby="%10$s-counter-%1$s %10$s-limit-note-%1$s"%11$s>%12$s</button>'
		// the counter and the note are filled by the control: the server does not know whether the
		// panel locked the settings, and the wording of both depends on that
		. '<span class="tasks-bp-check-list__counter" data-role="tasks-check-list-counter"'
		. ' data-testid="tasks-bp-check-list-counter" id="%10$s-counter-%1$s"></span>'
		. '<span class="tasks-bp-check-list__visually-hidden" data-role="tasks-check-list-limit-note"'
		. ' data-testid="tasks-bp-check-list-limit-note" id="%10$s-limit-note-%1$s"></span>'
		. '</div>'
		. '</div>',
		htmlspecialcharsbx((string)$index),
		htmlspecialcharsbx($blockLabel($number, $title)),
		$nameHtml,
		$nameHtml === '' ? '' : ' hidden',
		htmlspecialcharsbx(GetMessage('TASKS_BP_CHECK_LIST_NAME_ACTION')),
		htmlspecialcharsbx(GetMessage('TASKS_BP_CHECK_LIST_DELETE_LIST', ['#NUM#' => (string)$number])),
		$itemsHtml,
		$itemsCount > 0 ? ' hidden' : '',
		htmlspecialcharsbx(GetMessage('TASKS_BP_CHECK_LIST_EMPTY')),
		$checkListId,
		$itemsCount >= $maxItemsCount ? ' aria-disabled="true"' : '',
		htmlspecialcharsbx(GetMessage('TASKS_BP_CHECK_LIST_ADD_ITEM')),
	);

	// the dialog shows exactly what the activity takes for the text of an item, down to the item
	// composed of an array: a row dropped here would be lost on the next save without a word
	$blocks = $readCheckListBlocks($field);

	// one running number over blocks and rows alike: it names the control the field type prints, and
	// a number handed out twice would give two of them the same id
	$nextIndex = 0;
	$blocksHtml = '';
	foreach ($blocks as $position => $block)
	{
		$blockIndex = $nextIndex++;
		// the row of the name is there when, and only when, the block has one: drawing it for a block
		// that had none would write a heading into the value of a template nobody edited
		$nameHtml = $block['hasTitle']
			? $renderName($blockIndex, $position + 1, $renderRowControl($blockIndex, $block['title']))
			: ''
		;

		$itemsHtml = '';
		foreach ($block['items'] as $itemPosition => $item)
		{
			$itemIndex = $nextIndex++;
			$itemsHtml .= $renderItem($itemIndex, $itemPosition + 1, $renderRowControl($itemIndex, $item));
		}

		$blocksHtml .= $renderBlock(
			$blockIndex,
			$position + 1,
			$block['hasTitle'] ? trim((string)$block['title']) : '',
			$nameHtml,
			$itemsHtml,
			count($block['items']),
		);
	}

	// the field is declared without `Required` (see the map of the activity), so its name carries no
	// `adm-required-field` mark that the shared $renderField prints for a required field
	echo sprintf(
		// the visible caption lies in a cell of its own, so the field is named by pointing at it: the
		// field is a composite one, and without a border of its own its blocks belong to nothing
		'<tr><td align="right" width="40%%" id="%1$s-label">%2$s:</td><td width="60%%">%3$s</td></tr>',
		$checkListId,
		htmlspecialcharsbx($field['Name']),
		sprintf(
			'<div class="tasks-bp-check-list" id="%1$s" data-role="tasks-check-list"'
			. ' data-testid="tasks-bp-check-list" role="group" aria-labelledby="%1$s-label">'
			. '<div class="tasks-bp-check-list__blocks" data-role="tasks-check-list-blocks"'
			. ' data-testid="tasks-bp-check-list-blocks">%2$s</div>'
			. '<div class="tasks-bp-check-list__actions">'
			. '<button type="button" class="tasks-bp-check-list__add tasks-bp-check-list__add-block"'
			. ' data-role="tasks-check-list-block-add" data-testid="tasks-bp-check-list-block-add"'
			. ' aria-describedby="%1$s-blocks-limit-note"%3$s>%4$s</button>'
			. '<span class="tasks-bp-check-list__visually-hidden"'
			. ' data-role="tasks-check-list-blocks-limit-note"'
			. ' data-testid="tasks-bp-check-list-blocks-limit-note"'
			. ' id="%1$s-blocks-limit-note"></span>'
			. '</div>'
			// the samples are kept inside <template>: their content stays out of form.elements.
			// None of them holds another: the index is substituted over the whole markup of a sample,
			// and a nested one would come out with a number baked in instead of the placeholder
			. '<template data-role="tasks-check-list-item-template">%5$s</template>'
			. '<template data-role="tasks-check-list-block-template">%6$s</template>'
			. '<template data-role="tasks-check-list-name-template">%7$s</template>'
			. '</div>',
			$checkListId,
			$blocksHtml,
			count($blocks) >= $maxListsCount ? ' aria-disabled="true"' : '',
			htmlspecialcharsbx(GetMessage('TASKS_BP_CHECK_LIST_ADD_LIST')),
			$renderItem(
				$checkListIndexPlaceholder,
				$checkListIndexPlaceholder,
				$renderRowControl($checkListIndexPlaceholder, null),
			),
			$renderBlock(
				$checkListIndexPlaceholder,
				$checkListIndexPlaceholder,
				'',
				$renderName(
					$checkListIndexPlaceholder,
					$checkListIndexPlaceholder,
					$renderRowControl($checkListIndexPlaceholder, null),
				),
				'',
				0,
			),
			$renderName(
				$checkListIndexPlaceholder,
				$checkListIndexPlaceholder,
				$renderRowControl($checkListIndexPlaceholder, null),
			),
		),
	);
};

$renderField($map['HoldToClose']);
if ($dialog->getDocumentType()[0] === 'tasks')
{
	$renderField($map['AsChildTask']);
}

foreach ($taskFieldsMap as $fieldId => $fieldValue)
{
	if (
		(($fieldValue['UserField']['USER_TYPE']['USER_TYPE_ID'] ?? null) === 'crm')
		&& CModule::IncludeModule('crm')
	)
	{
		$renderField($map['AUTO_LINK_TO_CRM_ENTITY']);
	}
	$renderDocumentField($fieldValue);

	if ($fieldId === 'ALLOW_TIME_TRACKING')
	{
		$renderField($map['TimeEstimateHour']);
		$renderField($map['TimeEstimateMin']);
	}
}
$renderCheckListField($map['CheckListItems']);

echo $GLOBALS["APPLICATION"]->GetCSS();

$flowId = (int)($currentValues['Fields']['FLOW_ID'] ?? 0);

// Preloading fields for all types of distribution
$fieldsMap = [];
foreach (FlowDistributionType::cases() as $distributionType)
{
	$provider = (new FlowDistributionServicesFactory($distributionType))->getFieldsProvider();
	$fieldsMap[$distributionType->value] = $provider->getModifiedFields();
}

$flowDistributionMap = CBPTask2Activity::getFlowDistributionMap();

?>
<script>
	BX.message({
		TASKS_BP_FLOW_CONTROLLED_VALUE: '<?=GetMessageJS('TASKS_BP_FLOW_CONTROLLED_VALUE')?>',
		TASKS_BP_CHECK_LIST_COUNTER: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_COUNTER')?>',
		TASKS_BP_CHECK_LIST_COUNTER_READ_ONLY: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_COUNTER_READ_ONLY')?>',
		TASKS_BP_CHECK_LIST_ITEM_LABEL: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_ITEM_LABEL')?>',
		TASKS_BP_CHECK_LIST_ITEM_DELETE: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_ITEM_DELETE')?>',
		TASKS_BP_CHECK_LIST_ITEM_ADDED: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_ITEM_ADDED')?>',
		TASKS_BP_CHECK_LIST_ITEM_REMOVED: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_ITEM_REMOVED')?>',
		TASKS_BP_CHECK_LIST_LIMIT_REACHED: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_LIMIT_REACHED')?>',
		TASKS_BP_CHECK_LIST_LABEL: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_LABEL')?>',
		TASKS_BP_CHECK_LIST_LABEL_NAMED: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_LABEL_NAMED')?>',
		TASKS_BP_CHECK_LIST_DELETE_LIST: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_DELETE_LIST')?>',
		TASKS_BP_CHECK_LIST_NAME_LABEL: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_NAME_LABEL')?>',
		TASKS_BP_CHECK_LIST_ADDED: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_ADDED')?>',
		TASKS_BP_CHECK_LIST_REMOVED: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_REMOVED')?>',
		TASKS_BP_CHECK_LIST_NAME_ADDED: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_NAME_ADDED')?>',
		TASKS_BP_CHECK_LIST_COUNT_LIMIT_REACHED: '<?=GetMessageJS('TASKS_BP_CHECK_LIST_COUNT_LIMIT_REACHED')?>',
		// the default name has one source with the title the activity gives a root on execution;
		// the phrase belongs to the activity file, whose lang the map of the dialog has already loaded
		BPSA_CHECK_LIST_TITLE: '<?=CUtil::JSEscape(Loc::getMessage('BPSA_CHECK_LIST_TITLE'))?>',
	})
	BX.Event.ready(function()
	{
		new BX.Tasks.Automation.Activity.Task2Activity({
			isRobot: false,
			flowModifiedFieldsMap: <?=Json::encode($fieldsMap)?>,
			flowDistributionMap: <?=Json::encode($flowDistributionMap)?>,
			selectedFlowId: <?=$flowId?>,
		});

		new BX.Tasks.Automation.Activity.CheckListControl({
			container: document.getElementById('<?=CUtil::JSEscape($checkListId)?>'),
			itemIndexPlaceholder: '<?=CUtil::JSEscape($checkListIndexPlaceholder)?>',
			maxItemsCount: <?=CBPTask2Activity::CHECK_LIST_ITEMS_MAX_COUNT?>,
			maxItemLength: <?=CBPTask2Activity::CHECK_LIST_ITEM_MAX_LENGTH?>,
			maxListsCount: <?=CBPTask2Activity::CHECK_LISTS_MAX_COUNT?>,
		});
	});
</script>