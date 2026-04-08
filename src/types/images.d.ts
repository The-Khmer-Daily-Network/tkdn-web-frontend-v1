declare module "*.jpg" {
  const value:
    | string
    | { src: string; height: number; width: number; blurDataURL?: string };
  export default value;
}

declare module "*.jpeg" {
  const value:
    | string
    | { src: string; height: number; width: number; blurDataURL?: string };
  export default value;
}

declare module "*.png" {
  const value:
    | string
    | { src: string; height: number; width: number; blurDataURL?: string };
  export default value;
}

declare module "*.gif" {
  const value:
    | string
    | { src: string; height: number; width: number; blurDataURL?: string };
  export default value;
}

declare module "*.webp" {
  const value:
    | string
    | { src: string; height: number; width: number; blurDataURL?: string };
  export default value;
}

declare module "*.svg" {
  const value:
    | string
    | { src: string; height: number; width: number; blurDataURL?: string };
  export default value;
}
