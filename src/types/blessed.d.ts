import "blessed";
declare module "blessed" {
  namespace Widgets {
    interface BoxElement {
      _isRecord?: boolean;
    }
    interface BlessedElement {
      id: string;
      _isRecord?: boolean;
    }
    type AllElements = BoxElement | BlessedElement;
  }
}
