import { hslToHex } from "#utils/common";
import chalk, { type ChalkInstance, type ForegroundColorName, foregroundColorNames } from "chalk";
import colorMap from "./color-map.json";

/**
 * Determine the color to use for a log message based on its arguments, and remove any CSS formatting directives found within.
 * @param data - The original arguments to the logging function
 * @returns
 * The `ChalkInstance` to use to color the output.
 * @remarks
 * Used to support CSS color directives in Node.JS environments which lack native support.
 */
export function inferColorFormat(data: [string, ...unknown[]]): ChalkInstance {
  // Remove all CSS format strings and find the first one containing something vaguely resembling a color
  data[0] = data[0].replaceAll("%c", "");
  const [color, index] = findColorPrefix(data);
  if (index !== -1) {
    data.splice(index, 1);
  }

  // use color directly if supported, or coerce it to hex otherwise
  if ((foregroundColorNames as string[]).includes(color)) {
    return chalk[color as ForegroundColorName];
  }

  return parseCSSColor(color);
}

/**
 * Find the first string with a "color:" CSS directive in an argument list.
 * @param args - The arguments containing the color directive
 * @returns The found color and its position inside the array, or `"green"` if none were found
 */
function findColorPrefix(data: unknown[]): [color: string, index: number] {
  for (const [index, arg] of data.entries()) {
    if (typeof arg !== "string") {
      continue;
    }
    const match = /color:\s*(.+?)(?:;|$)/g.exec(arg);
    if (match === null) {
      continue;
    }

    return [match[1], index];
  }
  return ["green", -1];
}

/**
 * Coerce an arbitrary CSS color string to a Chalk instance.
 * @param color - The color to coerce
 * @returns The Chalk color equivalent.
 */
function parseCSSColor(color: string): ChalkInstance {
  if (/^#([a-z0-9]{3,4}|[a-z0-9]{6}|[a-z0-9]{8})$/i.test(color)) {
    // already in hex
    return chalk.hex(color);
  }

  const rgbMatch = /^rgba?\((\d{1,3})%?,\s*(\d{1,3})%?,?\s*(\d{1,3})%?,\s*/i.exec(color);
  if (rgbMatch) {
    const [red, green, blue] = rgbMatch;
    return chalk.rgb(+red, +green, +blue);
  }

  const hslMatch = /^hslv?\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i.exec(color);
  if (hslMatch) {
    const [hue, saturation, light] = hslMatch;
    return chalk.hex(hslToHex(+hue, +saturation / 100, +light / 100));
  }

  return chalk.hex(colorMap[color] ?? "#00ff95ff");
}
