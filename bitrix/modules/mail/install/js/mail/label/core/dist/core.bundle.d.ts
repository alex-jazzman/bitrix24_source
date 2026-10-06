/* eslint-disable */
type LabelDto = {
	id: number;
	name: string;
	mailboxId: number;
	sort: number;
	unread: number;
};

type LabelCounters = {
	[labelId: string]: number;
};

declare namespace BX.Mail.Label.Core {
	const apiClient: ApiClient;

	class ApiClient {
		list(mailboxId?: number | null): Promise<LabelDto[]>;
		messageLabels(id: string): Promise<number[]>;
		commonMessageLabels(ids: string[]): Promise<number[]>;
		add(name: string, mailboxId?: number): Promise<LabelDto>;
		update(id: number, name: string): Promise<LabelDto>;
		delete(id: number): Promise<void>;
		assign(labelIds: number[], ids: string[]): Promise<string[]>;
		unassign(labelIds: number[], ids: string[]): Promise<string[]>;
	}

	class LabelCollection {
		constructor(labels?: LabelDto[]);
		setAll(labels: LabelDto[]): void;
		getAll(): LabelDto[];
		getById(id: number): LabelDto | null;
		upsert(label: LabelDto): void;
		remove(id: number): void;
		updateCounters(counters: LabelCounters): void;
		isEmpty(): boolean;
	}
}
