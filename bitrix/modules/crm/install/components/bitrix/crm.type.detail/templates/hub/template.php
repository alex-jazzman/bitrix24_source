<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CMain $APPLICATION */
/** @var array $arResult */
/** @var CBitrixComponentTemplate $this */

use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Settings\Crm;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/** @var CrmTypeDetailComponent $component */
$component = $this->getComponent();

if ($component->getErrors()): ?>
	<div class="ui-alert ui-alert-danger">
		<?php foreach ($component->getErrors() as $error): ?>
			<span class="ui-alert-message"><?= htmlspecialcharsbx($error->getMessage()) ?></span>
		<?php endforeach; ?>
	</div>
	<?php
	return;
endif;

// The designed layout paints the page surface itself (.crm-type-hub-container in style.css). The
// standalone host pads its white card by 15px, which would frame that surface in white; the slider
// host pads nothing, so this is a no-op there.
$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'no-all-paddings');

Extension::load([
	'crm.settings-hub',
	'ui.vue3',
	'ui.vue3.pinia',
	'ui.vue3.mixins.loc-mixin',
	'ui.entity-selector',
	'ui.system.checkbox',
	// Переключатель сценария — AIR-чипса. Держим и базовый экстеншн, и .vue-обёртку: namespace
	// создаёт базовый, из него же и берётся Vue-часть (см. relation-row.ts).
	'ui.system.chip',
	'ui.system.chip.vue',
	// Строка-конструктор раздела «Связи»: голубой блок с предложением и пользой, под ним миниатюра
	// карточки, на которой выбирают места (D-63). Скелетон миниатюры — BLine: у него своя сборка и
	// свой namespace, поэтому берётся из .vue, а не из родительского экстеншна. Полей с дропдаунами
	// больше нет (ушли ui.system.input и ui.system.menu), а вместе с tinted-плашкой ушёл и
	// ui.system.alert — предложение с пользой рисуются одним блоком.
	'ui.system.skeleton.vue',
	'ui.vue3.directives.hint',
	'crm.type-model',
	'crm.router',
	'crm.toolbar-component',
	'crm.dialog',
	'crm.integration.analytics',
	'ui.analytics',
	'ui.dialogs.messagebox',
	'ui.alerts',
	'ui.forms',
	'main.core',
	'main.core.events',
	'ui.info-helper',
	'ui.a11y',
	'ui.design-tokens',
	'ui.fonts.opensans',
]);

$component->addJsRouter($this);
$component->addToolbar($this);

$type = $component->getType();
$isNew = $type->getId() <= 0;
$activeTabId = $arResult['activeTabId'] ?? 'common';
$isExternal = (bool)($arResult['isExternal'] ?? false);

// activeTabId -> hub section, mirrored client-side in app.ts.
$sectionByTab = [
	'common' => 'main',
	'fields' => 'features',
	'relation' => 'relations',
	'user-fields' => 'relations',
	'custom-section' => 'main',
];
$activeSectionId = $isExternal ? 'main' : ($sectionByTab[$activeTabId] ?? 'main');

$sections = [
	['id' => 'main', 'name' => Loc::getMessage('CRM_TYPE_DETAIL_HUB_SECTION_MAIN')],
	['id' => 'features', 'name' => Loc::getMessage('CRM_TYPE_DETAIL_HUB_SECTION_FEATURES')],
	['id' => 'relations', 'name' => Loc::getMessage('CRM_TYPE_DETAIL_HUB_SECTION_RELATIONS')],
	['id' => 'products', 'name' => Loc::getMessage('CRM_TYPE_DETAIL_HUB_SECTION_PRODUCTS')],
	['id' => 'permissions', 'name' => Loc::getMessage('CRM_TYPE_DETAIL_HUB_SECTION_PERMISSIONS')],
];

// Recomposed hub tree (spec 2026-08-31, then the Figma of the wizard). Written as an override AFTER
// the author's own $sectionByTab and $sections instead of an edit inside them: this file is
// additive-only for us, so his literals above stay where they are even though nothing reads them
// any more. The module option that used to guard this block is gone — there is one hub now, and the
// old tree is not maintained (PM, 2026-09-01).
//
// Recomputed from $activeTabId, never translated from $activeSectionId: the prod "fields" tab used
// to open "Возможности", and its content now lives in "Карточка процесса", so a section-to-section
// translation would land it in "Движение процесса".
$newSectionByTab = [
	'common' => 'card',
	'fields' => 'card',
	'custom-section' => 'card',
	'relation' => 'relations',
	'user-fields' => 'relations',
];
$activeSectionId = $isExternal ? 'card' : ($newSectionByTab[$activeTabId] ?? 'card');

// The wizard mockup has no page title above the hub. addToolbar() has already appended its own class
// by now, so ours goes on top of it; style.css hides .page__toolbar under this one.
$hubBodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty(
	'BodyClass',
	($hubBodyClass ? $hubBodyClass . ' ' : '') . 'crm-type-hub-no-toolbar'
);

// Order and labels mirror HUB_TREE_SECTIONS in src/const/hub-tree.ts, which mirrors the Figma of the
// wizard: "Связи" third, "Автоматизация" fifth.
$sections = [
	['id' => 'card', 'name' => Loc::getMessage('CRM_TYPE_DETAIL_HUB_SECTION_CARD')],
	['id' => 'process', 'name' => Loc::getMessage('CRM_TYPE_DETAIL_HUB_SECTION_PROCESS')],
	['id' => 'relations', 'name' => Loc::getMessage('CRM_TYPE_DETAIL_HUB_SECTION_RELATIONS_V2')],
	['id' => 'products', 'name' => Loc::getMessage('CRM_TYPE_DETAIL_HUB_SECTION_PRODUCTS')],
	['id' => 'automation', 'name' => Loc::getMessage('CRM_TYPE_DETAIL_HUB_SECTION_AUTOMATION')],
	['id' => 'permissions', 'name' => Loc::getMessage('CRM_TYPE_DETAIL_HUB_SECTION_PERMISSIONS')],
];

$menuItems = [];
foreach ($sections as $section)
{
	$sectionId = \CUtil::JSEscape($section['id']);
	$isActiveSection = $activeSectionId === $section['id'];
	$showSection = "BX.Event.EventEmitter.emit('BX.Crm.TypeDetailHub:showSection', {sectionId: '{$sectionId}'});";

	// The wrappermenu draws every item as an <a> without href: it is neither a tab stop nor operable
	// from the keyboard on its own, so the button role, the tab stop and Enter/Space are added here.
	// The active item carries aria-current as well; app.ts::syncMenuHighlight moves it afterwards.
	$attributes = [
		'role' => 'button',
		'tabindex' => '0',
		'onclick' => $showSection,
		'onkeydown' => "if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); {$showSection} }",
		'data-role' => 'hub-section-' . $section['id'],
		'data-testid' => 'crm-type-detail-hub-menu-' . $section['id'],
	];
	if ($isActiveSection)
	{
		$attributes['aria-current'] = 'true';
	}

	$menuItems[] = [
		'NAME' => $section['name'],
		'ATTRIBUTES' => $attributes,
		'ACTIVE' => $isActiveSection,
	];
}

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrappermenu',
	'',
	[
		'ID' => 'crm-type-hub-sidebar',
		'TITLE' => Loc::getMessage('CRM_TYPE_DETAIL_TITLE'),
		'ITEMS' => $menuItems,
	],
	$this->getComponent()
);

// The creation flow opens the hub itself (class.php picks this template for a draft as well), and
// the hub opens it as a preview: the hero alone is live there. `$isNew` above is the plain
// "unsaved type" flag and already drives the save panel, the delete button and the switcher, so the
// preview gets a key of its own instead of riding on it. The feature is asked again rather than
// assumed from the template name: this template is what class.php serves under the flag, and a
// caller that names the template itself would otherwise get the preview with the flag switched off.
$isCreationPreview = $isNew && \Bitrix\Crm\Feature::enabled(\Bitrix\Crm\Feature\SmartProcessCrmHub::class);

$appParams = [
	'containerId' => 'crm-type-hub-app',
	'activeTabId' => $activeTabId,
	'isExternal' => $isExternal,
	'type' => $arResult['type'],
	'description' => $arResult['description'] ?? null,
	'daysBeforeClose' => $component->getDaysBeforeClose(),
	'relationsCatalog' => $arResult['relations'],
	'linkedUserFields' => $arResult['linkedUserFields'],
	'isCategoriesControlDisabled' => (bool)($arResult['isCategoriesControlDisabled'] ?? false),
	'categoriesCount' => (int)($arResult['categoriesCount'] ?? 0),
	'isRecyclebinControlDisabled' => (bool)($arResult['isRecyclebinControlDisabled'] ?? false),
	'isRestricted' => (bool)($arResult['isRestricted'] ?? false),
	'restrictionErrorMessage' => $arResult['restrictionErrorMessage'] ?? '',
	'restrictionSliderCode' => $arResult['restrictionSliderCode'] ?? null,
	'isCreateSectionsViaAutomatedSolutionDetails' => Crm::isAutomatedSolutionListEnabled(),
	'canEditAutomatedSolution' => (bool)($arResult['canEditAutomatedSolution'] ?? false),
	'canToggleAutomatedSolutionSwitcher' => (bool)($arResult['canToggleAutomatedSolutionSwitcher'] ?? false),
	'isCustomSectionsAvailable' => (bool)($arResult['isCustomSectionsAvailable'] ?? false),
	'isNew' => $isNew,
	'isCreationPreview' => $isCreationPreview,
	'permissionsUrl' => $arResult['permissionsUrl'] ?? null,
	'hubActionUrls' => (array)($arResult['hubActionUrls'] ?? []),
];
?>
<div id="crm-type-hub-app" class="crm-type-hub-container"></div>
<script>
	BX.ready(function() {
		<?= 'BX.message(' . \CUtil::PhpToJSObject(Loc::loadLanguageFile(__FILE__)) . ');' ?>
		<?= 'BX.message(' . \CUtil::PhpToJSObject(Container::getInstance()->getLocalization()->loadMessages()) . ');' ?>

		var app = new BX.Crm.TypeDetailHub.App(<?= Json::encode($appParams) ?>);
		app.start();
	});
</script>
