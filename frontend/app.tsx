import { FunctionComponent, h, render, Fragment } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import { SecretMetadata, VaultClient } from "./client";
import { infoFromMeta, SecretInfo } from "./common";
import { EditForm } from "./edit";
import { List } from "./list";
import { Login, logout } from "./login";

const batch = (list: string[], batchSize: number): string[][] => {
  const result = [];
  for (let i = 0; i < list.length / batchSize; i++) {
    result.push(list.slice(i, i + batchSize));
  }
  return result;
};

const gatherSecrets = async (client: VaultClient, path: string) => {
  const { keys } = await client.listSecrets(`netbox/${path}`);
  const results: SecretMetadata[] = [];
  // fetch batches of 5
  for (const set of batch(keys, 5)) {
    const items = await Promise.all(
      set.map((key) => client.secretMetadata(`netbox/${path}/${key}`))
    );
    results.push(...items);
  }
  const secretList: SecretInfo[] = results.map((meta, i) =>
    infoFromMeta(keys[i], meta)
  );
  return secretList;
};

const App: FunctionComponent<{}> = (props) => {
  const [client, setClient] = useState<VaultClient | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [secretList, updateSecretList] = useState<SecretInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const entityPath = "device/1";

  useEffect(() => {
    if (client) {
      gatherSecrets(client, entityPath)
        .then((list) => {
          updateSecretList(list);
          setError(null);
        })
        .catch((e) => {
          updateSecretList([]);
          setError(e.message || e.toString());
        });
    }
  }, [client]);

  const reload = useCallback(
    async (id: string) => {
      const meta = await client.secretMetadata(`netbox/${entityPath}/${id}`);
      const info = infoFromMeta(id, meta);
      const index = secretList.findIndex((item) => item.id === id);
      if (index === -1) {
        updateSecretList([...secretList, info]);
      } else {
        updateSecretList([
          ...secretList.slice(0, index),
          info,
          ...secretList.slice(index + 1),
        ]);
      }
    },
    [client, secretList]
  );

  const editEnd = useCallback(() => {
    reload(editingId).then(() => setEditingId(null));
  }, [editingId]);

  if (error) {
    return (
      <div class="alert alert-danger" role="alert">
        Unable to load secrets: {error}
      </div>
    );
  }

  return (
    <>
      <div class="card-header d-flex">
        <h5>Secrets</h5>
        {client !== null && (
          <a
            class="btn btn-outline-secondary btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={() => {
              logout();
              setClient(null);
            }}
          >
            Logout
          </a>
        )}
      </div>
      <div class="card-body">
        {client === null ? (
          <Login handleLogin={setClient} />
        ) : (
          <>
            <List
              secretList={secretList}
              getSecret={(id) =>
                client.secretData(`netbox/${entityPath}/${id}`)
              }
              handleEdit={setEditingId}
            />
            {editingId && (
              <EditForm
                path={entityPath}
                id={editingId}
                client={client}
                handleClose={editEnd}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};

// following is render boilerplate

const container = document.getElementById("netbox-vault-app-container");
container.innerHTML = "";

let root;
function init() {
  root = render(<App />, container, root);
}

// @ts-ignore
if (import.meta.webpackHot) {
  console.log("found support for HMR");
  // @ts-ignore
  import.meta.webpackHot.accept("./app.tsx", () => {
    console.log("reloading...");
    requestAnimationFrame(init);
  });
  // @ts-ignore
  import.meta.webpackHot.accept();
}

init();
