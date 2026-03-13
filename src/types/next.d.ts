/// <reference path="../../node_modules/next/navigation-types/compat/navigation.d.ts" />

declare module "next/navigation" {
  export interface Router {
    push(href: string): void;
    replace(href: string): void;
    back(): void;
    forward(): void;
    refresh(): void;
    prefetch(href: string): void;
  }
  export function useRouter(): Router;
}
