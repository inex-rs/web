import "overlayscrollbars/overlayscrollbars.css";
import { OverlayScrollbarsComponent } from "overlayscrollbars-solid";
import type { Component, JSX } from "solid-js";

export const Scroll: Component<{
  class?: string;
  dark?: boolean;
  element?: "div" | "main" | "aside" | "nav";
  children: JSX.Element;
}> = (props) => {
  return (
    <OverlayScrollbarsComponent
      element={props.element ?? "div"}
      class={props.class}
      defer
      options={{
        scrollbars: {
          theme: props.dark ? "os-theme-light" : "os-theme-dark",
          autoHide: "leave",
          autoHideDelay: 500,
        },
      }}
    >
      {props.children}
    </OverlayScrollbarsComponent>
  );
};
