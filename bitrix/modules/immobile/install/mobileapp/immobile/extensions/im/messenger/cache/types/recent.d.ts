import {RecentWidgetItem} from "../../lib/element/recent/types/base";
import {RecentItemButtonContractProfile} from "../types";
import {JNListWidgetSectionItem} from "../../../../../../../../../mobile/dev/janative/api";

export type RecentViewCachePendingSave = {
	sections: Array<JNListWidgetSectionItem>,
	itemList: Array<RecentWidgetItem>,
	theme: string,
	epoch: number,
	recentItemButtonContractProfile: RecentItemButtonContractProfile,
}
