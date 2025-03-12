import { useAgent } from "agents-sdk/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";

export function App() {
	const [_connected, setConnected] = useState(false);
	const agent = useAgent({
		onMessage: (message: WebSocketEventMap["message"]) => {
			console.log("message", message);
			if (message.data === JSON.stringify("ACK")) {
				console.log("ACK received");
			}
			// message.target?.send(JSON.stringify('ACK'));
		},
		// agent: 'chat',
		agent: "chat",

		onOpen: (event) => {
			console.log("Connection established");
			setConnected(true);
		},
		onClose: () => console.log("Connection closed"),
		onStateUpdate: (state) => console.log("State updated", state),
		onError: (error) => console.error(error),
	});

	const { readyState } = agent;

	console.log("party", readyState);
	// const ref = useRef(party);
	// const close = useCallback(() => {
	//   console.log('closing')
	//   ref.current.close();
	// }, [ref]);
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

	return (
		<div>
			{" "}
			hello world
			{readyState === WebSocket.CONNECTING && <div>Connecting...</div>}
			{readyState === WebSocket.OPEN && <div>Connected!</div>}
			{readyState === WebSocket.CLOSING && <div>Closing...</div>}
			{readyState === WebSocket.CLOSED && <div>Closed!</div>}
			<div className="grid gap-2 grid-cols-2">
				<Button
					className="cursor-pointer"
					onClick={() => {
						agent.send(JSON.stringify("I want a list user endpoint"));
					}}
				>
					Send
				</Button>
				<Button onClick={close}>Close</Button>
			</div>
		</div>
	);
}
