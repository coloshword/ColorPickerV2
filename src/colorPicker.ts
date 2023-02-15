//Globals
var currentColor:number[] = [ 50,  92, 168]; // initial color set to blue
var setTurtleColor:boolean = true; // if true we are setting the turtle color, false we are setting the background color
//

function $(v:string) { 
  return(<HTMLElement> document.querySelector(v));
}

//Set up color model 
const netlogoBaseColors: [number, number, number][] = [  [140, 140, 140], // gray       (5)
  [215,  48,  39], // red       (15)
  [241, 105,  19], // orange    (25)
  [156, 109,  70], // brown     (35)
  [237, 237,  47], // yellow    (45)
  [ 87, 176,  58], // green     (55)
  [ 42, 209,  57], // lime      (65)
  [ 27, 158, 119], // turquoise (75)
  [ 82, 196, 196], // cyan      (85)
  [ 43, 140, 190], // sky       (95)
  [ 50,  92, 168], // blue     (105)
  [123,  78, 163], // violet   (115)
  [166,  25, 105], // magenta  (125)
  [224, 126, 149], // pink     (135)
  [ 0,    0,   0], // black
  [255, 255, 255] // white
];

var colorsString:string[] = ['gray',
'red',
'orange',
'brown',
'yellow',
'green',
'lime',
'turqoise',
'cyan',
'sky',
'blue',
'violet',
'magenta',
'pink']

var numColors = colorsString.length;
let degreesPerSV = 360 / numColors; // the number of degrees each "slice" of color is

// colorwheel
function componentToHex(c:number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r:number, g:number, b:number):string {
  let ans: string =  "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  return ans.toUpperCase();
}

// loads the color wheel but also defines the colorWheelRanges color
function loadColorWheel() : void { 
  let colorWheel = $('.gradient');
  let cssFormat:string = `background-image: conic-gradient(`;
  let degreeTracker: number = 0;
  for(let i = 0; i < numColors - 1; i++) {
    cssFormat += rgbToHex(netlogoBaseColors[i][0], netlogoBaseColors[i][1], netlogoBaseColors[i][2]) + ` ${degreeTracker}deg ${degreeTracker + degreesPerSV}deg, `;
    degreeTracker += degreesPerSV;
  }
  cssFormat += rgbToHex(netlogoBaseColors[13][0], netlogoBaseColors[13][1], netlogoBaseColors[13][2]) + ` ${degreeTracker}deg 0deg`;
  colorWheel!.style.cssText += cssFormat;
}


/* get color functions */

function toDegrees (angle:number) {
  return angle * (180 / Math.PI);
}
/* takes three points and returns the angle between them -- goes to 360!
"B" is the center point, meaning pair (d, e), "A" is the reference "zero" point, "C" is the last point  */ 
function findAngle (a:number , b: number, c:number , d:number , e: number, f: number): number{
  let AB = Math.sqrt(Math.pow(c - a,2)+ Math.pow(d - b, 2));    
  let BC = Math.sqrt(Math.pow(c - e,2)+ Math.pow(d -f, 2)); 
  let AC = Math.sqrt(Math.pow(e -a ,2)+ Math.pow(f -b ,2));
  let outOf180Degrees = toDegrees((Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB))));
  // if we are "positive" relative to the axis -- the center point to the top "zero" point, then we just return, else we return 360 - outOf180
  if(e < c) {
    return 360 - outOf180Degrees;
  }
  return outOf180Degrees;
}



/* Set up dragging events */ 

/* dragging confinement functions */ 
function distance(x1:number, y1:number, x2:number, y2:number): number  {
  let a = x1 - x2;
  let b = y1 - y2;
  return Math.sqrt(a * a + b * b);
}

/* main dragging functions */
function makeDraggable(evt: MouseEvent): void {
  let svg = evt.target as SVGSVGElement;
  let selectedElement: SVGSVGElement;
  let colorWheelCenter = [50, 50];  // the center of the color wheel, where we have to start with  calculating distances 
  let colorWheelZeroDegPoint = [50, 25]; // the reference point for the angle arithmetic -- where we start measuring the angle 
  let lastValidLoc: number[] = [25, 50];

  svg.addEventListener('mousedown', startDrag);
  svg.addEventListener('mousemove', drag);
  svg.addEventListener('mouseup', endDrag);
  svg.addEventListener('mouseleave', endDrag);

  // dragging helpers
  
  //updates the colors of the "scroller" as well as the turtle and background based on the index as compared to the array -- netlogoBaseColors
  function updateColor(index: number, selected: SVGSVGElement) {  
    let color = netlogoBaseColors[index];
    let hex = rgbToHex(color[0], color[1], color[2]);
    selected.setAttributeNS(null, "fill", hex);
    let background: SVGSVGElement = $("#background") as unknown as SVGSVGElement;
    background.setAttributeNS(null, "fill", hex);
  }
  function getMousePosition(evt) {
    var CTM = svg.getScreenCTM();
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
  }
  
  function startDrag(evt:MouseEvent) {
    let target = evt.target as SVGSVGElement;
    if (target.classList.contains('draggable')) {
      selectedElement = target;
      selectedElement.classList.add("dragging");
    }
    //console.log(selectedElement); 
  }
  
  function drag(evt: MouseEvent): void {
    if (selectedElement) {
      evt.preventDefault();
      let coordinates = getMousePosition(evt);

      let x = coordinates.x;
      let y = coordinates.y;
      if(selectedElement != null && selectedElement.classList.contains('confined')) { // dragable item has to be confined 
        let distFromCenter = distance(x, y, colorWheelCenter[0], colorWheelCenter[1]);
        if(distFromCenter > 40 || distFromCenter < 20) {
          x = lastValidLoc[0];
          y = lastValidLoc[1];
        }
      }

      selectedElement.setAttributeNS(null, "cx", "" + x);
      selectedElement.setAttributeNS(null, "cy", "" + y);
      // get angle "B" is the center point 
      let colorIndex = Math.floor((findAngle(colorWheelZeroDegPoint[0], colorWheelZeroDegPoint[1], colorWheelCenter[0], colorWheelCenter[1], x, y)) / degreesPerSV);
      updateColor(colorIndex, selectedElement); // updates the color of the "scrollersvg"
      lastValidLoc[0] = x;
      lastValidLoc[1] = y;
    }
  }

  function endDrag(evt: MouseEvent): void {
    // implementation
    if(selectedElement != null) {
      selectedElement.classList.remove("dragging");
    }
    selectedElement = null;
  }
}


/* Call functions*/
loadColorWheel();
