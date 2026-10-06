<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Landing\Help;
use Bitrix\Landing\Manager;
use Bitrix\Landing\Metrika\Sections;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\Text\HtmlFilter;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Web\Uri;
use Bitrix\UI;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

/** @var array $arParams */
/** @var array $arResult */
/** @var \CMain $APPLICATION */
/** @var CBitrixComponentTemplate $this */
/** @var LandingFilterComponent $component */

// init
Loc::loadMessages(__FILE__);
\CJSCore::init(array('sidepanel', 'action_dialog', 'loader'));
Extension::load([
	'ui.hint',
	'ui.icon-set.outline',
	'ui.toolbar',
]);

if ($arResult['FATAL'])
{
	return;
}

// some vars
$toolbarParams = [];
$isDeleted = $component::isDeleted();

$uriAjax = new \Bitrix\Main\Web\Uri($arResult['CUR_URI']);
$uriAjax->addParams(array(
	'IS_AJAX' => 'Y',
	$arResult['NAVIGATION_ID'] => $arResult['CURRENT_PAGE'],
));
$uriAjax->deleteParams([
	LandingBaseComponent::NAVIGATION_ID,
]);
$toolbarParams['landingAjaxPath'] = $uriAjax->getUri();

// title
$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'pagetitle-toolbar-field-view');
Asset::getInstance()->addJs($this->GetFolder() . '/script.js');

// template
$isBitrix24Template = false;
if (defined('SITE_TEMPLATE_ID'))
{
	$isBitrix24Template = SITE_TEMPLATE_ID === 'bitrix24';
}
?>

<?php
if (!$isBitrix24Template)
{
	Toolbar::hideTitle();
	$APPLICATION->IncludeComponent("bitrix:ui.toolbar", '', []);
}
?>

<?php
// CREATE BUTTON
if (isset($arParams['BUTTONS']) && is_array($arParams['BUTTONS']))
{
	$button = array_shift($arParams['BUTTONS']);
	if (isset($button['LINK'], $button['TITLE']))
	{
		$isPageDropdown = $arParams['TYPE'] === 'PAGE';
		$createButtonHasMenu = false;
		if ($isPageDropdown)
		{
			$button['TYPE'] = 'dropdown';
		}
		if ($isPageDropdown)
		{
			$createButton = new UI\Buttons\Button([
				'id' => 'landing-create-element',
				'text' => HtmlFilter::encode($button['TITLE']),
				'color' => UI\Buttons\Color::SUCCESS,
				'style' => UI\Buttons\AirButtonStyle::FILLED_SUCCESS,
				'collapsedIcon' => UI\Buttons\Icon::ADD_M,
			]);
		}
		else
		{
			$createButton = new UI\Buttons\CreateButton([
				'id' => 'landing-create-element',
				'text' => HtmlFilter::encode($button['TITLE']),
			]);
		}
		$createButton->addAttribute('data-testid', 'landing-filter-create-btn');
		$toolbarParams['landingCreateButtonId'] = $createButton->getUniqId();

		$isButtonDisabled = isset($button['DISABLED']) && $button['DISABLED'] === true;
		if ($isButtonDisabled)
		{
			$hint = Loc::getMessage('LANDING_TPL_CREATE_BUTTON_HINT');
			if ($helpUrl = Help::getHelpUrl('SHOP1C'))
			{
				$hint .= '<br>';
				$hint .= "<a href=\"{$helpUrl}\">";
				$hint .= Loc::getMessage('LANDING_TPL_CREATE_BUTTON_HINT_LINK_TEXT');
				$hint .= '</a>';
			}
			$createButton->addDataAttribute('hint', $hint);
			$createButton->addDataAttribute('hint-no-icon');
			$createButton->addDataAttribute('hint-html');
			$createButton->addDataAttribute('hint-interactivity');

			$createButton->setDisabled();
		}
		elseif ($isDeleted)
		{
			$createButton->setDisabled();
		}
		elseif (!$isPageDropdown)
		{
			$createButton->setLink($button['LINK']);
		}

		if ($isPageDropdown)
		{
			// the same generation page the tile and the onboarding open, marked by the menu item as the source
			$aiUrl = (string)($arParams['~SEF']['ai'] ?? '');
			$generateGptLink = (new Uri($aiUrl !== '' ? $aiUrl : '/sites/ai/'))
				->addParams([Sections::URL_PARAM => Sections::buttonMenu->value])
				->getUri()
			;
			$selectTemplateLink = $button['LINK'];
			$generateGptTitle = Loc::getMessage('LANDING_TPL_CREATE_DROPDOWN_ITEM_AI_SITE');
			$generateGptTitleHtml = HtmlFilter::encode($generateGptTitle);
			$isAiSiteChatAvailable =
				($arParams['AI_SITE_CHAT_AVAILABLE'] ?? true) !== false
				&& ($arParams['AI_SITE_CHAT_AVAILABLE'] ?? true) !== 'N'
			;
			$createMenuItems = [
				[
					'text' => Loc::getMessage('LANDING_TPL_CREATE_DROPDOWN_ITEM_WITH_TEMPLATE'),
					'onclick' => [
						'code' => "BX.Landing.Component.Filter.onCreateDropdownItemClick('select_template', " . Json::encode($selectTemplateLink) . ");",
					],
				],
				[
					'text' => Loc::getMessage('LANDING_TPL_CREATE_DROPDOWN_ITEM_IN_BUILDER'),
					'onclick' => [
						'code' => "BX.Landing.Component.Filter.onCreateDropdownItemClick('build_yourself');",
					],
				],
			];
			if ($isAiSiteChatAvailable)
			{
				array_unshift(
					$createMenuItems,
					[
						'html' => <<<HTML
							<span class="landing-filter-create-menu-ai-item-content">
								<span class="landing-filter-create-menu-ai-item-text">{$generateGptTitleHtml}</span>
								<span class="landing-filter-create-menu-ai-item-icon ui-icon-set --bitrix-gpt" aria-hidden="true"></span>
							</span>
						HTML,
						'className' => 'landing-filter-create-menu-ai-item menu-popup-no-icon',
						'dataset' => [
							'testid' => 'landing-filter-create-ai-site-menu-item',
						],
						'onclick' => [
							'code' => "BX.Landing.Component.Filter.onCreateDropdownItemClick('generate_gpt', " . Json::encode($generateGptLink) . ");",
						],
					],
				);
			}

			$createButton
				->setDropdown()
				->setMenu([
					'autoHide' => true,
					'closeEsc' => true,
					'offsetLeft' => 20,
					'angle' => true,
					'items' => $createMenuItems,
				])
			;
			$createButtonHasMenu = true;
		}
		elseif (!empty($arParams['BUTTONS']))
		{
			$createButtonOptions = [];
			foreach ($arParams['BUTTONS'] as $button)
			{
				if (isset($button['LINK'], $button['TITLE']))
				{
					$createButtonOptions[] = [
						'href' => $button['LINK'],
						'text' => $button['TITLE'],
					];
				}
			}
				if (!empty($createButtonOptions))
				{
					$createButton
						->setDropdown()
						->setMenu([
							'autoHide' => true,
						'closeEsc' => true,
						'offsetLeft' => 20,
						'angle' => true,
						'items' => $createButtonOptions,
					])
				;
				$createButtonHasMenu = true;
			}
		}

		// the initial state is closed, the script keeps it in sync with the menu popup
		if ($createButtonHasMenu)
		{
			$createButton
				->addAttribute('aria-haspopup', 'menu')
				->addAttribute('aria-expanded', 'false')
			;
		}

		Toolbar::addButton($createButton, ButtonLocation::AFTER_TITLE);
	}
}

// FILTER
$filterId = \CUtil::jsEscape($arParams['FILTER_ID']);
$toolbarParams['filterId'] = $filterId;
$filterOptions = [
	'FILTER_ID' => $filterId,
	'GRID_ID' => $arParams['FILTER_ID'],
	'FILTER' => $arResult['FILTER'],
	'FILTER_PRESETS' => $arResult['FILTER_PRESETS'],
	'ENABLE_LABEL' => true,
	'ENABLE_LIVE_SEARCH' => true,
	'RESET_TO_DEFAULT_MODE' => true,
];
Toolbar::addFilter($filterOptions);

// RECYCLE
$recycleBinButton = new UI\Buttons\Button([
	'id' => 'landing-recycle-bin',
	'color' => UI\Buttons\Color::LIGHT_BORDER,
	'text' => Loc::getMessage('LANDING_TPL_RECYCLE_BIN'),
	'click' => new UI\Buttons\JsHandler('BX.Landing.Component.Filter.onRecycleBinClick'),
	'dataset' => [
		'toolbar-collapsed-icon' => UI\Buttons\Icon::REMOVE,
	],
]);
$recycleBinButton
	->addAttribute('aria-pressed', $isDeleted ? 'true' : 'false')
	->addAttribute('data-testid', 'landing-filter-recycle-bin-btn')
;
$toolbarParams['landingRecycleBinButtonId'] = $recycleBinButton->getUniqId();
Toolbar::addButton($recycleBinButton);

// SETTINGS
if ($arParams['SETTING_LINK'])
{
	// for compatibility
	if (!is_array($arParams['SETTING_LINK']))
	{
		$arParams['SETTING_LINK'] = [
			[
				'TITLE' => '',
				'LINK' => $arParams['SETTING_LINK'],
			],
		];
	}

	$links = [];
	foreach ($arParams['SETTING_LINK'] as $settingsLink)
	{
		if (isset($settingsLink['DELIMITER']) && $settingsLink['DELIMITER'] === true)
		{
			$links[] = [
				'delimiter' => true,
			];

			continue;
		}

		if (
			!isset($settingsLink['LINK'], $settingsLink['TITLE'])
			|| $settingsLink['LINK'] === ''
			|| $settingsLink['TITLE'] === ''
		)
		{
			continue;
		}

		$link = [
			'href' => $settingsLink['LINK'],
			'text' => $settingsLink['TITLE'],
		];
		if (isset($settingsLink['DATASET']) && is_array($settingsLink['DATASET']))
		{
			$link['dataset'] = $settingsLink['DATASET'];
		}

		$links[] = $link;
	}

	$toolbarParams['landingSettingsButtons'] = $links;

	$settingsButton = new UI\Buttons\Button([
		'id' => 'landing-menu-settings',
		'color' => UI\Buttons\Color::LIGHT_BORDER,
		'icon' => UI\Buttons\Icon::SETTINGS,
		'click' => new UI\Buttons\JsHandler('BX.Landing.Component.Filter.onSettingsClick'),
	]);
	$settingsButton
		->addAttribute('aria-label', Loc::getMessage('LANDING_TPL_SETTINGS_BUTTON_LABEL'))
		->addAttribute('data-testid', 'landing-filter-settings-btn')
	;
	// a single link opens a slider, several links open a menu: only the menu case gets popup semantics
	if (count($links) > 1)
	{
		$settingsButton
			->addAttribute('aria-haspopup', 'menu')
			->addAttribute('aria-expanded', 'false')
		;
	}
	Toolbar::addButton($settingsButton);
}

// FOLDER
if ($arParams['FOLDER_SITE_ID'])
{
	$createFolderButton = new UI\Buttons\Button([
		'id' => 'landing-create-folder',
		'color' => UI\Buttons\Color::LIGHT_BORDER,
		'icon' => UI\Buttons\Icon::ADD_FOLDER,
		'click' => new UI\Buttons\JsHandler('BX.Landing.Component.Filter.onFolderCreateClick'),
		'dataset' => [
			'type' => $arParams['TYPE'],
			'action' => \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_CREATE_FOLDER_ACTION')),
			'siteId' => $arParams['FOLDER_SITE_ID'],
			'folderId' => $arParams['FOLDER_ID'],
		],
	]);
	$createFolderButton
		->addAttribute('aria-label', Loc::getMessage('LANDING_TPL_CREATE_FOLDER'))
		->addAttribute('data-testid', 'landing-filter-create-folder-btn')
	;
	$toolbarParams['landingCreateFolderButtonId'] = $createFolderButton->getUniqId();
	if ($isDeleted)
	{
		$createFolderButton->setDisabled();
	}
	else
	{
		$toolbarParams['canCreateFolder'] = true;
	}
	Toolbar::addButton($createFolderButton);
}

$toolbarParams['componentName'] = $this->getComponent()->getName();
$signedParameters = $this->getComponent()->getSignedParameters();
if (!$signedParameters)
{
	$signedParameters = \Bitrix\Main\Component\ParameterSigner::signParameters(
		$this->getComponent()->getName(),
		$this->getComponent()->arParams
	);
}
$toolbarParams['signedParameters'] = $signedParameters;

// a missing phrase is dropped here: on the client it would become the literal "null"
// in an accessible name or in an announcement
$templateMessages = array_filter(
	[
		'LANDING_FILTER_LIST_UPDATED' => Loc::getMessage('LANDING_FILTER_LIST_UPDATED'),
		'LANDING_FILTER_LIST_UPDATE_ERROR' => Loc::getMessage('LANDING_FILTER_LIST_UPDATE_ERROR'),
		'LANDING_FILTER_FOLDER_NAME_INPUT_OPENED' => Loc::getMessage('LANDING_FILTER_FOLDER_NAME_INPUT_OPENED'),
		'LANDING_TPL_FOLDER_NAME_INPUT_LABEL' => Loc::getMessage('LANDING_TPL_FOLDER_NAME_INPUT_LABEL'),
	],
	static fn($phrase) => $phrase !== null && $phrase !== '',
);
?>

<script>
	BX.message(<?= \CUtil::PhpToJSObject($templateMessages) ?>);
	BX.ready(() =>
	{
		new BX.Landing.Component.Filter(<?= Json::encode($toolbarParams) ?>);

		const container = document.querySelector('.ui-toolbar');
		if (container)
		{
			BX.UI.Hint.init(container);
		}
	});
</script>
