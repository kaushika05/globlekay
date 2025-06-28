import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { getPath } from "../util/svg";

import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();
  const iconWidth = 14;
  const { nightMode } = useContext(ThemeContext).theme;

  return (
    <footer className="pt-8 pb-4 text-xs flex items-end justify-between w-full">
      <span className="max-w-[40%]">
        <FormattedMessage id="Footer1" />
      </span>
      <div className="flex flex-col sm:flex-row justify-start">
        <span className="flex justify-end">
          <span className="mt-10 mb-4">
            <FormattedMessage id="Aux2" />{" "}
            <button
              className="underline cursor-pointer inline"
              onClick={() => navigate("/info")}
            >
              <FormattedMessage id="Aux3" />
            </button>
          </span>
        </span>
      </div>
    </footer>
  );
}
