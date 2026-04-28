<?php

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Loader;

require($_SERVER['DOCUMENT_ROOT'] . '/mobile/headers.php');
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

Loader::requireModule('location');

Extension::load([
	'location.check-in',
	'location.core',
]);

?>
	<div id="check-in-map" style="height: 100%; width: 100%;">
	</div>
	<script>
		const { CheckInMap } = BX.Location.CheckIn;
		const { CheckInMapEventType } = BX.Location.Core;

		let BXReady = false;
		let BXBridgeReady = false;
		const readyHandler = () => {
			if (BXReady && BXBridgeReady)
			{
				const map = new CheckInMap();
				BXNativeBridge.sendEvent(CheckInMapEventType.PAGE_WITH_MAP_LOADED, {});
			}
		}

		document.addEventListener("BXNativeBridgeReady", () => {
			BXBridgeReady = true;
			readyHandler();
		});

		BX.ready(() => {
			BXReady = true;
			readyHandler();
		});
	</script>

<?php
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
