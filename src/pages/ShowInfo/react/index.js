import React from "react";
import { useState, useEffect } from "react";
import { fetchFromGroup } from "../../../redux/firestore";

export default function Base(props) {
  let { match } = props;

  let showID = match.params["showID"];

  const [show_ID, setShow_ID] = useState(null);
  const [show_ShortPath, setShow_ShortPath] = useState(null);
  const [show_Path, setShow_Path] = useState(null);

  useEffect(() => {
    (async () => {
      let showDocument_ID = await fetchFromGroup("Shows", showID);
      setShow_ID(showDocument_ID);
      let showDocument_ShortPath = await fetchFromGroup(
        "Shows",
        "/Shows/" + showID
      );
      setShow_ShortPath(showDocument_ShortPath);
      let showDocument_Path = await fetchFromGroup(
        "Shows",
        "/Artists/n7sLjpSEaxzeua8pMknh/Tours/VRVA3mBXfZwExxQtFZB3" +
          "/Shows/" +
          showID
      );
      setShow_Path(showDocument_Path);
    })();
  }, [showID]);

  return (
    <React.Fragment>
      <div className="pagewrap">
        Show Page with ID{" "}
        {show_ID
          ? show_ID.place
            ? show_ID.name + " " + show_ID.place
            : show_ID.message
          : "Not Fetched"}
      </div>
      <div className="pagewrap">
        Show Page with Path{" "}
        {show_ShortPath
          ? show_ShortPath.place
            ? show_ShortPath.name + " " + show_ShortPath.place
            : show_ShortPath.message
          : "Not Fetched"}
      </div>
      <div className="pagewrap">
        Show Page with Path{" "}
        {show_Path
          ? show_Path.place
            ? show_Path.name + " " + show_Path.place
            : show_Path.message
          : "Not Fetched"}
      </div>
    </React.Fragment>
  );
}
