export { Dashboard };

enum Direction {
    up = 0,
    right = 1,
    down = 2,
    left = 3
}

class DashboardOptions {
    container : JQuery;
    rows : number;
    columns : number;
}

class Cell {
    row : number;
    column : number;
    up : Cell;
    down : Cell;
    left : Cell;
    right : Cell;
    content : Widget;

    reset() : void
    {
        if (this.content != null)
            this.content.element.remove();
        this.up = null;
        this.down = null;
        this.right = null
        this.left = null;
        this.content = null;
    }
}

export class Widget 
{
    id : number;
    content : any;
    element : JQuery;
    startCell : Cell;
    endCell : Cell;
}

class Dashboard {
    cells : Cell[][];
    options : DashboardOptions;
    grid : JQuery = null;
    constructor(options : DashboardOptions) {
        this.options = options;
        this.cells = [];

        if (this.options.rows <= 0)
            throw "Dashboard needs to be created with more than 1 row";

        if (this.options.columns <= 0)
            throw "Dashboard needs to be created with more than 1 column";

        $(options.container).append(this.generateDOMGrid(options.rows, options.columns))        
        $("#can").width($(this.options.container).width());
        $("#can").height($(this.options.container).height());
    }

    generateDOMGrid(rows : number, columns : number) : JQuery {
        this.grid = $("<div>");
        this.grid.addClass("dashboardGrid");
        this.grid.css({ 
            "grid-template-columns": "repeat(" + columns + ", 1fr)",
            "grid-template-rows": "repeat(" + rows + ", 1fr)",
            "display": "grid",
            "height": "100%",
            "width": "100%",
            "position" : "absolute"
        }
        );
        for (let columni = 0; columni < columns; columni++) {
            for (let rowi = 0; rowi < rows; rowi++) {    
                if (this.cells[rowi] === undefined)    
                    this.cells[rowi] = [];                
                this.cells[rowi][columni] = this.createCell(rowi, columni);   
                var hejdiv = $("<div>");
                hejdiv.append("<span>" + rowi + "," + columni + "</span>");
                hejdiv.height( (this.options.container.height() / rows) );
                hejdiv.width((this.options.container.width() / columns) - 13);
                hejdiv.css({ float : "left", "text-align" : "center", "line-height" : hejdiv.height() + "px", "border" : "1px solid black", "z-index" : 2, "position" : "relative", "box-sizing" : "border-box" });
                $(this.options.container).append(hejdiv);
                //this.grid.append($("<div class='dashboardCell'>"))             
            }
        }     
        return this.grid;
    }

    createCell (row : number, column : number) : Cell {
        let c = new Cell();
        c.row = row;
        c.column = column;
        
        if (row !== 0) {
            c.left = this.cells[row-1][column];
            c.left.right = c;
        }
        if (column !== 0) {
            c.up = this.cells[row][column-1];
            c.up.down = c;
        }     
        return c;
    }

    clear() {
        // This might clear invoke the GC faster than just setting cells to []. Who knows ?
        for (let rowi = 0; rowi < this.options.rows; rowi++) {       
            for (let columni = 0; columni < this.options.columns; columni++) {
                this.cells[rowi][columni].reset();
                                    
            }
        }
    }

    findRoom(cell : Cell) : [Cell, Cell]
    {
        var startCell : Cell = null;
        var endCell : Cell = null;
        
            for (let columni = 0; columni < this.options.columns; columni++) {
                for (let rowi = 0; rowi < this.options.rows; rowi++) {       
                if (this.cells[rowi][columni].content == null) {
                    if (startCell === null)                    
                        startCell = this.cells[rowi][columni];
                    endCell = this.cells[rowi][columni];
                }
            }
        }
        if (startCell !== null && endCell !== null)
            return [startCell, endCell];        
            else return null;
    }

    private split(widget : Widget, direction : Direction) : void {
        if (widget.startCell !== null && widget.endCell !== null) {
        // Find the best way to split a widget
        let rowRemoveStart = widget.startCell.row; 
        let columnRemoveStart = widget.startCell.column;
        let rowRemoveEnd = widget.endCell.row;        
        let columnRemoveEnd = widget.endCell.column;

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

            for (let rowi = rowRemoveStart; rowi <= rowRemoveEnd; rowi++) {       
                for (let columni = columnRemoveStart; columni <= columnRemoveEnd; columni++) {
                    this.cells[rowi][columni].content = null;
                }
            }

        //    widget.startCell = this.cells[widget.startCell.row - rowStart][widget.startCell.column - columnStart];
      //      widget.endCell = this.cells[widget.endCell.row - rowEnd][widget.endCell.column - columnEnd]
        }
    }

    place(content : Widget, placement: Cell | [number, number], entry: [number, number]) : boolean
    {
        if (entry != undefined)
            $(this.options.container).append("<div style='height:30px;width:30px;position:absolute;top:" + entry[1] + ";left:" + entry[0] + ";background-color:red'>");            
        let sCell = placement instanceof Cell ? placement : this.cells[placement[1]][placement[0]];

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

            let dir: Direction = Direction.up;
            let cellWidth = this.grid.width() / this.options.columns
            let cellHeight = this.grid.height() / this.options.rows;
            let gridPosition = $(this.options.container).position();
            let normalizedWidth = cellWidth / 2;
            let normalizedHeight = cellHeight / 2;

        //    let cellCenterY = (((sCell.row + 1) * cellHeight) + gridPosition.top) - normalizedHeight;
          //  let cellCenterX = (((sCell.column + 1) * cellWidth) + gridPosition.left) - normalizedWidth ; 
          //let cellCenterY = (((sCell.content.endCell.row - sCell.content.startCell.row + 1) * cellHeight) / 2) + gridPosition.top;
          //let cellCenterX = (((sCell.content.endCell.column -  sCell.content.startCell.column + 1) * cellWidth) / 2) + gridPosition.left; 
          let cellCenterY = (((sCell.content.endCell.row - sCell.content.startCell.row + 1) / 2) + sCell.content.startCell.row) * cellHeight + gridPosition.top;

          let cellCenterX = (((sCell.content.endCell.column - sCell.content.startCell.column + 1) / 2) + sCell.content.startCell.column) * cellWidth + gridPosition.left;
            let distnaceToX = entry[0] - cellCenterX;
            let distanceToY = cellCenterY - entry[1];
            

            let canvas = $("#can")[0] as HTMLCanvasElement;
            let twod = canvas.getContext("2d");

            twod.beginPath()
            twod.arc(cellCenterX,cellCenterY,50,0,2*Math.PI);
            twod.stroke();

            twod.beginPath();
            twod.moveTo(cellCenterX, cellCenterY);
            twod.lineTo(entry[0], entry[1]);
            twod.stroke();
         
            if (distnaceToX >= 0 && distanceToY >= 0)
            {
                if (Math.abs(distnaceToX) > Math.abs(distanceToY))
                    dir = Direction.right;
                        else
                    dir = Direction.up;
            }
            
            if (distnaceToX >= 0 && distanceToY <= 0)
            {
                if (Math.abs(distnaceToX) > Math.abs(distanceToY))
                dir = Direction.right;
                    else
                dir = Direction.down;
            }

            if (distnaceToX <= 0 && distanceToY <= 0)
            {
                if (Math.abs(distnaceToX) > Math.abs(distanceToY))
                dir = Direction.left;
                    else
                dir = Direction.down;
            }

            if (distnaceToX <= 0 && distanceToY >= 0)
            {
                if (Math.abs(distnaceToX) > Math.abs(distanceToY))
                dir = Direction.left;
                    else
                dir = Direction.up;
            }

            this.split(sCell.content, dir);
        }

        let room = this.findRoom(sCell);

        if (room === null)
            return false;
        
            for (let rowi = room[0].row; rowi <= room[1].row; rowi++) {       
                for (let columni = room[0].column; columni <= room[1].column; columni++) {
                    this.cells[rowi][columni].content = content;
                }
            } 

            content.element.css({
                "grid-row" : (room[0].row + 1) +  " / " + (room[1].row + 2),
                "grid-column" : (room[0].column + 1) +  " / " + (room[1].column + 2),
            });

            content.startCell = room[0];
            content.endCell = room[1];

            this.grid.append(content.element);

        return true;
    }       
}
