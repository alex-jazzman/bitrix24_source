/* eslint-disable */
type ProjectCreateProperties = {
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

type SectionConfig = {
	tool: string;
	category?: string;
	event: string;
	cElement: string;
};

declare namespace BX.Socialnetwork.V2.Lib {
	function trackProjectCreateStart(context?: {
		element?: string;
		kind?: 'project' | 'task';
	}): void;

	function trackOpenSection(config: {
		tool: string;
		category?: string;
		event: string;
		cSection: string;
		cElement: string;
	}): void;

	class ProjectAnalytics {
		constructor();
		trackArchive(entityId: number, status: string): void;
		trackUnarchive(entityId: number, status: string): void;
		trackDelete(entityId: number, status: string): void;
		trackView(entityId: number): void;
		trackCreateStart(context?: {
			element?: string;
			kind?: 'project' | 'task';
		}): void;
		trackCreateFinish(entityId: number, status: string, properties: ProjectCreateProperties): void;
	}

	class SectionAnalytics {
		constructor();
		trackOpen(config: SectionConfig, projectId: number): void;
	}
}
