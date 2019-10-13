import React from 'react'
import { Button, Form, Header, Icon, Image, Modal } from 'semantic-ui-react'
import { DateTimeInput } from 'semantic-ui-calendar-react'
import { firebase, googleAuthProvider } from '../fire'
import db from '../fire'
import './Map.css'

const API_KEY = `${process.env.REACT_APP_DARK_SKY_API_KEY}`

const style = {
  weather: {
    marginTop: '1rem'
  },
  a: {
    color: 'black'
  },
  p: {
    textAlign: 'left'
  }
}

class CourtModal extends React.Component {

  state = {
    showWeather: false,
    temp: '',
    conditions: '',
    error: null,
    loggedIn: null,
    dateTime: null,
    dates: [],
    deleteDate: null
  }

  handleChange = (event, {name, value}) => {
    if (this.state.hasOwnProperty(name)) {
      this.setState({ [name]: value });
    }
  }

  // get document from firestore by id via props, add new game to array, update state to immediately display new game
  handleScheduleGame = e => {
    e.preventDefault()
    db.collection('courts').doc(this.props.id).update({
      dateTime: firebase.firestore.FieldValue.arrayUnion(this.state.dateTime)
    })
    this.setState({
      dateTime: '',
      dates: [...this.state.dates, this.state.dateTime]
    })
  }

  // take in game from onclick method, filter out game to be deleted, update state
  handleRemoveGame = game => {
    const games = this.state.dates.filter( deleted => deleted !== game )
    db.collection('courts').doc(this.props.id).update({
      dateTime: firebase.firestore.FieldValue.arrayRemove(game)
    })
    this.setState({ dates: games })
  }

  // if user is logged in, update state which will allow user to add games to schedule 
  componentDidMount() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          loggedIn: true
        })
      }
    })
    this.setState({
      dates: this.props.gameDateTime
    })
  }

  startLogin = () => {
    firebase.auth().signInWithPopup(googleAuthProvider)
  }

  //trigged onClick with icon, pulls in current temprature and conditions
  getWeather = () => {
     fetch(`https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/${API_KEY}/${this.props.lat},${this.props.lng}`)
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            showWeather: true,
            temp: Math.floor(result.currently.temperature),
            conditions: result.currently.summary
          })
        },
        (error) => {
          this.setState({ showWeather: false })
        }
      )
  }

  render() {
    return (
      <div>
      <Modal trigger={<Icon onClick={this.getWeather} inverted name="basketball ball" size="large" color={this.props.gameDateTime && this.props.gameDateTime.length > 0 ? "orange" : "black"}/>}>
        <Modal.Content image>
        <Image wrapped size='medium' src={this.props.image} />
        <Modal.Description>
            <Header>{this.props.name}</Header>
            <p>{this.props.address}</p>
            {this.props.url && <a id="mapsLink" href={this.props.url} target="_blank" rel="noopener noreferrer">Open in Maps</a>}
            {this.state.showWeather && <p style={style.weather}>Current weather, <a style={style.a} href="https://darksky.net/poweredby" target="_blank" rel="noreferrer noopener">powered by Dark Sky</a>: {this.state.conditions}, {this.state.temp}°F</p>}
        </Modal.Description>
        </Modal.Content>
        {this.state.loggedIn && 
          <Modal.Actions>
            <p style={style.p}>Schedule a game</p>
            <Form onSubmit={this.handleScheduleGame}>
              <DateTimeInput
                clearable
                clearIcon={<Icon name="remove" color="red" />}
                dateTimeFormat={'MMMM Do YYYY, h:mm a'}
                popupPosition={'bottom center'}
                name="dateTime"
                placeholder="Select a date and time"
                value={this.state.dateTime}
                iconPosition="left"
                onChange={this.handleChange}
              />
              {this.state.dateTime && <Modal trigger={<Button secondary type="submit">Schedule Game</Button>} basic size="small">
                <Modal.Description><p style={{textAlign: 'center'}}>Successfully added</p></Modal.Description>
              </Modal>}
              <p id="schedule">
                Scheduled games: {this.state.dates && this.state.dates.length > 0 ? this.state.dates.map( game => {
                  return <li key={game}>
                          <Icon id="deleteGame" name="trash alternate outline" color="red" onClick={() => { this.handleRemoveGame(game) }} /> {game}
                         </li> 
                }) : "None"} 
              </p>
            </Form>
          </Modal.Actions> 
        }
        {!this.state.loggedIn &&
          <Modal.Actions id="signInActions">
            <Button secondary onClick={this.startLogin}>
              Sign In to Schedule Game
            </Button>
            <p id="schedule">
            Scheduled games: {this.state.dates && this.state.dates.length > 0 ? this.state.dates.map(game => {
              return <li key={game}>
                      {game}
                     </li> 
            }) : "None"} 
          </p>
        </Modal.Actions> 
        }
       </Modal>
    </div>
    )
  }
}

export default CourtModal