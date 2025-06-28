import { useState } from "react";
import Fade from "../transitions/Fade";

interface Props {
  show: boolean;
  roomCode: string;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onClose: () => void;
  socketConnected: boolean;
}

export default function RoomModal({
  show,
  roomCode,
  onCreate,
  onJoin,
  onClose,
  socketConnected,
}: Props) {
  const [code, setCode] = useState("");

  function join() {
    console.log("Join button clicked with code:", code.trim());
    if (code.trim()) onJoin(code.trim());
  }

  function copy() {
    console.log("Copy button clicked for room code:", roomCode);
    navigator.clipboard.writeText(roomCode);
  }

  function handleCreate() {
    console.log("Create button clicked");
    onCreate();
  }

  return (
    <>
      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      )}
      <Fade
        show={show}
        background="border-4 border-sky-300 dark:border-slate-700 bg-sky-100 dark:bg-slate-900 drop-shadow-xl fixed z-50 w-full sm:w-fit inset-x-0 mx-auto top-1/2 transform -translate-y-1/2 py-6 px-6 rounded-md space-y-2"
      >
        {!socketConnected && (
          <div className="text-center mb-4">
            <p className="text-red-600 dark:text-red-400 text-sm">
              Connecting to server...
            </p>
          </div>
        )}
        {roomCode ? (
          <div className="space-y-4 text-center">
            <p className="dark:text-gray-200">Room Code: {roomCode}</p>
            <div className="space-x-2">
              <button
                className="bg-blue-700 text-white rounded-md px-4 py-2"
                onClick={copy}
              >
                Copy
              </button>
              <button
                className="bg-blue-700 text-white rounded-md px-4 py-2"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <input
              className="border rounded-md p-2 w-full text-gray-900"
              placeholder="Room code"
              value={code}
              onChange={(e) => setCode(e.currentTarget.value)}
            />
            <div className="space-x-2">
              <button
                className="bg-blue-700 text-white rounded-md px-4 py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={join}
                disabled={!socketConnected}
              >
                Join
              </button>
              <button
                className="bg-blue-700 text-white rounded-md px-4 py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleCreate}
                disabled={!socketConnected}
              >
                Create
              </button>
            </div>
          </div>
        )}
      </Fade>
    </>
  );
}
