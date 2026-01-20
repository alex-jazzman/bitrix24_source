<?php


if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

\Bitrix\Main\UI\Extension::load(['ui.design-tokens', 'ui.fonts.opensans', 'intranet.desktop-download']);

$this->setFrameMode(true);
$this->SetViewTarget("sidebar", 500);
?>
<div class="sidebar-widget b24-app-block">
	<div class="sidebar-widget-top">
		<div class="sidebar-widget-top-title">
			<?= GetMessage("B24_BANNER_MESSENGER_TITLE_MSGVER_2")?>
		</div>
	</div>
	<div class="sidebar-widget-content">
		<div class="b24-app-block-content">
		<a href="javascript:void(0)" onclick="BX.UI.InfoHelper.show('mobile_app');" class="b24-app-block-content-apps">
			<span class="b24-app-icon-wrapper">
				<span class="b24-app-icon --ios"></span>
			</span>
			<span class="b24-app-title">iOS</span>
		</a>
		<a href="javascript:void(0)" onclick="BX.UI.InfoHelper.show('mobile_app');" class="b24-app-block-content-apps b24-app-block-separate">
			<span class="b24-app-icon-wrapper">
				<span class="b24-app-icon --android"></span>
			</span>
			<span class="b24-app-title">Android</span>
		</a>
		<div style="clear:both"></div>
	  </div>
	</div>
</div>
<script>
	BX.ready(() => {
		const element = document.querySelector('.b24-app-block-content');
		const desktopLinks = new BX.Intranet.DesktopDownload();

		BX.Dom.prepend(BX.Tag.render`
			<a href="javascript:void(0)" onclick="${event => desktopLinks.showMenuForLinux(event.currentTarget)}" class="b24-app-block-content-apps">
				<span class="b24-app-icon-wrapper">
					<span class="b24-app-icon --linux"></span>
				</span>
				<span class="b24-app-title">Linux</span>
			</a>
		`, element);

		BX.Dom.prepend(BX.Tag.render`
			<a href="${BX.Intranet.DesktopDownload.getLinks().windows}" target="_blank" class="b24-app-block-content-apps">
				<span class="b24-app-icon-wrapper">
					<span class="b24-app-icon --windows"></span>
				</span>
				<span class="b24-app-title">Windows</span>
			</a>
		`, element);

		BX.Dom.prepend(BX.Tag.render`
			<a href="javascript:void(0)" onclick="${event => desktopLinks.showMenuForMac(event.currentTarget)}" class="b24-app-block-content-apps">
				<span class="b24-app-icon-wrapper">
					<span class="b24-app-icon --macos"></span>
				</span>
				<span class="b24-app-title">Mac OS</span>
			</a>
		`, element);
	});
</script>
