import React from "react";
import { Switch, Route } from "react-router-dom";
import ShowInfo from "../ShowInfo";
import Base from "../Base";

const Main = props => {
  return (
    <main>
      <Switch>
        <Route exact path="/ShowInfo/:showID">
          <ShowInfo />
        </Route>
        <Route path="/">
          <Base />
        </Route>
      </Switch>
    </main>
  );
};

export default Main;
