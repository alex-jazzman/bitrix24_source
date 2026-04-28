declare type SmileServerItem = {
	definition: string
	height: number
	id: number
	image: string
	name: string
	setId: number
	typing: string
	width: number
}

declare type SmileServerResult = Array<SmileServerItem>;

declare type SmileRow = {
	id: number
	setId: number
	width: number
	height: number
	imageUrl: string
	typing: string
	name: string
}

declare interface ISmileManager {
	getSmilesUrl(): Set<string>;
	getSmiles(): Record<string, object>;
	getPattern(): string;
	ready(): Promise<ISmileManager>;
}
