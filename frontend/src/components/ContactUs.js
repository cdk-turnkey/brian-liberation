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

class ContactUs extends Component {
  render() {
    return (
      <div>
        <MenuAppBar />
        <div madliberationid="contact-us-page">
          <br />
          <Typography variant="h2" gutterBottom>
            Contact Us
          </Typography>
          <Typography component="p" paragraph gutterBottom>
            Email{" "}
            <a href="mailto:admin+brian@passover.lol">
              admin+brian@passover.lol
            </a>{" "}
            with any concerns.
          </Typography>
          <Typography component="p" paragraph gutterBottom>
            In particular, you can contact us if we sent you an email as part of
            our account verification process, and you did not intend to sign up.
          </Typography>
          <Typography component="p" paragraph gutterBottom>
            If you have logged in with a social media site like Facebook, you
            can email us to request that any of your data that we have obtained
            from the social media site about you be deleted from Brian
            Liberation.
          </Typography>
          <Typography component="p" paragraph gutterBottom>
            If you have logged in with your email address, you can email us to
            request that we delete your email address from Brian Liberation.
          </Typography>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(ContactUs);
