export const SERVER_URL =
  process.env.NODE_ENV === 'development'
    ? 'https://2.15.249.91:1122'
    : 'https//2.15.249.91';

export const PEERJS_URL = 
  process.env.NODE_ENV === 'development' ? '2.15.249.91' : '2.15.249.91';

export const SOCKET_URL =
  process.env.NODE_ENV === 'development'
    ? 'https://2.15.249.91:1122'
    : 'https://2.15.249.91';


export const FETCH_MEET_URL = SERVER_URL + '/createMeetUrl';

export const MEET_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'https://2.15.249.91:3000'
    : 'https://2.15.249.91';

