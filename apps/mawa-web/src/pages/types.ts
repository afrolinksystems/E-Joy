export type AppPath = "/" | "/menu" | "/order" | "/about" | "/contact" | "/gallery";

export type NavigateFn = (to: AppPath) => void;
