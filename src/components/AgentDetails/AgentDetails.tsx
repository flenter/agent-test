import { useCallback, useEffect, useState } from "react";
import { useAgent } from "./useAgent";
import type { DurableObjectsSuccess } from "@/api/utils";
import { ConnectionStatus } from "./ConnectionStatus";
import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";

function useAgentDB(id: string) {
	return useQuery({
		queryKey: ["agent_db", id],
		queryFn: () =>
			fetch(`/fp-agents/api/agents/${id}/db`).then((res) => res.json()),
	});
}
export function AgentDetails({
	agent: agentDetails,
}: { agent: DurableObjectsSuccess["durableObjects"]["bindings"][0] }) {
	const [_connected, setConnected] = useState(false);
	const agent = useAgent({
		onMessage: (message: WebSocketEventMap["message"]) => {
			if (message.data === JSON.stringify("ACK")) {
				console.log("ACK received");
			}
		},
		agent: agentDetails.name.toLowerCase(),

		onOpen: (event) => {
			console.log("Connection established");
			setConnected(true);
		},
		onClose: () => console.log("Connection closed"),
		onStateUpdate: (state) => console.log("State updated", state),
		onError: (error) => console.error(error),
	});

	const { readyState } = agent;
	const close = useCallback(() => agent.close(), [agent.close]);
	const closeConnection =
		readyState === WebSocket.OPEN ? () => agent.close() : undefined;
	useEffect(() => {
		if (!closeConnection) {
			return;
		}

		return () => {
			closeConnection();
		};
	}, [closeConnection]);

	const { data: db } = useAgentDB(agentDetails.name);

	return (
		<div className="grid gap-2">
			<div className="grid grid-cols-[1fr_auto] items-center border border-muted px-2 rounded-md">
				<h2>{agentDetails.name}</h2>
				<ConnectionStatus readyState={readyState} />
			</div>
			{db ? <pre>{JSON.stringify(db, null, 2)}</pre> : null}
			{/* <div className="grid gap-2 grid-cols-2">
        <Button
          className="cursor-pointer"
          onClick={() => {
            agent.send(JSON.stringify("I want a list user endpoint"));
          }}
        >
          Send
        </Button>
        <Button onClick={() => {
          agent.setState({ messageReceived: "client-side-yes" });
        }}>set state</Button>
        <Button onClick={close}>Close</Button>
      </div> */}
		</div>
	);
}
