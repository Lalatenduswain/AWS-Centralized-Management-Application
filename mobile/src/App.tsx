/**
 * Main Mobile App Component
 *
 * Sets up navigation for the mobile application.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import ClientListScreen from './screens/ClientListScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={ClientListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
