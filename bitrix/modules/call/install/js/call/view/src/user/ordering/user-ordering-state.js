/**
 * Mutable state of a single user list ordering pass.
 *
 * Built by View.#prepareUserOrdering and refined by the rule processors it calls. A plain
 * container, not an encapsulated object: the counters and the queues that outlive a single
 * statement have methods, the rest is written by the caller directly. That is a deliberate
 * choice for state that lives no longer than one pass through the grid.
 */
export class UserOrderingState
{
	constructor()
	{
		this.usersWithVideo = [];
		this.usersWithEnabledVideo = [];
		this.usersWithDisabledVideo = [];
		this.unpairedVideoEnabled = [];
		this.unpairedVideoDisabled = [];
		this.activeUsers = null;
		this.possibleActiveUsers = null;
		this.usersToKeepActive = [];
		this.usersToForceDeactivation = [];
		this.currentPageUsers = 0;
		this.orderChanges = [];
		this.incompleteSwaps = [];
		this.disconnectedUserHadVideo = false;
		this.usersToDeactivate = 0;
		this.videoDisabledProceed = false;
	}

	/**
	 * Video changes left after the enabled ones were paired off against the disabled ones.
	 * What remains is the queue the grid ordering still has to resolve.
	 */
	setUnpairedVideoChanges(videoEnabled, videoDisabled)
	{
		this.unpairedVideoEnabled = videoEnabled;
		this.unpairedVideoDisabled = videoDisabled;
	}

	addUserToCurrentPage()
	{
		this.currentPageUsers++;
	}

	removeUserFromCurrentPage()
	{
		this.currentPageUsers--;
	}

	requestUserDeactivation()
	{
		this.usersToDeactivate++;
	}

	cancelUserDeactivation()
	{
		this.usersToDeactivate--;
	}

	clearOrderChanges()
	{
		this.orderChanges.length = 0;
	}

	setOrderChangeTarget(index, target)
	{
		this.orderChanges[index].to = target;
	}

	markDisconnectedUserHadVideo()
	{
		this.disconnectedUserHadVideo = true;
	}
}
