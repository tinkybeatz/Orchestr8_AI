declare module 'madge' {
  interface MadgeResult {
    circular(): string[][];
    depends(id: string): string[];
    orphans(): string[];
    warnings(): Record<string, string[]>;
  }

  interface MadgeConfig {
    fileExtensions?: string[];
    tsConfig?: string;
    baseDir?: string;
  }

  function madge(path: string, config?: MadgeConfig): Promise<MadgeResult>;
  export default madge;
}
