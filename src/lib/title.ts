import { createEffect } from "solid-js";

export function useTitle(title: () => string) {
  createEffect(() => {
    document.title = title();
  });
}
