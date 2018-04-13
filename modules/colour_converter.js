
// Thanks to Ricardo Klement (www.usolved.net) for providing the base script
// https://github.com/usolved/cie-rgb-converter

/**
 * Converts CIE color space to RGB color space
 * @param {Number} x
 * @param {Number} y
 * @param {Number} brightness - Ranges from 1 to 254
 * @return {Array} Array that contains the color values for red, green and blue
 */

exports.cie_to_rgb = function(x, y, brightness) {
	//Set to maximum brightness if no custom value was given (Not the slick ECMAScript 6 way for compatibility reasons)
	if (brightness === undefined) {
		brightness = 254;
	}

	var z = 1.0 - x - y;
	var Y = (brightness / 254).toFixed(2);
	var X = (Y / y) * x;
	var Z = (Y / y) * z;

	//Convert to RGB using Wide RGB D65 conversion
	var red 	=  X * 1.656492 - Y * 0.354851 - Z * 0.255038;
	var green 	= -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
	var blue 	=  X * 0.051713 - Y * 0.121364 + Z * 1.011530;

	//If red, green or blue is larger than 1.0 set it back to the maximum of 1.0
	if (red > blue && red > green && red > 1.0) {

		green = green / red;
		blue = blue / red;
		red = 1.0;
	}
	else if (green > blue && green > red && green > 1.0) {

		red = red / green;
		blue = blue / green;
		green = 1.0;
	}
	else if (blue > red && blue > green && blue > 1.0) {

		red = red / blue;
		green = green / blue;
		blue = 1.0;
	}

	//Reverse gamma correction
	red 	= red <= 0.0031308 ? 12.92 * red : (1.0 + 0.055) * Math.pow(red, (1.0 / 2.4)) - 0.055;
	green 	= green <= 0.0031308 ? 12.92 * green : (1.0 + 0.055) * Math.pow(green, (1.0 / 2.4)) - 0.055;
	blue 	= blue <= 0.0031308 ? 12.92 * blue : (1.0 + 0.055) * Math.pow(blue, (1.0 / 2.4)) - 0.055;


	//Convert normalized decimal to decimal
	red 	= Math.round(red * 255);
	green 	= Math.round(green * 255);
	blue 	= Math.round(blue * 255);

	if (isNaN(red))
		red = 0;

	if (isNaN(green))
		green = 0;

	if (isNaN(blue))
		blue = 0;


	return "rgb("+red+","+green+","+blue+")";
}
