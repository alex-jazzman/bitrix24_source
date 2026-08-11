import { Loc, Type } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import { type MenuItemOptions } from 'ui.system.menu';

import { type InsertContext } from 'messageservice.message.editor';

import { type ServiceLocator } from '../service/service-locator';
import { BaseContentProvider } from './base-content-provider';

export class SalesCenterContentProvider extends BaseContentProvider<{
	isLocked: boolean,
	ownerTypeId: number,
	ownerId: number,
	mode: string,
	st: Object,
	canSendMessage: boolean,
}>
{
	#locator: ServiceLocator;
	#source = null;
	#paymentId = null;
	#shipmentId = null;
	#compilationProductIds = [];

	constructor(serverData: Object, locator: ServiceLocator)
	{
		super(serverData);
		this.#locator = locator;
	}

	getMenuItems(ctx: InsertContext): Array<MenuItemOptions>
	{
		return [{
			title: Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_PAYMENT'),
			icon: Outline.MONEY,
			isLocked: this.getCustomData().isLocked,
			onClick: async () => {
				if (this.getCustomData().isLocked)
				{
					this.#locator.getSalescenterService().showSalescenterDisabledSlider();

					return;
				}

				ctx.setLoading(true);
				try
				{
					const result = await this.#locator.getSalescenterService().openApplication(this.getCustomData());
					this.#processResult(ctx, result);
				}
				finally
				{
					ctx.setLoading(false);
				}
			},
		}];
	}

	#processResult(ctx: InsertContext, result): void
	{
		if (Type.isStringFilled(result.source))
		{
			this.#source = result.source;
		}

		const escape = this.#locator.getEscapeService();

		if (Type.isPlainObject(result.page))
		{
			ctx.insertPlaceholderText(`${escape.decode(result.page.name)} ${result.page.url}`);
			ctx.trackAction('salescenterPage');
		}
		else if (Type.isPlainObject(result.payment))
		{
			ctx.insertPlaceholderText(escape.decode(result.payment.name));

			if (!Type.isNil(result.payment.paymentId))
			{
				this.#paymentId = result.payment.paymentId;
			}

			if (!Type.isNil(result.payment.shipmentId))
			{
				this.#shipmentId = result.payment.shipmentId;
			}

			ctx.trackAction('salescenterPayment');
		}
		else if (Type.isPlainObject(result.compilation))
		{
			ctx.insertPlaceholderText(escape.decode(result.compilation.name));

			if (Type.isArray(result.compilation.productIds))
			{
				this.#compilationProductIds = result.compilation.productIds;
			}

			ctx.trackAction('salescenterCompilation');
		}
	}

	getSendData(): Object
	{
		return {
			source: this.#source,
			paymentId: this.#paymentId,
			shipmentId: this.#shipmentId,
			compilationProductIds: this.#compilationProductIds,
		};
	}

	resetSendData(): void
	{
		this.#source = null;
		this.#paymentId = null;
		this.#shipmentId = null;
		this.#compilationProductIds = [];
	}
}
