<?php

use Bitrix\Crm\AutomatedSolution\CapabilityAccessChecker;
use Bitrix\Crm\Tour\AutomatedSolution\CustomSectionMenu;
use Bitrix\Crm\Tour\AutomatedSolution\LeftMenu;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load(
	[
		'ui.dialogs.messagebox',
		'ui.alerts',
	]
);

$bodyClass = $APPLICATION->GetPageProperty("BodyClass");
$APPLICATION->SetPageProperty("BodyClass", ($bodyClass ? $bodyClass." " : "") . "no-all-paddings no-hidden no-background");
if($this->getComponent()->getErrors())
{
	foreach($this->getComponent()->getErrors() as $error)
	{
		/** @var \Bitrix\Main\Error $error */
		?>
		<div class="ui-alert ui-alert-danger">
			<span class="ui-alert-message"><?=$error->getMessage();?></span>
		</div>
		<?php
	}

	return;
}
/** @see \Bitrix\Crm\Component\Base::addTopPanel() */
$this->getComponent()->addTopPanel($this);

/** @see \Bitrix\Crm\Component\Base::addToolbar() */
$this->getComponent()->addToolbar($this);
?>

<div class="ui-alert ui-alert-danger" style="display: none;">
	<span class="ui-alert-message" id="crm-type-item-list-error-text-container"></span>
	<span class="ui-alert-close-btn" onclick="this.parentNode.style.display = 'none';"></span>
</div>

<?php

$headerSections = [
	[
		'id'=> $arResult['entityTypeName'],
		'name' => $arResult['entityTypeDescription'],
		'default' => true,
		'selected' => true,
	],
];

$isImportedAutomatedSolution = $arResult['isImportedAutomatedSolution'] ?? false;
$entityTypeId = CCrmOwnerType::ResolveID($arResult['entityTypeName']);
$isLocked = $isImportedAutomatedSolution && CapabilityAccessChecker::getInstance()->isLockedEntityType($entityTypeId);

$APPLICATION->IncludeComponent(
	'bitrix:crm.kanban',
	'',
	[
		'ENTITY_TYPE' => $arResult['entityTypeName'],
		'SHOW_ACTIVITY' => $arResult['isCountersEnabled'] ? 'Y' : 'N',
		'EXTRA' => [
			'CATEGORY_ID' => $arResult['categoryId'],
			'ADD_ITEM_PERMITTED_BY_TARIFF' => $arResult['addItemPermittedByTariff'],
			'ANALYTICS' => $arResult['analytics'] ?? [],
		],
		'HEADERS_SECTIONS' => $headerSections,
		'PERFORMANCE' => $arResult['performance'],
		'PATH_TO_MERGE' => $arResult['pathToMerge'],
		'IS_LOCKED_ENTITY' => $isLocked ? 'Y' : 'N',
	],
	$component
);

if ($arResult['customSectionId'] > 0)
{
	echo (\Bitrix\Crm\Tour\MobilePromoter\MobilePromoterCustomSection::getInstance()->setCustomSection($arResult['customSectionId'])->build());

	if (($arResult['isImportedAutomatedSolution'] ?? false) === true)
	{
		$APPLICATION->IncludeComponent(
			'bitrix:crm.automated_solution.notify',
			'',
		);

		$targetId = $arResult['automatedSolutionCode'] ?? null;
		if ($targetId)
		{
			$targetId = 'menu_custom_section_' . $targetId;

			print CustomSectionMenu::getInstance()->setTargetId($targetId)->build();
			print LeftMenu::getInstance()->setTargetId('bx_left_menu_' . $targetId)->build();
		}
	}
}
