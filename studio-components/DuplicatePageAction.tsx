import { useDocumentOperation } from "sanity";

export function DuplicatePageAction(props: any) {
  const ops = useDocumentOperation(props.id, props.type) as any;

  return {
    label: "Duplicar",
    disabled: !ops.duplicate || ops.duplicate.disabled,
    onHandle: () => {
      ops.duplicate.execute();
      props.onComplete();
    },
  };
}
