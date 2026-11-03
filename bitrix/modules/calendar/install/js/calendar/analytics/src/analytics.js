import { Type } from 'main.core';
import { sendData } from 'ui.analytics';

export type AnalyticsContext = {
	event: string,
	cSection?: string,
	cSubSection?: string,
	cElement?: string,
	type?: string,
	projectId?: number,
	userType?: string,
	status?: 'success' | 'error' | 'attempt' | 'cancel',
};

export class Analytics
{
	static tool = 'calendar';
	static category = 'calendar';

	/**
	 * Single public entry point for the `calendar` analytics category (TPL-02).
	 * Builds tool/category and valid p-fields, then delegates to ui.analytics sendData.
	 * Consumers (socialnetwork, tasks) call this method with their own cSubSection/cElement.
	 */
	static sendEvent(context: AnalyticsContext): void
	{
		if (!Type.isPlainObject(context) || !Type.isStringFilled(context.event))
		{
			return;
		}

		const payload = {
			tool: Analytics.tool,
			category: Analytics.category,
			event: context.event,
		};

		if (Type.isStringFilled(context.cSection))
		{
			payload.c_section = context.cSection;
		}

		if (Type.isStringFilled(context.cSubSection))
		{
			payload.c_sub_section = context.cSubSection;
		}

		if (Type.isStringFilled(context.cElement))
		{
			payload.c_element = context.cElement;
		}

		if (Type.isStringFilled(context.type))
		{
			payload.type = context.type;
		}

		if (Type.isStringFilled(context.status))
		{
			payload.status = context.status;
		}

		const userType = Analytics.#prepareUserType(context.userType);
		if (userType !== null)
		{
			payload.p2 = userType;
		}

		const projectId = Analytics.#prepareProjectId(context.projectId);
		if (projectId !== null)
		{
			payload.p4 = projectId;
		}

		sendData(payload);
	}

	/**
	 * p2 = user_intranet | user_extranet | user_collaber — exactly one underscore.
	 * @private
	 */
	static #prepareUserType(userType: ?string): string | null
	{
		if (!Type.isStringFilled(userType))
		{
			return null;
		}

		return userType.startsWith('user_') ? userType : `user_${userType}`;
	}

	/**
	 * p4 = projectId_<id группы> — only for project/group context, exactly one underscore.
	 * @private
	 */
	static #prepareProjectId(projectId: ?number): string | null
	{
		const id = parseInt(projectId, 10);
		if (!Type.isNumber(id) || id <= 0)
		{
			return null;
		}

		return `projectId_${id}`;
	}
}
