<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */
/** @var array $arParams */
/** @var \LandingBaseComponent $component */
/** @var string $templateFolder */
/** @var \CMain $APPLICATION */

// e2e accessibility coverage of this gallery, template and script.js alike, lives in a neighbouring
// component - this template ships without a bundle config, so chef would find no tests directory
// here: landing.site_tile/templates/.default/tests/e2e/template-gallery-accessibility.spec.ts

use Bitrix\Landing\Manager;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;
use Bitrix\Main\UI\Extension;
use Bitrix\UI;
use Bitrix\UI\Toolbar\Facade\Toolbar;

Extension::load([
	'ui.fonts.opensans',
	'ui.buttons',
	'sidepanel',
	'ui.design-tokens',
]);

Loc::loadMessages(__FILE__);

$context = \Bitrix\Main\Application::getInstance()->getContext();
$request = $context->getRequest();

// some errors
// the region is rendered even when empty: an alert area present from the first paint is the only
// one that announces the error it receives later, with the refreshed list
// its content must stay `.landing-demo-error` paragraphs: script.js carries those texts over on refresh
?>
<div id="landing-demo-errors" class="landing-demo-errors" role="alert" data-testid="landing-demo-errors"><?php
	foreach ((array)($arResult['ERRORS'] ?: []) as $error)
	{
		echo '<p class="landing-demo-error">' . \htmlspecialcharsbx($error) . '</p>';
	}
?></div>
<?php

// show message for license renew if need
if (
	empty($arResult['DEMO'])
	&& !isset($arResult['ERRORS']['ACCESS_DENIED'])
	&& !$arResult['IS_SEARCH']
)
{
	if (ModuleManager::isModuleInstalled('bitrix24'))
	{
		\showError(Loc::getMessage('LANDING_TPL_EMPTY_REPO_SERVICE'));
	}
	else
	{
		if (Manager::licenseIsValid())
		{
			\showError(Loc::getMessage('LANDING_TPL_EMPTY_REPO_SERVICE'));
		}
		else
		{
			$link = Manager::isB24()
					? 'https://www.bitrix24.ru/prices/self-hosted.php'
					: 'https://www.1c-bitrix.ru/buy/cms.php#tab-updates-link';
			?>
			<div class="landing-license-wrapper">
				<div class="landing-license-inner">
					<div class="landing-license-icon-container">
						<div class="landing-license-icon"></div>
					</div>
					<div class="landing-license-info">
						<span class="landing-license-info-text"><?= Loc::getMessage('LANDING_TPL_EMPTY_REPO_EXPIRED');?></span>
						<div class="landing-license-info-btn">
							<?= Loc::getMessage('LANDING_TPL_EMPTY_REPO_EXPIRED_LINK', array(
								'#LINK1#' => '<a href="' . $link . '" target="_blank"'
									. ' class="landing-license-info-link"'
									. ' data-testid="landing-demo-license-link">',
								'#LINK2#' => '</a>'
							));?>
						</div>
					</div>
				</div>
			</div>
			<?
		}
	}
}

// exit on fatal
if ($arResult['FATAL'])
{
	return;
}

// title
if (!$component->isAjax())
{
	$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
	$APPLICATION->SetPageProperty(
		'BodyClass',
		($bodyClass ? $bodyClass . ' ' : '') . 'no-all-paddings no-background landing-slider-frame-popup'
	);
	\Bitrix\Landing\Manager::setPageTitle(
		$component->getMessageType('LANDING_TPL_TITLE')
	);
	Toolbar::deleteFavoriteStar();

	// additional assets
	\CJSCore::Init(['popup', 'action_dialog', 'loader', 'sidepanel']);
	Asset::getInstance()->addCSS('/bitrix/components/bitrix/landing.sites/templates/.default/style.css');
	Asset::getInstance()->addJS('/bitrix/components/bitrix/landing.sites/templates/.default/script.js');

	// filter
	if ($arParams['TYPE'] === 'PAGE')
	{
		ob_start();
		?>
		<div class="landing-filter-container" data-testid="landing-demo-filter">
			<?php
			$APPLICATION->IncludeComponent(
				'bitrix:main.ui.filter',
				'',
				[
					'FILTER_ID' => $arResult['FILTER_ID'],
					'FILTER' => $arResult['FILTER_FIELDS'],
					'FILTER_PRESETS' => $arResult['FILTER_PRESETS'],
					'ENABLE_LABEL' => true,
					'ENABLE_LIVE_SEARCH' => true,
				],
				$this->__component,
				['HIDE_ICONS' => true]
			);
			?>
			<script>
				BX.Landing.Component.Demo.ajaxPath = '<?=\CUtil::jsEscape($arResult['FILTER_URI'])?>';
			</script>
		</div>
		<?php
		$filter = ob_get_contents();
		ob_end_clean();
		$APPLICATION->addViewContent('title_actions', $filter);
	}

	// create empty button
	if (
		$arParams['TYPE'] === 'KNOWLEDGE'
		|| $arParams['TYPE'] === 'GROUP'
		|| $arResult['MARKET_DISABLE']
	)
	{
		$emptyTpl = !$arParams['SITE_ID']
			? 'empty-multipage/main'
			: 'empty'
		;
		$emptyCreateUrl = $component->getUri(
			['tpl' => $emptyTpl],
			['select']
		);
		$createEmptyButton = new UI\Buttons\Button([
			'id' => 'landing-demo-empty',
			'color' => UI\Buttons\Color::LIGHT_BORDER,
			'link' => $emptyCreateUrl,
			'text' => Loc::getMessage("LANDING_TPL_CREATE_EMPTY"),
			'dataset' => ['testid' => 'landing-demo-create-empty-btn'],
		]);

		Toolbar::addButton($createEmptyButton);
		?>
		<script>
			BX.Landing.Component.Demo.createEmptyId = '<?=\CUtil::jsEscape($createEmptyButton->getUniqId())?>';
		</script>
		<?php
	}
	?>


	<div style="display: none">
		<?$APPLICATION->includeComponent(
			'bitrix:ui.feedback.form',
			'',
			$component->getFeedbackParameters('demo')
		);?>
	</div>

	<script>
		BX.message(<?= \CUtil::PhpToJSObject([
			'LANDING_TPL_LIST_UPDATED' => Loc::getMessage('LANDING_TPL_LIST_UPDATED'),
			'LANDING_TPL_LIST_UPDATE_ERROR' => Loc::getMessage('LANDING_TPL_LIST_UPDATE_ERROR'),
		]) ?>);
	</script>

	<?php
}
?>

<div class="grid-tile-wrap" id="grid-tile-wrap" data-testid="landing-demo-gallery">
	<div class="grid-tile-inner" id="grid-tile-inner" data-testid="landing-demo-grid">
		<?php if ($arResult['MARKET_DISABLE']): ?>
			<span class="landing-item landing-item-market-disable">
				<span class="landing-item-market-disable-title"><?= Loc::getMessage('LANDING_TPL_MARKET_DISABLE_MSGVER_1') ?></span>
			</span>
		<?php elseif (
			$arParams['TYPE'] === 'PAGE'
			&& (count($arResult['DEMO']) > 0)
		): ?>
			<span class="landing-item landing-item-contact">
				<span class="landing-item-inner">
					<span class="landing-item-contact-title"><?= Loc::getMessage('LANDING_TPL_FEEDBACK_TITLE');?></span>
					<span class="landing-item-contact-icon"></span>
					<span class="landing-item-contact-desc"><?= Loc::getMessage('LANDING_TPL_FEEDBACK_MESSAGE_2');?></span>
					<button
						type="button"
						class="ui-btn ui-btn-sm ui-btn-round landing-item-contact-btn"
						onclick="BX.fireEvent(BX('landing-feedback-demo-button'), 'click');"
						data-testid="landing-demo-contact-btn"
					>
						<?= Loc::getMessage('LANDING_TPL_FEEDBACK_SEND') ?>
					</button>
				</span>
			</span>
		<?php elseif ($arResult['IS_SEARCH']): ?>
			<div class="landing-demo-not-found">
				<img
					class="landing-demo-not-found-img"
					src="<?= $templateFolder ?>/image/landing-search-icon.png"
					alt=""
				>
				<div class="landing-demo-not-found-title">
					<?= Loc::getMessage('LANDING_TPL_NOT_FOUND_TITLE') ?>
				</div>
				<div class="landing-demo-not-found-text">
					<?= Loc::getMessage('LANDING_TPL_FEEDBACK_MESSAGE_2') ?>
				</div>
				<button
					type="button"
					class="landing-demo-not-found-button ui-btn ui-btn-light-border"
					onclick="BX.fireEvent(BX('landing-feedback-demo-button'), 'click');"
					data-testid="landing-demo-not-found-btn"
				>
					<?= Loc::getMessage('LANDING_TPL_NOT_FOUND_BUTTON') ?>
				</button>
			</div>
		<?php endif; ?>
<?php foreach ($arResult['DEMO'] as $item): ?>
<?php
	// empty is in top button, not need show in list
	// skip chats
	if (
		$item['ID'] === 'empty'
		|| $item['ID'] === 'empty-multipage'
		|| $item['ID'] === 'store-chats-dark'
		|| $item['ID'] === 'requisites/main'
	)
	{
		continue;
	}
	// skip site group items
	if (
		isset($item['DATA']['site_group_item'])
		&& $item['DATA']['site_group_item'] === 'Y'
	)
	{
		continue;
	}

	$isSmnSite = defined('SMN_SITE_ID') || !$arParams['SITE_ID'];
	$tpl =
		($isSmnSite && isset($item['DATA']['items'][0]))
			? $item['DATA']['items'][0]
			: $item['ID']
	;

	if ($item['ID'] === 'store_v3')
	{
		$previewUrl = $component->getUri(['super' => 'Y']);
	}
	else if (!isset($item['EXTERNAL_URL']))
	{
		$previewUrl = $component->getUri(
			['tpl' => $tpl],
			['select']
		);
	}
	else
	{
		$previewUrl = $item['EXTERNAL_URL']['href'] ?? '';
	}

	// a template whose url did not survive the scheme guard is shown as unavailable, not as an empty link
	$previewUrl = \Bitrix\Landing\Sanitizer::sanitizeHrefScheme((string)$previewUrl);
	$isAvailable = $item['AVAILABLE'] && $previewUrl !== '';
	$isLimitReached = $arResult['LIMIT_REACHED'] && !$item['SINGLETON'];

	$sliderWidth = null;
	if ($item['ID'] === 'store_v3')
	{
		$sliderWidth = 1200;
	}
	elseif (isset($item['EXTERNAL_URL']['width']))
	{
		$sliderWidth = (int)$item['EXTERNAL_URL']['width'];
	}

	// accessible name of the tile: the visible title plus every state label shown on it
	$tileName = [$item['TITLE']];
	if (($item['IS_NEW'] ?? null) === 'Y')
	{
		$tileName[] = Loc::getMessage('LANDING_TPL_LABEL_NEW');
	}
	if ($item['LABELS'] ?? null)
	{
		$tileName[] = Loc::getMessage('LANDING_TPL_LABEL_SUBSCRIPTION');
	}
	elseif ($item['TYPE'] === 'PAGE')
	{
		$tileName[] = Loc::getMessage('LANDING_TPL_LABEL_FREE');
	}
	if (!$isAvailable)
	{
		$tileName[] = Loc::getMessage('LANDING_TPL_ITEM_UNAVAILABLE');
	}
	$tileName = \htmlspecialcharsbx(implode(', ', $tileName));

	$tileId = 'landing-demo-' . \htmlspecialcharsbx($tpl);
	$descId = 'landing-demo-desc-' . \htmlspecialcharsbx($tpl);
	$safePreviewUrl = \htmlspecialcharsbx($previewUrl);
	?>
	<span
		class="landing-item landing-item-hover<?= $isAvailable ? ' landing-item-with-link' : ' landing-item-unactive';?>"
		data-testid="landing-demo-tile"
	>
		<?if (!$isAvailable):?>
		<button
			type="button"
			id="<?= $tileId;?>"
			class="landing-demo-tile-link"
			aria-disabled="true"
			data-testid="landing-demo-tile-link"
		><span class="landing-visually-hidden"><?= $tileName;?></span></button>
		<?elseif ($isLimitReached):?>
		<button
			type="button"
			id="<?= $tileId;?>"
			class="landing-template-pseudo-link landing-demo-tile-link landing-item-payment"
			data-href="<?= $safePreviewUrl;?>"<?if ($sliderWidth):?>
			data-slider-width="<?= $sliderWidth;?>"<?endif;?>
			data-testid="landing-demo-tile-link"
		><span class="landing-visually-hidden"><?= $tileName;?></span></button>
		<?else:?>
		<a
			href="<?= $safePreviewUrl;?>"
			id="<?= $tileId;?>"
			class="landing-template-pseudo-link landing-demo-tile-link"
			data-href="<?= $safePreviewUrl;?>"<?if ($sliderWidth):?>
			data-slider-width="<?= $sliderWidth;?>"<?endif;?>
			data-slider-ignore-autobinding="true"
			data-testid="landing-demo-tile-link"
		><span class="landing-visually-hidden"><?= $tileName;?></span></a>
		<?endif;?>
		<span class="landing-item-inner">
			<div class="landing-title">
				<div class="landing-title-wrap">
					<div class="landing-title-overflow">
						<?= \htmlspecialcharsbx($item['TITLE'])?>
					</div>
					<?if (($item['IS_NEW'] ?? null) === 'Y'): ?>
						<span class="landing-title-new"><?= Loc::getMessage('LANDING_TPL_LABEL_NEW');?></span>
					<?endif;?>
				</div>
			</div>

			<span class="landing-item-cover <?=trim($item['DESCRIPTION']) ? 'landing-item-cover-short' : ''?>">
				<?if ($item['PREVIEW']):?>
					<img class="landing-item-cover-img"
						alt=""
						src="<?= \htmlspecialcharsbx($item['PREVIEW'])?>"
						srcset="<?= \htmlspecialcharsbx($item['PREVIEW2X'] ? $item['PREVIEW2X'] : $item['PREVIEW'])?> 2x,
									<?= \htmlspecialcharsbx($item['PREVIEW3X'] ? $item['PREVIEW3X'] : $item['PREVIEW'])?> 3x">
				<?endif;?>
				<?php if ($item['LABELS'] ?? null):?>
					<span class="landing-item-label">
						<?=Loc::getMessage('LANDING_TPL_LABEL_SUBSCRIPTION')?>
					</span>
				<?php elseif($item['TYPE'] === 'PAGE'):?>
					<span class="landing-item-label landing-item-label-free">
						<?=Loc::getMessage('LANDING_TPL_LABEL_FREE')?>
					</span>
				<?php endif;?>
			</span>

			<div class="landing-item-bottom">
				<?php if (trim($item['DESCRIPTION'])):?>
					<span class="landing-item-description">
						<span class="landing-item-desc-inner">
							<span class="landing-item-desc-overflow">
								<span class="landing-item-desc-height" id="<?= $descId;?>">
									<?= \htmlspecialcharsbx($item['DESCRIPTION'])?>
								</span>
							</span>
							<button
								type="button"
								class="landing-item-desc-open"
								aria-expanded="false"
								aria-controls="<?= $descId;?>"
								data-testid="landing-demo-tile-desc-toggle"
							><span class="landing-visually-hidden"><?= Loc::getMessage('LANDING_TPL_DESC_TOGGLE');?></span></button>
						</span>
					</span>
				<?php endif?>
			</div>
		</span>
	</span>
<?endforeach;?>

	</div>
</div>

<?php if ($arResult['NAVIGATION']->getPageCount() > 1): ?>
	<div
		id="landing-demo-navigation"
		class="<?= (defined('ADMIN_SECTION') && ADMIN_SECTION === true) ? '' : 'landing-navigation' ?>"
		data-testid="landing-demo-navigation"
	>
		<?php $APPLICATION->IncludeComponent(
			'bitrix:main.pagenavigation',
			'',
			[
				'NAV_OBJECT' => $arResult['NAVIGATION'],
				'SEF_MODE' => 'N',
				'BASE_LINK' => $arResult['NAV_URI'] .
							   ((defined('ADMIN_SECTION') && ADMIN_SECTION === true) ? '&slider' : '')//@tmp bug #105866
			],
			false
		);?>
	</div>
<?php endif; ?>

<?php
if (Manager::isB24() && $arParams['TYPE'] !== 'PAGE') {
	$link = ($arParams['TYPE'] === 'KNOWLEDGE' || $arParams['TYPE'] === 'GROUP')
		? SITE_DIR . 'market/category/vertical_knowledge_bases/'
		: SITE_DIR . 'market/category/site_shops/';
	?>
	<button
		type="button"
		class="landing-license-banner"
		onclick="BX.SidePanel.Instance.open('<?= \htmlspecialcharsbx(\CUtil::jsEscape($link)); ?>');"
		data-testid="landing-demo-market-banner-btn"
	>
		<span class="landing-license-banner-icon">
			<span class="landing-license-banner-icon-arrow"></span>
		</span>
		<span class="landing-license-banner-title">
			<?= Loc::getMessage('LANDING_TPL_LOAD_APP_TEMPLATE_2_MSGVER_1'); ?>
		</span>
	</button>
	<?php
}
?>

<script>
	<?if ($arResult['LIMIT_REACHED']):?>
	// the component binds this to the blocked tiles of every render, the first one and the filtered
	// ones alike, so the assignment has to happen before the instance is created
	BX.Landing.Component.Demo.restrictionHandler = function(event)
	{
		<?
		echo \Bitrix\Landing\Restriction\Manager::getActionCode(
			($arParams['TYPE'] == 'STORE') ? 'limit_shop_number' : 'limit_sites_number'
		);
		?>
		BX.PreventDefault(event);
	};
	<?endif;?>

	BX.ready(function ()
	{
		<?if ($select = $request->get('select')):?>
		BX.fireEvent(
			BX('landing-demo-<?= \CUtil::JSEscape($select);?>'),
			'click'
		);
		<?endif;?>
	})
</script>