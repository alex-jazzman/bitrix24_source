import { Tag, Type, Loc } from 'main.core';
import { Icon } from 'ui.icon-set.api.core';

import { BaseStub } from './base-stub';
import { encodeUrl } from '../../common/encode-url';

export class DefaultStub extends BaseStub
{
	content: HTMLElement | null = null;

	getContainer(): HTMLElement
	{
		return this.cache.remember('container', () => {
			const subtitle = this.getOption<string>('subtitle');
			const title = Type.isStringFilled(this.getOption<string>('title')) ? this.getOption<string>('title') : this.getDefaultTitle();

			const icon = this.getOption<string>('icon') || this.getTab().getIcon('default');
			let iconOpacity = 35;
			if (Type.isNumber(this.getOption<number>('iconOpacity')))
			{
				iconOpacity = Math.min(100, Math.max(0, this.getOption<number>('iconOpacity')));
			}

			const iconStyle = Type.isStringFilled(icon) && !Icon.isValid({ icon })
				? `style="background-image: url('${encodeUrl(icon)}'); opacity: ${iconOpacity / 100};"`
				: ''
			;

			const arrow = this.getOption('arrow', false) && this.getTab().getDialog().getActiveFooter() !== null;

			return Tag.render`
				<div class="ui-selector-tab-default-stub">
					<div class="ui-selector-tab-default-stub-icon" ${iconStyle}></div>
					<div class="ui-selector-tab-default-stub-titles">
						<div class="ui-selector-tab-default-stub-title">${title}</div>
						${subtitle ? Tag.render`<div class="ui-selector-tab-default-stub-subtitle">${subtitle}</div>` : ''}
					</div>
					${arrow ? Tag.render`<div class="ui-selector-tab-default-stub-arrow"></div>` : ''}
				</div>
			`;
		});
	}

	getDefaultTitle(): string
	{
		const titleNode = this.getTab().getTitleNode();
		if (titleNode === null)
		{
			return Loc.getMessage('UI_SELECTOR_TAB_STUB_TITLE')!.replace(/#TAB_TITLE#/, '');
		}

		const titleContainer = Tag.render`<span class="ui-selector-tab-default-stub-title"></span>`;
		titleNode.renderTo(titleContainer);

		return Loc.getMessage('UI_SELECTOR_TAB_STUB_TITLE')!.replace(/#TAB_TITLE#/, titleContainer.innerHTML);
	}

	render(): HTMLElement
	{
		return this.getContainer();
	}
}
