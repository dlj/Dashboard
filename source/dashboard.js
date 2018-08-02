"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Direction;
(function (Direction) {
    Direction[Direction["up"] = 0] = "up";
    Direction[Direction["right"] = 1] = "right";
    Direction[Direction["down"] = 2] = "down";
    Direction[Direction["left"] = 3] = "left";
})(Direction || (Direction = {}));
var DashboardOptions = /** @class */ (function () {
    function DashboardOptions() {
    }
    return DashboardOptions;
}());
var Cell = /** @class */ (function () {
    function Cell() {
    }
    Cell.prototype.reset = function () {
        if (this.content != null)
            this.content.element.remove();
        this.up = null;
        this.down = null;
        this.right = null;
        this.left = null;
        this.content = null;
    };
    return Cell;
}());
exports.Cell = Cell;
var Dashboard = /** @class */ (function () {
    function Dashboard(options) {
        this.grid = null;
        this.options = options;
        this.cells = [];
        if (this.options.rows <= 0)
            throw "Dashboard needs to be created with more than 1 row";
        if (this.options.columns <= 0)
            throw "Dashboard needs to be created with more than 1 column";
        $(options.container).append(this.generateDOMGrid(options.rows, options.columns));
        $("#can").width($(this.options.container).width());
        $("#can").height($(this.options.container).height());
    }
    Dashboard.prototype.generateDOMGrid = function (rows, columns) {
        this.grid = $("<div>");
        this.grid.addClass("dashboardGrid");
        this.grid.css({
            "grid-template-columns": "repeat(" + columns + ", 1fr)",
            "grid-template-rows": "repeat(" + rows + ", 1fr)",
            "display": "grid",
            "height": "100%",
            "width": "100%",
            "position": "absolute"
        });
        for (var rowi = 0; rowi < rows; rowi++) {
            for (var columni = 0; columni < columns; columni++) {
                if (this.cells[rowi] === undefined)
                    this.cells[rowi] = [];
                this.cells[rowi][columni] = this.createCell(rowi, columni);
                var hejdiv = $("<div>");
                hejdiv.append("<span>" + rowi + "," + columni + "</span>");
                hejdiv.height((this.options.container.height() / rows));
                hejdiv.width((this.options.container.width() / columns) - 13);
                hejdiv.css({ float: "left", "text-align": "center", "line-height": hejdiv.height() + "px", "border": "1px solid black", "z-index": 2, "position": "relative", "box-sizing": "border-box" });
                $(this.options.container).append(hejdiv);
                //this.grid.append($("<div class='dashboardCell'>"))             
            }
        }
        return this.grid;
    };
    Dashboard.prototype.createCell = function (row, column) {
        var c = new Cell();
        c.row = row;
        c.column = column;
        if (row !== 0) {
            c.left = this.cells[row - 1][column];
            c.left.right = c;
        }
        if (column !== 0) {
            c.up = this.cells[row][column - 1];
            c.up.down = c;
        }
        return c;
    };
    Dashboard.prototype.clear = function () {
        // This might clear invoke the GC faster than just setting cells to []. Who knows ?
        for (var rowi = 0; rowi < this.options.rows; rowi++) {
            for (var columni = 0; columni < this.options.columns; columni++) {
                this.cells[rowi][columni].reset();
            }
        }
    };
    Dashboard.prototype.findRoom = function (cell) {
        var startCell = null;
        var endCell = null;
        for (var columni = 0; columni < this.options.columns; columni++) {
            for (var rowi = 0; rowi < this.options.rows; rowi++) {
                if (this.cells[rowi][columni].content == null) {
                    if (startCell === null)
                        startCell = this.cells[rowi][columni];
                    endCell = this.cells[rowi][columni];
                }
            }
        }
        if (startCell !== null && endCell !== null)
            return [startCell, endCell];
        else
            return null;
    };
    Dashboard.prototype.calculateSplit = function (widget, direction) {
        if (widget.startCell !== null && widget.endCell !== null) {
            // Find the best way to split a widget
            var widgetStartCell = widget.startCell;
            var widgetEndCell = widget.endCell;
            var emptyStartCordinates = [widgetStartCell.row, widgetStartCell.column];
            var emptyEndCordinates = [widgetEndCell.row, widgetEndCell.column];
            switch (direction) {
                case Direction.up:
                    widgetStartCell = this.cells[Math.ceil((widget.startCell.row + widget.endCell.row) / 2)][widget.startCell.column];
                    emptyEndCordinates = [widgetStartCell.row - 1, widgetEndCell.column];
                    break;
                case Direction.left:
                    widgetStartCell = this.cells[widget.startCell.row][Math.ceil((widget.endCell.column + widget.startCell.column) / 2)];
                    emptyEndCordinates = [widgetEndCell.row, widgetStartCell.column - 1];
                    break;
                case Direction.down:
                    widgetEndCell = this.cells[Math.floor((widget.endCell.row + widget.startCell.row) / 2)][widget.endCell.column];
                    emptyStartCordinates = [widgetEndCell.row + 1, widgetStartCell.column];
                    break;
                case Direction.right:
                    widgetEndCell = this.cells[widget.endCell.row][Math.floor((widget.startCell.column + widget.endCell.column) / 2)];
                    emptyStartCordinates = [widgetStartCell.row, widgetEndCell.column + 1];
                    break;
            }
            // No room to place the Widget
            if ((emptyStartCordinates[0] >= 0 && emptyStartCordinates[0] <= this.options.rows - 1)
                && (emptyStartCordinates[1] >= 0 && emptyStartCordinates[1] <= this.options.columns - 1)
                && (emptyEndCordinates[0] >= 0 && emptyEndCordinates[0] <= this.options.rows - 1)
                && (emptyEndCordinates[1] >= 0 && emptyEndCordinates[1] <= this.options.columns - 1)
                && (emptyStartCordinates[0] != widgetStartCell.row || emptyStartCordinates[1] != widgetStartCell.column || emptyEndCordinates[0] != widgetEndCell.row || emptyEndCordinates[1] != widgetEndCell.column)) {
                return [[widgetStartCell, widgetEndCell], [this.cells[emptyStartCordinates[0]][emptyStartCordinates[1]], this.cells[emptyEndCordinates[0]][emptyEndCordinates[1]]]];
            }
        }
        return null;
    };
    Dashboard.prototype.split = function (widget, direction) {
        if (widget.startCell !== null && widget.endCell !== null) {
            var cords = this.calculateSplit(widget, direction);
            // Could not find a place for the Widget
            if (cords == null)
                return false;
            // Find the best way to split a widget
            //let rowRemoveStart = widget.endCell.row - cords[1].row ;
            //let columnRemoveStart = widget.endCell.column- cords[1].column;
            //let rowRemoveEnd = widget.endCell.row - cords[0].row;        
            //let columnRemoveEnd = widget.endCell.column - cords[0].column;
            widget.startCell = cords[0][0];
            widget.endCell = cords[0][1];
            /*
                   switch (direction)
                   {
                       case Direction.up :
                     
                           widget.startCell = this.cells[Math.ceil((rowRemoveStart + widget.endCell.row) / 2)][columnRemoveStart]
                           rowRemoveEnd = widget.startCell.row - 1;
                       break;
                       case Direction.left :
                           widget.startCell = this.cells[rowRemoveStart][Math.ceil((columnRemoveEnd - widget.startCell.column) / 2)];
                           columnRemoveEnd = widget.startCell.column - 1;
                       break;
                       case Direction.down :
                           widget.endCell = this.cells[Math.floor((rowRemoveEnd + widget.startCell.row)/ 2)][columnRemoveEnd]
                           rowRemoveStart = widget.endCell.row + 1;
                       break;
                       case Direction.right :
                           widget.endCell = this.cells[rowRemoveEnd][Math.floor((columnRemoveStart + widget.endCell.column) / 2)];
                           columnRemoveStart = widget.endCell.column + 1;
                       break;
                   }
       */
            for (var rowi = cords[1][0].row; rowi <= cords[1][1].row; rowi++) {
                for (var columni = cords[1][0].column; columni <= cords[1][1].column; columni++) {
                    this.cells[rowi][columni].content = null;
                }
            }
            //    widget.startCell = this.cells[widget.startCell.row - rowStart][widget.startCell.column - columnStart];
            //      widget.endCell = this.cells[widget.endCell.row - rowEnd][widget.endCell.column - columnEnd]
        }
        return true;
    };
    Dashboard.prototype.place = function (content, placement, entry) {
        if (entry != undefined)
            $(this.options.container).append("<div style='height:30px;width:30px;position:absolute;top:" + entry[1] + ";left:" + entry[0] + ";background-color:red'>");
        var sCell = placement instanceof Cell ? placement : this.cells[placement[0]][placement[1]];
        if (sCell.content != null) {
            /*
          X-,Y+ |         | X+,Y+
          _ _ _ |_ _ _ _ _|_ _ _
                |\       /|
                |  \   /  |
                |   X,Y   |
                |  /   \  |
           _ _ _|/_ _ _ _\|_ _ _
                |         |
          X-,Y- |         | X+,Y-

            y
            |__ x

            */
            var dir = Direction.up;
            var cellWidth = this.grid.width() / this.options.columns;
            var cellHeight = this.grid.height() / this.options.rows;
            var gridPosition = $(this.options.container).position();
            var normalizedWidth = cellWidth / 2;
            var normalizedHeight = cellHeight / 2;
            //    let cellCenterY = (((sCell.row + 1) * cellHeight) + gridPosition.top) - normalizedHeight;
            //  let cellCenterX = (((sCell.column + 1) * cellWidth) + gridPosition.left) - normalizedWidth ; 
            //let cellCenterY = (((sCell.content.endCell.row - sCell.content.startCell.row + 1) * cellHeight) / 2) + gridPosition.top;
            //let cellCenterX = (((sCell.content.endCell.column -  sCell.content.startCell.column + 1) * cellWidth) / 2) + gridPosition.left; 
            var cellCenterY = (((sCell.content.endCell.row - sCell.content.startCell.row + 1) / 2) + sCell.content.startCell.row) * cellHeight + gridPosition.top;
            var cellCenterX = (((sCell.content.endCell.column - sCell.content.startCell.column + 1) / 2) + sCell.content.startCell.column) * cellWidth + gridPosition.left;
            var distnaceToX = entry[0] - cellCenterX;
            var distanceToY = cellCenterY - entry[1];
            var canvas = $("#can")[0];
            var twod = canvas.getContext("2d");
            twod.beginPath();
            twod.arc(cellCenterX, cellCenterY, 50, 0, 2 * Math.PI);
            twod.stroke();
            twod.beginPath();
            twod.moveTo(cellCenterX, cellCenterY);
            twod.lineTo(entry[0], entry[1]);
            twod.stroke();
            if (distnaceToX >= 0 && distanceToY >= 0) {
                if (Math.abs(distnaceToX) > Math.abs(distanceToY))
                    dir = Direction.right;
                else
                    dir = Direction.up;
            }
            if (distnaceToX >= 0 && distanceToY <= 0) {
                if (Math.abs(distnaceToX) > Math.abs(distanceToY))
                    dir = Direction.right;
                else
                    dir = Direction.down;
            }
            if (distnaceToX <= 0 && distanceToY <= 0) {
                if (Math.abs(distnaceToX) > Math.abs(distanceToY))
                    dir = Direction.left;
                else
                    dir = Direction.down;
            }
            if (distnaceToX <= 0 && distanceToY >= 0) {
                if (Math.abs(distnaceToX) > Math.abs(distanceToY))
                    dir = Direction.left;
                else
                    dir = Direction.up;
            }
            var splitResult = this.split(sCell.content, dir);
            if (splitResult == null)
                return false;
        }
        var room = this.findRoom(sCell);
        if (room === null)
            return false;
        for (var rowi = room[0].row; rowi <= room[1].row; rowi++) {
            for (var columni = room[0].column; columni <= room[1].column; columni++) {
                this.cells[rowi][columni].content = content;
            }
        }
        content.element.css({
            "grid-row": (room[0].row + 1) + " / " + (room[1].row + 2),
            "grid-column": (room[0].column + 1) + " / " + (room[1].column + 2),
        });
        content.startCell = room[0];
        content.endCell = room[1];
        this.grid.append(content.element);
        return true;
    };
    Dashboard.prototype.remove = function (content) {
        for (var rowi = content.startCell.row; rowi <= content.endCell.row; rowi++) {
            for (var columni = content.startCell.column; columni <= content.endCell.column; columni++) {
                this.cells[rowi][columni].reset();
            }
        }
        content.element.remove();
    };
    return Dashboard;
}());
exports.Dashboard = Dashboard;
