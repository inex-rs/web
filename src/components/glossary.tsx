import type { Component } from "solid-js";

export const GLOSSARY: Record<string, string> = {
  FPGA:
    "Field-Programmable Gate Array — reconfigurable logic. The IS-NITRO's “LCA”s are Xilinx FPGAs.",
  LCA:
    "Intelligent Systems' name for the on-board Xilinx FPGAs (from the old “Logic Cell Array”).",
  SelectMAP: "Xilinx's parallel (byte-wide) FPGA configuration interface.",
  EWRAM: "The DS's external work RAM (main RAM), based at 0x02000000.",
  FIQ:
    "ARM Fast Interrupt reQuest — used here as the asynchronous halt into the debug monitor.",
  DBGEN:
    "The ARM debug-enable signal; it gates EmbeddedICE breakpoint/watchpoint events.",
  EmbeddedICE:
    "The ARM core's on-chip debug macrocell — registers reached over JTAG.",
  DCC:
    "Debug Communications Channel — ARM CP14 registers that stream bytes over JTAG.",
  JTAG: "IEEE 1149.1 boundary-scan / debug access port.",
  MMIO: "Memory-mapped I/O — hardware registers addressed like memory.",
  SDRAM: "Synchronous DRAM — the emulator's cartridge-side memory.",
  mailbox:
    "The SRAM command/parameter block at 0x80E000 the USB dispatch marshals commands through.",
  capring:
    "The V850 firmware's capture-sample ring buffer, drained by command 0xA5.",
  COR:
    "Configuration Options Register — Xilinx bitstream startup/config settings.",
  IDCODE:
    "A Xilinx device-identity value written into the configuration stream.",
  FLR: "Frame Length Register — words-per-frame in a Xilinx bitstream.",
  Blowfish:
    "The cipher the DS BIOS uses to protect a cartridge's “secure area” — the check the debug-ROM boot trick bypasses.",
};

const TERMS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
const isWord = (c: string) => /[A-Za-z0-9]/.test(c);

export function glossaryMatch(text: string, i: number): number {
  if (isWord(text[i - 1] ?? "")) return 0;
  for (const t of TERMS) {
    if (!text.startsWith(t, i)) continue;
    let end = i + t.length;
    if (text[end] === "s" && !isWord(text[end + 1] ?? "")) end++;
    if (!isWord(text[end] ?? "")) return end - i;
  }
  return 0;
}

export const Glossary: Component<{ term: string }> = (props) => {
  return (
    <span class="group relative cursor-help whitespace-nowrap border-b border-dotted border-muted/60 hover:border-accent/60">
      {props.term}
      <span class="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 hidden w-max max-w-[16rem] rounded-md border border-line bg-panel-2 px-2.5 py-1.5 text-[11px] font-normal normal-case leading-snug text-ink-2 shadow-lg group-hover:block">
        {GLOSSARY[props.term.replace(/s$/, "")] ?? GLOSSARY[props.term]}
      </span>
    </span>
  );
};
