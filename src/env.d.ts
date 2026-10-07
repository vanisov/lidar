declare const __TEST__: boolean;

declare module '*.css' {
  const css: string;
  export default css;
}
declare module '*.woff2' {
  const bytes: Uint8Array<ArrayBuffer>;
  export default bytes;
}
