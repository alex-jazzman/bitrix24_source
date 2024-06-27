BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Schedule");

    BX.MyWebstor.HMS.Schedule.List = function (gridID) {
        var grid = BX.Main.gridManager.getById(gridID);
        if (!grid) throw new Error("Grid not found");

        this.gridID = gridID;
        this.grid = grid.instance;
    };

    BX.MyWebstor.HMS.Schedule.List.prototype.delete = function (scheduleID = 0) {
        if (scheduleID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.schedule.list", "delete", {
                mode: "class",
                data: {
                    scheduleID,
                },
            })
            .then((result) => {
                this.grid.reloadTable();
            })
            .catch((result) => {
                var errors = result.errors.shift().message;
                this.grid.arParams.MESSAGES = [
                    {
                        TYPE: "error",
                        TITLE: "Delete error №" + scheduleID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.Schedule.List.Instance = null;
    BX.MyWebstor.HMS.Schedule.List.getInstance = function (gridID) {
        if (BX.MyWebstor.HMS.Schedule.List.Instance === null) BX.MyWebstor.HMS.Schedule.List.Instance = new BX.MyWebstor.HMS.Schedule.List(gridID);

        return BX.MyWebstor.HMS.Schedule.List.Instance;
    };
});
