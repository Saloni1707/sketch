// import * as Tooltip from '@radix-ui/react-tooltip';
// import {PiMinus,PiPlus} from "react-icons/pi"
// import { FiGithub } from "react-icons/fi";
// import {
//     HiOutlineArrowUturnLeft,
//     HiOutlineArrowUturnRight,
//   } from "react-icons/hi2";
// import { TooltipProvider } from '@radix-ui/react-tooltip';
  

// type ControlProps = {
//     undo:()=>void;
//     redo:()=>void;
//     onZoom:(scale:Number)=> void;
//     scale:number;
//     setScale:(scale:Number)=> void;
// };

// export function Control({
//     undo,
//     redo,
//     onZoom,
//     scale,
//     setScale,
// }:ControlProps){
//     return(
//         <>
//             <div className="controlPanel">
//                 <div className="zoomPanel">
//                 <TooltipProvider>
//                     <span>
//                     <Tooltip.Root>
//                         <Tooltip.Trigger>
//                         <button onClick={()=> onZoom(-0.1)} aria-label="Zoom out" className="zoomButton">
//                             <PiMinus />
//                         </button>
//                         </Tooltip.Trigger>
//                         <Tooltip.Content>
//                             <Tooltip.Arrow />
//                             <Tooltip.Portal>
//                                 <Tooltip.Content>
//                                     Zoom out
//                                 </Tooltip.Content>
//                             </Tooltip.Portal>
//                         </Tooltip.Content>
//                     </Tooltip.Root>
//                     </span>

//                     <span>
//                     <Tooltip.Root>
//                         <Tooltip.Trigger>
//                         <button onClick={()=> onZoom(0.1)} aria-label="Zoom in" className="zoomButton">
//                             <PiPlus />
//                         </button>
//                         </Tooltip.Trigger>
//                         <Tooltip.Content>
//                             <Tooltip.Arrow />
//                             <Tooltip.Portal>
//                                 <Tooltip.Content>
//                                     Zoom in
//                                 </Tooltip.Content>
//                             </Tooltip.Portal>
//                         </Tooltip.Content>
//                     </Tooltip.Root>
//                     </span>
//                     </div>
//                     <div className="editPanel">
//                     <span>
//                     <Tooltip.Root>
//                         <Tooltip.Trigger>
//                         <button onClick={undo} aria-label="Undo" className="editButton">
//                             <HiOutlineArrowUturnLeft />
//                         </button>
//                         </Tooltip.Trigger>
//                         <Tooltip.Content>
//                             <Tooltip.Arrow />
//                             <Tooltip.Portal>
//                                 <Tooltip.Content>
//                                     Undo
//                                 </Tooltip.Content>
//                             </Tooltip.Portal>
//                         </Tooltip.Content>
//                     </Tooltip.Root>
//                     </span>

//                     <span>
//                     <Tooltip.Root>
//                         <Tooltip.Trigger>
//                         <button onClick={redo} aria-label="Redo" className="editButton">
//                             <HiOutlineArrowUturnRight />
//                         </button>
//                         </Tooltip.Trigger>
//                         <Tooltip.Content>
//                             <Tooltip.Arrow />
//                             <Tooltip.Portal>
//                                 <Tooltip.Content>
//                                     Redo
//                                 </Tooltip.Content>
//                             </Tooltip.Portal>
//                         </Tooltip.Content>
//                     </Tooltip.Root>
//                     </span>
//                 </TooltipProvider>
//                 </div>
//             </div>

            
//         </>
//     );
// }
