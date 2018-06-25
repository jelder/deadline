import React, { Component } from 'react';
import { formatDistance } from "date-fns";
import { Navbar, Nav, NavItem, ListGroup, ListGroupItem, Grid, Row, Col, Jumbotron, Button } from 'react-bootstrap';
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
      <div className="container">
      <Navbar>
        <Navbar.Header>
          <Navbar.Brand>
            Deadlines
          </Navbar.Brand>
        </Navbar.Header>
          <Nav pullRight={true}>
            <LoadingSpinner gapiReady={this.state.gapiReady}>
              <NavSession gapiSignedIn={this.state.gapiSignedIn}/>
            </LoadingSpinner>
          </Nav>
      </Navbar>
      <Welcome {...this.state}>
        <LoadingSpinner {...this.state}><Display/></LoadingSpinner>
      </Welcome>
      </div>
    )
  }
}

function Welcome(props) {
  console.log("welcome", props)
  if (props.gapiSignedIn) {
    return props.children || []
  } else {
    return (
      <Jumbotron>
        <h1>Got Deadlines?</h1>
        <p>
          Deadlines is an alternative view for Google Calendars. It eschews the classic calendar grid in favor of counting down the moments until each thing is due.
        </p>
        <p>
          This site doesn't track you or store your data. Made with ♡ by <a href="http://jacobelder.com">Jacob Elder</a>.
        </p>
        <hr/>
        <LoadingSpinner {...props}>
          <Button bsStyle="primary" onClick={signIn}>Sign In</Button>
        </LoadingSpinner>
      </Jumbotron>
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

function NavSession(props) {
  if (props.gapiSignedIn) {
    return <NavItem onClick={signOut}>Sign Out</NavItem>
  } else {
    return <NavItem onClick={signIn}>Sign In</NavItem>
  }
}

function signIn() {
  return window.gapi.auth2.getAuthInstance().signIn()
}

function signOut() {
  return window.gapi.auth2.getAuthInstance().signOut()
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
      'maxResults': 50,
      'orderBy': 'startTime'
    })
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