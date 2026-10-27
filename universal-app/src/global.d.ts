// TypeScript declarations for CSS imports
declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.module.css" {
  const classes: { [className: string]: string };
  export default classes;
}

// Side‑effect imports used in the project
declare module "../global.css";
declare module "@/global.css";
