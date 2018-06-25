import React, { Component } from 'react';
import { formatDistance } from "date-fns";
import { Button, Navbar, Nav, ListGroup, ListGroupItem, Grid, Row, Col } from 'react-bootstrap';
import linkifyStr from 'linkifyjs/string';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

class App extends Component {
  constructor() {
    super()
    this.state = {}
  }

  loadCalendarApi() {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/client.js";
    script.onload = () => {
      window.gapi.load('client', () => {
        window.gapi.client.init({
          apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
          clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        }).then(() => {
          this.setState({ gapiSignedIn: window.gapi.auth2.getAuthInstance().isSignedIn.get() })
          window.gapi.auth2.getAuthInstance().isSignedIn.listen(gapiSignedIn => this.setState({gapiSignedIn}));
        })

        window.gapi.client.load('calendar', 'v3', () => {
          this.setState({ gapiReady: true });
        });
      });
    };

    document.body.appendChild(script);
  }

  componentDidMount() {
    this.loadCalendarApi();
  }

  render() {
    return (
      <div>
      <Navbar>
        <Navbar.Header>
          <Navbar.Brand>
            Deadlines
          </Navbar.Brand>
        </Navbar.Header>
      </Navbar>
      <LoadingSpinner gapiReady={this.state.gapiReady}>
        <Session gapiSignedIn={this.state.gapiSignedIn}>
          <Display/>
        </Session>
      </LoadingSpinner>
      </div>
    )
  }
}

function LoadingSpinner(props) {
  if (props.gapiReady) {
    return props.children
  } else {
    return "Loading..."
  }
}

function Session(props) {
  if (props.gapiSignedIn) {
    return (
      <div>
      <Button onClick={window.gapi.auth2.getAuthInstance().signOut}>Sign Out</Button>
      {props.children}
      </div>
    )
  } else {
    return <Button bsStyle="primary" onClick={window.gapi.auth2.getAuthInstance().signIn}>Sign In</Button>
  }
}

class Display extends Component {
  constructor() {
    super()
    this.state = {events: []}
  }

  componentDidMount() {
    this.getItems()
    this.timerID = setInterval(
      () => this.getItems(),
      1000 * 60 * 5
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  async getItems() {
    const {result} = await window.gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 10,
      'orderBy': 'startTime'
    })
    console.log(result)
    this.setState({events: result.items})
  }
  
  render() {
    return (
      <ListGroup>
        {this.state.events.map(event => <Event key={event.id} {...event} />)}
      </ListGroup>
    )
  }
}

class Event extends Component {
  constructor() {
    super()
    this.state = {}
  }

  componentDidMount() {
    this.tick()
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    this.setState({
      distance: this.getDistance()
    });
  }

  getDistance() {
    return formatDistance(new Date(this.props.start.dateTime || this.props.start.date), new Date(), {includeSeconds: true})
  }

  getText() {
    return {
      __html: linkifyStr(this.props.location, { nl2br: true })
    }
  }

  render() {
    return (
      <ListGroupItem>
        <Grid>
          <Row>
            <Col xs={6} md={4}>
              {this.props.summary}
            </Col>
            <Col xs={3} md={2}>
              {this.state.distance}
            </Col>
          </Row>
          { !!this.props.location &&
            <Row>
              <div dangerouslySetInnerHTML={this.getText()}/>
            </Row>
          }
        </Grid>
        {/* {JSON.stringify(this.props, null, 2)} */}
      </ListGroupItem>
    )
  }
}

export default App;

// import logo from './logo.svg';
// import './App.css';

/*
<header className="App-header">
<img src={logo} className="App-logo" alt="logo" />
<h1 className="App-title">Welcome to React</h1>
</header>
*/