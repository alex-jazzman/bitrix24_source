<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var \LandingPubComponent $component */
/** @var array $arResult */
/** @var array $arParams */

use \Bitrix\Landing\Config;
use \Bitrix\Landing\Hook;
use \Bitrix\Landing\Landing\View;
use \Bitrix\Landing\Manager;
use \Bitrix\Landing\Rights;
use \Bitrix\Main\Localization\Loc;
use \Bitrix\Landing\Assets;
use \Bitrix\Main\UI\Extension;

Loc::loadMessages(__FILE__);

$this->setFrameMode(true);

if (isset($arResult['LANDING']))
{
	$landing = $arResult['LANDING'];/** @var \Bitrix\Landing\Landing $landing */
	$b24Installed = \Bitrix\Main\ModuleManager::isModuleInstalled('bitrix24');
	$formEditor = $arResult['SPECIAL_TYPE'] == \Bitrix\Landing\Site\Type::PSEUDO_SCOPE_CODE_FORMS;
	$masterFrame = $component->request('master') == 'Y' && Rights::hasAccessForSite(
		$landing->getSiteId(), Rights::ACCESS_TYPES['edit']
	);
}

// Tool availability (by intranet settings) - only kb
if ($arParams['TYPE'] === 'KNOWLEDGE' || $arParams['TYPE'] === 'GROUP')
{
	if (!$component->isToolAvailable())
	{
		echo $component->getToolUnavailableInfoScript();
	}
}

Manager::setPageTitle(
	Loc::getMessage('LANDING_TPL_TITLE')
);

if ($arResult['ERRORS'])
{
	include 'error.php';
	return;
}

// load extensions
$extensions = ['ui.fonts.opensans'];
if ($arParams['TYPE'] === 'KNOWLEDGE' || $arParams['TYPE'] === 'GROUP')
{
	$extensions[] = 'ui.entity-selector';
}
if (
	$arParams['SHOW_EDIT_PANEL'] == 'Y' ||
	!$landing->getDomainId()// wiki mode
)
{
	$extensions[] = 'landing.wiki.public';
	$extensions[] = 'ui.viewer';
}
if ($b24Installed)
{
	$extensions[] = 'landing.metrika';
}
$extensions[] = 'sidepanel';

Extension::load($extensions);

// check frame parameter outside the frame
if ($component->request('IFRAME'))
{
	?>
	<script>
		(function()
		{
			if (top.window.location.href === window.location.href)
			{
				top.window.location.href = BX.Uri.removeParam(
					top.window.location.href,
					'IFRAME'
				);
			}
			else if (window.location.hash.indexOf('#landingId') === 0)
			{
				window.location.hash = '';
			}
		})();
	</script>
	<?php
}
?>

<?php
// shop master frame
if ($masterFrame)
{
	\Bitrix\Landing\Manager::setPageView(
		'BodyTag',
		'style="pointer-events: none; user-select: none;"'
	);
	echo '<style>.b24-widget-button-wrapper, .catalog-cart-block {display: none;}</style>';
}

// edit menu
if ($arParams['SHOW_EDIT_PANEL'] === 'Y')
{
	Extension::load([
		'ui.buttons',
		'ui.buttons.icons',
		'ui.hint'
	]);
	ob_start(function($content)
	{
		Manager::setPageView('AfterBodyOpen',$content);
	});
	$allMess = Loc::loadLanguageFile(__FILE__);
	$setMessForJS = [];
	$setMessForJS['LANDING_TPL_PUB_COPIED_LINK'] = $allMess['LANDING_TPL_PUB_COPIED_LINK'];
	// the phrases ship in ru only, and an `aria-label` with nothing in it names nothing
	$ariaLabel = static function(?string $phrase): string
	{
		$phrase = (string)$phrase;
		if ($phrase === '')
		{
			return '';
		}

		return 'aria-label="' . \htmlspecialcharsbx($phrase) . '"';
	};
	?>
	<div class="landing-pub-top-panel-wrapper">
		<div class="landing-pub-top-panel">
			<div class="landing-pub-top-panel-left">
				<div class="landing-pub-top-panel-nav-buttons">
					<button
						type="button"
						class="landing-pub-top-panel-back ui-btn ui-btn-xs ui-btn-icon-back ui-btn-link ui-btn-light"
						<?= $ariaLabel(Loc::getMessage('LANDING_TPL_PUB_NAV_BACK'))?>
						data-testid="pub-panel-back"
					></button>
					<button
						type="button"
						class="landing-pub-top-panel-forward ui-btn ui-btn-xs ui-btn-icon-back ui-btn-link ui-btn-light"
						<?= $ariaLabel(Loc::getMessage('LANDING_TPL_PUB_NAV_FORWARD'))?>
						data-testid="pub-panel-forward"
					></button>
				</div>
				<div class="landing-pub-top-panel-separator"></div>
				<div class="landing-pub-top-panel-chain">
					<?php $title = $component->getMessageType('LANDING_TPL_SITES');?>
					<span class="ui-btn ui-btn-xs ui-btn-light ui-btn-round landing-pub-top-panel-chain-link" style="pointer-events: none" title="<?= $title?>">
						<?= $title?>
					</span>
					<strong class="landing-pub-top-panel-chain-separator"><span></span></strong>
					<?php $title = \htmlspecialcharsbx($landing->getTitle());?>
					<span class="ui-btn ui-btn-xs ui-btn-light ui-btn-round landing-pub-top-panel-chain-link landing-pub-top-panel-chain-link-page" data-hint="<?= $title?>" data-hint-no-icon>
						<?= $title?>
					</span>
				</div>
				<div class="landing-pub-top-panel-page-link">
					<span class="landing-page-link-btn"></span>
				</div>
			</div>
			<div class="landing-pub-top-panel-right">
				<button
					type="button"
					class="landing-pub-top-panel-unique-view"
					aria-expanded="false"
					aria-controls="landing-pub-unique-view-popup"
					data-testid="pub-panel-unique-view"
				>
					<span class="ui-icon-set --person" aria-hidden="true"></span>
					<?php $viewsLabel = (string)$component->getMessageType('LANDING_TPL_VIEWS');?>
					<span class="landing-pub-visually-hidden"><?= \htmlspecialcharsbx($viewsLabel)?></span>
					<span>
						<?= View::getNumberUniqueViews($landing->getId())?>
					</span>
				</button>
				<div class="landing-pub-top-panel-unique-view-popup hide" id="landing-pub-unique-view-popup">
					<div class="landing-pub-top-panel-unique-view-popup-header">
						<?= \htmlspecialcharsbx($viewsLabel)?>
					</div>
					<div class="landing-pub-top-panel-unique-view-popup-item-container"></div>
				</div>
				<div class="landing-pub-top-panel-total-view">
					<div class="ui-icon-set --opened-eye"></div>
					<div>
						<?= View::getNumberTotalViews($landing->getId())?>
					</div>
				</div>
				<?php if($arResult['CAN_EDIT'] === 'Y'): ?>
					<div class="landing-pub-top-panel-actions">
						<a href="<?= $arParams['PAGE_URL_LANDING_VIEW'];?>" data-landingId="<?= $landing->getId();?>" class="ui-btn ui-btn-primary ui-btn-icon-edit landing-pub-top-panel-edit-button">
							<?= $component->getMessageType('LANDING_TPL_EDIT_PAGE');?>
						</a>
					</div>
				<?php endif; ?>
			</div>
		</div>
		<script>
			BX.message(<?= \CUtil::PhpToJSObject($setMessForJS)?>);
			var userData = <?= \CUtil::PhpToJSObject(View::getUniqueUserData($landing->getId()))?>;
			var data = [];
			data.userData = userData;
			BX.ready(function() {
				void new BX.Landing.Pub.TopPanel(data);
			});
		</script>
	</div>
	<?php
	ob_end_flush();
}

if ($arResult['SEARCH_RESULT_QUERY'])
{
	if (!$component->isAjax())
	{
		?>
		<script>
			BX.ready(function() {
				void new BX.Landing.Pub.SearchResult();
			});
		</script>
		<?php
	}
}

if ($component->request('ts'))
{
	?>
	<script>
		BX.ready(function() {
			void new BX.Landing.Pub.TimeStamp();
		});
	</script>
	<?php
}


if ($arParams['TYPE'] === 'KNOWLEDGE' || $arParams['TYPE'] === 'GROUP')
{
	?>
	<script>
		BX.ready(function() {
			void new BX.Landing.Pub.DiskFile();
		});
	</script>
	<?php
}

// landing view
$landing->view([
	'check_permissions' => false
]);

// available view
$check = \Bitrix\Landing\Restriction\Manager::isAllowed(
	'limit_knowledge_base_number_page_view',
	['ID' => $landing->getSiteId()]
);
if (!$check)
{
	// Both go through page properties and not through this place in the output: the branch runs
	// after `$landing->view()`, so anything printed here lands inside the content area, which is
	// exactly what the state dims. `AfterBodyOpen` puts the message above the content, where it
	// stays readable, and `BodyClass` puts the state on the document before any script runs.
	$viewLimitMessage = (string)Loc::getMessage('LANDING_TPL_PUB_VIEW_LIMIT');
	if ($viewLimitMessage !== '')
	{
		Manager::setPageView(
			'AfterBodyOpen',
			'<div class="landing-pub-view-limit" data-testid="pub-view-limit-alert">'
			. \htmlspecialcharsbx($viewLimitMessage)
			. '</div>'
		);
	}
	Manager::setPageView('BodyClass', 'landing-mode-view-limit');
	?>
	<script>
		BX.ready(function()
		{
			// printing `BodyClass` is a convention of the site template, and the template is an
			// option of the portal: the state reaches the document from here as well
			document.body.classList.add('landing-mode-view-limit');
			// everything the page arrived with except the message goes out of reach at once; the
			// slider opened below is appended afterwards and stays usable
			var message = document.querySelector('.landing-pub-view-limit');
			[].slice.call(document.body.children).forEach(function(node) {
				if (node !== message)
				{
					node.setAttribute('inert', '');
				}
			});
			// a browser that does not know the attribute still draws the content dimmed, because the
			// selector alone is enough for that, and leaves it clickable: there the state has to stop
			// the click the way it did before, and only inside what is marked
			if (!('inert' in HTMLElement.prototype))
			{
				document.addEventListener('click', function(e) {
					if (e.target && e.target.closest && e.target.closest('[inert]') !== null)
					{
						e.stopPropagation();
						e.preventDefault();
					}
				}, true);
			}
			top.BX.UI.InfoHelper.show('limit_knowledge_base_number_page_view');
		});
	</script>
	<?php
}

// assets
$assets = Assets\Manager::getInstance();
$assets->addAsset(
		'landing_public',
		Assets\Location::LOCATION_AFTER_TEMPLATE
);
$viewMode = $component->isPreviewMode() ? 'preview' : 'view';
$publicModeInit = '
	BX.namespace("BX.Landing");
	BX.Landing.getMode = () => "' . $viewMode . '";
';
$assets->addString(
	"<script>{$publicModeInit}</script>",
);

// Device-preview postMessage responder (MARKER-01 present): connected ONLY for the editor
// device preview, never for a normal public render. Implements the preview (consumer) side
// of PROTO-01. The responder is a framework-independent vanilla asset (registered in
// landing/include.php as landing_device_preview_responder, no main.core dependency) because
// it runs inside the sandboxed opaque-origin preview frame. The per-request parent origin it
// validates commands against cannot be embedded in that cacheable asset, so it is handed over
// here via a global.
$devicePreviewParentOrigin = $arResult['DEVICE_PREVIEW_PARENT_ORIGIN'] ?? '';
if ($devicePreviewParentOrigin !== '')
{
	// The storage shim that makes the opaque origin survivable is injected by the component
	// itself (LandingPubComponent::injectDevicePreviewShim): it has to sit at the very top of
	// <head>, which this template can no longer reach.
	$expectedOriginJs = json_encode(
		$devicePreviewParentOrigin,
		JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP
	);
	$assets->addString(
		'<script data-role="landing-device-preview-responder-origin">'
		. 'window.landingDevicePreviewExpectedOrigin=' . $expectedOriginJs . ';'
		. '</script>'
	);
	$assets->addAsset(
		'landing_device_preview_responder',
		Assets\Location::LOCATION_AFTER_TEMPLATE
	);
}
$assets->addAsset(
	Config::get('js_core_public'),
	Assets\Location::LOCATION_KERNEL
);
$assets->addAsset('landing_critical_grid', Assets\Location::LOCATION_BEFORE_ALL);
?>
<?php if ($viewMode === 'preview' && $component->request('scrollTo')):?>
<script>
	const scrollToElementId = '<?= CUtil::JSEscape(htmlspecialcharsbx($component->request('scrollTo')))?>';
	const scrollToElement = document.getElementById(scrollToElementId);

	if (scrollToElement)
	{
		scrollToElement.scrollIntoView();
	}
</script>
<?php elseif ($viewMode === 'preview'):?>
<style>
	[data-b24-crm-hello-cont] {
		display: none;
	}
</style>
<?php endif;?>

<?php if ($b24Installed):?>
<script>
	(function()
	{
		new BX.Landing.Metrika();
	})();
</script>
<?php endif;?>

<script>
	BX.ready(function() {
		void new BX.Landing.Pub.PageTransition();
	});
</script>

<?php
$hooksSite = Hook::getForSite($landing->getSiteId());
if (!$masterFrame && !$formEditor && isset($hooksSite['COPYRIGHT']))
{
	$lang = $landing->getMeta()['SITE_LANG'];
	$hooksSite['COPYRIGHT']->setLang($lang);
	$hooksSite['COPYRIGHT']->setSiteId($landing->getSiteId());
	$copyrightFooter = $hooksSite['COPYRIGHT']->view();
	if ($copyrightFooter !== '')
	{
		$assets->addAsset(
			$templateFolder . '/copyright.css',
			Assets\Location::LOCATION_AFTER_TEMPLATE
		);
		Manager::setPageView('BeforeBodyClose', $copyrightFooter);
	}
}
?>
