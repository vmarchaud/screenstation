/**
 * Allows you to import image files like this:
 *
 *     import lambi from '../site/images/lambi.png';
 *     ...
 *     const img = document.querySelector("#frontImg") as HTMLImageElement;
 *      img.src = lambi;
 */

/** Import all PNGs */
declare module '*.png' {
    const valuePng: string;
    export = valuePng;
}

/** Import all JPGs */
declare module '*.jpg' {
    const valueJPG: string;
    export = valueJPG;
}

/** Import all GIFs */
declare module '*.gif' {
    const valueGIF: string;
    export = valueGIF;
}
