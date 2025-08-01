import { ElementType } from "../store/useSketchStore";
import { RoughCanvas } from "roughjs/bin/canvas";
import getStroke from "perfect-freehand";



export const drawElement = (
    roughCanvas:RoughCanvas,
    context:CanvasRenderingContext2D,
    element:ElementType
) => {
    switch(element.type){
        case "line":
        case "rectangle":
            roughCanvas.draw(element.roughElement);
            break;
        case "pencil": {
            if(!element.points){
                throw new Error("Points not found");
            }
            const strokePoints = getStroke(element.points);
            const formattedPoints:[number,number][] = strokePoints.map((point) => {
                if(point.length !== 2){
                    throw new Error(
                        `Expected point to have exactly 2 coordinates, but got ${point.length}`
                    );
                }
                return [point[0],point[1]];
            });
            const stroke = getSvgPathFromStroke(formattedPoints);
            context.fill(new Path2D(stroke));
            break;
        }
        case "text": {
            if (!element.text) break; // Don't render if no text
            
            // Save the current context state
            context.save();
            
            // Set text properties
            const fontSize = 24;
            context.font = `${fontSize}px sans-serif`;
            context.textBaseline = 'top';
            context.fillStyle = '#000000'; // Black text
            context.strokeStyle = '#FFFFFF'; // White stroke for contrast
            context.lineWidth = 2;
            
            // Draw the text with stroke for better visibility
            context.strokeText(element.text, element.x1, element.y1);
            context.fillText(element.text, element.x1, element.y1);
            
            // Restore the context state
            context.restore();
            break;
        }
        case "circle":{
            roughCanvas.draw(element.roughElement);
            break;
        }
        default:
            throw new Error("Invalid element type");
    }
};

const getSvgPathFromStroke = (stroke: [number, number][]) => {
    if (!stroke.length) return "";
  
    const d = stroke.reduce(
      (
        acc: string[],
        [x0, y0]: [number, number],
        i: number,
        arr: [number, number][]
      ) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(
          x0.toString(),
          y0.toString(),
          ((x0 + x1) / 2).toString(),
          ((y0 + y1) / 2).toString()
        );
        return acc;
      },
      ["M", ...stroke[0].map((num) => num.toString()), "Q"]
    );
  
    d.push("Z");
    return d.join(" ");
  };