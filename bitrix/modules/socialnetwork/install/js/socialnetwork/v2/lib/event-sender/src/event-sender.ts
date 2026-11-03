import { Extension, Type } from 'main.core';
import { sendData } from 'ui.analytics';
import type { AnalyticsOptions } from 'ui.analytics';

const VIEW_DEDUP_WINDOW_MS = 1000;

type Settings = {
	isDemo?: string;
	userType?: string;
};

type SendInput = {
	event: string;
	entityId: number;
	status: string;
	element?: string;
	p5?: string;
	kind?: 'project' | 'task';
};

export type ProjectCreateProperties = {
	ownerChange: 0 | 1;
	moderators: number;
	participants: number;
	departments: number;
	projectType: 'open' | 'closed';
	mainTool: string;
	accessRightsState: 0 | 1;
	additionalSettingsCalendar: 0 | 1;
	additionalSettingsAutoDelete: 0 | 1;
};

export class ProjectAnalytics
{
	#isDemo: string;
	#userType: string;
	#lastViewEntityId: string | null = null;
	#lastViewAt: number = 0;

	constructor()
	{
		const settings = Extension.getSettings('socialnetwork.v2.lib.event-sender') as Settings;
		this.#isDemo = Type.isStringFilled(settings.isDemo) ? settings.isDemo : 'N';
		this.#userType = Type.isStringFilled(settings.userType) ? settings.userType : '';
	}

	trackArchive(entityId: number, status: string): void
	{
		this.#sendContextMenuAction('project_archive', entityId, status);
	}

	trackUnarchive(entityId: number, status: string): void
	{
		this.#sendContextMenuAction('project_unarchive', entityId, status);
	}

	trackDelete(entityId: number, status: string): void
	{
		this.#sendContextMenuAction('project_delete', entityId, status);
	}

	trackView(entityId: number): void
	{
		if (this.#isViewDuplicate(entityId))
		{
			return;
		}

		this.#send({
			event: 'project_view',
			entityId,
			status: 'success',
		});
	}

	trackCreateStart(context?: { element?: string; kind?: 'project' | 'task' }): void
	{
		this.#send({
			event: 'project_create_start',
			entityId: 0,
			status: 'success',
			element: context?.element,
			kind: context?.kind,
		});
	}

	trackCreateFinish(entityId: number, status: string, properties: ProjectCreateProperties): void
	{
		this.#send({
			event: 'project_create_finish',
			entityId,
			status,
			p5: buildProjectProperties(properties),
		});
	}

	#sendContextMenuAction(event: string, entityId: number, status: string): void
	{
		this.#send({ event, entityId, status, element: 'context_menu' });
	}

	#isViewDuplicate(entityId: number): boolean
	{
		const key = String(entityId);
		const now = Date.now();
		if (key === this.#lastViewEntityId && now - this.#lastViewAt < VIEW_DEDUP_WINDOW_MS)
		{
			return true;
		}
		this.#lastViewEntityId = key;
		this.#lastViewAt = now;

		return false;
	}

	#send({ event, entityId, status, element, p5, kind }: SendInput): void
	{
		const payload: AnalyticsOptions = {
			tool: 'projects',
			category: 'project',
			event,
			c_section: 'project',
			status: status as AnalyticsOptions['status'],
			p1: `isDemo_${this.#isDemo}`,
			p2: this.#userType,
			p4: `projectId_${entityId}`,
		};

		if (Type.isStringFilled(element))
		{
			payload.c_element = element;
		}

		if (Type.isStringFilled(p5))
		{
			payload.p5 = p5;
		}

		if (Type.isStringFilled(kind))
		{
			payload.type = kind;
		}

		sendData(payload);
	}
}

function buildProjectProperties(properties: ProjectCreateProperties): string
{
	// Keys mirror the product spec (project_properties). A p-field value may contain at most one
	// underscore, otherwise BX.UI.Analytics silently drops the whole event in production — so every
	// "_" (in keys and free-text values alike) is replaced with "-" on the serialized result below.
	const payload = {
		owner_change: properties.ownerChange,
		moderators: properties.moderators,
		participants: properties.participants,
		departments: properties.departments,
		project_type: properties.projectType,
		main_tool: properties.mainTool,
		access_rights_state: properties.accessRightsState,
		additional_settings_calendar: properties.additionalSettingsCalendar,
		additional_settings_auto_delete: properties.additionalSettingsAutoDelete,
	};

	return JSON.stringify(payload).replace(/_/g, '-');
}

export type SectionConfig = {
	tool: string;
	category?: string;
	event: string;
	cElement: string;
};

export class SectionAnalytics
{
	#isDemo: string;
	#userType: string;

	constructor()
	{
		const settings = Extension.getSettings('socialnetwork.v2.lib.event-sender') as Settings;
		this.#isDemo = Type.isStringFilled(settings.isDemo) ? settings.isDemo : 'N';
		this.#userType = Type.isStringFilled(settings.userType) ? settings.userType : '';
	}

	trackOpen(config: SectionConfig, projectId: number): void
	{
		const payload: AnalyticsOptions = {
			tool: config.tool,
			category: config.category ?? '',
			event: config.event,
			c_section: 'project',
			c_element: config.cElement,
			status: 'success',
			p1: `isDemo_${this.#isDemo}`,
			p2: this.#userType,
			p4: `projectId_${projectId}`,
		};

		sendData(payload);
	}
}

export function trackProjectCreateStart(context?: { element?: string; kind?: 'project' | 'task' }): void
{
	(new ProjectAnalytics()).trackCreateStart(context);
}

export function trackOpenSection(config: { tool: string; category?: string; event: string; cSection: string; cElement: string }): void
{
	const settings = Extension.getSettings('socialnetwork.v2.lib.event-sender') as Settings;
	const isDemo = Type.isStringFilled(settings.isDemo) ? settings.isDemo : 'N';
	const userType = Type.isStringFilled(settings.userType) ? settings.userType : '';

	const payload: AnalyticsOptions = {
		tool: config.tool,
		category: config.category ?? '',
		event: config.event,
		c_section: config.cSection,
		c_element: config.cElement,
		status: 'success',
		p1: `isDemo_${isDemo}`,
		p2: userType,
	};

	sendData(payload);
}

