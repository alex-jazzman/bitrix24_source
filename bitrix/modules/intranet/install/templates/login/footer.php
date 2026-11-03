<?php

/** @global CMain $APPLICATION */
/** @global CUser $USER */

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Intranet\Public\Provider\Portal\LanguageProvider;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

Loc::loadLanguageFile(__FILE__);

$languageProvider = new LanguageProvider();
$languageList = $languageProvider->getPublicArray();
?>
		</div>
	</div>

	<div class="intranet-body__footer intranet-auth-cover-footer">
		<div class="intranet-body__footer-left">
			<?php if ($languageProvider->isLanguageIdChangeAvailable()): ?>
			<button
				type="button"
				id="login-language-selector"
				class="intranet-backdrop-btn"
				aria-haspopup="menu"
				aria-expanded="false"
				aria-label="<?= htmlspecialcharsbx(Loc::getMessage('INTRANET_LOGIN_AIR_LANGUAGE_TRIGGER_ARIA', [
					'#LANGUAGE#' => $languageList[LANGUAGE_ID]['NAME'],
				])) ?>"
			>
				<span class="intranet-backdrop-btn__content"><?= $languageList[LANGUAGE_ID]['NAME'] ?></span>
				<i class="intranet-language-selector-btn ui-icon-set --chevron-down"></i>
			</button>
			<?php endif ?>
		</div>
		<div class="intranet-body__footer-right">
			<!-- teleport -->
		</div>
	</div>
</div>

<script>
	(function()
	{
		BX.ready(function()
		{
			document.querySelector('#login-auth-container').classList.add("intranet-auth-animate");

			var languageSelector = document.querySelector('#login-language-selector');
			if (!languageSelector)
			{
				return;
			}

			var languageItems = [
				<?php foreach($languageList as $langCode => $lang): ?>
				{
					html: BX.Dom.create('span', {
						attrs: <?= Json::encode($lang['LANG_TAG'] === null ? new stdClass() : ['lang' => $lang['LANG_TAG']]) ?>,
						text: "<?= CUtil::JSEscape($lang['NAME']) ?>"
					}),
					attrs: <?= Json::encode($langCode === LANGUAGE_ID ? ['aria-current' => 'true'] : new stdClass()) ?>,
					onclick: function()
					{
						function changeLanguage(langCode)
						{
							var url = window.location.href;
							url = url.replace(/(\?|\&)user_lang=[A-Za-z]{2}/, "");
							url += (url.indexOf("?") == -1 ? "?" : "&") + "user_lang=" + langCode;
							window.location.href = url;
						}

						changeLanguage('<?= $langCode ?>');
					}
				},
				<?php endforeach ?>
			];

			var languageParams = {
				offsetTop: 10,
				offsetLeft: 42,
				angle: {offset: 45},
				animationOptions: false,
				className: 'intranet-language-selector-popup',
				bindOptions: {
					position: 'top',
					forceTop: true,
				},
				// The menu gets its role from the platform, but its name only from here.
				ariaLabel: "<?= CUtil::JSEscape(Loc::getMessage('INTRANET_LOGIN_AIR_LANGUAGE_MENU_ARIA')) ?>",
				// Without a focus trap the keyboard never reaches the items: both MenuItem.focus()
				// and the initial focus of MenuNavigation move the focus only when the menu has one.
				focusTrap: {
					// A click outside moves the focus before the menu hides: the element the user went
					// to keeps it, and only a focus dying with the menu is handed back to the button.
					restoreFocus: function()
					{
						var activeElement = document.activeElement;
						// The menu is taken from the registry and not from the closure: one destroyed from
						// the outside is replaced by the next opening, and its container is already gone.
						var currentMenu = BX.PopupMenu.getMenuById('lang-popup');
						var popupContainer = currentMenu ? currentMenu.getPopupWindow().getPopupContainer() : null;
						if (
							BX.Type.isElementNode(popupContainer)
							&& BX.Type.isElementNode(activeElement)
							&& activeElement !== document.body
							&& !popupContainer.contains(activeElement)
						)
						{
							return activeElement;
						}

						return languageSelector;
					},
					preventScroll: true,
				}
			};

			// Created once so that the options and the subscriptions below belong to the menu the
			// click handler shows: create caches the menu by its id and returns the same instance.
			var languageMenu = BX.PopupMenu.create('lang-popup', languageSelector, languageItems, languageParams);
			languageMenu.getPopupWindow().subscribe('onShow', function()
			{
				BX.Dom.attr(languageSelector, 'aria-expanded', 'true');

				// The popup activates the trap only once the opening animation is over, and a menu
				// left without one until then loses an early Escape or Tab: the focus stays on the
				// item going away with the menu and falls back to the page.
				var focusTrap = languageMenu.getFocusTrap();
				if (focusTrap)
				{
					focusTrap.activate();
				}
			});
			languageMenu.getPopupWindow().subscribe('onClose', function()
			{
				BX.Dom.attr(languageSelector, 'aria-expanded', 'false');
			});

			BX.bind(languageSelector, 'click', function()
			{
				BX.PopupMenu.show('lang-popup', languageSelector, languageItems, languageParams);
			});
		});
	})();
</script>

</body>
</html>
