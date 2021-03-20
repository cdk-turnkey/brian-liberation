import React, { Component } from "react";
import { Link } from "react-router-dom";
import MenuAppBar from "./MenuAppBar";
import { Button } from "@material-ui/core";
import { madLiberationStyles } from "../madLiberationStyles";
import { Typography } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import StageDirection from "./StageDirection";

const styles = () => {
  return {
    bordered: {
      paddingRight: "20px",
      paddingLeft: "20px",
      paddingTop: "10px",
      paddingBottom: "10px",
    },
  };
};

class ExplainVideoPage extends Component {
  render() {
    const { classes } = this.props;
    return (
      <div madliberationid="explain-page">
        <MenuAppBar />
        <div>
          <br />
          <div className={classes.bordered}>
            <Typography variant="h1" component="h2" gutterBottom>
              Hello
            </Typography>
            <Typography component="p" paragraph>
              Dear Leader (of this virtual sesh), follow these instructions to
              bring order to your remote thing-reading ceremony.
            </Typography>

            <Typography variant="h2" component="h2" gutterBottom>
              Get everyone's attention and explain the first step
            </Typography>
            <Typography component="p" paragraph>
              <StageDirection>Read aloud</StageDirection>: Hi! We are about to
              play a game called Brian Liberation.
            </Typography>
            <Typography variant="h2" component="h2" gutterBottom>
              Explain the concept
            </Typography>
            <Typography component="p" paragraph>
              <StageDirection>Read aloud</StageDirection>: Together, we’re going
              to create a fill-in-the-blank thing by answering prompts on our
              phones or computers with words or phrases. We’ll then take turns
              reading our one-of-a-kind creation.
            </Typography>
            <Typography variant="h2" component="h2" gutterBottom>
              Figure out the order of readers
            </Typography>
            <Typography component="p" paragraph>
              Somehow. Just figure out what order people will read the script in
              and make note of it. The app still works if people read out of
              order.
            </Typography>
            <Typography variant="h2" component="h2" gutterBottom>
              Provide further instructions
            </Typography>
            <Typography component="p" paragraph>
              <StageDirection>Read aloud</StageDirection>: On your phone or
              computer, type{" "}
              <span style={madLiberationStyles.blue}>brian-liberation.com</span>{" "}
              in a web browser. When you’re there, optionally click{" "}
              <b>Log in</b>, then mandatorily <b>Join a Sesh</b>. Logging in
              isn't mandatory, but it will let you re-join the sesh if anything
              goes wrong. If you aren't able to join the sesh on your device,
              try using a different browser. Go ahead, I’ll wait.
            </Typography>
            <Typography component="p" paragraph>
              <StageDirection>
                Pause and confirm that everyone has complied.
              </StageDirection>
            </Typography>
            <Typography component="p" paragraph>
              <StageDirection>Read aloud</StageDirection>: I’ll give you the
              Room Code to enter the sesh in a moment. When you get your
              prompts, pay attention to how you phrase your answers. Make sure
              you fill in and click through all of your prompts, then hit
              "Submit” when you’re done. After we've all submitted, click "Yes,
              I want the script.” Then, we read our collective creation! The app
              will tell us when it’s time to “pass” to the next reader. Any
              questions?
            </Typography>
            <Typography component="p" paragraph>
              <StageDirection>
                Pause for questions. Once all are answered, move on.
              </StageDirection>
            </Typography>
            <Typography variant="h2" component="h2" gutterBottom>
              Provide additional clarity...and don't close your tabs!
            </Typography>
            <Typography component="p" paragraph>
              <StageDirection>Read aloud</StageDirection>: One more thing:{" "}
              <b>
                Once you've joined the sesh, don't close the tab or go to any
                other web sites in the tab in which you have the game open.
              </b>{" "}
              If you click Log In on the Home Page before you join our sesh, and
              you accidentally close your tab, you can probably re-join by
              logging in again and clicking <b>See your seshes</b>. Logging in
              also lets you retrieve the completed script later.
            </Typography>
            <Typography component="p" paragraph>
              If you encounter any problems, try using a different browser or
              device.
            </Typography>
            <Typography component="p" paragraph>
              If everyone is ready to celebrate Brian, I'm going to click
              "Proceed" to generate our Room Code and let the Brian Liberation
              begin!
            </Typography>
          </div>
          <div>
            <Button
              madliberationid="proceed-from-explanation-button"
              variant="contained"
              color="primary"
              component={Link}
              to="/pick-script"
            >
              Proceed
            </Button>
            <br />
          </div>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(ExplainVideoPage);
