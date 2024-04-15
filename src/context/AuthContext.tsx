
import axios from "axios";
import { createContext, useEffect, useState } from "react";
import tmi from 'tmi.js';

interface AuthContextProps {
  tmiClient?: null | tmi.Client;
  user?: null | Object;
  token?: null | string;
  isLogged?: boolean;
  passedBy?: boolean;
  handleSignInTwitch?: () => Promise<void>;
  handleLogout?: () => Promise<void>;
  sendCommand?: (command: string, channel: string) => Promise<void>;
}


interface ValuesObject {
  [key: string]: string;
}

export const AuthContext = createContext<AuthContextProps>({
  tmiClient: null,
  user: null,
  token: null,
  isLogged: false,
  passedBy: false,
  handleSignInTwitch: async () => { },
  handleLogout: async () => { },
  sendCommand: async (command: string, channel: string) => { console.log(command, channel) },
});

export function AuthContextProvider({ children }: React.PropsWithChildren<AuthContextProps>) {
  const [tmiClient, setTmiClient] = useState<null | tmi.Client>(null)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLogged, setIsLogged] = useState(false)
  const [passedBy, setPassedBy] = useState(false)

  const sendCommand = async (command: string, channel: string) => {
    if (tmiClient) {
      await tmiClient.say(channel, command)
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem("@token")
    setToken(null)
    setUser(null)
    setIsLogged(false)
  }

  const handleSignInTwitch = async () => {
    const client_id = import.meta.env.VITE_TWITCH_CLIENT_ID;
    const force_verify = true;
    const redirect_uri = window.location.origin + "/";
    const response_type = "token";
    const scope = "user:read:email user:read:follows user:read:subscriptions chat:edit chat:read";

    const url =
      `https://id.twitch.tv/oauth2/authorize?client_id=${client_id}&force_verify=${force_verify}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${encodeURI(scope)}`;

    window.open(url, '_self')
  }

  const validate = async (access_token: string) => {
    const result = await axios.get('https://id.twitch.tv/oauth2/validate', {
      headers: {
        Authorization: 'Bearer ' + access_token,
      }
    })

    return result.data;
  }

  const getUser = async (access_token: string, login: string) => {
    const userInfo = await axios.get(`https://api.twitch.tv/helix/users?login=${login}`, {
      headers: {
        Authorization: 'Bearer ' + access_token,
        "Client-Id": import.meta.env.VITE_TWITCH_CLIENT_ID
      }
    })

    return userInfo.data.data[0]
  }

  const checkFollowsIf = async (access_token: string, from_id: string) => {
    const followList = await axios.get(`https://api.twitch.tv/helix/users/follows?from_id=${from_id}`, {
      headers: {
        Authorization: 'Bearer ' + access_token,
        "Client-Id": import.meta.env.VITE_TWITCH_CLIENT_ID
      }
    })

    const channelList = followList.data.data;

    const channelIFFollowed = []

    for (const channel of channelList) {
      if ('colonogamer' === channel.to_login) {
        channelIFFollowed.push(channel.to_login)
      }
    }

    return channelIFFollowed
  }

  useEffect(() => {
    if (tmiClient !== null) {
      tmiClient.connect()
    }
  }, [tmiClient])

  const handleLoadUser = async () => {
    const storageToken = localStorage.getItem("@token");
    if (storageToken && !passedBy) {
      const values = JSON.parse(storageToken)
      const validation = await validate(values.access_token);

      if (validation.status === 401) {
        alert("Sua twitch foi desconectada. Faça login novamente para recuperar o acesso!")
        return;
      }

      const user = await getUser(values.access_token, validation.login);

      const userFollowedChannels = await checkFollowsIf(values.access_token, user.id);

      window.location.href.replace(window.location.hash, "").replace("#", "")
      window.location.hash = ""

      const client = new tmi.Client({
        connection: {
          reconnect: true,
        },
        identity: {
          username: user.login,
          password: values.access_token,
        },
        channels: [
          'colonogamer'
        ],
        options: {
          skipUpdatingEmotesets: true
        }
      });

      setTmiClient(client)

      setToken(values)
      setUser({ ...user, follows: userFollowedChannels })
      setIsLogged(true)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!passedBy) {
        const splitted = window.location.hash.replace("#", "&").split("&")
        splitted.shift()
        let values: ValuesObject = {};
        for (const variable of splitted) {
          const xpto = variable.replace(/&/g, "").split("=")
          values[xpto[0]] = xpto[1]
        }

        if (Object.keys(values).length > 0) {
          localStorage.setItem("@token", JSON.stringify(values))
        }

        handleLoadUser();
        setPassedBy(true)
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [passedBy]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLogged,
        handleSignInTwitch,
        handleLogout,
        sendCommand,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}