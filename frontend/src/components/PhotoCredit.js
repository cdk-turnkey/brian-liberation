import React, { Component } from "react";
import MenuAppBar from "./MenuAppBar";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";

const styles = (theme) => ({
  button: {
    margin: theme.spacing(1),
  },
  input: {
    display: "none",
  },
});

class PhotoCredit extends Component {
  render() {
    return (
      <div>
        <MenuAppBar />
        <div madliberationid="photo-credit-page">
          <br />
          <Typography variant="h2" gutterBottom>
            Photo credit
          </Typography>
          <Typography component="p" paragraph gutterBottom>
            The photo on the home page is of Grand Lake in Oklahoma. Brian has
            been there. Photo credit: By JDMcGreg - Own work, CC BY-SA 3.0,
            https://commons.wikimedia.org/w/index.php?curid=20498014.
          </Typography>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(PhotoCredit);
