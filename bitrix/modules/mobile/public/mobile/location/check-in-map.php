<?php

use Bitrix\Main\Loader;
use Bitrix\Main\UI\Extension;

require($_SERVER['DOCUMENT_ROOT'] . '/mobile/headers.php');
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

Loader::requireModule('location');
Extension::load([
	'location.check-in',
	'location.core',
]);

?>
	<?php if (($_GET['introHold'] ?? '') === 'Y'): ?>
	<!-- The host's intro cover opens on black; painting the page black from its very first frame
	     keeps whatever peeks around the cover part of the clip instead of a white blink. -->
	<style>html, body { background: #000; }</style>
	<?php endif; ?>
	<div id="check-in-map" style="height: 100%; width: 100%;"></div>
	<script>
		const { CheckInMap } = BX.Location.CheckIn;
		const { CheckInMapEventType } = BX.Location.Core;

		let readyCount = 0;
		const onBothReady = () => {
			if (++readyCount < 2)
			{
				return;
			}
			new CheckInMap();
			BXNativeBridge.sendEvent(CheckInMapEventType.PAGE_WITH_MAP_LOADED, {});
		};

		document.addEventListener('BXNativeBridgeReady', onBothReady, { once: true });
		BX.ready(onBothReady);
	</script>

<?php
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
