import "blessed";
declare module "blessed" {
  namespace Widgets {
    interface BoxElement {
      _isRecord?: boolean;
      _isEmptyState?: boolean;
    }
    interface BlessedElement {
      id: string;
      _isRecord?: boolean;
      _isEmptyState?: boolean;
    }
    type AllElements = BoxElement | BlessedElement;
  }
}
