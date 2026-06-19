import "blessed";
declare module "blessed" {
  namespace Widgets {
    interface BoxElement {
      _isRecord?: boolean;
    }
    interface BlessedElement {
      _isRecord?: boolean;
    }
    type AllElements = BoxElement | BlessedElement;
  }
}
