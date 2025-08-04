import rough from "roughjs"
import {Tools,ElementType,TOOLS} from "../store/useSketchStore";

export const createElement = (
    id:number,
    x1:number,
    y1:number,
    x2:number,
    y2:number,
    type:typeof Tools[keyof typeof Tools],
    color: string = '#000000'
):ElementType => {
    const generator = rough.generator();

    switch(type){
        case Tools.line:
        case Tools.arrow:
        case Tools.rectangle:{
            const options = {
                stroke: color,
                strokeWidth: 2,
            };
            const roughElement =
                type === Tools.line || type === Tools.arrow
                    ? generator.line(x1, y1, x2, y2, options)
                    : generator.rectangle(x1, y1, x2 - x1, y2 - y1, options);
            // For arrow, calculate arrowhead points
            if (type === Tools.arrow) {
                // Arrowhead calculation: always at (x2, y2), never flips
                const dx = x2 - x1;
                const dy = y2 - y1;
                const angle = Math.atan2(dy, dx);
                const headlen = 24; // arrowhead length
                const arrowWidth = Math.PI / 8; 
                // Arrowhead points always at (x2, y2)
                const arrowhead1 = {
                    x: x2 - headlen * Math.cos(angle - arrowWidth),
                    y: y2 - headlen * Math.sin(angle - arrowWidth)
                };
                const arrowhead2 = {
                    x: x2 - headlen * Math.cos(angle + arrowWidth),
                    y: y2 - headlen * Math.sin(angle + arrowWidth)
                };
                return {id,x1,y1,x2,y2,type,roughElement,color,arrowhead1,arrowhead2};
            }
            // For line and rectangle, always return here
            return {id,x1,y1,x2,y2,type,roughElement,color};
        }
        case Tools.pencil:{
            const defaultRoughElement = null;
            return{
                id,
                x1:0,
                y1:0,
                x2:0,
                y2:0,
                type,
                points:[{x:x1,y:y1}],
                roughElement:defaultRoughElement,
                color,
            }
        }

        case Tools.text:{
            return{id,type,x1,y1,x2,y2,text:"",color};

        }
        case Tools.circle:{
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const radius = Math.sqrt((x2-x1)**2 + (y2-y1)**2)/2;
            const options = {
                stroke: color,
                strokeWidth: 2,
                fill: 'transparent',
            };
            const roughElement = generator.circle(centerX, centerY, radius * 2, options);
            return {id,x1,y1,x2,y2,type,roughElement,color}
        };
        default:
            throw new Error("Invalid tool type");
    }


}