import { Loc, Text, Type } from 'main.core';

export class DescriptionBlock
{
	constructor(description: string)
	{
		this.description = description;
	}

	render(): string
	{
		const descriptionTitle = Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_DESCRIPTION_TITLE') ?? '';

		return `
			<div class="report__row">
				<div class="report__description">
					<div class="report__description-title">
						${Text.encode(descriptionTitle)}
					</div>
					<div class="report__description-content">
						${this.description}
					</div>
				</div>
			</div>
		`;
	}

	static getDescriptionValue(descriptionRaw: any, emptyDescriptionPath: string): string
	{
		if (Type.isStringFilled(descriptionRaw))
		{
			return DescriptionBlock.prepareDescriptionMarkup(descriptionRaw);
		}

		return DescriptionBlock.getDescriptionEmptyMarkup(emptyDescriptionPath);
	}

	static prepareDescriptionMarkup(descriptionRaw: string): string
	{
		if (!Type.isStringFilled(descriptionRaw))
		{
			return '';
		}

		const container = document.createElement('div');
		container.innerHTML = descriptionRaw;

		container.querySelectorAll('a[href]').forEach((link: HTMLAnchorElement) => {
			link.setAttribute('target', '_blank');
			link.setAttribute('data-slider-ignore-autobinding', 'true');

			const relValues = new Set(
				(link.getAttribute('rel') ?? '')
					.split(/\s+/)
					.filter(Boolean),
			);
			relValues.add('noopener');
			relValues.add('noreferrer');
			link.setAttribute('rel', Array.from(relValues).join(' '));
		});

		return container.innerHTML;
	}

	static getDescriptionEmptyMarkup(emptyDescriptionPath: string): string
	{
		const safeDescriptionPath = Text.encode(emptyDescriptionPath);
		const emptyMessage = Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_DESCRIPTION_EMPTY') ?? '';

		return `
			<div class="report__description-empty">
				<div class="report__description-empty__image">
					<img src="${safeDescriptionPath}" alt=""/>
				</div>
				<div class="report__description-empty__text">
					${Text.encode(emptyMessage)}
				</div>
			</div>
		`;
	}
}
