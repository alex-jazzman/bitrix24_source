<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

global $APPLICATION;

$bodyClass = $APPLICATION->GetPageProperty("BodyClass");
$APPLICATION->SetPageProperty("BodyClass", ($bodyClass ? $bodyClass." " : "")." list-el-cg__slider");

\Bitrix\Main\Page\Asset::getInstance()->addJs('/bitrix/js/iblock/iblock_edit.js');

\Bitrix\Main\UI\Extension::load([
	'lists',
	'date',
	'main.date',
	'ui.alerts',
	'ui.buttons',
	'ui.icon-set.main',
	'ui.icon-set.actions',
	'ui.forms',
	'ui.tooltip',
	"ui.dialogs.messagebox",
	'ui.icons.b24',
	'ui.a11y',
	// bizproc is optional for this component: Extension::load() skips an extension of a disabled module
	'bizproc.a11y',
]);

$htmlId = 'lists-element-creation-guide';

/** @var array $arResult */
$info = $arResult['iBlockInfo'];
/** @var \Bitrix\Lists\UI\Fields\Field[] $fields */
$fields = $arResult['fields'];
$data = $arResult['elementData'];

$isBpEnabled = \Bitrix\Main\Loader::includeModule('bizproc');

$statesOnStartUp = $isBpEnabled ? $arResult['bizproc']['statesOnStartUp'] : [];
$statesToTuning = $isBpEnabled ? $arResult['bizproc']['statesToTuning'] : [];
$canUserTuningStates = $isBpEnabled ? $arResult['bizproc']['canUserTuningStates'] : true;

$canShowFields = !$statesToTuning || $canUserTuningStates;
$hasFieldsToShow = $fields || $statesOnStartUp;

$tabElement = [];
$tabSection = [];
$tabStatesOnStartUp = [];
$templateIds = [];
if ($canShowFields)
{
	if (isset($fields['IBLOCK_SECTION_ID']))
	{
		$sectionField = $fields['IBLOCK_SECTION_ID'];
		$tabSection = [
			'formId' => 'lists_element_creation_guide_section',
			'id' => 'tab_section',
			'name' => Loc::getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_SECTION_SECTION_TITLE'),
			'fields' => [[
				'id' => 'IBLOCK_SECTION_ID',
				'name' => $sectionField->getName(),
				'type' => 'list',
				'items' => $sectionField->getProperty()['ENUM_VALUES'],
				'params' => ['size' => 15],
			]],
			'data' => [],
		];

		unset($fields['IBLOCK_SECTION_ID']);
	}

	$elementFields = [];
	foreach ($fields as $field)
	{
		$property = $field->getProperty();
		$property['ELEMENT_ID'] = 0;
		$property['VALUE'] = $data[$field->getId()];
		$property['LIST_ELEMENT_URL'] = ''; // todo
		$property['COPY_ID'] = 0;
		$preparedData = \Bitrix\Lists\Field::prepareFieldDataForEditForm($property);
		if ($preparedData)
		{
			$elementFields[] = $preparedData;
		}
	}
	if ($elementFields)
	{
		$tabElement = [
			'formId' => 'lists_element_creation_guide_element',
			'id' => 'tab_element',
			'name' => Loc::getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_MAIN_SECTION_TITLE'),
			'fields' => $elementFields,
			'data' => $data,
		];
	}

	if ($statesOnStartUp)
	{
		$documentService = CBPRuntime::getRuntime()->getDocumentService();
		foreach ($statesOnStartUp as $state)
		{
			$templateIds[$state['templateId']] = true;

			$parameters = [];
			foreach ($state['fields'] as $parameterId => $property)
			{
				$parameterKey = 'bizproc' . $state['templateId'] . '_' . $parameterId;
				$parameters[] = [
					'id' => $parameterKey,
					'name' => $property['Name'],
					'required' => CBPHelper::getBool($property['Required']) === true,
					'type' => 'custom',
					'value' => $documentService->getFieldInputControl(
						$arResult['bizproc']['parameterDocumentType'],
						$property,
						['Field' => $parameterKey],
						$property['Default'] ?? null,
						false,
						true
					),
					'show' => 'Y',
				];
			}

			$tabStatesOnStartUp[] = [
				'id' => 'tab_bp_' . $state['templateId'],
				'name' => $state['name'],
				'formId' => 'lists_element_creation_guide_bp_' . $state['templateId'],
				'fields' => $parameters,
				'templateId' => $state['templateId'],
			];
		}
	}
}

$tabStatesToTuning = [];
if ($statesToTuning && $canUserTuningStates)
{
	$documentService = CBPRuntime::getRuntime()->getDocumentService();
	foreach ($statesToTuning as $state)
	{
		$templateId = $state['templateId'];
		$templateIds[$templateId] = true;

		$constants = [];
		foreach ($state['fields'] as $constantId => $property)
		{
			$constantKey = 'bizproc' . $templateId . '_' . $constantId;
			$constants[] = [
				'id' => $constantKey,
				'name' => $property['Name'],
				'required' => CBPHelper::getBool($property['Required']) === true,
				'type' => 'custom',
				'value' => $documentService->getFieldInputControl(
					$arResult['bizproc']['parameterDocumentType'],
					$property,
					['Field' => $constantKey],
					$property['Default'] ?? null,
					false,
					true
				),
				'show' => 'Y',
			];
		}

		$tabStatesToTuning[] = [
			'id' => 'tab_bp_constants_' . $templateId,
			'name' => $state['name'],
			'formId' => 'lists_element_creation_guide_bp_constants_' . $templateId,
			'fields' => $constants,
			'templateId' => $templateId,
		];
	}
}

$processTitle = trim((string)$info['name']);

// a form title equal to the visible title of the process would be voiced twice, so it stays out of the tree
$renderFormTitle = static function(?string $title) use ($processTitle): string {
	$title = (string)$title;
	$a11yAttributes = trim($title) === $processTitle
		? 'aria-hidden="true"'
		: 'role="heading" aria-level="3"'
	;

	return '<div class="list-el-cg__content-form-title" ' . $a11yAttributes . '>'
		. htmlspecialcharsbx($title)
		. '</div>'
	;
};

$includeFormComponent = static function(array $tab) {
	global $APPLICATION;

	$APPLICATION->IncludeComponent(
	'bitrix:main.interface.form',
	'',
	[
		'FORM_ID' => $tab['formId'],
		'TABS' => [[
			'id' => $tab['id'],
			'name' => htmlspecialcharsbx($tab['name']),
			'fields' => $tab['fields'] ?? [],
		]],
		'DATA' => $tab['data'] ?? [],
		'SHOW_SETTINGS' => false,
	]
	);
};
?>

<div class="list-el-cg" data-testid="<?= htmlspecialcharsbx($htmlId) ?>">
	<div class="list-el-cg__header">
		<div class="list-el-cg__header-icon">
			<div class="ui-icon-set --business-process-1" style="--ui-icon-set__icon-size: 48px; --ui-icon-set__icon-color: #fff;"></div>
		</div>
		<div class="list-el-cg__header-content">
			<div class="list-el-cg__header__title" role="heading" aria-level="1"><?= htmlspecialcharsbx(Loc::getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_TITLE')) ?></div>
			<div class="list-el-cg__header__info"><?= htmlspecialcharsbx(Loc::getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_DESCRIPTION')) ?></div>
		</div>
	</div>
	<div class="list-el-cg__body">
		<div
			class="list-el-cg__breadcrumbs"
			id="<?= htmlspecialcharsbx($htmlId . '-breadcrumbs') ?>"
			data-testid="<?= htmlspecialcharsbx($htmlId . '-steps') ?>"
		></div>
		<div class="list-el-cg__container" id="<?= htmlspecialcharsbx($htmlId . '-container') ?>">
			<div class="list-el-cg__content">
				<div class="list-el-cg__content-head">
					<div class="list-el-cg__content-title" role="heading" aria-level="2"><?= htmlspecialcharsbx($info['name']) ?></div>
					<div class="list-el-cg__content-config" data-role="list-el-cg__content-config" style="display: none">
						<div class="ui-icon-set --settings-4"></div>
					</div>
				</div>
				<div
					id="<?= htmlspecialcharsbx($htmlId . '-errors') ?>"
					data-testid="<?= htmlspecialcharsbx($htmlId . '-errors') ?>"
				></div>
				<?php // the bundle picks the step containers by position (src/index.js, #fillSteps): the order is a contract ?>
				<div
					class="list-el-cg__content-body --border"
					data-testid="<?= htmlspecialcharsbx($htmlId . '-step-content-description') ?>"
				></div>
				<div
					class="list-el-cg__content-body --border --hidden"
					data-testid="<?= htmlspecialcharsbx($htmlId . '-step-content-constants') ?>"
				>
					<?php if ($statesToTuning): ?>
						<?php if ($canUserTuningStates): ?>
							<?php foreach ($tabStatesToTuning as $tab): ?>
								<div
									class="list-el-cg__content-form"
									data-testid="<?= htmlspecialcharsbx($htmlId . '-constants-form-' . $tab['templateId']) ?>"
								>
									<?= $renderFormTitle($tab['name']) ?>
									<?php $includeFormComponent($tab) ?>
									<div>
										<div
											id="<?= htmlspecialcharsbx($htmlId . '-constants-' . $tab['templateId'] . '-errors')?>"
											data-testid="<?= htmlspecialcharsbx($htmlId . '-constants-errors-' . $tab['templateId']) ?>"
										></div>
									</div>
								</div>
							<?php endforeach ?>
						<?php else: ?>
							<div class="ui-alert ui-alert-warning ui-alert-icon-info">
								<span class="ui-alert-message"><?= htmlspecialcharsbx(Loc::getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_NOT_TUNING_CONSTANTS')) ?></span>
							</div>
						<?php endif ?>
					<?php endif ?>
				</div>
				<div
					class="list-el-cg__content-body --border --hidden"
					data-testid="<?= htmlspecialcharsbx($htmlId . '-step-content-fields') ?>"
				>
					<?php if ($tabElement): ?>
						<div
							class="list-el-cg__content-form"
							data-testid="<?= htmlspecialcharsbx($htmlId . '-element-form') ?>"
						>
							<?= $renderFormTitle(Loc::getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_MAIN_SECTION_TITLE')) ?>
							<?php $includeFormComponent($tabElement) ?>
						</div>
					<?php endif; ?>
					<?php if ($tabSection): ?>
						<div
							class="list-el-cg__content-form"
							data-testid="<?= htmlspecialcharsbx($htmlId . '-section-form') ?>"
						>
							<?= $renderFormTitle(Loc::getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_SECTION_SECTION_TITLE')) ?>
							<?php $includeFormComponent($tabSection) ?>
						</div>
					<?php endif ?>
					<?php foreach ($tabStatesOnStartUp as $tab): ?>
						<div
							class="list-el-cg__content-form"
							data-testid="<?= htmlspecialcharsbx($htmlId . '-parameters-form-' . $tab['templateId']) ?>"
						>
							<?= $renderFormTitle($tab['name']) ?>
							<?php $includeFormComponent($tab); ?>
						</div>
					<?php endforeach ?>
				</div>
				<div
					class="list-el-cg__content-body --border --hidden"
					data-testid="<?= htmlspecialcharsbx($htmlId . '-step-content-status') ?>"
				></div>
			</div>
		</div>
	</div>
</div>

<?php $APPLICATION->IncludeComponent(
	'bitrix:ui.button.panel',
	'',
	[
		'ID' => $htmlId . '-buttons',
		'STICKY_CONTAINER' => '#' . $htmlId . '-sticky-buttons',
		'BUTTONS' => [
			[
				'ID' => $htmlId . '-back-button',
				'TYPE' => 'button',
				'CAPTION' => Loc::getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_BUTTON_BACK'),
				'ONCLICK' => 'BX.Lists.Component.ElementCreationGuide.Instance.back()',
			],
			[
				'ID' => $htmlId . '-next-button',
				'TYPE' => 'apply',
				'CAPTION' => Loc::getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_BUTTON_NEXT'),
				'ONCLICK' => 'BX.Lists.Component.ElementCreationGuide.Instance.next()',
			],
			[
				'ID' => $htmlId . '-create-button',
				'TYPE' => 'apply',
				'CAPTION' => Loc::getMessage('LISTS_ELEMENT_CREATION_GUIDE_CMP_BUTTON_CREATE'),
				'ONCLICK' => 'BX.Lists.Component.ElementCreationGuide.Instance.create()',
			],
		],
	],
) ?>
<div id="<?= $htmlId . '-sticky-buttons' ?>"></div>
<div class="list-el-cg-background"></div>

<script>
	BX.Event.ready(() => {
		BX.message(<?= Json::encode(Loc::loadLanguageFile(__FILE__)) ?>);

		BX.Lists.Component.ElementCreationGuide.Instance = new BX.Lists.Component.ElementCreationGuide(
			<?= Json::encode([
				'name' => trim((string)$info['name']),
				'description' => trim((string)$info['description']),
				'duration' => $arResult['bizproc']['averageDuration'] ?? null,
				'signedParameters' => $arResult['signedParameters'],
				'bpTemplateIds' => array_keys($templateIds),
				'hasFieldsToShow' => $hasFieldsToShow,
				'hasStatesToTuning' => (bool)$statesToTuning,
				'canUserTuningStates' => $canUserTuningStates,
				'iBlockId' => $arResult['iBlockId'],
			]) ?>
		);

		document.querySelectorAll('.bx-edit-tabs').forEach((element) => {
			BX.Dom.remove(element);
		})
		document.querySelectorAll('.bx-form-notes').forEach((element) => {
			BX.Dom.remove(element);
		});
	});
</script>
