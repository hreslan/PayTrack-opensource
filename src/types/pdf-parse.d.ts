// The lib entry point skips pdf-parse's index.js debug harness,
// which tries to read a test PDF when imported as ESM.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse from "pdf-parse";
  export default pdfParse;
}
