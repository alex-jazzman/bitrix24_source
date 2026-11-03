import {RecentWidgetItem} from "../lib/element/recent/types/base";
import {JNListWidgetSectionItem} from "../../../../../../../../mobile/dev/janative/api";

export type RecentItemButtonContractProfile = {
	platform: string
	chatRecentItemButtonEnabled: boolean
	vibecodeButtonAvailable: boolean
	vibecodeRecentActionAvailable: boolean
}

export type RecentViewCacheData = {
	theme: string
	epoch: number
	sections: JNListWidgetSectionItem[]
	items: RecentWidgetItem[]
	recentItemButtonContractProfile: RecentItemButtonContractProfile
}
