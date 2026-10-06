<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @var LandingBlocksTariffsComponent $component */
/** @var \Bitrix\Landing\Landing $landing */
/** @var \CMain $APPLICATION */

use \Bitrix\Main\Localization\Loc;
Loc::loadMessages(__FILE__);
?>

<div class="landing-block-info g-min-height-200 g-flex-centered g-height-100">
	<p class="g-landing-alert"> <?= Loc::getMessage('BLOCK_MESSAGE') ?> </p>
</div>

<div class="landing-block-table-container"></div>

<script class="landing-block-tariff-script" data-tariff-instance="<?= htmlspecialcharsbx($arResult['INSTANCE_ID']) ?>">
	(function() {
		// document.currentScript is not usable here: when the block is added in the editor, landing
		// evaluates this code with BX.evalGlobal from a temporary script of <head>, while the script
		// node of the block stays in the block markup carrying the instance attribute
		const instanceId = '<?= CUtil::JSEscape($arResult['INSTANCE_ID']) ?>';
		const instanceScripts = document.querySelectorAll(
			'script.landing-block-tariff-script[data-tariff-instance="' + instanceId + '"]'
		);
		const script = Array.from(instanceScripts).find((node) => !node.landingTariffInited);
		if (!script)
		{
			return;
		}
		script.landingTariffInited = true;

		BX.ready(() => {
			const block = script.closest('.landing-block') || script.parentElement;
			if (!block)
			{
				return;
			}

			const container = block.querySelector('.landing-block-table-container');
			let tableNode = null;

			function isValidLink(link)
			{
				const reg = /#landing\d+|#block\d+|#crmFormPopup\d+|#crmPhone\d+/i;

				return !reg.test(link);
			}

			function getValidHref(link)
			{
				if (!link)
				{
					return null;
				}

				const href = link.getAttribute('href');

				return (href && isValidLink(href)) ? href : null;
			}

			const orderLinks = {
				BASIC: block.querySelector('.landing-block-link-1'),
				STD: block.querySelector('.landing-block-link-2'),
				PRO: block.querySelector('.landing-block-link-3'),
				ENT: block.querySelector('.landing-block-link-4'),
			};

			//button compare tariff
			const compareLink = block.querySelector('.landing-block-link-5');

			function getOrderLinkByCode(code)
			{
				if (!BX.Type.isString(code))
				{
					return null;
				}
				if (code === 'BASIC' || code === 'STD')
				{
					return orderLinks[code];
				}
				if (code === 'PRO100')
				{
					return orderLinks.PRO;
				}
				if (code.indexOf('ENT') === 0)
				{
					//all tariffs of the ENT line
					return orderLinks.ENT;
				}

				return null;
			}

			function getEventData(event)
			{
				if (!event)
				{
					return null;
				}

				// a non array-like payload of BX.onCustomEvent reaches the handler as a BaseEvent
				return BX.Type.isFunction(event.getData) ? event.getData() : event;
			}

			function isTheOnlyBlockOnPage()
			{
				return document.querySelectorAll('script.landing-block-tariff-script').length <= 1;
			}

			function isOwnTableClick(event)
			{
				if (!event || !tableNode || !container)
				{
					return false;
				}

				const target = event.event ? event.event.target : null;
				if (!target || !BX.Type.isDomNode(target) || !target.closest)
				{
					// the producer does not mark clicks with the block, so a click that cannot be
					// attributed is handled only while there is no other block to confuse it with
					return isTheOnlyBlockOnPage();
				}

				if (container.contains(target))
				{
					return true;
				}

				return target.closest('.landing-block-table-container') === null && isTheOnlyBlockOnPage();
			}

			const option = <?= CUtil::PhpToJsObject($arParams['OPTION']) ?>;
			if (option.partnerId === 0)
			{
				delete option.partnerId;
			}
			option.host = window.location.host;
			option.replace = {
				'order': {
					'url': {},
				},
			};

			Object.keys(orderLinks).forEach((code) => {
				const href = getValidHref(orderLinks[code]);
				if (href)
				{
					option.replace.order.url[code] = href;
				}
			});

			const compareHref = getValidHref(compareLink);
			if (compareHref)
			{
				option.replace.template = {
					'message': {
						'COMPARE': {
							'BUTTON': {
								'HREF': compareHref,
							},
						},
					},
				};
			}

			script.setAttribute('data-sb-b24-table', JSON.stringify(option));

			BX.addCustomEvent('BX.SB.Price.Application:onAfterLoadFromHtml', (event) => {
				const data = getEventData(event);
				if (!data || data.target !== script || !container)
				{
					return;
				}

				const application = data.Application;
				const main = (application && application.nodes) ? application.nodes.main : null;
				if (!BX.Type.isDomNode(main))
				{
					return;
				}

				container.append(main);
				tableNode = main;

				const infoElement = block.querySelector('.landing-block-info');
				if (infoElement)
				{
					infoElement.hidden = true;
				}
			});

			BX.addCustomEvent('BX.SB.Price.Order.Button:onClick', (event) => {
				const data = getEventData(event);
				if (!isOwnTableClick(data))
				{
					return;
				}
				if (data.event)
				{
					data.event.preventDefault();
				}

				const link = getOrderLinkByCode(data.code);
				if (link)
				{
					link.click();
				}
			});

			BX.addCustomEvent('BX.SB.Price.Compare.Button:onClick', (event) => {
				const data = getEventData(event);
				if (!isOwnTableClick(data) || !compareLink)
				{
					return;
				}

				const href = compareLink.getAttribute('href');
				if (href === null || href === 'selectActions:')
				{
					return;
				}

				if (data.event)
				{
					data.event.preventDefault();
				}
				compareLink.click();
			});

			function getDomainZone(zone)
			{
				switch (zone)
				{
					case 'br':
						return 'com.br';
					case 'by':
						return 'by';
					case 'co':
						return 'co';
					case 'de':
						return 'de';
					case 'en':
						return 'com';
					case 'eu':
						return 'eu';
					case 'fr':
						return 'fr';
					case 'id':
						return 'id';
					case 'in':
						return 'in';
					case 'it':
						return 'it';
					case 'jp':
						return 'jp';
					case 'kz':
						return 'kz';
					case 'la':
						return 'es';
					case 'ms':
						return 'com';
					case 'mx':
						return 'mx';
					case 'pl':
						return 'pl';
					case 'ru':
						return 'ru';
					case 'cn':
						return 'cn';
					case 'th':
						return 'com';
					case 'tr':
						return 'com.tr';
					case 'ua':
						return 'ua';
					case 'uk':
						return 'uk';
					case 'vn':
						return 'vn';
					case 'uz':
						return 'uz';
					default:
						return 'com';
				}
			}
			const url = 'https://www.bitrix24.' + getDomainZone(option['locationAreaId']) + '/public/js/prices/intranet/intranet.buy.table.js';

			(function(d, n, u) {
				let s = d.createElement('script'), r = (Date.now() / 3600000 | 0);
				s.async = 1;
				// the external loader is a page singleton and exits at once on every run after the
				// first, so a block added later has to ask the manager for its table itself;
				// initFromScript skips the nodes already marked with data-sb-b24-loaded
				s.onload = () => {
					const table = BX.namespace('BX.SB.Landing.Prices.Intranet.Table');
					if (table.Manager)
					{
						table.Manager.initFromScript();
					}
				};
				s.src = u + '?' + r;
				n.after(s);
			})(document, script, url);
		});

	})();
</script>
