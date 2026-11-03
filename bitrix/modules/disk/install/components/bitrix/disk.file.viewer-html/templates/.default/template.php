<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Disk\Internal\Enum\DocumentHeaderElement;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/** @var array $arResult */
/** @var CBitrixComponentTemplate $this */

$name = (string)$arResult['NAME'];
$contentUrl = (string)$arResult['CONTENT_URL'];
$portalUrl = (string)$arResult['PORTAL_URL'];
$composition = $arResult['HEADER_COMPOSITION'];
// The header is drawn from the description and from nothing else, so an opening the server described
// none for gets no header at all - and none of what only the header and its script would use.
$hasHeader = $composition !== null;

$extensions = [
	'ui.design-tokens',
	'ui.fonts.opensans',
];
if ($hasHeader)
{
	// The header, and what the script below it uses - named here rather than left to the header's own
	// dependencies. A page which draws no header downloads none of the three.
	$extensions = [
		...$extensions,
		'disk.document-header',
		'ui.a11y',
		'ui.buttons',
	];
}

Extension::load($extensions);

$frameTitle = $name !== '' ? $name : (string)Loc::getMessage('DISK_FILE_VIEWER_HTML_FRAME_TITLE');
// Two phrases on purpose: this one is drawn by the page, the header owns the one of its element.
// The page draws its own only where the header will draw none, and the description travels in the
// markup, so the check holds without the bundle.
$warning = (string)Loc::getMessage('DISK_FILE_VIEWER_HTML_WARNING');
$hasWarning = $warning !== ''
	&& $contentUrl !== ''
	&& (
		$composition === null
		|| in_array(
			DocumentHeaderElement::ContentWarning->value,
			(array)($composition['elements'] ?? []),
			true,
		)
	)
;

$headerStripId = 'disk-html-viewer-strip-' . $this->randString();
$headerContainerId = 'disk-html-viewer-header-' . $this->randString();
$boostContainerId = 'disk-html-viewer-boost-' . $this->randString();
$presentationExitContainerId = 'disk-html-viewer-presentation-exit-' . $this->randString();

// A page waiting for no header lays itself out differently: the warning takes its own place in the
// flow instead of standing over the top of the document nobody will ever move it off.
$pageClass = 'disk-html-viewer-page';
if (!$hasHeader)
{
	$pageClass .= ' disk-html-viewer-page--headerless';
}
?>
<div class="<?= $pageClass ?>" data-testid="disk-html-viewer-page">
	<!-- The strip is where the way back out of the frame leads: it is on the page whether the header
	     arrives or not, and it takes the focus of that jump. -->
	<header
		class="disk-html-viewer-page__header"
		id="<?= $headerStripId ?>"
		tabindex="-1"
		data-testid="disk-html-viewer-strip"
	>
		<?php if ($name !== ''): ?>
		<!-- Drawn by the page itself, so the first paint already carries readable text; css takes it off
		     once the header is drawn into the strip. The name keeps its extension, while the header shows it
		     without: that split is the rule of the header alone (`lib/editable-name`). -->
		<h1 class="disk-html-viewer-page__name" data-testid="disk-html-viewer-name"><?= htmlspecialcharsbx($name) ?></h1>
		<?php endif ?>
		<?php if ($hasHeader): ?>
		<!-- The place of the header, held at its own height from the first paint. -->
		<div class="disk-document-header-container" id="<?= $headerContainerId ?>"></div>
		<?php endif ?>
	</header>
	<?php if ($hasWarning): ?>
	<!-- Drawn by the page itself, so a header which never appears leaves the reader warned all the
	     same. Css takes the node off once the header has drawn a warning of its own. -->
	<p class="disk-html-viewer-page__warning" data-testid="disk-html-viewer-warning">
		<?= htmlspecialcharsbx($warning) ?>
	</p>
	<?php endif ?>
	<main class="disk-html-viewer-page__content">
		<?php if ($contentUrl !== ''): ?>
		<iframe
			class="disk-html-viewer-page__frame"
			sandbox="allow-scripts"
			referrerpolicy="no-referrer"
			src="<?= htmlspecialcharsbx($contentUrl) ?>"
			title="<?= htmlspecialcharsbx($frameTitle) ?>"
			onload="this.onload = null; if (document.activeElement === document.body) { this.focus(); }"
			data-testid="disk-html-viewer-frame"
		></iframe>
		<?php if ($hasWarning): ?>
		<a
			class="disk-html-viewer-page__warning-return"
			href="#<?= $headerStripId ?>"
			data-testid="disk-html-viewer-warning-return"
		>
			<span aria-hidden="true">&uarr;</span>
			<span><?= htmlspecialcharsbx($warning) ?></span>
		</a>
		<?php endif ?>
		<?php else: ?>
		<!-- No src to give the frame: an empty one lands on about:blank, or on this very page in the
		     engines that resolve it against the document. -->
		<p class="disk-html-viewer-page__unavailable" data-testid="disk-html-viewer-unavailable">
			<?= htmlspecialcharsbx((string)Loc::getMessage('DISK_FILE_VIEWER_HTML_UNAVAILABLE')) ?>
		</p>
		<?php endif ?>
	</main>
	<?php if ($hasHeader && $contentUrl !== ''): ?>
	<!-- The mode is entered from the header alone, so a page without one offers no way out of it either. -->
	<div
		class="disk-html-viewer-page__presentation-exit"
		id="<?= $presentationExitContainerId ?>"
	></div>
	<?php endif ?>
</div>
<script>
	(function() {
		var url = new URL(window.location.href);
		if (url.searchParams.get('public_domain') !== 'Y' || !url.searchParams.has('access_token'))
		{
			return;
		}

		url.searchParams.delete('access_token');
		url.searchParams.delete('public_domain_retry');
		history.replaceState(history.state, document.title, url.toString());
	})();
</script>
<?php if ($hasHeader): ?>
<script>
	BX.ready(function() {
		var headerContainer = document.getElementById('<?= $headerContainerId ?>');
		var page = headerContainer.closest('.disk-html-viewer-page');
		var presentation = null;
		<?php if ($contentUrl !== ''): ?>

		// The presentation mode belongs to the page: the header only asks for it and follows the state.
		// The node that goes full screen, the button of the exit and the announcements all live here.
		presentation = (function() {
			var exitContainer = document.getElementById('<?= $presentationExitContainerId ?>');
			var exitVisibleClass = 'disk-html-viewer-page__presentation-exit--visible';
			var exitLabel = BX.message('DISK_DOCUMENT_HEADER_PRESENTATION_EXIT_ACTION');
			var exitHideDelay = 3000;
			var exitHideTimer = null;
			var adapter = new BX.Disk.FullscreenPresentation(page);

			// Not in the header: the mode hides it. No text, so the title and the aria-label name the button.
			var exitButton = new BX.UI.Button({
				useAirDesign: true,
				style: BX.UI.AirButtonStyle.OUTLINE,
				size: BX.UI.Button.Size.MEDIUM,
				icon: BX.UI.IconSet.Outline.COLLAPSE_M,
				props: { title: exitLabel, 'aria-label': exitLabel },
				dataset: { testid: 'disk-html-viewer-presentation-exit' },
			});

			exitButton.bindEvent('click', function() {
				adapter.exit();
			});
			exitButton.renderTo(exitContainer);

			var showExitButton = function() {
				if (!adapter.isActive())
				{
					return;
				}

				exitContainer.classList.add(exitVisibleClass);
				clearTimeout(exitHideTimer);
				exitHideTimer = setTimeout(function() {
					exitContainer.classList.remove(exitVisibleClass);
				}, exitHideDelay);
			};

			var announce = function(message) {
				var announcer = BX.UI.Accessibility && BX.UI.Accessibility.LiveAnnouncer;
				if (announcer)
				{
					announcer.announce(message, 'polite');
				}
			};

			// Subscribed before the header is mounted, and listeners are told in the order they subscribed, so
			// the class is off by the time the header takes the focus back: a header still hidden would swallow it.
			adapter.subscribeToState(function(isActive) {
				page.classList.toggle('disk-html-viewer-page--presentation', isActive);

				if (isActive)
				{
					showExitButton();
					exitButton.getContainer().focus();
					announce(BX.message('DISK_DOCUMENT_HEADER_PRESENTATION_ENTERED'));

					return;
				}

				clearTimeout(exitHideTimer);
				exitContainer.classList.remove(exitVisibleClass);
				announce(BX.message('DISK_DOCUMENT_HEADER_PRESENTATION_EXITED'));
			});

			BX.bind(page, 'mousemove', showExitButton);
			BX.bind(page, 'touchstart', showExitButton);

			return adapter;
		})();
		<?php endif ?>

		var context = {
			// Nothing writes the document here, and no opening of it carries the save status element, but the
			// context asks for an adapter all the same.
			adapter: {
				subscribeToSaveStatus: function() {
					return function() {};
				},
				retrySave: function() {
					return Promise.resolve();
				},
				canRetrySave: function() {
					return false;
				},
			},
			boostContainerId: '<?= $boostContainerId ?>',
			logoUrl: <?= Json::encode($portalUrl) ?>,
			editUrl: '',
			sessionBoost: null,
			shouldShowPromoImmediately: false,
			// The header stands on a page of its own here, so the name of the document is the heading of
			// that page - the one the page drew for the first paint steps back together with the strip.
			shouldRenderNameAsPageHeading: true,
			composition: <?= Json::encode($composition) ?>,
		};

		// An opening with nothing to show offers no mode either, and the header then draws no button.
		if (presentation !== null)
		{
			context.presentationAdapter = presentation;
		}

		// The container filling up is the only honest sign the header is there: constructing it starts work
		// which may still end without a header, and `:has()` on an element of the header answers for that
		// element rather than for the header, and is missing from browsers the product supports.
		var markHeaderMounted = function() {
			if (headerContainer.firstElementChild === null)
			{
				return false;
			}

			page.classList.add('disk-html-viewer-page--header-mounted');

			return true;
		};

		if (!markHeaderMounted())
		{
			var headerObserver = new MutationObserver(function() {
				if (markHeaderMounted())
				{
					headerObserver.disconnect();
				}
			});

			headerObserver.observe(headerContainer, { childList: true });
		}

		// Nothing is taken apart on the way out on purpose: an unload handler would keep the page out of the
		// cache of the back button, and the document goes away with its subscriptions and timers anyway.
		new BX.Disk.DocumentHeader(headerContainer, context);
	});
</script>
<?php endif ?>
