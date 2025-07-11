<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Application;
use Bitrix\Main\IO\File;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Buttons;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

/** @global CMain $APPLICATION */
/** @var CatalogStoreDocumentDetailComponent $component */
/** @var array $arResult */
/** @var array $arParams */
/** @var string $templateFolder */

Loader::includeModule('ui');

global $APPLICATION;

if (isset($arResult['DOCUMENT']['TITLE']))
{
	$APPLICATION->SetTitle($arResult['DOCUMENT']['TITLE']);
}
elseif (empty($arResult['DOCUMENT']) && empty($arResult['ERROR_MESSAGES']))
{
	$APPLICATION->SetTitle(Loc::getMessage('DOC_TYPE_CREATION_PAGE_TITLE_' . $arResult['DOCUMENT_TYPE']));
}

Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.alerts',
	'ui.entity-selector',
	'catalog.document-card',
	'catalog.entity-card',
	'catalog.document-model',
]);

$bodyClass = $APPLICATION->GetPageProperty("BodyClass");
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass.' ' : '').'no-background');

if (!empty($arResult['ERROR_MESSAGES']) && is_array($arResult['ERROR_MESSAGES']))
{
	if (is_array($arResult['ERROR_MESSAGES'][0]))
	{
		$APPLICATION->IncludeComponent(
			'bitrix:ui.info.error',
			'',
			$arResult['ERROR_MESSAGES'][0]
		);
	}
	else
	{
		$APPLICATION->IncludeComponent(
			'bitrix:ui.info.error',
			'',
			[
				'TITLE' => $arResult['ERROR_MESSAGES'][0],
			],
		);
	}

	return;
}

Toolbar::deleteFavoriteStar();
Toolbar::enableMultiLineTitle();

$insidePageTitleConfig = [
	'enableEditTitle' => false,
	'enablePageLink' => false,
	'enableStatusLabel' => false,
	'statusLabel' => [
		'text' => '',
		'color' => '',
	],
];
$documentId = (int)($arResult['DOCUMENT']['ID'] ?? 0);
if ($documentId > 0)
{
	$labelColorClass = 'ui-label-light';
	$isDocumentCancelled = $arResult['DOCUMENT']['WAS_CANCELLED'] === 'Y' && $arResult['DOCUMENT']['STATUS'] === 'N';
	if ($isDocumentCancelled)
	{
		$labelColorClass = 'ui-label-lightorange';
	}
	elseif ($arResult['DOCUMENT']['STATUS'] === 'Y')
	{
		$labelColorClass = 'ui-label-lightgreen';
	}

	if ($isDocumentCancelled)
	{
		$labelText = Loc::getMessage('DOCUMENT_STATUS_CANCELLED');
	}
	else
	{
		$labelText = Loc::getMessage('DOCUMENT_STATUS_' . $arResult['DOCUMENT']['STATUS']);
	}

	$insidePageTitleConfig['enableEditTitle'] = !$arResult['IS_MAIN_CARD_READ_ONLY'];
	$insidePageTitleConfig['enablePageLink'] = true;
	$insidePageTitleConfig['enableStatusLabel'] = true;
	$insidePageTitleConfig['statusLabel']['text'] = $labelText;
	$insidePageTitleConfig['statusLabel']['color'] = $labelColorClass;

	$underText =
		'<div class="catalog-title-document-type">'
		. Loc::getMessage('DOC_TYPE_SHORT_' . $arResult['DOCUMENT_TYPE'])
		. '</div>'
	;
	Toolbar::addUnderTitleHtml($underText);
	unset($underText);
}
elseif (!empty($arResult['DROPDOWN_TYPES']))
{
	$dropDownTypes =
		'<div id="catalog-document-type-selector" class="catalog-document-type-selector">'
		. '<span class="catalog-document-type-selector-text" data-hint="" data-hint-no-icon>'
		. Loc::getMessage(
			'DOCUMENT_TYPE_DROPDOWN',
			[
				'#TYPE#' => Loc::getMessage('DOC_TYPE_SHORT_' . $arResult['DOCUMENT_TYPE']),
			]
		)
		. '</span>'
		.'</div>'
	;
	Toolbar::addUnderTitleHtml($dropDownTypes);
	unset($dropDownTypes);
}

if (is_array($arResult['CRM_DOCUMENT_BUTTON_CONFIG']))
{
	$documentButton = new Buttons\DocumentButton();
	$documentButton->setDocumentButtonConfig($arResult['CRM_DOCUMENT_BUTTON_CONFIG']);
	Toolbar::addButton($documentButton, ButtonLocation::RIGHT);
}

$feedBackButton = new Buttons\FeedbackButton([
	'highlight' => $documentId <= 0,
	'click' => new Buttons\JsCode('BX.Catalog.DocumentCard.Slider.openFeedbackForm();'),
]);
Toolbar::addButton($feedBackButton, ButtonLocation::RIGHT);

$tabs = [
	[
		'id' => 'main',
		'name' => Loc::getMessage('TAB_GENERAL_TITLE'),
		'enabled' => true,
		'active' => true,
	],
	[
		'id' => 'tab_products',
		'name' => Loc::getMessage('TAB_PRODUCT_TITLE'),
		'enabled' => true,
		'active' => false,
	],
];

$guid = $arResult['GUID'];
$containerId = "{$guid}_CONTAINER";
$tabMenuContainerId = "{$guid}_TABS_MENU";
$tabContainerId = "{$guid}_TABS";

$tabContainerClassName = 'catalog-entity-section catalog-entity-section-tabs';
$tabContainerClassName .= ' ui-entity-stream-section-planned-above-overlay';
$wrapperClassNames = ['catalog-wrapper'];
$wrapperClassNames[] = $arResult['INCLUDE_CRM_ENTITY_EDITOR'] ? 'catalog-entity-wrap-crm' : 'catalog-entity-wrap';
?>

<div id="<?=htmlspecialcharsbx($containerId)?>" class="<?=implode(' ', $wrapperClassNames);?>">
	<div class="<?=$tabContainerClassName?>">
		<ul id="<?=htmlspecialcharsbx($tabMenuContainerId)?>" class="catalog-entity-section-tabs-container">
			<?php
			foreach ($tabs as $tab)
			{
				$classNames = ['catalog-entity-section-tab'];

				if (isset($tab['active']) && $tab['active'])
				{
					$classNames[] = 'catalog-entity-section-tab-current';
				}
				elseif (isset($tab['enabled']) && !$tab['enabled'])
				{
					$classNames[] = 'catalog-entity-section-tab-disabled';
				}
				?>
				<li data-tab-id="<?=htmlspecialcharsbx($tab['id'])?>" class="<?=implode(' ', $classNames)?>">
					<a class="catalog-entity-section-tab-link" href="#"><?=htmlspecialcharsbx($tab['name'])?></a>
				</li>
				<?php
			}
			?>
		</ul>
	</div>
	<div id="<?=htmlspecialcharsbx($tabContainerId)?>" style="position: relative;">
		<?php
		foreach ($tabs as $tab)
		{
			$tabId = $tab['id'];
			$className = 'catalog-entity-section catalog-entity-section-info';
			$style = '';

			if ($tab['active'] !== true)
			{
				$className .= ' catalog-entity-section-tab-content-hide catalog-entity-section-above-overlay';
				$style = 'style="display: none;"';
			}
			?>
			<div data-tab-id="<?=htmlspecialcharsbx($tabId)?>" class="<?=$className?>" <?=$style?>>
				<?php
				$tabFolderPath = Application::getDocumentRoot().$templateFolder.'/tabs/';
				$file = new File($tabFolderPath.$tabId.'.php');

				if ($file->isExists())
				{
					include $file->getPath();
				}
				else
				{
					echo "Unknown tab {{$tabId}}.";
				}
				?>
			</div>
			<?php
		}
		?>
	</div>
</div>

<script>
	BX.message(<?=Json::encode(Loc::loadLanguageFile(__FILE__))?>);

	BX.Catalog.DocumentCard.Instance = new BX.Catalog.DocumentCard.DocumentCard(
		'<?=CUtil::JSEscape($guid)?>',
		{
			entityId: '<?=CUtil::JSEscape($documentId)?>',
			documentType: '<?=CUtil::JSEscape($arResult['DOCUMENT_TYPE'])?>',
			documentStatus: '<?= CUtil::JSEscape($arResult['DOCUMENT']['STATUS'] ?? 'N') ?>',
			tabs: <?=CUtil::PhpToJSObject($tabs)?>,
			documentTypeSelector: document.getElementById('catalog-document-type-selector'),
			documentTypeSelectorTypes: <?= CUtil::PhpToJSObject($arResult['DROPDOWN_TYPES']) ?>,
			containerId: '<?=CUtil::JSEscape($containerId)?>',
			tabContainerId: '<?=CUtil::JSEscape($tabContainerId)?>',
			tabMenuContainerId: '<?=CUtil::JSEscape($tabMenuContainerId)?>',
			copyLinkButtonId: 'page_url_copy_btn',
			componentName: <?=CUtil::PhpToJSObject($this->getComponent()->getName()) ?>,
			signedParameters: <?=CUtil::PhpToJSObject($this->getComponent()->getSignedParameters()) ?>,
			isConductLocked: <?= ($arResult['IS_CONDUCT_LOCKED'] ? 'true' : 'false') ?>,
			masterSliderUrl: <?= CUtil::PhpToJSObject($arResult['MASTER_SLIDER_URL']) ?>,
			isInventoryManagementDisabled: <?= ($arResult['IS_INVENTORY_MANAGEMENT_DISABLED'] ? 'true' : 'false') ?>,
			inventoryManagementFeatureCode: <?= CUtil::PhpToJSObject($arResult['INVENTORY_MANAGEMENT_FEATURE_SLIDER_CODE']) ?>,
			inventoryManagementSource: <?= CUtil::PhpToJSObject($arResult['INVENTORY_MANAGEMENT_SOURCE']) ?>,
			lockedCancellation: <?= ($arResult['IS_PRODUCT_BATCH_METHOD_SELECTED'] ? 'true' : 'false') ?>,
			includeCrmEntityEditor: <?= ($arResult['INCLUDE_CRM_ENTITY_EDITOR'] ? 'true' : 'false') ?>,
			insidePageTitleConfig: <?= Json::encode($insidePageTitleConfig) ?>,
		}
	);

	BX.ready(function () {
		BX.Catalog.DocumentCard.Instance.adjustToolPanel();
		<?php /*if (isset($arResult['TOOLBAR_ID'])):?>
		BX.Catalog.DocumentCard.FeedbackButton.render(
			document.getElementById('<?=CUtil::JSEscape($arResult['TOOLBAR_ID'])?>'),
			<?=CUtil::JSEscape($documentId <= 0)?>
		);
		<?php endif; */ ?>

		<?php if (isset($arResult['FOCUSED_TAB'])): ?>
			const tabId = '<?=CUtil::JSEscape($arResult['FOCUSED_TAB'])?>';
			BX.Catalog.DocumentCard.Instance.focusOnTab(tabId);
		<?php endif; ?>
	});
</script>
