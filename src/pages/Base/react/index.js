import React from "react";

export default function Base(props) {
  let { history } = props;

  const TryFetch = () => {
    history.push("/ShowInfo/pqIPV5I7UWne9QjQMm72");
  };

  return (
    <div className="pagewrap">
      Base Page
      <button
        className={"button bordered primary"}
        onClick={() => {
          TryFetch();
        }}
      >
        Goto /ShowInfo/pqIPV5I7UWne9QjQMm72
      </button>
    </div>
  );
}
