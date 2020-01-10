import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import ReactObject from "./react";

export default withRouter(
  connect(
    null,
    null //dispatch of actionCreator function for Redux/React - component doesn't need to know
  )(ReactObject)
);
