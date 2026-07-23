import { faviconSvg } from "../src/components/logo-geometry.ts";

await Deno.writeTextFile(
  "public/favicon.svg",
  faviconSvg("#faf8f4", "#7c3aed") + "\n",
);
console.log("wrote public/favicon.svg");
