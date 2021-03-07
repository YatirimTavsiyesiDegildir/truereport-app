import React, {Component} from 'react';
import {Alert, YellowBox} from 'react-native';
import * as eva from '@eva-design/eva';
import {ApplicationProvider, IconRegistry} from '@ui-kitten/components';
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import LoginNavigator from './Screens/Navigators/LoginNavigator';
import MainNavigator from './Screens/Navigators/MainNavigator';
import {StoreData, GetData} from './src/utils/AsyncStorage';
import {call} from 'react-native-reanimated';
import theme from './src/themes/theme';
import {client} from './back-end/OurApi';
import {gql} from '@apollo/client';
import auth from '@react-native-firebase/auth';

YellowBox.ignoreWarnings(['Warning: ReactNative.createElement']);

/**GLOBALS START*/
global.apiUrl = 'https://truereport.ey.r.appspot.com';
global.email = '';
global.userId = 0;
global.tckn = '';
global.realName = '';
global.password = '';
global.username = '';
global.friendsAdded = false;
global.subscriptionWarningEnabled = false;
/**GLOBALS END*/

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoggedIn: false,
      isAnon: false,
      following: [],
      verified: [],
    };
  }

  componentDidMount() {
    this.checkCredentials();
  }

  clearLoginInfo() {
    StoreData('email', '');
    StoreData('user_id', '');
    StoreData('tckn', '');
    StoreData('real_name', '');
    StoreData('password', '');
    StoreData('username', '');
    global.email = '';
    global.userId = '';
    global.tckn = '';
    global.realName = '';
    global.password = '';
    global.username = '';
    this.setState({isLoggedIn: false});
  }

  saveLoginInfo(user) {
    StoreData('email', user.email);
    StoreData('user_id', user.id);
    StoreData('tckn', user.tckn);
    StoreData('real_name', user.name);
    StoreData('password', user.password);
    StoreData('username', user.username);
    global.email = user.email;
    global.userId = user.id;
    global.tckn = user.tckn;
    global.realName = user.name;
    global.password = user.password;
    global.username = user.username;
    this.setState({isLoggedIn: true});
  }

  async checkCredentials() {
    let email = await GetData('email');
    let password = await GetData('password');
    let isAnon = await GetData('isAnon');
    if (
      email !== null &&
      email !== '' &&
      password !== null &&
      password !== ''
    ) {
      client
        .query({
          query: gql`
            query MyQuery($email: String, $password: String) {
              users(
                where: {
                  email: {_eq: $email}
                  _and: {_or: {password: {_eq: $password}}}
                }
              ) {
                email
                id
                tckn
                username
                name
                password
                phonenumber
              }
            }
          `,
          variables: {
            email: email,
            password: password,
          },
        })
        .then(result => {
          if (result.data.users.length === 1) {
            let user = result.data.users[0];
            this.saveLoginInfo(user);
          } else {
            this.clearLoginInfo();
          }
        })
        .catch(result => {
          this.clearLoginInfo();
        });
    } else if (isAnon !== null && isAnon === true) {
      let verified = await GetData('verified');
      let following = await GetData('following');
      if (verified !== null) {
        this.setState({verified: verified});
      }
      if (following !== null) {
        this.setState({following: following});
      }
      this.setState({isAnon: true, isLoggedIn: true});
    }
  }

  logInUserAnon() {
    this.setState({isLoggedIn: true, isAnon: true});
    StoreData('isAnon', true);
  }

  logInUserWithPassword(email, password, callback) {
    client
      .query({
        query: gql`
          query MyQuery($email: String, $password: String) {
            users(
              where: {
                email: {_eq: $email}
                _and: {_or: {password: {_eq: $password}}}
              }
            ) {
              email
              id
              tckn
              username
              name
              password
              phonenumber
            }
          }
        `,
        variables: {
          email: email,
          password: password,
        },
      })
      .then(result => {
        if (result.data.users.length === 1) {
          let user = result.data.users[0];
          this.saveLoginInfo(user);
          callback();
        } else {
          Alert.alert('Email veya sifre yanlis.');
          callback();
        }
      })
      .catch(result => {
        Alert.alert('Bir hata olustu.');
        callback();
      });
  }

  logout = () => {
    this.clearLoginInfo();
    this.setState({isLoggedIn: false});
  };

  async register(email, password) {
    await auth()
      .createUserWithEmailAndPassword(email, password)
      .then(() => {
        console.log('User account created & signed in!');
      })
      .catch(error => {
        if (error.code === 'auth/email-already-in-use') {
          console.log('That email address is already in use!');
        }

        if (error.code === 'auth/invalid-email') {
          console.log('That email address is invalid!');
        }

        console.error(error);
      });
  }

  render() {
    return (
      <>
        <IconRegistry icons={EvaIconsPack} />
        <ApplicationProvider {...eva} theme={theme.light}>
          {this.state.isLoggedIn ? (
            <MainNavigator
              mainFunctions={{
                logout: () => this.logout(),
                setFollowing: newFollowing => {
                  this.setState({following: newFollowing});
                  StoreData('following', newFollowing);
                },
              }}
              isAnon={this.state.isAnon}
              getFollowing={() => this.state.following}
              getVerified={() => this.state.verified}
              setVerified={verified => {
                this.setState({verified: verified});
                StoreData('verified', verified);
              }}
            />
          ) : (
            <LoginNavigator
              mainFunctions={{
                logInUser: (email, password, callback) =>
                  this.logInUserWithPassword(email, password, callback),
                logInUserAnon: () => this.logInUserAnon(),
              }}
            />
          )}
        </ApplicationProvider>
      </>
    );
  }
}
