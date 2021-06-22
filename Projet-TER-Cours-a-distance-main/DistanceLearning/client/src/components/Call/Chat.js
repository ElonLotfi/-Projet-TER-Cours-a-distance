import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';

const Chat = ({ socket, username, display }) => {
  var currentUser = localStorage.getItem("username") ;
  const [msg, setMsg] = useState([]);
  const messagesEndRef = useRef();
  const inputRef = useRef();
  var sendert ;


  useEffect(() => {
    socket.on('send-message', ({ msg, sender }) => {
      sendert = sender;
      localStorage.setItem("senders",sender);
      console.log("le sender " + sendert)
      setMsg((msgs) => [...msgs, { sender, msg }]);
      sendert = sender;


    });
  }, []);

  // Scroll to Bottom of Message List
  // Scroll to Bottom of Message List
  useEffect(() => { scrollToBottom() }, [msg])

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }



  const sendMessage = (e) => {

    if (e.key === 'Enter') {
      const msg = e.target.value;

      if (msg) {
        socket.emit('send-message', {
          msg: msg,
          sender: localStorage.getItem("username")
        })

        setMsg((msgs) => [...msgs, { currentUser, msg }]);



        console.log("when send " + msg)
        inputRef.current.value = '';
      }
    }


    // 

  };

  
  
  return (
    <ChatContainer className={display ? '' : 'width0'}>
      <TopHeader> Chat Room</TopHeader>
      <ChatArea>
        <MessageList>
          {msg &&
            msg.map(({ msg,sender }, idx) => {
              if (localStorage.getItem("senders") === localStorage.getItem("username") ) {
                return (
                  <Message key={idx}>
                    <strong>{sender}</strong>
                    <p>{msg}</p>
                  </Message>
                );
              } else {
                return (
                  <UserMessage key={idx}>
                    <strong>{sender}</strong>
                    <p>{msg}</p>
                  </UserMessage>
                );
              }
            })}
            <div style={{float:'left', clear: 'both'}} ref={messagesEndRef} />
        </MessageList>
      </ChatArea>
      <BottomInput
        ref={inputRef}
        onKeyUp={sendMessage}
        placeholder="Enter your message"
      />
    </ChatContainer>
  );
};

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 23%;
  hieght: 100%;
  margin-bottom:-15px;
  background-color: #1587a3;
  transition: all 0.5s ease;
  overflow: hidden;
`;

const TopHeader = styled.div`
  width: 100%;
  text-align: center;
  color:white;
  margin-top: 15px;
  font-weight: 600;
  font-size: 15px;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 25px;
`;

const ChatArea = styled.div`
  width: 100%;
  height: 83%;
  max-height: 83%;
  overflow-x: hidden;
  overflow-y: auto;
`;

const MessageList = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  padding: 15px;
  color: white;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 25px;
`;

const Message = styled.div`
  width: 100%;
  display: flex;
  
  flex-direction: column;
  align-items: flex-start;
  font-size: 16px;
  margin-top: 15px;
  margin-left: 15px;
  text-align: left;
  > strong {
    margin-left: 3px;
  }
  > p {
 

    max-width: 65%;
    width: auto;
    padding: 9px;
    margin-top: 3px;
    margin-right: 20px;
    border: 1px solid rgb(78, 161, 211, 0.3);
    border-radius: 15px;
    background-color: #d62f12;
    color: white;
    font-size: 14px;
    text-align: left;
  }
`;

const UserMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  font-size: 16px;
  margin-top: 15px;
  text-align: center;
  
  > strong {
    margin-right: 35px;
  }
  > p {
    max-width: 65%;
    width: auto;
    max-width: 80vh;


    padding: 9px;
    margin-top: 3px;
    margin-right: px;
    border: 1px solid rgb(78, 161, 211, 0.3);
    border-radius: 15px;
    background-color: #1ab112;
    color: white;
    font-size: 14px;
    text-align: center;

  }
`;

const BottomInput = styled.input`
  bottom: 0;
  width: 100%;
  height: 8%;
  padding: 15px;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 15px;
  border-top: 1px solid rgb(69, 69, 82, 0.25);
  box-sizing: border-box;
  opacity: 0.7;
  :focus {
    outline: none;
  }
`;

export default Chat;
