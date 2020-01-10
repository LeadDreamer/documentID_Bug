import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import ReactObject from "./react";

import { getActivePerson } from "../redux/slices";

const mapStateToProps = state => {
  return {
    currentPerson: getActivePerson(state)
  };
};

export default withRouter(
  connect(
    mapStateToProps,
    null //dispatch of actionCreator function for Redux/React - component doesn't need to know
  )(ReactObject)
);
