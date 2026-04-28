import { BitrixVueComponentProps } from 'ui.vue3';
import { Event, Type } from 'main.core';

import { Alert } from '../alert';

export const DownloadAlert: BitrixVueComponentProps = {
	name: 'DownloadAlert',

	props: {
		phrase: {
			type: String,
			required: true,
		},
		downloadUrl: {
			type: [
				String,
				Function,
			],
			default: () => null,
		},
	},

	components: {
		Alert,
	},

	methods: {
		content(): string
		{
			return this.$Bitrix.Loc.getMessage(this.phrase)
				.replace('[link]', '<a class="download-link">')
				.replace('[/link]', '</a>');
		},

		handleDownloadClick(event: MouseEvent): void
		{
			event.preventDefault();

			const link = document.createElement('a');

			if (Type.isString(this.downloadUrl))
			{
				link.href = this.downloadUrl;
			}
			else if (Type.isFunction(this.downloadUrl))
			{
				link.href = (this.downloadUrl)();
			}
			else
			{
				return;
			}

			link.download = '';
			link.target = '_blank';

			link.click();
		},
	},

	mounted(): void
	{
		const linkElement = this.$el?.querySelector?.('.download-link');
		if (linkElement)
		{
			Event.bind(linkElement, 'click', this.handleDownloadClick);
		}
	},

	beforeUnmount(): void
	{
		const linkElement = this.$el?.querySelector?.('.download-link');
		if (linkElement)
		{
			Event.unbind(linkElement, 'click', this.handleDownloadClick);
		}
	},

	template: `
		<Alert v-if="downloadUrl !== null" v-html="content()" />
	`,
};
