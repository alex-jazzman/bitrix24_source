import { BaseMainTool } from './base-main-tool';
import { SidePanel } from 'main.sidepanel';
import { Analytics } from '../analytics';
import { Counter, CounterStyle } from 'ui.cnt';
import { PULL } from 'pull.client';
import { Dom } from 'main.core';

export class SecurityTool extends BaseMainTool
{
	getIconClass(): string
	{
		return '--o-shield-checked';
	}

	onClick(): void
	{
		Analytics.send(Analytics.EVENT_CLICK_2FA_SETUP);
		SidePanel.Instance.open(this.options.url, { width: 1100 });
	}

	getCounter(): ?Counter
	{
		return this.cache.remember('counter', () => {
			if (!this.options.hasCounter)
			{
				return null;
			}

			PULL.subscribe({
				moduleId: 'intranet',
				command: this.options.counterEventName,
				callback: () => {
					this.getCounter().destroy();
					const icon = this.getLayout().querySelector('.intranet-avatar-widget-item__icon');
					Dom.removeClass(icon, '--active');
					this.cache.delete('counter');
				},
			});

			return new Counter({
				color: Counter.Color.DANGER,
				size: Counter.Size.MEDIUM,
				value: 1,
				style: CounterStyle.FILLED_ALERT,
				useAirDesign: true,
			});
		});
	}

	getId(): string
	{
		return 'security';
	}
}
