<?php
/**
 * Bitrix vars
 *
 * @var array $arParams
 * @var array $arResult
 * @var CBitrixComponent $component
 * @var CBitrixComponentTemplate $this
 * @global CMain $APPLICATION
 * @global CUser $USER
 */
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Application;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI;
use Bitrix\Main\UI\Extension;
use Bitrix\Landing\Metrika;

Loc::loadMessages(__FILE__);

/** @var array $arParams */
/** @var array $arResult */
/** @var string $templateFolder */
/** @var \LandingSiteTileComponent $component */

Extension::load(['sidepanel', 'main.qrcode', 'ui.dialogs.messagebox', 'marketplace', 'applayout', 'ui.fonts.opensans', 'ui.analytics']);
Loader::includeModule("ui");

$isAjax = $component->isAjax();
$context = Application::getInstance()->getContext();
$request = $context->getRequest();

if(Loader::includeModule('ui'))
{
	UI\Extension::load('ui.buttons');
	UI\Extension::load('main.loader');
}

// Tool availability (by intranet settings)
if (!$component->isToolAvailable())
{
	echo $component->getToolUnavailableInfoScript();
}
?>

<div class="landing-settings" id="landing-settings">
	<?php
	$menuItems = [];
	$pages = [];
	foreach($arResult['ITEMS'] as $code => $link)
	{
		$menuItem = [
			'NAME' => $link['name'],
			'ACTIVE' => (bool)($link['current'] ?? null),
		];

		if ($link['page'] ?? null)
		{
			// the item carries no address: it opens a section of the same page, so it is a button,
			// and a button built of an anchor needs a place in the tab order of its own
			$menuItem['ATTRIBUTES'] = [
				'data-page' => $link['page'],
				'role' => 'button',
				'tabindex' => '0',
			];
			$pages[$code] = $link;
		}
		elseif ($link['placement'])
		{
			$menuItem['ATTRIBUTES'] = [
				'href' => $link['link'] ?? null,
				'data-app-id' => $link['appId'],
				'data-placement' => $link['placement'],
				'data-placement-id' => $link['placementId'],
				'data-page' => $link['page'] ?? null,
			];
		}

		$menuItems[] = $menuItem;
	}
	?>

	<?php
	$APPLICATION->IncludeComponent(
		"bitrix:ui.sidepanel.wrappermenu",
		'',
		[
			"ID" => "landing-settings-sidemenu",
			"ITEMS" => $menuItems,
		]
	);
	?>

	<?php
	// A live region announces what appears inside it and only once the region itself is already
	// there, so the block is printed with the document and left empty. It stands outside the
	// content container on purpose: the busy state raised on that container while a request is
	// under way tells a screen reader to hold back everything changing inside it.
	?>
	<div class="landing-settings-message" id="landing-settings-message" role="alert"></div>

	<div id="landing-settings-content">
		<?php
		$fatalMessages = [];
		if ($arResult['ERRORS'] && $arResult['FATAL'])
		{
			foreach ($arResult['ERRORS'] as $errorCode => $errorMessage)
			{
				$fatalMessages[] = $errorMessage . $component->getSettingLinkByError(
					$errorCode
				);
			}
		}

		// the focus is moved onto one block, so every message is printed inside that block
		if ($fatalMessages)
		{
			?>
			<div
				class="landing-error-page"
				tabindex="-1"
			>
				<div class="landing-error-page-inner">
					<?php foreach ($fatalMessages as $fatalMessage): ?>
						<div class="landing-error-page-title"><?= $fatalMessage ?></div>
					<?php endforeach; ?>
					<div class="landing-error-page-img">
						<div class="landing-error-page-img-inner"></div>
					</div>
				</div>
			</div>
			<?php
		}
		?>
	</div>

	<?php
	$buttonSave = [
		'TYPE' => 'save',
		'ID' => 'landing-settings-save-btn',
		'NAME' => 'submit',
	];
	$buttonCancel = [
		'TYPE' => 'cancel',
		'ID' => 'landing-settings-cancel-btn',
	];

	$APPLICATION->IncludeComponent(
		'bitrix:ui.button.panel',
		'',
		['BUTTONS' => [$buttonSave, $buttonCancel]]
	);
	?>

	<script>
		BX.ready(function() {
			new BX.Landing.Component.LandingSettings(
				<?= CUtil::PhpToJSObject([
					'siteId' => $arParams['SITE_ID'],
					'landingId' => $arParams['LANDING_ID'],
					'pages' => $pages,
					'menuId' => 'landing-settings-sidemenu',
					'containerId' => 'landing-settings-content',
					'messageId' => 'landing-settings-message',
					'messages' => [
						'sectionLoadError' => Loc::getMessage('LANDING_SITE_SETTINGS_SECTION_LOAD_ERROR'),
						'saveError' => Loc::getMessage('LANDING_SITE_SETTINGS_SAVE_ERROR'),
					],
					'saveButtonId' => 'landing-settings-save-btn',
					'cancelButtonId' => 'landing-settings-cancel-btn',
					'type' => $arParams['TYPE'],
					'tool' => Metrika\Tools::getBySiteType($arParams['TYPE'])->value,
				]) ?>,
			);
		});
	</script>

	<!-- fonts proxy-->
	<?= $component->getFontProxyUrlScript() ?>
</div>