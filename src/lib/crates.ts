export type CrateInfo = {
  slug: string;
  name: string;
  blurb: string;
};

export type Tier = {
  name: string;
  crates: CrateInfo[];
};

export const STACK: Tier[] = [
  {
    name: "registers",
    crates: [
      {
        slug: "crate-nitro-pac",
        name: "inex-ntr-pac",
        blurb: "Typed MMIO registers for the DS/DSi, both cores.",
      },
      {
        slug: "crate-agb-pac",
        name: "inex-agb-pac",
        blurb: "Typed MMIO registers for the GBA.",
      },
      {
        slug: "crate-ctr-pac",
        name: "inex-ctr-pac",
        blurb: "Typed MMIO registers for the 3DS.",
      },
    ],
  },
  {
    name: "hal",
    crates: [
      {
        slug: "crate-nitro-hal",
        name: "inex-ntr-hal",
        blurb: "The DS HAL — typestate owners for every peripheral.",
      },
      {
        slug: "crate-twl",
        name: "inex-twl",
        blurb: "DSi extensions: AES/SHA, SDMMC, cameras, NWM.",
      },
      {
        slug: "crate-agb-hal",
        name: "inex-agb-hal",
        blurb: "The GBA HAL — display, DMA, sound, serial, saves.",
      },
      {
        slug: "crate-ctr-hal",
        name: "inex-ctr-hal",
        blurb: "The 3DS HAL (scaffolded).",
      },
    ],
  },
  {
    name: "runtime",
    crates: [
      {
        slug: "crate-nitro-rt",
        name: "inex-ntr-*-rt",
        blurb: "Boot, vectors and IRQ dispatch for ARM9 and ARM7.",
      },
      {
        slug: "crate-agb-rt",
        name: "inex-agb-rt",
        blurb: "GBA runtime: crt0, IRQ dispatch, BIOS SWI wrappers.",
      },
      {
        slug: "crate-executor",
        name: "inex-executor",
        blurb: "The cooperative async executor — one future, zero busy-poll.",
      },
    ],
  },
  {
    name: "services",
    crates: [
      {
        slug: "crate-ipc",
        name: "inex-ipc",
        blurb: "Typed cross-core IPC over the shared-memory window.",
      },
      {
        slug: "crate-nitro-save",
        name: "inex-ntr-save",
        blurb: "Cart backup — EEPROM/Flash/FRAM autodetect, BlockDevice.",
      },
      {
        slug: "crate-nitro-wifi",
        name: "inex-ntr-wifi",
        blurb: "The DS wifi stack, plus the DSi Atheros sibling.",
      },
      {
        slug: "crate-nitro-sdat",
        name: "inex-ntr-sdat",
        blurb: "On-device SDAT playback: SSEQ, SBNK, SWAR, STRM.",
      },
      {
        slug: "crate-twl-dsp",
        name: "inex-twl-dsp",
        blurb: "The DSi's Teak DSP: boot, pipes, audio offload.",
      },
    ],
  },
  {
    name: "formats",
    crates: [
      {
        slug: "crate-codecs",
        name: "inex-codec-*",
        blurb:
          "BIOS-compatible LZ77, Huffman, RLE, diff, JPEG — host-testable.",
      },
      {
        slug: "crate-formats",
        name: "inex-format-*",
        blurb:
          "NitroFS, NARC, SDAT, G3D, banners, firmware — parsers both ways.",
      },
      {
        slug: "crate-nds-rom",
        name: "inex-nds-rom",
        blurb: "The .nds ROM builder: header, FNT/FAT, banner, payloads.",
      },
    ],
  },
  {
    name: "host tools",
    crates: [
      {
        slug: "crate-asset-pipeline",
        name: "inex-asset-pipeline",
        blurb: "assets/ in, NitroFS out — one pipeline for studio and CLI.",
      },
      {
        slug: "crate-teak",
        name: "inex-teak",
        blurb: "Host toolkit for the Teak DSP — assemble, link, ship.",
      },
    ],
  },
];

export const ALL_CRATES: CrateInfo[] = STACK.flatMap((t) => t.crates);

export function crateBySlug(slug: string): CrateInfo | undefined {
  return ALL_CRATES.find((c) => c.slug === slug);
}
