import { useAgent } from "agents-sdk/react"

export function App() {
  const party = useAgent({
    onMessage: (message) => {
      console.log(message);
    },
    agent: "Chat",
    onOpen: () => console.log("Connection established"),
    onClose: () => console.log("Connection closed"),
    onError: (error) => console.error(error),
  });

  console.log('party', party);
  return <div>      hello world
  </div>
}
