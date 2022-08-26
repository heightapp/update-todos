declare module 'comment-patterns' {
  export default function commentPatterns(
    filename: string,
  ):
    | {
        name?: string;
        nameMatchers?: Array<string>;
        multiLineComment?: Array<{
          start?: RegExp | string;
          middle?: string;
          end?: RegExp | string;
          apidoc?: boolean;
        }>;
        singleLineComment?: Array<{
          start?: RegExp | string;
        }>;
      }
    | undefined
    | null;
}
