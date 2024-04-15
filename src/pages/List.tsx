import { ModeToggle } from "@/components/mode-toggle";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { FaTwitch } from "react-icons/fa";
import audiosArray from '@/assets/content'
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

function List() {
  const { toast } = useToast()

  const { handleSignInTwitch, isLogged, sendCommand } = useAuth();

  const [text, setText] = useState<string>('');

  const filteredItems = useMemo(() => {
    if (text.length === 0) return audiosArray;

    const resultado = audiosArray.filter(value => value.includes(text))

    return resultado;
  }, [text])

  async function copyTextToClipboard(text: string) {
    if ('clipboard' in navigator) {
      try {
        await navigator.clipboard.writeText(text);
        toast({
          description: "Copiado para a area de transferencia.",
        })
      } catch (err) {
        toast({
          variant: "destructive",
          description: "Falha ao copiar texto.",
        })
      }
    } else {
      document.execCommand('copy', true, text);
      toast({
        description: "Copiado para a area de transferencia.",
      })
    }
  }

  return (
    <div className="w-full h-screen flex flex-col gap-4 items-center p-4 relative">
      <Toaster />
      <div className="w-full h-fit px-2 flex items-center gap-4">
        <ModeToggle />
        <div className="w-full flex flex-col">
          <h2 className="font-bold text-2xl">Comandololono</h2>
          <p>ou comandolono se preferir</p>
        </div>
      </div>

      <div className="w-full h-fit flex flex-col items-center gap-2">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          type="text"
          placeholder="Pesquise o comando..."
          className="h-10"
        />
        {
          !isLogged && (
            <button onClick={handleSignInTwitch} className="bg-purple-600 rounded w-full p-2 text-white flex flex-row justify-center items-center gap-4 uppercase font-bold">
              <FaTwitch className="w-6 h-6" /> Entrar com a Twitch
            </button>
          )
        }
      </div>

      {
        filteredItems.length === 0 && (
          <div className="w-full h-fit flex flex-col items-center gap-4 my-10">
            <img className="w-12 h-12" src="/n_funcionou.png" alt="Não funcionou" />
            <p className="w-1/2 text-center">Não foram encontrados audios com esse texto.</p>
          </div>
        )
      }

      <div className="w-full flex flex-1 overflow-auto">
        <div className="grid grid-cols-3 gap-2 w-full">

          {filteredItems.map((item, index) => (
            <Button
              className="w-full"
              variant="outline"
              key={index}
              onClick={() => {
                if (isLogged) {
                  if (sendCommand) {
                    sendCommand(item, 'colonogamer')
                    toast({
                      description: "Comando enviado com sucesso!.",
                    })
                  }
                } else {
                  copyTextToClipboard(item)
                }
              }}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <div className="w-full h-fit flex flex-col gap-2 mt-2">
        <p className="italic text-sm text-center">Ultima atualização dos comandos: 09/04/2024 22:22</p>
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

export default List
