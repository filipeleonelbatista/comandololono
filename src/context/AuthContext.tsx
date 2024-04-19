
import axios from "axios";
import { createContext, useEffect, useState } from "react";
import tmi from 'tmi.js';

interface TwitchUser {
  broadcaster_type: string;
  created_at: string;
  description: string;
  display_name: string;
  email: string;
  id: string;
  login: string;
  offline_image_url: string;
  profile_image_url: string;
  type: string;
  view_count: number;
}

interface AuthContextProps {
  tmiClient?: null | tmi.Client;
  user?: null | TwitchUser;
  token?: null | string;
  isLogged?: boolean;
  handleSignInTwitch?: () => Promise<void>;
  handleLogout?: () => Promise<void>;
  sendCommand?: (command: string, channel: string) => Promise<void>;
}

interface MessageBackground {
  type: "auth_response",
  message: 'success' | 'error',
  redirect_uri: Object
}

interface ResponseTwitchAuth {
  [key: string]: string;
}

export const AuthContext = createContext<AuthContextProps>({
  tmiClient: null,
  user: null,
  token: null,
  isLogged: false,
  handleSignInTwitch: async () => { },
  handleLogout: async () => { },
  sendCommand: async (command: string, channel: string) => { console.log(command, channel) },
});

export function AuthContextProvider({ children }: React.PropsWithChildren<AuthContextProps>) {
  const [tmiClient, setTmiClient] = useState<null | tmi.Client>(null)
  const [user, setUser] = useState<null | TwitchUser>(null)
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
    const redirect_uri = import.meta.env.VITE_TWITCH_APP_URL;
    const response_type = "token";
    const scope = "user:read:email user:read:follows user:read:subscriptions chat:edit chat:read";

    const url =
      `https://id.twitch.tv/oauth2/authorize?client_id=${client_id}&force_verify=${force_verify}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${encodeURI(scope)}`;


    const responsePromise = new Promise((resolve, reject) => {
      chrome.runtime.onMessage.addListener((message: MessageBackground) => {
        if (message.type === "auth_response") {
          if (message.message === 'success') {
            resolve(message.redirect_uri);
          }
        }
      });

      setTimeout(() => {
        reject(new Error("Tempo limite de autenticação excedido"));
      }, 2 * 60 * 1000); // 2 minutos em milissegundos
    });

    chrome.runtime.sendMessage({ type: "open_auth_window", authUrl: url });

    try {
      const responseData: string | any = await responsePromise;

      const splitted = responseData
        .replace("https://bcfbachfejglefkifmidgkffcmcefodf.chromiumapp.org/", "")
        .replace("#", "")
        .split("&");

      let values: ResponseTwitchAuth = {
        access_token: '',
        scope: '',
        token_type: ''
      }

      for (const variable of splitted) {
        const xpto: string[] = variable.split("=")
        values[xpto[0]] = xpto[1]
      }

      if (Object.keys(values).length > 0) {
        localStorage.setItem("@token", JSON.stringify(values))
      }

      handleLoadUser();
    } catch (error) {
      console.log("Erro durante a autenticação:", error);
    }

  };

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

      console.log("user", user)
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
      setUser({ ...user })
      setIsLogged(true)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!passedBy) {
        const storageToken = localStorage.getItem("@token");
        if (storageToken) {
          handleLoadUser();
        }
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