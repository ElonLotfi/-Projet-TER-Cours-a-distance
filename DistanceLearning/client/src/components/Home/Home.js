import React, { Component } from 'react';
import { Row, Col, Button, Input, message } from 'antd';
import { FETCH_MEET_URL, MEET_BASE_URL } from '../../config';
import axios from 'axios';
import './Home.scss';

class Home extends Component {
  state = {
    joinUrl: '', //right side
    meetUrl: '', //left side
    urlCopied: false,
    showCopyUrlSection: false,
    username: localStorage.getItem('username') || '',
  };

  createMeetingBtnHandler = async () => {
    try {
      let data = await axios.get(FETCH_MEET_URL);
      if (data && data.data && data.data.data) {
        this.setState({
          meetUrl: MEET_BASE_URL + '/' + data.data.data,
          showCopyUrlSection: true,
          urlCopied: false,
        });
      }
    } catch (error) {}
  };

  copyUrlClickedHandler = async () => {
    try {
      await navigator.clipboard.writeText(this.state.meetUrl);
      this.setState({
        urlCopied: true,
      });
    } catch (error) {
      console.error(error);
    }
  };

  joinMeetingHandler = () => {
    if (this.state.joinUrl.trim() === '') {
      message.warning('Please paste the url!');
      return;
    }
    if (this.state.username.trim() === '') {
      message.warning('Please enter a name!');
      return;
    }

    this.props.history.push(this.state.joinUrl.split('/')[3]);
  };

  joinUrlChangedHandler = (e) => {
    this.setState({ joinUrl: e.target.value });
  };

  render() {
    const { urlCopied, showCopyUrlSection, meetUrl } = this.state;

    return (
      <Row className="home">
        <Col span={12} className="create-video-chat">
          <div className="header-left">Miage</div>
          <Row align="middle" className="create-meeting-container">
            <Col span={24} style={{ textAlign: 'center' }}>
              <div className="title">
              generation of a link.
              </div>
              <Button
                type="primary"
                shape="round"
                className="create-chat-btn"
                onClick={this.createMeetingBtnHandler}
              >
                Create Meeting
              </Button>

              {showCopyUrlSection ? (
                <Row justify="center" className="meeting-url-copy-container">
                  <Col className="url">{meetUrl}</Col>
                  {urlCopied ? (
                    <Col span={4} className="url-copied">
                      <Button type="primary">Copied</Button>
                    </Col>
                  ) : (
                    <Col span={4} className="url-copy-btn">
                      <Button
                        type="primary"
                        onClick={this.copyUrlClickedHandler}
                      >
                        <i className="far fa-clone"></i>
                        Copy
                      </Button>
                    </Col>
                  )}
                </Row>
              ) : null}
            </Col>
          </Row>
        </Col>
        <Col span={12} className="start-video-chat">
          <div className="header-right">Call App</div>
          <Row align="middle" className="join-meeting-container">
            <Col span={24} style={{ textAlign: 'center' }}>
              <div className="title">
                Paste the link below to join the meeting.
              </div>
              <Row justify="center" className="meeting-url-join-container">
                <Col span={5} className="username">
                  <Input
                    type="text"
                    placeholder="Friendly name..."
                    value={this.state.username}
                    onChange={(e) => {
                      let username = e.target.value;
                      this.setState({ username }, () => {
                        localStorage.setItem('username', username);
                      });
                    }}
                  />
                </Col>
                <Col span={10} className="url">
                  <Input
                    type="text"
                    placeholder="Paste url here..."
                    value={this.state.joinUrl}
                    onChange={this.joinUrlChangedHandler}
                  />
                </Col>
                <Col span={4} className="join-chat-btn">
                  <Button type="primary" onClick={this.joinMeetingHandler}>
                    Join
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Col>
        <div className="footer">
          <i className="fab fa-github"></i>
          <a
            href="https://github.com/Mohamed0002/Projet-TER-Cours-a-distance"
            target="_blank"
            rel="noopener noreferrer"
          >
            code
          </a>
        </div>
      </Row>
    );
  }
}

export default Home;
