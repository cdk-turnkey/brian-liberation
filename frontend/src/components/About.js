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

class About extends Component {
  render() {
    return (
      <div>
        <MenuAppBar />
        <div madliberationid="about-page">
          <br />
          <Typography variant="h2" gutterBottom>
            About
          </Typography>
          <Typography component="p" paragraph gutterBottom>
            Brian Liberation is a fill-in-the-blank game created for a guy named
            Brian.
          </Typography>
          <Typography component="p" paragraph gutterBottom>
            You can use it to create a session with your friends. It will
            generate a Room Code, you share it with your friends, they join you,
            you fill in blanks, et cetera.
          </Typography>
          <Typography id="about-text" component="p" paragraph gutterBottom>
            Brian Liberation's source code lives on{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/cdk-turnkey/brian-liberation"
            >
              GitHub
            </a>{" "}
            . You can raise issues there for any bugs encountered or features
            desired.
          </Typography>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(About);
