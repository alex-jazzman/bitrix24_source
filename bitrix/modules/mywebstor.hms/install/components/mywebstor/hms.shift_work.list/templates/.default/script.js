BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.ShiftWork");

    BX.MyWebstor.HMS.ShiftWork.List = function (gridID) {
        var grid = BX.Main.gridManager.getById(gridID);
        if (!grid) throw new Error("Grid not found");

        this.gridID = gridID;
        this.grid = grid.instance;
    };

    BX.MyWebstor.HMS.ShiftWork.List.prototype.delete = function (shiftWorkID = 0) {
        if (shiftWorkID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.shift_work.list", "delete", {
                mode: "class",
                data: {
                    shiftWorkID,
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
                        TITLE: "Delete error №" + shiftWorkID,
                        TEXT: errors,
                    },
                ];
                this.grid.messages.show();
            });
    };

    BX.MyWebstor.HMS.ShiftWork.List.Instance = null;
    BX.MyWebstor.HMS.ShiftWork.List.getInstance = function (gridID) {
        if (BX.MyWebstor.HMS.ShiftWork.List.Instance === null) BX.MyWebstor.HMS.ShiftWork.List.Instance = new BX.MyWebstor.HMS.ShiftWork.List(gridID);

        return BX.MyWebstor.HMS.ShiftWork.List.Instance;
    };
});
