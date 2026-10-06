<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */
/** @var array $arParams */
/** @var \CMain $APPLICATION */
/** @var \LandingLandingsComponent $component */

use Bitrix\Landing\Copilot\Services\NameService;
use Bitrix\Landing\Metrika;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\Web\Uri;

Loc::loadMessages(__FILE__);

if ($arResult['ERRORS'])
{
	\showError(implode("\n", $arResult['ERRORS']));
}

if ($arResult['FATAL'])
{
	return;
}

$context = \Bitrix\Main\Application::getInstance()->getContext();
$request = $context->getRequest();

$folder = $arResult['FOLDER'];
$folderId = $arResult['FOLDER_ID'];

// assets, title
\Bitrix\Landing\Manager::setPageTitle(\htmlspecialcharsbx($arResult['TITLE']));
\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens',
	'landing_master',
	'landing.explorer',
	'action_dialog',
	'clipboard',
	'main.popup',
	'sidepanel',
	'ui.buttons',
	'ui.icon-set.api.core',
	'ui.icon-set.outline',
]);
$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty(
	'BodyClass',
	($bodyClass ? $bodyClass.' ' : '') .
	'no-all-paddings no-background landing-tile landing-tile-pages'
);
Asset::getInstance()->addJS(
	'/bitrix/components/bitrix/landing.sites/templates/.default/script.js'
);
Asset::getInstance()->addCSS(
	'/bitrix/components/bitrix/landing.sites/templates/.default/style.css'
);

// prepare urls
$metrika = new Metrika\Metrika(
	Metrika\Categories::getBySiteType($arParams['TYPE']),
	Metrika\Events::openMarket,
	Metrika\Tools::getBySiteType($arParams['TYPE']),
);
$metrika
	->setSection(Metrika\Sections::page)
	->setSubSection('from_page_list')
;
$arParams['PAGE_URL_LANDING_ADD_PLUS_BUTTON'] =
	$metrika->parametrizeUri($component->getUrlAdd(false));
$arParams['PAGE_URL_LANDING_ADD_FOLDER_MENU'] =
	$metrika->parametrizeUri($component->getUrlAdd(false));
$arParams['PAGE_URL_LANDING_ADD_SIDEPANEL_CONDITION'] = $component->getUrlAddSidepanelCondition(false);

$sliderConditions = [
	str_replace(
		array(
			'#landing_edit#', '?'
		),
		array(
			'(\d+)', '\?'
		),
		CUtil::jsEscape($arParams['PAGE_URL_LANDING_SETTINGS'])
	),
];

$sliderFullConditions = [];
if ($arParams['TYPE'] === 'PAGE' && $component->isUseNewMarket())
{
	$sliderFullConditions[] = $arParams['PAGE_URL_LANDING_ADD_SIDEPANEL_CONDITION'];
}
else
{
	$sliderConditions[] = $arParams['PAGE_URL_LANDING_ADD_SIDEPANEL_CONDITION'];
}

$sliderShortConditions = [
	str_replace(
		array(
			'#folder_edit#', '?'
		),
		array(
			'(\d+)', '\?'
		),
		\CUtil::jsEscape($arParams['PAGE_URL_FOLDER_EDIT'])
	)
];

\trimArr($sliderFullConditions, true);
\trimArr($sliderConditions, true);
\trimArr($sliderShortConditions, true);

// Tool availability (by intranet settings)
if (!$component->isToolAvailable())
{
	echo $component->getToolUnavailableInfoScript();
}

$showSitePagesOnboardingPopup = ($arResult['SHOW_SITE_PAGES_ONBOARDING_POPUP'] ?? false) === true;
$onboardingItem1Title = '';
$onboardingItem2Desc = '';
$onboardingAiUrl = '';

if ($showSitePagesOnboardingPopup)
{
	$onboardingItem1Title = \CUtil::jsEscape(
		NameService::replaceCopilotName(Loc::getMessage('LANDING_TPL_ONBOARDING_AI_ITEM_1_TITLE_MSGVER_1'))
	);
	$onboardingItem2Desc = \CUtil::jsEscape(
		NameService::replaceCopilotName(Loc::getMessage('LANDING_TPL_ONBOARDING_AI_ITEM_2_DESC_MSGVER_1'))
	);
	$aiUrl = (string)($arParams['~SEF']['ai'] ?? '');
	$onboardingAiUrl = \CUtil::jsEscape(
		(new Uri($aiUrl !== '' ? $aiUrl : '/sites/ai/'))
			->addParams([Metrika\Sections::URL_PARAM => Metrika\Sections::sites->value])
			->getUri()
	);
}
?>

<?php if ($showSitePagesOnboardingPopup): ?>
	<script>
		BX.ready(() => {
			const tplFolder = '<?= \CUtil::jsEscape($templateFolder) ?>';

			const prefersReducedMotion = () => (
				window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
			);

			const createOnboardingItem = (iconCode, title, desc) => {
				return BX.create('div', {
					props: { className: 'landing-site-pages-onboarding-item' },
					children: [
						BX.create('div', {
							props: { className: 'landing-site-pages-onboarding-item-icon' },
							children: [
								new BX.UI.IconSet.Icon({ icon: iconCode, size: 24 }).render(),
							],
						}),
						BX.create('div', {
							props: { className: 'landing-site-pages-onboarding-item-body' },
							children: [
								BX.create('div', {
									props: { className: 'landing-site-pages-onboarding-item-title' },
									text: title,
								}),
								BX.create('div', {
									props: { className: 'landing-site-pages-onboarding-item-desc' },
									text: desc,
								}),
							],
						}),
					],
				});
			};

			const createOnboardingButton = () => {
				const button = new BX.UI.Button({
					text: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ONBOARDING_AI_BUTTON')) ?>',
					useAirDesign: true,
					size: BX.UI.Button.Size.EXTRA_LARGE,
					className: 'landing-site-pages-onboarding-btn',
					dataset: { testid: 'landing-site-pages-onboarding-ai-btn' },
					onclick: () => {
						window.location.href = '<?= $onboardingAiUrl ?>';
					},
				});

				return button.render();
			};

			const createOnboardingVideo = (folder) => {
				const video = BX.create('video', {
					props: { className: 'landing-site-pages-onboarding-video' },
					attrs: {
						loop: 'loop',
						playsinline: 'playsinline',
						preload: 'auto',
						poster: folder + '/images/landing-site-pages-onboarding-bg.jpg',
					},
					children: [
						BX.create('source', {
							attrs: {
								src: folder + '/video/landing-site-pages-onboarding-video-800.mp4',
								type: 'video/mp4',
							},
						}),
					],
				});
				video.muted = true;

				return video;
			};

			const createVideoToggle = (video) => {
				const labelPlay = '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ONBOARDING_VIDEO_PLAY')) ?>';
				const labelPause = '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ONBOARDING_VIDEO_PAUSE')) ?>';
				const button = BX.create('button', {
					props: { className: 'landing-site-pages-onboarding-video-toggle', type: 'button' },
					attrs: { 'data-testid': 'landing-landings-onboarding-video-toggle' },
				});

				const sync = () => {
					const playing = !video.paused && !video.ended;
					button.setAttribute('aria-label', playing ? labelPause : labelPlay);
					button.classList.toggle('--paused', !playing);
				};

				button.addEventListener('click', () => {
					if (video.paused)
					{
						playOnboardingVideo(video);
					}
					else
					{
						pauseOnboardingVideo(video);
					}
				});
				video.addEventListener('play', sync);
				video.addEventListener('pause', sync);
				sync();

				return button;
			};

			const createOnboardingRight = (folder) => {
				const video = createOnboardingVideo(folder);
				const children = [video, createVideoToggle(video)];

				for (let i = 1; i <= 7; i++)
				{
					children.push(BX.create('img', {
						props: { className: 'landing-site-pages-onboarding-star landing-site-pages-onboarding-star-' + i },
						attrs: { src: folder + '/images/landing-site-pages-onboarding-star-' + i + '.png', alt: '' },
					}));
				}

				children.push(BX.create('img', {
					props: { className: 'landing-site-pages-onboarding-glow' },
					attrs: { src: folder + '/images/landing-site-pages-onboarding-icon-glow.png', alt: '' },
				}));
				children.push(BX.create('img', {
					props: { className: 'landing-site-pages-onboarding-marshmallow' },
					attrs: { src: folder + '/images/landing-site-pages-onboarding-marshmallow.png', alt: '' },
				}));

				return BX.create('div', {
					props: { className: 'landing-site-pages-onboarding-right' },
					children,
				});
			};

			const getOnboardingPopupContent = (folder) => {
				const left = BX.create('div', {
					props: { className: 'landing-site-pages-onboarding-left' },
					children: [
						BX.create('div', {
							props: { className: 'landing-site-pages-onboarding-header' },
							children: [
								BX.create('div', {
									props: { className: 'landing-site-pages-onboarding-title', id: 'landing-site-pages-onboarding-title' },
									attrs: { role: 'heading', 'aria-level': '2' },
									text: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ONBOARDING_AI_TITLE_MSGVER_1')) ?>',
								}),
								BX.create('div', {
									props: { className: 'landing-site-pages-onboarding-subtitle' },
									attrs: { role: 'heading', 'aria-level': '3' },
									text: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ONBOARDING_AI_SUBTITLE_MSGVER_1')) ?>',
								}),
							],
						}),
						BX.create('div', {
							props: { className: 'landing-site-pages-onboarding-list' },
							children: [
								createOnboardingItem(
									'o-idea-lamp',
									'<?= $onboardingItem1Title ?>',
									'<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ONBOARDING_AI_ITEM_1_DESC_MSGVER_1')) ?>',
								),
								createOnboardingItem(
									'o-chats',
									'<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ONBOARDING_AI_ITEM_2_TITLE_MSGVER_1')) ?>',
									'<?= $onboardingItem2Desc ?>',
								),
								createOnboardingItem(
									'o-like',
									'<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ONBOARDING_AI_ITEM_3_TITLE_MSGVER_1')) ?>',
									'<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ONBOARDING_AI_ITEM_3_DESC_MSGVER_1')) ?>',
								),
							],
						}),
						createOnboardingButton(),
					],
				});

				return BX.create('div', {
					props: { className: 'landing-site-pages-onboarding-popup-content --ui-context-content-dark' },
					children: [left, createOnboardingRight(folder)],
				});
			};

			const playOnboardingVideo = (video) => {
				if (!video)
				{
					return;
				}

				const playPromise = video.play();
				if (playPromise && typeof playPromise.catch === 'function')
				{
					playPromise.catch(() => {});
				}
			};

			const pauseOnboardingVideo = (video) => {
				if (video)
				{
					video.pause();
				}
			};

			// one-time 360° spin of the glow icon, restartable on each open
			const spinGlowOnce = (glow) => {
				if (!glow)
				{
					return;
				}

				glow.classList.remove('--spin');
				void glow.offsetWidth; // force reflow so the animation can replay
				glow.classList.add('--spin');
			};

			const content = getOnboardingPopupContent(tplFolder);
			const videoEl = content.querySelector('.landing-site-pages-onboarding-video');
			const glowEl = content.querySelector('.landing-site-pages-onboarding-glow');

			// responsive: ≤1000 → stacked layout, fit to screen, no side protrusion
			const RESPONSIVE_MAX = 1000;
			const getPopupWidth = () => (
				window.innerWidth <= RESPONSIVE_MAX ? Math.min(500, window.innerWidth - 32) : 905
			);
			const getPopupOffsetLeft = () => (window.innerWidth <= RESPONSIVE_MAX ? 0 : -43);

			const popup = new BX.Main.Popup({
				id: 'landing-site-pages-onboarding-popup',
				bindElement: window,
				width: getPopupWidth(),
				content: content,
				closeIcon: {top: '12px', right: '13px'},
				padding: 0,
					className: 'landing-site-pages-onboarding-popup',
				borderRadius: '24px',
				overlay: true,
				cacheable: false,
				offsetLeft: getPopupOffsetLeft(),
				events: {
					onShow: () => {
						applyResponsiveLayout();
						const popupContainer = popup.getPopupContainer();
						if (popupContainer)
						{
							popupContainer.setAttribute('aria-labelledby', 'landing-site-pages-onboarding-title');
						}
						if (videoEl)
						{
							// spin the glow once when the video actually starts
							videoEl.addEventListener('playing', () => spinGlowOnce(glowEl), { once: true });
						}
						// respect reduced-motion: keep the video paused as the initial state
						if (!prefersReducedMotion())
						{
							playOnboardingVideo(videoEl);
						}
					},
					onClose: () => {
						pauseOnboardingVideo(videoEl);
						BX.unbind(window, 'resize', applyResponsiveLayout);
					},
				},
			});

			// keep the popup in sync when the viewport crosses the breakpoint (resize, not only reload)
			const applyResponsiveLayout = () => {
				popup.setWidth(getPopupWidth());
				popup.setOffset({ offsetLeft: getPopupOffsetLeft(), offsetTop: 0 });
				// setWidth re-adds inline overflow-x: auto — keep the protruding video visible
				popup.getContentContainer().style.setProperty('overflow-x', 'visible');
				popup.adjustPosition();
			};

			BX.bind(window, 'resize', applyResponsiveLayout);

			popup.show();
		});
	</script>
<?php endif; ?>

<div class="landing-visually-hidden" role="status" aria-live="polite" id="landing-explorer-status-region"></div>
<script>
	BX.ready(function() {
		var region = document.getElementById('landing-explorer-status-region');
		var message = null;
		try
		{
			message = sessionStorage.getItem('landingExplorerStatus');
		}
		catch (e) {}
		if (region && message)
		{
			try
			{
				sessionStorage.removeItem('landingExplorerStatus');
			}
			catch (e) {}
			setTimeout(function() {
				region.textContent = message;
			}, 100);
		}
	});
</script>
<div class="grid-tile-wrap landing-pages-wrap" id="grid-tile-wrap">
	<div class="grid-tile-inner" id="grid-tile-inner">

	<?if ($folderId):
		if ($folder['PARENT_ID'])
		{
			$urlUpFolder = $component->getUri(
				[$arParams['ACTION_FOLDER'] => $folder['PARENT_ID']]
			);
		}
		else
		{
			$urlUpFolder = $component->getUri(
				($component->request('IFRAME') === 'Y') ? ['folderUp' => 'Y'] : [],
				[$arParams['ACTION_FOLDER']]
			);
		}
		?>
		<div class="landing-item landing-item-add-new" style="display: <?=$arResult['IS_DELETED'] ? 'none' : 'block';?>;">
			<a class="landing-item-inner" href="<?= \htmlspecialcharsbx($urlUpFolder)?>" data-slider-ignore-autobinding="true">
			<span class="landing-item-add-new-inner">
				<span class="landing-item-add-icon landing-item-add-icon-up"></span>
				<span class="landing-item-text"><?= Loc::getMessage('LANDING_TPL_ACTION_FOLDER_UP')?></span>
			</span>
			</a>
		</div>
	<?endif;?>

	<?if ($arResult['ACCESS_SITE']['EDIT'] == 'Y'):?>
	<div class="landing-item landing-item-add-new" style="display: <?=$arResult['IS_DELETED'] ? 'none' : 'block';?>;">
		<button type="button" class="landing-item-inner" data-testid="landing-landings-page-add-btn" data-href="<?= \htmlspecialcharsbx($arParams['PAGE_URL_LANDING_ADD_PLUS_BUTTON']) ?>">
			<span class="landing-item-add-new-inner">
				<span class="landing-item-add-icon"></span>
				<span class="landing-item-text"><?= Loc::getMessage('LANDING_TPL_ACTION_ADD')?></span>
			</span>
		</button>
	</div>
	<?endif;?>

	<div class="landing-folder-placeholder"></div>

	<?if ($component->request('folderNew') === 'Y'):?>
	<form action="<?= \htmlspecialcharsbx($component->getPageParam(htmlspecialcharsback(POST_FORM_ACTION_URI), ['folderNew' => 'N']))?>" method="post" id="createFolderForm">
		<?= bitrix_sessid_post()?>
		<input type="hidden" name="action" value="addFolder" />
		<div class="landing-item landing-item-folder">
			<div class="landing-title">
				<div class="landing-title-wrap">
					<div class="landing-title-overflow --create-folder-input">
						<input type="text" name="param" value="" data-testid="landing-landings-folder-name-input" aria-label="<?= htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_FOLDER_NAME_INPUT_LABEL'))?>" />
					</div>
				</div>
			</div>
			<div class="landing-item-cover">
				<div class="landing-item-preview">
				</div>
				<div class="landing-item-folder-corner">
					<div class="landing-item-folder-dropdown"></div>
				</div>
			</div>
		</div>
		<script>
			BX.ready(
				function() {
					let createFolderForm = document.body.querySelector('#createFolderForm');
					let createFolderText = document.body.querySelector('.--create-folder-input input');

					// suppress the blur-autosubmit while focus is moved programmatically (companion UI open/close)
					let suppressBlurSubmit = false;
					createFolderForm.suppressBlurSubmit = function(value) {
						suppressBlurSubmit = value === true;
					};

					createFolderText.focus();

					createFolderText.addEventListener('keydown', function(event) {
						if (event.key === 'Enter')
						{
							event.preventDefault();
							if (createFolderText.value.length !== 0)
							{
								createFolderForm.submit();
							}
							else
							{
								event.stopPropagation()
							}
						}
					})

					createFolderText.addEventListener('blur', function () {
						if (suppressBlurSubmit)
						{
							return;
						}
						if (createFolderText.value.length !== 0)
						{
							createFolderForm.submit();
						}
					});
				}
			);
		</script>
	</form>
	<?endif?>

<?php
foreach ($arResult['LANDINGS'] as $i => $item):

	$isFolder = array_key_exists('PARENT_ID', $item);

	if ($arParams['DRAFT_MODE'] == 'Y' && $item['DELETED'] != 'Y')
	{
		$item['ACTIVE'] = 'Y';
	}

	if ($isFolder)
	{
		$accessSite = $arResult['ACCESS_SITE'];
		$urlEditFolder = str_replace('#folder_edit#', $item['ID'], $arParams['~PAGE_URL_FOLDER_EDIT']);
	}
	else
	{
		$areaCode = '';
		$areaTitle = '';
		$accessSite = $arResult['ACCESS_SITE'];
		$urlSettings = new Uri(str_replace('#landing_edit#', $item['ID'], $arParams['~PAGE_URL_LANDING_SETTINGS']));
		$urlSettings->addParams([
			'PAGE' => 'LANDING_EDIT',
		]);
		$urlSettings = $urlSettings->getUri();

		$urlEdit = str_replace('#landing_edit#', $item['ID'], $arParams['~PAGE_URL_LANDING_EDIT']);
		$urlEditDesign = str_replace('#landing_edit#', $item['ID'], $arParams['~PAGE_URL_LANDING_DESIGN']);
		$urlView = str_replace('#landing_edit#', $item['ID'], $arParams['~PAGE_URL_LANDING_VIEW']);

		$uriCopy = new Uri($arResult['CUR_URI']);
		$uriCopy->addParams(array(
			'action' => 'copy',
			'param' => $item['ID'],
			'sessid' => bitrix_sessid()
		));

		$uriMove = new Uri($arResult['CUR_URI']);
		$uriMove->addParams(array(
			'action' => 'move',
			'param' => $item['ID'],
			'sessid' => bitrix_sessid()
		));

		if ($item['IS_AREA'])
		{
			$areaCode = $item['AREA_CODE'];
			$areaTitle = Loc::getMessage('LANDING_TPL_AREA_'.mb_strtoupper($item['AREA_CODE']));
		}
		else if ($item['IS_HOMEPAGE'])
		{
			$areaCode = 'main_page';
			$areaTitle = Loc::getMessage('LANDING_TPL_AREA_MAIN_PAGE');
			if ($arParams['TYPE'] === 'GROUP')
			{
				$accessSite['DELETE'] = 'N';
			}
		}

		if (in_array($item['ID'], $arResult['DELETE_LOCKED']))
		{
			$accessSite['DELETE'] = 'N';
		}
	}

	if (
		\Bitrix\Main\Loader::includeModule('catalog')
		&& \Bitrix\Catalog\Config\State::isExternalCatalog()
	)
	{
		if (
			$accessSite['PUBLICATION'] === 'Y'
			&& $arParams['TYPE'] === 'STORE'
			&& isset($arResult['SITES'][$arParams['SITE_ID']])
			&& !str_starts_with($arResult['SITES'][$arParams['SITE_ID']]['TPL_CODE'], 'store-chats')
		)
		{
			$accessSite['PUBLICATION'] = 'N';
		}
	}
	?>
	<?if ($isFolder):?>
		<div class="landing-item landing-item-folder<?
			?><?= $item['ACTIVE'] !== 'Y' || $item['DELETED'] !== 'N' ? ' landing-item-unactive' : '' ?><?
			?><?= $item['DELETED'] === 'Y' ? ' landing-item-deleted' : '';?>"
			title="<?= htmlspecialcharsbx($item['TITLE']);?>"
		>
			<div class="landing-title">
				<div class="landing-title-wrap" title="<?= htmlspecialcharsbx($item['TITLE']);?>">
					<div class="landing-title-overflow"><?= htmlspecialcharsbx($item['TITLE']);?></div>
				</div>
			</div>
			<div class="landing-item-cover">
				<div class="landing-item-preview">
					<?foreach ($item['FOLDER_PREVIEW'] as $picture):?>
						<div class="landing-item-preview-item" style="background-image: url(<?= htmlspecialcharsbx(\Bitrix\Landing\Sanitizer::sanitizeCssUrl($picture));?>);"></div>
					<?endforeach;?>
				</div>
				<div class="landing-item-folder-corner">
					<button type="button" class="landing-item-folder-dropdown"
						 data-testid="landing-landings-folder-menu-btn"
						 aria-haspopup="menu"
						 aria-expanded="false"
						 aria-label="<?= htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_ACTIONS_ARIA_FOLDER', ['#TITLE#' => $item['TITLE']])) ?>"
						 onclick="showTileMenu(this,{
									viewSite: '',
									ID: '<?= htmlspecialcharsbx(CUtil::jsEscape((string)$item['ID'])) ?>',
									siteId: '<?= htmlspecialcharsbx(CUtil::jsEscape((string)$item['SITE_ID'])) ?>',
							 		siteType: '<?= Metrika\Tools::getBySiteType($arParams['TYPE'])->value?>',
									title: '<?= \htmlspecialcharsbx(\CUtil::jsEscape($item['TITLE']));?>',
									createPageUrl: '<?= htmlspecialcharsbx(CUtil::jsEscape($arParams['PAGE_URL_LANDING_ADD_FOLDER_MENU'])) ?>',
									publicUrl: '',
									copyPage: '',
									deletePage: '',
									editPage: '<?= htmlspecialcharsbx(CUtil::jsEscape($urlEditFolder)) ?>',
							 		isFolder: true,
									isActive: <?= ($item['ACTIVE'] === 'Y') ? 'true' : 'false' ?>,
							 		isDeleted: <?= ($item['DELETED'] == 'Y') ? 'true' : 'false';?>,
							 		wasModified: false,
									isEditDisabled: true,
									isSettingsDisabled: <?= ($accessSite['SETTINGS'] !== 'Y') ? 'true' : 'false' ?>,
									isPublicationDisabled: <?= ($accessSite['PUBLICATION'] !== 'Y') ? 'true' : 'false' ?>,
									isDeleteDisabled: <?= ($accessSite['DELETE'] !== 'Y') ? 'true' : 'false' ?>
								}, event)">
						<span class="landing-item-folder-dropdown-inner"></span>
					</button>
				</div>
			</div>
			<?if ($item['DELETED'] == 'Y'):?>
			<span class="landing-item-link"></span>
			<?else:?>
			<a href="<?= htmlspecialcharsbx(\Bitrix\Landing\Sanitizer::sanitizeHrefScheme($component->getUri([$arParams['ACTION_FOLDER'] => $item['ID']], ['folderUp'])));?>" data-slider-ignore-autobinding="true" class="landing-item-link" data-testid="landing-landings-folder-link"><span class="landing-visually-hidden"><?= htmlspecialcharsbx($item['TITLE'])?></span></a>
			<?endif;?>
		</div>
	<?else:?>
		<div class="landing-item<?php
			?><?= $item['ACTIVE'] !== 'Y' || $item['DELETED'] !== 'N' ? ' landing-item-unactive' : '' ?><?php
			?><?= $item['DELETED'] === 'Y' ? ' landing-item-deleted' : '' ?>">
			<div class="landing-item-inner">
				<div class="landing-title">
					<button type="button" class="landing-title-btn"
						 data-testid="landing-landings-page-menu-btn"
						 aria-haspopup="menu"
						 aria-expanded="false"
						 aria-label="<?= htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_ACTIONS_ARIA_PAGE', ['#TITLE#' => $item['TITLE']])) ?>"
						 onclick="showTileMenu(this,{
							viewSite: '<?= htmlspecialcharsbx(CUtil::jsEscape($urlView)) ?>',
							ID: '<?= htmlspecialcharsbx(CUtil::jsEscape((string)$item['ID'])) ?>',
							siteId: '<?= htmlspecialcharsbx(CUtil::jsEscape((string)$item['SITE_ID'])) ?>',
							siteType: '<?= Metrika\Tools::getBySiteType($arParams['TYPE'])->value?>',
							title: '<?= \htmlspecialcharsbx(\CUtil::jsEscape($item['TITLE']));?>',
							isArea: <?= $item['IS_AREA'] ? 'true' : 'false' ?>,
					        isMainPage: <?= $item['IS_HOMEPAGE'] ? 'true' : 'false' ?>,
							publicUrl: '<?= htmlspecialcharsbx(CUtil::jsEscape($item['PUBLIC_URL'])) ?>',
							copyPage: '<?= htmlspecialcharsbx(CUtil::jsEscape($uriCopy->getUri())) ?>',
							movePage: '<?= htmlspecialcharsbx(CUtil::jsEscape($uriMove->getUri())) ?>',
							deletePage: '#',
							settings: '<?= htmlspecialcharsbx(CUtil::jsEscape($urlSettings)) ?>',
					        isFolder: false,
					        isActive: <?= ($item['ACTIVE'] === 'Y') ? 'true' : 'false' ?>,
					        isDeleted: <?= ($item['DELETED'] === 'Y') ? 'true' : 'false' ?>,
							wasModified: <?= ($item['WAS_MODIFIED'] === 'Y') ? 'true' : 'false' ?>,
							isEditDisabled: <?= ($accessSite['EDIT'] !== 'Y') ? 'true' : 'false' ?>,
							isSettingsDisabled: <?= ($accessSite['SETTINGS'] !== 'Y') ? 'true' : 'false' ?>,
							isPublicationDisabled: <?= ($accessSite['PUBLICATION'] !== 'Y') ? 'true' : 'false' ?>,
							isDeleteDisabled: <?= ($accessSite['DELETE'] !== 'Y') ? 'true' : 'false' ?>
						}, event)">
						<span class="landing-title-btn-inner"><?= Loc::getMessage('LANDING_TPL_ACTIONS') ?></span>
					</button>
					<div class="landing-title-wrap" title="<?= htmlspecialcharsbx($item['TITLE']);?>">
						<div class="landing-title-overflow"><?= htmlspecialcharsbx($item['TITLE']) ?></div>
					</div>
				</div>
				<?if ($item['IS_HOMEPAGE']):?>
					<div class="landing-item-desc">
						<span class="landing-item-desc-text"><?= htmlspecialcharsbx($areaTitle) ?></span>
					</div>
				<?php endif;?>
				<div class="landing-item-cover<?= $item['IS_AREA'] ? ' landing-item-cover-area' : '' ?>"
					<?php if ($item['PREVIEW'] && !$item['IS_AREA']) :?>
						style="background-image: url(<?= htmlspecialcharsbx(\Bitrix\Landing\Sanitizer::sanitizeCssUrl($item['PREVIEW'])) ?>);"
						<?php if (
							$item['PUBLISHED']
							&& ($item['CLOUD_PREVIEW'] ?? null)
							&& ($item['CLOUD_PREVIEW'] !== $item['PREVIEW'])
						) :?>
							data-cloud-preview="<?= htmlspecialcharsbx(\Bitrix\Landing\Sanitizer::sanitizeCssUrl($item['CLOUD_PREVIEW'])) ?>"
						<?php endif; ?>
					<?php endif; ?>
				>
					<?if ($item['IS_HOMEPAGE'] || $item['IS_AREA']):?>
					<div class="landing-item-area">
						<div class="landing-item-area-icon<?=' landing-item-area-icon-' . htmlspecialcharsbx($areaCode) ?>"></div>
						<?if ($item['IS_AREA']):?>
							<span class="landing-item-area-text"><?= htmlspecialcharsbx($areaTitle);?></span>
						<?php endif;?>
					</div>
					<?php endif;?>
				</div>
			</div>
			<?if ($item['DELETED'] == 'Y'):?>
				<span class="landing-item-link"></span>
			<?elseif ($arParams['TILE_MODE'] == 'view' && $item['PUBLIC_URL']):?>
				<a href="<?= htmlspecialcharsbx(\Bitrix\Landing\Sanitizer::sanitizeHrefScheme($item['PUBLIC_URL']));?>" class="landing-item-link" target="_top" data-testid="landing-landings-page-link"><span class="landing-visually-hidden"><?= htmlspecialcharsbx($item['TITLE'])?></span></a>
			<?elseif ($urlView):?>
				<a href="<?= htmlspecialcharsbx(\Bitrix\Landing\Sanitizer::sanitizeHrefScheme($urlView));?>" class="landing-item-link" target="_top" data-testid="landing-landings-page-link"><span class="landing-visually-hidden"><?= htmlspecialcharsbx($item['TITLE'])?></span></a>
			<?else:?>
				<span class="landing-item-link"></span>
			<?endif;?>
			<?if ($arParams['DRAFT_MODE'] != 'Y' || $item['DELETED'] == 'Y'):?>
			<div class="landing-item-status-block">
				<div class="landing-item-status-inner">
					<?if ($item['DELETED'] == 'Y'):?>
						<span class="landing-item-status landing-item-status-unpublished"><?= Loc::getMessage('LANDING_TPL_DELETED');?></span>
					<?elseif ($item['ACTIVE'] != 'Y'):?>
						<span class="landing-item-status landing-item-status-unpublished"><?= Loc::getMessage('LANDING_TPL_UNPUBLIC');?></span>
					<?else:?>
						<span class="landing-item-status landing-item-status-published"><?= Loc::getMessage('LANDING_TPL_PUBLIC');?></span>
					<?endif;?>
					<?if ($item['DELETED'] == 'Y'):?>
						<span class="landing-item-status landing-item-status-changed">
							<?= Loc::getMessage('LANDING_TPL_TTL_DELETE');?>:
							<?= $item['DATE_DELETED_DAYS'];?>
							<?= Loc::getMessage('LANDING_TPL_TTL_DELETE_D');?>
						</span>
					<?elseif ($item['DATE_MODIFY_UNIX'] > $item['DATE_PUBLIC_UNIX']):?>
						<span class="landing-item-status landing-item-status-changed">
							<?= Loc::getMessage('LANDING_TPL_MODIF');?>
						</span>
					<?endif;?>

				</div>
			</div>
			<?endif;?>
		</div>
	<?endif;?>
<?endforeach;?>

	</div>
</div>

<?if ($arResult['NAVIGATION']->getPageCount() > 1):?>
	<div class="<?= (defined('ADMIN_SECTION') && ADMIN_SECTION === true) ? '' : 'landing-navigation';?>">
		<?$APPLICATION->IncludeComponent(
			'bitrix:main.pagenavigation',
			'',//grid
			array(
				'NAV_OBJECT' => $arResult['NAVIGATION'],
				'SEF_MODE' => 'N',
				'BASE_LINK' => $arResult['CUR_URI']
			),
			false
		);?>
	</div>
<?endif;?>

<script>
	(() => {
		const sliderConditions = <?= CUtil::phpToJSObject($sliderConditions);?>;
		if (sliderConditions.length > 0)
		{
			BX.SidePanel.Instance.bindAnchors(
				top.BX.clone({
					rules: [
						{
							condition: sliderConditions,
							stopParameters: [
								'action',
								'folderUp',
								'fields%5Bdelete%5D',
								'nav'
							],
							options: {
								allowChangeHistory: false,
								events: {
									onOpen: function(event)
									{
										if (BX.hasClass(BX('landing-create-element'), 'ui-btn-disabled'))
										{
											event.denyAction();
										}
									}
								}
							}
						},
					]
				})
			);
		}

		const sliderFullConditions = <?= CUtil::phpToJSObject($sliderFullConditions);?>;
		if (sliderFullConditions.length > 0)
		{
			BX.SidePanel.Instance.bindAnchors(
				top.BX.clone({
					rules: [
						{
							condition: sliderFullConditions,
							options: {
								allowChangeHistory: false,
								cacheable: false,
								customLeftBoundary: 0,
							}
						},
					]
				})
			);
		}

		const sliderShortConditions = <?= CUtil::phpToJSObject($sliderShortConditions);?>;
		if (sliderShortConditions.length > 0)
		{
			BX.SidePanel.Instance.bindAnchors(
				top.BX.clone({
					rules: [
						{
							condition: sliderShortConditions,
							options: {
								allowChangeHistory: false,
								cacheable: false,
								width: 800
							}
						}
					]
				})
			);
		}
	})();
</script>
<script>
	// + button open page add slider
	BX.bind(document.querySelector('.landing-item-add-new button.landing-item-inner'), 'click', event => {
		BX.SidePanel.Instance.open(event.currentTarget.dataset.href, {
			allowChangeHistory: false,
			<?php
				echo $component->isUseNewMarket() ? 'customLeftBoundary: 0,' : '';
				echo $component->isUseNewMarket() ? 'cacheable: false,' : '';
			?>
		});
	});

	var tileGrid;
	var isMenuShown = false;
	var menu;

	BX.ready(function ()
	{
		const wrapper = BX('grid-tile-wrap');
		const title_list = Array.prototype.slice.call(wrapper.getElementsByClassName('landing-item'));

		tileGrid = new BX.Landing.TileGrid({
			wrapper: wrapper,
			siteId: <?= $arParams['SITE_ID'];?>,
			siteType: '<?= htmlspecialcharsbx(CUtil::jsEscape((string)$arParams['TYPE'])) ?>',
			inner: BX('grid-tile-inner'),
			tiles: title_list,
			sizeSettings : {
				minWidth : 280,
				maxWidth: 330
			}
		});

		// init previews
		const previews = document.querySelectorAll('.landing-item-cover[data-cloud-preview]');
		previews.forEach(item => lazyLoadCloudPreview(item));
		function lazyLoadCloudPreview(item)
		{
			const cloudPreview = item.dataset.cloudPreview;
			const previewUrl =
				cloudPreview
				+ ((cloudPreview.indexOf('?') > 0) ? '&' : '?')
				+ 'refreshed' + (Date.now()/86400000|0)
			;
			const xhr = new XMLHttpRequest();
			xhr.open("HEAD", previewUrl);
			xhr.onload = () => {
				const expires = xhr.getResponseHeader("expires");
				if (
					expires
					&& (new Date(expires)) <= (new Date())
				)
				{
					setTimeout(lazyLoadCloudPreview, 3000, item);
				}
				else
				{
					item.style.backgroundImage = 'url(' + previewUrl + ')';
				}
			};
			xhr.send();
		}

		// disable some buttons for deleted
		var createFolderEl = BX('landing-create-folder');
		var createElement = BX('landing-create-element');

		<?if ($arResult['IS_DELETED']):?>
		if (createFolderEl)
		{
			BX.addClass(createFolderEl, 'ui-btn-disabled');
		}
		if (createElement)
		{
			BX.addClass(createElement, 'ui-btn-disabled');
		}
		<?else:?>
		if (createFolderEl)
		{
			BX.removeClass(createFolderEl, 'ui-btn-disabled');
		}
		if (createElement)
		{
			BX.removeClass(createElement, 'ui-btn-disabled');
		}
		<?endif;?>
	});

	var landingExplorer = null;

	if (typeof showTileMenu === 'undefined')
	{
		function showTileMenu(node, params, event)
		{
			if (typeof showTileMenuCustom === 'function')
			{
				showTileMenuCustom(node, params);
				return;
			}

			var suppressTriggerRefocus = false;

			if (landingExplorer === null)
			{
				landingExplorer = new BX.Landing.Explorer({
					type: '<?= htmlspecialcharsbx(CUtil::jsEscape((string)$arParams['TYPE'])) ?>',
					siteId: <?= $arParams['SITE_ID'];?>,
					folderId: <?= (int)$arResult['FOLDER_ID'];?>,
					startBreadCrumbs: <?= \CUtil::phpToJSObject($arResult['FOLDER_PATH']);?>
				});
			}

			var menuItems = [
				params.isFolder ? null :
				{
					text: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_VIEW'));?>',
					disabled: params.isDeleted || params.isEditDisabled,
					<?if ($arParams['TILE_MODE'] == 'view'):?>
					href: params.viewSite,
					<?else:?>
					onclick: function(e, item)
					{
						window.top.location.href = params.viewSite;
					}
					<?endif;?>
				},
				<?if ($arParams['DRAFT_MODE'] != 'Y'):?>
				{
					text: params.wasModified && params.isActive
						? '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_PUBLIC_CHANGED')) ?>'
						: (
							params.isFolder
							? '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_PUBLIC_FOLDER_MSGVER_1')) ?>'
							: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_PUBLIC')) ?>'
						),
					disabled: params.isDeleted || params.isPublicationDisabled || (!params.wasModified && params.isActive),
					onclick: function(event)
					{
						event.preventDefault();

						var successFunction = function()
						{
							if (params.isFolder)
							{
								tileGrid.action(
									'Site::publicationFolder',
									{
										folderId: params.ID
									}
								);
							}
							else
							{
								tileGrid.action('Landing::publication',
									{
										lid: params.ID
									},
									null,
									'<?= CUtil::jsEscape($this->getComponent()->getName());?>'
								);
							}
						};

						if (!params.isActive && <?= $arResult['AGREEMENT'] ? 'true' : 'false';?>)
						{
							landingAgreementPopup({
								success: successFunction
							});
							return;
						}
						else
						{
							successFunction();
							this.popupWindow.close();
						}
						menu.destroy();
					}
				},
				{
					text: params.isFolder
						? '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_UNPUBLIC_FOLDER_MSGVER_1')) ?>'
						: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_UNPUBLIC')) ?>'
					,
					disabled: params.isDeleted || params.isPublicationDisabled || !params.isActive,
					onclick: function(event)
					{
						event.preventDefault();

						var successFunction = function()
						{
							if (params.isFolder)
							{
								tileGrid.action(
									'Site::unPublicFolder',
									{
										folderId: params.ID
									}
								);
							}
							else
							{
								tileGrid.action(
									'Landing::unpublic',
									{
										lid: params.ID
									},
									null,
									'<?= CUtil::jsEscape($this->getComponent()->getName());?>'
								);
							}
						};

						successFunction();
						this.popupWindow.close();
						menu.destroy();
					}
				},
				<?endif;?>
				!params.isFolder ? null :
				{
					text: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_ADD_PAGE'));?>',
					href: BX.util.add_url_param(
						params.createPageUrl,
						{
							folderId: params.ID
						}
					)
				},
				params.isFolder ? null :
				{
					text: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_GOTO'));?>',
					className: 'landing-popup-menu-item-icon',
					href: params.publicUrl,
					target: '_blank',
					disabled: params.isArea || params.isDeleted || !params.isActive || !params.publicUrl,
					onclick: function(event)
					{
						if (top.window !== window)
						{
							event.preventDefault();
							top.window.location.href = params.publicUrl;
						}
					}
				},
				params.isFolder ? null :
				{
					text: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_COPYLINK'));?>',
					className: 'landing-popup-menu-item-icon',
					disabled: params.isArea || params.isDeleted || !params.publicUrl,
					onclick: function(e, item)
					{
						if (BX.clipboard.isCopySupported())
						{
							BX.clipboard.copy(params.publicUrl);
						}
						var menuItem = item.layout.item;
						menuItem.classList.add('landing-link-copied');

						BX.bind(menuItem.childNodes[0], 'transitionend', function ()
						{
							setTimeout(function()
							{
								this.popupWindow.close();
								menuItem.classList.remove('landing-link-copied');
								menu.destroy();
								isMenuShown = false;
							}.bind(this),250);

						}.bind(this));
					}
				},
				params.isFolder && <?= $arParams['DRAFT_MODE'] === 'Y' ? 'true' : 'false'?> ? null : {
					delimiter: true
				},
				{
					text: params.isFolder
							? '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_EDIT_FOLDER_MSGVER_1')) ?>'
							: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_EDIT_2')) ?>',
					href: params.isFolder ? params.editPage : params.settings,
					disabled: params.isDeleted || params.isSettingsDisabled,
					onclick: function()
					{
						if (!params.isFolder)
						{
							BX.UI.Analytics.sendData({
								tool: params.siteType,
								category: 'settings',
								event: 'open',
								c_section: 'page_list',
								p3: `siteID_${params.siteId}`,
							});
						}
						suppressTriggerRefocus = true;
						this.popupWindow.close();
					}
				},
				params.isFolder ? null :
				{
					delimiter: true
				},
				params.isFolder ? null :
				{
					text: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_COPY'));?>',
					disabled: params.isDeleted || (params.isFolder && <?= !$folderId ? 'true' : 'false';?>) || params.isEditDisabled,
					onclick: function(event)
					{
						event.preventDefault();
						landingExplorer.copy({ ID: parseInt(params.ID), TITLE: params.title});
						suppressTriggerRefocus = true;
						this.popupWindow.close();
					}
				},
				{
					text: params.isFolder
							? '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_MOVE_FOLDER'));?>'
							: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_MOVE'));?>',
					disabled: params.isDeleted || (params.isEditDisabled && !params.isFolder) || params.isDeleteDisabled || params.isMainPage,
					onclick: function(event)
					{
						event.preventDefault();
						if (params.isFolder)
						{
							landingExplorer.moveFolder({ ID: parseInt(params.ID), TITLE: params.title});
						}
						else
						{
							landingExplorer.move({ ID: parseInt(params.ID), TITLE: params.title});
						}
						suppressTriggerRefocus = true;
						this.popupWindow.close();
					}
				},
				{
					delimiter: true
				},
				{
					text: params.isDeleted
						? (
							params.isFolder
							? '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_UNDELETE_FOLDER'));?>'
							: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_UNDELETE'));?>'
						)
						: (
							params.isFolder
							? '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_DELETE_FOLDER'));?>'
							: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_DELETE'));?>'
						),
					href: params.deletePage,
					disabled: params.isDeleteDisabled,
					onclick: function(event)
					{
						event.preventDefault();

						suppressTriggerRefocus = true;
						this.popupWindow.close();
						menu.destroy();

						if (params.isDeleted)
						{
							tileGrid.action(
								params.isFolder ? 'Site::markFolderUnDelete' : 'Landing::markUnDelete',
								params.isFolder ? { id: params.ID } : { lid: params.ID }
							);
						}
						else
						{
							BX.Landing.UI.Tool.ActionDialog.getInstance()
								.show({
									content: '<?= CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_REC_CONFIRM'));?>'
								})
								.then(
									function() {
										tileGrid.action(
											params.isFolder ? 'Site::markFolderDelete' : 'Landing::markDelete',
											params.isFolder ? { id: params.ID } : { lid: params.ID }
										);
									},
									function() {

									}
								);
						}
					}
				}
			];

			if (!isMenuShown) {
				menu = new BX.PopupMenuWindow(
					'landing-popup-menu' + params.ID,
					node,
					menuItems,
					{
						autoHide : true,
						offsetTop: -2,
						offsetLeft: -55,
						className: 'landing-popup-menu',
						events: {
							onPopupClose: function onPopupClose() {
								node.setAttribute('aria-expanded', 'false');
								if (!suppressTriggerRefocus && node.isConnected) {
									node.focus({ preventScroll: true });
								}
								menu.destroy();
								isMenuShown = false;
							},
						},
					}
				);
				menu.show();

				node.setAttribute('aria-expanded', 'true');
				var openedWithKeyboard = !!event && event.detail === 0;
				if (openedWithKeyboard && typeof menu.getNavigation === 'function' && menu.getNavigation()) {
					menu.getNavigation().focusFirst();
				}

				isMenuShown = true;
			}
			else
			{
				menu.close();
				isMenuShown = false;
			}
		}
	}

	if (window.location.hash === '#createPage')
	{
		window.location.hash = '';
		var addButton = document.querySelector('.landing-item-add-new .landing-item-inner');

		if (BX.type.isDomNode(addButton))
		{
			addButton.click();
		}
	}

</script>

<?if ($request->get('IS_AJAX') != 'Y'):?>
	<script>
		top.BX.addCustomEvent(
			'BX.Rest.Configuration.Install:onFinish',
			function(event)
			{
				if (!!event.data.elementList && event.data.elementList.length > 0)
				{
					let gotoSiteButton = null;
					for (let i = 0; i < event.data.elementList.length; i++)
					{
						gotoSiteButton = event.data.elementList[i];
						if (gotoSiteButton.tagName !== 'A')
						{
							continue;
						}

						const replaces = [];
						let sitePath = '<?= CUtil::jsEscape($arParams['PAGE_URL_LANDING_VIEW']) ?>';

						if (
							gotoSiteButton.dataset.isLanding
							&& gotoSiteButton.dataset.isLanding === 'Y'
						)
						{
							replaces.push([/#landing_edit#/, gotoSiteButton.dataset.landingId]);
						}

						const href = gotoSiteButton.getAttribute('href');
						if (href && href.substr(0, 1) === '#')
						{
							replaces.forEach(function(replace) {
								sitePath = sitePath.replace(replace[0], replace[1]);
							});
							sitePath += '?newLanding=Y';

							gotoSiteButton.setAttribute('href', sitePath);
							setTimeout(() => {window.location.href = sitePath}, 3000);
						}
					}
				}

				BX.onCustomEvent('BX.Landing.Filter:apply');
			}
		);
	</script>
<?endif?>

<?php
if ($arResult['AGREEMENT'])
{
	include \Bitrix\Landing\Manager::getDocRoot() .
			'/bitrix/components/bitrix/landing.start/templates/.default/popups/agreement.php';
}
