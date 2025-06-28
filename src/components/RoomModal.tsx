import { useState } from "react";
import Fade from "../transitions/Fade";

interface Props {
  show: boolean;
  roomCode: string;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onClose: () => void;
}

export default function RoomModal({
  show,
  roomCode,
  onCreate,
  onJoin,
  onClose,
}: Props) {
  const [code, setCode] = useState("");

  function join() {
    if (code.trim()) onJoin(code.trim());
  }

  function copy() {
    navigator.clipboard.writeText(roomCode);
  }

  return (
    <Fade
      show={show}
      background="border-4 border-sky-300 dark:border-slate-700 bg-sky-100 dark:bg-slate-900 drop-shadow-xl absolute z-10 w-full sm:w-fit inset-x-0 mx-auto py-6 px-6 rounded-md space-y-2"
    >
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
              className="bg-blue-700 text-white rounded-md px-4 py-2"
              onClick={join}
            >
              Join
            </button>
            <button
              className="bg-blue-700 text-white rounded-md px-4 py-2"
              onClick={onCreate}
            >
              Create
            </button>
          </div>
        </div>
      )}
    </Fade>
  );
}
