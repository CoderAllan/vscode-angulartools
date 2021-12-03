
export class StringUtils {
  private static lineCommentRegex = /\s*?\/\/.*$/igm;
  private static blockCommentRegex = /\/\*.*?\*\//igm;
  
  public static removeComments(content: string): string {
    content = content.replace(StringUtils.lineCommentRegex, () => ''); // Remove comments
    content = content.replace(StringUtils.blockCommentRegex, () => ''); // Remove comments
    return content;
  }
}