import { Cell } from 'dashboard'

export default class Widget 
{
    id : number;
    content : any;
    element : JQuery;
    startCell : Cell;
    endCell : Cell;
}