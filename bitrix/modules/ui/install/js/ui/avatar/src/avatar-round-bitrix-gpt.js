import { Tag } from 'main.core';
import AvatarRoundGuest from './avatar-round-guest';

export default class AvatarRoundBitrixGpt extends AvatarRoundGuest
{
	getDefaultUserPic(): SVGElement
	{
		if (!this.node.svgDefaultUserPic)
		{
			this.node.svgDefaultUserPic = this.getSvgElement(
				'svg',
				{ width: 86, height: 86, viewBox: '0 0 86 86', x: 8, y: 8 },
			);

			this.node.svgDefaultUserPic.innerHTML = `
				<mask id="ui-avatar-bitrix-gpt-mask-${this.getUnicId()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="86" height="86">
					<circle cx="43" cy="43" r="42.5" fill="#D9D9D9"/>
				</mask>
				<g mask="url(#ui-avatar-bitrix-gpt-mask-${this.getUnicId()})">
					<g clip-path="url(#ui-avatar-bitrix-gpt-clip-${this.getUnicId()})">
						<image width="86" height="86" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/jpeg;base64,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"/>
					</g>
					<g opacity="0.18" style="transform: translate(2px, 18px)">
						<path d="M112.222 11.7184C130.289 34.0744 124.796 62.8974 123.772 67.4812C123.682 67.8845 123.386 68.1826 122.987 68.2882C119.933 69.0955 105.428 72.3307 69.1274 72.3288C33.8923 72.327 -3.83788 64.3812 -14.3938 61.9903C-15.41 61.7601 -15.5722 60.4115 -14.6527 59.9214C-10.2147 57.556 -0.670855 52.4386 9.976 46.5407C19.0097 41.5364 30.7259 34.9153 35.1807 32.071C46.8729 24.6058 54.1074 19.1159 59.1913 15.3878C64.2752 11.6597 92.5387 -12.6382 112.222 11.7184Z" fill="url(#ui-avatar-bitrix-gpt-glance-gradient-${this.getUnicId()})"/>
					</g>
				</g>
				<defs>
					<clipPath id="ui-avatar-bitrix-gpt-clip-${this.getUnicId()}">
						<circle cx="43" cy="43" r="42.5"/>
					</clipPath>
					<linearGradient id="ui-avatar-bitrix-gpt-glance-gradient-${this.getUnicId()}" x1="125.354" y1="34.5565" x2="-17.2805" y2="34.5565" gradientUnits="userSpaceOnUse">
						<stop offset="0.2" stop-color="white" stop-opacity="0.8"/>
						<stop offset="1" stop-color="white" stop-opacity="0.12"/>
					</linearGradient>
				</defs>
			`;
		}

		return this.node.svgDefaultUserPic;
	}

	getContainer(): HTMLElement
	{
		if (!this.node.avatar)
		{
			this.node.avatar = Tag.render`
				<div class="ui-avatar --round --bitrix-gpt">
					<svg viewBox="0 0 102 102">
						<circle class="ui-avatar-border-inner" cx="51" cy="51"/>
						${this.getDefaultUserPic()}
						<path class="ui-avatar-border" fill="url(#ui-avatar-gradient-bitrix-gpt-${this.getUnicId()})" d="M51 98.26C77.101 98.26 98.26 77.101 98.26 51C98.26 24.899 77.101 3.74 51 3.74C24.899 3.74 3.74 24.899 3.74 51C3.74 77.101 24.899 98.26 51 98.26ZM51 102C79.1665 102 102 79.1665 102 51C102 22.8335 79.1665 0 51 0C22.8335 0 0 22.8335 0 51C0 79.1665 22.8335 102 51 102Z"/>
						<linearGradient id="ui-avatar-gradient-bitrix-gpt-${this.getUnicId()}" x1="1.97114e-06" y1="-2.125" x2="102" y2="102" gradientUnits="userSpaceOnUse">
							<stop offset="0.122725" stop-color="#FFB61A"/>
							<stop offset="0.381008" stop-color="#F046B7"/>
							<stop offset="0.682691" stop-color="#9D48FF"/>
							<stop offset="1" stop-color="#3F68FF"/>
						</linearGradient>
					</svg>
				</div>
			`;
		}

		return this.node.avatar;
	}
}
