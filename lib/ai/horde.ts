export type HordeGenerationOptions = {
  model: string;
  prompt: string;
  size: string;
};

export type HordeGenerationResponse = {
  id: string;
};

export type HordeStatusResponse = {
  finished: number;
  processing: number;
  restarted: number;
  waiting: number;
  done: boolean;
  faulted: boolean;
  wait_time: number;
  queue_position: number;
  kudos: number;
  is_possible: boolean;
  generations?: Array<{
    worker_id: string;
    worker_name: string;
    model: string;
    state: number;
    img: string;
    seed: string;
    id: string;
    censored: boolean;
  }>;
};

const getHordeHeaders = () => {
  const apiKey = process.env.AI_HORDE_API_KEY || "0000000000";
  const clientAgent =
    process.env.AI_HORDE_CLIENT_AGENT || "mAI:1.0.0:mdevlopers";
  return {
    apikey: apiKey,
    "Client-Agent": clientAgent,
    "Content-Type": "application/json",
  };
};

export async function launchHordeGeneration({
  model,
  prompt,
  size,
}: HordeGenerationOptions): Promise<HordeGenerationResponse> {
  const [width, height] = size.split("x").map(Number);
  const actualModel = model.replace("horde/", "");

  const response = await fetch(
    "https://stablehorde.net/api/v2/generate/async",
    {
      method: "POST",
      headers: getHordeHeaders(),
      body: JSON.stringify({
        prompt,
        params: {
          sampler_name: "k_euler",
          cfg_scale: 7,
          width: width || 1024,
          height: height || 1024,
          steps: 30,
          n: 1,
        },
        nsfw: false,
        censor_nsfw: true,
        trusted_workers: false,
        models: [actualModel],
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`AI Horde launch error: ${response.status} ${errorData}`);
  }

  return response.json() as Promise<HordeGenerationResponse>;
}

export async function getHordeGenerationStatus(
  id: string
): Promise<HordeStatusResponse> {
  const response = await fetch(
    `https://stablehorde.net/api/v2/generate/status/${id}`,
    {
      method: "GET",
      headers: getHordeHeaders(),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`AI Horde status error: ${response.status} ${errorData}`);
  }

  return response.json() as Promise<HordeStatusResponse>;
}
