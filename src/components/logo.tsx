import type { Component } from "solid-js";
import { barSegments, type ProductMark } from "./logo-geometry.ts";

export { barSegments, LOGO_BARS, type ProductMark } from "./logo-geometry.ts";

export const BarsMark: Component<{
  product?: ProductMark;
  size?: number;
  class?: string;
}> = (props) => {
  const bars = barSegments(props.product ?? "inex");
  return (
    <svg
      viewBox="0 0 24 24"
      width={props.size ?? "100%"}
      height={props.size ?? "100%"}
      class={props.class}
      aria-hidden="true"
    >
      {bars.map((b) => (
        <rect
          x={b.cx - b.w / 2}
          y={b.y0}
          width={b.w}
          height={b.y1 - b.y0}
          rx={b.w / 2}
          fill="currentColor"
          opacity={b.o}
        />
      ))}
    </svg>
  );
};

export const EclipseMark: Component<{ size?: number; class?: string }> = (
  props,
) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width={props.size ?? "100%"}
      height={props.size ?? "100%"}
      class={props.class}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fill-rule="evenodd"
        d="M22 12A10 10 0 1 0 2 12A10 10 0 1 0 22 12ZM20 10.6A6.6 6.6 0 1 0 6.8 10.6A6.6 6.6 0 1 0 20 10.6Z"
      />
    </svg>
  );
};
