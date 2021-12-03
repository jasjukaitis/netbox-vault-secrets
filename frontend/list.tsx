import { FunctionComponent, h } from "preact";
import { useEffect, useState } from "preact/hooks";

import { SecretData } from "./client";
import { SecretInfo } from "./common";

const icon = (isRevealed: boolean) =>
  isRevealed ? "mdi-lock-open" : "mdi-lock";
const buttonClass = (color: string) => `btn ${color} btn-sm`;
const buttonColor = (isRevealed: boolean) =>
  isRevealed ? "btn-danger" : "btn-success";

const Secret: FunctionComponent<{
  meta: SecretInfo;
  getSecret: () => Promise<SecretData>;
  handleEdit: () => void;
}> = ({ meta, getSecret, handleEdit }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [data, setData] = useState<{
    value: string;
    version: number;
  } | null>(null);
  useEffect(() => {
    if (isRevealed && (!data?.value || data?.version !== meta.version)) {
      getSecret().then(({ data, metadata }) =>
        setData(data && { value: data.password, version: metadata.version })
      );
    }
  }, [getSecret, isRevealed, data, meta.version]);

  return (
    <tr>
      <td>{meta.label}</td>
      <td>{meta.username}</td>
      <td class={isRevealed ? "" : "text-muted"}>
        {isRevealed && data?.value ? data.value : "***********"}
      </td>
      <td class="text-end noprint">
        <a
          class={buttonClass(buttonColor(isRevealed))}
          title="Reveal Secret"
          onClick={() => setIsRevealed(!isRevealed)}
        >
          <i class={`mdi ${icon(isRevealed)}`}></i>
        </a>{" "}
        <a
          class={buttonClass("btn-warning")}
          title="Edit Secret"
          onClick={handleEdit}
        >
          <i class="mdi mdi-pencil"></i>
        </a>{" "}
        <a class={buttonClass("btn-danger")} title="Delete Secret">
          <i class="mdi mdi-trash-can-outline"></i>
        </a>
      </td>
    </tr>
  );
};

export const List: FunctionComponent<{
  secretList: SecretInfo[];
  getSecret: (id: string) => Promise<SecretData>;
  handleEdit: (id: string) => void;
}> = ({ secretList, getSecret, handleEdit }) => {
  if (secretList.length === 0) {
    return <div class="text-muted">None</div>;
  }

  return (
    <table class="table table-hover">
      <tbody>
        {secretList.map((secret) => (
          <Secret
            key={secret.id}
            meta={secret}
            getSecret={() => getSecret(secret.id)}
            handleEdit={() => handleEdit(secret.id)}
          />
        ))}
      </tbody>
    </table>
  );
};
