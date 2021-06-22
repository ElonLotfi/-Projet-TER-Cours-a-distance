import React from 'react';
import Home from './components/Home/Home';
import Call from './components/Call/Call';
import { Switch, Route } from 'react-router-dom';
import './App.css';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div className="App">
      <Switch>
        <Route path="/" exact component={Home}></Route>
        <Route path="/*" component={Call}></Route>
      </Switch>
      <ToastContainer></ToastContainer>

    </div>
  );
}

export default App;