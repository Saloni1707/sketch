import { nearPoint } from "./nearPoint";
import { ElementType,PointType,Tools } from "../store/useSketchStore";

export const getElementPos = (
    x:number,
    y:number,
    elements:ElementType[]
) => {
    return elements
        .map((element) => ({
            ...element,
            position:positionWithinElement(x,y,element),
        }))
        .find((element) => element.position !== null)
};

const positionWithinElement = (x:number,y:number,element:ElementType) => {
    const {type ,x1, x2, y1, y2} = element;
    switch(type){
        case Tools.line:
        case Tools.arrow: {
            const on = onLine(x1, y1, x2, y2, x, y);
            const start = nearPoint(x, y, x1, y1, "start");
            const end = nearPoint(x, y, x2, y2, "end");
            return start || end || on;
        }
        case Tools.rectangle:{
            const topLeft = nearPoint(x,y,x1,y1,"topLeft");
            const topRight = nearPoint(x,y,x2,y1,"topRight");
            const bottomLeft = nearPoint(x,y,x1,y2,"bottomLeft");
            const bottomRight = nearPoint(x,y,x2,y2,"bottomRight");
            const inside = x >= x1 && x<=x2 && y>=y1 && y<=y2 ? "inside" : null;
            return topLeft || topRight || bottomLeft || bottomRight || inside;
        }
        case Tools.pencil:{
            const betweenAnyPoint = element.points!.some((point,index) => {
                const nextPoint = element.points![index+1];
                if(!nextPoint) return false;

                return(
                    onLine(point.x,point.y,nextPoint.x,nextPoint.y,x,5) != null
                );
            });
            return betweenAnyPoint ? "between" : null;
        }
        case Tools.text:
            return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
        case Tools.circle: {
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            
            // Check if point is on the circle (with some tolerance)
            if (Math.abs(distance - radius) < 5) {
                return "edge";
            }
            // Check if point is inside the circle
            if (distance <= radius) {
                return "inside";
            }
            return null;
        }
        default:
            throw new Error(`Type not recognised: ${type}`);
    }
};

const onLine = (
    x1:number,
    y1:number,
    x2:number,
    y2:number,
    x:number,
    y:number,
    maxDistance: number = 1
): string | null => {
    const a : PointType = {x:x1,y:y1};
    const b : PointType = {x:x2,y:y2};
    const c : PointType = {x,y}
    const offset = distance(a,b) - (distance(a,c) + distance(b,c));
    return Math.abs(offset) < maxDistance ? "onLine" : null;
};

const distance = (a:PointType,b:PointType) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

