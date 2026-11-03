<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use \Bitrix\Main\Localization\Loc;
use Bitrix\Landing\Manager;

$result = [
	'facebook' => [
		'name' => '<span class="fa fa-facebook"></span> Facebook',
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="facebook">
			<a aria-label="https://www.facebook.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-facebook--hover g-bg-facebook g-color-white text-center" href="https://www.facebook.com/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-facebook" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.facebook.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-facebook'],
			],
		],
	],
	
	'instagram' => [
		'name' => '<span class="fa fa-instagram"></span> Instagram',
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="instagram">
			<a aria-label="https://www.instagram.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-instagram--hover g-bg-instagram g-color-white text-center" href="https://www.instagram.com/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-instagram" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.instagram.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-instagram'],
			],
		],
	],

	'whatsapp' => [
		'name' => '<span class="fa fa-whatsapp"></span> WhatsApp',
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="whatsapp">
			<a aria-label="https://whatsapp.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-whatsapp--hover g-bg-whatsapp g-color-white text-center" href="https://whatsapp.com/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-whatsapp" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://whatsapp.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-whatsapp'],
			],
		],
	],

	'viber' => [
		'name' => '<span class="fab fa-viber g-pr-5"></span> Viber',
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="viber">
			<a aria-label="https://viber.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-viber--hover g-bg-viber g-color-white text-center" href="https://viber.com/" target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-viber" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://viber.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-viber'],
			],
		],
	],

	'telegram' => [
		'name' => '<span class="fa fa-telegram"></span> Telegram',
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="telegram">
			<a aria-label="https://telegram.org/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-telegram--hover g-bg-telegram g-color-white text-center" href="https://telegram.org/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-telegram" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://telegram.org/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-telegram'],
			],
		],
	],

	'facebook-messenger' => [
		'name' => '<span class="fab fa-facebook-messenger g-pr-5"></span> Facebook Messenger',
		'html' => '<li 
					class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
					data-card-preset="facebook-messenger">
			<a
				aria-label="https://www.messenger.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-color-white text-center g-bg-facebook-messenger g-bg-facebook-messenger--hover"
				href="https://www.messenger.com/"
				target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-facebook-messenger" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.messenger.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-facebook-messenger'],
			],
		],
	],

	'tiktok' => [
		'name' => '<span class="fab fa-tiktok g-pr-5"></span>  TikTok',
		'html' => '<li 
					class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
					data-card-preset="tiktok">
			<a
				aria-label="https://www.tiktok.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-color-white text-center g-bg-black g-bg-black--hover"
				href="https://www.tiktok.com/"
				target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-tiktok" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.tiktok.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-tiktok'],
			],
		],
	],

	'youtube' => [
		'name' => '<span class="fa fa-youtube"></span> YouTube',
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="youtube">
			<a aria-label="https://www.youtube.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-youtube--hover g-bg-youtube g-color-white text-center" href="https://www.youtube.com/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-youtube" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.youtube.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-youtube'],
			],
		],
	],

	'vk' => [
		'name' => '<span class="fa fa-vk"></span> '.Loc::getMessage('LANDING_BLOCK__SOCIAL_VK'),
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="vk">
			<a aria-label="https://vk.ru/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-vk--hover g-bg-vk g-color-white text-center" href="https://vk.ru/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-vk" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://vk.ru/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-vk'],
			],
		],
	],

	'odnoklassniki' => [
		'name' => '<span class="fa fa-odnoklassniki"></span> '.Loc::getMessage('LANDING_BLOCK__SOCIAL_OK'),
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="odnoklassniki">
			<a aria-label="https://ok.ru/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-odnoklassniki--hover g-bg-odnoklassniki g-color-white text-center" href="https://ok.ru/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-odnoklassniki" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://ok.ru/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-odnoklassniki'],
			],
		],
	],

	'skype' => [
		'name' => '<span class="fa fa-skype"></span> Skype',
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="skype">
			<a aria-label="https://skype.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-skype--hover g-bg-skype g-color-white text-center" href="https://skype.com/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-skype" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://skype.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-skype'],
			],
		],
	],
	
	'twitter' => [
		'name' => '<span class="fa fa-twitter"></span> Twitter',
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="twitter">
			<a aria-label="https://www.twitter.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-twitter--hover g-bg-twitter g-color-white text-center" href="https://www.twitter.com/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-twitter" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.twitter.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-twitter'],
			],
		],
	],

	'tumblr' => [
		'name' => '<span class="fab fa-tumblr g-pr-5"></span>  Tumblr',
		'html' => '<li 
					class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
					data-card-preset="tumblr">
			<a
				aria-label="https://www.tumblr.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-color-white text-center g-bg-tumblr g-bg-tumblr--hover"
				href="https://www.tumblr.com/"
				target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-tumblr" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.tumblr.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-tumblr'],
			],
		],
	],

	'discord' => [
		'name' => '<span class="fab fa-discord g-pr-5"></span>  Discord',
		'html' => '<li 
					class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
					data-card-preset="discord">
			<a
				aria-label="https://discord.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-color-white text-center g-bg-discord g-bg-discord--hover"
				href="https://discord.com/"
				target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-discord" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://discord.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-discord'],
			],
		],
	],

	'wechat' => [
		'name' => '<span class="fab fa-weixin g-pr-5"></span>  Wechat',
		'html' => '<li 
					class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
					data-card-preset="wechat">
			<a
				aria-label="https://www.wechat.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-color-white text-center g-bg-wechat g-bg-wechat--hover"
				href="https://www.wechat.com/"
				target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-weixin" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.wechat.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-weixin'],
			],
		],
	],
	
	'pinterest' => [
		'name' => '<span class="fa fa-pinterest"></span> Pinterest',
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="pinterest">
			<a aria-label="https://pinterest.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-pinterest--hover g-bg-pinterest g-color-white text-center" href="https://pinterest.com/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-pinterest" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://pinterest.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-pinterest'],
			],
		],
	],

	'twitch' => [
		'name' => '<span class="fab fa-twitch g-pr-5"></span>  Twitch',
		'html' => '<li 
					class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
					data-card-preset="twitch">
			<a
				aria-label="https://www.twitch.tv/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-color-white text-center g-bg-twitch g-bg-twitch--hover"
				href="https://www.twitch.tv/"
				target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-twitch" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.twitch.tv/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-twitch'],
			],
		],
	],

	'linkedin' => [
		'name' => '<span class="fa fa-linkedin"></span> LinkedIn',
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="linkedin">
			<a aria-label="https://www.linkedin.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-linkedin--hover g-bg-linkedin g-color-white text-center" href="https://www.linkedin.com/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-linkedin" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.linkedin.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-linkedin'],
			],
		],
	],

	'snapchat' => [
		'name' => '<span class="fab fa-snapchat g-pr-5"></span>  Snapchat',
		'html' => '<li 
					class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
					data-card-preset="snapchat">
			<a
				aria-label="https://www.snapchat.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-color-white text-center g-bg-snapchat g-bg-snapchat--hover"
				href="https://www.snapchat.com/"
				target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-snapchat" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.snapchat.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-snapchat'],
			],
		],
	],

	'flickr' => [
		'name' => '<span class="fab fa-flickr g-pr-5"></span>  Flickr',
		'html' => '<li 
					class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
					data-card-preset="flickr">
			<a
				aria-label="https://www.flickr.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-color-white text-center g-bg-flickr g-bg-flickr--hove"
				href="https://www.flickr.com/"
				target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-flickr" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.flickr.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-flickr'],
			],
		],
	],

	'soundcloud' => [
		'name' => '<span class="fab fa-soundcloud g-pr-5"></span>  Soundcloud',
		'html' => '<li 
					class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
					data-card-preset="soundcloud">
			<a
				aria-label="https://soundcloud.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-color-white text-center g-bg-soundcloud g-bg-soundcloud--hover"
				href="https://soundcloud.com/"
				target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-soundcloud" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://soundcloud.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-soundcloud'],
			],
		],
	],
	
	'dribbble' => [
		'name' => '<span class="fa fa-dribbble"></span> Dribbble',
		'html' => '<li class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
			data-card-preset="dribbble">
			<a aria-label="https://dribbble.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-bg-dribbble--hover g-bg-dribbble g-color-white text-center" href="https://dribbble.com/" target="_blank">
				<i class="landing-block-node-list-item-icon fa fa-dribbble" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://dribbble.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fa', 'fa-dribbble'],
			],
		],
	],

	'rocketchat' => [
		'name' => '<span class="fab fa-rocketchat g-pr-5"></span>  Rocket.chat',
		'html' => '<li 
					class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
					data-card-preset="rocketchat">
			<a
				aria-label="https://rocket.chat/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-color-white text-center g-bg-rocket-chat g-bg-rocket-chat--hover"
				href="https://rocket.chat/"
				target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-rocketchat" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://rocket.chat/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-rocketchat'],
			],
		],
	],
];

$resultCnZone = [
	'renren' => [
		'name' => '<span class="fab fa-renren g-pr-5"></span>  Renren',
		'html' => '<li 
					class="landing-block-node-list-item col g-pl-0 g-pr-0 g-pt-0 g-pb-0 g-min-width-110 list-inline-item g-mr-0"
					data-card-preset="renren">
			<a
				aria-label="https://www.renren.com/" class="landing-block-node-list-item-link d-block g-py-15 g-px-30 g-color-white text-center g-bg-renren g-bg-renren--hover"
				href="https://www.renren.com/"
				target="_blank">
				<i class="landing-block-node-list-item-icon fab fa-renren" aria-hidden="true"></i>
			</a>
		</li>',
		'disallow' => ['.landing-block-node-list-item-icon'],
		'values' => [
			'.landing-block-node-list-item-link' => [
				'href' => 'https://www.renren.com/',
				'target' => '_blank',
			],
			'.landing-block-node-list-item-icon' => [
				'type' => 'icon',
				'classList' => ['fab', 'fa-renren'],
			],
		],
	],
];

if (!in_array(Manager::getZone(), ['ru', 'kz', 'by', 'uz']))
{
	unset($result['vk'], $result['odnoklassniki']);
}

if (Manager::getZone() === 'cn')
{
	$result = array_merge($result, $resultCnZone);
}

return $result;