import { Dom, Tag, Type, Loc } from 'main.core';
import { PULL } from 'pull.client';
import { Counter } from 'ui.cnt';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { Content } from './content';
import { Router } from 'crm.router';
import type { SignDocumentsContentOptions } from '../types';

export class SignDocumentsContent extends Content
{
	getOptions(): SignDocumentsContentOptions
	{
		return super.getOptions();
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			const onclick = () => {
				this.#onClick();
			};

			return Tag.render`
				<div onclick="${onclick}" class="intranet-avatar-widget-item__wrapper" data-id="bx-avatar-widget-content-sign-documents">
					<i class="ui-icon-set ${this.#getCounter() ? '--active' : ''} --o-file intranet-avatar-widget-item__icon"/>
					<div class="intranet-avatar-widget-item__info-wrapper">
						<span class="intranet-avatar-widget-item__title">
							${this.getOptions().title}
						</span>
						<span class="intranet-avatar-widget-item__description">
							${this.getOptions().description}
						</span>
					</div>
					${this.#getCounterWrapper()}
					<i class="ui-icon-set --chevron-right-m intranet-avatar-widget-item__chevron"/>
				</div>
			`;
		});
	}

	#getCounter(): ?Counter
	{
		return this.cache.remember('counter', () => {
			if (Number(this.getOptions().counter) < 1)
			{
				return null;
			}

			PULL.subscribe({
				moduleId: 'sign',
				command: this.getOptions().counterEventName,
				callback: (params) => {
					if (!Type.isNumber(params?.needActionCount))
					{
						return;
					}

					this.getOptions().counter = params.needActionCount;

					if (params?.needActionCount > 0)
					{
						this.#getCounter().update(params.needActionCount);
					}
					else
					{
						this.#getCounter().destroy();
						const icon = this.getLayout().querySelector('.intranet-avatar-widget-item__icon');
						Dom.removeClass(icon, '--active');
						this.cache.delete('counter');
					}
				},
			});

			return new Counter({
				color: Counter.Color.DANGER,
				size: Counter.Size.MEDIUM,
				value: this.getOptions().counter,
			});
		});
	}

	#getCounterWrapper(): HTMLElement
	{
		return this.cache.remember('counterWrapper', () => {
			const counter = this.#getCounter();

			return Tag.render`
				<div class="intranet-avatar-widget-item__counter">
					${counter?.render()}
				</div>
			`;
		});
	}

	#onClick(): void
	{
		if (this.getOptions().isLocked)
		{
			FeaturePromotersRegistry.getPromoter({ code: 'limit_office_e_signature' }).show();

			return;
		}

		const userId = Number(Loc.getMessage('USER_ID'));

		if (userId > 0)
		{
			Router.openSlider(
				`${Loc.getMessage('SITE_DIR')}company/personal/user/${userId}/sign?noRedirect=Y`,
				{ width: 1000, cacheable: false },
			);
		}
	}
}
