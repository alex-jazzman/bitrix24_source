<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/** @var array $arResult */
/** @var CBitrixComponentTemplate $this */

Extension::load([
	'ui.buttons',
	'ui.design-tokens',
	'ui.fonts.opensans',
	// Announced from below, and named here rather than taken from main.popup, which ui.buttons and ui.hint
	// both bring along: the page states what it uses, and the bundle is on the page either way.
	'ui.a11y',
	'ui.hint',
]);

$name = (string)$arResult['NAME'];
$contentUrl = (string)$arResult['CONTENT_URL'];
$downloadUrl = (string)$arResult['DOWNLOAD_URL'];
$copyLinkUrl = (string)$arResult['COPY_LINK_URL'];
$sharingObjectId = (int)$arResult['SHARING_OBJECT_ID'];
$sharingUniqueCode = (string)$arResult['SHARING_UNIQUE_CODE'];

$sharingPopupParams = null;
if ($sharingObjectId > 0)
{
	$sharingPopupParams = [
		'objectId' => $sharingObjectId,
		'uniqueCode' => $sharingUniqueCode === '' ? null : $sharingUniqueCode,
	];
}

$frameTitle = $name !== '' ? $name : (string)Loc::getMessage('DISK_FILE_VIEWER_HTML_FRAME_TITLE');
$warning = (string)Loc::getMessage('DISK_FILE_VIEWER_HTML_WARNING');
$portalUrl = (string)$arResult['PORTAL_URL'];
$actionsContainerId = 'disk-html-viewer-actions-' . $this->randString();

// Plain text without a portal url: a reader who has no session would only be led to a login form.
$logo = '<span>' . htmlspecialcharsbx((string)Loc::getMessage('DISK_FILE_VIEWER_HTML_LOGO')) . '</span>';
?>
<div class="disk-html-viewer-page" data-testid="disk-html-viewer-page">
	<header class="disk-html-viewer-page__header">
		<?php if ($portalUrl !== ''): ?>
		<a class="disk-html-viewer-page__logo" href="<?= htmlspecialcharsbx($portalUrl) ?>" data-testid="disk-html-viewer-logo"><?= $logo ?></a>
		<?php else: ?>
		<span class="disk-html-viewer-page__logo" data-testid="disk-html-viewer-logo"><?= $logo ?></span>
		<?php endif ?>
		<span class="disk-html-viewer-page__divider"></span>
		<!-- The name is cut by css when the header runs out of room, so the full one is on the title;
		     the node keeps the whole text, which is what a screen reader reads. -->
		<h1
			class="disk-html-viewer-page__name"
			title="<?= htmlspecialcharsbx($name) ?>"
			data-testid="disk-html-viewer-name"
		><?= htmlspecialcharsbx($name) ?></h1>
		<?php if ($warning !== ''): ?>
		<!-- The hint only shows on hover, so the same text is the accessible name of the icon: a
		     reader with no pointer still gets the warning. Focusable for the same reason: a sighted
		     user without a pointer reaches the hint by tab (opened by the script below). -->
		<span
			class="disk-html-viewer-page__warning"
			data-hint="<?= htmlspecialcharsbx($warning) ?>"
			data-hint-icon="o-alert"
			data-hint-size="xl"
			role="img"
			tabindex="0"
			aria-label="<?= htmlspecialcharsbx($warning) ?>"
			data-testid="disk-html-viewer-warning"
		></span>
		<?php endif ?>
		<div class="disk-html-viewer-page__actions" id="<?= $actionsContainerId ?>" data-testid="disk-html-viewer-actions"></div>
	</header>
	<main>
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
		<?php else: ?>
		<!-- No src to give the frame: an empty one lands on about:blank, or on this very page in the
		     engines that resolve it against the document, and says nothing to the reader either way. -->
		<p class="disk-html-viewer-page__unavailable" data-testid="disk-html-viewer-unavailable">
			<?= htmlspecialcharsbx((string)Loc::getMessage('DISK_FILE_VIEWER_HTML_UNAVAILABLE')) ?>
		</p>
		<?php endif ?>
	</main>
</div>
<?php if ($warning !== ''): ?>
<script>
	// The manager renders the icon into the node and binds the hover itself, so the markup carries
	// only the text. Its own page scan looks for a class of the design system, which the markup has
	// no business naming, so the node is handed over by its data-hint instead.
	//
	// An instance of its own, because the popup of the shared one is 400px wide: a single sentence
	// reads better in a narrower box, and the width is an option of the popup rather than a style of
	// the design system to override.
	BX.ready(function() {
		var hint = BX.UI.Hint.createInstance({
			id: 'disk-html-viewer-warning-hint',
			popupParameters: { maxWidth: 350 },
		});

		hint.init(document.querySelector('.disk-html-viewer-page__header'));

		// The manager binds the pointer alone, so the keyboard is bound here: without it the warning
		// would be readable by a screen reader and by a mouse, but not by a sighted user tabbing.
		var warning = document.querySelector('.disk-html-viewer-page__warning');
		var warningText = BX.util.htmlspecialchars(warning.getAttribute('data-hint'));

		BX.bind(warning, 'focus', function() {
			hint.show(warning, warningText, false);
		});
		BX.bind(warning, 'blur', function() {
			hint.hide();
		});
	});
</script>
<?php endif ?>
<?php if ($downloadUrl !== '' || $sharingPopupParams !== null || $copyLinkUrl !== ''): ?>
<script>
	// built in js: the air design of the php button is a no-op without AIR_SITE_TEMPLATE, which
	// only a site template defines, and this page carries none
	BX.ready(function() {
		var actions = document.getElementById('<?= $actionsContainerId ?>');

		// The labelled row of actions asks 585px of the header, which a phone does not have: below
		// that the buttons keep the icon alone, as the copy one always does. The label is not lost —
		// it stays the accessible name of every button through the title and the aria-label.
		var narrow = window.matchMedia('(max-width: 639px)');
		var collapsible = [];
		var applyNarrow = function() {
			collapsible.forEach(function(button) {
				button.setCollapsed(narrow.matches);
			});
		};
		<?php if ($downloadUrl !== ''): ?>
		(function() {
			var label = '<?= CUtil::JSEscape(Loc::getMessage('DISK_FILE_VIEWER_HTML_DOWNLOAD')) ?>';

			var button = new BX.UI.Button({
				text: label,
				useAirDesign: true,
				style: BX.UI.AirButtonStyle.OUTLINE,
				size: BX.UI.Button.Size.MEDIUM,
				tag: BX.UI.Button.Tag.LINK,
				link: <?= Json::encode($downloadUrl) ?>,
				icon: BX.UI.IconSet.Outline.DOWNLOAD,
				props: { download: '', title: label, 'aria-label': label },
				dataset: { testid: 'disk-html-viewer-download' },
			});

			button.renderTo(actions);
			collapsible.push(button);
		})();
		<?php endif ?>
		<?php if ($sharingPopupParams !== null): ?>
		(function() {
			var params = <?= Json::encode($sharingPopupParams) ?>;
			var label = '<?= CUtil::JSEscape(Loc::getMessage('DISK_FILE_VIEWER_HTML_SHARING')) ?>';
			var errorLabel = '<?= CUtil::JSEscape(Loc::getMessage('DISK_FILE_VIEWER_HTML_SHARING_ERROR')) ?>';
			var dialog = null;

			function showError()
			{
				var announcer = BX.UI.Accessibility && BX.UI.Accessibility.LiveAnnouncer;
				if (announcer)
				{
					announcer.announce(errorLabel, 'assertive');
				}

				BX.Runtime.loadExtension('ui.notification').then(function(exports) {
					exports.UI.Notification.Center.notify({ content: BX.util.htmlspecialchars(errorLabel) });
				});
			}

			// Only what the page can vouch for is stated: the button opens a dialog. Its open() resolves
			// whether the dialog appeared or not — a failed access rights request is answered by the popup
			// itself and resolves all the same — so an aria-expanded here would be a claim about a state
			// nothing confirms, and a "true" left on a dialog that never opened has nothing to reset it.
			var button = new BX.UI.Button({
				text: label,
				useAirDesign: true,
				style: BX.UI.AirButtonStyle.OUTLINE,
				size: BX.UI.Button.Size.MEDIUM,
				icon: BX.UI.IconSet.Outline.THREE_PERSONS,
				props: { 'aria-haspopup': 'dialog', title: label, 'aria-label': label },
				dataset: { testid: 'disk-html-viewer-sharing' },
				onclick: function() {
					// the popup chunk arrives in seconds: waiting disables the button, so a second
					// click cannot start a parallel open
					button.setWaiting(true);

					// on demand, so the popup extension stays out of the page dependencies
					BX.Runtime.loadExtension('disk.sharing-access-popup').then(function(exports) {
						dialog = dialog || new exports.SharingPopupDialog();

						return dialog.open(params);
					}).then(function() {
						button.setWaiting(false);
					}, function() {
						button.setWaiting(false);
						showError();
					});
				},
			});

			button.renderTo(actions);
			collapsible.push(button);
		})();
		<?php endif ?>
		<?php if ($copyLinkUrl !== ''): ?>
		(function() {
			var link = <?= Json::encode($copyLinkUrl) ?>;
			var label = '<?= CUtil::JSEscape(Loc::getMessage('DISK_FILE_VIEWER_HTML_COPY_LINK')) ?>';
			var doneLabel = '<?= CUtil::JSEscape(Loc::getMessage('DISK_FILE_VIEWER_HTML_COPY_LINK_DONE')) ?>';
			var errorLabel = '<?= CUtil::JSEscape(Loc::getMessage('DISK_FILE_VIEWER_HTML_COPY_LINK_ERROR')) ?>';
			var restoreDelay = 1500;
			var restoreTimer = null;

			// No text, so air renders the square collapsed button; the title and the aria-label name
			// it for a pointer hover and a screen reader.
			var button = new BX.UI.Button({
				useAirDesign: true,
				style: BX.UI.AirButtonStyle.OUTLINE,
				size: BX.UI.Button.Size.MEDIUM,
				icon: BX.UI.IconSet.Outline.LINK,
				props: { title: label, 'aria-label': label },
				dataset: { testid: 'disk-html-viewer-copy-link' },
			});

			// The colour swap alone conveys nothing to a screen reader, nor to a user who cannot tell
			// the states apart by hue, so the icon changes with it and the result is announced.
			var announce = function(message, politeness) {
				var announcer = BX.UI.Accessibility && BX.UI.Accessibility.LiveAnnouncer;
				if (announcer)
				{
					announcer.announce(message, politeness);
				}
			};

			var showCopied = function() {
				button.setStyle(BX.UI.AirButtonStyle.FILLED_SUCCESS);
				button.setIcon(BX.UI.IconSet.Outline.CHECK_M);
				announce(doneLabel, 'polite');

				clearTimeout(restoreTimer);
				restoreTimer = setTimeout(function() {
					button.setStyle(BX.UI.AirButtonStyle.OUTLINE);
					button.setIcon(BX.UI.IconSet.Outline.LINK);
				}, restoreDelay);
			};

			var showError = function() {
				announce(errorLabel, 'assertive');
				// on demand: a failed copy is the rare path, the toast has no place in the page assets
				BX.Runtime.loadExtension('ui.notification').then(function(exports) {
					exports.UI.Notification.Center.notify({ content: BX.util.htmlspecialchars(errorLabel) });
				});
			};

			// The async clipboard needs a secure context, which a portal on plain http is not, so the
			// core execCommand helper stays as the fallback.
			var copy = function() {
				if (navigator.clipboard && window.isSecureContext)
				{
					return navigator.clipboard.writeText(link);
				}

				return Promise.reject(new Error('async clipboard is unavailable'));
			};

			button.bindEvent('click', function() {
				copy().then(showCopied, function() {
					if (BX.clipboard.copy(link))
					{
						showCopied();

						return;
					}

					showError();
				});
			});

			button.renderTo(actions);
		})();
		<?php endif ?>

		applyNarrow();
		narrow.addEventListener('change', applyNarrow);
	});
</script>
<?php endif ?>
