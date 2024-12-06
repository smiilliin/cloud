import React, { createContext, useContext, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { AppContext } from "../App";
import { checkAccessToken } from "../api";
import styled, { CSSProperties } from "styled-components";
import Directory from "../images/directory.svg";
import Cloud from "../images/cloud.svg";
import Tripledot from "../images/tripledot.svg";
import Modal from "react-modal";
import Path from "path-browserify";
import { Button, InputButton, InputSubmitButton } from "../components/buttons";
import { useSearchParams } from "react-router-dom";
import EventEmitter from "events";

enum ActionType {
  Move,
  Rename,
}
interface ModalCtx {
  path: string | null;
  setPath: React.Dispatch<React.SetStateAction<string | null>>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDir: boolean;
  setIsDir: React.Dispatch<React.SetStateAction<boolean>>;
}
const ModalContext = createContext<ModalCtx>({
  path: null,
  setPath: () => {},
  isOpen: false,
  setIsOpen: () => {},
  isDir: false,
  setIsDir: () => {},
});

const OverflowText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const _File = ({
  className,
  name,
  isDir,
  dir,
  setDir,
  enableModal,
}: {
  className?: string;
  name: string;
  isDir: boolean;
  enableModal: boolean;
  dir: string;
  setDir: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const context = useContext(ModalContext);

  const safeMimeTypes = [
    "text/plain",
    "image/jpeg",
    "image/gif",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/x-icon",
    "video/webm",
    "audio/mpeg",
    "audio/aac",
    "audio/wav",
    "application/json",
    "image/svg+xml",
    "application/pdf",
    "video/mp4",
    "video/x-msvideo",
    "video/quicktime",
    "video/x-matroska",
  ];

  return (
    <div
      className={className}
      onClick={() => {
        if (isDir) {
          setDir(Path.join(dir, name));
        } else {
          fetch(
            `https://cloud-back.${
              process.env.REACT_APP_URL
            }/mime?path=${encodeURIComponent(Path.join(dir, name))}`,
            {
              method: "GET",
              credentials: "include",
            }
          )
            .then((data) => data.text())
            .then((data) => {
              if (safeMimeTypes.indexOf(data) != -1) {
                setTimeout(() => {
                  window
                    .open(
                      `https://cloud-back.${
                        process.env.REACT_APP_URL
                      }/file?path=${encodeURIComponent(Path.join(dir, name))}`,
                      "_blank",
                      "noopener,noreferrer"
                    )
                    ?.focus();
                });
              }
            });
        }
      }}
    >
      {isDir ? (
        <img src={Directory} style={{ width: 35 }}></img>
      ) : (
        <img src={Cloud} style={{ width: 35 }}></img>
      )}
      <OverflowText>{name}</OverflowText>
      {enableModal ? (
        <img
          src={Tripledot}
          onClick={(event) => {
            event.stopPropagation();
            context.setPath(Path.join(dir, name));
            context.setIsOpen(true);
            context.setIsDir(isDir);
          }}
        ></img>
      ) : (
        <></>
      )}
    </div>
  );
};
const File = styled(_File)`
  width: 100%;
  height: 50px;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 10px;
  border: 1px solid var(--second-color);
  display: grid;
  grid-template-columns: 30px 1fr 30px;
  gap: 30px;
  align-items: center;
  cursor: pointer;
`;
interface Entry {
  name: string;
  isDir: boolean;
}

const DirList = ({
  dir,
  setDir,
  enableModal,
  updateTrigger,
  style,
}: {
  dir: string;
  setDir: React.Dispatch<React.SetStateAction<string>>;
  enableModal: boolean;
  updateTrigger: boolean;
  style?: CSSProperties;
}) => {
  const context = useContext(AppContext);
  const [entries, setEntries] = useState<Entry[]>([]);
  const intl = useIntl();

  useEffect(() => {
    if (!context.accessToken) return;

    fetch(`https://cloud-back.${process.env.REACT_APP_URL}/readdir`, {
      method: "POST",
      headers: { Authorization: `Bearer ${context.accessToken}` },
      body: JSON.stringify({ path: dir }),
    })
      .then((data) => data.json())
      .then((data) => {
        if (!data.status) {
          alert(intl.formatMessage({ id: data.reason }));
          return;
        }
        setEntries(data.entries || []);
      });
  }, [dir, context.accessToken, updateTrigger]);

  return (
    <div style={style}>
      <File
        isDir={true}
        name=".."
        dir={dir}
        setDir={setDir}
        enableModal={false}
      ></File>
      {entries.map((entry, i) => (
        <File
          isDir={entry.isDir}
          name={entry.name}
          dir={dir}
          setDir={setDir}
          enableModal={enableModal}
          key={i}
        ></File>
      ))}
    </div>
  );
};

const _Newdir = ({
  dir,
  updateTrigger,
  setUpdateTrigger,
  className,
}: {
  dir: string;
  updateTrigger: boolean;
  setUpdateTrigger: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const context = useContext(AppContext);
  const intl = useIntl();

  return (
    <>
      <img
        className={className}
        src={Directory}
        onClick={() => setIsOpen(true)}
      ></img>

      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        shouldCloseOnOverlayClick={true}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            position: "fixed",
            top: 0,
            left: 0,
          },
          content: {
            width: "60%",
            height: "30%",
            maxWidth: 500,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "var(--first-color)",
            border: "none",
            borderRadius: 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          },
        }}
      >
        <form
          autoComplete="off"
          style={{
            width: "100%",
            height: "100%",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
          }}
          onSubmit={(event) => {
            event.preventDefault();

            const formData = new FormData(event.currentTarget);
            const name = formData.get("name");

            if (!context.accessToken) return;

            fetch(`https://cloud-back.${process.env.REACT_APP_URL}/mkdir`, {
              method: "POST",
              headers: { Authorization: `Bearer ${context.accessToken}` },
              body: JSON.stringify({ dir: dir, name: name }),
            })
              .then((data) => data.json())
              .then((data) => {
                if (!data.status) {
                  alert(intl.formatMessage({ id: data.reason }));
                  return;
                }

                setUpdateTrigger(!updateTrigger);
              });
            setIsOpen(false);
          }}
        >
          <input
            style={{
              backgroundColor: "transparent",
              width: "80%",
              height: 40,
              borderRadius: 10,
              fontSize: 15,
              border: "1px solid var(--second-color)",
              padding: 5,
            }}
            name="name"
          ></input>
          <div
            style={{
              position: "absolute",
              bottom: 10,
              display: "flex",
              flexDirection: "row",
            }}
          >
            <InputSubmitButton
              value={intl.formatMessage({ id: "ok" })}
            ></InputSubmitButton>
            <InputButton
              value={intl.formatMessage({ id: "cancel" })}
              onClick={() => setIsOpen(false)}
            ></InputButton>
          </div>
        </form>
      </Modal>
    </>
  );
};
const Newdir = styled(_Newdir)`
  width: 60px;
  height: 60px;
  border-radius: 20px;
  border: none;
  padding: 10px;
  position: fixed;
  right: 30px;
  bottom: 30px;

  &:hover {
    background-color: var(--second-color);
  }
`;

const FileInputLabel = styled.label`
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, 0);
  left: 50%;
  bottom: 10px;
  padding: 5px;
  width: 80%;
  height: auto;
  max-width: 600px;
  border-radius: 20px;
  background-color: var(--second-color);
`;
const FileInput = styled.input.attrs(() => ({
  multiple: true,
  type: "file",
}))`
  display: none;
`;
const Progress = styled.progress`
  border-radius: 10px;
  margin-top: 5px;
  max-width: 300px;
  width: 80%;
  height: 10px;
  border: 1px solid white;

  &::-webkit-progress-bar {
    background-color: white;
    border-radius: 10px;
  }
  &::-webkit-progress-value {
    background-color: var(--second-color);
    border-radius: 10px;
  }
  &::-moz-progress-bar {
    background-color: var(--second-color);
    border-radius: 10px;
  }
`;

function Dir() {
  const intl = useIntl();
  const context = useContext(AppContext);

  const [type, setType] = useState<ActionType | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isDir, setIsDir] = useState<boolean>(false);
  const [params] = useSearchParams();
  const [dir, setDir] = useState(params.get("dir") || "/");
  const [modalDir, setModalDir] = useState("");
  const [progressText, setProgressText] = useState("");
  const [updateTrigger, setUpdateTrigger] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const modalContext: ModalCtx = {
    path: path,
    setPath: setPath,
    isOpen: isOpen,
    setIsOpen: setIsOpen,
    isDir: isDir,
    setIsDir: setIsDir,
  };

  useEffect(() => {
    Modal.setAppElement("body");
  }, []);
  useEffect(() => {
    document.title = intl.formatMessage({ id: "cloud" });

    checkAccessToken(context);
    setInterval(checkAccessToken, 1000 * 60 * 30, context);
  }, [context]);

  useEffect(() => {
    if (isOpen) {
      setType(null);
    }
  }, [isOpen]);

  const [popstate, setPopstate] = useState<boolean>(false);

  useEffect(() => {
    window.onpopstate = () => {
      setPopstate(true);
      setDir(params.get("dir") || "/");
    };
  }, [params, setPopstate]);
  useEffect(() => {
    if (!popstate) {
      window.history.pushState(
        {},
        "",
        `/dir?${new URLSearchParams({ dir: dir }).toString()}`
      );
    } else {
      setPopstate(false);
    }
  }, [dir]);

  return (
    <>
      <Newdir
        dir={dir}
        updateTrigger={updateTrigger}
        setUpdateTrigger={setUpdateTrigger}
      ></Newdir>
      <FileInputLabel>
        <p>
          {progressText == ""
            ? intl.formatMessage({ id: "select_file" })
            : intl.formatMessage({ id: "uploading" }) + " " + progressText}
        </p>
        <FileInput
          multiple={true}
          onChange={(event) => {
            const currentDir = dir;
            const filesRaw = event.target.files;
            if (!filesRaw) return;

            const files: File[] = [];

            for (let i = 0; i < filesRaw.length; i++) {
              files.push(filesRaw[i]);
            }
            const chunkSize = 1024 * 10;

            const ws = new WebSocket(
              `wss://cloud-back.${process.env.REACT_APP_URL}/ws`
            );

            const messageLimit = 10;
            let messageCount = 0;
            const messageLimitEvent = new EventEmitter();
            const messageLimitEvents: Map<string, EventEmitter> = new Map();
            const progress: Map<string, number> = new Map();
            const size: Map<string, number> = new Map();
            const startEvent = new EventEmitter();
            const startEvents: Map<string, EventEmitter> = new Map();
            const ok: Map<string, boolean> = new Map();

            startEvent.on("ok", (uuid: string) => {
              const event = startEvents.get(uuid);
              startEvents.delete(uuid);
              event?.emit("resolve", true);
            });
            startEvent.on("cancel", (uuid: string) => {
              const event = startEvents.get(uuid);
              startEvents.delete(uuid);
              size.delete(uuid);
              event?.emit("resolve", false);
            });
            messageLimitEvent.on("ok", () => {
              messageCount--;
              if (messageCount < 0) messageCount = 0;

              const uuids = Array.from(messageLimitEvents.keys());

              if (uuids.length == 0) return;
              const uuid = uuids[Math.floor(Math.random() * uuids.length)];
              const messageLimiterEvent = messageLimitEvents.get(uuid);
              messageLimitEvents.delete(uuid);
              messageLimiterEvent?.emit("resolve");
            });
            messageLimitEvent.on("cancel", (uuid: string) => {
              messageLimitEvents.delete(uuid);
              ok.set(uuid, false);

              const uuids = Array.from(messageLimitEvents.keys());

              messageCount = 0;
              for (let i = 0; i < uuids.length; i++) {
                messageLimitEvent.emit("ok");
              }
              size.delete(uuid);
            });

            const packetLimiter = (uuid: string) => {
              messageCount++;

              if (messageCount <= messageLimit) {
                return new Promise<void>((resolve) => resolve());
              }

              return new Promise<void>((resolve) => {
                const packetLimiterEvent = new EventEmitter();
                packetLimiterEvent.once("resolve", resolve);
                messageLimitEvents.set(uuid, packetLimiterEvent);
              });
            };
            const startEventLimiter = (uuid: string) => {
              return new Promise<boolean>((resolve) => {
                const event = new EventEmitter();
                event.once("resolve", resolve);
                startEvents.set(uuid, event);
              });
            };

            const WsEventToken = "TOKEN";
            const WsEventFileInfo = "FILEINFO";
            const WsEventEOF = "EOF";
            const WsEventOK = "OK";
            const WsEventOverride = "OVERRIDE";
            const WsEventOverrideOK = "OVERRIDE_OK";
            const WsEventError = "ERROR";

            function btoa_string(str: string) {
              return btoa(
                encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
                  return String.fromCharCode(parseInt(p1, 16));
                })
              );
            }
            const updateProgress = () => {
              const uuids = Array.from(size.keys());
              const progresses = uuids.map(
                (uuid) => progress.get(uuid) as number
              );
              const sizes = uuids.map((uuid) => size.get(uuid) as number);
              const doneCount = progresses.filter(
                (progress, i) => sizes[i] == progress
              ).length;
              const sumsize = sizes.reduce((prev, curr) => prev + curr, 0);
              const weights = progresses.map(
                (progress, i) => (progress / sizes[i]) * (sizes[i] / sumsize)
              );

              const sum = weights.reduce((prev, curr) => prev + curr, 0);
              setProgressText(
                `[${doneCount}/${uuids.length}] ${(sum * 100).toFixed(2)}%`
              );
              setProgress(sum * 100);
            };
            const fileInfoMap: Map<
              string,
              {
                size: number;
                name: string;
                dir: string;
                last_modified: string;
                uuid: string;
              }
            > = new Map();
            const uploadFile = async (file: File) => {
              const uuid = crypto.randomUUID();

              progress.set(uuid, 0);
              size.set(uuid, file.size);
              ok.set(uuid, true);
              updateProgress();

              const fileInfo = {
                size: file.size,
                name: file.name,
                dir: currentDir,
                last_modified: new Date(file.lastModified).toISOString(),
                uuid: uuid,
              };
              fileInfoMap.set(uuid, fileInfo);
              ws.send(
                JSON.stringify({
                  event: WsEventFileInfo,
                  body: btoa_string(JSON.stringify(fileInfo)),
                })
              );

              if (!(await startEventLimiter(uuid))) return;

              const reader = new FileReader();
              let offset = 0;

              if (file.size == 0) {
                await packetLimiter(uuid);
                ws.send(
                  JSON.stringify({ event: WsEventEOF, body: btoa(uuid) })
                );
                progress.set(uuid, 0);
                updateProgress();
                setUpdateTrigger(!updateTrigger);
                return;
              }

              reader.onload = async (event) => {
                if (!ok.get(uuid)) return;
                await packetLimiter(uuid);
                const chunkData = event.target?.result as ArrayBuffer;

                ws.send(
                  JSON.stringify({
                    event: uuid,
                    body: btoa(
                      new Uint8Array(chunkData).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ""
                      )
                    ),
                  })
                );

                const isEnd = offset + chunkSize >= file.size;
                if (!isEnd) {
                  offset += chunkSize;
                  progress.set(uuid, offset);
                  updateProgress();
                  readChunk();
                } else {
                  ws.send(
                    JSON.stringify({ event: WsEventEOF, body: btoa(uuid) })
                  );
                  progress.set(uuid, file.size);
                  updateProgress();
                }
              };
              const readChunk = () => {
                reader.readAsArrayBuffer(
                  file.slice(offset, offset + chunkSize)
                );
              };
              readChunk();
            };

            ws.onopen = () => {
              if (!context.accessToken) {
                return ws.close();
              }

              ws.send(
                JSON.stringify({
                  event: WsEventToken,
                  body: btoa(context.accessToken),
                })
              );

              const promises = files.map(async (file) => {
                await uploadFile(file);
              });
              Promise.all(promises).then(() => {
                event.target.value = "";
              });
            };
            ws.onmessage = (event) => {
              const message = JSON.parse(event.data);
              const body = atob(message.body);

              switch (message.event) {
                case WsEventOK: {
                  startEvent.emit("ok", body);
                  messageLimitEvent.emit("ok");
                  break;
                }
                case WsEventOverrideOK: {
                  messageLimitEvent.emit("ok");
                  break;
                }
                case WsEventOverride: {
                  const fileInfo = fileInfoMap.get(body);

                  if (!fileInfo) {
                    startEvent.emit("cancel", body);
                    messageLimitEvent.emit("cancel", body);
                    break;
                  }

                  if (
                    window.confirm(
                      intl.formatMessage({ id: "override_confirm" }) +
                        ` (${fileInfo.name})`
                    )
                  ) {
                    ws.send(
                      JSON.stringify({
                        event: WsEventOverride,
                        body: btoa_string(JSON.stringify(fileInfo)),
                      })
                    );
                    startEvent.emit("ok", body);
                    messageLimitEvent.emit("ok");
                  } else {
                    startEvent.emit("cancel", body);
                    messageLimitEvent.emit("cancel", body);

                    updateProgress();
                  }
                  break;
                }
                case WsEventError: {
                  const errorBody = JSON.parse(body);
                  size.delete(errorBody.uuid);

                  startEvent.emit("cancel", errorBody.uuid);
                  messageLimitEvent.emit("cancel", errorBody.uuid);

                  updateProgress();
                  alert(intl.formatMessage({ id: errorBody.reason }));

                  break;
                }
                case WsEventEOF: {
                  messageLimitEvent.emit("ok", body);
                  setUpdateTrigger(!updateTrigger);
                  break;
                }
              }
            };
          }}
        ></FileInput>
        <Progress max={100} value={progress}></Progress>
      </FileInputLabel>
      <ModalContext.Provider value={modalContext}>
        <div
          style={{
            overflowX: "hidden",
            overflowY: "auto",
            paddingTop: 30,
            paddingBottom: 120,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: 600,
            width: "80%",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <DirList
            dir={dir}
            setDir={setDir}
            updateTrigger={updateTrigger}
            enableModal={true}
          ></DirList>
          <Modal
            isOpen={modalContext.isOpen}
            onRequestClose={() => modalContext.setIsOpen(false)}
            shouldCloseOnOverlayClick={true}
            style={{
              overlay: {
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                position: "fixed",
                top: 0,
                left: 0,
              },
              content: {
                width: "80%",
                height: type == ActionType.Move ? "80%" : "30%",
                maxWidth: type == ActionType.Move || type == null ? 700 : 300,
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "var(--first-color)",
                border: "none",
                borderRadius: 20,
                gap: 10,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              },
            }}
          >
            {type == null ? (
              <>
                <OverflowText
                  style={{
                    marginBottom: 30,
                    textAlign: "center",
                    fontSize: 25,
                    fontWeight: 600,
                    width: "100%",
                  }}
                >
                  {path}
                </OverflowText>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  <Button onClick={() => setType(ActionType.Rename)}>
                    {intl.formatMessage({ id: "rename" })}
                  </Button>
                  <Button
                    onClick={() => {
                      setModalDir(dir);
                      setType(ActionType.Move);
                    }}
                  >
                    {intl.formatMessage({ id: "move" })}
                  </Button>
                  <Button
                    onClick={() => {
                      if (!context.accessToken) return;

                      if (
                        !window.confirm(
                          intl.formatMessage({ id: "rm_confirm" })
                        )
                      )
                        return;

                      fetch(
                        `https://cloud-back.${process.env.REACT_APP_URL}/remove`,
                        {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${context.accessToken}`,
                          },
                          body: JSON.stringify({ path: path }),
                        }
                      )
                        .then((data) => data.json())
                        .then((data) => {
                          if (!data.status) {
                            alert(intl.formatMessage({ id: data.reason }));
                            return;
                          }

                          setUpdateTrigger(!updateTrigger);
                          setIsOpen(false);
                        });
                    }}
                  >
                    {intl.formatMessage({ id: "delete" })}
                  </Button>
                </div>
                {!isDir ? (
                  <Button
                    onClick={() => {
                      setTimeout(() => {
                        window
                          .open(
                            `https://cloud-back.${
                              process.env.REACT_APP_URL
                            }/download?path=${encodeURIComponent(
                              modalContext.path || ""
                            )}`,
                            "_blank",
                            "noopener,noreferrer"
                          )
                          ?.focus();
                      });
                    }}
                  >
                    {intl.formatMessage({ id: "download" })}
                  </Button>
                ) : (
                  <></>
                )}
                <Button onClick={() => setIsOpen(false)}>
                  {intl.formatMessage({ id: "cancel" })}
                </Button>
              </>
            ) : (
              <></>
            )}
            {type == ActionType.Rename ? (
              <>
                <form
                  autoComplete="off"
                  style={{
                    width: "100%",
                    height: "100%",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    display: "flex",
                  }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!path) return setType(null);

                    const formData = new FormData(event.currentTarget);
                    const name = formData.get("name") as string | null;

                    if (!name) return setType(null);

                    fetch(
                      `https://cloud-back.${process.env.REACT_APP_URL}/rename`,
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${context.accessToken}`,
                        },
                        body: JSON.stringify({
                          target: path,
                          dest: Path.join(Path.parse(path).dir, name),
                        }),
                      }
                    )
                      .then((data) => data.json())
                      .then((data) => {
                        if (!data.status) {
                          alert(intl.formatMessage({ id: data.reason }));
                          return;
                        }

                        setUpdateTrigger(!updateTrigger);
                      });

                    setIsOpen(false);
                  }}
                >
                  <input
                    style={{
                      backgroundColor: "transparent",
                      width: "80%",
                      height: 40,
                      borderRadius: 10,
                      fontSize: 15,
                      border: "1px solid var(--second-color)",
                      padding: 5,
                    }}
                    defaultValue={Path.basename(path || "")}
                    name="name"
                  ></input>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 10,
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <InputSubmitButton
                      value={intl.formatMessage({ id: "ok" })}
                    ></InputSubmitButton>
                    <InputButton
                      value={intl.formatMessage({ id: "cancel" })}
                      onClick={() => setType(null)}
                    ></InputButton>
                  </div>
                </form>
              </>
            ) : (
              <></>
            )}
            {type == ActionType.Move ? (
              <>
                <DirList
                  dir={modalDir}
                  setDir={setModalDir}
                  updateTrigger={updateTrigger}
                  enableModal={false}
                  style={{
                    width: "80%",
                    height: "calc(100% - 30px)",
                    overflowY: "auto",
                  }}
                ></DirList>

                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <Button
                    onClick={() => {
                      if (!path) return setType(null);

                      fetch(
                        `https://cloud-back.${process.env.REACT_APP_URL}/rename`,
                        {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${context.accessToken}`,
                          },
                          body: JSON.stringify({
                            target: path,
                            dest: Path.join(modalDir, Path.basename(path)),
                          }),
                        }
                      )
                        .then((data) => data.json())
                        .then((data) => {
                          if (!data.status) {
                            alert(intl.formatMessage({ id: data.reason }));
                            return;
                          }

                          setUpdateTrigger(!updateTrigger);
                        });

                      setIsOpen(false);
                    }}
                  >
                    {intl.formatMessage({ id: "ok" })}
                  </Button>
                  <Button onClick={() => setType(null)}>
                    {intl.formatMessage({ id: "cancel" })}
                  </Button>
                </div>
              </>
            ) : (
              <></>
            )}
          </Modal>
        </div>
      </ModalContext.Provider>
    </>
  );
}

export { Dir };
