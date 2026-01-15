/// <reference types="vite/client" />

// Allow CSS imports
declare module '*.css' {
  const content: string;
  export default content;
}

// Allow image imports
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
