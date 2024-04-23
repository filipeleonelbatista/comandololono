import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { FaTwitch } from "react-icons/fa"
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const { handleSignInTwitch, isLogged } = useAuth();


  useEffect(() => {
    if (isLogged) {
      navigate('/list')
    }
  }, [isLogged])

  return (
    <div className="w-full flex flex-col gap-4 items-center p-4">
      <div className="w-full px-2 flex items-center gap-4">
        <ModeToggle />
        <div className="w-full flex flex-col">
          <h2 className="font-bold text-2xl">Comandololono</h2>
          <p>ou comandolono se preferir</p>
        </div>
      </div>

      <img className="w-16 h-16 animate-spin mt-8" src="/icon32.png" alt="Colono girando" />

      <div className="w-full flex flex-col gap-2 items-center my-10">
        <button onClick={handleSignInTwitch} className="bg-purple-600 w-5/6 rounded p-2 text-white flex flex-row justify-center items-center gap-4 uppercase font-bold">
          <FaTwitch className="w-6 h-6" />
          Faça Login com a Twitch
        </button>
        <p className="italic text-md">para enviar comandos na live</p>

        <p className="my-4">Ou</p>

        <button onClick={() => navigate('/list')} className="bg-transparent border border-purple-400 w-5/6 rounded p-2 text-purple-400 uppercase font-bold">
          Pesquise os comandos
        </button>
      </div>


      <p className="italic text-md text-center">Ultima atualização dos comandos: 09/04/2024 22:22</p>

      <div className="w-full flex flex-col gap-2 mt-6">
        <p className="italic text-md text-center">Desenvolvido pelo maior exemplo que essa Live já teve!</p>
        <a
          href="https://filipeleonelbatista.dev.br/"
          target="_blank"
          rel="noreferer noopener"
          className="text-purple-400 underline text-md text-center">Filipe Batista | Desenvolvedor de software</a>
      </div>
    </div>
  )
}

export default Home
