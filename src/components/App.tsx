import {
	useAgent as useSdkAgent,
	type UseAgentOptions,
} from "agents-sdk/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";

import { useQuery } from "@tanstack/react-query";
import type { DurableObjectsResult, DurableObjectsSuccess } from "@/api/utils";
import { AgentDetails } from "./AgentDetails/AgentDetails";

const unset = Symbol("unset");

function useListAgents() {
	return useQuery<DurableObjectsResult>({
		queryKey: ["list_agents"],
		queryFn: () => fetch("/fp-agents/api/agents").then((res) => res.json()),
	});
}

export function App() {
	const { data, isLoading } = useListAgents();
	console.log("data", data);
	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!data?.success) {
		return <div>Empty</div>;
	}

	return (
		<div className="h-full w-full grid gap-4 grid-cols-[200px_auto]">
			<div className="grid gap-2">
				<h1 className="text-lg px-2">Agents</h1>

				{data.durableObjects.bindings.map((agent) => (
					<AgentDetails key={agent.name} agent={agent} />
				))}
			</div>
		</div>
	);
}

// const

// A component to render any type of state
// It basically just JSON.stringify's the state
function State({ state }: { state: unknown }) {
	return <pre>{JSON.stringify(state, null, 2)}</pre>;
}
