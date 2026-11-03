<?php

/** @var $this CBitrixComponentTemplate */
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @var CBitrixComponentTemplate $this */
/** @var BaseComponent $component */

use Bitrix\Disk\Internals\BaseComponent;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\Size;
use Bitrix\UI\Buttons\Tag;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
Loc::loadLanguageFile(__DIR__ . '/template.php');

// Extension::load() only queues the assets: the namespace of the button classes is registered by the
// module itself, and this screen is drawn on the failure path, where a fatal costs the most.
Loader::includeModule('ui');

/** @var array $arResult */
Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.buttons',
]);

$containerId = 'saving-' . $this->randString();
$headerText = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_MODE_VIEW');

$title = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_SAVING_TITLE');
$description = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_SAVING_DESCR');
$retryDelay = max(1, min(5, (int)($arResult['OPEN_RETRY_DELAY'] ?? 2)));

// The platform needs time, not another action of the reader: the button asks the page for itself
// again, and the shell repeats the open with the whole retry budget of the controller.
$retryButton = new Button([
	'text' => Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_SAVING_RETRY'),
	'tag' => Tag::BUTTON,
	'color' => Color::PRIMARY,
	'size' => Size::LARGE,
]);
$retryButton
	->addClass('disk-fe-vo-saving-retry')
	->addAttribute('type', 'button')
	->addAttribute('data-testid', 'disk-vibeoffice-saving-retry')
;
$cancelButton = new Button([
	'text' => Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_SAVING_CANCEL'),
	'tag' => Tag::BUTTON,
	'color' => Color::LIGHT_BORDER,
	'size' => Size::LARGE,
]);
$cancelButton->addAttribute('type', 'button')->addAttribute('data-testid', 'disk-vibeoffice-saving-cancel');
?>
<div data-id="<?= $containerId ?>-wrapper">
	<div class="disk-fe-office-header">
		<div class="disk-fe-office-header-left">
			<div class="disk-fe-office-header-mode">
				<span class="disk-fe-office-header-mode-text"><?= $headerText ?></span>
			</div>
		</div>
	</div>
	<div data-id="<?= $containerId ?>" style="height: calc(100vh - 70px)">
		<div
			class="disk-fe-vo-saving"
			data-id="<?= $containerId ?>-base"
			data-testid="disk-vibeoffice-saving"
		>
			<h1 class="disk-fe-vo-saving-title"><?= $title ?></h1>
			<div class="disk-fe-vo-saving-desc"><?= $description ?></div>
			<?= $retryButton->render(false) ?>
			<?= $cancelButton->render(false) ?>
		</div>
	</div>
</div>
<script>
	BX.ready(() => {
		let reloadScheduled = false;
		let cancelled = false;
		let timerId = null;
		const retryTarget = `${location.pathname}${location.search}`;
		let retryTargetHash = 0;
		for (let index = 0; index < retryTarget.length; index += 1)
		{
			retryTargetHash = (retryTargetHash * 31 + retryTarget.charCodeAt(index)) | 0;
		}
		const retryKey = `disk-vibeoffice-saving:${retryTargetHash}`;
		let retryCount = 0;
		let retryStorageAvailable = false;
		try
		{
			const savedRetry = sessionStorage.getItem(retryKey);
			sessionStorage.setItem(retryKey, savedRetry || '');
			retryStorageAvailable = true;
			const previousRetry = JSON.parse(savedRetry || 'null');
			if (previousRetry && Date.now() - previousRetry.at < 300000)
			{
				retryCount = Math.max(0, Math.min(10, Number(previousRetry.count) || 0));
			}
		}
		catch (error)
		{
			// Storage can be unavailable in a restricted browsing context.
		}
		const reload = () => {
			if (reloadScheduled)
			{
				return;
			}

			reloadScheduled = true;
			if (timerId !== null)
			{
				clearTimeout(timerId);
				timerId = null;
			}
			window.removeEventListener('online', scheduleReload);
			document.removeEventListener('visibilitychange', scheduleReload);
			try
			{
				sessionStorage.setItem(retryKey, JSON.stringify({ count: Math.min(10, retryCount + 1), at: Date.now() }));
			}
			catch (error)
			{
				retryStorageAvailable = false;
			}
			location.reload();
		};
		const scheduleReload = () => {
			if (reloadScheduled || cancelled || timerId !== null || !navigator.onLine || document.hidden)
			{
				return;
			}

			const baseDelay = <?= $retryDelay * 1000 ?>;
			const delay = retryStorageAvailable
				? Math.min(60000, baseDelay * (2 ** Math.min(retryCount, 6)))
				: 75000
			;
			const jitteredDelay = Math.round(delay * (0.8 + Math.random() * 0.4));
			timerId = setTimeout(() => {
				timerId = null;
				if (navigator.onLine && !document.hidden)
				{
					reload();
				}
			}, jitteredDelay);
		};
		document.querySelector('.disk-fe-vo-saving-retry')?.addEventListener('click', reload, { once: true });
		document.querySelector('[data-testid="disk-vibeoffice-saving-cancel"]')?.addEventListener('click', () => {
			cancelled = true;
			if (timerId !== null)
			{
				clearTimeout(timerId);
				timerId = null;
			}
			window.removeEventListener('online', scheduleReload);
			document.removeEventListener('visibilitychange', scheduleReload);
		}, { once: true });

		window.addEventListener('online', scheduleReload);
		document.addEventListener('visibilitychange', scheduleReload);
		scheduleReload();
	});
</script>
