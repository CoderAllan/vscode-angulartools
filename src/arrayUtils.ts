import path = require("path");

export class ArrayUtils {
  
  public static arrayToMarkdown(array: string[] | undefined): string {
    if (array === undefined || array.length === 0) {
      return '';
    } else {
      if (typeof (array) === 'string') {
        return array;
      } else {
        try {
          return array.sort(this.sortStrings).join(',<br>');
        } catch (ex) {
          return `ex: ${ex} - Len:${array.length} - type:${typeof (array)} - ${array}\n`;
        }
      }
    }
  }
  
  public static sortStrings(stringA: string, stringB: string): number {
    stringA = path.basename(stringA).toUpperCase();
    stringB = path.basename(stringB).toUpperCase();
    if (stringA < stringB) {
      return -1;
    }
    if (stringA > stringB) {
      return 1;
    }
    return 0;
  }
}